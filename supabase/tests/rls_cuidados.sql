-- Testes de permissão (RLS) dos cuidados em casa. Roda dentro de uma transação e desfaz tudo.
-- Resultado esperado: 'TODOS OS TESTES PASSARAM'.
begin;

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@teste.local', '{"full_name":"Ana"}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bruno@teste.local', '{"full_name":"Bruno"}', now(), now());

-- ===== Ana (tutora) =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into public.pets (id, name, species) values
  ('00000000-0000-0000-0000-00000000aaaa', 'Buddy', 'dog'),
  ('00000000-0000-0000-0000-00000000cccc', 'Mia', 'cat');
insert into public.care_routines (id, pet_id, type, title, times) values
  ('00000000-0000-0000-0000-000000000e01', '00000000-0000-0000-0000-00000000aaaa', 'medication', 'Antialérgico', array['20:00']::time[]),
  ('00000000-0000-0000-0000-000000000e02', '00000000-0000-0000-0000-00000000cccc', 'feeding', 'Ração', array['08:00']::time[]);
insert into public.care_logs (pet_id, routine_id, type, title, slot_date, slot_time)
values ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-000000000e01', 'medication', 'Antialérgico', current_date, '20:00');

do $$ begin
  -- o mesmo horário não pode ser marcado duas vezes (remédio em dobro)
  begin
    insert into public.care_logs (pet_id, routine_id, type, title, slot_date, slot_time)
    values ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-000000000e01', 'medication', 'Antialérgico', current_date, '20:00');
    raise exception 'FALHOU: o mesmo horário foi marcado duas vezes';
  exception when unique_violation then null; end;
  -- rotina de outro pet não pode ser usada
  begin
    insert into public.care_logs (pet_id, routine_id, type, title, slot_date, slot_time)
    values ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-000000000e02', 'feeding', 'Ração', current_date, '08:00');
    raise exception 'FALHOU: registro usou rotina de outro pet';
  exception when insufficient_privilege then null; end;
  -- dias inválidos e lista de horários vazia são recusados
  begin
    insert into public.care_routines (pet_id, type, title, times, days) values ('00000000-0000-0000-0000-00000000aaaa', 'walk', 'Passeio', array['07:00']::time[], array[9]::smallint[]);
    raise exception 'FALHOU: aceitou dia da semana inválido';
  exception when check_violation then null; end;
  begin
    insert into public.care_routines (pet_id, type, title, times) values ('00000000-0000-0000-0000-00000000aaaa', 'walk', 'Passeio', array[]::time[]);
    raise exception 'FALHOU: aceitou rotina sem horário';
  exception when check_violation then null; end;
end $$;

-- ===== Bruno, sem acesso =====
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  if exists (select 1 from public.care_routines) or exists (select 1 from public.care_logs)
  then raise exception 'FALHOU: Bruno viu cuidados de pet que não é dele'; end if;
  begin
    insert into public.care_logs (pet_id, type, title) values ('00000000-0000-0000-0000-00000000aaaa', 'walk', 'Passeio');
    raise exception 'FALHOU: Bruno registrou cuidado sem acesso';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.care_routines (pet_id, type, title, times) values ('00000000-0000-0000-0000-00000000aaaa', 'walk', 'Passeio', array['07:00']::time[]);
    raise exception 'FALHOU: Bruno criou rotina sem acesso';
  exception when insufficient_privilege then null; end;
end $$;
delete from public.care_logs;  -- não apaga nada (não vê nada)

-- ===== Bruno convidado só para ver =====
reset role;
insert into public.pet_members (pet_id, user_id, role, permission, invited_by)
values ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-0000000000b2', 'guest', 'view', '00000000-0000-0000-0000-0000000000a1');
do $$ begin
  if (select count(*) from public.care_logs) <> 1 then raise exception 'FALHOU: Bruno apagou registro sem acesso'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from public.care_logs) <> 1 then raise exception 'FALHOU: convidado não vê os registros do pet'; end if;
  if exists (select 1 from public.care_routines where pet_id = '00000000-0000-0000-0000-00000000cccc')
  then raise exception 'FALHOU: convidado viu rotina de outro pet'; end if;
  begin
    insert into public.care_logs (pet_id, type, title) values ('00000000-0000-0000-0000-00000000aaaa', 'walk', 'Passeio');
    raise exception 'FALHOU: convidado só leitura registrou cuidado';
  exception when insufficient_privilege then null; end;
end $$;
delete from public.care_logs;
update public.care_routines set active = false;
do $$ begin
  if (select count(*) from public.care_logs) <> 1 then raise exception 'FALHOU: convidado só leitura apagou registro'; end if;
  if not (select active from public.care_routines where id = '00000000-0000-0000-0000-000000000e01') then raise exception 'FALHOU: convidado só leitura alterou rotina'; end if;
end $$;

-- ===== Bruno convidado que pode editar =====
reset role;
update public.pet_members set permission = 'edit' where user_id = '00000000-0000-0000-0000-0000000000b2';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
insert into public.care_logs (pet_id, type, title, notes) values ('00000000-0000-0000-0000-00000000aaaa', 'walk', 'Passeio', 'Volta no quarteirão');
do $$ begin
  begin
    insert into public.care_logs (pet_id, type, title, done_by) values ('00000000-0000-0000-0000-00000000aaaa', 'walk', 'Passeio', '00000000-0000-0000-0000-0000000000a1');
    raise exception 'FALHOU: Bruno registrou em nome da Ana';
  exception when insufficient_privilege then null; end;
  if (select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000a1') is distinct from 'Ana'
  then raise exception 'FALHOU: família não vê o nome de quem fez'; end if;
end $$;

-- ===== visitante sem login =====
reset role;
set local role anon;
do $$ begin
  begin
    perform 1 from public.care_logs;
    raise exception 'FALHOU: visitante sem login leu cuidados';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
select 'TODOS OS TESTES PASSARAM' as resultado;
rollback;

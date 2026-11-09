-- Testes de permissão (RLS) da Etapa 2. Roda dentro de uma transação e desfaz tudo no final.
-- Cada verificação levanta erro se a regra falhar. Resultado esperado: 'TODOS OS TESTES PASSARAM'.
begin;

-- duas pessoas de teste
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@teste.local', '{"full_name":"Ana"}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bruno@teste.local', '{"full_name":"Bruno"}', now(), now());

do $$ begin
  if (select count(*) from public.profiles where id in ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b2')) <> 2
  then raise exception 'FALHOU: perfis não foram criados no cadastro'; end if;
end $$;

-- ===== como Ana =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

insert into public.pets (id, name, species) values ('00000000-0000-0000-0000-00000000aaaa', 'Buddy', 'dog');

do $$ begin
  if not exists (select 1 from public.pet_members where pet_id = '00000000-0000-0000-0000-00000000aaaa' and role = 'tutor')
  then raise exception 'FALHOU: Ana não virou tutora do pet que cadastrou'; end if;
  if (select count(*) from public.pets) <> 1 then raise exception 'FALHOU: Ana deveria ver só o próprio pet'; end if;
end $$;

-- Ana não consegue se colocar como membro de outro pet nem cadastrar pet em nome de outra pessoa
do $$ begin
  begin
    insert into public.pets (name, species, created_by) values ('Falso', 'cat', '00000000-0000-0000-0000-0000000000b2');
    raise exception 'FALHOU: Ana cadastrou pet em nome do Bruno';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.pet_members (pet_id, user_id, role) values ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-0000000000b2', 'guest');
    raise exception 'FALHOU: Ana adicionou membro direto, sem convite';
  exception when insufficient_privilege then null; end;
end $$;

-- ===== como Bruno =====
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);

do $$ declare n int; begin
  if (select count(*) from public.pets) <> 0 then raise exception 'FALHOU: Bruno vê o pet da Ana'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'FALHOU: Bruno vê o perfil da Ana'; end if;
  update public.pets set name = 'Hackeado' where id = '00000000-0000-0000-0000-00000000aaaa';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALHOU: Bruno editou o pet da Ana'; end if;
  delete from public.pets where id = '00000000-0000-0000-0000-00000000aaaa';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALHOU: Bruno apagou o pet da Ana'; end if;
  if (select count(*) from public.user_consents) <> 0 then raise exception 'FALHOU: Bruno vê consentimentos alheios'; end if;
end $$;

-- ===== Bruno vira convidado "só visualizar" do Buddy (simula convite aceito) =====
reset role;
insert into public.pet_members (pet_id, user_id, role, permission, invited_by)
values ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-0000000000b2', 'guest', 'view', '00000000-0000-0000-0000-0000000000a1');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);

do $$ declare n int; begin
  if (select count(*) from public.pets) <> 1 then raise exception 'FALHOU: convidado não vê o pet compartilhado'; end if;
  if (select count(*) from public.profiles) <> 2 then raise exception 'FALHOU: convidado não vê o nome da tutora'; end if;
  update public.pets set name = 'Mudado' where id = '00000000-0000-0000-0000-00000000aaaa';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALHOU: convidado "só visualizar" editou o pet'; end if;
  update public.pet_members set permission = 'edit' where user_id = '00000000-0000-0000-0000-0000000000b2';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALHOU: convidado mudou a própria permissão'; end if;
end $$;

-- convidado pode sair do compartilhamento
delete from public.pet_members where user_id = '00000000-0000-0000-0000-0000000000b2';
do $$ begin
  if (select count(*) from public.pets) <> 0 then raise exception 'FALHOU: após sair, convidado ainda vê o pet'; end if;
end $$;

-- ===== visitante sem login =====
reset role;
set local role anon;
do $$ begin
  begin
    perform 1 from public.pets limit 1;
    raise exception 'FALHOU: visitante sem login leu a tabela de pets';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
select 'TODOS OS TESTES PASSARAM' as resultado;
rollback;

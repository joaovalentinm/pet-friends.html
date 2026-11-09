-- Etapa 4 (parte 3): cuidados em casa.
-- care_routines: a rotina (comida 08:00 e 18:00, passeio, remédio...).
-- care_logs: quem fez cada cuidado e quando. Um horário de rotina só pode ser marcado uma vez
-- (evita dar o remédio duas vezes quando duas pessoas tocam ao mesmo tempo).
create type public.care_type as enum ('feeding', 'water', 'walk', 'medication', 'bath', 'hygiene', 'custom');

create table public.care_routines (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  type public.care_type not null,
  title text not null check (char_length(btrim(title)) between 1 and 40),
  times time[] not null check (cardinality(times) between 1 and 12 and array_position(times, null) is null),
  days smallint[] not null default '{}' check (days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),  -- vazio = todos os dias (0 = domingo)
  timezone text not null default 'America/Sao_Paulo' check (char_length(timezone) between 1 and 64),
  active boolean not null default true,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index care_routines_pet_idx on public.care_routines (pet_id);
create index care_routines_created_by_idx on public.care_routines (created_by);
create trigger care_routines_updated_at before update on public.care_routines
  for each row execute function private.set_updated_at();

alter table public.care_routines enable row level security;
create policy "routines_select_members" on public.care_routines for select to authenticated
  using ((select private.is_pet_member(pet_id)));
create policy "routines_insert_editors" on public.care_routines for insert to authenticated
  with check ((select private.can_edit_pet(pet_id)) and created_by = (select auth.uid()));
create policy "routines_update_editors" on public.care_routines for update to authenticated
  using ((select private.can_edit_pet(pet_id))) with check ((select private.can_edit_pet(pet_id)));
create policy "routines_delete_editors" on public.care_routines for delete to authenticated
  using ((select private.can_edit_pet(pet_id)));
revoke all on public.care_routines from anon;
grant select, insert, update, delete on public.care_routines to authenticated;

create table public.care_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  routine_id uuid references public.care_routines (id) on delete set null,
  type public.care_type not null,
  title text not null check (char_length(btrim(title)) between 1 and 40),
  slot_date date,   -- dia e horário da rotina que foi cumprido (vazio = registro avulso)
  slot_time time,
  notes text check (char_length(notes) <= 120),
  done_by uuid default auth.uid() references public.profiles (id) on delete set null,
  done_at timestamptz not null default now(),
  constraint slot_complete check ((slot_date is null) = (slot_time is null))
);
create unique index care_logs_slot_unique on public.care_logs (routine_id, slot_date, slot_time)
  where routine_id is not null and slot_date is not null;
create index care_logs_pet_idx on public.care_logs (pet_id, done_at desc);
create index care_logs_done_at_idx on public.care_logs (done_at desc);
create index care_logs_done_by_idx on public.care_logs (done_by);

alter table public.care_logs enable row level security;
create policy "care_logs_select_members" on public.care_logs for select to authenticated
  using ((select private.is_pet_member(pet_id)));
-- só quem pode editar registra, sempre em nome próprio, e a rotina tem que ser do mesmo pet
create policy "care_logs_insert_editors" on public.care_logs for insert to authenticated
  with check (
    (select private.can_edit_pet(pet_id))
    and done_by = (select auth.uid())
    and (routine_id is null or exists (select 1 from public.care_routines r where r.id = routine_id and r.pet_id = care_logs.pet_id))
  );
-- "desfazer este registro"
create policy "care_logs_delete_editors" on public.care_logs for delete to authenticated
  using ((select private.can_edit_pet(pet_id)));
revoke all on public.care_logs from anon;
grant select, insert, delete on public.care_logs to authenticated;

-- a família vê na hora o que o outro marcou (Realtime respeita o RLS acima)
alter publication supabase_realtime add table public.care_logs, public.care_routines;

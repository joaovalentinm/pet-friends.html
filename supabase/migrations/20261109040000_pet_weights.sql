-- Etapa 4 (parte 1): histórico de peso do pet.
create table public.pet_weights (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  weight_kg numeric(5,2) not null check (weight_kg > 0 and weight_kg < 200),
  measured_on date not null default (now() at time zone 'America/Sao_Paulo')::date check (measured_on <= (now() at time zone 'America/Sao_Paulo')::date + 1),
  recorded_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index pet_weights_pet_idx on public.pet_weights (pet_id, measured_on desc);
create index pet_weights_recorded_by_idx on public.pet_weights (recorded_by);

alter table public.pet_weights enable row level security;
create policy "weights_select_members" on public.pet_weights for select to authenticated
  using ((select private.is_pet_member(pet_id)));
create policy "weights_insert_editors" on public.pet_weights for insert to authenticated
  with check ((select private.can_edit_pet(pet_id)) and recorded_by = (select auth.uid()));
create policy "weights_update_editors" on public.pet_weights for update to authenticated
  using ((select private.can_edit_pet(pet_id))) with check ((select private.can_edit_pet(pet_id)));
create policy "weights_delete_editors" on public.pet_weights for delete to authenticated
  using ((select private.can_edit_pet(pet_id)));
revoke all on public.pet_weights from anon;
grant select, insert, update, delete on public.pet_weights to authenticated;

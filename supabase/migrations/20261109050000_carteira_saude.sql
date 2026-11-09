-- Etapa 4 (parte 2): carteira de saúde + anexos (fotos e PDFs) em pasta privada.
create type public.health_type as enum ('vaccine', 'dewormer', 'flea_tick', 'medication', 'vet_visit', 'exam');

create table public.health_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  type public.health_type not null,
  title text not null check (char_length(btrim(title)) between 1 and 60),
  occurred_on date not null,
  next_due_on date,
  next_done_at timestamptz,           -- a "próxima dose" já foi feita (lembrete concluído)
  next_cancelled_at timestamptz,      -- lembrete da próxima dose cancelado
  lot text check (char_length(lot) <= 40),
  application_form text check (application_form in ('Pipeta', 'Coleira', 'Comprimido', 'Spray')),
  vet_name text check (char_length(vet_name) <= 60),
  crmv text check (char_length(crmv) <= 20),
  notes text check (char_length(notes) <= 400),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint next_after_occurred check (next_due_on is null or next_due_on > occurred_on)
);
create index health_records_pet_idx on public.health_records (pet_id, occurred_on desc);
create index health_records_due_idx on public.health_records (next_due_on) where next_due_on is not null;
create index health_records_created_by_idx on public.health_records (created_by);
create index health_records_updated_by_idx on public.health_records (updated_by);
create trigger health_records_updated_at before update on public.health_records
  for each row execute function private.set_updated_at();

alter table public.health_records enable row level security;
create policy "health_select_members" on public.health_records for select to authenticated
  using ((select private.is_pet_member(pet_id)));
create policy "health_insert_editors" on public.health_records for insert to authenticated
  with check ((select private.can_edit_pet(pet_id)) and created_by = (select auth.uid()));
create policy "health_update_editors" on public.health_records for update to authenticated
  using ((select private.can_edit_pet(pet_id))) with check ((select private.can_edit_pet(pet_id)));
create policy "health_delete_editors" on public.health_records for delete to authenticated
  using ((select private.can_edit_pet(pet_id)));
revoke all on public.health_records from anon;
grant select, insert, update, delete on public.health_records to authenticated;

-- Anexos (foto da carteirinha, receita, resultado de exame)
create table public.health_documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  health_record_id uuid not null references public.health_records (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) <= 120),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 15728640),
  uploaded_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index health_documents_record_idx on public.health_documents (health_record_id);
create index health_documents_pet_idx on public.health_documents (pet_id);
create index health_documents_uploaded_by_idx on public.health_documents (uploaded_by);

alter table public.health_documents enable row level security;
create policy "docs_select_members" on public.health_documents for select to authenticated
  using ((select private.is_pet_member(pet_id)));
create policy "docs_insert_editors" on public.health_documents for insert to authenticated
  with check ((select private.can_edit_pet(pet_id)) and uploaded_by = (select auth.uid()));
create policy "docs_delete_editors" on public.health_documents for delete to authenticated
  using ((select private.can_edit_pet(pet_id)));
revoke all on public.health_documents from anon;
grant select, insert, delete on public.health_documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pet-documents', 'pet-documents', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "pet_docs_select_members" on storage.objects for select to authenticated
  using (bucket_id = 'pet-documents' and (select private.is_pet_member_path(name)));
create policy "pet_docs_insert_editors" on storage.objects for insert to authenticated
  with check (bucket_id = 'pet-documents' and (select private.can_edit_pet_path(name)));
create policy "pet_docs_delete_editors" on storage.objects for delete to authenticated
  using (bucket_id = 'pet-documents' and (select private.can_edit_pet_path(name)));

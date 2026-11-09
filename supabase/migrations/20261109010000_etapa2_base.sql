-- Pet Friends — Etapa 2: base segura (perfis, consentimentos, pets, família, fotos)
-- Regras: RLS em toda tabela; acesso por pet sempre via pet_members;
-- funções privilegiadas no schema "private" (não exposto pela API) com search_path vazio.
-- Tabelas de saúde, cuidados e lembretes entram na Etapa 4, junto das telas.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- ---------- tipos ----------
create type public.species as enum ('dog', 'cat');
create type public.pet_sex as enum ('male', 'female', 'unknown');
create type public.member_role as enum ('tutor', 'guest');
create type public.member_permission as enum ('edit', 'view');

-- ---------- utilitário: updated_at ----------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- perfis (1:1 com auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 80),
  avatar_path text,
  timezone text not null default 'America/Sao_Paulo',
  notification_sound text not null default 'plim'
    check (notification_sound in ('dog', 'cat', 'bird', 'plim')),
  opening_voice boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

-- Cria o perfil automaticamente no cadastro. O nome vem dos metadados do
-- cadastro só para exibição (nunca para permissões).
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), 'Tutor')
  );
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------- consentimentos (LGPD) ----------
create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  document text not null check (document in ('terms', 'privacy')),
  version text not null check (char_length(version) between 1 and 20),
  accepted_at timestamptz not null default now(),
  unique (user_id, document, version)
);

-- ---------- pets ----------
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 30),
  species public.species not null,
  sex public.pet_sex not null default 'unknown',
  breed text check (char_length(breed) <= 40),
  coat text check (char_length(coat) <= 40),
  birth_date date check (birth_date <= current_date),
  microchip text check (char_length(microchip) <= 30),
  chip_site text check (char_length(chip_site) <= 40),
  photo_path text,
  allergies text check (char_length(allergies) <= 150),
  chronic_conditions text check (char_length(chronic_conditions) <= 150),
  notes text check (char_length(notes) <= 300),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pets_created_by_idx on public.pets (created_by);
create trigger pets_updated_at before update on public.pets
  for each row execute function private.set_updated_at();

-- ---------- família (quem acessa cada pet) ----------
create table public.pet_members (
  pet_id uuid not null references public.pets (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null,
  permission public.member_permission not null default 'edit',
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (pet_id, user_id),
  -- o tutor sempre pode editar
  constraint tutor_can_edit check (role = 'guest' or permission = 'edit')
);
create index pet_members_user_id_idx on public.pet_members (user_id);
create index pet_members_invited_by_idx on public.pet_members (invited_by);

-- Quem cadastra o pet vira o tutor automaticamente.
create or replace function private.add_creator_as_tutor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.pet_members (pet_id, user_id, role, permission)
  values (new.id, new.created_by, 'tutor', 'edit');
  return new;
end;
$$;
revoke all on function private.add_creator_as_tutor() from public, anon, authenticated;
create trigger pets_add_creator_as_tutor after insert on public.pets
  for each row execute function private.add_creator_as_tutor();

-- ---------- funções de permissão (usadas pelas regras de acesso) ----------
create or replace function private.is_pet_member(p_pet uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pet_members m
    where m.pet_id = p_pet and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_edit_pet(p_pet uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pet_members m
    where m.pet_id = p_pet and m.user_id = (select auth.uid()) and m.permission = 'edit'
  );
$$;

create or replace function private.is_pet_tutor(p_pet uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pet_members m
    where m.pet_id = p_pet and m.user_id = (select auth.uid()) and m.role = 'tutor'
  );
$$;

-- Duas pessoas cuidam de pelo menos um pet em comum? (para ver o nome uma da outra)
create or replace function private.shares_pet_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.pet_members mine
    join public.pet_members theirs on theirs.pet_id = mine.pet_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user
  );
$$;

-- Versões por caminho de arquivo: "{pet_id}/arquivo.jpg"
create or replace function private.is_pet_member_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pet_members m
    where m.pet_id::text = split_part(p_name, '/', 1) and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_edit_pet_path(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pet_members m
    where m.pet_id::text = split_part(p_name, '/', 1)
      and m.user_id = (select auth.uid()) and m.permission = 'edit'
  );
$$;

revoke all on function private.is_pet_member(uuid), private.can_edit_pet(uuid), private.is_pet_tutor(uuid),
  private.shares_pet_with(uuid), private.is_pet_member_path(text), private.can_edit_pet_path(text)
  from public, anon;
grant execute on function private.is_pet_member(uuid), private.can_edit_pet(uuid), private.is_pet_tutor(uuid),
  private.shares_pet_with(uuid), private.is_pet_member_path(text), private.can_edit_pet_path(text)
  to authenticated;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.user_consents enable row level security;
alter table public.pets enable row level security;
alter table public.pet_members enable row level security;

-- perfis: vejo o meu e o de quem cuida de um pet comigo; edito só o meu
create policy "profiles_select_self_or_family" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.shares_pet_with(id)));
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- consentimentos: só os meus
create policy "consents_select_own" on public.user_consents for select to authenticated
  using (user_id = (select auth.uid()));
create policy "consents_insert_own" on public.user_consents for insert to authenticated
  with check (user_id = (select auth.uid()));

-- pets
create policy "pets_select_members" on public.pets for select to authenticated
  using ((select private.is_pet_member(id)) or created_by = (select auth.uid()));
create policy "pets_insert_self" on public.pets for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "pets_update_editors" on public.pets for update to authenticated
  using ((select private.can_edit_pet(id))) with check ((select private.can_edit_pet(id)));
create policy "pets_delete_tutor" on public.pets for delete to authenticated
  using ((select private.is_pet_tutor(id)));

-- família: membros veem a lista; tutor muda permissão e remove convidados; convidado pode sair
create policy "members_select_family" on public.pet_members for select to authenticated
  using ((select private.is_pet_member(pet_id)));
create policy "members_update_tutor" on public.pet_members for update to authenticated
  using ((select private.is_pet_tutor(pet_id)) and role = 'guest')
  with check ((select private.is_pet_tutor(pet_id)) and role = 'guest');
create policy "members_delete_tutor_or_self" on public.pet_members for delete to authenticated
  using (role = 'guest' and ((select private.is_pet_tutor(pet_id)) or user_id = (select auth.uid())));
-- Entrada de convidados: só pela função de aceitar convite (Etapa 5), nunca direto.

-- ---------- permissões da API ----------
revoke all on public.profiles, public.user_consents, public.pets, public.pet_members from anon;
grant select, update on public.profiles to authenticated;
grant select, insert on public.user_consents to authenticated;
grant select, insert, update, delete on public.pets to authenticated;
grant select, update, delete on public.pet_members to authenticated;

-- ---------- fotos do pet (pasta privada) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pet-photos', 'pet-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "pet_photos_select_members" on storage.objects for select to authenticated
  using (bucket_id = 'pet-photos' and (select private.is_pet_member_path(name)));
create policy "pet_photos_insert_editors" on storage.objects for insert to authenticated
  with check (bucket_id = 'pet-photos' and (select private.can_edit_pet_path(name)));
create policy "pet_photos_update_editors" on storage.objects for update to authenticated
  using (bucket_id = 'pet-photos' and (select private.can_edit_pet_path(name)))
  with check (bucket_id = 'pet-photos' and (select private.can_edit_pet_path(name)));
create policy "pet_photos_delete_editors" on storage.objects for delete to authenticated
  using (bucket_id = 'pet-photos' and (select private.can_edit_pet_path(name)));

-- Pet Friends — métricas de uso (quantos usuários e quanto tempo usam o app).
-- Guarda só MINUTOS POR DIA por pessoa (sem registrar o que ela faz). Informado na Política de Privacidade.

-- Quem pode ver o Painel de métricas (dono do app). Fica no schema privado, fora da API.
create table private.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on private.admins from public, anon, authenticated;

-- Tempo de uso por pessoa por dia (fuso de São Paulo)
create table public.app_usage (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  day date not null default (now() at time zone 'America/Sao_Paulo')::date,
  seconds integer not null default 0 check (seconds between 0 and 86400),
  primary key (user_id, day)
);
create index app_usage_day_idx on public.app_usage (day);

alter table public.app_usage enable row level security;
create policy "usage_select_own" on public.app_usage for select to authenticated
  using (user_id = (select auth.uid()));
create policy "usage_insert_own" on public.app_usage for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "usage_update_own" on public.app_usage for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.app_usage from anon;
grant select, insert, update on public.app_usage to authenticated;

-- O app chama a cada minuto de uso. Roda com as permissões de quem chama (RLS vale).
-- Cada chamada soma no máximo 2 minutos, para não aceitar números falsos.
create or replace function public.track_usage(p_seconds integer)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.app_usage (user_id, day, seconds)
  values ((select auth.uid()), (now() at time zone 'America/Sao_Paulo')::date, least(greatest(p_seconds, 0), 120))
  on conflict (user_id, day)
  do update set seconds = least(public.app_usage.seconds + excluded.seconds, 86400);
$$;
revoke all on function public.track_usage(integer) from public, anon;
grant execute on function public.track_usage(integer) to authenticated;

-- A pessoa logada é administradora?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Números do Painel. Só responde para administradores (checagem dentro da função).
-- Devolve só totais e médias: nenhum nome, e-mail ou dado de pet.
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  result jsonb;
begin
  if not exists (select 1 from private.admins a where a.user_id = (select auth.uid())) then
    raise exception 'acesso negado' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total_users', (select count(*) from auth.users),
    'new_users_7d', (select count(*) from auth.users where created_at >= now() - interval '7 days'),
    'active_users_7d', (select count(distinct user_id) from public.app_usage where day > today - 7),
    'minutes_7d', (select coalesce(round(sum(seconds) / 60.0), 0) from public.app_usage where day > today - 7),
    'avg_minutes_per_active_7d', (
      select coalesce(round(avg(t) / 60.0, 1), 0)
      from (select sum(seconds) as t from public.app_usage where day > today - 7 group by user_id) s
    ),
    'pets_total', (select count(*) from public.pets where archived_at is null),
    'weeks', (
      select coalesce(jsonb_agg(w order by w ->> 'week_start'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'week_start', to_char(ws, 'YYYY-MM-DD'),
          'active_users', (select count(distinct user_id) from public.app_usage u where u.day >= ws and u.day < ws + 7),
          'minutes', (select coalesce(round(sum(seconds) / 60.0), 0) from public.app_usage u where u.day >= ws and u.day < ws + 7),
          'new_users', (select count(*) from auth.users au where (au.created_at at time zone 'America/Sao_Paulo')::date >= ws
                         and (au.created_at at time zone 'America/Sao_Paulo')::date < ws + 7)
        ) as w
        from generate_series(date_trunc('week', today::timestamp)::date - 49, date_trunc('week', today::timestamp)::date, interval '7 days') as g(ws_ts)
        cross join lateral (select g.ws_ts::date as ws) x
      ) weeks
    )
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

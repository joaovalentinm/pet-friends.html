-- =====================================================================
-- JOÃO CONTENT INTELLIGENCE — schema principal
-- Princípios:
--   * Toda métrica tem origem (source_id) e data de coleta (collected_at).
--   * Métricas históricas são append-only (nunca sobrescritas).
--   * Cada campo de métrica tem qualidade: observado | estimado | indisponivel.
--   * Deduplicação por chaves naturais (plataforma + id externo, hash de roteiro).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type platform as enum ('instagram', 'tiktok', 'youtube', 'web');
create type creator_status as enum (
  'pendente_validacao', 'validado', 'abaixo_minimo', 'nao_encontrado', 'sugerido', 'removido'
);
create type metric_quality as enum ('observado', 'estimado', 'indisponivel');
create type source_status as enum ('ok', 'erro', 'nao_configurado', 'desativado', 'nao_verificado');
create type run_status as enum ('executando', 'concluido', 'parcial', 'falhou');
create type run_trigger as enum ('agendado', 'manual');
create type viral_class as enum (
  'viral_confirmado', 'muito_acima_media', 'crescimento_acelerado', 'trend_emergente', 'estrategico', 'abaixo_do_criterio'
);
create type trend_status as enum ('emergente', 'em_crescimento', 'em_alta', 'saturada');
create type script_status as enum ('rascunho', 'pronto', 'gravado', 'publicado', 'arquivado');
create type log_level as enum ('debug', 'info', 'warn', 'error');

-- ---------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function forbid_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'Tabela % é append-only: histórico não pode ser alterado nem apagado', tg_table_name;
end $$;

-- ---------------------------------------------------------------------
-- Usuários (perfil de aplicação ligado ao auth.users do Supabase)
-- ---------------------------------------------------------------------
create table app_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text,
  role text not null default 'owner' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now()
);

create or replace function is_app_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_users where id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Configurações (chave/valor)
-- ---------------------------------------------------------------------
create table settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);
create trigger settings_updated before update on settings for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Categorias e criadores (Radar de Referências)
-- ---------------------------------------------------------------------
create table categories (
  id text primary key,
  name text not null,
  description text,
  sort_order int not null default 0
);

create table creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'pessoa' check (kind in ('pessoa', 'empresa')),
  category_id text not null references categories (id),
  instagram_handle text,
  instagram_url text generated always as (
    case when instagram_handle is null then null
         else 'https://www.instagram.com/' || instagram_handle || '/' end
  ) stored,
  youtube_handle text,
  youtube_channel_id text,
  tiktok_handle text,
  status creator_status not null default 'pendente_validacao',
  -- seguidores do Instagram: só preenchido com fonte verificável
  followers_count bigint check (followers_count is null or followers_count >= 0),
  followers_source text,
  followers_checked_at timestamptz,
  validation_note text,
  priority int not null default 0,
  study_focus text[] not null default '{}',
  classification_note text,
  notes text,
  monitoring_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instagram_handle_format check (instagram_handle is null or instagram_handle ~ '^[a-z0-9._]{1,30}$')
);
create unique index creators_instagram_handle_uq on creators (instagram_handle) where instagram_handle is not null;
create unique index creators_youtube_channel_uq on creators (youtube_channel_id) where youtube_channel_id is not null;
create index creators_category_idx on creators (category_id);
create trigger creators_updated before update on creators for each row execute function set_updated_at();

create table creator_follower_snapshots (
  id bigint generated always as identity primary key,
  creator_id uuid not null references creators (id) on delete cascade,
  platform platform not null,
  followers bigint not null,
  source_id text not null,
  collected_at timestamptz not null default now()
);
create index cfs_creator_idx on creator_follower_snapshots (creator_id, collected_at desc);
create trigger cfs_append_only before update or delete on creator_follower_snapshots
  for each row when (pg_trigger_depth() = 0) execute function forbid_mutation();

create table creator_suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform platform not null,
  handle text not null,
  url text,
  followers bigint,
  followers_quality metric_quality not null default 'indisponivel',
  followers_source text,
  reason text not null,
  evidence jsonb not null default '[]',
  status text not null default 'pendente' check (status in ('pendente', 'aceito', 'rejeitado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, handle)
);
create trigger creator_suggestions_updated before update on creator_suggestions for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Fontes de dados e coletas
-- ---------------------------------------------------------------------
create table sources (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('video', 'perfil', 'noticias', 'metricas_proprias', 'transcricao', 'ia', 'notificacao')),
  enabled boolean not null default true,
  last_status source_status not null default 'nao_verificado',
  last_checked_at timestamptz,
  last_error text,
  missing_requirements text[] not null default '{}',
  notes text
);

create table daily_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null,
  trigger run_trigger not null,
  status run_status not null default 'executando',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stages jsonb not null default '[]',
  stats jsonb not null default '{}',
  unavailable_sources jsonb not null default '[]',
  error text,
  requested_by uuid references app_users (id)
);
-- Apenas uma execução ativa por vez (trava de concorrência)
create unique index daily_runs_single_active on daily_runs ((true)) where status = 'executando';
create index daily_runs_date_idx on daily_runs (run_date desc, started_at desc);

create table source_collections (
  id bigint generated always as identity primary key,
  run_id uuid references daily_runs (id) on delete set null,
  source_id text not null references sources (id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status source_status not null,
  items_found int not null default 0,
  error text,
  details jsonb not null default '{}'
);
create index source_collections_run_idx on source_collections (run_id);

-- ---------------------------------------------------------------------
-- Vídeos e métricas
-- ---------------------------------------------------------------------
create table videos (
  id uuid primary key default gen_random_uuid(),
  platform platform not null,
  external_id text not null,
  url text not null,
  creator_id uuid references creators (id) on delete set null,
  channel_external_id text,
  channel_name text,
  channel_handle text,
  title text,
  description text,
  published_at timestamptz,
  duration_seconds int,
  thumbnail_url text,
  language text,
  topic_tags text[] not null default '{}',
  content_format text,
  discovered_via text not null default 'radar_geral' check (discovered_via in ('radar_geral', 'criador_monitorado', 'manual')),
  search_query text,
  source_id text not null references sources (id),
  first_seen_at timestamptz not null default now(),
  last_collected_at timestamptz not null default now(),
  raw jsonb not null default '{}',
  unique (platform, external_id)
);
create index videos_published_idx on videos (published_at desc);
create index videos_channel_idx on videos (platform, channel_external_id);
create index videos_creator_idx on videos (creator_id);

create table video_metrics (
  id bigint generated always as identity primary key,
  video_id uuid not null references videos (id) on delete cascade,
  collected_at timestamptz not null default now(),
  source_id text not null references sources (id),
  views bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  channel_followers bigint,
  quality jsonb not null default '{}'  -- ex: {"views":"observado","shares":"indisponivel"}
);
create index video_metrics_video_idx on video_metrics (video_id, collected_at desc);
create trigger video_metrics_append_only before update or delete on video_metrics
  for each row when (pg_trigger_depth() = 0) execute function forbid_mutation();

create view video_latest_metrics as
  select distinct on (video_id) *
  from video_metrics
  order by video_id, collected_at desc;

create table channel_baselines (
  id bigint generated always as identity primary key,
  platform platform not null,
  channel_external_id text not null,
  computed_at timestamptz not null default now(),
  sample_size int not null,
  median_views numeric,
  mean_views numeric,
  median_engagement numeric,
  method text not null,
  source_id text not null references sources (id)
);
create index channel_baselines_idx on channel_baselines (platform, channel_external_id, computed_at desc);

create table viral_scores (
  id bigint generated always as identity primary key,
  video_id uuid not null references videos (id) on delete cascade,
  run_id uuid references daily_runs (id) on delete set null,
  computed_at timestamptz not null default now(),
  viral_index numeric,          -- views / mediana do criador
  velocity_per_hour numeric,
  engagement_rate numeric,
  age_hours numeric,
  relevance numeric,
  score numeric not null,       -- 0..100 composto
  classification viral_class not null,
  quality metric_quality not null,
  explanation jsonb not null default '{}'
);
create index viral_scores_run_idx on viral_scores (run_id, score desc);
create index viral_scores_video_idx on viral_scores (video_id, computed_at desc);

-- ---------------------------------------------------------------------
-- Transcrições e análises
-- ---------------------------------------------------------------------
create table transcripts (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos (id) on delete cascade,
  source text not null check (source in ('manual', 'assemblyai', 'legenda_autorizada')),
  language text,
  text text not null,
  created_at timestamptz not null default now(),
  created_by uuid references app_users (id),
  unique (video_id, source)
);

create table analyses (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos (id) on delete cascade,
  run_id uuid references daily_runs (id) on delete set null,
  kind text not null check (kind in ('engenharia_reversa', 'top10_item')),
  model text not null,
  input_hash text not null,
  inputs_used jsonb not null default '{}',  -- quais insumos estavam disponíveis (título, thumb, transcrição...)
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique (kind, input_hash)
);
create index analyses_video_idx on analyses (video_id, created_at desc);

-- ---------------------------------------------------------------------
-- Top 10 diário, relatório e tendências
-- ---------------------------------------------------------------------
create table daily_top10 (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references daily_runs (id) on delete cascade,
  run_date date not null,
  rank int not null check (rank between 1 and 10),
  video_id uuid not null references videos (id) on delete cascade,
  viral_score_id bigint references viral_scores (id),
  subject text,
  hook text,
  content_format text,
  selection_reason text,
  adaptation_potential text,
  adaptation_score int check (adaptation_score between 0 and 100),
  evidence_note text,
  unique (run_id, rank),
  unique (run_id, video_id)
);
create index daily_top10_date_idx on daily_top10 (run_date desc);

create table run_reports (
  run_id uuid primary key references daily_runs (id) on delete cascade,
  run_date date not null,
  strategic_analysis jsonb not null,
  found_count int not null,
  limitation_note text,
  created_at timestamptz not null default now()
);

create table trends (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references daily_runs (id) on delete cascade,
  run_date date not null,
  slug text not null,
  title text not null,
  status trend_status not null,
  signal_type text not null check (signal_type in ('assunto', 'audio', 'formato', 'gancho', 'noticia', 'ferramenta', 'tema_engajamento')),
  what_is_happening text not null,
  why_people_consume text not null,
  working_format text not null,
  adaptation text not null,
  record_now boolean not null default false,
  record_now_reason text,
  identity_fit int check (identity_fit between 0 and 100),
  growth jsonb not null default '{}',
  evidence_video_ids uuid[] not null default '{}',
  evidence_links jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (run_date, slug)
);

-- ---------------------------------------------------------------------
-- Ideias e roteiros
-- ---------------------------------------------------------------------
create table ideas (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references daily_runs (id) on delete set null,
  run_date date not null,
  slot int not null check (slot between 1 and 5),
  editorial_pillar text not null,
  pillar_override_reason text,
  reference_video_id uuid references videos (id) on delete set null,
  trend_id uuid references trends (id) on delete set null,
  subject text not null,
  angle text not null,
  audience text not null,
  pain_or_curiosity text not null,
  why_for_joao text not null,
  viral_mechanism text not null,
  reference_snapshot jsonb not null default '{}', -- métricas da referência no momento da escolha
  score_total int not null check (score_total between 0 and 100),
  score_breakdown jsonb not null,
  score_justification text not null,
  dedupe_key text not null unique,
  created_at timestamptz not null default now()
);
create index ideas_date_idx on ideas (run_date desc, slot);

create table scripts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references ideas (id) on delete set null,
  reference_video_id uuid references videos (id) on delete set null,
  run_date date not null,
  headline text not null,
  hook text not null,
  full_script text not null,
  development text not null,
  examples jsonb not null default '[]',
  scenes jsonb not null default '[]',
  on_screen_text jsonb not null default '[]',
  editing_notes text not null,
  cta text not null,
  duration_seconds int not null,
  recording_direction jsonb not null default '{}',
  theme text,
  content_format text,
  status script_status not null default 'pronto',
  favorite boolean not null default false,
  saved boolean not null default false,
  version int not null default 1,
  content_hash text not null unique,
  recorded_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index scripts_date_idx on scripts (run_date desc);
create index scripts_status_idx on scripts (status);
create trigger scripts_updated before update on scripts for each row execute function set_updated_at();

create table script_revisions (
  id bigint generated always as identity primary key,
  script_id uuid not null references scripts (id) on delete cascade,
  version int not null,
  snapshot jsonb not null,
  edited_by uuid references app_users (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Publicações próprias e resultados
-- ---------------------------------------------------------------------
create table own_publications (
  id uuid primary key default gen_random_uuid(),
  platform platform not null default 'instagram',
  external_id text,
  permalink text,
  published_at timestamptz not null,
  caption text,
  media_type text,
  script_id uuid references scripts (id) on delete set null,
  theme text,
  reference_creator_id uuid references creators (id) on delete set null,
  content_format text,
  hook text,
  source text not null check (source in ('meta_api', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index own_publications_ext_uq on own_publications (platform, external_id) where external_id is not null;
create trigger own_publications_updated before update on own_publications for each row execute function set_updated_at();

create table own_publication_metrics (
  id bigint generated always as identity primary key,
  publication_id uuid not null references own_publications (id) on delete cascade,
  collected_at timestamptz not null default now(),
  source text not null check (source in ('meta_api', 'manual')),
  views bigint,
  reach bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  follows bigint,
  avg_watch_time_ms bigint,
  total_watch_time_ms bigint,
  quality jsonb not null default '{}'
);
create index opm_pub_idx on own_publication_metrics (publication_id, collected_at desc);
create trigger opm_append_only before update or delete on own_publication_metrics
  for each row when (pg_trigger_depth() = 0) execute function forbid_mutation();

create view own_publication_latest_metrics as
  select distinct on (publication_id) *
  from own_publication_metrics
  order by publication_id, collected_at desc;

create table performance_insights (
  id uuid primary key default gen_random_uuid(),
  computed_at timestamptz not null default now(),
  sample_size int not null,
  aggregates jsonb not null,
  insights jsonb,
  model text
);

-- ---------------------------------------------------------------------
-- Custos de IA e logs
-- ---------------------------------------------------------------------
create table ai_usage (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  run_id uuid references daily_runs (id) on delete set null,
  purpose text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_read_tokens int not null default 0,
  cache_write_tokens int not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  stop_reason text
);
create index ai_usage_created_idx on ai_usage (created_at desc);

create table logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  run_id uuid references daily_runs (id) on delete set null,
  level log_level not null,
  scope text not null,
  message text not null,
  context jsonb not null default '{}'
);
create index logs_created_idx on logs (created_at desc);
create index logs_run_idx on logs (run_id);

-- ---------------------------------------------------------------------
-- RLS: somente membros da aplicação acessam; o service role (backend/cron) ignora RLS.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'settings','categories','creators','creator_follower_snapshots','creator_suggestions','sources',
    'daily_runs','source_collections','videos','video_metrics','channel_baselines','viral_scores',
    'transcripts','analyses','daily_top10','run_reports','trends','ideas','scripts','script_revisions',
    'own_publications','own_publication_metrics','performance_insights','ai_usage','logs'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for all to authenticated using (is_app_member()) with check (is_app_member())', t || '_members', t);
  end loop;
end $$;

alter table app_users enable row level security;
create policy app_users_self on app_users for select to authenticated using (id = auth.uid());

-- views herdam permissões do invocador
alter view video_latest_metrics set (security_invoker = true);
alter view own_publication_latest_metrics set (security_invoker = true);

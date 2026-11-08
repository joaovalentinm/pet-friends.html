-- =====================================================================
-- Permissões explícitas para a Data API do Supabase.
-- anon (não autenticado): sem acesso a nada.
-- authenticated: acesso às tabelas, filtrado pelas políticas RLS (is_app_member()).
-- service_role (servidor/cron): acesso total (ignora RLS).
-- =====================================================================

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- funções: fixa search_path e limita quem pode executar
alter function set_updated_at() set search_path = public;
alter function forbid_mutation() set search_path = public;

revoke execute on function is_app_member() from public, anon;
grant execute on function is_app_member() to authenticated, service_role;

#!/usr/bin/env bash
# Aplica as migrações num Postgres local com um schema "auth" simulado
# (o Supabase fornece auth.users, auth.uid() e o papel authenticated).
set -euo pipefail
DB="${TEST_DB:-jci_migration_test}"
PSQL="psql -v ON_ERROR_STOP=1 -q"
$PSQL -d postgres -c "drop database if exists $DB" -c "create database $DB"
$PSQL -d "$DB" <<'SQL'
do $$ begin
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
end $$;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
SQL
for f in supabase/migrations/*.sql; do
  echo "→ aplicando $f"
  $PSQL -d "$DB" -f "$f"
done
$PSQL -d "$DB" -f tests/db/assertions.sql
echo "✔ migrações e asserções OK"

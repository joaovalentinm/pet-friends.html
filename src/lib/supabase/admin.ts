import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let cached: SupabaseClient | null = null;

/**
 * Cliente com service role — ignora RLS. Uso exclusivo no servidor
 * (rotina diária, cron, ações já autorizadas por requireUser()).
 */
export function adminClient(): SupabaseClient {
  if (cached) return cached;
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }
  cached = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';

/** Cliente único do Supabase. Só a chave pública (publishable) fica no site. */
export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Endereço do site para onde os links de e-mail devem voltar (funciona em qualquer domínio). */
export function siteUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

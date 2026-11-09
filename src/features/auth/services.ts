import type { AuthError } from '@supabase/supabase-js';

import { siteUrl, supabase } from '@/services/supabase';
import type { LoginInput, SignupInput } from './schemas';

/** Versão dos Termos e da Política aceitos no cadastro. */
export const TERMS_VERSION = '0.2';

/** Traduz erros do Supabase para mensagens claras em português. */
export function authErrorMessage(error: AuthError | Error | null | undefined): string {
  if (!error) return '';
  const code = 'code' in error ? error.code : undefined;
  const msg = error.message.toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (code === 'email_not_confirmed' || msg.includes('not confirmed')) return 'Falta confirmar seu e-mail. Abra o link que enviamos e depois entre de novo.';
  if (code === 'user_already_exists' || msg.includes('already registered')) return 'Já existe uma conta com este e-mail. Toque em "Entrar" ou em "Esqueci minha senha".';
  if (code === 'email_address_not_authorized' || msg.includes('not authorized')) return 'Ainda não conseguimos enviar e-mail para este endereço. O cadastro aberto ao público será liberado em breve.';
  if (code === 'weak_password' || msg.includes('password')) return 'Essa senha é fraca. Use 8 ou mais caracteres, com letras e números.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || msg.includes('rate limit')) return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.';
  if (msg.includes('fetch') || msg.includes('network')) return 'Sem conexão com a internet. Confira e tente de novo.';
  return 'Não foi possível concluir agora. Tente de novo em instantes.';
}

export async function signIn({ email, password }: LoginInput) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp({ fullName, email, password }: SignupInput) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: siteUrl(),
      // nome só para exibição; a versão aceita é gravada em user_consents no primeiro acesso
      data: { full_name: fullName, terms_version: TERMS_VERSION },
    },
  });
}

export async function sendPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo: siteUrl() });
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: siteUrl() } });
}

/** Grava o aceite dos Termos e da Política (LGPD) se ainda não estiver registrado. */
export async function ensureConsents(userId: string, version: string) {
  const { data } = await supabase.from('user_consents').select('document').eq('user_id', userId).eq('version', version);
  const have = new Set((data ?? []).map((r: { document: string }) => r.document));
  const missing = (['terms', 'privacy'] as const).filter((d) => !have.has(d));
  if (missing.length) {
    await supabase.from('user_consents').insert(missing.map((document) => ({ user_id: userId, document, version })));
  }
}

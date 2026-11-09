import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { ensureConsents } from '@/features/auth/services';
import { startUsageTracking, stopUsageTracking } from '@/features/usage/tracker';
import { supabase } from '@/services/supabase';

type AuthState = {
  /** true até descobrirmos se há alguém logado neste aparelho */
  loading: boolean;
  session: Session | null;
  /** a pessoa abriu o link de "esqueci minha senha" e precisa criar a nova */
  recovery: boolean;
  setRecovery: (v: boolean) => void;
};

export const useAuth = create<AuthState>((set) => ({
  loading: true,
  session: null,
  recovery: false,
  setRecovery: (recovery) => set({ recovery }),
}));

let started = false;

/** Liga a sessão do Supabase ao app (chamado uma vez ao abrir). */
export function startAuth() {
  if (started) return;
  started = true;
  supabase.auth.getSession().then(({ data }) => {
    useAuth.setState({ session: data.session, loading: false });
    if (data.session) startUsageTracking();
  });
  supabase.auth.onAuthStateChange((event, session) => {
    useAuth.setState({ session, loading: false, ...(event === 'PASSWORD_RECOVERY' ? { recovery: true } : {}) });
    if (event === 'SIGNED_IN') startUsageTracking();
    if (event === 'SIGNED_OUT') stopUsageTracking();
    const version = session?.user.user_metadata?.terms_version;
    if (event === 'SIGNED_IN' && session && typeof version === 'string') {
      // fora do callback para não travar o Supabase
      setTimeout(() => void ensureConsents(session.user.id, version), 0);
    }
  });
}

/** Primeiro nome para a saudação. */
export function firstName(session: Session | null): string {
  const full = session?.user.user_metadata?.full_name;
  const name = typeof full === 'string' && full.trim() ? full.trim() : (session?.user.email ?? '').split('@')[0] ?? '';
  return name.split(/\s+/)[0] ?? '';
}

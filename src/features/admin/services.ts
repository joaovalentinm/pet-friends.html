import { z } from 'zod';

import { supabase } from '@/services/supabase';

const statsSchema = z.object({
  total_users: z.number(),
  new_users_7d: z.number(),
  active_users_7d: z.number(),
  minutes_7d: z.number(),
  avg_minutes_per_active_7d: z.number(),
  pets_total: z.number(),
  weeks: z.array(z.object({ week_start: z.string(), active_users: z.number(), minutes: z.number(), new_users: z.number() })),
});
export type AdminStats = z.infer<typeof statsSchema>;

/** A pessoa logada é administradora do Pet Friends? */
export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

/** Totais de uso para o Painel (o banco recusa quem não é administrador). */
export async function fetchAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc('admin_stats');
  if (error) throw error;
  return statsSchema.parse(data);
}

const UNLOCK_KEY = 'pf.painel.unlockedAt';
const UNLOCK_MINUTES = 15;

/** O Painel foi destravado com a senha há menos de 15 minutos, nesta aba? */
export function isPanelUnlocked(): boolean {
  try {
    const at = Number(sessionStorage.getItem(UNLOCK_KEY) ?? 0);
    return at > 0 && Date.now() - at < UNLOCK_MINUTES * 60 * 1000;
  } catch {
    return false;
  }
}

/** Confere a senha da conta logada (o dono) antes de abrir o Painel. */
export async function confirmOwnerPassword(password: string): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email || !password) return false;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return false;
  try {
    sessionStorage.setItem(UNLOCK_KEY, String(Date.now()));
  } catch {
    /* sem armazenamento: pede a senha de novo da próxima vez */
  }
  return true;
}

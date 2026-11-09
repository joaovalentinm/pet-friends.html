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

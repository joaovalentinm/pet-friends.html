import { supabase } from '@/services/supabase';
import type { Tables } from '@/types/database';
import { todayIso } from '@/utils/format';
import { CARE, type CareType } from './constants';
import { startOfToday } from './logic';
import type { RoutineInput } from './schemas';

export type Routine = Tables<'care_routines'>;
export type CareLog = Tables<'care_logs'> & { done_by_profile: { full_name: string } | null };

/** Outra pessoa já marcou este horário (evita remédio em dobro). */
export class AlreadyDoneError extends Error {}

const LOG_SELECT = '*, done_by_profile:profiles!care_logs_done_by_fkey(full_name)';

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
}

function toRow(input: RoutineInput) {
  return {
    type: input.type,
    title: input.title.trim(),
    times: [...new Set(input.times)].sort(),
    days: input.days.length === 7 ? [] : [...input.days].sort((a, b) => a - b),
    active: input.active,
  };
}

export async function listRoutines(): Promise<Routine[]> {
  const { data, error } = await supabase.from('care_routines').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createRoutine(petId: string, input: RoutineInput, userId: string): Promise<Routine> {
  const { data, error } = await supabase
    .from('care_routines')
    .insert({ ...toRow(input), pet_id: petId, created_by: userId, timezone: deviceTimezone() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRoutine(id: string, input: RoutineInput): Promise<void> {
  const { error } = await supabase.from('care_routines').update(toRow(input)).eq('id', id);
  if (error) throw error;
}

export async function deleteRoutine(id: string): Promise<void> {
  const { error } = await supabase.from('care_routines').delete().eq('id', id);
  if (error) throw error;
}

/** Cuidados de hoje de todos os pets (registrados hoje ou que cumprem um horário de hoje). */
export async function listTodayLogs(): Promise<CareLog[]> {
  const { data, error } = await supabase
    .from('care_logs')
    .select(LOG_SELECT)
    .or(`done_at.gte.${startOfToday()},slot_date.eq.${todayIso()}`)
    .order('done_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CareLog[];
}

/** Últimos cuidados de um pet (histórico no perfil). */
export async function listPetLogs(petId: string): Promise<CareLog[]> {
  const { data, error } = await supabase.from('care_logs').select(LOG_SELECT).eq('pet_id', petId).order('done_at', { ascending: false }).limit(20);
  if (error) throw error;
  return (data ?? []) as CareLog[];
}

type NewLog = { petId: string; type: CareType; title?: string; routineId?: string; slotTime?: string; notes?: string };

export async function logCare(v: NewLog, userId: string): Promise<void> {
  const { error } = await supabase.from('care_logs').insert({
    pet_id: v.petId,
    type: v.type,
    title: (v.title || CARE[v.type].label).slice(0, 40),
    routine_id: v.routineId ?? null,
    slot_date: v.slotTime ? todayIso() : null,
    slot_time: v.slotTime ?? null,
    notes: v.notes?.trim() ? v.notes.trim() : null,
    done_by: userId,
  });
  if (error?.code === '23505') throw new AlreadyDoneError();
  if (error) throw error;
}

export async function deleteLog(id: string): Promise<void> {
  const { error } = await supabase.from('care_logs').delete().eq('id', id);
  if (error) throw error;
}

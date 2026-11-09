import { todayIso } from '@/utils/format';
import { LATE_AFTER_MINUTES, WEEKDAYS } from './constants';

type RoutineLike = { id: string; pet_id: string; times: string[]; days: number[]; active: boolean };
type LogLike = { routine_id: string | null; slot_date: string | null; slot_time: string | null };

export type Slot<R extends RoutineLike, L extends LogLike> = { routine: R; time: string; log: L | undefined; late: boolean };

/** "08:00:00" -> "08:00" */
export const hm = (time: string): string => time.slice(0, 5);

/** Hora local "HH:MM" de um timestamp. */
export function clock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function weekday(dateIso: string): number {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getDay();
}

/** O horário já passou há mais de 30 minutos? */
export function isLate(time: string, now: Date = new Date()): boolean {
  const [h, m] = hm(time).split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() > (h ?? 0) * 60 + (m ?? 0) + LATE_AFTER_MINUTES;
}

/** A rotina vale para este dia? (lista de dias vazia = todos os dias) */
export const runsOn = (r: RoutineLike, dateIso: string): boolean => r.active && (r.days.length === 0 || r.days.includes(weekday(dateIso)));

/** Horários de hoje de um pet, em ordem, com o registro de quem fez (se houver). */
export function slotsFor<R extends RoutineLike, L extends LogLike>(routines: R[], logs: L[], petId: string, now: Date = new Date()): Slot<R, L>[] {
  const date = todayIso(now);
  const out: Slot<R, L>[] = [];
  for (const r of routines) {
    if (r.pet_id !== petId || !runsOn(r, date)) continue;
    for (const t of r.times) {
      const time = hm(t);
      const log = logs.find((l) => l.routine_id === r.id && l.slot_date === date && l.slot_time !== null && hm(l.slot_time) === time);
      out.push({ routine: r, time, log, late: !log && isLate(time, now) });
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

/** "todos os dias" ou "Seg, Qua, Sex" */
export function daysText(days: number[]): string {
  if (!days.length || days.length === 7) return 'todos os dias';
  return [...days].sort((a, b) => a - b).map((d) => WEEKDAYS[d]).join(', ');
}

/** Início do dia de hoje (fuso do aparelho) em ISO, para buscar os registros de hoje. */
export function startOfToday(now: Date = new Date()): string {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

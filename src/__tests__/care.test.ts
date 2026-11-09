import { describe, expect, it } from 'vitest';

import { daysText, hm, isLate, runsOn, slotsFor } from '@/features/care/logic';
import { routineSchema } from '@/features/care/schemas';

// 10/11/2026 é uma terça-feira (dia 2)
const at = (h: number, m = 0) => new Date(2026, 10, 10, h, m);
const routine = (over: Partial<{ id: string; pet_id: string; times: string[]; days: number[]; active: boolean }> = {}) => ({
  id: 'r1', pet_id: 'p1', times: ['08:00:00', '18:00:00'], days: [], active: true, ...over,
});

describe('cuidados: horários do dia', () => {
  it('corta os segundos do horário', () => expect(hm('08:30:00')).toBe('08:30'));

  it('marca atrasado só 30 minutos depois do horário', () => {
    expect(isLate('08:00', at(8, 30))).toBe(false);
    expect(isLate('08:00', at(8, 31))).toBe(true);
  });

  it('respeita os dias da semana e a rotina pausada', () => {
    expect(runsOn(routine(), '2026-11-10')).toBe(true);
    expect(runsOn(routine({ days: [2] }), '2026-11-10')).toBe(true);
    expect(runsOn(routine({ days: [0, 6] }), '2026-11-10')).toBe(false);
    expect(runsOn(routine({ active: false }), '2026-11-10')).toBe(false);
  });

  it('monta os horários de hoje com quem já fez', () => {
    const logs = [{ routine_id: 'r1', slot_date: '2026-11-10', slot_time: '08:00:00' }];
    const slots = slotsFor([routine(), routine({ id: 'r2', pet_id: 'p2' })], logs, 'p1', at(19));
    expect(slots.map((x) => x.time)).toEqual(['08:00', '18:00']);
    expect(slots[0]?.log).toBeDefined();
    expect(slots[0]?.late).toBe(false);
    expect(slots[1]?.late).toBe(true);
  });

  it('não confunde registro de outro dia', () => {
    const logs = [{ routine_id: 'r1', slot_date: '2026-11-09', slot_time: '08:00:00' }];
    expect(slotsFor([routine()], logs, 'p1', at(9))[0]?.log).toBeUndefined();
  });

  it('escreve os dias em português', () => {
    expect(daysText([])).toBe('todos os dias');
    expect(daysText([5, 1, 3])).toBe('Seg, Qua, Sex');
  });
});

describe('cuidados: validação da rotina', () => {
  const base = { type: 'feeding' as const, title: 'Ração', times: ['08:00'], days: [1], active: true };
  it('aceita rotina válida', () => expect(routineSchema.safeParse(base).success).toBe(true));
  it('exige horário e dia', () => {
    expect(routineSchema.safeParse({ ...base, times: [] }).success).toBe(false);
    expect(routineSchema.safeParse({ ...base, days: [] }).success).toBe(false);
  });
  it('recusa horário inválido', () => expect(routineSchema.safeParse({ ...base, times: ['25:00'] }).success).toBe(false));
});

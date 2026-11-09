import { CORE_VACCINES, suggestions } from '@/features/health/constants';
import { daysUntil, relDays } from '@/features/health/components';
import { recordSchema } from '@/features/health/schemas';
import { isPending, type HealthRecord } from '@/features/health/services';
import { todayIso } from '@/utils/format';

const base = { type: 'vaccine' as const, title: 'V10', occurredOn: '2026-10-01' };

describe('registro de saúde', () => {
  it('aceita o essencial', () => expect(recordSchema.safeParse(base).success).toBe(true));
  it('exige o nome', () => expect(recordSchema.safeParse({ ...base, title: '' }).success).toBe(false));
  it('próxima dose depois da data', () => expect(recordSchema.safeParse({ ...base, nextDueOn: '2026-09-01' }).success).toBe(false));
  it('próxima dose válida', () => expect(recordSchema.safeParse({ ...base, nextDueOn: '2027-10-01' }).success).toBe(true));
  it('recusa data no futuro', () => expect(recordSchema.safeParse({ ...base, occurredOn: '2999-01-01' }).success).toBe(false));
});

describe('lembretes', () => {
  it('conta dias até a data', () => expect(daysUntil('2026-11-12', '2026-11-09')).toBe(3));
  it('atrasado é negativo', () => expect(daysUntil('2026-11-01', '2026-11-09')).toBe(-8));
  it('hoje', () => expect(relDays(todayIso())).toBe('hoje'));
  const r = (p: Partial<HealthRecord>) => ({ next_due_on: '2027-01-01', next_done_at: null, next_cancelled_at: null, ...p }) as HealthRecord;
  it('pendente', () => expect(isPending(r({}))).toBe(true));
  it('concluído não é pendente', () => expect(isPending(r({ next_done_at: '2026-11-09T10:00:00Z' }))).toBe(false));
  it('cancelado não é pendente', () => expect(isPending(r({ next_cancelled_at: '2026-11-09T10:00:00Z' }))).toBe(false));
  it('sem próxima dose não é lembrete', () => expect(isPending(r({ next_due_on: null }))).toBe(false));
});

describe('vacinas essenciais', () => {
  it('reconhece V10 e antirrábica no cão', () => {
    expect(CORE_VACCINES.dog[1]?.match.test('V10')).toBe(true);
    expect(CORE_VACCINES.dog[0]?.match.test('Antirrábica')).toBe(true);
  });
  it('reconhece V5 no gato', () => expect(CORE_VACCINES.cat[1]?.match.test('Quíntupla (V5)')).toBe(true));
  it('sugestões do gato', () => expect(suggestions('vaccine', 'cat')).toContain('Quíntupla (V5)'));
});

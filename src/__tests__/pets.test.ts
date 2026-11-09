import { petSchema } from '@/features/pets/schemas';
import { ageText, dateShort, kg, parseDecimal } from '@/utils/format';

describe('cadastro do pet', () => {
  const ok = { name: 'Buddy', species: 'dog' as const, sex: 'male' as const };
  it('aceita só o essencial', () => expect(petSchema.safeParse(ok).success).toBe(true));
  it('exige o nome', () => expect(petSchema.safeParse({ ...ok, name: '  ' }).success).toBe(false));
  it('aceita peso com vírgula', () => expect(petSchema.safeParse({ ...ok, weight: '12,4' }).success).toBe(true));
  it('recusa peso inválido', () => expect(petSchema.safeParse({ ...ok, weight: 'doze' }).success).toBe(false));
  it('recusa peso zero', () => expect(petSchema.safeParse({ ...ok, weight: '0' }).success).toBe(false));
  it('recusa nascimento no futuro', () => expect(petSchema.safeParse({ ...ok, birthDate: '2999-01-01' }).success).toBe(false));
});

describe('formatação', () => {
  const hoje = new Date(2026, 10, 9);
  it('idade em anos', () => expect(ageText('2023-10-01', hoje)).toBe('3 anos'));
  it('idade em meses', () => expect(ageText('2026-05-09', hoje)).toBe('6 meses'));
  it('filhote', () => expect(ageText('2026-11-01', hoje)).toBe('filhote'));
  it('peso em kg com vírgula', () => expect(kg(12.45)).toBe('12,5 kg'));
  it('data curta no mesmo ano', () => expect(dateShort('2026-03-12', hoje)).toBe('12 de mar'));
  it('data curta de outro ano', () => expect(dateShort('2025-03-12', hoje)).toBe('12 de mar 2025'));
  it('converte decimal brasileiro', () => expect(parseDecimal('12,4')).toBe(12.4));
});

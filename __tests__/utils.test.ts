import { avatarColor, initial } from '@/utils/avatar';
import { formatCep, isValidCep } from '@/utils/cep';
import { greeting } from '@/utils/greeting';

describe('greeting', () => {
  const at = (h: number) => new Date(2026, 10, 8, h, 0);
  it('usa Bom dia antes das 12h', () => expect(greeting(at(9))).toBe('Bom dia'));
  it('usa Boa tarde entre 12h e 18h', () => expect(greeting(at(12))).toBe('Boa tarde'));
  it('usa Boa noite a partir das 18h', () => expect(greeting(at(18))).toBe('Boa noite'));
});

describe('avatar', () => {
  it('pega a inicial em maiúscula', () => expect(initial('ana')).toBe('A'));
  it('usa ? para nome vazio', () => expect(initial('  ')).toBe('?'));
  it('dá sempre a mesma cor para o mesmo nome', () => expect(avatarColor('Lucas')).toBe(avatarColor('Lucas')));
});

describe('cep', () => {
  it('aplica a máscara 00000-000', () => expect(formatCep('26210000')).toBe('26210-000'));
  it('remove letras e limita a 8 dígitos', () => expect(formatCep('2621a00001234')).toBe('26210-000'));
  it('valida 8 dígitos', () => {
    expect(isValidCep('26210-000')).toBe(true);
    expect(isValidCep('2621')).toBe(false);
  });
});

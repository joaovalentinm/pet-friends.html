import { detectPlatform } from '@/pwa/install';
import { avatarColor, initial } from '@/utils/avatar';
import { formatCep, isValidCep } from '@/utils/cep';
import { greeting } from '@/utils/greeting';

describe('greeting', () => {
  const at = (h: number) => new Date(2026, 10, 9, h, 0);
  it('Bom dia antes das 12h', () => expect(greeting(at(9))).toBe('Bom dia'));
  it('Boa tarde entre 12h e 18h', () => expect(greeting(at(12))).toBe('Boa tarde'));
  it('Boa noite a partir das 18h', () => expect(greeting(at(18))).toBe('Boa noite'));
});

describe('avatar', () => {
  it('inicial em maiúscula', () => expect(initial('ana')).toBe('A'));
  it('? para nome vazio', () => expect(initial('  ')).toBe('?'));
  it('mesma cor para o mesmo nome', () => expect(avatarColor('Lucas')).toBe(avatarColor('Lucas')));
});

describe('cep', () => {
  it('máscara 00000-000', () => expect(formatCep('26210000')).toBe('26210-000'));
  it('remove letras e limita a 8 dígitos', () => expect(formatCep('2621a00001234')).toBe('26210-000'));
  it('valida 8 dígitos', () => {
    expect(isValidCep('26210-000')).toBe(true);
    expect(isValidCep('2621')).toBe(false);
  });
});

describe('detectPlatform', () => {
  it('Instagram = dentro de outro app', () =>
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Instagram 350.0', 5)).toBe('inapp'));
  it('WhatsApp = dentro de outro app', () =>
    expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) WhatsApp/2.24', 5)).toBe('inapp'));
  it('Safari do iPhone', () =>
    expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile Safari/604.1', 5)).toBe('ios'));
  it('iPad que se apresenta como Mac', () =>
    expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/18.0 Safari/605.1.15', 5)).toBe('ios'));
  it('Chrome do Android', () =>
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 14; SM-A546E) Chrome/130.0 Mobile Safari/537.36', 5)).toBe('android'));
  it('computador', () =>
    expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36', 0)).toBe('desktop'));
});

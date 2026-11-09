import { t } from '@/i18n/strings';

/** Saudação conforme o horário: manhã até 12h, tarde até 18h, depois noite. */
export function greeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return t.greeting.morning;
  if (h < 18) return t.greeting.afternoon;
  return t.greeting.evening;
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Idade amigável a partir da data de nascimento (AAAA-MM-DD). */
export function ageText(birth: string | null | undefined, today: Date = new Date()): string {
  if (!birth) return '';
  const b = parseDate(birth);
  let months = (today.getFullYear() - b.getFullYear()) * 12 + today.getMonth() - b.getMonth();
  if (today.getDate() < b.getDate()) months--;
  if (months < 1) return 'filhote';
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

/** "12,4 kg" */
export function kg(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return `${String(Math.round(value * 10) / 10).replace('.', ',')} kg`;
}

/** "12 de nov." (com ano se for de outro ano) */
export function dateShort(iso: string | null | undefined, today: Date = new Date()): string {
  if (!iso) return '';
  const d = parseDate(iso);
  const base = `${d.getDate()} de ${MESES[d.getMonth()]}`;
  return d.getFullYear() === today.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** Data de hoje no formato AAAA-MM-DD (fuso do aparelho). */
export function todayIso(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** "12,4" ou "12.4" -> 12.4 ; vazio -> null */
export function parseDecimal(input: string | null | undefined): number | null {
  const s = String(input ?? '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export const TZ = "America/Sao_Paulo";

/** Data local (YYYY-MM-DD) em America/Sao_Paulo. */
export function localDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + "T12:00:00Z") : new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, dateStyle: "medium" }).format(d);
}

export function hoursBetween(from: Date, to: Date = new Date()): number {
  return Math.max(0, (to.getTime() - from.getTime()) / 3_600_000);
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { notation: n >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
}

export function formatDuration(sec: number | null | undefined): string {
  if (!sec && sec !== 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}min ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

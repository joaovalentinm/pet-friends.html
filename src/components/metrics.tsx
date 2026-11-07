import { Quality } from "@/components/ui";
import { formatNumber } from "@/lib/time";

export function Metric({ label, value, quality }: { label: string; value: number | null | undefined; quality?: string }) {
  const q = value === null || value === undefined ? "indisponivel" : quality ?? "observado";
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="text-sm font-medium tabular-nums text-ink-100">{formatNumber(value ?? null)}</span>
        {q !== "observado" && <Quality q={q} />}
      </div>
    </div>
  );
}

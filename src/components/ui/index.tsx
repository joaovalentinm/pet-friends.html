import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-ink-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("card", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between border-b border-ink-700/60 px-5 py-3">
          <h2 className="text-sm font-medium text-ink-100">{title}</h2>
          {actions}
        </header>
      )}
      <div className="card-pad">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "ok" | "warn" | "bad" }) {
  return (
    <div className="card card-pad">
      <div className="text-xs uppercase tracking-wide text-ink-400">{label}</div>
      <div className={clsx("mt-2 text-2xl font-semibold tabular-nums", tone === "ok" && "text-accent", tone === "warn" && "text-amber-400", tone === "bad" && "text-red-400", !tone && "text-white")}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-400">{hint}</div>}
    </div>
  );
}

const TONES = {
  green: "bg-accent-muted text-green-300 border-green-800/50",
  amber: "bg-amber-500/10 text-amber-300 border-amber-800/50",
  red: "bg-red-500/10 text-red-300 border-red-900/60",
  blue: "bg-sky-500/10 text-sky-300 border-sky-900/60",
  violet: "bg-violet-500/10 text-violet-300 border-violet-900/60",
  gray: "bg-ink-800 text-ink-300 border-ink-700",
} as const;

export function Badge({ children, tone = "gray", title }: { children: ReactNode; tone?: keyof typeof TONES; title?: string }) {
  return (
    <span title={title} className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium", TONES[tone])}>
      {children}
    </span>
  );
}

/** Selo de qualidade do dado: confirmado, estimado, indisponível ou hipótese da IA. */
export function Quality({ q }: { q: string | null | undefined }) {
  switch (q) {
    case "observado":
    case "evidencia":
      return <Badge tone="green" title="Dado confirmado por fonte verificável">confirmado</Badge>;
    case "estimado":
      return <Badge tone="amber" title="Estimativa — não é métrica observada">estimado</Badge>;
    case "hipotese":
      return <Badge tone="violet" title="Hipótese da IA">hipótese da IA</Badge>;
    default:
      return <Badge tone="gray" title="Dado não disponível na fonte">indisponível</Badge>;
  }
}

export const CLASS_LABEL: Record<string, { label: string; tone: keyof typeof TONES }> = {
  viral_confirmado: { label: "Viral confirmado", tone: "green" },
  muito_acima_media: { label: "Muito acima da média", tone: "blue" },
  crescimento_acelerado: { label: "Crescimento acelerado", tone: "violet" },
  trend_emergente: { label: "Trend emergente", tone: "amber" },
  estrategico: { label: "Conteúdo estratégico", tone: "gray" },
  abaixo_do_criterio: { label: "Abaixo do critério", tone: "gray" },
};

export function ViralClass({ c }: { c: string | null | undefined }) {
  const v = CLASS_LABEL[c ?? ""] ?? { label: c ?? "—", tone: "gray" as const };
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

export const TREND_LABEL: Record<string, { label: string; tone: keyof typeof TONES }> = {
  emergente: { label: "Emergente", tone: "green" },
  em_crescimento: { label: "Em crescimento", tone: "blue" },
  em_alta: { label: "Em alta", tone: "amber" },
  saturada: { label: "Saturada", tone: "red" },
};

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card card-pad flex flex-col items-center py-12 text-center">
      <div className="text-sm font-medium text-ink-100">{title}</div>
      {children && <div className="mt-2 max-w-xl text-sm text-ink-400">{children}</div>}
    </div>
  );
}

export function Notice({ tone = "amber", children }: { tone?: "amber" | "red" | "green" | "gray"; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "mb-4 rounded-lg border px-4 py-3 text-sm",
        tone === "amber" && "border-amber-800/50 bg-amber-500/5 text-amber-200",
        tone === "red" && "border-red-900/60 bg-red-500/5 text-red-200",
        tone === "green" && "border-green-800/50 bg-accent-muted text-green-200",
        tone === "gray" && "border-ink-700 bg-ink-850 text-ink-300",
      )}
    >
      {children}
    </div>
  );
}

export function PlatformTag({ p }: { p: string }) {
  const map: Record<string, string> = { youtube: "YouTube", instagram: "Instagram", tiktok: "TikTok", web: "Notícia" };
  return <Badge tone="gray">{map[p] ?? p}</Badge>;
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link break-all">
      {children}
    </a>
  );
}

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="link">{children}</Link>;
}

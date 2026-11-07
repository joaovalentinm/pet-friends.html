import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge, Empty } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/time";

const TONE = { concluido: "green", parcial: "amber", falhou: "red", executando: "blue" } as const;

export default async function HistoryPage() {
  const db = await createClient();
  const { data: runs } = await db.from("daily_runs").select("*").order("started_at", { ascending: false }).limit(90);
  return (
    <>
      <PageHeader title="Histórico" subtitle="Todas as execuções da rotina diária, com etapas, fontes indisponíveis e erros." />
      {!runs?.length ? (
        <Empty title="Nenhuma execução registrada" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="border-b border-ink-700/60"><tr><th className="th">Data</th><th className="th">Origem</th><th className="th">Status</th><th className="th">Início / fim</th><th className="th">Entregas</th><th className="th">Fontes indisponíveis</th><th className="th"></th></tr></thead>
            <tbody className="divide-y divide-ink-800">
              {runs.map((r) => {
                const s = r.stats as Record<string, number>;
                return (
                  <tr key={r.id} className="hover:bg-ink-850/50">
                    <td className="td whitespace-nowrap">{formatDate(r.run_date)}</td>
                    <td className="td text-xs">{r.trigger}</td>
                    <td className="td"><Badge tone={TONE[r.status as keyof typeof TONE] ?? "gray"}>{r.status}</Badge></td>
                    <td className="td text-xs text-ink-400">{formatDateTime(r.started_at)}<br />{formatDateTime(r.finished_at)}</td>
                    <td className="td text-xs">Top {s.top10 ?? 0} · {s.trends ?? 0} trends · {s.ideas ?? 0} ideias · {s.scripts ?? 0} roteiros</td>
                    <td className="td text-xs">{(r.unavailable_sources as { source: string }[]).map((u) => u.source).join(", ") || "—"}</td>
                    <td className="td text-right"><Link href={`/historico/${r.id}`} className="link text-xs">detalhes</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

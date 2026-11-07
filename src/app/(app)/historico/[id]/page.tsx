import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/time";

export default async function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await createClient();
  const [{ data: run }, { data: collections }, { data: logs }, { data: usage }] = await Promise.all([
    db.from("daily_runs").select("*").eq("id", id).maybeSingle(),
    db.from("source_collections").select("*").eq("run_id", id).order("id"),
    db.from("logs").select("*").eq("run_id", id).order("created_at"),
    db.from("ai_usage").select("purpose,model,input_tokens,output_tokens,cost_usd").eq("run_id", id),
  ]);
  if (!run) notFound();
  const stages = run.stages as { name: string; status: string; started_at: string; finished_at?: string; error?: string }[];
  const cost = (usage ?? []).reduce((a, u) => a + Number(u.cost_usd), 0);

  return (
    <>
      <PageHeader
        title={`Execução de ${formatDate(run.run_date)}`}
        subtitle={<>{run.trigger} · {run.status} · {formatDateTime(run.started_at)} → {formatDateTime(run.finished_at)} · <Link className="link" href={`/top10?run=${run.id}`}>Top 10</Link> · <Link className="link" href={`/radar?run=${run.id}`}>Radar</Link></>}
      />
      {run.error && <div className="mb-4 rounded-lg border border-red-900/60 bg-red-500/5 px-4 py-3 text-sm text-red-200">{run.error}</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Etapas">
          <ol className="space-y-2">
            {stages.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Badge tone={s.status === "ok" ? "green" : s.status === "erro" ? "red" : "gray"}>{s.status}</Badge>
                <div>
                  <div className="text-ink-100">{s.name.replace(/_/g, " ")}</div>
                  <div className="text-xs text-ink-500">{formatDateTime(s.started_at)}{s.finished_at ? ` → ${formatDateTime(s.finished_at)}` : ""}</div>
                  {s.error && <div className="text-xs text-amber-300">{s.error}</div>}
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <Card title="Coletas por fonte">
          <ul className="space-y-2 text-sm">
            {(collections ?? []).map((c) => (
              <li key={c.id}>
                <div className="flex items-center gap-2"><Badge tone={c.status === "ok" ? "green" : c.status === "erro" ? "red" : "amber"}>{c.status}</Badge><span className="font-mono text-xs">{c.source_id}</span><span className="text-xs text-ink-400">{c.items_found} itens</span></div>
                {c.error && <div className="mt-0.5 text-xs text-amber-300">{c.error}</div>}
              </li>
            ))}
          </ul>
          <div className="mt-4 text-xs text-ink-400">Custo de IA nesta execução: US$ {cost.toFixed(2)} ({usage?.length ?? 0} chamadas)</div>
          <pre className="mt-3 overflow-x-auto rounded bg-ink-950 p-3 text-xs text-ink-300">{JSON.stringify(run.stats, null, 2)}</pre>
        </Card>
      </div>
      <Card title={`Logs (${logs?.length ?? 0})`} className="mt-4">
        <ul className="space-y-1 font-mono text-xs">
          {(logs ?? []).map((l) => (
            <li key={l.id} className={l.level === "error" ? "text-red-300" : l.level === "warn" ? "text-amber-300" : "text-ink-400"}>
              {formatDateTime(l.created_at)} [{l.level}] {l.scope}: {l.message}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

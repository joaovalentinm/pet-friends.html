import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Stat, Notice, Empty, Quality, ExtLink, Badge } from "@/components/ui";
import { SyncPerformanceButton, ActionButton } from "@/components/client";
import { PublicationForm } from "./PublicationForm";
import { refreshLearningsAction } from "@/app/actions/publications";
import { loadPublicationsWithMetrics, MIN_SAMPLE_FOR_LEARNING } from "@/lib/performance/learn";
import type { GroupStat } from "@/lib/performance/aggregate";
import type { Learnings } from "@/lib/ai/schemas";
import { formatDate, formatDateTime, formatNumber } from "@/lib/time";

export default async function PerformancePage() {
  const db = await createClient();
  const [pubs, { data: learning }, { data: scripts }, { data: creators }, { data: igSource }] = await Promise.all([
    loadPublicationsWithMetrics(db),
    db.from("performance_insights").select("*").order("computed_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("scripts").select("id,headline,run_date").in("status", ["pronto", "gravado", "publicado"]).order("run_date", { ascending: false }).limit(100),
    db.from("creators").select("id,name").neq("status", "removido").order("name"),
    db.from("sources").select("last_status,missing_requirements,last_error,last_checked_at").eq("id", "instagram_insights").single(),
  ]);
  const { data: pubRows } = await db.from("own_publications").select("id,permalink,published_at,caption,source,script_id,scripts(headline)").order("published_at", { ascending: false }).limit(100);
  const metricsById = new Map(pubs.map((p) => [p.id, p]));
  const withMetrics = pubs.filter((p) => p.views !== null || p.reach !== null);
  const sum = (k: "views" | "reach" | "shares" | "follows") => withMetrics.reduce((a, p) => a + (p[k] ?? 0), 0);
  const L = learning?.insights as Learnings | null;
  const agg = learning?.aggregates as { byTheme?: GroupStat[]; byFormat?: GroupStat[] } | undefined;

  return (
    <>
      <PageHeader
        title="Meu desempenho"
        subtitle="Resultados da conta profissional de João (Meta Graph API oficial) relacionados aos roteiros que originaram cada vídeo. A IA aprende com esses dados para melhorar as próximas recomendações."
        actions={<><SyncPerformanceButton /><ActionButton action={refreshLearningsAction}>Atualizar aprendizados</ActionButton></>}
      />
      {igSource?.last_status === "nao_configurado" && (
        <Notice>Integração com a Meta não configurada (falta {igSource.missing_requirements?.join(", ")}). Você pode registrar publicações e métricas manualmente enquanto isso.</Notice>
      )}
      {igSource?.last_status === "erro" && <Notice tone="red">Falha na última sincronização ({formatDateTime(igSource.last_checked_at)}): {igSource.last_error}</Notice>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Publicações" value={pubs.length} hint={`${withMetrics.length} com métricas`} />
        <Stat label="Visualizações" value={formatNumber(sum("views"))} />
        <Stat label="Alcance" value={formatNumber(sum("reach"))} />
        <Stat label="Compartilhamentos" value={formatNumber(sum("shares"))} />
        <Stat label="Seguidores conquistados" value={formatNumber(sum("follows"))} hint="quando disponível na API" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card title="Aprendizados da IA" className="xl:col-span-2">
          {!L ? (
            <p className="text-sm text-ink-400">
              {withMetrics.length < MIN_SAMPLE_FOR_LEARNING
                ? `São necessárias pelo menos ${MIN_SAMPLE_FOR_LEARNING} publicações com métricas para gerar aprendizados (atual: ${withMetrics.length}).`
                : "Clique em “Atualizar aprendizados”."}
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-ink-200">{L.summary}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <ObsList title="Temas que mais atraem público" items={L.top_themes} />
                <ObsList title="Ganchos que funcionam" items={L.best_hooks} />
                <ObsList title="Formatos com mais alcance" items={L.best_formats} />
                <ObsList title="O que gera compartilhamentos" items={L.share_drivers} />
                <ObsList title="O que atrai empresários" items={L.business_audience_drivers} />
                <ObsList title="O que não funcionou" items={L.underperformers} />
              </div>
              <div><div className="label">Recomendações para os próximos roteiros</div><ul className="list-disc space-y-1 pl-4 text-sm text-ink-200">{L.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
              <p className="text-xs text-ink-500">Amostra: {learning?.sample_size} publicações · {formatDateTime(learning?.computed_at)}</p>
            </div>
          )}
          {agg?.byTheme?.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <GroupTable title="Por tema" rows={agg.byTheme} />
              <GroupTable title="Por formato" rows={agg.byFormat ?? []} />
            </div>
          ) : null}
        </Card>
        <Card title="Registrar publicação">
          <PublicationForm scripts={scripts ?? []} creators={creators ?? []} />
        </Card>
      </div>

      <Card title="Publicações" className="mt-6">
        {!pubRows?.length ? (
          <Empty title="Nenhuma publicação registrada" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead><tr><th className="th">Publicação</th><th className="th">Roteiro</th><th className="th">Tema / formato</th><th className="th text-right">Views</th><th className="th text-right">Alcance</th><th className="th text-right">Curt.</th><th className="th text-right">Coment.</th><th className="th text-right">Compart.</th><th className="th text-right">Salv.</th><th className="th text-right">Seg.</th></tr></thead>
              <tbody className="divide-y divide-ink-800">
                {pubRows.map((p) => {
                  const m = metricsById.get(p.id);
                  const n = (x: number | null | undefined) => (x === null || x === undefined ? <span className="text-ink-500">—</span> : formatNumber(x));
                  return (
                    <tr key={p.id}>
                      <td className="td">
                        <div className="text-xs text-ink-400">{formatDate(p.published_at)} · <Badge tone="gray">{p.source === "meta_api" ? "Meta API" : "manual"}</Badge></div>
                        <div className="line-clamp-1 max-w-xs">{p.permalink ? <ExtLink href={p.permalink}>{p.caption?.slice(0, 80) || p.permalink}</ExtLink> : p.caption?.slice(0, 80) || "—"}</div>
                      </td>
                      <td className="td text-xs">{(p.scripts as unknown as { headline: string } | null)?.headline ?? <span className="text-ink-500">não vinculado</span>}</td>
                      <td className="td text-xs">{m?.theme ?? "—"} / {m?.content_format ?? "—"}</td>
                      <td className="td text-right tabular-nums">{n(m?.views)}</td>
                      <td className="td text-right tabular-nums">{n(m?.reach)}</td>
                      <td className="td text-right tabular-nums">{n(m?.likes)}</td>
                      <td className="td text-right tabular-nums">{n(m?.comments)}</td>
                      <td className="td text-right tabular-nums">{n(m?.shares)}</td>
                      <td className="td text-right tabular-nums">{n(m?.saves)}</td>
                      <td className="td text-right tabular-nums">{n(m?.follows)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function ObsList({ title, items }: { title: string; items: { value: string; type: string }[] }) {
  return (
    <div>
      <div className="label">{title}</div>
      {items.length ? <ul className="space-y-1">{items.map((o, i) => <li key={i} className="flex gap-2 text-sm text-ink-200"><Quality q={o.type} /><span>{o.value}</span></li>)}</ul> : <p className="text-sm text-ink-500">sem dados</p>}
    </div>
  );
}

function GroupTable({ title, rows }: { title: string; rows: GroupStat[] }) {
  return (
    <div>
      <div className="label">{title}</div>
      <table className="w-full text-xs">
        <thead><tr><th className="th px-0">Grupo</th><th className="th px-0 text-right">n</th><th className="th px-0 text-right">Views méd.</th><th className="th px-0 text-right">Compart. méd.</th></tr></thead>
        <tbody>{rows.slice(0, 8).map((r) => <tr key={r.key}><td className="py-1 text-ink-200">{r.key}</td><td className="text-right">{r.count}</td><td className="text-right tabular-nums">{formatNumber(r.avgViews)}</td><td className="text-right tabular-nums">{formatNumber(r.avgShares)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

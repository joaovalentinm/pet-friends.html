import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, Quality, ExtLink, PlatformTag, ViralClass, Notice } from "@/components/ui";
import { Metric } from "@/components/metrics";
import { AnalyzeButton } from "@/components/client";
import { TranscriptForms } from "./TranscriptForms";
import { formatDate, formatDateTime, formatDuration } from "@/lib/time";
import type { VideoAnalysis } from "@/lib/ai/schemas";

type O = { value: string; type: string };

const FIELDS: [keyof VideoAnalysis, string][] = [
  ["hook_first_3s", "Gancho dos 3 primeiros segundos"], ["headline", "Headline"], ["promise", "Promessa"], ["curiosity", "Curiosidade"],
  ["problem", "Problema apresentado"], ["narrative_structure", "Construção narrativa"], ["development", "Desenvolvimento"], ["examples", "Exemplos"],
  ["arguments", "Argumentos"], ["expectation_breaks", "Quebras de expectativa"], ["cta", "CTA"], ["duration_assessment", "Duração"],
  ["rhythm", "Ritmo"], ["editing", "Edição"], ["visual_elements", "Elementos visuais"], ["language", "Linguagem"],
];

export default async function VideoAnalysisPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(videoId)) notFound();
  const db = await createClient();
  const [{ data: v }, { data: metrics }, { data: score }, { data: analysis }, { data: transcripts }] = await Promise.all([
    db.from("videos").select("*, creators(name)").eq("id", videoId).maybeSingle(),
    db.from("video_metrics").select("*").eq("video_id", videoId).order("collected_at", { ascending: false }).limit(10),
    db.from("viral_scores").select("*").eq("video_id", videoId).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("analyses").select("*").eq("video_id", videoId).eq("kind", "engenharia_reversa").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("transcripts").select("source,created_at,text").eq("video_id", videoId),
  ]);
  if (!v) notFound();
  const m = metrics?.[0];
  const r = analysis?.result as VideoAnalysis | undefined;
  const expl = score?.explanation as { reasons?: string[]; baselineMethod?: string; components?: Record<string, number> } | undefined;

  return (
    <>
      <PageHeader title={v.title ?? "Vídeo"} subtitle={<>{v.channel_name} · {formatDate(v.published_at)} · <ExtLink href={v.url}>{v.url}</ExtLink></>} actions={<AnalyzeButton videoId={v.id} hasAnalysis={Boolean(analysis)} />} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Dados coletados" className="lg:col-span-1">
          <div className="mb-3 flex flex-wrap gap-2">
            <PlatformTag p={v.platform} />
            {score && <ViralClass c={score.classification} />}
            {score?.viral_index !== null && score?.viral_index !== undefined && <Badge tone="green">{Number(score.viral_index)}x o padrão</Badge>}
            {score && <Quality q={score.quality} />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Visualizações" value={m?.views} quality={m?.quality?.views} />
            <Metric label="Curtidas" value={m?.likes} quality={m?.quality?.likes} />
            <Metric label="Comentários" value={m?.comments} quality={m?.quality?.comments} />
            <Metric label="Compartilh." value={m?.shares} quality={m?.quality?.shares} />
            <Metric label="Seguidores" value={m?.channel_followers} quality={m?.quality?.followers} />
            <div><div className="text-[11px] uppercase tracking-wide text-ink-400">Duração</div><div className="text-sm text-ink-100">{formatDuration(v.duration_seconds)}</div></div>
          </div>
          {expl && (
            <div className="mt-4 space-y-1 text-xs text-ink-400">
              <div>Base: {expl.baselineMethod}</div>
              {expl.reasons?.map((x, i) => <div key={i}>• {x}</div>)}
            </div>
          )}
          <div className="mt-4 text-xs text-ink-500">Última coleta: {formatDateTime(m?.collected_at)} via {m?.source_id}. Histórico: {metrics?.length ?? 0} coleta(s).</div>
          {metrics && metrics.length > 1 && (
            <table className="mt-3 w-full text-xs">
              <thead><tr><th className="th px-0">Coleta</th><th className="th px-0 text-right">Views</th><th className="th px-0 text-right">Curtidas</th></tr></thead>
              <tbody>{metrics.map((x) => <tr key={x.id}><td className="py-1 text-ink-400">{formatDateTime(x.collected_at)}</td><td className="text-right tabular-nums">{x.views ?? "—"}</td><td className="text-right tabular-nums">{x.likes ?? "—"}</td></tr>)}</tbody>
            </table>
          )}
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {!r ? (
            <Notice tone="gray">Este vídeo ainda não foi analisado. Clique em “Analisar vídeo com IA”. Sem transcrição, a análise de fala, ritmo e edição será marcada como hipótese.</Notice>
          ) : (
            <>
              <Card title="Por que pode ter funcionado">
                <div className="mb-3 flex flex-wrap gap-1.5">{r.formats.map((f) => <Badge key={f} tone="blue">{f.replace(/_/g, " ")}</Badge>)}</div>
                <ul className="space-y-2">{r.why_it_worked.map((w, i) => <li key={i} className="flex gap-2 text-sm text-ink-200"><Quality q={w.type} /> <span>{w.value}</span></li>)}</ul>
                <div className="mt-4 rounded-lg border border-green-900/50 bg-accent-muted p-3">
                  <div className="label text-green-300">Mecanismo de atenção transferível</div>
                  <p className="text-sm text-ink-100">{r.attention_mechanism}</p>
                </div>
              </Card>
              <Card title="Engenharia reversa">
                <dl className="grid gap-4 md:grid-cols-2">
                  {FIELDS.map(([k, label]) => {
                    const o = r[k] as O;
                    return (
                      <div key={k}>
                        <dt className="label flex items-center gap-2">{label} <Quality q={o.type} /></dt>
                        <dd className="text-sm leading-6 text-ink-200">{o.value}</dd>
                      </div>
                    );
                  })}
                  <div className="md:col-span-2">
                    <dt className="label">Estratégias de retenção</dt>
                    <dd><ul className="space-y-1">{r.retention_strategies.map((s, i) => <li key={i} className="flex gap-2 text-sm text-ink-200"><Quality q={s.type} /> {s.value}</li>)}</ul></dd>
                  </div>
                </dl>
              </Card>
              <Card title="Ideias de adaptação para João (originais)">
                <ul className="space-y-3">
                  {r.adaptation_ideas.map((a, i) => (
                    <li key={i} className="rounded-lg border border-ink-800 p-3">
                      <div className="font-medium text-ink-100">{a.title}</div>
                      <div className="mt-1 text-sm text-ink-300">{a.angle}</div>
                      <div className="mt-1 text-xs text-ink-400">Mecanismo: {a.how_mechanism_transfers}</div>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-ink-500">Limitações: {r.limitations}</p>
                <p className="mt-1 text-xs text-ink-500">Insumos usados: {Object.entries(analysis!.inputs_used as Record<string, unknown>).filter(([, x]) => x).map(([k]) => k).join(", ")} · {formatDateTime(analysis!.created_at)} · {analysis!.model}</p>
              </Card>
            </>
          )}
          <Card title="Transcrição (fonte autorizada)">
            {transcripts?.length ? (
              transcripts.map((t) => <details key={t.source} className="mb-2"><summary className="cursor-pointer text-sm text-ink-300">{t.source} · {formatDateTime(t.created_at)}</summary><p className="mt-2 whitespace-pre-wrap text-sm text-ink-300">{t.text}</p></details>)
            ) : (
              <p className="mb-3 text-sm text-ink-400">Nenhuma transcrição. Não baixamos vídeos de terceiros das plataformas; cole a transcrição ou informe uma URL de arquivo cujo uso seja autorizado.</p>
            )}
            <TranscriptForms videoId={v.id} />
          </Card>
        </div>
      </div>
    </>
  );
}

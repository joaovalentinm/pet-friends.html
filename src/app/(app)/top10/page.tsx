import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { latestRunWithTop, top10ForRun } from "@/lib/queries";
import { PageHeader, Card, Badge, ViralClass, Empty, Notice, PlatformTag, Quality, ExtLink } from "@/components/ui";
import { Metric } from "@/components/metrics";
import { AnalyzeButton } from "@/components/client";
import { formatDate, formatDateTime, formatDuration, formatNumber } from "@/lib/time";
import type { StrategicAnalysis } from "@/lib/ai/schemas";

export default async function Top10Page({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  const sp = await searchParams;
  const db = await createClient();
  const run = sp.run ? (await db.from("daily_runs").select("*").eq("id", sp.run).maybeSingle()).data : await latestRunWithTop(db);
  if (!run) return (<><PageHeader title="Top 10 do dia" /><Empty title="Nenhum Top 10 gerado ainda">Execute a rotina diária para gerar o ranking.</Empty></>);

  const [rows, { data: report }, { data: analyzed }] = await Promise.all([
    top10ForRun(db, run.id),
    db.from("run_reports").select("*").eq("run_id", run.id).maybeSingle(),
    db.from("analyses").select("video_id").eq("kind", "engenharia_reversa"),
  ]);
  const analyzedSet = new Set((analyzed ?? []).map((a) => a.video_id));
  const sa = report?.strategic_analysis as (StrategicAnalysis & { indisponivel?: string }) | undefined;

  return (
    <>
      <PageHeader
        title="Top 10 do dia"
        subtitle={<>Conteúdos de maior destaque no radar geral em {formatDate(run.run_date)}. Ordenados pelo desempenho relativo ao padrão de cada criador — não só por visualizações absolutas. <Link href="/historico" className="link">Ver outros dias</Link></>}
      />
      {report?.limitation_note && <Notice>{report.limitation_note}</Notice>}

      {sa && (
        <Card title="Análise estratégica" className="mb-6">
          {sa.indisponivel ? (
            <p className="text-sm text-ink-400">Indisponível: {sa.indisponivel}</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2 text-sm leading-6 text-ink-200">{sa.summary}</div>
              <List title="Padrões" items={sa.patterns} />
              <List title="Ganchos em comum" items={sa.common_hooks} />
              <List title="Formatos em comum" items={sa.common_formats} />
              <List title="Oportunidades para João" items={sa.opportunities_for_joao} />
              <List title="Cuidados" items={sa.watch_outs} />
              <div>
                <div className="label">Limitações dos dados</div>
                <p className="text-sm text-ink-300">{sa.data_caveats}</p>
                <div className="mt-2"><Quality q="hipotese" /> <span className="text-xs text-ink-400">análise interpretativa gerada por IA</span></div>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="space-y-4">
        {rows.map((t) => (
          <article key={t.rank} className="card overflow-hidden">
            <div className="flex flex-col gap-4 p-5 md:flex-row">
              <div className="flex items-start gap-4 md:w-72 md:shrink-0">
                <span className="text-3xl font-semibold tabular-nums text-ink-600">{t.rank}</span>
                {t.video.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.video.thumbnail_url} alt="" className="aspect-[9/16] w-28 rounded-lg border border-ink-700 object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="grid aspect-[9/16] w-28 place-items-center rounded-lg border border-ink-700 bg-ink-850 text-xs text-ink-500">sem miniatura</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <ViralClass c={t.score?.classification} />
                  <PlatformTag p={t.video.platform} />
                  {t.score && <Badge tone="gray">score {t.score.score}</Badge>}
                  {t.score?.viral_index !== null && t.score?.viral_index !== undefined && (
                    <Badge tone="green" title={t.score.explanation?.baselineMethod}>{t.score.viral_index}x o padrão</Badge>
                  )}
                  {t.score && <Quality q={t.score.quality} />}
                </div>
                <h3 className="mt-2 text-base font-medium text-white">{t.subject ?? t.video.title}</h3>
                <p className="mt-0.5 text-sm text-ink-400">{t.video.title}</p>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 lg:grid-cols-6">
                  <Field label="Criador" value={t.video.channel_name ?? "—"} />
                  <Field label="Perfil" value={t.video.channel_handle ?? "—"} />
                  <Field label="Publicação" value={formatDate(t.video.published_at)} />
                  <Field label="Duração" value={formatDuration(t.video.duration_seconds)} />
                  <Metric label="Seguidores" value={t.metrics?.channel_followers} quality={t.metrics?.quality?.followers} />
                  <Metric label="Visualizações" value={t.metrics?.views} quality={t.metrics?.quality?.views} />
                  <Metric label="Curtidas" value={t.metrics?.likes} quality={t.metrics?.quality?.likes} />
                  <Metric label="Comentários" value={t.metrics?.comments} quality={t.metrics?.quality?.comments} />
                  <Metric label="Compartilh." value={t.metrics?.shares} quality={t.metrics?.quality?.shares} />
                  <Field label="Formato" value={t.content_format?.replace(/_/g, " ") ?? "—"} />
                  <Field label="Velocidade" value={t.score?.velocity_per_hour ? `${formatNumber(t.score.velocity_per_hour)}/h` : "—"} />
                  <Field label="Adaptação" value={t.adaptation_score !== null ? `${t.adaptation_score}/100` : "—"} />
                </dl>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <Block label="Gancho utilizado" text={t.hook} />
                  <Block label="Motivo da seleção" text={t.selection_reason} />
                  <Block label="Potencial de adaptação para João" text={t.adaptation_potential} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-400">
                  <ExtLink href={t.video.url}>{t.video.url}</ExtLink>
                  <span>· métricas coletadas em {formatDateTime(t.metrics?.collected_at)} via {t.metrics?.source_id}</span>
                  {t.evidence_note && <span>· {t.evidence_note}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AnalyzeButton videoId={t.video.id} hasAnalysis={analyzedSet.has(t.video.id)} />
                  {analyzedSet.has(t.video.id) && <Link href={`/analise/${t.video.id}`} className="btn-ghost">Ver análise</Link>}
                </div>
              </div>
            </div>
          </article>
        ))}
        {!rows.length && <Empty title={`Nenhum conteúdo atingiu os critérios em ${formatDate(run.run_date)}`}>{report?.limitation_note}</Empty>}
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-0.5 truncate text-sm text-ink-100">{value}</div>
    </div>
  );
}

function Block({ label, text }: { label: string; text: string | null }) {
  return (
    <div className="rounded-lg border border-ink-800 bg-ink-950/50 p-3">
      <div className="label">{label}</div>
      <p className="text-sm leading-6 text-ink-200">{text ?? <span className="text-ink-500">indisponível (requer IA)</span>}</p>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="label">{title}</div>
      <ul className="list-disc space-y-1 pl-4 text-sm text-ink-200">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { latestRun, latestRunWithTop, top10ForRun, sourcesOverview, isMonitored } from "@/lib/queries";
import { PageHeader, Stat, Card, Badge, ViralClass, Empty, Notice, PlatformTag } from "@/components/ui";
import { RunPipelineButton } from "@/components/client";
import { formatDateTime, formatNumber, localDate } from "@/lib/time";

const RUN_TONE = { concluido: "green", parcial: "amber", falhou: "red", executando: "blue" } as const;

export default async function Overview() {
  const db = await createClient();
  const [run, topRun, sources, { data: creators }, { data: scripts }, { count: trendsToday }] = await Promise.all([
    latestRun(db),
    latestRunWithTop(db),
    sourcesOverview(db),
    db.from("creators").select("id,status,monitoring_enabled,instagram_handle,youtube_channel_id"),
    db.from("scripts").select("id,headline,duration_seconds,status,ideas(slot,score_total,editorial_pillar)").eq("run_date", localDate()).order("created_at"),
    db.from("trends").select("id", { count: "exact", head: true }).eq("run_date", localDate()),
  ]);
  const top = topRun ? await top10ForRun(db, topRun.id) : [];
  const okSources = new Set(sources.working.map((s) => s.id));
  const monitored = (creators ?? []).filter((c) => isMonitored(c, okSources)).length;
  const validated = (creators ?? []).filter((c) => c.status === "validado").length;
  const pending = (creators ?? []).filter((c) => c.status === "pendente_validacao").length;
  const stats = (run?.stats ?? {}) as Record<string, number>;

  return (
    <>
      <PageHeader
        title="Visão geral"
        subtitle="Seu departamento de inteligência de conteúdo. A rotina roda todos os dias às 07h (America/Sao_Paulo)."
        actions={<RunPipelineButton />}
      />

      {!run && (
        <Notice tone="gray">
          Nenhuma análise executada ainda. Configure as integrações em <Link href="/configuracoes" className="link">Configurações</Link> e clique em “Executar análise agora”.
        </Notice>
      )}
      {sources.failing.length > 0 && (
        <Notice tone="red">
          Fontes com falha: {sources.failing.map((s) => s.name).join(", ")}. A rotina continua com as demais. Detalhes em <Link href="/configuracoes" className="link">Configurações</Link>.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Última análise"
          value={run ? <Badge tone={RUN_TONE[run.status as keyof typeof RUN_TONE] ?? "gray"}>{run.status}</Badge> : "—"}
          hint={run ? formatDateTime(run.finished_at ?? run.started_at) : "nunca executada"}
        />
        <Stat label="Vídeos analisados" value={formatNumber(stats.pontuados ?? 0)} hint={`${formatNumber(stats.coletados ?? 0)} coletados na última execução`} />
        <Stat label="Tendências hoje" value={trendsToday ?? 0} />
        <Stat label="Roteiros de hoje" value={`${scripts?.length ?? 0}/5`} tone={(scripts?.length ?? 0) >= 5 ? "ok" : (scripts?.length ?? 0) > 0 ? "warn" : undefined} />
        <Stat label="Criadores monitorados" value={monitored} hint={`${validated} validados · ${pending} pendentes de validação`} />
        <Stat label="Fontes funcionando" value={sources.working.length} tone={sources.working.length ? "ok" : undefined} hint={sources.working.map((s) => s.id).join(", ") || "nenhuma verificada"} />
        <Stat label="Fontes com falha" value={sources.failing.length} tone={sources.failing.length ? "bad" : undefined} />
        <Stat label="Não configuradas" value={sources.notConfigured.length} tone={sources.notConfigured.length ? "warn" : undefined} hint="ver Configurações" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3" title={`Top 10 viral ${topRun ? `· ${topRun.run_date}` : ""}`} actions={<Link href="/top10" className="text-xs link">ver análise completa</Link>}>
          {top.length === 0 ? (
            <p className="text-sm text-ink-400">Sem Top 10 disponível. Ele é gerado pela rotina diária a partir das fontes configuradas.</p>
          ) : (
            <ol className="divide-y divide-ink-800">
              {top.map((t) => (
                <li key={t.rank} className="flex items-start gap-3 py-2.5">
                  <span className="w-5 shrink-0 text-right text-sm font-semibold tabular-nums text-ink-400">{t.rank}</span>
                  <div className="min-w-0 flex-1">
                    <a href={t.video.url} target="_blank" rel="noopener noreferrer" className="line-clamp-1 text-sm text-ink-100 hover:text-white">{t.subject ?? t.video.title}</a>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-400">
                      <PlatformTag p={t.video.platform} />
                      <span>{t.video.channel_name}</span>
                      <span>· {formatNumber(t.metrics?.views ?? null)} views</span>
                      {t.score?.viral_index && <span>· {t.score.viral_index}x</span>}
                    </div>
                  </div>
                  <ViralClass c={t.score?.classification} />
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="lg:col-span-2" title="O que gravar hoje" actions={<Link href="/hoje" className="text-xs link">abrir roteiros</Link>}>
          {!scripts?.length ? (
            <p className="text-sm text-ink-400">Os 5 roteiros do dia aparecem aqui após a execução da rotina.</p>
          ) : (
            <ul className="space-y-3">
              {scripts.map((s) => {
                const idea = s.ideas as unknown as { slot: number; score_total: number; editorial_pillar: string } | null;
                return (
                  <li key={s.id}>
                    <Link href={`/roteiros/${s.id}`} className="block rounded-lg border border-ink-800 p-3 hover:border-ink-600">
                      <div className="flex items-center justify-between gap-2 text-xs text-ink-400">
                        <span>{idea?.editorial_pillar}</span>
                        <Badge tone="green">{idea?.score_total ?? "—"}/100</Badge>
                      </div>
                      <div className="mt-1 text-sm font-medium text-ink-100">{s.headline}</div>
                      <div className="mt-1 text-xs text-ink-400">{s.duration_seconds}s · {s.status}</div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {run?.unavailable_sources?.length ? (
        <Card className="mt-4" title="Fontes indisponíveis na última execução">
          <ul className="space-y-1 text-sm text-ink-300">
            {(run.unavailable_sources as { source: string; status: string; reason: string }[]).map((u) => (
              <li key={u.source}><Badge tone={u.status === "erro" ? "red" : "amber"}>{u.status}</Badge> <span className="font-mono text-xs">{u.source}</span> — {u.reason}</li>
            ))}
          </ul>
        </Card>
      ) : null}
      {!top.length && !scripts?.length && run && <div className="mt-4"><Empty title="Sem entregas ainda">Verifique as fontes e a chave de IA em Configurações.</Empty></div>}
    </>
  );
}

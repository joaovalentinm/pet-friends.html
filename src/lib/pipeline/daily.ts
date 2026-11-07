import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { localDate, hoursBetween } from "@/lib/time";
import { log, errorMessage } from "@/lib/log";
import { syncSourceStatuses } from "@/lib/sources/registry";
import { computeViral, keywordRelevance, RELEVANCE_KEYWORDS, selectTop, type ViralResult } from "@/lib/viral/score";
import { termSignals } from "@/lib/trends/signals";
import { computeOpportunityScore, referencePerformanceScore, relativePerformanceScore, CRITERIA, type CriterionKey, type CriterionScore } from "@/lib/scoring/opportunity";
import { ideaDedupeKey, scriptContentHash, findNearDuplicate } from "@/lib/dedupe";
import { slugify } from "@/lib/text";
import { aiConfigured, AiBudgetError } from "@/lib/ai/client";
import { annotateCandidates, strategicAnalysis, detectTrends, selectIdeas, writeScript, type VideoBrief } from "@/lib/ai/tasks";
import { getOrCreateAnalysis } from "@/lib/analysis";
import { latestLearnings } from "@/lib/performance/learn";
import { sendDailySummary } from "@/lib/notify";
import type { ChannelBaseline } from "@/lib/sources/types";
import { collectYouTube, collectInstagramCreators, collectTikTok, collectNews, type CollectionResult } from "./collect";
import { persistVideos, persistBaselines, recentBaselines, getSetting, videoKey, type StoredVideo } from "./store";

type Stage = { name: string; status: "ok" | "erro" | "pulado"; started_at: string; finished_at?: string; detail?: unknown; error?: string };

export interface RunOptions {
  trigger: "agendado" | "manual";
  requestedBy?: string | null;
  /** limites para caber no tempo de execução da função */
  maxSearchCalls?: number;
  baselineChannels?: number;
}

export class RunLockedError extends Error {}

const STALE_MINUTES = 30;

export async function startRun(opts: RunOptions): Promise<string> {
  const db = adminClient();
  // libera travas antigas (execução que morreu sem finalizar)
  await db
    .from("daily_runs")
    .update({ status: "falhou", finished_at: new Date().toISOString(), error: "execução interrompida (tempo limite ou queda do servidor)" })
    .eq("status", "executando")
    .lt("started_at", new Date(Date.now() - STALE_MINUTES * 60_000).toISOString());

  const { data, error } = await db
    .from("daily_runs")
    .insert({ run_date: localDate(), trigger: opts.trigger, requested_by: opts.requestedBy ?? null })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new RunLockedError("Já existe uma análise em execução. Aguarde a conclusão.");
    throw new Error(error.message);
  }
  return data.id;
}

/**
 * ROTINA DIÁRIA (07h America/Sao_Paulo)
 * Cada etapa é isolada: falha de uma fonte ou etapa não interrompe as demais.
 * Nenhum dado é inventado para completar a entrega.
 */
export async function runDailyPipeline(runId: string, opts: RunOptions) {
  const db = adminClient();
  const runDate = localDate();
  const stages: Stage[] = [];
  const stats: Record<string, unknown> = {};
  const unavailable: { source: string; status: string; reason: string }[] = [];

  const saveProgress = async (patch: Record<string, unknown> = {}) => {
    await db.from("daily_runs").update({ stages, stats, unavailable_sources: unavailable, ...patch }).eq("id", runId);
  };

  async function stage<T>(name: string, fn: () => Promise<T>): Promise<T | null> {
    const s: Stage = { name, status: "ok", started_at: new Date().toISOString() };
    stages.push(s);
    await saveProgress();
    try {
      const r = await fn();
      s.finished_at = new Date().toISOString();
      return r;
    } catch (e) {
      s.status = "erro";
      s.error = errorMessage(e);
      s.finished_at = new Date().toISOString();
      await log("error", `pipeline:${name}`, s.error, {}, runId);
      return null;
    } finally {
      await saveProgress();
    }
  }
  const skip = (name: string, reason: string) => {
    stages.push({ name, status: "pulado", started_at: new Date().toISOString(), finished_at: new Date().toISOString(), error: reason });
  };

  await log("info", "pipeline", `execução ${opts.trigger} iniciada`, {}, runId);
  const windowHours = await getSetting<number>(db, "radar_window_hours", 96);

  // 1. fontes -----------------------------------------------------------------
  await stage("verificar_fontes", () => syncSourceStatuses());

  // 2-4. coleta + métricas ------------------------------------------------------
  const collections = (await stage("coletar_fontes", async () => {
    const results = await Promise.all([
      collectYouTube(db, { windowHours, maxSearchCalls: opts.maxSearchCalls ?? 30, baselineChannels: opts.baselineChannels ?? 60 }),
      collectInstagramCreators(db, windowHours),
      collectTikTok(db, windowHours),
      collectNews(db, windowHours),
    ]);
    for (const r of results) {
      await db.from("source_collections").insert({
        run_id: runId,
        source_id: r.sourceId,
        finished_at: new Date().toISOString(),
        status: r.status,
        items_found: r.videos.length,
        error: r.error ?? null,
        details: r.details,
      });
      await db
        .from("sources")
        .update({ last_status: r.status, last_checked_at: new Date().toISOString(), last_error: r.error ?? null })
        .eq("id", r.sourceId);
      if (r.status !== "ok") unavailable.push({ source: r.sourceId, status: r.status, reason: r.error ?? r.status });
    }
    return results;
  })) as CollectionResult[] | null;

  const allVideos = (collections ?? []).flatMap((c) => c.videos);
  const allBaselines = (collections ?? []).flatMap((c) => c.baselines);
  stats.coletados = allVideos.length;

  const stored = await stage("atualizar_metricas", async () => {
    const map = await persistVideos(db, allVideos);
    await persistBaselines(db, allBaselines);
    for (const c of collections ?? []) {
      for (const f of c.followerUpdates) {
        await db.from("creator_follower_snapshots").insert({ creator_id: f.creatorId, platform: "instagram", followers: f.followers, source_id: f.sourceId });
        await db.from("creators").update({ followers_count: f.followers, followers_source: f.sourceId, followers_checked_at: new Date().toISOString() }).eq("id", f.creatorId);
      }
    }
    return map;
  });
  const storedVideos = [...(stored ?? new Map<string, StoredVideo>()).values()];
  stats.videos_gravados = storedVideos.length;

  // 5. índice de viralização ----------------------------------------------------
  const scored = await stage("calcular_indice_viral", async () => {
    const baselineByChannel = new Map<string, ChannelBaseline>();
    for (const platform of ["youtube", "instagram", "tiktok"] as const) {
      const chans = [...new Set(storedVideos.filter((v) => v.collected.platform === platform).map((v) => v.collected.channel.externalId))];
      const m = await recentBaselines(db, platform, chans, 24 * 7);
      for (const [k, b] of m) baselineByChannel.set(`${platform}:${k}`, b);
    }
    const now = new Date();
    const rows: { video: StoredVideo; result: ViralResult; relevance: number }[] = [];
    for (const v of storedVideos) {
      const c = v.collected;
      if (c.platform === "web") continue; // notícias não entram no índice de vídeos
      const b = baselineByChannel.get(`${c.platform}:${c.channel.externalId}`);
      const basis = c.platform === "instagram" ? "engajamento" : "views";
      const relevance = keywordRelevance(`${c.title ?? ""} ${c.description?.slice(0, 500) ?? ""}`, RELEVANCE_KEYWORDS);
      const prevValue = v.previous ? (basis === "views" ? v.previous.views : (v.previous.likes ?? 0) + (v.previous.comments ?? 0)) : null;
      const result = computeViral({
        views: c.metrics.views,
        likes: c.metrics.likes,
        comments: c.metrics.comments,
        shares: c.metrics.shares,
        followers: c.channel.followers,
        baselineMedian: basis === "views" ? (b?.medianViews ?? null) : (b?.medianEngagement ?? null),
        baselineSample: b?.sampleSize ?? 0,
        basis,
        ageHours: c.publishedAt ? hoursBetween(new Date(c.publishedAt), now) : null,
        previous: prevValue !== null && v.previous ? { value: prevValue, hoursAgo: hoursBetween(new Date(v.previous.collected_at), now) } : null,
        relevance,
        windowHours,
      });
      result.explanation.baselineMethod = b?.method ?? result.explanation.baselineMethod;
      rows.push({ video: v, result, relevance });
    }
    return rows;
  });
  const scoredRows = scored ?? [];
  stats.pontuados = scoredRows.length;

  const briefOf = (row: { video: StoredVideo; result: ViralResult }): VideoBrief => {
    const c = row.video.collected;
    return {
      id: row.video.id,
      platform: c.platform,
      url: c.url,
      creator: c.channel.name,
      followers: c.channel.followers,
      published_at: c.publishedAt,
      title: c.title,
      description: c.description?.slice(0, 400) ?? null,
      duration_seconds: c.durationSeconds,
      views: c.metrics.views,
      likes: c.metrics.likes,
      comments: c.metrics.comments,
      shares: c.metrics.shares,
      viral_index: row.result.viralIndex,
      viral_quality: row.result.quality,
      classification: row.result.classification,
      baseline_method: row.result.explanation.baselineMethod,
      topic: c.topic ?? null,
    };
  };

  // 6. Top 10 -------------------------------------------------------------------
  const useAi = aiConfigured();
  type TopItem = { video: StoredVideo; result: ViralResult; relevance: number; annotation?: Record<string, unknown> };
  let top10: TopItem[] = [];
  const top = await stage("top10_viral", async () => {
    const prelim = [...scoredRows].sort((a, b) => b.result.score - a.result.score);
    let candidates: TopItem[] = prelim.slice(0, 30);
    const annotations = new Map<string, Record<string, unknown>>();
    if (useAi && candidates.length) {
      try {
        const ann = await annotateCandidates(candidates.map(briefOf), runId);
        for (const a of ann.items) annotations.set(a.id, a as unknown as Record<string, unknown>);
        // recalcula com relevância refinada pela IA
        candidates = candidates.map((c) => {
          const a = annotations.get(c.video.id);
          if (!a) return c;
          const rel = Math.min(1, Math.max(0, Number(a.relevance)));
          const delta = (rel - c.relevance) * 15;
          const score = Math.round((c.result.score + delta) * 10) / 10;
          let classification = c.result.classification;
          if (classification === "estrategico" && rel < 0.7) classification = "abaixo_do_criterio";
          if (classification === "abaixo_do_criterio" && rel >= 0.7) classification = "estrategico";
          return { ...c, relevance: rel, annotation: a, result: { ...c.result, score, classification } };
        });
      } catch (e) {
        if (e instanceof AiBudgetError) throw e;
        await log("warn", "pipeline:top10", `anotação por IA falhou; usando somente métricas: ${errorMessage(e)}`, {}, runId);
      }
    }
    // grava todos os índices calculados (histórico)
    const finalById = new Map(candidates.map((c) => [c.video.id, c]));
    const allRows = scoredRows.map((r) => finalById.get(r.video.id) ?? r);
    const scoreIdByVideo = new Map<string, number>();
    for (let i = 0; i < allRows.length; i += 300) {
      const { data, error } = await db
        .from("viral_scores")
        .insert(
          allRows.slice(i, i + 300).map((r) => ({
            video_id: r.video.id,
            run_id: runId,
            viral_index: r.result.viralIndex,
            velocity_per_hour: r.result.velocityPerHour,
            engagement_rate: r.result.engagementRate,
            age_hours: r.video.collected.publishedAt ? Math.round(hoursBetween(new Date(r.video.collected.publishedAt))) : null,
            relevance: r.relevance,
            score: r.result.score,
            classification: r.result.classification,
            quality: r.result.quality,
            explanation: r.result.explanation,
          })),
        )
        .select("id,video_id");
      if (error) throw new Error(error.message);
      for (const d of data ?? []) scoreIdByVideo.set(d.video_id, d.id);
    }

    top10 = selectTop(
      candidates.map((c) => ({ ...c, score: c.result.score, classification: c.result.classification, channelKey: `${c.video.collected.platform}:${c.video.collected.channel.externalId}` })),
      10,
      2,
    );
    if (top10.length) {
      const { error } = await db.from("daily_top10").insert(
        top10.map((t, i) => ({
          run_id: runId,
          run_date: runDate,
          rank: i + 1,
          video_id: t.video.id,
          viral_score_id: scoreIdByVideo.get(t.video.id) ?? null,
          subject: (t.annotation?.subject as string) ?? t.video.collected.topic ?? null,
          hook: t.annotation ? `${(t.annotation.hook as { value: string }).value} [${(t.annotation.hook as { type: string }).type}]` : null,
          content_format: (t.annotation?.content_format as string) ?? null,
          selection_reason: (t.annotation?.selection_reason as string) ?? t.result.explanation.reasons.join("; "),
          adaptation_potential: (t.annotation?.adaptation_potential as string) ?? null,
          adaptation_score: t.annotation ? Math.round(Math.min(100, Math.max(0, Number(t.annotation.adaptation_score)))) : null,
          evidence_note: `qualidade do índice: ${t.result.quality}; ${t.result.explanation.baselineMethod}`,
        })),
      );
      if (error) throw new Error(error.message);
    }

    let analysis: unknown = null;
    const limitation =
      top10.length < 10
        ? `Foram encontrados ${top10.length} conteúdo(s) que atingem os critérios de destaque. ${
            unavailable.length ? `Fontes indisponíveis: ${unavailable.map((u) => u.source).join(", ")}. ` : ""
          }O sistema não completa a lista com conteúdos fora do critério.`
        : null;
    if (useAi && top10.length) {
      try {
        analysis = await strategicAnalysis(top10.map(briefOf), top10.map((t) => t.annotation ?? null), top10.length, runId);
      } catch (e) {
        if (e instanceof AiBudgetError) throw e;
        await log("warn", "pipeline:top10", `análise estratégica falhou: ${errorMessage(e)}`, {}, runId);
      }
    }
    await db.from("run_reports").upsert({
      run_id: runId,
      run_date: runDate,
      strategic_analysis: analysis ?? { indisponivel: useAi ? "falha na análise por IA" : "IA não configurada (ANTHROPIC_API_KEY)" },
      found_count: top10.length,
      limitation_note: limitation,
    });
    return { count: top10.length };
  });
  stats.top10 = top?.count ?? 0;

  // 6b. Descoberta de novos criadores ------------------------------------------
  await stage("descobrir_criadores", async () => {
    const min = Number(await getSetting(db, "min_followers", 40000));
    const { data: known } = await db.from("creators").select("instagram_handle,youtube_channel_id");
    const knownYt = new Set((known ?? []).map((k) => k.youtube_channel_id).filter(Boolean));
    const knownIg = new Set((known ?? []).map((k) => k.instagram_handle).filter(Boolean));
    const strong = scoredRows.filter(
      (r) => ["viral_confirmado", "muito_acima_media"].includes(r.result.classification) && r.relevance >= 0.5 && !r.video.collected.creatorId,
    );
    const byChannel = new Map<string, typeof strong>();
    for (const r of strong) {
      const c = r.video.collected;
      if (c.platform === "youtube" && knownYt.has(c.channel.externalId)) continue;
      if (c.platform === "instagram" && knownIg.has(c.channel.externalId)) continue;
      if ((c.channel.followers ?? 0) < min) continue; // só sugere quem já tem o mínimo na plataforma de origem
      const k = `${c.platform}:${c.channel.externalId}`;
      byChannel.set(k, [...(byChannel.get(k) ?? []), r]);
    }
    const rows = [...byChannel.values()].map((list) => {
      const c = list[0].video.collected;
      return {
        name: c.channel.name ?? c.channel.externalId,
        platform: c.platform,
        handle: c.channel.handle ?? c.channel.externalId,
        url: c.platform === "youtube" ? `https://www.youtube.com/channel/${c.channel.externalId}` : c.url,
        followers: c.channel.followers,
        followers_quality: "observado",
        followers_source: c.sourceId,
        reason: `${list.length} conteúdo(s) muito acima do padrão do próprio criador no radar de ${runDate} (ex.: ${list[0].result.viralIndex ?? "?"}x). Validar Instagram (mínimo ${min}).`,
        evidence: list.slice(0, 5).map((r) => ({ video_id: r.video.id, url: r.video.collected.url, viral_index: r.result.viralIndex, channel_id: c.channel.externalId })),
      };
    });
    if (rows.length) await db.from("creator_suggestions").upsert(rows, { onConflict: "platform,handle", ignoreDuplicates: true });
    stats.sugestoes_criadores = rows.length;
    return { suggestions: rows.length };
  });

  // 7. Tendências ---------------------------------------------------------------
  type TrendRow = { id: string; slug: string; title: string; status: string; adaptation: string; record_now: boolean };
  let trendRows: TrendRow[] = [];
  const news = storedVideos.filter((v) => v.collected.platform === "web");
  const newsBriefs: VideoBrief[] = news
    .sort((a, b) => (b.collected.metrics.likes ?? 0) - (a.collected.metrics.likes ?? 0))
    .slice(0, 20)
    .map((n) => ({
      id: n.id, platform: "web", url: n.collected.url, creator: "Hacker News", followers: null, published_at: n.collected.publishedAt,
      title: n.collected.title, description: null, duration_seconds: null, views: null, likes: n.collected.metrics.likes,
      comments: n.collected.metrics.comments, shares: null, viral_index: null, viral_quality: "indisponivel", classification: null,
    }));

  if (!useAi) skip("radar_tendencias", "IA não configurada (ANTHROPIC_API_KEY)");
  else {
    await stage("radar_tendencias", async () => {
      const since = new Date(Date.now() - 168 * 3_600_000).toISOString();
      const { data: recent } = await db
        .from("videos")
        .select("id,title,description,published_at,platform,channel_external_id,raw")
        .neq("platform", "web")
        .gte("published_at", since)
        .limit(3000);
      const latestViews = new Map(scoredRows.map((r) => [r.video.id, r.video.collected.metrics.views]));
      const signals = termSignals(
        (recent ?? []).map((r) => ({
          id: r.id,
          text: `${r.title ?? ""} ${(r.description ?? "").slice(0, 200)}`,
          publishedAt: new Date(r.published_at),
          channelKey: `${r.platform}:${r.channel_external_id}`,
          views: latestViews.get(r.id) ?? null,
        })),
      );
      // áudios recorrentes (TikTok music_id)
      const audioCount = new Map<string, Set<string>>();
      for (const r of recent ?? []) {
        const mid = (r.raw as { music_id?: string } | null)?.music_id;
        if (!mid) continue;
        if (!audioCount.has(mid)) audioCount.set(mid, new Set());
        audioCount.get(mid)!.add(r.channel_external_id);
      }
      const audios = [...audioCount.entries()].filter(([, s]) => s.size >= 3).map(([music_id, s]) => ({ music_id, criadores: s.size }));
      const { data: prev } = await db.from("trends").select("title,status,run_date").lt("run_date", runDate).order("run_date", { ascending: false }).limit(15);
      const recentBriefs = [...scoredRows].sort((a, b) => b.result.score - a.result.score).slice(0, 60).map(briefOf);
      const validIds = new Set([...(recent ?? []).map((r) => r.id), ...newsBriefs.map((n) => n.id), ...recentBriefs.map((b) => b.id)]);

      const out = await detectTrends({ signals, videos: recentBriefs, news: newsBriefs, audios, previousTrends: prev ?? [], runId });
      const rows = out.trends
        .map((t) => ({ ...t, evidence_ids: t.evidence_ids.filter((id) => validIds.has(id)) }))
        .filter((t) => t.evidence_ids.length > 0) // sem evidência verificável, não entra
        .map((t) => ({
          run_id: runId,
          run_date: runDate,
          slug: slugify(t.title),
          title: t.title,
          status: t.status,
          signal_type: t.signal_type,
          what_is_happening: t.what_is_happening,
          why_people_consume: t.why_people_consume,
          working_format: t.working_format,
          adaptation: t.adaptation,
          record_now: t.record_now,
          record_now_reason: t.record_now_reason,
          identity_fit: Math.round(Math.min(100, Math.max(0, t.identity_fit))),
          growth: { note: t.growth_note, signals: signals.filter((s) => t.title.toLowerCase().includes(s.term.split(" ")[0])).slice(0, 3) },
          evidence_video_ids: t.evidence_ids,
        }));
      const dedup = [...new Map(rows.map((r) => [r.slug, r])).values()];
      if (dedup.length) {
        const { data, error } = await db.from("trends").upsert(dedup, { onConflict: "run_date,slug" }).select("id,slug,title,status,adaptation,record_now");
        if (error) throw new Error(error.message);
        trendRows = (data ?? []) as TrendRow[];
      }
      stats.trends = trendRows.length;
      return { signals: signals.length, trends: trendRows.length };
    });
  }

  // 8-9. Ideias + roteiros ------------------------------------------------------
  if (!useAi) {
    skip("gerar_ideias", "IA não configurada (ANTHROPIC_API_KEY)");
    skip("gerar_roteiros", "IA não configurada (ANTHROPIC_API_KEY)");
  } else if (!scoredRows.length && !trendRows.length && !newsBriefs.length) {
    skip("gerar_ideias", "nenhum sinal coletado hoje — sem base real para gerar ideias");
    skip("gerar_roteiros", "sem ideias");
  } else {
    const learnings = await latestLearnings(db);
    const ideas = await stage("gerar_ideias", async () => {
      const topIds = new Set(top10.map((t) => t.video.id));
      const monitored = scoredRows
        .filter((r) => r.video.collected.creatorId && !topIds.has(r.video.id))
        .sort((a, b) => b.result.score - a.result.score)
        .slice(0, 10);
      const candidateRows = [...top10, ...monitored];
      const candidates = candidateRows.map(briefOf);
      const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const { data: recentScripts } = await db.from("scripts").select("headline").gte("created_at", since30).limit(300);
      const recentHeadlines = (recentScripts ?? []).map((s) => s.headline as string);
      const pillars = await getSetting<string[]>(db, "editorial_pillars", []);

      const out = await selectIdeas({
        candidates,
        trends: trendRows.map((t) => ({ slug: t.slug, title: t.title, status: t.status, adaptation: t.adaptation, record_now: t.record_now })),
        news: newsBriefs,
        learnings: learnings?.insights ?? null,
        recentHeadlines,
        pillars,
        runId,
      });

      const rowById = new Map(candidateRows.map((r) => [r.video.id, r]));
      const newsById = new Map(news.map((n) => [n.id, n]));
      const trendBySlug = new Map(trendRows.map((t) => [t.slug, t]));
      const inserted: { idea: Record<string, unknown>; reference: VideoBrief | null }[] = [];
      for (const [i, idea] of out.ideas.slice(0, 5).entries()) {
        const near = findNearDuplicate(idea.subject + " " + idea.angle, recentHeadlines, 0.7);
        if (near) await log("warn", "pipeline:ideias", `ideia parecida com roteiro recente: "${near}"`, { subject: idea.subject }, runId);
        const ref = idea.reference_id ? rowById.get(idea.reference_id) : undefined;
        const newsRef = idea.reference_id ? newsById.get(idea.reference_id) : undefined;
        const refId = ref?.video.id ?? newsRef?.id ?? null;
        const trend = idea.trend_slug ? trendBySlug.get(idea.trend_slug) : undefined;

        const scores: Record<CriterionKey, CriterionScore> = {
          desempenho_referencia: ref
            ? referencePerformanceScore(ref.video.collected.metrics.views, (ref.video.collected.metrics.likes ?? 0) + (ref.video.collected.metrics.comments ?? 0) || null)
            : { value: null, justification: newsRef ? "referência é notícia (sem métricas de vídeo)" : "ideia sem vídeo de referência", origin: "dados" },
          desempenho_relativo: ref
            ? relativePerformanceScore(ref.result.viralIndex, ref.result.quality)
            : { value: null, justification: "sem índice de viralização", origin: "dados" },
          potencial_alcance: { ...idea.scores.potencial_alcance, origin: "ia" },
          relevancia_publico: { ...idea.scores.relevancia_publico, origin: "ia" },
          atualidade: { ...idea.scores.atualidade, origin: "ia" },
          potencial_compartilhamento: { ...idea.scores.potencial_compartilhamento, origin: "ia" },
          originalidade_adaptacao: { ...idea.scores.originalidade_adaptacao, origin: "ia" },
          facilidade_producao: { ...idea.scores.facilidade_producao, origin: "ia" },
        };
        const total = computeOpportunityScore(scores);
        const justification =
          `${idea.choice_reason}` +
          (total.renormalized ? ` | Critérios sem dados (pesos redistribuídos): ${total.excluded.map((k) => CRITERIA[k].label).join(", ")}.` : "") +
          " | Nota = potencial estimado, não resultado garantido.";
        const row = {
          run_id: runId,
          run_date: runDate,
          slot: Math.min(5, Math.max(1, Math.round(idea.slot) || i + 1)),
          editorial_pillar: idea.editorial_pillar,
          pillar_override_reason: idea.pillar_override_reason,
          reference_video_id: refId,
          trend_id: trend?.id ?? null,
          subject: idea.subject,
          angle: idea.angle,
          audience: idea.audience,
          pain_or_curiosity: idea.pain_or_curiosity,
          why_for_joao: idea.why_for_joao,
          viral_mechanism: idea.viral_mechanism,
          reference_snapshot: ref
            ? { ...briefOf(ref), collected_at: new Date().toISOString() }
            : newsRef
              ? { url: newsRef.collected.url, title: newsRef.collected.title, points: newsRef.collected.metrics.likes, comments: newsRef.collected.metrics.comments, platform: "web" }
              : {},
          score_total: total.total,
          score_breakdown: scores,
          score_justification: justification,
          dedupe_key: ideaDedupeKey(runDate, refId ?? trend?.slug ?? null, idea.subject, idea.angle),
        };
        const { data, error } = await db.from("ideas").upsert(row, { onConflict: "dedupe_key", ignoreDuplicates: true }).select("*");
        if (error) throw new Error(error.message);
        if (data?.[0]) inserted.push({ idea: data[0], reference: ref ? briefOf(ref) : null });
      }
      stats.ideas = inserted.length;
      return inserted;
    });

    if (ideas?.length) {
      await stage("gerar_roteiros", async () => {
        const results = await Promise.allSettled(
          ideas.map(async ({ idea, reference }) => {
            let analysis: unknown = null;
            if (reference && reference.platform !== "web") {
              try {
                analysis = (await getOrCreateAnalysis(reference.id, { runId }))?.result ?? null;
              } catch (e) {
                await log("warn", "pipeline:roteiros", `engenharia reversa da referência falhou: ${errorMessage(e)}`, { video: reference.id }, runId);
              }
            }
            const s = await writeScript({ idea, reference, referenceAnalysis: analysis, learnings: learnings?.insights ?? null, runId });
            const { error } = await db.from("scripts").upsert(
              {
                idea_id: idea.id,
                reference_video_id: idea.reference_video_id ?? null,
                run_date: runDate,
                headline: s.headline,
                hook: s.hook,
                full_script: s.full_script,
                development: s.development,
                examples: s.examples,
                scenes: s.scenes,
                on_screen_text: s.on_screen_text,
                editing_notes: s.editing_notes,
                cta: s.cta,
                duration_seconds: Math.round(s.duration_seconds),
                recording_direction: s.recording_direction,
                theme: s.theme,
                content_format: s.content_format,
                content_hash: scriptContentHash(s.headline, s.full_script),
              },
              { onConflict: "content_hash", ignoreDuplicates: true },
            );
            if (error) throw new Error(error.message);
          }),
        );
        const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
        stats.scripts = results.length - failed.length;
        if (failed.length) {
          for (const f of failed) await log("error", "pipeline:roteiros", errorMessage(f.reason), {}, runId);
          if (failed.length === results.length) throw new Error(`todos os roteiros falharam: ${errorMessage(failed[0].reason)}`);
        }
        return { ok: results.length - failed.length, failed: failed.length };
      });
    }
  }

  // 10. notificações (opcional) ------------------------------------------------
  await stage("notificar", () => sendDailySummary(runId));

  // 11. finalização -------------------------------------------------------------
  const anyError = stages.some((s) => s.status === "erro" && s.name !== "notificar");
  const anySkip = stages.some((s) => s.status === "pulado");
  const nothing = !storedVideos.length;
  const status = nothing && anyError ? "falhou" : anyError || anySkip || unavailable.length ? "parcial" : "concluido";
  await saveProgress({ status, finished_at: new Date().toISOString() });
  await log("info", "pipeline", `execução finalizada: ${status}`, stats, runId);
  return { runId, status, stats, unavailable };
}

export async function runDaily(opts: RunOptions) {
  const runId = await startRun(opts);
  try {
    return await runDailyPipeline(runId, opts);
  } catch (e) {
    await adminClient()
      .from("daily_runs")
      .update({ status: "falhou", finished_at: new Date().toISOString(), error: errorMessage(e) })
      .eq("id", runId);
    throw e;
  }
}

export { videoKey };

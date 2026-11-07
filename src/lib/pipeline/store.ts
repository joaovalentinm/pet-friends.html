import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChannelBaseline, CollectedVideo } from "@/lib/sources/types";

export const videoKey = (platform: string, externalId: string) => `${platform}:${externalId}`;

export interface StoredVideo {
  id: string;
  collected: CollectedVideo;
  previous: { views: number | null; likes: number | null; comments: number | null; shares: number | null; collected_at: string } | null;
}

/**
 * Grava vídeos (upsert por plataforma + id externo, sem duplicar) e anexa uma nova linha de métricas
 * (histórico nunca sobrescrito). Retorna o snapshot anterior para medir crescimento.
 */
export async function persistVideos(db: SupabaseClient, items: CollectedVideo[]): Promise<Map<string, StoredVideo>> {
  const unique = new Map<string, CollectedVideo>();
  for (const it of items) {
    const k = videoKey(it.platform, it.externalId);
    const prev = unique.get(k);
    // mantém o registro mais informativo (ex.: vínculo a criador monitorado)
    if (!prev || (!prev.creatorId && it.creatorId)) unique.set(k, it);
  }
  const all = [...unique.values()];
  const out = new Map<string, StoredVideo>();
  if (!all.length) return out;

  const now = new Date().toISOString();
  const toRow = (v: CollectedVideo) => ({
    platform: v.platform,
    external_id: v.externalId,
    url: v.url,
    channel_external_id: v.channel.externalId,
    channel_name: v.channel.name,
    channel_handle: v.channel.handle,
    title: v.title,
    description: v.description,
    published_at: v.publishedAt,
    duration_seconds: v.durationSeconds,
    thumbnail_url: v.thumbnailUrl,
    language: v.language,
    topic_tags: v.topic ? [v.topic] : [],
    discovered_via: v.discoveredVia,
    search_query: v.searchQuery ?? null,
    source_id: v.sourceId,
    last_collected_at: now,
    raw: v.extra ?? {},
  });

  const withCreator = all.filter((v) => v.creatorId);
  const withoutCreator = all.filter((v) => !v.creatorId);
  const idByKey = new Map<string, string>();

  for (const [batch, includeCreator] of [[withCreator, true], [withoutCreator, false]] as const) {
    for (let i = 0; i < batch.length; i += 200) {
      const rows = batch.slice(i, i + 200).map((v) => (includeCreator ? { ...toRow(v), creator_id: v.creatorId } : toRow(v)));
      const { data, error } = await db.from("videos").upsert(rows, { onConflict: "platform,external_id" }).select("id,platform,external_id");
      if (error) throw new Error(`falha ao gravar vídeos: ${error.message}`);
      for (const r of data ?? []) idByKey.set(videoKey(r.platform, r.external_id), r.id);
    }
  }

  // snapshot anterior (antes de inserir o novo)
  const ids = [...idByKey.values()];
  const prevById = new Map<string, StoredVideo["previous"]>();
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await db
      .from("video_latest_metrics")
      .select("video_id,views,likes,comments,shares,collected_at")
      .in("video_id", ids.slice(i, i + 300));
    for (const r of data ?? []) prevById.set(r.video_id, r);
  }

  const metricRows = all
    .map((v) => {
      const id = idByKey.get(videoKey(v.platform, v.externalId));
      if (!id) return null;
      out.set(videoKey(v.platform, v.externalId), { id, collected: v, previous: prevById.get(id) ?? null });
      return {
        video_id: id,
        source_id: v.sourceId,
        views: v.metrics.views,
        likes: v.metrics.likes,
        comments: v.metrics.comments,
        shares: v.metrics.shares,
        saves: v.metrics.saves,
        channel_followers: v.channel.followers,
        quality: v.metrics.quality,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  for (let i = 0; i < metricRows.length; i += 300) {
    const { error } = await db.from("video_metrics").insert(metricRows.slice(i, i + 300));
    if (error) throw new Error(`falha ao gravar métricas: ${error.message}`);
  }
  return out;
}

export async function persistBaselines(db: SupabaseClient, baselines: ChannelBaseline[]) {
  if (!baselines.length) return;
  const { error } = await db.from("channel_baselines").insert(
    baselines.map((b) => ({
      platform: b.platform,
      channel_external_id: b.channelExternalId,
      sample_size: b.sampleSize,
      median_views: b.medianViews,
      mean_views: b.meanViews,
      median_engagement: b.medianEngagement,
      method: b.method,
      source_id: b.sourceId,
    })),
  );
  if (error) throw new Error(`falha ao gravar bases de comparação: ${error.message}`);
}

/** Bases recentes já calculadas (evita gastar cota da API recalculando todo dia). */
export async function recentBaselines(db: SupabaseClient, platform: string, channelIds: string[], maxAgeHours = 72): Promise<Map<string, ChannelBaseline>> {
  const out = new Map<string, ChannelBaseline>();
  if (!channelIds.length) return out;
  const since = new Date(Date.now() - maxAgeHours * 3_600_000).toISOString();
  for (let i = 0; i < channelIds.length; i += 300) {
    const { data } = await db
      .from("channel_baselines")
      .select("*")
      .eq("platform", platform)
      .in("channel_external_id", channelIds.slice(i, i + 300))
      .gte("computed_at", since)
      .order("computed_at", { ascending: false });
    for (const r of data ?? []) {
      if (out.has(r.channel_external_id)) continue;
      out.set(r.channel_external_id, {
        platform: r.platform,
        channelExternalId: r.channel_external_id,
        sampleSize: r.sample_size,
        medianViews: r.median_views !== null ? Number(r.median_views) : null,
        meanViews: r.mean_views !== null ? Number(r.mean_views) : null,
        medianEngagement: r.median_engagement !== null ? Number(r.median_engagement) : null,
        method: r.method,
        sourceId: r.source_id,
      });
    }
  }
  return out;
}

export async function getSetting<T>(db: SupabaseClient, key: string, fallback: T): Promise<T> {
  const { data } = await db.from("settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T) ?? fallback;
}

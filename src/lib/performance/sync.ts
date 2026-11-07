import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { ownMediaWithInsights, instagramInsightsStatus } from "@/lib/sources/instagram";
import { errorMessage } from "@/lib/log";

/** Sincroniza publicações e métricas da conta profissional autorizada de João (Meta Graph API). */
export async function syncOwnInstagram() {
  const status = instagramInsightsStatus();
  if (!status.configured) {
    return { ok: false as const, reason: `Integração não configurada. Falta: ${status.missing.join(", ")}` };
  }
  const db = adminClient();
  const startedAt = new Date().toISOString();
  try {
    const media = await ownMediaWithInsights(50);
    let metricsRows = 0;
    for (const m of media) {
      const { data: pub, error } = await db
        .from("own_publications")
        .upsert(
          { platform: "instagram", external_id: m.id, permalink: m.permalink, published_at: m.timestamp, caption: m.caption, media_type: m.mediaType, source: "meta_api" },
          { onConflict: "platform,external_id" },
        )
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      const q = (k: string) => (m.metrics[k] === null || m.metrics[k] === undefined ? "indisponivel" : "observado");
      await db.from("own_publication_metrics").insert({
        publication_id: pub.id,
        source: "meta_api",
        views: m.metrics.views ?? null,
        reach: m.metrics.reach ?? null,
        likes: m.metrics.likes ?? null,
        comments: m.metrics.comments ?? null,
        shares: m.metrics.shares ?? null,
        saves: m.metrics.saved ?? null,
        follows: m.metrics.follows ?? null,
        avg_watch_time_ms: m.metrics.ig_reels_avg_watch_time ?? null,
        total_watch_time_ms: m.metrics.ig_reels_video_view_total_time ?? null,
        quality: {
          views: q("views"), reach: q("reach"), likes: q("likes"), comments: q("comments"), shares: q("shares"),
          saves: q("saved"), follows: q("follows"), avg_watch_time: q("ig_reels_avg_watch_time"),
        },
      });
      metricsRows++;
    }
    await db.from("sources").update({ last_status: "ok", last_checked_at: new Date().toISOString(), last_error: null }).eq("id", "instagram_insights");
    await db.from("source_collections").insert({ source_id: "instagram_insights", started_at: startedAt, finished_at: new Date().toISOString(), status: "ok", items_found: metricsRows });
    return { ok: true as const, publications: media.length };
  } catch (e) {
    const msg = errorMessage(e);
    await db.from("sources").update({ last_status: "erro", last_checked_at: new Date().toISOString(), last_error: msg }).eq("id", "instagram_insights");
    await db.from("source_collections").insert({ source_id: "instagram_insights", started_at: startedAt, finished_at: new Date().toISOString(), status: "erro", error: msg });
    return { ok: false as const, reason: msg };
  }
}

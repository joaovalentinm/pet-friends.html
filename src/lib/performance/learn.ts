import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/supabase/admin";
import { learnFromPerformance } from "@/lib/ai/tasks";
import { aiConfigured } from "@/lib/ai/client";
import { env } from "@/lib/env";
import { aggregatePerformance, type PubWithMetrics } from "./aggregate";

export const MIN_SAMPLE_FOR_LEARNING = 5;

export async function latestLearnings(db: SupabaseClient = adminClient()) {
  const { data } = await db.from("performance_insights").select("*").order("computed_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function loadPublicationsWithMetrics(db: SupabaseClient = adminClient()): Promise<PubWithMetrics[]> {
  const { data: pubs } = await db
    .from("own_publications")
    .select("id,theme,content_format,hook,published_at,creators(name)")
    .order("published_at", { ascending: false })
    .limit(300);
  const ids = (pubs ?? []).map((p) => p.id);
  const { data: metrics } = ids.length ? await db.from("own_publication_latest_metrics").select("*").in("publication_id", ids) : { data: [] };
  const m = new Map((metrics ?? []).map((x) => [x.publication_id, x]));
  return (pubs ?? []).map((p) => {
    const x = m.get(p.id);
    return {
      id: p.id,
      theme: p.theme,
      content_format: p.content_format,
      hook: p.hook,
      reference_creator: (p.creators as { name?: string } | null)?.name ?? null,
      published_at: p.published_at,
      views: x?.views ?? null,
      reach: x?.reach ?? null,
      likes: x?.likes ?? null,
      comments: x?.comments ?? null,
      shares: x?.shares ?? null,
      saves: x?.saves ?? null,
      follows: x?.follows ?? null,
    };
  });
}

/** Recalcula agregados e (se houver amostra mínima e IA) gera aprendizados usados nos próximos roteiros. */
export async function refreshLearnings() {
  const db = adminClient();
  const pubs = await loadPublicationsWithMetrics(db);
  const withMetrics = pubs.filter((p) => p.views !== null || p.reach !== null || p.likes !== null);
  const aggregates = aggregatePerformance(withMetrics);
  let insights = null;
  if (withMetrics.length >= MIN_SAMPLE_FOR_LEARNING && aiConfigured()) {
    insights = await learnFromPerformance(aggregates, withMetrics.slice(0, 80));
  }
  const { data, error } = await db
    .from("performance_insights")
    .insert({ sample_size: withMetrics.length, aggregates, insights, model: insights ? env.aiModel : null })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

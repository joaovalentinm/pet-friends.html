import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function latestRun(db: SupabaseClient, onlyFinished = false) {
  let q = db.from("daily_runs").select("*").order("started_at", { ascending: false }).limit(1);
  if (onlyFinished) q = q.neq("status", "executando");
  const { data } = await q.maybeSingle();
  return data;
}

/** Última execução que produziu Top 10 (ou a última finalizada). */
export async function latestRunWithTop(db: SupabaseClient) {
  const { data } = await db.from("daily_top10").select("run_id").order("run_date", { ascending: false }).limit(1).maybeSingle();
  if (data?.run_id) {
    const { data: run } = await db.from("daily_runs").select("*").eq("id", data.run_id).single();
    return run;
  }
  return latestRun(db, true);
}

export interface Top10Row {
  rank: number;
  subject: string | null;
  hook: string | null;
  content_format: string | null;
  selection_reason: string | null;
  adaptation_potential: string | null;
  adaptation_score: number | null;
  evidence_note: string | null;
  video: {
    id: string; platform: string; url: string; title: string | null; channel_name: string | null; channel_handle: string | null;
    published_at: string | null; duration_seconds: number | null; thumbnail_url: string | null;
  };
  score: { viral_index: number | null; score: number; classification: string; quality: string; velocity_per_hour: number | null; explanation: { reasons?: string[]; baselineMethod?: string } } | null;
  metrics: { views: number | null; likes: number | null; comments: number | null; shares: number | null; channel_followers: number | null; collected_at: string; source_id: string; quality: Record<string, string> } | null;
}

export async function top10ForRun(db: SupabaseClient, runId: string): Promise<Top10Row[]> {
  const { data } = await db
    .from("daily_top10")
    .select("rank,subject,hook,content_format,selection_reason,adaptation_potential,adaptation_score,evidence_note,video_id,viral_score_id,videos(id,platform,url,title,channel_name,channel_handle,published_at,duration_seconds,thumbnail_url),viral_scores(viral_index,score,classification,quality,velocity_per_hour,explanation)")
    .eq("run_id", runId)
    .order("rank");
  const rows = data ?? [];
  const ids = rows.map((r) => r.video_id);
  const { data: metrics } = ids.length ? await db.from("video_latest_metrics").select("*").in("video_id", ids) : { data: [] };
  const m = new Map((metrics ?? []).map((x) => [x.video_id, x]));
  return rows.map((r) => ({
    ...r,
    video: r.videos as unknown as Top10Row["video"],
    score: r.viral_scores as unknown as Top10Row["score"],
    metrics: (m.get(r.video_id) ?? null) as Top10Row["metrics"],
  }));
}

export async function sourcesOverview(db: SupabaseClient) {
  const { data } = await db.from("sources").select("*").order("id");
  const rows = data ?? [];
  const relevant = rows.filter((s) => !["manual", "resend", "whatsapp"].includes(s.id));
  return {
    rows,
    working: relevant.filter((s) => s.last_status === "ok"),
    failing: relevant.filter((s) => s.last_status === "erro"),
    notConfigured: relevant.filter((s) => s.last_status === "nao_configurado"),
  };
}

/** Criador só conta como monitorado com validação + fonte de dados funcional. */
export function isMonitored(c: { status: string; monitoring_enabled: boolean; instagram_handle: string | null; youtube_channel_id: string | null }, okSources: Set<string>) {
  if (c.status !== "validado" || !c.monitoring_enabled) return false;
  return (Boolean(c.instagram_handle) && okSources.has("instagram_discovery")) || (Boolean(c.youtube_channel_id) && okSources.has("youtube"));
}

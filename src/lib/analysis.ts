import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { analyzeVideo, type VideoBrief } from "@/lib/ai/tasks";
import { sha256 } from "@/lib/dedupe";
import { env } from "@/lib/env";

/** Monta o resumo de um vídeo com as métricas mais recentes e o último índice de viralização. */
export async function loadVideoBrief(videoId: string): Promise<{ brief: VideoBrief; thumbnail: string | null } | null> {
  const db = adminClient();
  const [{ data: v }, { data: m }, { data: s }] = await Promise.all([
    db.from("videos").select("*, creators(name)").eq("id", videoId).maybeSingle(),
    db.from("video_latest_metrics").select("*").eq("video_id", videoId).maybeSingle(),
    db.from("viral_scores").select("*").eq("video_id", videoId).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!v) return null;
  return {
    thumbnail: v.thumbnail_url,
    brief: {
      id: v.id,
      platform: v.platform,
      url: v.url,
      creator: (v.creators as { name?: string } | null)?.name ?? v.channel_name,
      followers: m?.channel_followers ?? null,
      published_at: v.published_at,
      title: v.title,
      description: v.description?.slice(0, 1500) ?? null,
      duration_seconds: v.duration_seconds,
      views: m?.views ?? null,
      likes: m?.likes ?? null,
      comments: m?.comments ?? null,
      shares: m?.shares ?? null,
      viral_index: s?.viral_index !== undefined && s?.viral_index !== null ? Number(s.viral_index) : null,
      viral_quality: s?.quality ?? null,
      classification: s?.classification ?? null,
      baseline_method: (s?.explanation as { baselineMethod?: string } | null)?.baselineMethod ?? null,
      topic: v.topic_tags?.[0] ?? null,
    },
  };
}

/**
 * Engenharia reversa com cache: se os insumos (vídeo, transcrição, modelo) não mudaram,
 * reaproveita a análise existente e não gasta IA de novo.
 */
export async function getOrCreateAnalysis(videoId: string, opts: { runId?: string | null; force?: boolean } = {}) {
  const db = adminClient();
  const loaded = await loadVideoBrief(videoId);
  if (!loaded) throw new Error("vídeo não encontrado");
  const { data: transcript } = await db
    .from("transcripts")
    .select("text,source")
    .eq("video_id", videoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const thumb = loaded.thumbnail && /^https:\/\//.test(loaded.thumbnail) ? loaded.thumbnail : null;
  const inputsUsed = {
    titulo: Boolean(loaded.brief.title),
    descricao: Boolean(loaded.brief.description),
    miniatura: Boolean(thumb),
    transcricao: transcript ? transcript.source : false,
    metricas: loaded.brief.views !== null || loaded.brief.likes !== null,
  };
  const inputHash = sha256(
    JSON.stringify({ v: videoId, t: loaded.brief.title, d: loaded.brief.description, tr: transcript?.text ?? null, th: thumb, m: env.aiModel }),
  );

  if (!opts.force) {
    const { data: cached } = await db.from("analyses").select("*").eq("kind", "engenharia_reversa").eq("input_hash", inputHash).maybeSingle();
    if (cached) return cached;
  }

  let result;
  try {
    result = await analyzeVideo({ video: loaded.brief, transcript: transcript?.text ?? null, thumbnailUrl: thumb, runId: opts.runId });
  } catch (e) {
    // miniaturas de algumas plataformas expiram; repete sem imagem antes de desistir
    if (!thumb) throw e;
    result = await analyzeVideo({ video: loaded.brief, transcript: transcript?.text ?? null, thumbnailUrl: null, runId: opts.runId });
    inputsUsed.miniatura = false;
  }

  const row = {
    video_id: videoId,
    run_id: opts.runId ?? null,
    kind: "engenharia_reversa",
    model: env.aiModel,
    input_hash: inputHash,
    inputs_used: inputsUsed,
    result,
  };
  const { data, error } = await db.from("analyses").upsert(row, { onConflict: "kind,input_hash" }).select("*").single();
  if (error) throw new Error(error.message);
  if (result.formats[0]) await db.from("videos").update({ content_format: result.formats[0] }).eq("id", videoId);
  return data;
}

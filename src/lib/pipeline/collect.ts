import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as yt from "@/lib/sources/youtube";
import * as ig from "@/lib/sources/instagram";
import * as tt from "@/lib/sources/tiktok";
import * as hn from "@/lib/sources/hackernews";
import { errorMessage } from "@/lib/log";
import type { ChannelBaseline, CollectedVideo } from "@/lib/sources/types";
import { getSetting, recentBaselines } from "./store";

export interface CollectionResult {
  sourceId: string;
  status: "ok" | "erro" | "nao_configurado" | "desativado";
  videos: CollectedVideo[];
  baselines: ChannelBaseline[];
  followerUpdates: { creatorId: string; followers: number; sourceId: string }[];
  error?: string;
  details: Record<string, unknown>;
}

interface Topic {
  topic: string;
  queries: string[];
}

/** Rotação diária das consultas para cobrir todos os temas respeitando a cota do YouTube. */
export function pickQueries(topics: Topic[], maxCalls: number, regions: string[], dayIndex: number) {
  const pairs: { topic: string; query: string; region: string }[] = [];
  const maxQ = Math.max(...topics.map((t) => t.queries.length), 0);
  for (let qi = 0; qi < maxQ; qi++) {
    for (const t of topics) {
      const q = t.queries[(qi + dayIndex) % t.queries.length];
      if (!q) continue;
      for (const region of regions) pairs.push({ topic: t.topic, query: q, region });
    }
  }
  const seen = new Set<string>();
  return pairs.filter((p) => {
    const k = `${p.query}|${p.region}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, maxCalls);
}

async function sourceEnabled(db: SupabaseClient, id: string): Promise<boolean> {
  const { data } = await db.from("sources").select("enabled").eq("id", id).maybeSingle();
  return data?.enabled !== false;
}

function empty(sourceId: string, status: CollectionResult["status"], error?: string): CollectionResult {
  return { sourceId, status, videos: [], baselines: [], followerUpdates: [], error, details: {} };
}

// ------------------------------------------------------------------ YouTube
export async function collectYouTube(db: SupabaseClient, opts: { windowHours: number; maxSearchCalls: number; baselineChannels: number }): Promise<CollectionResult> {
  if (!yt.youtubeStatus().configured) return empty("youtube", "nao_configurado", "YOUTUBE_API_KEY ausente");
  if (!(await sourceEnabled(db, "youtube"))) return empty("youtube", "desativado");
  const result = empty("youtube", "ok");
  const errors: string[] = [];
  try {
    const topics = await getSetting<Topic[]>(db, "radar_topics", []);
    const regions = await getSetting<string[]>(db, "radar_regions", ["BR", "US"]);
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    const publishedAfter = new Date(Date.now() - opts.windowHours * 3_600_000).toISOString();

    // 1) Radar geral
    const idsMeta = new Map<string, { query: string; topic: string }>();
    const plan = pickQueries(topics, opts.maxSearchCalls, regions, dayIndex);
    for (const p of plan) {
      try {
        const ids = await yt.searchShortIds(p.query, { regionCode: p.region, publishedAfter, maxResults: 25 });
        for (const id of ids) if (!idsMeta.has(id)) idsMeta.set(id, { query: p.query, topic: p.topic });
      } catch (e) {
        errors.push(`busca "${p.query}" (${p.region}): ${errorMessage(e)}`);
        if (/quota/i.test(errorMessage(e))) break; // cota esgotada: para de buscar
      }
    }

    // 2) Criadores monitorados com canal no YouTube (validados)
    const { data: creators } = await db
      .from("creators")
      .select("id,youtube_channel_id")
      .eq("status", "validado")
      .eq("monitoring_enabled", true)
      .not("youtube_channel_id", "is", null);
    const creatorByChannel = new Map((creators ?? []).map((c) => [c.youtube_channel_id as string, c.id as string]));

    const videos = await yt.getVideos([...idsMeta.keys()]);
    const shorts = videos.filter((v) => (yt.parseIsoDuration(v.contentDetails?.duration) ?? 9999) <= yt.SHORTS_MAX_SECONDS);
    const channelIds = [...new Set([...shorts.map((v) => v.snippet.channelId), ...creatorByChannel.keys()])];
    const channels = await yt.getChannels(channelIds);

    // uploads recentes dos criadores monitorados
    const monitoredVideoIds: string[] = [];
    for (const chId of creatorByChannel.keys()) {
      const ch = channels.get(chId);
      if (!ch) continue;
      try {
        const b = await yt.channelBaseline(ch);
        if (b) result.baselines.push(b);
        for (const it of await yt.recentUploads(ch, 10)) {
          if (it.publishedAt && it.publishedAt < publishedAfter) continue;
          monitoredVideoIds.push(it.id);
        }
      } catch (e) {
        errors.push(`canal monitorado ${chId}: ${errorMessage(e)}`);
      }
    }
    const monitoredVideos = await yt.getVideos(monitoredVideoIds.filter((id) => !idsMeta.has(id)));

    for (const v of [...shorts, ...monitoredVideos]) {
      const meta = idsMeta.get(v.id);
      const creatorId = creatorByChannel.get(v.snippet.channelId) ?? null;
      result.videos.push(
        yt.toCollected(v, channels.get(v.snippet.channelId), {
          searchQuery: meta?.query,
          topic: meta?.topic,
          discoveredVia: meta ? "radar_geral" : "criador_monitorado",
          creatorId,
        }),
      );
    }

    // 3) Bases de comparação: canais com mais views no radar (cache de 72h)
    const ranked = [...result.videos].sort((a, b) => (b.metrics.views ?? 0) - (a.metrics.views ?? 0));
    const targetChannels = [...new Set(ranked.map((v) => v.channel.externalId))].slice(0, opts.baselineChannels);
    const cached = await recentBaselines(db, "youtube", targetChannels);
    for (const chId of targetChannels) {
      if (cached.has(chId) || result.baselines.some((b) => b.channelExternalId === chId)) continue;
      const ch = channels.get(chId);
      if (!ch) continue;
      try {
        const b = await yt.channelBaseline(ch);
        if (b) result.baselines.push(b);
      } catch (e) {
        errors.push(`base ${chId}: ${errorMessage(e)}`);
        if (/quota/i.test(errorMessage(e))) break;
      }
    }
    result.details = { searches: plan.length, found: idsMeta.size, shorts: shorts.length, monitored: monitoredVideos.length, baselinesComputed: result.baselines.length, baselinesCached: cached.size, errors: errors.slice(0, 20) };
    if (!result.videos.length && errors.length) {
      result.status = "erro";
      result.error = errors[0];
    } else if (errors.length) {
      result.error = `${errors.length} falha(s) parcial(is): ${errors[0]}`;
    }
  } catch (e) {
    result.status = "erro";
    result.error = errorMessage(e);
  }
  return result;
}

// ------------------------------------------------------------------ Instagram (criadores validados)
export async function collectInstagramCreators(db: SupabaseClient, windowHours: number): Promise<CollectionResult> {
  if (!ig.instagramDiscoveryStatus().configured) return empty("instagram_discovery", "nao_configurado", "credenciais Meta ausentes");
  if (!(await sourceEnabled(db, "instagram_discovery"))) return empty("instagram_discovery", "desativado");
  const result = empty("instagram_discovery", "ok");
  const { data: creators } = await db
    .from("creators")
    .select("id,instagram_handle")
    .eq("status", "validado")
    .eq("monitoring_enabled", true)
    .not("instagram_handle", "is", null);
  const errors: string[] = [];
  const since = Date.now() - windowHours * 3_600_000 * 2;
  for (const c of creators ?? []) {
    try {
      const profile = await ig.businessDiscovery(c.instagram_handle as string, 25);
      const { videos, baseline } = ig.profileToCollected(profile, c.id);
      if (typeof profile.followers_count === "number") result.followerUpdates.push({ creatorId: c.id, followers: profile.followers_count, sourceId: "instagram_discovery" });
      if (baseline) result.baselines.push(baseline);
      result.videos.push(...videos.filter((v) => !v.publishedAt || new Date(v.publishedAt).getTime() >= since));
    } catch (e) {
      errors.push(`@${c.instagram_handle}: ${errorMessage(e)}`);
      if (/OAuth|token/i.test(errorMessage(e))) break; // credencial inválida: não adianta continuar
    }
  }
  result.details = { creators: creators?.length ?? 0, videos: result.videos.length, errors: errors.slice(0, 20) };
  if (errors.length && !result.videos.length && (creators?.length ?? 0) > 0) {
    result.status = "erro";
    result.error = errors[0];
  } else if (errors.length) result.error = `${errors.length} perfil(is) com falha: ${errors[0]}`;
  return result;
}

// ------------------------------------------------------------------ TikTok
export async function collectTikTok(db: SupabaseClient, windowHours: number): Promise<CollectionResult> {
  if (!tt.tiktokStatus().configured) return empty("tiktok_research", "nao_configurado", "Research API não aprovada/configurada");
  if (!(await sourceEnabled(db, "tiktok_research"))) return empty("tiktok_research", "desativado");
  const result = empty("tiktok_research", "ok");
  try {
    const topics = await getSetting<Topic[]>(db, "radar_topics", []);
    const regions = await getSetting<string[]>(db, "radar_regions", ["BR", "US"]);
    const users = new Map<string, number | null>();
    for (const t of topics) {
      const kw = t.queries[0];
      if (!kw) continue;
      const vids = await tt.searchKeyword(kw, windowHours, regions);
      for (const v of vids) {
        if (v.username && !users.has(v.username)) users.set(v.username, null);
        result.videos.push(tt.toCollected(v, null, { searchQuery: kw, topic: t.topic }));
      }
    }
    // seguidores e base apenas para os 30 mais vistos
    const top = [...result.videos].sort((a, b) => (b.metrics.views ?? 0) - (a.metrics.views ?? 0)).slice(0, 30);
    for (const v of top) {
      const u = v.channel.externalId;
      if (users.get(u) !== null) continue;
      try {
        users.set(u, await tt.userFollowers(u));
        const b = await tt.userBaseline(u, v.externalId);
        if (b) result.baselines.push(b);
      } catch {
        users.set(u, null);
      }
    }
    for (const v of result.videos) v.channel.followers = users.get(v.channel.externalId) ?? null;
    for (const v of result.videos) v.metrics.quality.followers = v.channel.followers === null ? "indisponivel" : "observado";
    result.details = { videos: result.videos.length };
  } catch (e) {
    result.status = "erro";
    result.error = errorMessage(e);
  }
  return result;
}

// ------------------------------------------------------------------ Notícias
export async function collectNews(db: SupabaseClient, windowHours: number): Promise<CollectionResult> {
  if (!(await sourceEnabled(db, "hacker_news"))) return empty("hacker_news", "desativado");
  const result = empty("hacker_news", "ok");
  try {
    result.videos = await hn.topStories(Math.min(windowHours, 72));
    result.details = { stories: result.videos.length };
  } catch (e) {
    result.status = "erro";
    result.error = errorMessage(e);
  }
  return result;
}

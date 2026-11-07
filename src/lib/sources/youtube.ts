import "server-only";
import { env } from "@/lib/env";
import { median } from "@/lib/viral/score";
import { fetchJson, SourceError, type AdapterStatus, type ChannelBaseline, type CollectedVideo } from "./types";

/**
 * YouTube Data API v3 — fonte oficial, chave de API pública.
 * Cota padrão: 10.000 unidades/dia. search.list = 100 unidades; videos/channels/playlistItems = 1.
 */
const API = "https://www.googleapis.com/youtube/v3";
const ID = "youtube";
export const SHORTS_MAX_SECONDS = 180;

export function youtubeStatus(): AdapterStatus {
  return {
    id: ID,
    name: "YouTube Data API v3",
    configured: Boolean(env.youtubeApiKey),
    missing: env.youtubeApiKey ? [] : ["YOUTUBE_API_KEY"],
    howToEnable:
      "Google Cloud Console → crie um projeto → ative 'YouTube Data API v3' → Credenciais → Chave de API (restrinja à YouTube Data API). Defina YOUTUBE_API_KEY.",
    limitations: [
      "Compartilhamentos não são públicos na API (marcados como indisponíveis).",
      "Cota diária de 10.000 unidades: cada busca custa 100 unidades.",
      "Legendas de vídeos de terceiros não podem ser baixadas pela API oficial.",
    ],
  };
}

function key(): string {
  if (!env.youtubeApiKey) throw new SourceError(ID, "YOUTUBE_API_KEY não configurada");
  return env.youtubeApiKey;
}

export function parseIsoDuration(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return null;
  const [, d, h, mi, s] = m.map((x) => (x ? Number(x) : 0)) as unknown as number[];
  return d * 86400 + h * 3600 + mi * 60 + s;
}

const num = (v: unknown): number | null => (v === undefined || v === null || v === "" ? null : Number(v));

interface YtVideo {
  id: string;
  snippet: { publishedAt: string; channelId: string; title: string; description: string; channelTitle: string; defaultAudioLanguage?: string; defaultLanguage?: string; thumbnails?: Record<string, { url: string }> };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  contentDetails?: { duration?: string };
}
interface YtChannel {
  id: string;
  snippet?: { title: string; customUrl?: string };
  statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean; videoCount?: string };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
}

export async function searchShortIds(query: string, opts: { regionCode: string; publishedAfter: string; maxResults?: number }): Promise<string[]> {
  const p = new URLSearchParams({
    part: "id",
    type: "video",
    q: query,
    videoDuration: "short",
    order: "viewCount",
    publishedAfter: opts.publishedAfter,
    regionCode: opts.regionCode,
    maxResults: String(opts.maxResults ?? 25),
    key: key(),
  });
  if (opts.regionCode === "BR") p.set("relevanceLanguage", "pt");
  const data = await fetchJson<{ items?: { id: { videoId?: string } }[] }>(ID, `${API}/search?${p}`);
  return (data.items ?? []).map((i) => i.id.videoId).filter((x): x is string => Boolean(x));
}

export async function getVideos(ids: string[]): Promise<YtVideo[]> {
  const out: YtVideo[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const p = new URLSearchParams({ part: "snippet,statistics,contentDetails", id: ids.slice(i, i + 50).join(","), key: key() });
    const data = await fetchJson<{ items?: YtVideo[] }>(ID, `${API}/videos?${p}`);
    out.push(...(data.items ?? []));
  }
  return out;
}

export async function getChannels(ids: string[]): Promise<Map<string, YtChannel>> {
  const out = new Map<string, YtChannel>();
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 50) {
    const p = new URLSearchParams({ part: "snippet,statistics,contentDetails", id: unique.slice(i, i + 50).join(","), key: key() });
    const data = await fetchJson<{ items?: YtChannel[] }>(ID, `${API}/channels?${p}`);
    for (const c of data.items ?? []) out.set(c.id, c);
  }
  return out;
}

export async function resolveHandle(handle: string): Promise<YtChannel | null> {
  const p = new URLSearchParams({ part: "snippet,statistics,contentDetails", forHandle: handle.startsWith("@") ? handle : `@${handle}`, key: key() });
  const data = await fetchJson<{ items?: YtChannel[] }>(ID, `${API}/channels?${p}`);
  return data.items?.[0] ?? null;
}

export function channelFollowers(c: YtChannel | undefined): number | null {
  if (!c?.statistics || c.statistics.hiddenSubscriberCount) return null;
  return num(c.statistics.subscriberCount);
}

export function toCollected(v: YtVideo, channel: YtChannel | undefined, ctx: { searchQuery?: string; topic?: string; discoveredVia?: CollectedVideo["discoveredVia"]; creatorId?: string | null }): CollectedVideo {
  const duration = parseIsoDuration(v.contentDetails?.duration);
  const thumbs = v.snippet.thumbnails ?? {};
  const followers = channelFollowers(channel);
  const views = num(v.statistics?.viewCount);
  const likes = num(v.statistics?.likeCount);
  const comments = num(v.statistics?.commentCount);
  return {
    platform: "youtube",
    externalId: v.id,
    url: duration !== null && duration <= SHORTS_MAX_SECONDS ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`,
    title: v.snippet.title,
    description: v.snippet.description?.slice(0, 5000) ?? null,
    publishedAt: v.snippet.publishedAt,
    durationSeconds: duration,
    thumbnailUrl: (thumbs.maxres ?? thumbs.high ?? thumbs.medium ?? thumbs.default)?.url ?? null,
    language: v.snippet.defaultAudioLanguage ?? v.snippet.defaultLanguage ?? null,
    channel: { externalId: v.snippet.channelId, name: v.snippet.channelTitle, handle: channel?.snippet?.customUrl ?? null, followers },
    metrics: {
      views, likes, comments, shares: null, saves: null,
      quality: {
        views: views === null ? "indisponivel" : "observado",
        likes: likes === null ? "indisponivel" : "observado",
        comments: comments === null ? "indisponivel" : "observado",
        shares: "indisponivel",
        saves: "indisponivel",
        followers: followers === null ? "indisponivel" : "observado",
      },
    },
    sourceId: ID,
    discoveredVia: ctx.discoveredVia ?? "radar_geral",
    searchQuery: ctx.searchQuery ?? null,
    topic: ctx.topic ?? null,
    creatorId: ctx.creatorId ?? null,
  };
}

/** Mediana de views dos uploads recentes do canal (prioriza Shorts para comparar igual com igual). */
export async function channelBaseline(channel: YtChannel, excludeVideoId?: string): Promise<ChannelBaseline | null> {
  const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return null;
  const p = new URLSearchParams({ part: "contentDetails", playlistId: uploads, maxResults: "30", key: key() });
  const pl = await fetchJson<{ items?: { contentDetails: { videoId: string } }[] }>(ID, `${API}/playlistItems?${p}`);
  const ids = (pl.items ?? []).map((i) => i.contentDetails.videoId).filter((id) => id !== excludeVideoId);
  if (!ids.length) return null;
  const vids = await getVideos(ids);
  const withViews = vids.filter((v) => v.statistics?.viewCount !== undefined);
  const shorts = withViews.filter((v) => (parseIsoDuration(v.contentDetails?.duration) ?? 9999) <= SHORTS_MAX_SECONDS);
  const sample = shorts.length >= 5 ? shorts : withViews;
  const views = sample.map((v) => Number(v.statistics!.viewCount));
  const eng = sample.map((v) => Number(v.statistics?.likeCount ?? 0) + Number(v.statistics?.commentCount ?? 0));
  return {
    platform: "youtube",
    channelExternalId: channel.id,
    sampleSize: sample.length,
    medianViews: median(views),
    meanViews: views.length ? views.reduce((a, b) => a + b, 0) / views.length : null,
    medianEngagement: median(eng),
    method: shorts.length >= 5 ? `mediana de ${sample.length} Shorts recentes` : `mediana de ${sample.length} vídeos recentes (poucos Shorts)`,
    sourceId: ID,
  };
}

/** Ids dos uploads mais recentes de um canal (1 unidade de cota). */
export async function recentUploads(channel: YtChannel, max = 10): Promise<{ id: string; publishedAt: string | null }[]> {
  const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return [];
  const p = new URLSearchParams({ part: "contentDetails", playlistId: uploads, maxResults: String(max), key: key() });
  const data = await fetchJson<{ items?: { contentDetails: { videoId: string; videoPublishedAt?: string } }[] }>(ID, `${API}/playlistItems?${p}`);
  return (data.items ?? []).map((i) => ({ id: i.contentDetails.videoId, publishedAt: i.contentDetails.videoPublishedAt ?? null }));
}

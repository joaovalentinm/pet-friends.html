import "server-only";
import { env } from "@/lib/env";
import { median } from "@/lib/viral/score";
import { fetchJson, SourceError, type AdapterStatus, type ChannelBaseline, type CollectedVideo } from "./types";

/**
 * TikTok Research API (oficial). Exige aprovação no programa de pesquisa do TikTok
 * (developers.tiktok.com → Research API). Sem aprovação, o adaptador fica inativo.
 */
const ID = "tiktok_research";
const BASE = "https://open.tiktokapis.com/v2";

export function tiktokStatus(): AdapterStatus {
  const missing = [!env.tiktokClientKey && "TIKTOK_CLIENT_KEY", !env.tiktokClientSecret && "TIKTOK_CLIENT_SECRET"].filter(Boolean) as string[];
  return {
    id: ID,
    name: "TikTok Research API",
    configured: missing.length === 0,
    missing,
    howToEnable:
      "Solicite acesso à Research API em developers.tiktok.com/products/research-api (exige aprovação). Após aprovado, defina TIKTOK_CLIENT_KEY e TIKTOK_CLIENT_SECRET.",
    limitations: ["Acesso condicionado à aprovação do TikTok.", "Dados disponíveis com atraso de até 48h para alguns campos."],
  };
}

let tokenCache: { token: string; exp: number } | null = null;

async function token(): Promise<string> {
  if (!env.tiktokClientKey || !env.tiktokClientSecret) throw new SourceError(ID, "credenciais do TikTok não configuradas");
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;
  const body = new URLSearchParams({ client_key: env.tiktokClientKey, client_secret: env.tiktokClientSecret, grant_type: "client_credentials" });
  const data = await fetchJson<{ access_token: string; expires_in: number }>(ID, `${BASE}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  tokenCache = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

interface TtVideo {
  id: number | string;
  video_description?: string;
  create_time?: number;
  username?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  music_id?: number | string;
  hashtag_names?: string[];
  video_duration?: number;
  voice_to_text?: string;
  region_code?: string;
}

const FIELDS = "id,video_description,create_time,username,view_count,like_count,comment_count,share_count,music_id,hashtag_names,video_duration,voice_to_text,region_code";
const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

async function query(q: unknown, start: Date, end: Date, max = 100): Promise<TtVideo[]> {
  const t = await token();
  const data = await fetchJson<{ data?: { videos?: TtVideo[] } }>(ID, `${BASE}/research/video/query/?fields=${FIELDS}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, start_date: ymd(start), end_date: ymd(end), max_count: max }),
  });
  return data.data?.videos ?? [];
}

export async function searchKeyword(keyword: string, hours: number, regions: string[]): Promise<TtVideo[]> {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 3_600_000);
  return query(
    { and: [{ operation: "IN", field_name: "keyword", field_values: [keyword] }, { operation: "IN", field_name: "region_code", field_values: regions }] },
    start,
    end,
  );
}

export async function userFollowers(username: string): Promise<number | null> {
  const t = await token();
  const data = await fetchJson<{ data?: { follower_count?: number } }>(ID, `${BASE}/research/user/info/?fields=follower_count`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  return data.data?.follower_count ?? null;
}

export async function userBaseline(username: string, excludeId?: string): Promise<ChannelBaseline | null> {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 86_400_000);
  const vids = (await query({ and: [{ operation: "EQ", field_name: "username", field_values: [username] }] }, start, end, 50)).filter(
    (v) => String(v.id) !== excludeId && typeof v.view_count === "number",
  );
  if (!vids.length) return null;
  const views = vids.map((v) => v.view_count!);
  return {
    platform: "tiktok",
    channelExternalId: username,
    sampleSize: vids.length,
    medianViews: median(views),
    meanViews: views.reduce((a, b) => a + b, 0) / views.length,
    medianEngagement: median(vids.map((v) => (v.like_count ?? 0) + (v.comment_count ?? 0) + (v.share_count ?? 0))),
    method: `mediana de ${vids.length} vídeos dos últimos 30 dias`,
    sourceId: ID,
  };
}

export function toCollected(v: TtVideo, followers: number | null, ctx: { searchQuery: string; topic: string }): CollectedVideo {
  const has = (x: unknown) => (typeof x === "number" ? "observado" : "indisponivel") as "observado" | "indisponivel";
  return {
    platform: "tiktok",
    externalId: String(v.id),
    url: `https://www.tiktok.com/@${v.username}/video/${v.id}`,
    title: v.video_description?.split("\n")[0]?.slice(0, 200) ?? null,
    description: v.video_description ?? null,
    publishedAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
    durationSeconds: v.video_duration ?? null,
    thumbnailUrl: null,
    language: null,
    channel: { externalId: v.username ?? "desconhecido", name: v.username ?? null, handle: v.username ?? null, followers },
    metrics: {
      views: v.view_count ?? null,
      likes: v.like_count ?? null,
      comments: v.comment_count ?? null,
      shares: v.share_count ?? null,
      saves: null,
      quality: { views: has(v.view_count), likes: has(v.like_count), comments: has(v.comment_count), shares: has(v.share_count), saves: "indisponivel", followers: followers === null ? "indisponivel" : "observado" },
    },
    sourceId: ID,
    discoveredVia: "radar_geral",
    searchQuery: ctx.searchQuery,
    topic: ctx.topic,
    extra: { music_id: v.music_id ? String(v.music_id) : null, hashtags: v.hashtag_names ?? [], transcript: v.voice_to_text ?? null },
  };
}

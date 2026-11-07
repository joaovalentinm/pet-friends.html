import "server-only";
import { env } from "@/lib/env";
import { median } from "@/lib/viral/score";
import { fetchJson, SourceError, type AdapterStatus, type ChannelBaseline, type CollectedVideo } from "./types";

/**
 * Instagram Graph API (oficial, Meta).
 *
 * - Business Discovery: dados PÚBLICOS de contas profissionais (seguidores, curtidas, comentários).
 *   NÃO fornece alcance, retenção, salvamentos, compartilhamentos nem visualizações de terceiros.
 * - Insights: métricas completas apenas da conta profissional autorizada (João).
 *
 * Nunca usamos login com senha nem scraping.
 */
const DISCOVERY = "instagram_discovery";
const INSIGHTS = "instagram_insights";

const graph = () => `https://graph.facebook.com/${env.metaGraphVersion}`;

const HOW =
  "1) Converta a conta de João para Profissional (Criador ou Empresa) e vincule a uma Página do Facebook. " +
  "2) Em developers.facebook.com crie um app do tipo Business e adicione o produto 'Instagram Graph API'. " +
  "3) Gere um token de usuário de longa duração com as permissões instagram_basic, instagram_manage_insights, pages_show_list, pages_read_engagement e business_management. " +
  "4) Obtenha o ID da conta (GET /me/accounts → instagram_business_account). Defina META_ACCESS_TOKEN e IG_BUSINESS_ACCOUNT_ID.";

export function instagramDiscoveryStatus(): AdapterStatus {
  const missing = [!env.metaAccessToken && "META_ACCESS_TOKEN", !env.igBusinessAccountId && "IG_BUSINESS_ACCOUNT_ID"].filter(Boolean) as string[];
  return {
    id: DISCOVERY,
    name: "Instagram — Business Discovery",
    configured: missing.length === 0,
    missing,
    howToEnable: HOW,
    limitations: [
      "Somente contas profissionais (Criador/Empresa) podem ser consultadas; contas pessoais retornam erro.",
      "Visualizações, alcance, salvamentos e compartilhamentos de terceiros não estão disponíveis.",
      "Curtidas podem vir ocultas quando o criador esconde a contagem.",
      "O índice de viralização no Instagram usa engajamento (curtidas + comentários) como base.",
    ],
  };
}

export function instagramInsightsStatus(): AdapterStatus {
  const s = instagramDiscoveryStatus();
  return {
    ...s,
    id: INSIGHTS,
    name: "Instagram — Insights da conta de João",
    limitations: [
      "Retenção detalhada não é exposta; usamos tempo médio de exibição de Reels quando disponível.",
      "Métricas de insights ficam disponíveis algumas horas após a publicação.",
    ],
  };
}

function creds() {
  if (!env.metaAccessToken || !env.igBusinessAccountId) throw new SourceError(DISCOVERY, "META_ACCESS_TOKEN / IG_BUSINESS_ACCOUNT_ID não configurados");
  return { token: env.metaAccessToken, igId: env.igBusinessAccountId };
}

interface IgMedia {
  id: string;
  caption?: string;
  like_count?: number;
  comments_count?: number;
  media_type?: string;
  media_product_type?: string;
  permalink?: string;
  timestamp?: string;
  thumbnail_url?: string;
  media_url?: string;
}
export interface IgProfile {
  id?: string;
  username: string;
  name?: string;
  followers_count?: number;
  media_count?: number;
  media?: { data: IgMedia[] };
}

export async function businessDiscovery(username: string, mediaLimit = 25): Promise<IgProfile> {
  const { token, igId } = creds();
  const media = mediaLimit > 0
    ? `,media.limit(${mediaLimit}){id,caption,like_count,comments_count,media_type,media_product_type,permalink,timestamp,thumbnail_url}`
    : "";
  const fields = `business_discovery.username(${username}){id,username,name,followers_count,media_count${media}}`;
  const p = new URLSearchParams({ fields, access_token: token });
  const data = await fetchJson<{ business_discovery?: IgProfile }>(DISCOVERY, `${graph()}/${igId}?${p}`, { retries: 1 });
  if (!data.business_discovery) throw new SourceError(DISCOVERY, `perfil @${username} não retornado`);
  return data.business_discovery;
}

/** Valida seguidores de um handle. Distingue "não encontrado/conta pessoal" de erro de credencial. */
export async function lookupFollowers(username: string): Promise<{ found: true; followers: number; profile: IgProfile } | { found: false; reason: string }> {
  try {
    const profile = await businessDiscovery(username, 0);
    if (typeof profile.followers_count !== "number") return { found: false, reason: "contagem de seguidores não retornada" };
    return { found: true, followers: profile.followers_count, profile };
  } catch (e) {
    if (e instanceof SourceError && (e.status === 400 || e.status === 404) && !/token|OAuth|permission/i.test(e.message)) {
      return { found: false, reason: `perfil não encontrado ou não é conta profissional (${e.message})` };
    }
    throw e;
  }
}

const engagement = (m: IgMedia) => (m.like_count ?? 0) + (m.comments_count ?? 0);

export function profileToCollected(profile: IgProfile, creatorId: string | null): { videos: CollectedVideo[]; baseline: ChannelBaseline | null } {
  const media = profile.media?.data ?? [];
  const videos = media.filter((m) => m.media_product_type === "REELS" || m.media_type === "VIDEO");
  const engs = media.map(engagement).filter((x) => x > 0);
  const baseline: ChannelBaseline | null = engs.length
    ? {
        platform: "instagram",
        channelExternalId: profile.username,
        sampleSize: engs.length,
        medianViews: null,
        meanViews: null,
        medianEngagement: median(engs),
        method: `mediana de curtidas+comentários de ${engs.length} publicações recentes`,
        sourceId: DISCOVERY,
      }
    : null;
  return {
    baseline,
    videos: videos.map((m) => ({
      platform: "instagram" as const,
      externalId: m.id,
      url: m.permalink ?? `https://www.instagram.com/${profile.username}/`,
      title: m.caption?.split("\n")[0]?.slice(0, 200) ?? null,
      description: m.caption ?? null,
      publishedAt: m.timestamp ?? null,
      durationSeconds: null,
      thumbnailUrl: m.thumbnail_url ?? null,
      language: null,
      channel: { externalId: profile.username, name: profile.name ?? profile.username, handle: profile.username, followers: profile.followers_count ?? null },
      metrics: {
        views: null,
        likes: m.like_count ?? null,
        comments: m.comments_count ?? null,
        shares: null,
        saves: null,
        quality: {
          views: "indisponivel",
          likes: m.like_count === undefined ? "indisponivel" : "observado",
          comments: m.comments_count === undefined ? "indisponivel" : "observado",
          shares: "indisponivel",
          saves: "indisponivel",
          followers: profile.followers_count === undefined ? "indisponivel" : "observado",
        },
      },
      sourceId: DISCOVERY,
      discoveredVia: "criador_monitorado" as const,
      creatorId,
    })),
  };
}

// ---------------------------------------------------------------- Insights próprios
export interface OwnMediaInsights {
  id: string;
  caption: string | null;
  permalink: string | null;
  timestamp: string;
  mediaType: string | null;
  metrics: Record<string, number | null>;
  unavailable: string[];
}

const METRIC_SETS = [
  ["views", "reach", "likes", "comments", "shares", "saved", "total_interactions", "ig_reels_avg_watch_time", "ig_reels_video_view_total_time"],
  ["views", "reach", "likes", "comments", "shares", "saved", "total_interactions"],
  ["reach", "likes", "comments", "shares", "saved"],
];

export async function ownMediaWithInsights(limit = 50): Promise<OwnMediaInsights[]> {
  const { token, igId } = creds();
  const p = new URLSearchParams({ fields: "id,caption,media_type,media_product_type,permalink,timestamp", limit: String(limit), access_token: token });
  const list = await fetchJson<{ data: (IgMedia & { timestamp: string })[] }>(INSIGHTS, `${graph()}/${igId}/media?${p}`);
  const out: OwnMediaInsights[] = [];
  for (const m of list.data ?? []) {
    let metrics: Record<string, number | null> = {};
    let used: string[] = [];
    for (const set of METRIC_SETS) {
      try {
        const q = new URLSearchParams({ metric: set.join(","), access_token: token });
        const ins = await fetchJson<{ data: { name: string; values?: { value: number }[]; total_value?: { value: number } }[] }>(INSIGHTS, `${graph()}/${m.id}/insights?${q}`, { retries: 0 });
        metrics = Object.fromEntries(ins.data.map((d) => [d.name, d.total_value?.value ?? d.values?.[0]?.value ?? null]));
        used = set;
        break;
      } catch (e) {
        if (!(e instanceof SourceError) || e.status !== 400) throw e;
      }
    }
    // seguidores conquistados por publicação: métrica 'follows' (disponível em alguns tipos de mídia)
    try {
      const q = new URLSearchParams({ metric: "follows", access_token: token });
      const f = await fetchJson<{ data: { name: string; values?: { value: number }[]; total_value?: { value: number } }[] }>(INSIGHTS, `${graph()}/${m.id}/insights?${q}`, { retries: 0 });
      metrics.follows = f.data[0]?.total_value?.value ?? f.data[0]?.values?.[0]?.value ?? null;
    } catch {
      metrics.follows = null;
    }
    const all = [...METRIC_SETS[0], "follows"];
    out.push({
      id: m.id,
      caption: m.caption ?? null,
      permalink: m.permalink ?? null,
      timestamp: m.timestamp,
      mediaType: m.media_product_type ?? m.media_type ?? null,
      metrics,
      unavailable: all.filter((k) => metrics[k] === undefined || metrics[k] === null || (!used.includes(k) && k !== "follows")),
    });
  }
  return out;
}

import "server-only";
import { fetchJson, type AdapterStatus, type CollectedVideo } from "./types";

/** Hacker News via API pública da Algolia — sinal de notícias de tecnologia ganhando atenção. */
const ID = "hacker_news";

export function hackerNewsStatus(): AdapterStatus {
  return {
    id: ID,
    name: "Hacker News (Algolia)",
    configured: true,
    missing: [],
    howToEnable: "API pública, não requer credenciais.",
    limitations: ["Público majoritariamente técnico e internacional; usado como sinal de notícia, não de vídeo."],
  };
}

interface Hit {
  objectID: string;
  title?: string;
  url?: string;
  author?: string;
  points?: number;
  num_comments?: number;
  created_at_i: number;
}

export const HN_QUERIES = ["AI", "OpenAI", "Anthropic", "LLM", "agents", "startup", "automation", "Google", "Apple", "marketing"];

export async function topStories(hours: number, minPoints = 80): Promise<CollectedVideo[]> {
  const since = Math.floor(Date.now() / 1000) - hours * 3600;
  const seen = new Map<string, CollectedVideo>();
  for (const q of HN_QUERIES) {
    const p = new URLSearchParams({ query: q, tags: "story", numericFilters: `created_at_i>${since},points>${minPoints}`, hitsPerPage: "20" });
    const data = await fetchJson<{ hits: Hit[] }>(ID, `https://hn.algolia.com/api/v1/search?${p}`);
    for (const h of data.hits) {
      if (!h.title || seen.has(h.objectID)) continue;
      seen.set(h.objectID, {
        platform: "web",
        externalId: `hn-${h.objectID}`,
        url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
        title: h.title,
        description: `Discussão: https://news.ycombinator.com/item?id=${h.objectID}`,
        publishedAt: new Date(h.created_at_i * 1000).toISOString(),
        durationSeconds: null,
        thumbnailUrl: null,
        language: "en",
        channel: { externalId: "hacker_news", name: "Hacker News", handle: h.author ?? null, followers: null },
        metrics: {
          views: null,
          likes: h.points ?? null,
          comments: h.num_comments ?? null,
          shares: null,
          saves: null,
          quality: { views: "indisponivel", likes: "observado", comments: "observado", shares: "indisponivel", saves: "indisponivel", followers: "indisponivel" },
        },
        sourceId: ID,
        discoveredVia: "radar_geral",
        searchQuery: q,
        topic: "notícias de tecnologia",
      });
    }
  }
  return [...seen.values()];
}

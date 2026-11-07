import type { MetricQuality } from "@/lib/viral/score";

export type Platform = "instagram" | "tiktok" | "youtube" | "web";

export interface CollectedMetrics {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  quality: Partial<Record<"views" | "likes" | "comments" | "shares" | "saves" | "followers", MetricQuality>>;
}

export interface CollectedVideo {
  platform: Platform;
  externalId: string;
  url: string;
  title: string | null;
  description: string | null;
  publishedAt: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  language: string | null;
  channel: { externalId: string; name: string | null; handle: string | null; followers: number | null };
  metrics: CollectedMetrics;
  sourceId: string;
  discoveredVia: "radar_geral" | "criador_monitorado" | "manual";
  searchQuery?: string | null;
  topic?: string | null;
  creatorId?: string | null;
  extra?: Record<string, unknown>;
}

export interface ChannelBaseline {
  platform: Platform;
  channelExternalId: string;
  sampleSize: number;
  medianViews: number | null;
  meanViews: number | null;
  medianEngagement: number | null;
  method: string;
  sourceId: string;
}

export interface AdapterStatus {
  id: string;
  name: string;
  configured: boolean;
  missing: string[];
  howToEnable: string;
  limitations: string[];
}

export class SourceError extends Error {
  constructor(public sourceId: string, message: string, public status?: number) {
    super(`[${sourceId}] ${message}`);
  }
}

/** fetch com timeout e repetição em erros transitórios (429/5xx). */
export async function fetchJson<T>(
  sourceId: string,
  url: string,
  init: RequestInit & { timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  const { timeoutMs = 20_000, retries = 2, ...rest } = init;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...rest, signal: ctrl.signal, cache: "no-store" });
      const text = await res.text();
      if (!res.ok) {
        const msg = extractError(text) ?? `HTTP ${res.status}`;
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
          continue;
        }
        throw new SourceError(sourceId, msg, res.status);
      }
      return (text ? JSON.parse(text) : {}) as T;
    } catch (e) {
      lastErr = e;
      if (e instanceof SourceError) throw e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw new SourceError(sourceId, lastErr instanceof Error ? lastErr.message : "falha de rede");
}

function extractError(text: string): string | null {
  try {
    const j = JSON.parse(text);
    return j?.error?.message ?? j?.error?.error_user_msg ?? j?.message ?? j?.error ?? null;
  } catch {
    return text ? text.slice(0, 300) : null;
  }
}

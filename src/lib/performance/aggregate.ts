/** Agregados de desempenho das publicações de João (lógica pura, testável). */
export interface PubWithMetrics {
  id: string;
  theme: string | null;
  content_format: string | null;
  hook: string | null;
  reference_creator: string | null;
  published_at: string;
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  follows: number | null;
}

export interface GroupStat {
  key: string;
  count: number;
  avgViews: number | null;
  avgShares: number | null;
  avgFollows: number | null;
  avgEngagementRate: number | null;
}

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null;
};

export function engagementRate(p: PubWithMetrics): number | null {
  const base = p.reach ?? p.views;
  if (!base) return null;
  return ((p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0) + (p.saves ?? 0)) / base;
}

export function groupBy(pubs: PubWithMetrics[], field: "theme" | "content_format" | "reference_creator"): GroupStat[] {
  const groups = new Map<string, PubWithMetrics[]>();
  for (const p of pubs) {
    const k = p[field] ?? "não informado";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(p);
  }
  return [...groups.entries()]
    .map(([key, ps]) => ({
      key,
      count: ps.length,
      avgViews: avg(ps.map((p) => p.views)),
      avgShares: avg(ps.map((p) => p.shares)),
      avgFollows: avg(ps.map((p) => p.follows)),
      avgEngagementRate: avg(ps.map((p) => {
        const e = engagementRate(p);
        return e === null ? null : Math.round(e * 10000) / 10000;
      })),
    }))
    .sort((a, b) => (b.avgViews ?? 0) - (a.avgViews ?? 0));
}

export function aggregatePerformance(pubs: PubWithMetrics[]) {
  return {
    sample: pubs.length,
    byTheme: groupBy(pubs, "theme"),
    byFormat: groupBy(pubs, "content_format"),
    byReferenceCreator: groupBy(pubs, "reference_creator"),
    topByShares: [...pubs].sort((a, b) => (b.shares ?? -1) - (a.shares ?? -1)).slice(0, 5).map((p) => ({ id: p.id, hook: p.hook, theme: p.theme, shares: p.shares })),
    topByFollows: [...pubs].sort((a, b) => (b.follows ?? -1) - (a.follows ?? -1)).slice(0, 5).map((p) => ({ id: p.id, hook: p.hook, theme: p.theme, follows: p.follows })),
    bottomByViews: [...pubs].filter((p) => p.views !== null).sort((a, b) => (a.views ?? 0) - (b.views ?? 0)).slice(0, 5).map((p) => ({ id: p.id, hook: p.hook, theme: p.theme, views: p.views })),
  };
}

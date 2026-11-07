import { describe, expect, it, vi } from "vitest";
import { aggregatePerformance, engagementRate } from "@/lib/performance/aggregate";

vi.mock("@/lib/supabase/admin", () => ({ adminClient: () => ({}) }));

const pub = (id: string, theme: string, views: number | null, shares: number | null) => ({
  id, theme, content_format: "talking_head", hook: `gancho ${id}`, reference_creator: null, published_at: "2026-11-01T10:00:00Z",
  views, reach: views, likes: 10, comments: 2, shares, saves: 1, follows: 3,
});

describe("desempenho de João", () => {
  it("agrega por tema e ordena por média de views", () => {
    const a = aggregatePerformance([pub("1", "agentes", 10000, 50), pub("2", "agentes", 20000, 70), pub("3", "dados", 3000, 5)]);
    expect(a.sample).toBe(3);
    expect(a.byTheme[0]).toMatchObject({ key: "agentes", count: 2, avgViews: 15000, avgShares: 60 });
    expect(a.bottomByViews[0].id).toBe("3");
    expect(a.topByShares[0].id).toBe("2");
  });
  it("taxa de engajamento indisponível sem alcance/views", () => {
    expect(engagementRate(pub("x", "t", null, null))).toBeNull();
    expect(engagementRate(pub("x", "t", 100, 0))).toBeCloseTo(0.13);
  });
});

describe("regra de entrada de criadores", () => {
  it("mínimo de 40 mil seguidores", async () => {
    const { classifyFollowers } = await import("@/lib/creators/validate");
    expect(classifyFollowers(40000, 40000)).toBe("validado");
    expect(classifyFollowers(39999, 40000)).toBe("abaixo_minimo");
  });
});

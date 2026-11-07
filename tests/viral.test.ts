import { describe, expect, it } from "vitest";
import { computeViral, median, selectTop } from "@/lib/viral/score";

const base = { likes: null, comments: null, shares: null, followers: null, basis: "views" as const, relevance: 0.3, previous: null };

describe("índice de viralização", () => {
  it("exemplo do briefing: média de 20 mil e vídeo com 400 mil = 20x → viral confirmado", () => {
    const r = computeViral({ ...base, views: 400_000, baselineMedian: 20_000, baselineSample: 12, ageHours: 30 });
    expect(r.viralIndex).toBe(20);
    expect(r.classification).toBe("viral_confirmado");
    expect(r.quality).toBe("observado");
  });

  it("muitas visualizações absolutas, mas no padrão do criador, NÃO é viral", () => {
    const r = computeViral({ ...base, views: 2_000_000, baselineMedian: 1_900_000, baselineSample: 20, ageHours: 100 });
    expect(r.classification).not.toBe("viral_confirmado");
    expect(r.classification).not.toBe("muito_acima_media");
  });

  it("sem histórico suficiente usa estimativa por seguidores e marca como estimado (nunca viral confirmado)", () => {
    const r = computeViral({ ...base, views: 1_000_000, followers: 50_000, baselineMedian: 30_000, baselineSample: 2, ageHours: 20 });
    expect(r.quality).toBe("estimado");
    expect(r.classification).toBe("muito_acima_media");
  });

  it("sem dados de base nem seguidores → indisponível", () => {
    const r = computeViral({ ...base, views: 1_000, baselineMedian: null, baselineSample: 0, ageHours: 10 });
    expect(r.quality).toBe("indisponivel");
    expect(r.viralIndex).toBeNull();
  });

  it("detecta crescimento acelerado entre coletas", () => {
    const r = computeViral({ ...base, views: 30_000, baselineMedian: 20_000, baselineSample: 10, ageHours: 6, previous: { value: 5_000, hoursAgo: 3 } });
    expect(r.classification).toBe("crescimento_acelerado");
  });

  it("Instagram sem views usa engajamento como base", () => {
    const r = computeViral({ ...base, basis: "engajamento", views: null, likes: 90_000, comments: 10_000, baselineMedian: 5_000, baselineSample: 12, ageHours: 40 });
    expect(r.viralIndex).toBe(20);
    expect(r.classification).toBe("viral_confirmado");
  });

  it("pontuação fica entre 0 e 100", () => {
    const r = computeViral({ ...base, views: 1e9, likes: 1e8, comments: 1e7, shares: 1e7, baselineMedian: 1, baselineSample: 10, ageHours: 1, relevance: 1 });
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.score).toBeGreaterThan(90);
  });

  it("mediana", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it("selectTop respeita diversidade por canal e ignora quem não atinge critério", () => {
    const items = [
      { score: 90, classification: "viral_confirmado" as const, channelKey: "a" },
      { score: 89, classification: "viral_confirmado" as const, channelKey: "a" },
      { score: 88, classification: "viral_confirmado" as const, channelKey: "a" },
      { score: 70, classification: "abaixo_do_criterio" as const, channelKey: "b" },
      { score: 60, classification: "estrategico" as const, channelKey: "c" },
    ];
    const top = selectTop(items, 10, 2);
    expect(top.map((t) => t.score)).toEqual([90, 89, 60]);
  });
});

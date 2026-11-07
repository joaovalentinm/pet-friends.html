import { describe, expect, it } from "vitest";
import { computeOpportunityScore, referencePerformanceScore, relativePerformanceScore, type CriterionKey, type CriterionScore } from "@/lib/scoring/opportunity";
import { ideaDedupeKey, findNearDuplicate, scriptContentHash } from "@/lib/dedupe";
import { termSignals, suggestStatus } from "@/lib/trends/signals";
import { localDate } from "@/lib/time";

const ia = (v: number): CriterionScore => ({ value: v, justification: "x", origin: "ia" });

describe("pontuação de oportunidades", () => {
  it("tudo 10 → 100; tudo 0 → 0", () => {
    const all = (v: number) =>
      Object.fromEntries(
        ["desempenho_referencia", "desempenho_relativo", "potencial_alcance", "relevancia_publico", "atualidade", "potencial_compartilhamento", "originalidade_adaptacao", "facilidade_producao"].map((k) => [k, ia(v)]),
      ) as Record<CriterionKey, CriterionScore>;
    expect(computeOpportunityScore(all(10)).total).toBe(100);
    expect(computeOpportunityScore(all(0)).total).toBe(0);
  });

  it("renormaliza e sinaliza quando faltam dados da referência", () => {
    const s = {
      desempenho_referencia: { value: null, justification: "", origin: "dados" },
      desempenho_relativo: { value: null, justification: "", origin: "dados" },
      potencial_alcance: ia(8), relevancia_publico: ia(8), atualidade: ia(8), potencial_compartilhamento: ia(8), originalidade_adaptacao: ia(8), facilidade_producao: ia(8),
    } as Record<CriterionKey, CriterionScore>;
    const r = computeOpportunityScore(s);
    expect(r.total).toBe(80);
    expect(r.renormalized).toBe(true);
    expect(r.excluded).toEqual(["desempenho_referencia", "desempenho_relativo"]);
  });

  it("escalas de dados", () => {
    expect(referencePerformanceScore(null, null).value).toBeNull();
    expect(referencePerformanceScore(1_000_000, null).value).toBeCloseTo(6.3, 1);
    expect(relativePerformanceScore(1, "observado").value).toBe(0);
    expect(relativePerformanceScore(30, "observado").value).toBe(10);
    expect(relativePerformanceScore(30, "estimado").value).toBe(6);
  });
});

describe("deduplicação", () => {
  it("chaves estáveis independentemente de acentos e caixa", () => {
    expect(ideaDedupeKey("2026-11-07", "v1", "Agentes de IA", "Pequenas empresas")).toBe(ideaDedupeKey("2026-11-07", "v1", "agentes de ia!", "pequenas  EMPRESAS"));
    expect(scriptContentHash("A", "B")).toHaveLength(64);
  });
  it("detecta título quase duplicado", () => {
    expect(findNearDuplicate("Como agentes de IA vão mudar pequenas empresas", ["Agentes de IA vão mudar as pequenas empresas"])).not.toBeNull();
    expect(findNearDuplicate("Golpe do Pix com voz clonada", ["Agentes de IA para vendas"])).toBeNull();
  });
});

describe("sinais de tendência", () => {
  const now = new Date("2026-11-07T10:00:00Z");
  const h = (hours: number) => new Date(now.getTime() - hours * 3_600_000);
  it("detecta termo crescendo em vários criadores", () => {
    const docs = [
      { id: "1", text: "Sora 3 chegou e é assustador", publishedAt: h(5), channelKey: "a", views: 100 },
      { id: "2", text: "Testei o Sora 3 no meu negócio", publishedAt: h(10), channelKey: "b", views: 200 },
      { id: "3", text: "Sora 3: o que muda pro marketing", publishedAt: h(20), channelKey: "c", views: 300 },
      { id: "4", text: "Planilha de vendas no Excel", publishedAt: h(100), channelKey: "d", views: 50 },
    ];
    const s = termSignals(docs, { now });
    const sora = s.find((t) => t.term === "sora");
    expect(sora?.distinctCreators).toBe(3);
    expect(sora?.growth).toBeGreaterThan(1.5);
    expect(sora?.suggestedStatus).toBe("em_crescimento");
  });
  it("status sugerido", () => {
    expect(suggestStatus(2, 3)).toBe("emergente");
    expect(suggestStatus(12, 1)).toBe("saturada");
    expect(suggestStatus(7, 2)).toBe("em_alta");
  });
});

describe("fuso horário", () => {
  it("07h em São Paulo = 10h UTC (data local correta perto da meia-noite)", () => {
    expect(localDate(new Date("2026-11-07T02:30:00Z"))).toBe("2026-11-06");
    expect(localDate(new Date("2026-11-07T10:00:00Z"))).toBe("2026-11-07");
  });
});

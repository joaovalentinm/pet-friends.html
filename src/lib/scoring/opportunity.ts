/**
 * PONTUAÇÃO DE OPORTUNIDADES (0..100)
 *
 * Os dois primeiros critérios vêm de DADOS (métricas coletadas); os demais são
 * avaliações da IA (0..10) com justificativa. Quando um critério de dados não pode
 * ser calculado, ele é excluído e os pesos são renormalizados — e isso fica explícito.
 * A nota indica potencial estimado, nunca resultado garantido.
 */

export const CRITERIA = {
  desempenho_referencia: { label: "Desempenho da referência", weight: 15, origin: "dados" },
  desempenho_relativo: { label: "Desempenho relativo do vídeo", weight: 15, origin: "dados" },
  potencial_alcance: { label: "Potencial de alcance", weight: 15, origin: "ia" },
  relevancia_publico: { label: "Relevância para o público de João", weight: 15, origin: "ia" },
  atualidade: { label: "Atualidade", weight: 10, origin: "ia" },
  potencial_compartilhamento: { label: "Potencial de compartilhamento", weight: 10, origin: "ia" },
  originalidade_adaptacao: { label: "Originalidade da adaptação", weight: 10, origin: "ia" },
  facilidade_producao: { label: "Facilidade de produção", weight: 10, origin: "ia" },
} as const;

export type CriterionKey = keyof typeof CRITERIA;

export interface CriterionScore {
  value: number | null; // 0..10, null = indisponível
  justification: string;
  origin: "dados" | "ia";
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Desempenho absoluto da referência → 0..10 (escala log: 10 mil = 2, 1 milhão = 6, 30 milhões = 10). */
export function referencePerformanceScore(views: number | null, engagement: number | null): CriterionScore {
  if (views && views > 0) {
    const v = clamp(((Math.log10(views) - 3.5) / (7.5 - 3.5)) * 10, 0, 10);
    return { value: Math.round(v * 10) / 10, justification: `${views.toLocaleString("pt-BR")} visualizações observadas`, origin: "dados" };
  }
  if (engagement && engagement > 0) {
    const v = clamp(((Math.log10(engagement) - 2) / (6 - 2)) * 10, 0, 10);
    return { value: Math.round(v * 10) / 10, justification: `${engagement.toLocaleString("pt-BR")} interações observadas (views indisponíveis)`, origin: "dados" };
  }
  return { value: null, justification: "sem métricas da referência", origin: "dados" };
}

/** Desempenho relativo (índice de viralização) → 0..10 (1x = 0, 30x+ = 10). */
export function relativePerformanceScore(viralIndex: number | null, quality: string | null): CriterionScore {
  if (viralIndex === null || viralIndex === undefined) {
    return { value: null, justification: "índice de viralização indisponível", origin: "dados" };
  }
  const v = viralIndex <= 1 ? 0 : clamp((Math.log10(viralIndex) / Math.log10(30)) * 10, 0, 10);
  const adj = quality === "estimado" ? v * 0.6 : v;
  return {
    value: Math.round(adj * 10) / 10,
    justification: `${viralIndex}x o padrão do criador${quality === "estimado" ? " (base estimada, peso reduzido)" : ""}`,
    origin: "dados",
  };
}

export function computeOpportunityScore(scores: Record<CriterionKey, CriterionScore>): {
  total: number;
  renormalized: boolean;
  excluded: CriterionKey[];
} {
  let weighted = 0;
  let weightSum = 0;
  const excluded: CriterionKey[] = [];
  for (const key of Object.keys(CRITERIA) as CriterionKey[]) {
    const s = scores[key];
    const w = CRITERIA[key].weight;
    if (!s || s.value === null || Number.isNaN(s.value)) {
      excluded.push(key);
      continue;
    }
    weighted += (clamp(s.value, 0, 10) / 10) * w;
    weightSum += w;
  }
  const total = weightSum ? Math.round((weighted / weightSum) * 100) : 0;
  return { total, renormalized: excluded.length > 0, excluded };
}

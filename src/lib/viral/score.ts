/**
 * ÍNDICE DE VIRALIZAÇÃO
 *
 * O desempenho de um vídeo é comparado ao padrão habitual do próprio criador
 * (mediana de visualizações dos vídeos recentes do canal). Visualizações absolutas
 * nunca bastam para chamar um vídeo de viral.
 *
 * Qualidade do dado:
 *  - observado: índice calculado com métricas públicas coletadas + base histórica real do canal.
 *  - estimado: sem base histórica suficiente; usamos uma expectativa derivada dos seguidores.
 *  - indisponivel: não há dados para calcular.
 */

export type MetricQuality = "observado" | "estimado" | "indisponivel";
export type ViralClass =
  | "viral_confirmado"
  | "muito_acima_media"
  | "crescimento_acelerado"
  | "trend_emergente"
  | "estrategico"
  | "abaixo_do_criterio";

export interface ViralInput {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  followers: number | null;
  /** mediana de views (ou de engajamento, quando basis = 'engajamento') do criador */
  baselineMedian: number | null;
  baselineSample: number;
  /** base de comparação: views (YouTube/TikTok) ou engajamento (Instagram sem views públicas) */
  basis: "views" | "engajamento";
  ageHours: number | null;
  previous?: { value: number; hoursAgo: number } | null;
  /** 0..1 — aderência temática ao radar/posicionamento */
  relevance: number;
  windowHours?: number;
}

export interface ViralResult {
  viralIndex: number | null;
  velocityPerHour: number | null;
  engagementRate: number | null;
  score: number;
  classification: ViralClass;
  quality: MetricQuality;
  explanation: {
    basis: "views" | "engajamento";
    observedValue: number | null;
    baselineMedian: number | null;
    baselineSample: number;
    baselineMethod: string;
    components: Record<string, number>;
    reasons: string[];
  };
}

export const MIN_BASELINE_SAMPLE = 5;
/** Expectativa conservadora de views por seguidor em vídeo curto, usada apenas como ESTIMATIVA. */
export const EST_VIEWS_PER_FOLLOWER = 0.1;
/** Expectativa conservadora de engajamento por seguidor (Instagram), apenas ESTIMATIVA. */
export const EST_ENGAGEMENT_PER_FOLLOWER = 0.01;

const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

export function median(values: number[]): number | null {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export function computeViral(input: ViralInput): ViralResult {
  const reasons: string[] = [];
  const engagementSum =
    input.likes === null && input.comments === null && input.shares === null
      ? null
      : (input.likes ?? 0) + (input.comments ?? 0) + (input.shares ?? 0);
  const observed = input.basis === "views" ? input.views : engagementSum;

  // 1) base de comparação
  let baseline: number | null = null;
  let quality: MetricQuality = "indisponivel";
  let baselineMethod = "indisponível";
  if (input.baselineMedian && input.baselineMedian > 0 && input.baselineSample >= MIN_BASELINE_SAMPLE) {
    baseline = input.baselineMedian;
    quality = "observado";
    baselineMethod = `mediana de ${input.baselineSample} publicações recentes do criador`;
  } else if (input.followers && input.followers > 0) {
    baseline = input.followers * (input.basis === "views" ? EST_VIEWS_PER_FOLLOWER : EST_ENGAGEMENT_PER_FOLLOWER);
    quality = "estimado";
    baselineMethod =
      input.basis === "views"
        ? `estimativa: ${EST_VIEWS_PER_FOLLOWER * 100}% dos seguidores (sem histórico suficiente)`
        : `estimativa: ${EST_ENGAGEMENT_PER_FOLLOWER * 100}% dos seguidores em interações (sem histórico suficiente)`;
  }

  const viralIndex = observed !== null && baseline ? observed / baseline : null;
  if (observed === null) reasons.push("métrica principal indisponível na fonte");

  // 2) velocidade
  const age = input.ageHours !== null ? Math.max(1, input.ageHours) : null;
  const velocityPerHour = observed !== null && age ? observed / age : null;
  let hourlyGrowth: number | null = null;
  if (input.previous && observed !== null && input.previous.hoursAgo > 0) {
    hourlyGrowth = Math.max(0, (observed - input.previous.value) / input.previous.hoursAgo);
  }
  const growthRef = baseline ? baseline / 48 : null; // ritmo "normal": atingir a mediana em 48h
  const growthSignal = hourlyGrowth ?? velocityPerHour;
  const relVelocity = growthSignal !== null && growthRef ? growthSignal / growthRef : null;

  // 3) engajamento
  const engagementRate =
    engagementSum !== null && input.views && input.views > 0
      ? engagementSum / input.views
      : engagementSum !== null && input.followers
        ? engagementSum / input.followers
        : null;

  // 4) pontuação composta (0..100)
  const window = input.windowHours ?? 168;
  const c = {
    desempenho_relativo: viralIndex && viralIndex > 1 ? clamp(Math.log10(viralIndex) / Math.log10(30)) * 40 : 0,
    velocidade: relVelocity ? clamp(Math.log10(1 + relVelocity) / Math.log10(11)) * 20 : 0,
    engajamento: engagementRate !== null ? clamp(engagementRate / (input.basis === "views" ? 0.1 : 0.05)) * 15 : 0,
    atualidade: age !== null ? clamp(1 - Math.max(0, age - 24) / Math.max(1, window - 24)) * 10 : 0,
    relevancia: clamp(input.relevance) * 15,
  };
  // métrica estimada vale menos que observada
  if (quality === "estimado") c.desempenho_relativo *= 0.6;
  const score = round(Object.values(c).reduce((a, b) => a + b, 0), 1);

  // 5) classificação
  let classification: ViralClass = "abaixo_do_criterio";
  const minAbsolute = input.basis === "views" ? 50_000 : 5_000;
  const accelerating = relVelocity !== null && relVelocity >= 4 && (age === null || age <= 72);
  if (viralIndex !== null && viralIndex >= 10 && quality === "observado" && (observed ?? 0) >= minAbsolute) {
    classification = "viral_confirmado";
    reasons.push(`${round(viralIndex, 1)}x a mediana do criador (${baselineMethod})`);
  } else if (viralIndex !== null && viralIndex >= 3) {
    classification = "muito_acima_media";
    reasons.push(`${round(viralIndex, 1)}x a referência do criador${quality === "estimado" ? " (base estimada)" : ""}`);
  } else if (accelerating) {
    classification = "crescimento_acelerado";
    reasons.push(`ritmo ${round(relVelocity!, 1)}x acima do normal do criador${hourlyGrowth !== null ? " entre coletas" : " desde a publicação"}`);
  } else if (input.relevance >= 0.7) {
    classification = "estrategico";
    reasons.push("métricas dentro do padrão, mas tema altamente aderente ao posicionamento");
  } else {
    reasons.push(viralIndex !== null ? `apenas ${round(viralIndex, 2)}x a referência do criador` : "sem base comparativa suficiente");
  }

  return {
    viralIndex: viralIndex !== null ? round(viralIndex, 2) : null,
    velocityPerHour: velocityPerHour !== null ? round(velocityPerHour, 1) : null,
    engagementRate: engagementRate !== null ? round(engagementRate, 4) : null,
    score,
    classification,
    quality,
    explanation: {
      basis: input.basis,
      observedValue: observed,
      baselineMedian: baseline !== null ? round(baseline, 1) : null,
      baselineSample: input.baselineSample,
      baselineMethod,
      components: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, round(v, 1)])),
      reasons,
    },
  };
}

/** Relevância temática simples por palavras-chave (0..1). A IA refina depois. */
export function keywordRelevance(text: string, keywords: string[]): number {
  const t = text.toLowerCase();
  const hits = keywords.filter((k) => t.includes(k.toLowerCase())).length;
  return Math.min(1, hits / 3);
}

export const RELEVANCE_KEYWORDS = [
  "ia", " ai", "inteligência artificial", "inteligencia artificial", "chatgpt", "gpt", "claude", "gemini", "agente", "agent",
  "automação", "automacao", "automation", "n8n", "marketing", "tráfego", "trafego", "vendas", "sales", "empresa", "negócio",
  "negocio", "business", "startup", "produtividade", "productivity", "dados", "data", "tecnologia", "tech", "ferramenta",
  "tool", "social media", "instagram", "conteúdo", "conteudo", "empreendedor", "cibersegurança", "seguranca", "futuro do trabalho",
];

/**
 * Seleciona o Top N com diversidade (no máximo `perChannel` vídeos por canal) entre os
 * candidatos que atingiram algum critério de destaque.
 */
export function selectTop<T extends { score: number; classification: ViralClass; channelKey: string }>(
  items: T[],
  n = 10,
  perChannel = 2,
): T[] {
  const eligible = items.filter((i) => i.classification !== "abaixo_do_criterio").sort((a, b) => b.score - a.score);
  const out: T[] = [];
  const perCount = new Map<string, number>();
  for (const it of eligible) {
    const c = perCount.get(it.channelKey) ?? 0;
    if (c >= perChannel) continue;
    out.push(it);
    perCount.set(it.channelKey, c + 1);
    if (out.length >= n) break;
  }
  return out;
}

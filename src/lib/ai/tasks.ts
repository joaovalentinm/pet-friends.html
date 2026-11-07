import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { aiParse } from "./client";
import {
  VideoAnalysisSchema, Top10AnnotationSchema, StrategicAnalysisSchema, TrendsSchema, IdeasSchema, ScriptSchema, LearningsSchema,
  type IdeasOutput,
} from "./schemas";

/** Dados de um vídeo enviados à IA — apenas o que foi realmente coletado. */
export interface VideoBrief {
  id: string;
  platform: string;
  url: string;
  creator: string | null;
  followers: number | null;
  published_at: string | null;
  title: string | null;
  description: string | null;
  duration_seconds: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  viral_index: number | null;
  viral_quality: string | null;
  classification: string | null;
  baseline_method?: string | null;
  topic?: string | null;
}

const j = (x: unknown) => JSON.stringify(x, null, 1);

// ------------------------------------------------------------------ Engenharia reversa
export async function analyzeVideo(input: {
  video: VideoBrief;
  transcript: string | null;
  thumbnailUrl: string | null;
  runId?: string | null;
}) {
  const content: Anthropic.Beta.Messages.BetaContentBlockParam[] = [];
  if (input.thumbnailUrl) {
    content.push({ type: "image", source: { type: "url", url: input.thumbnailUrl } });
  }
  content.push({
    type: "text",
    text:
      `Faça a engenharia reversa deste conteúdo.\n\nDADOS COLETADOS:\n${j(input.video)}\n\n` +
      (input.transcript
        ? `TRANSCRIÇÃO (fonte autorizada):\n${input.transcript.slice(0, 30000)}`
        : "TRANSCRIÇÃO: indisponível. Não há acesso ao áudio/vídeo; análises de fala, ritmo e edição são hipóteses.") +
      (input.thumbnailUrl ? "\n\nA imagem anexada é a miniatura pública do vídeo." : "\n\nMiniatura: indisponível."),
  });
  return aiParse({
    purpose: "engenharia_reversa",
    runId: input.runId,
    schema: VideoAnalysisSchema,
    maxTokens: 12000,
    instructions: `Tarefa: engenharia reversa de vídeo curto.
Para cada campo, preencha "value" e marque "type":
- "evidencia" quando o ponto está visível nos dados fornecidos (título, descrição, transcrição, miniatura, métricas);
- "hipotese" quando é inferência sua;
- "indisponivel" quando não há como avaliar.
Explique por que o conteúdo pode ter funcionado e qual MECANISMO de atenção pode ser transferido para João,
com 2 a 3 ideias de adaptação originais (outro assunto, mesma estrutura de atenção, aplicação a negócios).
Em "limitations" descreva quais insumos faltaram.`,
    content,
  });
}

// ------------------------------------------------------------------ Top 10: anotação + análise
export async function annotateCandidates(candidates: VideoBrief[], runId: string) {
  return aiParse({
    purpose: "top10_anotacao",
    runId,
    schema: Top10AnnotationSchema,
    maxTokens: 16000,
    instructions: `Tarefa: anotar candidatos do Radar Viral.
Para CADA candidato (use exatamente o "id" recebido), informe:
- relevance (0 a 1): aderência ao universo de IA, tecnologia, marketing, negócios digitais, automação, produtividade,
  inovação ou transformação digital, e utilidade para o posicionamento de João. Entretenimento sem relação = abaixo de 0.2.
- subject: assunto principal em poucas palavras.
- hook: gancho provável (type "evidencia" se aparece no título/descrição; senão "hipotese").
- content_format: formato provável.
- selection_reason: por que merece atenção, citando métricas fornecidas (índice, views, idade). Não invente números.
- adaptation_potential: como João poderia adaptar o mecanismo (sem copiar).
- adaptation_score (0 a 100): potencial de adaptação para João.`,
    content: `CANDIDATOS:\n${j(candidates)}`,
  });
}

export async function strategicAnalysis(top: VideoBrief[], annotations: unknown, foundCount: number, runId: string) {
  return aiParse({
    purpose: "top10_analise_estrategica",
    runId,
    schema: StrategicAnalysisSchema,
    maxTokens: 8000,
    instructions: `Tarefa: análise estratégica do Top viral do dia para João.
Identifique padrões, ganchos e formatos em comum, oportunidades concretas para João e alertas (ex.: temas saturados,
riscos de parecer genérico). Em data_caveats, explique limitações dos dados (métricas indisponíveis, estimativas,
quantidade encontrada = ${foundCount}${foundCount < 10 ? ", abaixo de 10" : ""}).`,
    content: `TOP DO DIA:\n${j(top)}\n\nANOTAÇÕES:\n${j(annotations)}`,
  });
}

// ------------------------------------------------------------------ Tendências
export async function detectTrends(input: { signals: unknown; videos: VideoBrief[]; news: VideoBrief[]; audios: unknown; previousTrends: unknown; runId: string }) {
  return aiParse({
    purpose: "radar_tendencias",
    runId: input.runId,
    schema: TrendsSchema,
    maxTokens: 16000,
    instructions: `Tarefa: Radar de Tendências.
Você recebe sinais quantitativos (termos com crescimento entre períodos e número de criadores distintos), vídeos recentes,
notícias de tecnologia, áudios recorrentes (quando houver) e as tendências do dia anterior.
Identifique de 4 a 10 tendências reais: assuntos repetidos, formatos replicados, ganchos que aparecem em vários criadores,
notícias ganhando atenção, ferramentas de IA em destaque, temas que geram comentários.
Regras:
- Use status coerente com os sinais: emergente (poucos criadores, crescendo), em_crescimento, em_alta, saturada.
- Priorize janelas curtas de publicação, mas NÃO recomende gravar (record_now=false) só porque está popular:
  precisa fazer sentido para a identidade de João (identity_fit 0 a 100).
- evidence_ids: SOMENTE ids presentes nos dados recebidos. Sem evidência, não crie a tendência.
- growth_note: cite os números de crescimento fornecidos; se não houver dados de velocidade, diga isso.`,
    content: `SINAIS:\n${j(input.signals)}\n\nVÍDEOS RECENTES:\n${j(input.videos)}\n\nNOTÍCIAS:\n${j(input.news)}\n\nÁUDIOS RECORRENTES:\n${j(input.audios)}\n\nTENDÊNCIAS DE ONTEM:\n${j(input.previousTrends)}`,
  });
}

// ------------------------------------------------------------------ Ideias do dia
export async function selectIdeas(input: {
  candidates: VideoBrief[];
  trends: unknown;
  news: VideoBrief[];
  learnings: unknown;
  recentHeadlines: string[];
  pillars: string[];
  runId: string;
}): Promise<IdeasOutput> {
  return aiParse({
    purpose: "selecao_ideias",
    runId: input.runId,
    schema: IdeasSchema,
    maxTokens: 16000,
    effort: "high",
    instructions: `Tarefa: escolher as 5 melhores oportunidades de conteúdo de hoje para João.
Fontes: Top viral, tendências, conteúdos de criadores monitorados, notícias e aprendizados do desempenho de João.
Distribuição editorial orientativa (slot 1 a 5): ${input.pillars.map((p, i) => `${i + 1}. ${p}`).join("; ")}.
Se houver oportunidade extraordinária em outro tema, priorize-a e explique em pillar_override_reason (senão null).
Regras:
- Nada de assuntos aleatórios: cada ideia deve nascer de um sinal recebido (reference_id = id de um vídeo/notícia recebido,
  ou trend_slug de uma tendência recebida). Use null apenas se a ideia vier exclusivamente da outra fonte.
- Transforme o mecanismo de atenção em conteúdo original: outro assunto ou outro ângulo, aplicado a negócios.
- Não repita assuntos já produzidos recentemente (lista abaixo).
- Diversifique assuntos e formatos entre os 5.
- Notas 0 a 10 com justificativa curta para cada critério. Seja crítico: 9-10 só para casos excepcionais.`,
    content:
      `CANDIDATOS (Top viral e criadores monitorados):\n${j(input.candidates)}\n\nTENDÊNCIAS:\n${j(input.trends)}\n\n` +
      `NOTÍCIAS:\n${j(input.news)}\n\nAPRENDIZADOS DO DESEMPENHO DE JOÃO:\n${j(input.learnings ?? "sem dados suficientes ainda")}\n\n` +
      `ROTEIROS JÁ PRODUZIDOS NOS ÚLTIMOS 30 DIAS (evite repetir):\n${j(input.recentHeadlines)}`,
  });
}

// ------------------------------------------------------------------ Roteiro completo
export async function writeScript(input: { idea: unknown; reference: VideoBrief | null; referenceAnalysis: unknown; learnings: unknown; runId: string }) {
  return aiParse({
    purpose: "roteiro",
    runId: input.runId,
    schema: ScriptSchema,
    maxTokens: 16000,
    effort: "high",
    instructions: `Tarefa: escrever um roteiro completo, original e pronto para gravação de um vídeo curto (Reels/Shorts/TikTok) de João.
Requisitos:
- hook: a primeira frase falada (até ~3 segundos), forte, específica, sem introdução.
- full_script: a FALA COMPLETA, palavra por palavra, do primeiro ao último segundo, no jeito de João falar. Marque pausas com "—"
  e quebras de cena com linha em branco. Nada de tópicos: é o texto que ele vai ler/decorar.
- development e examples: o miolo do argumento; exemplos concretos do dia a dia de pequenas e médias empresas.
  Exemplos hipotéticos devem soar como hipotéticos. Não invente estatísticas nem atribua números a fontes.
- scenes: sequência de cenas com marcação de tempo ("0-3s", "3-10s"...), tipo (camera, tela, apoio, demonstracao, texto).
- on_screen_text: textos na tela com tempo.
- editing_notes: cortes, zoom, ritmo, trilha, onde acelerar.
- cta: chamada final natural (sem "deixa o like").
- duration_seconds: realista para a fala (≈ 2,5 palavras por segundo).
- recording_direction: se fala para a câmera, se precisa gravação de tela, imagens de apoio, demonstração de ferramenta
  (qual e o que mostrar), onde inserir cortes, como legendar e como manter a atenção.
O mecanismo de viralização da referência pode ser aproveitado; texto, argumento e exemplos devem ser próprios.`,
    content:
      `IDEIA ESCOLHIDA:\n${j(input.idea)}\n\nREFERÊNCIA:\n${j(input.reference ?? "sem vídeo de referência (ideia nascida de tendência/notícia)")}\n\n` +
      `ANÁLISE DA REFERÊNCIA (se houver):\n${j(input.referenceAnalysis ?? "indisponível")}\n\nAPRENDIZADOS DE DESEMPENHO:\n${j(input.learnings ?? "sem dados suficientes ainda")}`,
  });
}

// ------------------------------------------------------------------ Aprendizados de desempenho
export async function learnFromPerformance(aggregates: unknown, publications: unknown) {
  return aiParse({
    purpose: "aprendizados_desempenho",
    schema: LearningsSchema,
    maxTokens: 8000,
    instructions: `Tarefa: aprender com os resultados das publicações de João.
Use SOMENTE os dados fornecidos. Marque "evidencia" quando houver números que sustentam a conclusão e "hipotese" quando a amostra
for pequena ou a relação não for clara. Identifique temas que atraem público, ganchos que funcionam, formatos com mais alcance,
o que gera compartilhamentos, o que atrai empresários e o que não funcionou. Termine com recomendações práticas para os próximos roteiros.`,
    content: `AGREGADOS:\n${j(aggregates)}\n\nPUBLICAÇÕES:\n${j(publications)}`,
  });
}

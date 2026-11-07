import { z } from "zod";

/** Observação com nível de evidência: o que foi visto nos dados vs. o que é hipótese da IA. */
export const Obs = z.object({
  value: z.string(),
  type: z.enum(["evidencia", "hipotese", "indisponivel"]),
});

import { CONTENT_FORMATS } from "@/lib/constants";
export { CONTENT_FORMATS };

export const VideoAnalysisSchema = z.object({
  formats: z.array(z.enum(CONTENT_FORMATS)),
  hook_first_3s: Obs,
  headline: Obs,
  promise: Obs,
  curiosity: Obs,
  problem: Obs,
  narrative_structure: Obs,
  development: Obs,
  examples: Obs,
  arguments: Obs,
  expectation_breaks: Obs,
  retention_strategies: z.array(Obs),
  cta: Obs,
  duration_assessment: Obs,
  rhythm: Obs,
  editing: Obs,
  visual_elements: Obs,
  language: Obs,
  why_it_worked: z.array(Obs),
  attention_mechanism: z.string(),
  adaptation_ideas: z.array(
    z.object({ title: z.string(), angle: z.string(), how_mechanism_transfers: z.string() }),
  ),
  limitations: z.string(),
});
export type VideoAnalysis = z.infer<typeof VideoAnalysisSchema>;

export const Top10AnnotationSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      relevance: z.number(),
      subject: z.string(),
      hook: Obs,
      content_format: z.enum(CONTENT_FORMATS),
      selection_reason: z.string(),
      adaptation_potential: z.string(),
      adaptation_score: z.number(),
    }),
  ),
});

export const StrategicAnalysisSchema = z.object({
  summary: z.string(),
  patterns: z.array(z.string()),
  common_hooks: z.array(z.string()),
  common_formats: z.array(z.string()),
  opportunities_for_joao: z.array(z.string()),
  watch_outs: z.array(z.string()),
  data_caveats: z.string(),
});
export type StrategicAnalysis = z.infer<typeof StrategicAnalysisSchema>;

export const TrendsSchema = z.object({
  trends: z.array(
    z.object({
      title: z.string(),
      signal_type: z.enum(["assunto", "audio", "formato", "gancho", "noticia", "ferramenta", "tema_engajamento"]),
      status: z.enum(["emergente", "em_crescimento", "em_alta", "saturada"]),
      what_is_happening: z.string(),
      why_people_consume: z.string(),
      working_format: z.string(),
      adaptation: z.string(),
      record_now: z.boolean(),
      record_now_reason: z.string(),
      identity_fit: z.number(),
      evidence_ids: z.array(z.string()),
      growth_note: z.string(),
    }),
  ),
});
export type TrendsOutput = z.infer<typeof TrendsSchema>;

const AiCriterion = z.object({ value: z.number(), justification: z.string() });

export const IdeasSchema = z.object({
  ideas: z.array(
    z.object({
      slot: z.number(),
      editorial_pillar: z.string(),
      pillar_override_reason: z.string().nullable(),
      reference_id: z.string().nullable(),
      trend_slug: z.string().nullable(),
      subject: z.string(),
      angle: z.string(),
      audience: z.string(),
      pain_or_curiosity: z.string(),
      why_for_joao: z.string(),
      viral_mechanism: z.string(),
      choice_reason: z.string(),
      scores: z.object({
        potencial_alcance: AiCriterion,
        relevancia_publico: AiCriterion,
        atualidade: AiCriterion,
        potencial_compartilhamento: AiCriterion,
        originalidade_adaptacao: AiCriterion,
        facilidade_producao: AiCriterion,
      }),
    }),
  ),
});
export type IdeasOutput = z.infer<typeof IdeasSchema>;

export const ScriptSchema = z.object({
  headline: z.string(),
  hook: z.string(),
  full_script: z.string(),
  development: z.string(),
  examples: z.array(z.string()),
  scenes: z.array(
    z.object({
      at: z.string(),
      type: z.enum(["camera", "tela", "apoio", "demonstracao", "texto"]),
      description: z.string(),
    }),
  ),
  on_screen_text: z.array(z.object({ at: z.string(), text: z.string() })),
  editing_notes: z.string(),
  cta: z.string(),
  duration_seconds: z.number(),
  theme: z.string(),
  content_format: z.enum(CONTENT_FORMATS),
  recording_direction: z.object({
    talking_to_camera: z.boolean(),
    screen_recording: z.boolean(),
    b_roll: z.boolean(),
    tool_demo: z.string().nullable(),
    cuts: z.string(),
    subtitles: z.string(),
    attention_tips: z.array(z.string()),
  }),
});
export type ScriptOutput = z.infer<typeof ScriptSchema>;

export const LearningsSchema = z.object({
  summary: z.string(),
  top_themes: z.array(Obs),
  best_hooks: z.array(Obs),
  best_formats: z.array(Obs),
  share_drivers: z.array(Obs),
  business_audience_drivers: z.array(Obs),
  underperformers: z.array(Obs),
  recommendations: z.array(z.string()),
});
export type Learnings = z.infer<typeof LearningsSchema>;

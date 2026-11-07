import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { env } from "@/lib/env";
import { adminClient } from "@/lib/supabase/admin";
import { localDate } from "@/lib/time";
import { JOAO_PERSONA } from "./persona";

/** Preço por milhão de tokens (USD). Atualize se mudar de modelo. */
const PRICES: Record<string, { in: number; out: number; cacheRead: number; cacheWrite: number }> = {
  "claude-opus-5-5": { in: 4, out: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-sonnet-5-5": { in: 2, out: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
  "claude-opus-4-8": { in: 5, out: 25, cacheRead: 0.5, cacheWrite: 6.25 },
};

export class AiUnavailableError extends Error {}
export class AiBudgetError extends Error {}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!env.anthropicApiKey) throw new AiUnavailableError("ANTHROPIC_API_KEY não configurada");
  client ??= new Anthropic({ apiKey: env.anthropicApiKey, timeout: 10 * 60 * 1000, maxRetries: 2 });
  return client;
}

export function aiConfigured(): boolean {
  return Boolean(env.anthropicApiKey);
}

export function estimateCost(model: string, u: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null }): number {
  const p = PRICES[model] ?? PRICES["claude-opus-5-5"];
  return (
    (u.input_tokens * p.in + u.output_tokens * p.out + (u.cache_read_input_tokens ?? 0) * p.cacheRead + (u.cache_creation_input_tokens ?? 0) * p.cacheWrite) /
    1_000_000
  );
}

/** Gasto de IA desde a meia-noite em São Paulo (UTC-3). */
export async function spentToday(): Promise<number> {
  const since = new Date(`${localDate()}T03:00:00Z`).toISOString();
  const { data } = await adminClient().from("ai_usage").select("cost_usd").gte("created_at", since);
  return (data ?? []).reduce((a, r) => a + Number(r.cost_usd), 0);
}

export async function dailyBudget(): Promise<number> {
  const { data } = await adminClient().from("settings").select("value").eq("key", "ai_daily_budget_usd").maybeSingle();
  const v = Number(data?.value);
  return Number.isFinite(v) && v > 0 ? v : 15;
}

export async function assertBudget() {
  const [spent, budget] = await Promise.all([spentToday(), dailyBudget()]);
  if (spent >= budget) throw new AiBudgetError(`Teto diário de IA atingido (US$ ${spent.toFixed(2)} de US$ ${budget.toFixed(2)})`);
}

type UserContent = Anthropic.Beta.Messages.BetaContentBlockParam[];

export interface ParseOptions<S extends z.ZodType> {
  purpose: string;
  runId?: string | null;
  instructions: string;
  content: string | UserContent;
  schema: S;
  maxTokens?: number;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
}

/**
 * Chamada estruturada ao Claude: valida a saída contra um schema Zod,
 * registra uso/custo e respeita o teto diário.
 */
export async function aiParse<S extends z.ZodType>(opts: ParseOptions<S>): Promise<z.infer<S>> {
  await assertBudget();
  const anthropic = getClient();
  const model = env.aiModel;
  const response = await anthropic.beta.messages.parse({
    model,
    max_tokens: opts.maxTokens ?? 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: opts.effort ?? env.aiEffort, format: betaZodOutputFormat(opts.schema) },
    system: [
      { type: "text", text: JOAO_PERSONA, cache_control: { type: "ephemeral" } },
      { type: "text", text: opts.instructions },
    ],
    messages: [{ role: "user", content: opts.content }],
  });

  const usage = response.usage;
  const servedModel = response.model ?? model;
  await adminClient()
    .from("ai_usage")
    .insert({
      run_id: opts.runId ?? null,
      purpose: opts.purpose,
      model: servedModel,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_read_tokens: usage.cache_read_input_tokens ?? 0,
      cache_write_tokens: usage.cache_creation_input_tokens ?? 0,
      cost_usd: estimateCost(servedModel, usage),
      stop_reason: response.stop_reason,
    })
    .then(() => undefined, () => undefined);

  if (response.stop_reason === "refusal") {
    throw new Error(`A IA recusou a solicitação (${opts.purpose}).`);
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error(`Resposta da IA truncada por limite de tokens (${opts.purpose}).`);
  }
  if (!response.parsed_output) {
    throw new Error(`Resposta da IA não pôde ser validada (${opts.purpose}).`);
  }
  return response.parsed_output as z.infer<S>;
}

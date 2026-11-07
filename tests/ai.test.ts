import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const inserted: Record<string, unknown[]> = {};
vi.mock("@/lib/supabase/admin", () => {
  const builder = (table: string) => {
    const b: Record<string, unknown> = {};
    const chain = () => b;
    Object.assign(b, {
      select: chain, eq: chain, gte: chain, order: chain, limit: chain,
      maybeSingle: async () => ({ data: table === "settings" ? { value: 15 } : null }),
      then: (resolve: (v: unknown) => void) => resolve({ data: [] }),
      insert: (row: unknown) => {
        (inserted[table] ??= []).push(row);
        return { then: (ok: (v: unknown) => void) => ok({ error: null }) };
      },
    });
    return b;
  };
  return { adminClient: () => ({ from: builder }) };
});

const requests: { headers: Headers; body: Record<string, unknown> }[] = [];
const queue: { payload: unknown; stop_reason: string }[] = [];
/** Enfileira uma resposta simulada do Claude (o cliente do SDK guarda a referência ao fetch). */
function mockClaude(payload: unknown, stop_reason = "end_turn") {
  queue.push({ payload, stop_reason });
  vi.stubGlobal("fetch", async (url: string | URL | Request, init?: RequestInit) => {
    const { payload, stop_reason } = queue.shift()!;
    const u = typeof url === "string" ? url : url instanceof URL ? url.href : url.url;
    expect(u).toContain("api.anthropic.com/v1/messages");
    requests.push({ headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) });
    return new Response(
      JSON.stringify({
        id: "msg_test", type: "message", role: "assistant", model: "claude-opus-5-5",
        content: [{ type: "text", text: JSON.stringify(payload) }],
        stop_reason, stop_sequence: null,
        usage: { input_tokens: 1000, output_tokens: 500, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  });
}

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "sk-test";
  requests.length = 0;
  queue.length = 0;
  for (const k of Object.keys(inserted)) delete inserted[k];
  vi.resetModules();
});
afterEach(() => vi.unstubAllGlobals());

const obs = (value: string, type = "hipotese") => ({ value, type });
const video = {
  id: "11111111-1111-1111-1111-111111111111", platform: "youtube", url: "https://youtube.com/shorts/x", creator: "Canal", followers: 1000,
  published_at: "2026-11-06T10:00:00Z", title: "t", description: "d", duration_seconds: 40, views: 1000, likes: 10, comments: 1, shares: null,
  viral_index: 3, viral_quality: "observado", classification: "muito_acima_media",
};

describe("camada de IA (Claude)", () => {
  it("roteiro: requisição correta, saída validada e custo registrado", async () => {
    const script = {
      headline: "Seu atendimento está perdendo vendas às 22h", hook: "Sua empresa fecha às 18h. Seu cliente não.",
      full_script: "Sua empresa fecha às 18h. Seu cliente não. — ...", development: "dev", examples: ["loja de roupas"],
      scenes: [{ at: "0-3s", type: "camera", description: "close" }], on_screen_text: [{ at: "0-3s", text: "18h ≠ cliente" }],
      editing_notes: "cortes secos", cta: "Comenta AGENTE", duration_seconds: 45, theme: "atendimento com IA", content_format: "provocativo",
      recording_direction: { talking_to_camera: true, screen_recording: false, b_roll: true, tool_demo: null, cuts: "a cada frase", subtitles: "sempre", attention_tips: ["mudar enquadramento"] },
    };
    mockClaude(script);
    const { writeScript } = await import("@/lib/ai/tasks");
    const out = await writeScript({ idea: { subject: "x" }, reference: video, referenceAnalysis: null, learnings: null, runId: "run-1" });
    expect(out.headline).toBe(script.headline);

    const req = requests[0];
    expect(req.body.model).toBe("claude-opus-5-5");
    expect(req.body.fallbacks).toBe("default");
    expect(req.headers.get("anthropic-beta")).toContain("server-side-fallback-2026-07-01");
    expect(req.body.thinking).toEqual({ type: "adaptive" });
    const oc = req.body.output_config as { effort: string; format: { type: string; schema: unknown } };
    expect(oc.effort).toBe("high");
    expect(oc.format.type).toBe("json_schema");
    const system = req.body.system as { text: string; cache_control?: unknown }[];
    expect(system[0].text).toContain("João Valentim");
    expect(system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(req.body.temperature).toBeUndefined();

    const usage = inserted.ai_usage?.[0] as { cost_usd: number; purpose: string };
    expect(usage.purpose).toBe("roteiro");
    expect(usage.cost_usd).toBeCloseTo((1000 * 4 + 500 * 20) / 1e6, 6);
  });

  it("engenharia reversa envia a miniatura como imagem e valida a análise", async () => {
    const F = ["hook_first_3s", "headline", "promise", "curiosity", "problem", "narrative_structure", "development", "examples", "arguments", "expectation_breaks", "cta", "duration_assessment", "rhythm", "editing", "visual_elements", "language"];
    const payload: Record<string, unknown> = Object.fromEntries(F.map((f) => [f, obs(f)]));
    Object.assign(payload, { formats: ["tutorial"], retention_strategies: [obs("loop")], why_it_worked: [obs("promessa clara", "evidencia")], attention_mechanism: "x", adaptation_ideas: [{ title: "a", angle: "b", how_mechanism_transfers: "c" }], limitations: "sem transcrição" });
    mockClaude(payload);
    const { analyzeVideo } = await import("@/lib/ai/tasks");
    const r = await analyzeVideo({ video, transcript: null, thumbnailUrl: "https://i.ytimg.com/x.jpg" });
    expect(r.formats).toEqual(["tutorial"]);
    const content = (requests[0].body.messages as { content: { type: string }[] }[])[0].content;
    expect(content[0]).toMatchObject({ type: "image", source: { type: "url", url: "https://i.ytimg.com/x.jpg" } });
  });

  it("schemas de top10, tendências, ideias e aprendizados são aceitos pelo SDK", async () => {
    const tasks = await import("@/lib/ai/tasks");
    mockClaude({ items: [{ id: video.id, relevance: 0.9, subject: "s", hook: obs("h", "evidencia"), content_format: "lista", selection_reason: "r", adaptation_potential: "p", adaptation_score: 80 }] });
    expect((await tasks.annotateCandidates([video], "r")).items).toHaveLength(1);

    mockClaude({ trends: [{ title: "Agentes de IA no WhatsApp", signal_type: "assunto", status: "emergente", what_is_happening: "a", why_people_consume: "b", working_format: "c", adaptation: "d", record_now: true, record_now_reason: "e", identity_fit: 90, evidence_ids: [video.id], growth_note: "3x" }] });
    expect((await tasks.detectTrends({ signals: [], videos: [video], news: [], audios: [], previousTrends: [], runId: "r" })).trends[0].status).toBe("emergente");

    const crit = { value: 7, justification: "j" };
    mockClaude({ ideas: [{ slot: 1, editorial_pillar: "IA aplicada a negócios", pillar_override_reason: null, reference_id: video.id, trend_slug: null, subject: "s", angle: "a", audience: "pme", pain_or_curiosity: "p", why_for_joao: "w", viral_mechanism: "m", choice_reason: "c", scores: { potencial_alcance: crit, relevancia_publico: crit, atualidade: crit, potencial_compartilhamento: crit, originalidade_adaptacao: crit, facilidade_producao: crit } }] });
    expect((await tasks.selectIdeas({ candidates: [video], trends: [], news: [], learnings: null, recentHeadlines: [], pillars: ["a"], runId: "r" })).ideas).toHaveLength(1);

    mockClaude({ summary: "s", top_themes: [obs("x", "evidencia")], best_hooks: [], best_formats: [], share_drivers: [], business_audience_drivers: [], underperformers: [], recommendations: ["r"] });
    expect((await tasks.learnFromPerformance({}, [])).summary).toBe("s");
  });

  it("recusa e truncamento viram erro explícito (nunca conteúdo inventado)", async () => {
    mockClaude({}, "refusal");
    let tasks = await import("@/lib/ai/tasks");
    await expect(tasks.learnFromPerformance({}, [])).rejects.toThrow(/recusou/);
    vi.resetModules();
    mockClaude({ summary: "s" }, "max_tokens");
    tasks = await import("@/lib/ai/tasks");
    await expect(tasks.learnFromPerformance({}, [])).rejects.toThrow();
  });

  it("sem ANTHROPIC_API_KEY a IA fica indisponível", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { aiConfigured } = await import("@/lib/ai/client");
    expect(aiConfigured()).toBe(false);
  });
});

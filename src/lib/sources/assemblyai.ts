import "server-only";
import { env } from "@/lib/env";
import { fetchJson, SourceError, type AdapterStatus } from "./types";

/**
 * Transcrição via AssemblyAI. Só deve ser usada com arquivos de áudio/vídeo cujo uso
 * seja autorizado (ex.: vídeos próprios ou arquivos enviados pelo usuário com permissão).
 */
const ID = "assemblyai";

export function assemblyStatus(): AdapterStatus {
  return {
    id: ID,
    name: "AssemblyAI (transcrição)",
    configured: Boolean(env.assemblyAiApiKey),
    missing: env.assemblyAiApiKey ? [] : ["ASSEMBLYAI_API_KEY"],
    howToEnable: "Crie uma conta em assemblyai.com, copie a API key e defina ASSEMBLYAI_API_KEY.",
    limitations: [
      "Exige uma URL direta de áudio/vídeo com uso autorizado. Não baixamos vídeos de terceiros das plataformas.",
      "Sem esta integração, a transcrição pode ser colada manualmente na tela de análise.",
    ],
  };
}

export async function transcribeUrl(audioUrl: string, maxWaitMs = 240_000): Promise<{ text: string; language: string | null }> {
  if (!env.assemblyAiApiKey) throw new SourceError(ID, "ASSEMBLYAI_API_KEY não configurada");
  const headers = { authorization: env.assemblyAiApiKey, "content-type": "application/json" };
  const job = await fetchJson<{ id: string }>(ID, "https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers,
    body: JSON.stringify({ audio_url: audioUrl, language_detection: true }),
  });
  const started = Date.now();
  while (Date.now() - started < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 4000));
    const st = await fetchJson<{ status: string; text?: string; error?: string; language_code?: string }>(ID, `https://api.assemblyai.com/v2/transcript/${job.id}`, { headers });
    if (st.status === "completed") return { text: st.text ?? "", language: st.language_code ?? null };
    if (st.status === "error") throw new SourceError(ID, st.error ?? "falha na transcrição");
  }
  throw new SourceError(ID, "tempo limite de transcrição excedido");
}

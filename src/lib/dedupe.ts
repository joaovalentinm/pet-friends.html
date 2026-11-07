import { createHash } from "node:crypto";
import { normalize, jaccard } from "@/lib/text";

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/** Chave de deduplicação de uma ideia: mesma referência + mesmo assunto/ângulo normalizado. */
export function ideaDedupeKey(runDate: string, referenceKey: string | null, subject: string, angle: string): string {
  return sha256([runDate, referenceKey ?? "-", normalize(subject), normalize(angle)].join("|"));
}

/** Hash do conteúdo de um roteiro (impede gravar dois roteiros idênticos). */
export function scriptContentHash(headline: string, fullScript: string): string {
  return sha256(normalize(headline) + "|" + normalize(fullScript));
}

/** Verifica se um título é quase duplicado de algum já produzido recentemente. */
export function findNearDuplicate(candidate: string, previous: string[], threshold = 0.6): string | null {
  for (const p of previous) if (jaccard(candidate, p) >= threshold) return p;
  return null;
}

import "server-only";
import { adminClient } from "@/lib/supabase/admin";

type Level = "debug" | "info" | "warn" | "error";

export async function log(level: Level, scope: string, message: string, context: Record<string, unknown> = {}, runId?: string | null) {
  const line = `[${level}] ${scope}: ${message}`;
  if (level === "error") console.error(line, context);
  else if (level === "warn") console.warn(line, context);
  else console.log(line);
  try {
    await adminClient().from("logs").insert({ level, scope, message, context: sanitize(context), run_id: runId ?? null });
  } catch {
    // log nunca derruba o fluxo
  }
}

/** Remove qualquer coisa que pareça credencial antes de gravar no banco. */
export function sanitize(ctx: Record<string, unknown>): Record<string, unknown> {
  const json = JSON.stringify(ctx, (k, v) => (/token|secret|key|password|authorization/i.test(k) ? "[redigido]" : v));
  return JSON.parse(json ?? "{}");
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message.replace(/(access_token|key)=[^&\s]+/gi, "$1=[redigido]");
  return String(e);
}

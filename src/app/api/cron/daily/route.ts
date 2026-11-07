import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { runDaily, RunLockedError } from "@/lib/pipeline/daily";
import { syncOwnInstagram } from "@/lib/performance/sync";
import { refreshLearnings } from "@/lib/performance/learn";
import { log, errorMessage } from "@/lib/log";

// Vercel Cron: "0 10 * * *" (UTC) = 07:00 em America/Sao_Paulo (sem horário de verão desde 2019).
export const maxDuration = 800;
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  if (!env.cronSecret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.cronSecret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "não autorizado" }, { status: 401 });

  // desempenho próprio primeiro, para que os aprendizados alimentem os roteiros do dia
  try {
    const sync = await syncOwnInstagram();
    if (sync.ok) await refreshLearnings();
  } catch (e) {
    await log("warn", "cron", `sincronização de desempenho falhou: ${errorMessage(e)}`);
  }

  try {
    const result = await runDaily({ trigger: "agendado" });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof RunLockedError) return NextResponse.json({ error: e.message }, { status: 409 });
    await log("error", "cron", errorMessage(e));
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}

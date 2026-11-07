import { NextResponse, after } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { startRun, runDailyPipeline, RunLockedError } from "@/lib/pipeline/daily";
import { adminClient } from "@/lib/supabase/admin";
import { errorMessage } from "@/lib/log";

export const maxDuration = 800;
export const dynamic = "force-dynamic";

/** Execução manual: responde imediatamente com o id e processa em segundo plano. */
export async function POST() {
  try {
    const user = await requireUser();
    const opts = { trigger: "manual" as const, requestedBy: user.id };
    const runId = await startRun(opts);
    after(async () => {
      try {
        await runDailyPipeline(runId, opts);
      } catch (e) {
        await adminClient().from("daily_runs").update({ status: "falhou", finished_at: new Date().toISOString(), error: errorMessage(e) }).eq("id", runId);
      }
    });
    return NextResponse.json({ runId });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof RunLockedError) return NextResponse.json({ error: e.message }, { status: 409 });
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}

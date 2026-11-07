import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth";
import { getOrCreateAnalysis } from "@/lib/analysis";
import { AiBudgetError, AiUnavailableError } from "@/lib/ai/client";
import { errorMessage, log } from "@/lib/log";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await ctx.params;
    if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const analysis = await getOrCreateAnalysis(id, { force: body?.force === true });
    return NextResponse.json({ id: analysis.id });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof AiUnavailableError || e instanceof AiBudgetError) return NextResponse.json({ error: e.message }, { status: 503 });
    await log("error", "analise", errorMessage(e));
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}

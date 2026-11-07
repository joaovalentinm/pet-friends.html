import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { syncOwnInstagram } from "@/lib/performance/sync";
import { refreshLearnings } from "@/lib/performance/learn";
import { errorMessage } from "@/lib/log";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireUser();
    const sync = await syncOwnInstagram();
    const learnings = await refreshLearnings();
    return NextResponse.json({ sync, learnings: { sample: learnings.sample_size, ai: Boolean(learnings.insights) } });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}

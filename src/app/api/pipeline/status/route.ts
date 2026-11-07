import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  const supabase = await createClient();
  const q = supabase.from("daily_runs").select("id,status,stages,stats,started_at,finished_at,error");
  const { data, error } = id ? await q.eq("id", id).maybeSingle() : await q.order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "./creators";

const STATUS = ["rascunho", "pronto", "gravado", "publicado", "arquivado"] as const;

export async function setScriptStatus(id: string, status: (typeof STATUS)[number]): Promise<ActionResult> {
  await requireUser();
  if (!STATUS.includes(status)) return { ok: false, message: "status inválido" };
  const patch: Record<string, unknown> = { status };
  if (status === "gravado") patch.recorded_at = new Date().toISOString();
  if (status === "publicado") patch.published_at = new Date().toISOString();
  const { error } = await adminClient().from("scripts").update(patch).eq("id", id);
  revalidatePath("/roteiros");
  revalidatePath("/hoje");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Status atualizado." };
}

export async function toggleScriptFlag(id: string, flag: "favorite" | "saved", value: boolean): Promise<ActionResult> {
  await requireUser();
  if (flag !== "favorite" && flag !== "saved") return { ok: false, message: "campo inválido" };
  const { error } = await adminClient().from("scripts").update({ [flag]: value }).eq("id", id);
  revalidatePath("/roteiros");
  revalidatePath("/hoje");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Atualizado." };
}

const EditInput = z.object({
  id: z.uuid(),
  headline: z.string().trim().min(3).max(300),
  hook: z.string().trim().min(3).max(1000),
  full_script: z.string().trim().min(20).max(20000),
  development: z.string().max(10000),
  editing_notes: z.string().max(5000),
  cta: z.string().max(1000),
  duration_seconds: z.coerce.number().int().min(5).max(1200),
});

export async function editScript(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const p = EditInput.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false, message: p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  const db = adminClient();
  const { data: current } = await db.from("scripts").select("*").eq("id", p.data.id).single();
  if (!current) return { ok: false, message: "Roteiro não encontrado." };
  // guarda a versão anterior antes de editar
  await db.from("script_revisions").insert({ script_id: current.id, version: current.version, snapshot: current, edited_by: user.id });
  const { id, ...rest } = p.data;
  const { error } = await db.from("scripts").update({ ...rest, version: current.version + 1 }).eq("id", id);
  revalidatePath(`/roteiros/${id}`);
  revalidatePath("/roteiros");
  return error ? { ok: false, message: error.message } : { ok: true, message: `Roteiro salvo (versão ${current.version + 1}).` };
}

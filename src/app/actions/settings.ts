"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "./creators";

const VALIDATORS: Record<string, z.ZodType> = {
  min_followers: z.number().int().min(1000),
  radar_window_hours: z.number().int().min(24).max(336),
  ai_daily_budget_usd: z.number().min(0.5).max(1000),
  radar_regions: z.array(z.string().regex(/^[A-Z]{2}$/)).min(1).max(5),
  radar_topics: z.array(z.object({ topic: z.string().min(2), queries: z.array(z.string().min(2)).min(1).max(10) })).min(1).max(20),
  editorial_pillars: z.array(z.string().min(3)).length(5),
  notifications: z.object({ email: z.boolean(), whatsapp: z.boolean() }),
};

export async function saveSetting(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireUser();
  const key = String(fd.get("key") ?? "");
  const validator = VALIDATORS[key];
  if (!validator) return { ok: false, message: "configuração não editável" };
  let value: unknown;
  try {
    value = JSON.parse(String(fd.get("value") ?? ""));
  } catch {
    return { ok: false, message: "JSON inválido" };
  }
  const p = validator.safeParse(value);
  if (!p.success) return { ok: false, message: p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  const { error } = await adminClient().from("settings").update({ value: p.data }).eq("key", key);
  revalidatePath("/configuracoes");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Configuração salva." };
}

export async function toggleSource(id: string, enabled: boolean): Promise<ActionResult> {
  await requireUser();
  const { error } = await adminClient().from("sources").update({ enabled, last_status: enabled ? "nao_verificado" : "desativado" }).eq("id", id);
  revalidatePath("/configuracoes");
  return error ? { ok: false, message: error.message } : { ok: true, message: enabled ? "Fonte ativada." : "Fonte desativada." };
}

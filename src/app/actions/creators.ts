"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { validateCreator, validateCreatorManually } from "@/lib/creators/validate";
import { resolveHandle, youtubeStatus } from "@/lib/sources/youtube";
import { errorMessage } from "@/lib/log";

export type ActionResult = { ok: boolean; message: string };

const handle = z
  .string()
  .trim()
  .transform((s) => s.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "").toLowerCase())
  .pipe(z.string().regex(/^[a-z0-9._]{1,30}$/, "@ do Instagram inválido"));

const CreatorInput = z.object({
  name: z.string().trim().min(2).max(120),
  category_id: z.string().min(1),
  kind: z.enum(["pessoa", "empresa"]).default("pessoa"),
  instagram_handle: z.union([z.literal(""), handle]).transform((v) => v || null),
  youtube_handle: z.string().trim().max(100).transform((v) => v.replace(/^@/, "") || null),
  tiktok_handle: z.string().trim().max(100).transform((v) => v.replace(/^@/, "") || null),
  priority: z.coerce.number().int().min(0).max(10).default(0),
  study_focus: z.string().max(1000).transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
  notes: z.string().max(2000).transform((v) => v || null),
});

function fromForm(fd: FormData) {
  return CreatorInput.safeParse({
    name: fd.get("name") ?? "",
    category_id: fd.get("category_id") ?? "",
    kind: fd.get("kind") ?? "pessoa",
    instagram_handle: fd.get("instagram_handle") ?? "",
    youtube_handle: fd.get("youtube_handle") ?? "",
    tiktok_handle: fd.get("tiktok_handle") ?? "",
    priority: fd.get("priority") ?? 0,
    study_focus: fd.get("study_focus") ?? "",
    notes: fd.get("notes") ?? "",
  });
}

async function resolveYoutube(h: string | null): Promise<string | null> {
  if (!h || !youtubeStatus().configured) return null;
  try {
    return (await resolveHandle(h))?.id ?? null;
  } catch {
    return null;
  }
}

export async function saveCreator(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = fromForm(fd);
  if (!parsed.success) return { ok: false, message: parsed.error.issues.map((i) => i.message).join("; ") };
  const id = fd.get("id")?.toString() || null;
  const db = adminClient();
  const row = { ...parsed.data, youtube_channel_id: await resolveYoutube(parsed.data.youtube_handle) };

  if (id) {
    const { data: before } = await db.from("creators").select("instagram_handle").eq("id", id).single();
    const handleChanged = before?.instagram_handle !== row.instagram_handle;
    const patch = handleChanged
      ? { ...row, status: "pendente_validacao", followers_count: null, followers_source: null, followers_checked_at: null, validation_note: "perfil alterado: validar novamente" }
      : row;
    const { error } = await db.from("creators").update(patch).eq("id", id);
    if (error) return { ok: false, message: error.code === "23505" ? "Este perfil já está cadastrado." : error.message };
  } else {
    const { error } = await db.from("creators").insert({ ...row, status: "pendente_validacao" });
    if (error) return { ok: false, message: error.code === "23505" ? "Este perfil já está cadastrado." : error.message };
  }
  revalidatePath("/criadores");
  return { ok: true, message: id ? "Criador atualizado." : "Criador cadastrado como pendente de validação." };
}

export async function removeCreator(id: string): Promise<ActionResult> {
  await requireUser();
  const { error } = await adminClient().from("creators").update({ status: "removido", monitoring_enabled: false }).eq("id", id);
  revalidatePath("/criadores");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Criador removido do monitoramento (histórico preservado)." };
}

export async function deleteCreatorPermanently(id: string): Promise<ActionResult> {
  await requireUser();
  const { error } = await adminClient().from("creators").delete().eq("id", id);
  revalidatePath("/criadores");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Criador excluído." };
}

export async function toggleMonitoring(id: string, enabled: boolean): Promise<ActionResult> {
  await requireUser();
  const { error } = await adminClient().from("creators").update({ monitoring_enabled: enabled }).eq("id", id);
  revalidatePath("/criadores");
  return error ? { ok: false, message: error.message } : { ok: true, message: enabled ? "Monitoramento ativado." : "Monitoramento pausado." };
}

export async function validateCreatorAction(id: string): Promise<ActionResult> {
  await requireUser();
  try {
    const r = await validateCreator(id);
    revalidatePath("/criadores");
    if (r.status === "validado") return { ok: true, message: `Validado: ${r.followers.toLocaleString("pt-BR")} seguidores (Instagram Graph API).` };
    if (r.status === "abaixo_minimo") return { ok: false, message: `Abaixo do mínimo: ${r.followers.toLocaleString("pt-BR")} seguidores.` };
    return { ok: false, message: "reason" in r ? r.reason : "não validado" };
  } catch (e) {
    return { ok: false, message: errorMessage(e) };
  }
}

export async function validateAllPending(): Promise<ActionResult> {
  await requireUser();
  const { data } = await adminClient().from("creators").select("id").in("status", ["pendente_validacao", "validado", "abaixo_minimo"]).not("instagram_handle", "is", null);
  let ok = 0;
  const fails: string[] = [];
  for (const c of data ?? []) {
    const r = await validateCreator(c.id);
    if (r.status === "validado") ok++;
    else if ("reason" in r) fails.push(r.reason);
  }
  revalidatePath("/criadores");
  return { ok: fails.length === 0, message: `${ok} validado(s). ${fails.length ? `Pendências: ${[...new Set(fails)].slice(0, 2).join(" | ")}` : ""}` };
}

const ManualInput = z.object({
  id: z.uuid(),
  followers: z.coerce.number().int().min(0).max(2_000_000_000),
  evidence: z.string().trim().min(5, "Informe a fonte (link, print, data da verificação)").max(500),
});

export async function manualValidate(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const p = ManualInput.safeParse({ id: fd.get("id"), followers: fd.get("followers"), evidence: fd.get("evidence") });
  if (!p.success) return { ok: false, message: p.error.issues.map((i) => i.message).join("; ") };
  const status = await validateCreatorManually(p.data.id, p.data.followers, p.data.evidence, user.email);
  revalidatePath("/criadores");
  return { ok: status === "validado", message: status === "validado" ? "Validado manualmente (marcado como fonte manual)." : "Abaixo do mínimo de seguidores." };
}

export async function decideSuggestion(id: string, decision: "aceito" | "rejeitado", instagramHandle?: string): Promise<ActionResult> {
  await requireUser();
  const db = adminClient();
  const { data: s } = await db.from("creator_suggestions").select("*").eq("id", id).single();
  if (!s) return { ok: false, message: "Sugestão não encontrada." };
  if (decision === "aceito") {
    const ig = instagramHandle ? handle.safeParse(instagramHandle) : null;
    if (instagramHandle && !ig?.success) return { ok: false, message: "@ do Instagram inválido." };
    const { error } = await db.from("creators").insert({
      name: s.name,
      category_id: "descobertos",
      instagram_handle: ig?.success ? ig.data : s.platform === "instagram" ? s.handle : null,
      youtube_channel_id: s.platform === "youtube" ? (s.evidence as { channel_id?: string }[])?.[0]?.channel_id ?? null : null,
      status: "pendente_validacao",
      notes: `Sugerido pela IA: ${s.reason}`,
    });
    if (error) return { ok: false, message: error.code === "23505" ? "Já cadastrado." : error.message };
  }
  await db.from("creator_suggestions").update({ status: decision }).eq("id", id);
  revalidatePath("/criadores");
  return { ok: true, message: decision === "aceito" ? "Adicionado como pendente de validação (Instagram ≥ 40 mil)." : "Sugestão rejeitada." };
}

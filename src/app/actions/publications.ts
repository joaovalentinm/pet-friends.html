"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { refreshLearnings } from "@/lib/performance/learn";
import { errorMessage } from "@/lib/log";
import type { ActionResult } from "./creators";

const optInt = z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.coerce.number().int().min(0).nullable());

const PubInput = z.object({
  id: z.preprocess((v) => (v ? v : undefined), z.uuid().optional()),
  permalink: z.preprocess((v) => (v ? v : null), z.url().nullable()),
  published_at: z.string().min(8),
  script_id: z.preprocess((v) => (v ? v : null), z.uuid().nullable()),
  theme: z.string().trim().max(200).transform((v) => v || null),
  reference_creator_id: z.preprocess((v) => (v ? v : null), z.uuid().nullable()),
  content_format: z.string().trim().max(60).transform((v) => v || null),
  hook: z.string().trim().max(1000).transform((v) => v || null),
  views: optInt, reach: optInt, likes: optInt, comments: optInt, shares: optInt, saves: optInt, follows: optInt,
});

/** Registro manual de publicação + métricas informadas (marcadas como fonte manual). */
export async function savePublication(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireUser();
  const p = PubInput.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false, message: p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  const db = adminClient();
  const { id, views, reach, likes, comments, shares, saves, follows, ...pub } = p.data;

  // herda dados do roteiro quando vinculado
  if (pub.script_id) {
    const { data: s } = await db.from("scripts").select("theme,content_format,hook,reference_video_id,videos(creator_id)").eq("id", pub.script_id).single();
    if (s) {
      pub.theme ??= s.theme;
      pub.content_format ??= s.content_format;
      pub.hook ??= s.hook;
      pub.reference_creator_id ??= (s.videos as { creator_id?: string } | null)?.creator_id ?? null;
      await db.from("scripts").update({ status: "publicado", published_at: new Date(pub.published_at).toISOString() }).eq("id", pub.script_id);
    }
  }

  let pubId = id;
  if (id) {
    const { error } = await db.from("own_publications").update({ ...pub, published_at: new Date(pub.published_at).toISOString() }).eq("id", id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { data, error } = await db.from("own_publications").insert({ ...pub, published_at: new Date(pub.published_at).toISOString(), source: "manual" }).select("id").single();
    if (error) return { ok: false, message: error.message };
    pubId = data.id;
  }

  const metrics = { views, reach, likes, comments, shares, saves, follows };
  if (Object.values(metrics).some((v) => v !== null)) {
    const quality = Object.fromEntries(Object.entries(metrics).map(([k, v]) => [k, v === null ? "indisponivel" : "observado"]));
    await db.from("own_publication_metrics").insert({ publication_id: pubId, source: "manual", ...metrics, quality });
  }
  revalidatePath("/desempenho");
  return { ok: true, message: "Publicação registrada." };
}

export async function linkPublicationToScript(publicationId: string, scriptId: string | null): Promise<ActionResult> {
  await requireUser();
  const db = adminClient();
  const patch: Record<string, unknown> = { script_id: scriptId };
  if (scriptId) {
    const { data: s } = await db.from("scripts").select("theme,content_format,hook").eq("id", scriptId).single();
    if (s) Object.assign(patch, { theme: s.theme, content_format: s.content_format, hook: s.hook });
    await db.from("scripts").update({ status: "publicado" }).eq("id", scriptId);
  }
  const { error } = await db.from("own_publications").update(patch).eq("id", publicationId);
  revalidatePath("/desempenho");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Vínculo salvo." };
}

export async function refreshLearningsAction(): Promise<ActionResult> {
  await requireUser();
  try {
    const r = await refreshLearnings();
    revalidatePath("/desempenho");
    return { ok: true, message: r.insights ? `Aprendizados atualizados com ${r.sample_size} publicações.` : `Agregados atualizados (${r.sample_size} publicações). A IA precisa de pelo menos 5 publicações com métricas.` };
  } catch (e) {
    return { ok: false, message: errorMessage(e) };
  }
}

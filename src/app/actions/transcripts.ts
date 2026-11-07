"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { transcribeUrl } from "@/lib/sources/assemblyai";
import { errorMessage } from "@/lib/log";
import type { ActionResult } from "./creators";

const Input = z.object({ video_id: z.uuid(), text: z.string().trim().min(20).max(60000), authorized: z.literal("on") });

/** Transcrição colada manualmente — exige confirmação de que o uso é autorizado. */
export async function saveManualTranscript(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const p = Input.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false, message: "Informe a transcrição (mín. 20 caracteres) e confirme que o uso é autorizado." };
  const { error } = await adminClient()
    .from("transcripts")
    .upsert({ video_id: p.data.video_id, source: "manual", text: p.data.text, created_by: user.id }, { onConflict: "video_id,source" });
  revalidatePath(`/analise/${p.data.video_id}`);
  return error ? { ok: false, message: error.message } : { ok: true, message: "Transcrição salva. Rode a análise novamente para usá-la." };
}

const UrlInput = z.object({ video_id: z.uuid(), audio_url: z.url(), authorized: z.literal("on") });

export async function transcribeFromUrl(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const p = UrlInput.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false, message: "Informe uma URL direta de áudio/vídeo e confirme que o uso é autorizado." };
  try {
    const r = await transcribeUrl(p.data.audio_url);
    await adminClient()
      .from("transcripts")
      .upsert({ video_id: p.data.video_id, source: "assemblyai", text: r.text, language: r.language, created_by: user.id }, { onConflict: "video_id,source" });
    revalidatePath(`/analise/${p.data.video_id}`);
    return { ok: true, message: "Transcrição concluída." };
  } catch (e) {
    return { ok: false, message: errorMessage(e) };
  }
}

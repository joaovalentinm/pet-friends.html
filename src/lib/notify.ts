import "server-only";
import { env } from "@/lib/env";
import { adminClient } from "@/lib/supabase/admin";
import { getSetting } from "@/lib/pipeline/store";

/** Envio opcional do resumo diário (e-mail via Resend, WhatsApp Cloud API). Nunca bloqueia a rotina. */
export async function sendDailySummary(runId: string) {
  const db = adminClient();
  const prefs = await getSetting<{ email?: boolean; whatsapp?: boolean }>(db, "notifications", {});
  if (!prefs.email && !prefs.whatsapp) return { skipped: "notificações desativadas" };

  const [{ data: top }, { data: scripts }, { data: run }] = await Promise.all([
    db.from("daily_top10").select("rank,subject,videos(title,url)").eq("run_id", runId).order("rank"),
    db.from("scripts").select("headline,duration_seconds,ideas!inner(run_id,score_total)").eq("ideas.run_id", runId),
    db.from("daily_runs").select("run_date,status").eq("id", runId).single(),
  ]);
  const lines = [
    `JOÃO CONTENT INTELLIGENCE — ${run?.run_date} (${run?.status})`,
    "",
    "O QUE GRAVAR HOJE:",
    ...(scripts ?? []).map((s, i) => `${i + 1}. ${s.headline} (${s.duration_seconds}s, nota ${(s.ideas as unknown as { score_total: number }).score_total})`),
    "",
    `TOP VIRAL (${top?.length ?? 0}):`,
    ...(top ?? []).map((t) => `${t.rank}. ${t.subject ?? (t.videos as unknown as { title: string })?.title} — ${(t.videos as unknown as { url: string })?.url}`),
    env.appUrl ? `\nPainel: ${env.appUrl}/hoje` : "",
  ];
  const text = lines.join("\n");
  const sent: string[] = [];
  const errors: string[] = [];

  if (prefs.email && env.resendApiKey && env.notifyEmailTo && env.notifyEmailFrom) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.notifyEmailFrom, to: env.notifyEmailTo.split(","), subject: `O que gravar hoje — ${run?.run_date}`, text }),
    });
    if (r.ok) sent.push("email");
    else errors.push(`email: HTTP ${r.status}`);
  }
  if (prefs.whatsapp && env.whatsappToken && env.whatsappPhoneNumberId && env.whatsappTo) {
    const r = await fetch(`https://graph.facebook.com/${env.metaGraphVersion}/${env.whatsappPhoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.whatsappToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: env.whatsappTo, type: "text", text: { body: text.slice(0, 4000) } }),
    });
    if (r.ok) sent.push("whatsapp");
    else errors.push(`whatsapp: HTTP ${r.status}`);
  }
  if (errors.length) throw new Error(errors.join("; "));
  return { sent };
}

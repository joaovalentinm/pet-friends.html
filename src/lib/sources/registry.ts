import "server-only";
import { env } from "@/lib/env";
import { adminClient } from "@/lib/supabase/admin";
import { youtubeStatus } from "./youtube";
import { instagramDiscoveryStatus, instagramInsightsStatus } from "./instagram";
import { tiktokStatus } from "./tiktok";
import { hackerNewsStatus } from "./hackernews";
import { assemblyStatus } from "./assemblyai";
import type { AdapterStatus } from "./types";

function metricoolStatus(): AdapterStatus {
  const missing = [
    !env.metricoolUserToken && "METRICOOL_USER_TOKEN",
    !env.metricoolUserId && "METRICOOL_USER_ID",
    !env.metricoolBlogId && "METRICOOL_BLOG_ID",
  ].filter(Boolean) as string[];
  return {
    id: "metricool",
    name: "Metricool",
    configured: false,
    missing: missing.length ? missing : ["implementação do adaptador após confirmar o plano com acesso à API"],
    howToEnable:
      "A API do Metricool está disponível apenas em planos Advanced/Custom. Com o plano ativo, gere o token em Configurações → API e informe METRICOOL_USER_TOKEN, METRICOOL_USER_ID e METRICOOL_BLOG_ID. O adaptador será concluído com base na documentação do seu plano.",
    limitations: ["Fornece métricas das contas conectadas ao Metricool (contas próprias), não de concorrentes."],
  };
}

function vidiqStatus(): AdapterStatus {
  return {
    id: "vidiq",
    name: "vidIQ",
    configured: false,
    missing: ["API pública oficial do vidIQ"],
    howToEnable:
      "O vidIQ não oferece API pública documentada. Se houver acordo de acesso (parceria/enterprise), o adaptador poderá ser implementado com as credenciais fornecidas. Não automatizamos a interface web.",
    limitations: ["Indisponível até existir integração autorizada."],
  };
}

function anthropicStatus(): AdapterStatus {
  return {
    id: "anthropic",
    name: "Claude (Anthropic)",
    configured: Boolean(env.anthropicApiKey),
    missing: env.anthropicApiKey ? [] : ["ANTHROPIC_API_KEY"],
    howToEnable: "Crie uma chave em console.anthropic.com → API Keys e defina ANTHROPIC_API_KEY.",
    limitations: ["Gasto limitado pelo teto diário configurado (ai_daily_budget_usd)."],
  };
}

function resendStatus(): AdapterStatus {
  const missing = [!env.resendApiKey && "RESEND_API_KEY", !env.notifyEmailTo && "NOTIFY_EMAIL_TO", !env.notifyEmailFrom && "NOTIFY_EMAIL_FROM"].filter(Boolean) as string[];
  return { id: "resend", name: "Resend (e-mail)", configured: !missing.length, missing, howToEnable: "Crie conta em resend.com, verifique um domínio remetente e defina RESEND_API_KEY, NOTIFY_EMAIL_FROM e NOTIFY_EMAIL_TO.", limitations: ["Opcional."] };
}

function whatsappStatus(): AdapterStatus {
  const missing = [!env.whatsappToken && "WHATSAPP_TOKEN", !env.whatsappPhoneNumberId && "WHATSAPP_PHONE_NUMBER_ID", !env.whatsappTo && "WHATSAPP_TO"].filter(Boolean) as string[];
  return {
    id: "whatsapp",
    name: "WhatsApp Cloud API",
    configured: !missing.length,
    missing,
    howToEnable: "Meta for Developers → WhatsApp → configure um número comercial, gere token permanente e defina WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_TO (formato internacional, ex.: 5511999999999).",
    limitations: ["Opcional. Mensagens fora da janela de 24h exigem template aprovado."],
  };
}

export function allAdapterStatuses(): AdapterStatus[] {
  return [
    youtubeStatus(),
    instagramDiscoveryStatus(),
    instagramInsightsStatus(),
    tiktokStatus(),
    hackerNewsStatus(),
    assemblyStatus(),
    anthropicStatus(),
    metricoolStatus(),
    vidiqStatus(),
    resendStatus(),
    whatsappStatus(),
  ];
}

/** Grava no banco o estado de configuração das fontes (sem segredos). */
export async function syncSourceStatuses() {
  const db = adminClient();
  const { data: rows } = await db.from("sources").select("id,enabled,last_status");
  const byId = new Map((rows ?? []).map((r) => [r.id as string, r]));
  for (const s of allAdapterStatuses()) {
    const row = byId.get(s.id);
    if (!row) continue;
    const patch: Record<string, unknown> = { missing_requirements: s.missing };
    if (!row.enabled) patch.last_status = "desativado";
    else if (!s.configured) patch.last_status = "nao_configurado";
    else if (row.last_status === "nao_configurado" || row.last_status === "desativado") patch.last_status = "nao_verificado";
    await db.from("sources").update(patch).eq("id", s.id);
  }
}

import "server-only";

/**
 * Leitura centralizada das variáveis de ambiente.
 * Nunca exponha estes valores ao cliente: apenas NEXT_PUBLIC_* chegam ao navegador.
 */
function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export const env = {
  supabaseUrl: read("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  allowedEmails: (read("ALLOWED_EMAILS") ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  cronSecret: read("CRON_SECRET"),
  appUrl: read("APP_URL"),

  anthropicApiKey: read("ANTHROPIC_API_KEY"),
  aiModel: read("AI_MODEL") ?? "claude-opus-5-5",
  aiEffort: (read("AI_EFFORT") ?? "medium") as "low" | "medium" | "high" | "xhigh" | "max",

  youtubeApiKey: read("YOUTUBE_API_KEY"),

  metaAccessToken: read("META_ACCESS_TOKEN"),
  igBusinessAccountId: read("IG_BUSINESS_ACCOUNT_ID"),
  metaGraphVersion: read("META_GRAPH_VERSION") ?? "v23.0",

  tiktokClientKey: read("TIKTOK_CLIENT_KEY"),
  tiktokClientSecret: read("TIKTOK_CLIENT_SECRET"),

  metricoolUserToken: read("METRICOOL_USER_TOKEN"),
  metricoolUserId: read("METRICOOL_USER_ID"),
  metricoolBlogId: read("METRICOOL_BLOG_ID"),

  assemblyAiApiKey: read("ASSEMBLYAI_API_KEY"),

  resendApiKey: read("RESEND_API_KEY"),
  notifyEmailTo: read("NOTIFY_EMAIL_TO"),
  notifyEmailFrom: read("NOTIFY_EMAIL_FROM"),
  whatsappToken: read("WHATSAPP_TOKEN"),
  whatsappPhoneNumberId: read("WHATSAPP_PHONE_NUMBER_ID"),
  whatsappTo: read("WHATSAPP_TO"),
};

export function missing(...names: string[]): string[] {
  return names.filter((n) => !read(n));
}

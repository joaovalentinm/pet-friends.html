import { createClient } from "@/lib/supabase/server";
import { allAdapterStatuses } from "@/lib/sources/registry";
import { PageHeader, Card, Badge, Stat } from "@/components/ui";
import { ActionButton, RunPipelineButton } from "@/components/client";
import { SettingForm } from "./SettingForm";
import { toggleSource } from "@/app/actions/settings";
import { formatDateTime, localDate } from "@/lib/time";

const ST = { ok: "green", erro: "red", nao_configurado: "amber", desativado: "gray", nao_verificado: "blue" } as const;
const EDITABLE = ["min_followers", "ai_daily_budget_usd", "radar_window_hours", "radar_regions", "editorial_pillars", "radar_topics", "notifications"];

export default async function SettingsPage() {
  const db = await createClient();
  const since = new Date(`${localDate()}T03:00:00Z`).toISOString();
  const monthStart = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [{ data: sources }, { data: settings }, { data: usageToday }, { data: usageMonth }] = await Promise.all([
    db.from("sources").select("*"),
    db.from("settings").select("*").order("key"),
    db.from("ai_usage").select("cost_usd").gte("created_at", since),
    db.from("ai_usage").select("cost_usd").gte("created_at", monthStart),
  ]);
  const byId = new Map((sources ?? []).map((s) => [s.id, s]));
  const statuses = allAdapterStatuses();
  const today = (usageToday ?? []).reduce((a, u) => a + Number(u.cost_usd), 0);
  const month = (usageMonth ?? []).reduce((a, u) => a + Number(u.cost_usd), 0);
  const budget = Number((settings ?? []).find((s) => s.key === "ai_daily_budget_usd")?.value ?? 15);

  return (
    <>
      <PageHeader title="Configurações" subtitle="Integrações, rotina diária, controle de custos e parâmetros do radar." actions={<RunPipelineButton />} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Gasto de IA hoje" value={`US$ ${today.toFixed(2)}`} hint={`teto diário US$ ${budget.toFixed(2)}`} tone={today >= budget ? "bad" : today > budget * 0.7 ? "warn" : undefined} />
        <Stat label="Gasto de IA (30 dias)" value={`US$ ${month.toFixed(2)}`} />
        <Stat label="Rotina diária" value="07:00" hint="America/Sao_Paulo · Vercel Cron 0 10 * * * (UTC)" />
        <Stat label="Integrações ativas" value={statuses.filter((s) => s.configured).length} hint={`de ${statuses.length}`} />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-medium text-ink-100">Fontes e integrações</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {statuses.map((s) => {
          const row = byId.get(s.id);
          const status = (row?.last_status ?? (s.configured ? "nao_verificado" : "nao_configurado")) as keyof typeof ST;
          return (
            <div key={s.id} className="card card-pad">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-ink-100">{s.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={ST[status] ?? "gray"}>{status.replace(/_/g, " ")}</Badge>
                    <Badge tone={s.configured ? "green" : "amber"}>{s.configured ? "credenciais presentes" : "não configurada"}</Badge>
                    {row?.last_checked_at && <span className="text-xs text-ink-500">verificada {formatDateTime(row.last_checked_at)}</span>}
                  </div>
                </div>
                {row && (
                  <ActionButton action={toggleSource.bind(null, s.id, !row.enabled)} className="btn-ghost px-2.5 py-1 text-xs">{row.enabled ? "Desativar" : "Ativar"}</ActionButton>
                )}
              </div>
              {row?.last_error && <p className="mt-2 text-xs text-red-300">Último erro: {row.last_error}</p>}
              {!s.configured && (
                <div className="mt-3 rounded-lg border border-amber-900/40 bg-amber-500/5 p-3 text-xs text-amber-100/90">
                  <div className="font-medium">O que falta: {s.missing.join(", ")}</div>
                  <p className="mt-1 text-amber-100/70">{s.howToEnable}</p>
                </div>
              )}
              {s.limitations.length > 0 && (
                <ul className="mt-3 list-disc space-y-0.5 pl-4 text-xs text-ink-400">{s.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-medium text-ink-100">Parâmetros</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {(settings ?? []).filter((s) => EDITABLE.includes(s.key)).map((s) => (
          <Card key={s.key} title={s.key}>
            <p className="mb-2 text-xs text-ink-400">{s.description}</p>
            <SettingForm settingKey={s.key} value={JSON.stringify(s.value, null, 2)} />
          </Card>
        ))}
      </div>
    </>
  );
}

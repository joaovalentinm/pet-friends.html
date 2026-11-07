import { createClient } from "@/lib/supabase/server";
import { sourcesOverview, isMonitored } from "@/lib/queries";
import { PageHeader, Card, Badge, Notice, ExtLink } from "@/components/ui";
import { ActionButton } from "@/components/client";
import { CreatorForm, ManualValidationForm } from "./forms";
import { removeCreator, toggleMonitoring, validateCreatorAction, validateAllPending, decideSuggestion, deleteCreatorPermanently } from "@/app/actions/creators";
import { formatDateTime, formatNumber } from "@/lib/time";

const STATUS: Record<string, { label: string; tone: "green" | "amber" | "red" | "gray" | "blue" }> = {
  validado: { label: "Validado", tone: "green" },
  pendente_validacao: { label: "Pendente de validação", tone: "amber" },
  abaixo_minimo: { label: "Abaixo do mínimo", tone: "red" },
  nao_encontrado: { label: "Não encontrado", tone: "red" },
  sugerido: { label: "Sugerido", tone: "blue" },
  removido: { label: "Removido", tone: "gray" },
};

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<{ editar?: string; removidos?: string }> }) {
  const sp = await searchParams;
  const db = await createClient();
  const [{ data: categories }, { data: creators }, sources, { data: suggestions }, { data: minSetting }] = await Promise.all([
    db.from("categories").select("*").order("sort_order"),
    db.from("creators").select("*").order("priority", { ascending: false }).order("name"),
    sourcesOverview(db),
    db.from("creator_suggestions").select("*").eq("status", "pendente").order("followers", { ascending: false }).limit(20),
    db.from("settings").select("value").eq("key", "min_followers").maybeSingle(),
  ]);
  const min = Number(minSetting?.value ?? 40000);
  const okSources = new Set(sources.working.map((s) => s.id));
  const editing = sp.editar ? (creators ?? []).find((c) => c.id === sp.editar) : null;
  const visible = (creators ?? []).filter((c) => sp.removidos || c.status !== "removido");

  return (
    <>
      <PageHeader
        title="Criadores monitorados"
        subtitle={`Radar de Referências. Regra de entrada: mínimo de ${formatNumber(min)} seguidores no Instagram confirmados por fonte verificável. Um perfil só é considerado monitorado quando validado e com fonte de dados funcional.`}
        actions={<ActionButton action={validateAllPending} className="btn-ghost">Validar todos via Instagram</ActionButton>}
      />
      {!okSources.has("instagram_discovery") && (
        <Notice>
          A validação automática usa a Instagram Graph API (Business Discovery), ainda não verificada/configurada. Enquanto isso, os perfis permanecem
          pendentes — ou podem ser validados manualmente informando a fonte da contagem.
        </Notice>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {(categories ?? []).map((cat) => {
            const list = visible.filter((c) => c.category_id === cat.id);
            if (!list.length) return null;
            return (
              <Card key={cat.id} title={`${cat.name} (${list.length})`}>
                <ul className="divide-y divide-ink-800">
                  {list.map((c) => {
                    const st = STATUS[c.status] ?? { label: c.status, tone: "gray" as const };
                    const monitored = isMonitored(c, okSources);
                    return (
                      <li key={c.id} className="py-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-ink-100">{c.name}</span>
                              {c.priority >= 5 && <Badge tone="green">prioritário</Badge>}
                              <Badge tone={st.tone}>{st.label}</Badge>
                              {monitored ? <Badge tone="blue">monitorado</Badge> : <Badge tone="gray">não monitorado</Badge>}
                              {!c.monitoring_enabled && <Badge tone="gray">pausado</Badge>}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-400">
                              {c.instagram_url ? <ExtLink href={c.instagram_url}>@{c.instagram_handle}</ExtLink> : <span>Instagram: perfil pendente de validação</span>}
                              <span>
                                Seguidores: {c.followers_count !== null ? `${formatNumber(c.followers_count)} (${c.followers_source === "manual" ? "informado manualmente" : "Instagram Graph API"}, ${formatDateTime(c.followers_checked_at)})` : "não confirmado"}
                              </span>
                              {c.youtube_channel_id && <span>YouTube vinculado</span>}
                            </div>
                            {c.classification_note && <div className="mt-1 text-xs text-ink-300">{c.classification_note}</div>}
                            {c.study_focus?.length > 0 && <div className="mt-1 text-xs text-ink-400">Estudar: {c.study_focus.join(" · ")}</div>}
                            {c.validation_note && <div className="mt-1 text-xs text-amber-300/80">{c.validation_note}</div>}
                            {c.notes && <div className="mt-1 text-xs text-ink-500">{c.notes}</div>}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <ActionButton action={validateCreatorAction.bind(null, c.id)} className="btn-ghost px-2.5 py-1 text-xs">Validar</ActionButton>
                            <a href={`?editar=${c.id}`} className="btn-ghost px-2.5 py-1 text-xs">Editar</a>
                            <ActionButton action={toggleMonitoring.bind(null, c.id, !c.monitoring_enabled)} className="btn-ghost px-2.5 py-1 text-xs">{c.monitoring_enabled ? "Pausar" : "Retomar"}</ActionButton>
                            {c.status === "removido" ? (
                              <ActionButton action={deleteCreatorPermanently.bind(null, c.id)} confirm="Excluir definitivamente? Vídeos coletados ficam sem vínculo." className="btn-danger px-2.5 py-1 text-xs">Excluir</ActionButton>
                            ) : (
                              <ActionButton action={removeCreator.bind(null, c.id)} confirm={`Remover ${c.name} do monitoramento?`} className="btn-danger px-2.5 py-1 text-xs">Remover</ActionButton>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
          <a href={sp.removidos ? "?" : "?removidos=1"} className="text-xs link">{sp.removidos ? "Ocultar removidos" : "Mostrar removidos"}</a>
        </div>

        <div className="space-y-6">
          <Card title={editing ? `Editar: ${editing.name}` : "Cadastrar referência"} actions={editing ? <a href="?" className="text-xs link">cancelar</a> : null}>
            <CreatorForm key={editing?.id ?? "novo"} categories={categories ?? []} creator={editing ?? null} />
          </Card>
          {editing && (
            <Card title="Validação manual">
              <p className="mb-3 text-xs text-ink-400">Use somente com uma fonte verificável (ex.: link do perfil + data da conferência). Fica registrado como “informado manualmente”.</p>
              <ManualValidationForm id={editing.id} />
            </Card>
          )}
          <Card title={`Sugestões da IA (${suggestions?.length ?? 0})`}>
            {!suggestions?.length ? (
              <p className="text-sm text-ink-400">O radar sugere criadores que aparecem com conteúdos muito acima da média e com mais de {formatNumber(min)} seguidores na plataforma de origem.</p>
            ) : (
              <ul className="space-y-3">
                {suggestions.map((s) => (
                  <li key={s.id} className="rounded-lg border border-ink-800 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink-100">{s.name}</span>
                      <Badge tone="gray">{s.platform}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-ink-400">{formatNumber(s.followers)} seguidores ({s.followers_quality}) · {s.url && <ExtLink href={s.url}>perfil</ExtLink>}</div>
                    <p className="mt-1 text-xs text-ink-300">{s.reason}</p>
                    <div className="mt-2 flex gap-2">
                      <ActionButton action={decideSuggestion.bind(null, s.id, "aceito", undefined)} className="btn-ghost px-2.5 py-1 text-xs">Adicionar (pendente)</ActionButton>
                      <ActionButton action={decideSuggestion.bind(null, s.id, "rejeitado", undefined)} className="btn-ghost px-2.5 py-1 text-xs">Rejeitar</ActionButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { Badge, Quality, ExtLink, PlatformTag } from "@/components/ui";
import { ActionButton, CopyButton } from "@/components/client";
import { setScriptStatus, toggleScriptFlag } from "@/app/actions/scripts";
import { CRITERIA, type CriterionKey } from "@/lib/scoring/opportunity";
import { formatDate, formatNumber } from "@/lib/time";

export type ScriptRow = {
  id: string; headline: string; hook: string; full_script: string; development: string; examples: string[];
  scenes: { at: string; type: string; description: string }[]; on_screen_text: { at: string; text: string }[];
  editing_notes: string; cta: string; duration_seconds: number; status: string; favorite: boolean; saved: boolean; version: number;
  theme: string | null; content_format: string | null;
  recording_direction: { talking_to_camera: boolean; screen_recording: boolean; b_roll: boolean; tool_demo: string | null; cuts: string; subtitles: string; attention_tips: string[] };
};
export type IdeaRow = {
  id: string; slot: number; editorial_pillar: string; pillar_override_reason: string | null; subject: string; angle: string; audience: string;
  pain_or_curiosity: string; why_for_joao: string; viral_mechanism: string; score_total: number; score_justification: string;
  score_breakdown: Record<CriterionKey, { value: number | null; justification: string; origin: string }>;
  reference_snapshot: Record<string, unknown>;
};

const STATUS_TONE = { rascunho: "gray", pronto: "blue", gravado: "amber", publicado: "green", arquivado: "gray" } as const;

export function scriptAsText(s: ScriptRow): string {
  return [
    s.headline.toUpperCase(),
    "",
    `GANCHO: ${s.hook}`,
    "",
    "FALA COMPLETA:",
    s.full_script,
    "",
    "CENAS:",
    ...s.scenes.map((c) => `${c.at} [${c.type}] ${c.description}`),
    "",
    "TEXTOS NA TELA:",
    ...s.on_screen_text.map((t) => `${t.at} ${t.text}`),
    "",
    `EDIÇÃO: ${s.editing_notes}`,
    `CTA: ${s.cta}`,
    `DURAÇÃO: ${s.duration_seconds}s`,
  ].join("\n");
}

export function IdeaReference({ idea }: { idea: IdeaRow }) {
  const ref = idea.reference_snapshot as {
    url?: string; platform?: string; creator?: string; published_at?: string; views?: number | null; followers?: number | null;
    viral_index?: number | null; viral_quality?: string; title?: string; points?: number; comments?: number | null; collected_at?: string;
  };
  if (!ref?.url) return <p className="text-sm text-ink-400">Ideia derivada de tendência, sem vídeo de referência específico.</p>;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <div className="col-span-2"><dt className="label">Referência</dt><dd className="text-ink-100">{ref.title}</dd></div>
      <div><dt className="label">Criador</dt><dd className="text-ink-200">{ref.creator ?? "—"}</dd></div>
      <div><dt className="label">Plataforma</dt><dd>{ref.platform && <PlatformTag p={ref.platform} />}</dd></div>
      <div><dt className="label">Publicação</dt><dd className="text-ink-200">{formatDate(ref.published_at)}</dd></div>
      <div><dt className="label">Visualizações</dt><dd className="text-ink-200">{ref.platform === "web" ? `${ref.points ?? "—"} pontos (HN)` : formatNumber(ref.views ?? null)}</dd></div>
      <div><dt className="label">Seguidores</dt><dd className="text-ink-200">{formatNumber(ref.followers ?? null)}</dd></div>
      <div><dt className="label">Desempenho relativo</dt><dd className="flex items-center gap-1.5 text-ink-200">{ref.viral_index ? `${ref.viral_index}x` : "—"} {ref.viral_quality && <Quality q={ref.viral_quality} />}</dd></div>
      <div className="col-span-2"><dt className="label">Link</dt><dd><ExtLink href={ref.url}>{ref.url}</ExtLink></dd></div>
    </dl>
  );
}

export function IdeaStrategy({ idea }: { idea: IdeaRow }) {
  const items: [string, string][] = [
    ["Assunto", idea.subject], ["Ângulo", idea.angle], ["Público", idea.audience], ["Dor ou curiosidade", idea.pain_or_curiosity],
    ["Por que pode funcionar para João", idea.why_for_joao], ["Mecanismo de viralização aproveitado", idea.viral_mechanism],
  ];
  return (
    <dl className="space-y-2.5 text-sm">
      {items.map(([k, v]) => <div key={k}><dt className="label">{k}</dt><dd className="leading-6 text-ink-200">{v}</dd></div>)}
      {idea.pillar_override_reason && <div><dt className="label">Fora da distribuição editorial porque</dt><dd className="text-ink-200">{idea.pillar_override_reason}</dd></div>}
    </dl>
  );
}

export function IdeaScore({ idea }: { idea: IdeaRow }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums text-accent">{idea.score_total}</span>
        <span className="text-sm text-ink-400">/100 · potencial estimado</span>
      </div>
      <ul className="mt-3 space-y-2">
        {(Object.keys(CRITERIA) as CriterionKey[]).map((k) => {
          const s = idea.score_breakdown[k];
          const v = s?.value;
          return (
            <li key={k} className="text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-300">{CRITERIA[k].label} <span className="text-ink-500">({CRITERIA[k].weight}%, {s?.origin === "dados" ? "dados" : "IA"})</span></span>
                <span className="tabular-nums text-ink-100">{v === null || v === undefined ? "indisponível" : `${v}/10`}</span>
              </div>
              <div className="mt-1 h-1 rounded bg-ink-800"><div className="h-1 rounded bg-accent" style={{ width: `${(v ?? 0) * 10}%` }} /></div>
              <div className="mt-0.5 text-ink-500">{s?.justification}</div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-ink-400">{idea.score_justification}</p>
    </div>
  );
}

export function ScriptBody({ s }: { s: ScriptRow }) {
  const d = s.recording_direction;
  return (
    <div className="space-y-5">
      <div>
        <div className="label">Headline</div>
        <div className="text-lg font-semibold text-white">{s.headline}</div>
      </div>
      <div className="rounded-lg border border-green-900/50 bg-accent-muted p-4">
        <div className="label text-green-300">Gancho inicial (0–3s)</div>
        <p className="text-base font-medium text-ink-100">{s.hook}</p>
      </div>
      <div>
        <div className="label">Fala completa, palavra por palavra</div>
        <div className="prose-script rounded-lg border border-ink-800 bg-ink-950/60 p-4">{s.full_script}</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div><div className="label">Desenvolvimento</div><p className="text-sm leading-6 text-ink-200">{s.development}</p></div>
        <div><div className="label">Exemplos</div><ul className="list-disc space-y-1 pl-4 text-sm text-ink-200">{s.examples.map((e, i) => <li key={i}>{e}</li>)}</ul></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="label">Sugestões de cenas</div>
          <ol className="space-y-1.5 text-sm">{s.scenes.map((c, i) => <li key={i} className="flex gap-2"><span className="w-16 shrink-0 font-mono text-xs text-ink-400">{c.at}</span><Badge tone="gray">{c.type}</Badge><span className="text-ink-200">{c.description}</span></li>)}</ol>
        </div>
        <div>
          <div className="label">Textos na tela</div>
          <ol className="space-y-1.5 text-sm">{s.on_screen_text.map((t, i) => <li key={i} className="flex gap-2"><span className="w-16 shrink-0 font-mono text-xs text-ink-400">{t.at}</span><span className="font-medium text-ink-100">{t.text}</span></li>)}</ol>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div><div className="label">Orientação de edição</div><p className="text-sm leading-6 text-ink-200">{s.editing_notes}</p></div>
        <div><div className="label">CTA</div><p className="text-sm leading-6 text-ink-200">{s.cta}</p></div>
        <div><div className="label">Duração sugerida</div><p className="text-sm text-ink-200">{s.duration_seconds}s</p></div>
      </div>
      <div className="rounded-lg border border-ink-800 p-4">
        <div className="label">Direção de gravação</div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge tone={d.talking_to_camera ? "green" : "gray"}>{d.talking_to_camera ? "fala para a câmera" : "sem câmera direta"}</Badge>
          <Badge tone={d.screen_recording ? "green" : "gray"}>{d.screen_recording ? "gravação de tela" : "sem gravação de tela"}</Badge>
          <Badge tone={d.b_roll ? "green" : "gray"}>{d.b_roll ? "imagens de apoio" : "sem imagens de apoio"}</Badge>
          {d.tool_demo && <Badge tone="blue">demonstrar: {d.tool_demo}</Badge>}
        </div>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="label">Cortes</dt><dd className="text-ink-200">{d.cuts}</dd></div>
          <div><dt className="label">Legendas</dt><dd className="text-ink-200">{d.subtitles}</dd></div>
          <div className="md:col-span-2"><dt className="label">Como manter a atenção</dt><dd><ul className="list-disc pl-4 text-ink-200">{d.attention_tips.map((t, i) => <li key={i}>{t}</li>)}</ul></dd></div>
        </dl>
      </div>
    </div>
  );
}

export function ScriptActions({ s, showEdit = true }: { s: ScriptRow; showEdit?: boolean }) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <Badge tone={STATUS_TONE[s.status as keyof typeof STATUS_TONE] ?? "gray"}>{s.status}</Badge>
      <CopyButton text={scriptAsText(s)} />
      <ActionButton action={toggleScriptFlag.bind(null, s.id, "favorite", !s.favorite)}>{s.favorite ? "★ Favorito" : "☆ Favoritar"}</ActionButton>
      <ActionButton action={toggleScriptFlag.bind(null, s.id, "saved", !s.saved)}>{s.saved ? "Salvo" : "Salvar"}</ActionButton>
      {s.status !== "gravado" && s.status !== "publicado" && <ActionButton action={setScriptStatus.bind(null, s.id, "gravado")}>Marcar como gravado</ActionButton>}
      {s.status !== "publicado" && <ActionButton action={setScriptStatus.bind(null, s.id, "publicado")}>Marcar como publicado</ActionButton>}
      {s.status !== "arquivado" ? (
        <ActionButton action={setScriptStatus.bind(null, s.id, "arquivado")}>Arquivar</ActionButton>
      ) : (
        <ActionButton action={setScriptStatus.bind(null, s.id, "pronto")}>Restaurar</ActionButton>
      )}
      {showEdit && <Link href={`/roteiros/${s.id}?editar=1`} className="btn-ghost">Editar</Link>}
    </div>
  );
}

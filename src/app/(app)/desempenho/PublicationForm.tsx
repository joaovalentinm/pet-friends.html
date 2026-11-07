"use client";
import { ActionForm } from "@/components/client";
import { savePublication } from "@/app/actions/publications";
import { CONTENT_FORMATS } from "@/lib/constants";

export function PublicationForm({ scripts, creators }: { scripts: { id: string; headline: string; run_date: string }[]; creators: { id: string; name: string }[] }) {
  const metrics: [string, string][] = [["views", "Visualizações"], ["reach", "Alcance"], ["likes", "Curtidas"], ["comments", "Comentários"], ["shares", "Compartilh."], ["saves", "Salvamentos"], ["follows", "Seguidores"]];
  return (
    <ActionForm action={savePublication} resetOnSuccess submitLabel="Registrar" className="space-y-3">
      <div><label className="label">Data de publicação</label><input name="published_at" type="datetime-local" required className="input" /></div>
      <div><label className="label">Link</label><input name="permalink" type="url" className="input" placeholder="https://www.instagram.com/reel/..." /></div>
      <div>
        <label className="label">Roteiro utilizado</label>
        <select name="script_id" className="input"><option value="">—</option>{scripts.map((s) => <option key={s.id} value={s.id}>{s.run_date} · {s.headline.slice(0, 60)}</option>)}</select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Tema</label><input name="theme" className="input" placeholder="herdado do roteiro" /></div>
        <div>
          <label className="label">Formato</label>
          <select name="content_format" className="input"><option value="">herdado</option>{CONTENT_FORMATS.map((f) => <option key={f} value={f}>{f.replace(/_/g, " ")}</option>)}</select>
        </div>
      </div>
      <div>
        <label className="label">Criador de referência</label>
        <select name="reference_creator_id" className="input"><option value="">herdado do roteiro</option>{creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>
      <div><label className="label">Gancho</label><input name="hook" className="input" placeholder="herdado do roteiro" /></div>
      <div className="label pt-2">Métricas (deixe vazio o que não souber)</div>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(([k, l]) => <div key={k}><label className="text-[11px] text-ink-400">{l}</label><input name={k} type="number" min={0} className="input" /></div>)}
      </div>
    </ActionForm>
  );
}

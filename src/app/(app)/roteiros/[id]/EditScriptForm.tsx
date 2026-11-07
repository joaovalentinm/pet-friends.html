"use client";
import Link from "next/link";
import { ActionForm } from "@/components/client";
import { editScript } from "@/app/actions/scripts";
import type { ScriptRow } from "@/components/ScriptView";

export function EditScriptForm({ s }: { s: ScriptRow }) {
  return (
    <ActionForm action={editScript} submitLabel="Salvar nova versão" className="space-y-4">
      <input type="hidden" name="id" value={s.id} />
      <div><label className="label">Headline</label><input name="headline" defaultValue={s.headline} className="input" /></div>
      <div><label className="label">Gancho</label><textarea name="hook" rows={2} defaultValue={s.hook} className="input" /></div>
      <div><label className="label">Fala completa</label><textarea name="full_script" rows={18} defaultValue={s.full_script} className="input font-mono text-[13px] leading-6" /></div>
      <div><label className="label">Desenvolvimento</label><textarea name="development" rows={4} defaultValue={s.development} className="input" /></div>
      <div><label className="label">Orientação de edição</label><textarea name="editing_notes" rows={3} defaultValue={s.editing_notes} className="input" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2"><label className="label">CTA</label><input name="cta" defaultValue={s.cta} className="input" /></div>
        <div><label className="label">Duração (s)</label><input name="duration_seconds" type="number" defaultValue={s.duration_seconds} className="input" /></div>
      </div>
      <Link href={`/roteiros/${s.id}`} className="text-xs link">cancelar</Link>
    </ActionForm>
  );
}

"use client";
import { ActionForm } from "@/components/client";
import { saveCreator, manualValidate } from "@/app/actions/creators";

type Cat = { id: string; name: string };
type Creator = {
  id: string; name: string; category_id: string; kind: string; instagram_handle: string | null; youtube_handle: string | null;
  tiktok_handle: string | null; priority: number; study_focus: string[]; notes: string | null;
};

export function CreatorForm({ categories, creator }: { categories: Cat[]; creator: Creator | null }) {
  return (
    <ActionForm action={saveCreator} resetOnSuccess={!creator} submitLabel={creator ? "Salvar alterações" : "Cadastrar"} className="space-y-3">
      {creator && <input type="hidden" name="id" value={creator.id} />}
      <div><label className="label">Nome</label><input name="name" required defaultValue={creator?.name} className="input" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Categoria</label>
          <select name="category_id" defaultValue={creator?.category_id ?? categories[0]?.id} className="input">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tipo</label>
          <select name="kind" defaultValue={creator?.kind ?? "pessoa"} className="input"><option value="pessoa">Pessoa</option><option value="empresa">Empresa</option></select>
        </div>
      </div>
      <div><label className="label">Instagram (@ ou link)</label><input name="instagram_handle" defaultValue={creator?.instagram_handle ?? ""} placeholder="deixe vazio se não confirmado" className="input" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">YouTube (@handle)</label><input name="youtube_handle" defaultValue={creator?.youtube_handle ?? ""} className="input" /></div>
        <div><label className="label">TikTok (@)</label><input name="tiktok_handle" defaultValue={creator?.tiktok_handle ?? ""} className="input" /></div>
      </div>
      <div><label className="label">Prioridade (0–10)</label><input name="priority" type="number" min={0} max={10} defaultValue={creator?.priority ?? 0} className="input" /></div>
      <div><label className="label">O que estudar (separado por vírgula)</label><input name="study_focus" defaultValue={creator?.study_focus?.join(", ") ?? ""} className="input" /></div>
      <div><label className="label">Notas</label><textarea name="notes" rows={2} defaultValue={creator?.notes ?? ""} className="input" /></div>
      <p className="text-xs text-ink-500">Novos cadastros entram como pendentes até a validação do mínimo de seguidores.</p>
    </ActionForm>
  );
}

export function ManualValidationForm({ id }: { id: string }) {
  return (
    <ActionForm action={manualValidate} submitLabel="Registrar validação" className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <div><label className="label">Seguidores no Instagram</label><input name="followers" type="number" min={0} required className="input" /></div>
      <div><label className="label">Fonte da contagem</label><input name="evidence" required placeholder="ex.: perfil conferido em 07/11/2026, link..." className="input" /></div>
    </ActionForm>
  );
}

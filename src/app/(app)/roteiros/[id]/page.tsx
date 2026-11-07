import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import { IdeaReference, IdeaStrategy, IdeaScore, ScriptBody, ScriptActions, type IdeaRow, type ScriptRow } from "@/components/ScriptView";
import { EditScriptForm } from "./EditScriptForm";
import { formatDate, formatDateTime } from "@/lib/time";

export default async function ScriptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ editar?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await createClient();
  const [{ data: s }, { data: revisions }] = await Promise.all([
    db.from("scripts").select("*, ideas(*)").eq("id", id).maybeSingle(),
    db.from("script_revisions").select("id,version,created_at").eq("script_id", id).order("version", { ascending: false }),
  ]);
  if (!s) notFound();
  const idea = s.ideas as IdeaRow | null;
  const script = s as unknown as ScriptRow;

  return (
    <>
      <PageHeader title={s.headline} subtitle={<>Gerado em {formatDate(s.run_date)} · versão {s.version} · <Link href="/roteiros" className="link">voltar à biblioteca</Link></>} />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4">
          {idea && <Card title="Referência"><IdeaReference idea={idea} /></Card>}
          {idea && <Card title="Estratégia"><IdeaStrategy idea={idea} /></Card>}
          {idea && <Card title="Pontuação"><IdeaScore idea={idea} /></Card>}
          {s.reference_video_id && <Link href={`/analise/${s.reference_video_id}`} className="btn-ghost w-full">Ver engenharia reversa da referência</Link>}
          {revisions?.length ? (
            <Card title="Versões anteriores">
              <ul className="text-xs text-ink-400">{revisions.map((r) => <li key={r.id}>v{r.version} · {formatDateTime(r.created_at)}</li>)}</ul>
            </Card>
          ) : null}
        </div>
        <Card title={sp.editar ? "Editar roteiro" : "Roteiro"} className="xl:col-span-2">
          {sp.editar ? (
            <EditScriptForm s={script} />
          ) : (
            <>
              <div className="mb-5"><ScriptActions s={script} /></div>
              <ScriptBody s={script} />
            </>
          )}
        </Card>
      </div>
    </>
  );
}

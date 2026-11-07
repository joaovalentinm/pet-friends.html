import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge, Empty, TREND_LABEL, Quality } from "@/components/ui";
import { formatDate } from "@/lib/time";

const SIGNAL: Record<string, string> = {
  assunto: "Assunto", audio: "Áudio", formato: "Formato", gancho: "Gancho", noticia: "Notícia", ferramenta: "Ferramenta de IA", tema_engajamento: "Tema com engajamento",
};
const ORDER = { emergente: 0, em_crescimento: 1, em_alta: 2, saturada: 3 } as const;

export default async function TrendsPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const sp = await searchParams;
  const db = await createClient();
  const { data: dates } = await db.from("trends").select("run_date").order("run_date", { ascending: false }).limit(60);
  const uniqueDates = [...new Set((dates ?? []).map((d) => d.run_date as string))];
  const date = sp.data && uniqueDates.includes(sp.data) ? sp.data : uniqueDates[0];
  if (!date) return (<><PageHeader title="Radar de tendências" /><Empty title="Nenhuma tendência identificada ainda">As tendências são detectadas pela rotina diária (requer IA configurada e conteúdos coletados).</Empty></>);

  const { data: trends } = await db.from("trends").select("*").eq("run_date", date);
  const evidenceIds = [...new Set((trends ?? []).flatMap((t) => t.evidence_video_ids as string[]))];
  const { data: videos } = evidenceIds.length ? await db.from("videos").select("id,url,title,channel_name,platform").in("id", evidenceIds) : { data: [] };
  const vmap = new Map((videos ?? []).map((v) => [v.id, v]));
  const sorted = [...(trends ?? [])].sort((a, b) => Number(b.record_now) - Number(a.record_now) || ORDER[a.status as keyof typeof ORDER] - ORDER[b.status as keyof typeof ORDER] || (b.identity_fit ?? 0) - (a.identity_fit ?? 0));

  return (
    <>
      <PageHeader
        title="Radar de tendências"
        subtitle="Assuntos, formatos, ganchos, áudios e ferramentas que estão crescendo. Prioridade para janelas curtas que façam sentido para a identidade de João."
        actions={
          <form>
            <select name="data" defaultValue={date} className="input w-auto">
              {uniqueDates.map((d) => <option key={d} value={d}>{formatDate(d)}</option>)}
            </select>
            <button className="btn-ghost ml-2">Ver</button>
          </form>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {sorted.map((t) => {
          const st = TREND_LABEL[t.status] ?? { label: t.status, tone: "gray" as const };
          const growth = t.growth as { note?: string; signals?: { term: string; growth: number; distinctCreators: number }[] };
          return (
            <article key={t.id} className="card card-pad">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={st.tone}>{st.label}</Badge>
                <Badge tone="gray">{SIGNAL[t.signal_type] ?? t.signal_type}</Badge>
                {t.identity_fit !== null && <Badge tone={t.identity_fit >= 70 ? "green" : "gray"}>aderência {t.identity_fit}/100</Badge>}
                {t.record_now && <Badge tone="green">gravar agora</Badge>}
              </div>
              <h3 className="mt-3 text-base font-medium text-white">{t.title}</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <Item label="O que está acontecendo" text={t.what_is_happening} />
                <Item label="Por que as pessoas consomem" text={t.why_people_consume} hyp />
                <Item label="Formato que está funcionando" text={t.working_format} />
                <Item label="Como adaptar para João" text={t.adaptation} />
                <Item label="Vale gravar agora?" text={`${t.record_now ? "Sim" : "Não"} — ${t.record_now_reason ?? ""}`} />
                <div>
                  <dt className="label">Velocidade de crescimento</dt>
                  <dd className="text-ink-300">{growth?.note ?? "sem dados"}</dd>
                  {growth?.signals?.length ? (
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {growth.signals.map((s) => <Badge key={s.term} tone="gray">“{s.term}” {s.growth}x · {s.distinctCreators} criadores</Badge>)}
                    </dd>
                  ) : null}
                </div>
              </dl>
              <div className="mt-4 border-t border-ink-800 pt-3">
                <div className="label">Evidências ({(t.evidence_video_ids as string[]).length})</div>
                <ul className="space-y-1 text-xs">
                  {(t.evidence_video_ids as string[]).slice(0, 6).map((id) => {
                    const v = vmap.get(id);
                    return v ? (
                      <li key={id} className="truncate">
                        <a href={v.url} target="_blank" rel="noopener noreferrer" className="link">{v.title ?? v.url}</a>
                        <span className="text-ink-500"> · {v.channel_name}</span>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function Item({ label, text, hyp }: { label: string; text: string; hyp?: boolean }) {
  return (
    <div>
      <dt className="label flex items-center gap-2">{label} {hyp && <Quality q="hipotese" />}</dt>
      <dd className="leading-6 text-ink-200">{text}</dd>
    </div>
  );
}

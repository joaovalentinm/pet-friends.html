import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { latestRun } from "@/lib/queries";
import { PageHeader, Empty, ViralClass, PlatformTag, Quality, CLASS_LABEL } from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/time";

const PAGE = 50;

export default async function RadarPage({ searchParams }: { searchParams: Promise<{ plataforma?: string; classe?: string; q?: string; run?: string; p?: string }> }) {
  const sp = await searchParams;
  const db = await createClient();
  const run = sp.run ? (await db.from("daily_runs").select("*").eq("id", sp.run).maybeSingle()).data : await latestRun(db, true);
  if (!run) return (<><PageHeader title="Radar viral" /><Empty title="Radar vazio">Execute a rotina diária para coletar conteúdos.</Empty></>);
  const page = Math.max(0, Number(sp.p ?? 0) || 0);

  let q = db
    .from("viral_scores")
    .select("id,video_id,viral_index,score,classification,quality,velocity_per_hour,relevance,videos!inner(id,platform,url,title,channel_name,published_at,topic_tags,discovered_via,creator_id)", { count: "exact" })
    .eq("run_id", run.id)
    .order("score", { ascending: false })
    .range(page * PAGE, page * PAGE + PAGE - 1);
  if (sp.plataforma) q = q.eq("videos.platform", sp.plataforma);
  if (sp.classe) q = q.eq("classification", sp.classe);
  if (sp.q) q = q.ilike("videos.title", `%${sp.q.replace(/[%_]/g, "")}%`);
  const { data, count } = await q;
  const ids = (data ?? []).map((d) => d.video_id);
  const { data: metrics } = ids.length ? await db.from("video_latest_metrics").select("video_id,views,likes,comments,channel_followers,quality").in("video_id", ids) : { data: [] };
  const m = new Map((metrics ?? []).map((x) => [x.video_id, x]));
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `?${p}`;
  };

  return (
    <>
      <PageHeader
        title="Radar viral"
        subtitle={`Todos os conteúdos avaliados na execução de ${formatDate(run.run_date)} (${count ?? 0}). O índice compara cada vídeo com a mediana do próprio criador.`}
      />
      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="w-full sm:w-64">
          <label className="label">Buscar</label>
          <input name="q" defaultValue={sp.q} className="input" placeholder="título contém..." />
        </div>
        <div>
          <label className="label">Plataforma</label>
          <select name="plataforma" defaultValue={sp.plataforma ?? ""} className="input">
            <option value="">Todas</option><option value="youtube">YouTube</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option>
          </select>
        </div>
        <div>
          <label className="label">Classificação</label>
          <select name="classe" defaultValue={sp.classe ?? ""} className="input">
            <option value="">Todas</option>
            {Object.entries(CLASS_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        {sp.run && <input type="hidden" name="run" value={sp.run} />}
        <button className="btn-ghost">Filtrar</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-ink-700/60">
            <tr><th className="th">Conteúdo</th><th className="th">Plataforma</th><th className="th text-right">Views</th><th className="th text-right">Índice</th><th className="th text-right">Score</th><th className="th">Classificação</th><th className="th">Origem</th></tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {(data ?? []).map((r) => {
              const v = r.videos as unknown as { id: string; platform: string; url: string; title: string | null; channel_name: string | null; published_at: string | null; discovered_via: string };
              const mm = m.get(r.video_id);
              return (
                <tr key={r.id} className="hover:bg-ink-850/50">
                  <td className="td max-w-md">
                    <Link href={`/analise/${v.id}`} className="line-clamp-1 text-ink-100 hover:text-white">{v.title ?? v.url}</Link>
                    <div className="text-xs text-ink-400">{v.channel_name} · {formatDate(v.published_at)}</div>
                  </td>
                  <td className="td"><PlatformTag p={v.platform} /></td>
                  <td className="td text-right tabular-nums">{mm?.views !== null && mm?.views !== undefined ? formatNumber(mm.views) : <span className="text-ink-500">{formatNumber((mm?.likes ?? 0) + (mm?.comments ?? 0))} int.</span>}</td>
                  <td className="td text-right tabular-nums">{r.viral_index !== null ? `${Number(r.viral_index)}x` : "—"} <Quality q={r.quality} /></td>
                  <td className="td text-right tabular-nums font-medium">{Number(r.score)}</td>
                  <td className="td"><ViralClass c={r.classification} /></td>
                  <td className="td text-xs text-ink-400">{v.discovered_via === "criador_monitorado" ? "criador monitorado" : "radar geral"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!data?.length && <div className="p-6 text-center text-sm text-ink-400">Nenhum conteúdo com esses filtros.</div>}
      </div>
      <div className="mt-4 flex justify-between text-sm">
        {page > 0 ? <Link className="link" href={qs({ p: String(page - 1) })}>← anteriores</Link> : <span />}
        {(count ?? 0) > (page + 1) * PAGE && <Link className="link" href={qs({ p: String(page + 1) })}>próximos →</Link>}
      </div>
    </>
  );
}

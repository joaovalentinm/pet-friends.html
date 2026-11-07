import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge, Empty, PlatformTag } from "@/components/ui";
import { CONTENT_FORMATS } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/time";

type SP = { de?: string; ate?: string; criador?: string; categoria?: string; plataforma?: string; tema?: string; views?: string; indice?: string; formato?: string; status?: string; fav?: string };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const db = await createClient();
  let q = db
    .from("scripts")
    .select("id,run_date,headline,status,favorite,saved,theme,content_format,duration_seconds,reference_video_id,ideas(score_total,editorial_pillar,reference_snapshot),videos(platform,creator_id,channel_name,creators(name,category_id))")
    .order("run_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (sp.de) q = q.gte("run_date", sp.de);
  if (sp.ate) q = q.lte("run_date", sp.ate);
  if (sp.status) q = q.eq("status", sp.status);
  else q = q.neq("status", "arquivado");
  if (sp.formato) q = q.eq("content_format", sp.formato);
  if (sp.tema) q = q.ilike("theme", `%${sp.tema.replace(/[%_]/g, "")}%`);
  if (sp.fav) q = q.eq("favorite", true);
  const [{ data }, { data: creators }, { data: categories }] = await Promise.all([
    q,
    db.from("creators").select("id,name").neq("status", "removido").order("name"),
    db.from("categories").select("id,name").order("sort_order"),
  ]);

  const rows = (data ?? []).filter((s) => {
    const v = s.videos as unknown as { platform: string; creator_id: string | null; creators: { category_id: string } | null } | null;
    const snap = (s.ideas as unknown as { reference_snapshot: { views?: number; viral_index?: number } } | null)?.reference_snapshot ?? {};
    if (sp.criador && v?.creator_id !== sp.criador) return false;
    if (sp.categoria && v?.creators?.category_id !== sp.categoria) return false;
    if (sp.plataforma && v?.platform !== sp.plataforma) return false;
    if (sp.views && (snap.views ?? 0) < Number(sp.views)) return false;
    if (sp.indice && (snap.viral_index ?? 0) < Number(sp.indice)) return false;
    return true;
  });

  return (
    <>
      <PageHeader title="Biblioteca de roteiros" subtitle="Todos os roteiros gerados, sempre vinculados à referência original." />
      <form className="card mb-4 grid grid-cols-2 gap-3 p-4 md:grid-cols-4 lg:grid-cols-6">
        <F label="De"><input type="date" name="de" defaultValue={sp.de} className="input" /></F>
        <F label="Até"><input type="date" name="ate" defaultValue={sp.ate} className="input" /></F>
        <F label="Criador">
          <select name="criador" defaultValue={sp.criador ?? ""} className="input"><option value="">Todos</option>{creators?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </F>
        <F label="Categoria">
          <select name="categoria" defaultValue={sp.categoria ?? ""} className="input"><option value="">Todas</option>{categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </F>
        <F label="Plataforma">
          <select name="plataforma" defaultValue={sp.plataforma ?? ""} className="input"><option value="">Todas</option><option value="youtube">YouTube</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="web">Notícia</option></select>
        </F>
        <F label="Tema"><input name="tema" defaultValue={sp.tema} className="input" /></F>
        <F label="Views mín. (ref.)"><input type="number" name="views" defaultValue={sp.views} className="input" /></F>
        <F label="Índice viral mín."><input type="number" step="0.1" name="indice" defaultValue={sp.indice} className="input" /></F>
        <F label="Tipo de conteúdo">
          <select name="formato" defaultValue={sp.formato ?? ""} className="input"><option value="">Todos</option>{CONTENT_FORMATS.map((f) => <option key={f} value={f}>{f.replace(/_/g, " ")}</option>)}</select>
        </F>
        <F label="Status">
          <select name="status" defaultValue={sp.status ?? ""} className="input"><option value="">Ativos</option>{["rascunho", "pronto", "gravado", "publicado", "arquivado"].map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </F>
        <F label="Favoritos"><label className="flex h-[38px] items-center gap-2 text-sm text-ink-300"><input type="checkbox" name="fav" value="1" defaultChecked={Boolean(sp.fav)} /> só favoritos</label></F>
        <div className="flex items-end gap-2"><button className="btn-ghost">Filtrar</button><Link href="/roteiros" className="text-xs link">limpar</Link></div>
      </form>

      {!rows.length ? (
        <Empty title="Nenhum roteiro encontrado" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="border-b border-ink-700/60"><tr><th className="th">Roteiro</th><th className="th">Data</th><th className="th">Referência</th><th className="th text-right">Nota</th><th className="th">Formato</th><th className="th">Status</th></tr></thead>
            <tbody className="divide-y divide-ink-800">
              {rows.map((s) => {
                const idea = s.ideas as unknown as { score_total: number; editorial_pillar: string; reference_snapshot: { views?: number; viral_index?: number } } | null;
                const v = s.videos as unknown as { platform: string; channel_name: string | null; creators: { name: string } | null } | null;
                return (
                  <tr key={s.id} className="hover:bg-ink-850/50">
                    <td className="td"><Link href={`/roteiros/${s.id}`} className="text-ink-100 hover:text-white">{s.favorite && "★ "}{s.headline}</Link><div className="text-xs text-ink-400">{idea?.editorial_pillar} · {s.theme} · {s.duration_seconds}s</div></td>
                    <td className="td whitespace-nowrap text-xs">{formatDate(s.run_date)}</td>
                    <td className="td text-xs">{v ? <><PlatformTag p={v.platform} /> {v.creators?.name ?? v.channel_name} · {formatNumber(idea?.reference_snapshot?.views ?? null)} views{idea?.reference_snapshot?.viral_index ? ` · ${idea.reference_snapshot.viral_index}x` : ""}</> : <span className="text-ink-500">tendência</span>}</td>
                    <td className="td text-right tabular-nums">{idea?.score_total ?? "—"}</td>
                    <td className="td text-xs">{s.content_format?.replace(/_/g, " ")}</td>
                    <td className="td"><Badge tone={s.status === "publicado" ? "green" : s.status === "gravado" ? "amber" : "gray"}>{s.status}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}

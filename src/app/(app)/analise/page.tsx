import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Empty, PlatformTag, Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/time";

export default async function AnalysesPage() {
  const db = await createClient();
  const { data } = await db
    .from("analyses")
    .select("id,created_at,inputs_used,result,videos(id,title,url,platform,channel_name)")
    .eq("kind", "engenharia_reversa")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <>
      <PageHeader
        title="Análise de vídeos"
        subtitle="Engenharia reversa com IA: gancho, promessa, narrativa, retenção, edição e o mecanismo de atenção que pode ser transferido para João. Para analisar um vídeo, use o botão “Analisar vídeo com IA” no Top 10, no Radar ou na página do vídeo."
      />
      {!data?.length ? (
        <Empty title="Nenhuma análise ainda">Abra um conteúdo no <Link href="/radar" className="link">Radar viral</Link> ou no <Link href="/top10" className="link">Top 10</Link> e clique em “Analisar vídeo com IA”.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((a) => {
            const v = a.videos as unknown as { id: string; title: string | null; platform: string; channel_name: string | null };
            const r = a.result as { formats?: string[]; attention_mechanism?: string };
            const inp = a.inputs_used as Record<string, unknown>;
            return (
              <Link key={a.id} href={`/analise/${v.id}`} className="card card-pad block hover:border-ink-500">
                <div className="flex flex-wrap items-center gap-2">
                  <PlatformTag p={v.platform} />
                  {r.formats?.map((f) => <Badge key={f} tone="gray">{f.replace(/_/g, " ")}</Badge>)}
                  {inp?.transcricao ? <Badge tone="green">com transcrição</Badge> : <Badge tone="amber">sem transcrição</Badge>}
                </div>
                <div className="mt-2 line-clamp-1 font-medium text-ink-100">{v.title}</div>
                <div className="text-xs text-ink-400">{v.channel_name} · {formatDateTime(a.created_at)}</div>
                <p className="mt-2 line-clamp-2 text-sm text-ink-300">{r.attention_mechanism}</p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

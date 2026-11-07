import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, Badge, Empty, Notice } from "@/components/ui";
import { RunPipelineButton } from "@/components/client";
import { IdeaReference, IdeaStrategy, IdeaScore, ScriptBody, ScriptActions, type IdeaRow, type ScriptRow } from "@/components/ScriptView";
import { formatDate, localDate } from "@/lib/time";

export default async function TodayPage() {
  const db = await createClient();
  const today = localDate();
  const { data: last } = await db.from("ideas").select("run_date").order("run_date", { ascending: false }).limit(1).maybeSingle();
  const date = last?.run_date ?? today;
  const { data: ideas } = await db.from("ideas").select("*, scripts(*)").eq("run_date", date).order("slot").order("created_at");

  return (
    <>
      <PageHeader
        title="O que gravar hoje?"
        subtitle={`As cinco melhores oportunidades para João, escolhidas a partir do Top viral, tendências, criadores monitorados, notícias e do desempenho anterior. ${date !== today ? `Exibindo a entrega mais recente (${formatDate(date)}).` : `Entrega de ${formatDate(date)}.`}`}
        actions={<RunPipelineButton />}
      />
      {date !== today && <Notice>A entrega de hoje ainda não foi gerada. A rotina roda às 07h; você também pode executá-la manualmente.</Notice>}
      {!ideas?.length ? (
        <Empty title="Nenhuma oportunidade gerada">As ideias e roteiros dependem de conteúdos coletados e da IA configurada (ANTHROPIC_API_KEY). Veja <Link href="/historico" className="link">o histórico</Link> para entender o que faltou.</Empty>
      ) : (
        <>
          {ideas.length < 5 && <Notice>Foram geradas {ideas.length} de 5 oportunidades nesta execução. Consulte o histórico para ver o motivo.</Notice>}
          <nav className="mb-6 flex flex-wrap gap-2">
            {ideas.map((i) => (
              <a key={i.id} href={`#ideia-${i.slot}`} className="btn-ghost text-xs">
                {i.slot}. {i.editorial_pillar} <Badge tone="green">{i.score_total}</Badge>
              </a>
            ))}
          </nav>
          <div className="space-y-8">
            {ideas.map((idea) => {
              const script = (idea.scripts as ScriptRow[])[0];
              return (
                <section key={idea.id} id={`ideia-${idea.slot}`} className="scroll-mt-6">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-800 text-sm font-semibold text-white">{idea.slot}</span>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-ink-400">{idea.editorial_pillar}</div>
                      <h2 className="text-lg font-semibold text-white">{script?.headline ?? idea.subject}</h2>
                    </div>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-3">
                    <div className="space-y-4">
                      <Card title="Referência"><IdeaReference idea={idea as IdeaRow} /></Card>
                      <Card title="Estratégia"><IdeaStrategy idea={idea as IdeaRow} /></Card>
                      <Card title="Pontuação"><IdeaScore idea={idea as IdeaRow} /></Card>
                    </div>
                    <Card title="Roteiro completo" className="xl:col-span-2">
                      {script ? (
                        <>
                          <div className="mb-5"><ScriptActions s={script} /></div>
                          <ScriptBody s={script} />
                        </>
                      ) : (
                        <p className="text-sm text-amber-300">O roteiro desta ideia falhou na geração. Veja os logs no histórico e execute novamente.</p>
                      )}
                    </Card>
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

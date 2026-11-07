# Arquitetura

```
Vercel Cron (10:00 UTC) ──► /api/cron/daily ──► syncOwnInstagram → refreshLearnings → runDaily()
Botão "Executar agora" ──► /api/pipeline/run ──► startRun() + after(runDailyPipeline)

runDailyPipeline (src/lib/pipeline/daily.ts) — cada etapa isolada; falha não derruba as demais
 1. verificar_fontes        registry.syncSourceStatuses()
 2. coletar_fontes          collect.ts → YouTube | Instagram (criadores validados) | TikTok | Hacker News  (em paralelo)
 3. atualizar_metricas      store.persistVideos (upsert sem duplicar) + video_metrics (append-only) + baselines + seguidores
 4. calcular_indice_viral   viral/score.ts computeViral (vs. mediana do criador; velocidade entre coletas)
 5. top10_viral             Claude anota top 30 → reclassifica → selectTop(10, máx. 2/canal) → análise estratégica
 6. descobrir_criadores     sugestões (≥ mínimo de seguidores na plataforma de origem, conteúdos muito acima da média)
 7. radar_tendencias        trends/signals.ts (crescimento de termos) + Claude → trends com evidências verificadas
 8. gerar_ideias            Claude escolhe 5 → scoring/opportunity.ts (dados + IA, renormalização explícita) → ideas
 9. gerar_roteiros          engenharia reversa da referência (cache) + Claude escreve 5 roteiros em paralelo → scripts
10. notificar               e-mail / WhatsApp (opcional)
11. finalização             status concluido | parcial | falhou, stats, fontes indisponíveis, logs
```

## Pastas

```
supabase/migrations/   schema + seed
src/lib/sources/       adaptadores de fontes (um arquivo por integração) + registry de status
src/lib/viral/         índice de viralização (lógica pura, testada)
src/lib/scoring/       pontuação de oportunidades (lógica pura, testada)
src/lib/trends/        sinais quantitativos de tendência (lógica pura, testada)
src/lib/ai/            cliente Claude (custo, teto, fallback), persona de João, schemas Zod, tarefas
src/lib/pipeline/      orquestração, coleta e persistência
src/lib/performance/   métricas próprias, agregados e aprendizados
src/app/(app)/         telas autenticadas
src/app/actions/       server actions (todas com requireUser + Zod)
src/app/api/           cron, execução manual, análise de vídeo, sincronização
tests/                 vitest + asserções SQL
```

## Decisões

- **Monólito Next.js** (sem serviço Python separado): todas as integrações são HTTP; menos peças para operar.
- **Claude com saída estruturada**: toda resposta é validada contra um schema Zod; `stop_reason` é checado antes
  (recusa/truncamento viram erro, nunca conteúdo parcial). `fallbacks: "default"` ativo para recusas de segurança.
  Persona de João no prefixo do system com cache de prompt.
- **Custo de IA controlado** por teto diário (`ai_daily_budget_usd`) e registro por chamada em `ai_usage`.
- **Qualidade do dado** por campo (`observado`/`estimado`/`indisponivel`) gravada junto da métrica; a interface mostra o selo.
- **Cota do YouTube**: rotação diária das consultas (`pickQueries`) e cache de 72h das bases dos canais.

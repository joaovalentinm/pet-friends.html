# JOÃO CONTENT INTELLIGENCE

Plataforma de inteligência, viralização e estratégia de conteúdo com IA para João Valentim.
Todos os dias, às **07h (America/Sao_Paulo)**, entrega:

1. **Top 10 viral** do radar geral (IA, tecnologia, marketing, negócios) — ranqueado pelo desempenho **relativo ao padrão de cada criador**, não por visualizações absolutas.
2. **Análise estratégica** desses conteúdos.
3. **Cinco oportunidades** adaptadas à marca pessoal de João, com nota de 0 a 100 justificada.
4. **Cinco roteiros completos**, originais e prontos para gravação (gancho, fala palavra por palavra, cenas, textos na tela, edição, CTA e direção de gravação).

> Princípio central: **nenhum dado é inventado**. Toda métrica tem origem e data de coleta, e é marcada como
> *confirmada*, *estimada*, *indisponível* ou *hipótese da IA*. Se não houver 10 conteúdos que atinjam os critérios,
> o sistema mostra quantos encontrou e explica a limitação.

---

## Stack

| Camada | Tecnologia |
|---|---|
| App | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| Banco / Auth | Supabase (Postgres + Auth + RLS) |
| IA | Claude (`claude-opus-5-5`) via SDK oficial `@anthropic-ai/sdk`, saída estruturada validada com Zod |
| Agendamento | Vercel Cron (`0 10 * * *` UTC = 07:00 BRT) |
| Fontes | YouTube Data API v3, Instagram Graph API (Meta), TikTok Research API, Hacker News (Algolia), AssemblyAI |

Arquitetura detalhada: [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

---

## Como colocar no ar

### 1. Supabase
1. Crie um projeto em supabase.com.
2. No **SQL Editor**, execute em ordem `supabase/migrations/0001_schema.sql` e `0002_seed.sql`
   (ou `supabase db push` com a CLI).
3. **Authentication → Providers → Email**: desative “Allow new users to sign up”.
4. **Authentication → Users → Add user**: crie o usuário de João (e-mail + senha).
5. Copie `Project URL`, `anon key` e `service_role key` (Settings → API).

### 2. Variáveis de ambiente
Copie `.env.example` para `.env.local` (dev) e configure as mesmas no painel da Vercel.
Mínimo para funcionar: Supabase + `ALLOWED_EMAILS` + `CRON_SECRET` + `ANTHROPIC_API_KEY` + `YOUTUBE_API_KEY`.

### 3. Deploy na Vercel
1. Importe o repositório. O `vercel.json` já registra o cron diário.
2. A rotina usa `maxDuration = 800s` → requer plano **Pro com Fluid Compute**. No plano Hobby,
   reduza a carga (menos consultas em `radar_topics`) ou rode a rotina por outro agendador chamando
   `GET /api/cron/daily` com `Authorization: Bearer $CRON_SECRET`, ou `npm run pipeline:run` num servidor.

### 4. Desenvolvimento local
```bash
npm install
npm run dev          # http://localhost:3000
npm test             # testes unitários e de integração com APIs simuladas
npm run test:db      # aplica as migrações num Postgres local e roda as asserções
npm run typecheck
npm run pipeline:run # executa a rotina diária pela linha de comando
```

---

## Integrações: o que está pronto e o que falta conectar

| Integração | Estado | O que você precisa fornecer |
|---|---|---|
| **Supabase** | Pronto | Projeto + chaves (passo 1) |
| **Claude (Anthropic)** | Pronto | `ANTHROPIC_API_KEY` (console.anthropic.com) |
| **YouTube Data API v3** | Pronto — principal fonte do Radar Viral | `YOUTUBE_API_KEY` (Google Cloud → ativar YouTube Data API v3 → chave de API) |
| **Instagram Graph API** | Pronto — validação de seguidores, monitoramento de criadores, métricas de João | Conta de João como **Profissional** vinculada a uma Página do Facebook; app Meta Business com `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`, `business_management`; `META_ACCESS_TOKEN` (longa duração) e `IG_BUSINESS_ACCOUNT_ID` |
| **TikTok Research API** | Adaptador pronto, inativo | Aprovação no programa Research API do TikTok + `TIKTOK_CLIENT_KEY`/`SECRET` |
| **Hacker News** | Pronto (público) | — |
| **AssemblyAI** | Pronto (opcional) | `ASSEMBLYAI_API_KEY` |
| **Resend / WhatsApp** | Prontos (opcionais) | Chaves + ativar em Configurações → `notifications` |
| **Metricool** | Reservado | Plano com acesso à API + tokens; adaptador será concluído com a documentação do plano |
| **vidIQ** | Reservado | Não há API pública; só com acordo de acesso |

### Limites honestos das plataformas
- A Meta **não fornece** alcance, retenção, salvamentos, compartilhamentos nem visualizações de **terceiros**.
  Para concorrentes usamos apenas dados públicos (seguidores, curtidas, comentários) via Business Discovery,
  que só funciona com **contas profissionais**. Nesse caso o índice de viralização usa engajamento como base.
- O YouTube não expõe compartilhamentos e não permite baixar legendas de vídeos de terceiros.
- **Nunca** automatizamos login com senha, scraping ou contorno de proteções.
- Transcrições só entram por fonte autorizada (colada manualmente com confirmação, ou arquivo autorizado via AssemblyAI).

---

## Relatório por fase

### Fase 1 — Arquitetura, ambiente e banco ✅
- **Desenvolvido:** schema completo (`supabase/migrations`) com 25 tabelas: usuários, criadores, categorias, fontes,
  vídeos, métricas históricas, transcrições, análises, trends, ideias, roteiros, publicações próprias, resultados,
  execuções, logs, custos de IA. Métricas **append-only** (trigger bloqueia UPDATE/DELETE), qualidade do dado por campo,
  deduplicação (plataforma + id externo; hash de roteiro; chave de ideia), trava de execução única, RLS por membro.
- **Seed:** 29 referências (10 internacionais, 11 brasileiras de IA + Viver de IA, 7 de marketing) — **todas pendentes de
  validação, sem nenhum número de seguidores inventado**. Perfis sem @ confirmado (João Vitor Chaves, Tony Ventura,
  Marcela Lúzio, Julia Becker, Thay Dantas, Viver de IA) ficam sem handle. Giullia Becker separada de Julia Becker.
  Diego Di Loreto (prioridade máxima) e Rafael Kiso com os focos de estudo pedidos; Rafael Milagre classificado em IA aplicada a negócios.
- **Testado:** `npm run test:db` aplica as migrações em Postgres 16 e verifica seed, deduplicação, imutabilidade, cascata e trava.

### Fase 2 — Autenticação e dashboard ✅
- Login por senha ou link mágico (Supabase Auth), allowlist `ALLOWED_EMAILS`, middleware protegendo todas as rotas,
  RLS como segunda camada. Interface grafite/branco/verde, responsiva, com as 11 seções do menu.
- **Testado:** build de produção; redirecionamento para login, 401 em APIs sem sessão e no cron sem segredo.

### Fase 3 — Cadastro e validação de criadores ✅
- Cadastrar, editar, pausar, remover (soft) e excluir; organização por categoria; validação automática do mínimo
  de 40 mil seguidores via Instagram Graph API (com histórico de seguidores) ou validação manual **com fonte obrigatória**,
  sinalizada como manual. Perfil só conta como *monitorado* quando validado **e** com fonte funcional.
  Descoberta automática de novos criadores (sugestões) a partir do radar.
- **Depende de:** credenciais Meta para validação automática.

### Fase 4 — Integração com fontes ✅ (estrutura) / ⏳ (credenciais)
- Adaptadores modulares com timeout, repetição em 429/5xx, status por fonte, histórico de coletas e explicação
  do que falta para ativar cada um (tela Configurações). Falha de uma fonte não interrompe as outras.
- **Testado:** adaptadores YouTube e Instagram com respostas simuladas (cota, token inválido, perfil inexistente, métricas indisponíveis).

### Fase 5 — Radar viral e Top 10 ✅
- **Índice de viralização** = desempenho ÷ mediana do próprio criador (prioriza Shorts para comparar igual com igual),
  com velocidade entre coletas, idade, engajamento e relevância. Classificações: viral confirmado, muito acima da média,
  crescimento acelerado, trend emergente, estratégico. “Viral confirmado” exige base histórica real (nunca estimativa) e volume mínimo.
  Top 10 com diversidade (máx. 2 por canal) e os 16 campos pedidos; análise estratégica do dia.
- **Testado:** exemplo do briefing (20 mil → 400 mil = 20x = viral confirmado); muitas views no padrão ≠ viral; estimativas marcadas.

### Fase 6 — Engenharia reversa ✅
- Botão “Analisar vídeo com IA” (Top 10, Radar, página do vídeo). Analisa gancho, headline, promessa, narrativa,
  retenção, CTA, ritmo, edição, elementos visuais, linguagem e formato; cada ponto marcado como **evidência** ou **hipótese**.
  Usa a miniatura (visão) e a transcrição autorizada quando existir. Cache por insumos para não gastar IA à toa.

### Fase 7 — Radar de tendências ✅
- Sinais quantitativos (termos crescendo entre janelas, nº de criadores distintos, áudios recorrentes do TikTok) +
  IA para explicar o que acontece, por que as pessoas consomem, formato, adaptação e se vale gravar agora.
  Status emergente / em crescimento / em alta / saturada. Tendência sem evidência verificável é descartada.

### Fase 8 — Motor de inteligência e roteiros ✅
- Seleção das 5 oportunidades com distribuição editorial orientativa, justificativa quando foge dela,
  bloqueio de temas repetidos dos últimos 30 dias. Nota 0–100 com 8 critérios: os 2 de desempenho vêm de **dados**;
  os demais da IA com justificativa; critérios sem dados são excluídos e os pesos redistribuídos (explicitamente).
  Roteiros completos e originais, com direção de gravação. Biblioteca com filtros, favoritar, salvar, editar (com versões),
  copiar, marcar gravado/publicado, arquivar — sempre vinculada à referência.

### Fase 9 — Automação diária ✅
- Vercel Cron às 10:00 UTC (07:00 BRT). Fluxo de 13 etapas com registro de horário, etapas, erros e fontes indisponíveis;
  execução manual em segundo plano com acompanhamento; trava contra execuções simultâneas; liberação de travas órfãs;
  teto diário de gasto com IA. Resumo opcional por e-mail/WhatsApp.

### Fase 10 — Performance da conta de João ✅
- Sincronização com a Graph API (views, alcance, curtidas, comentários, compartilhamentos, salvamentos, seguidores,
  tempo médio de exibição quando disponível), registro manual, vínculo publicação ↔ roteiro (herda tema, formato, gancho e
  criador de referência). Agregados por tema/formato/criador e aprendizados da IA (a partir de 5 publicações) que alimentam
  os roteiros seguintes.

### Fase 11 — Testes, segurança e publicação ✅ (código) / ⏳ (deploy)
- 32 testes automatizados + teste de migrações. Segurança: RLS, rotas protegidas, segredo do cron com comparação em tempo
  constante, validação Zod em todas as entradas, sanitização de credenciais nos logs, redirecionamento seguro no login,
  headers de segurança, conteúdo coletado tratado como dado (não instrução) nos prompts.
- **Falta:** criar o projeto Supabase, configurar as variáveis e fazer o deploy na Vercel (passos acima).

## Critérios de aceitação

| # | Critério | Situação |
|---|---|---|
| 1 | Acesso com autenticação | Implementado |
| 2 | Cadastrar e editar criadores | Implementado |
| 3 | Organizar por categoria | Implementado |
| 4 | Validar mínimo de 40 mil | Implementado (automático com Meta; manual com fonte) |
| 5 | Consultar conteúdos coletados | Implementado (Radar viral) — depende de `YOUTUBE_API_KEY` e/ou Meta |
| 6 | Visualizar Top 10 viral | Implementado — depende de fontes ativas |
| 7 | Analisar vídeos | Implementado — depende de `ANTHROPIC_API_KEY` |
| 8 | Identificar tendências | Implementado — depende de IA + coletas |
| 9 | Gerar cinco roteiros completos | Implementado — depende de IA + coletas |
| 10 | Salvar e editar roteiros | Implementado |
| 11 | Registrar conteúdos publicados | Implementado |
| 12 | Acompanhar resultados próprios | Implementado (manual já; automático com Meta) |
| 13 | Análise diária automática | Implementado (Vercel Cron) — ativa após deploy |
| 14 | Consultar histórico | Implementado |
| 15 | Identificar fontes indisponíveis e falhas | Implementado |

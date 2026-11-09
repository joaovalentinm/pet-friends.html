# CLAUDE.md — Pet Friends

Instruções permanentes para qualquer agente que trabalhe neste repositório.
Planejamento completo: `docs/PLANEJAMENTO.md`. Decisões técnicas: `docs/ADR/`.

## O produto

**Pet Friends — "Casa do seu melhor amigo."** App gratuito para tutores de **cães e gatos** organizarem saúde, cuidados e rotina dos pets, com compartilhamento familiar.

Escopo aprovado (e somente ele):
1. Cadastro/login e perfil do pet (vários pets, foto, peso).
2. Carteira digital de saúde (vacinas, vermífugos, antipulgas, medicamentos, consultas, exames, anexos, ordem cronológica).
3. Cuidados em casa (alimentação, hidratação, banho, passeio, higiene, medicação, personalizados — com quando e por quem).
4. Lembretes e notificações push (editar, concluir, cancelar).
5. Compartilhamento familiar (convites, papéis, remoção, histórico por pessoa).
6. Locais (diretório veterinário): a pessoa informa o **CEP** e vê clínicas, hospitais e demais categorias veterinárias da região, com dados do **Google** em tempo real; contato externo por telefone/WhatsApp/site/mapa.
7. Linha do tempo e **caderneta em PDF** (gerada no celular, com espaço para assinatura e carimbo/CRMV nas vacinas). O link seguro para veterinário fica **adiado** (decisão de 08/11/2026).

Decisões do responsável (08/11/2026): **nenhum item extra do protótipo** entra (sem pet shops, modo escuro, restaurar backup, tipo "Cirurgia"). **Atualização 09/11/2026 (pedido do responsável):** entram os **sons** de notificação escolhidos pela pessoa (latido, miado, passarinho ou "plim") e a **voz "Pet Friends" ao abrir o app**, que pode ser desligada. Toda informação cadastrada gera aviso com o nome do pet; detalhes na Etapa 6 de `docs/PLANO_APP_NATIVO.md`. O seletor "Registrando como" do protótipo **não existe** no app: cada pessoa entra com a própria conta, e quem aceita um convite é registrado como **"Convidado"**.

> ✅ **ROTA ATUAL (aprovada em 09/11/2026):** o produto é um **site instalável (PWA)**, sem Play Store e sem App Store. Plano em `docs/PLANO_PWA.md`. Limite aceito pelo responsável: com o app fechado, a notificação usa o som padrão do celular; o som escolhido toca com o app aberto.

## Proibido (fora do escopo — não implementar, nem "preparar terreno")

Pagamentos, assinaturas, plano Premium · comunidade/rede social · GPS/rastreamento de animais · marketplace · painel de parceiros · agendamento próprio · qualquer funcionalidade não listada acima. Na dúvida, **pergunte antes**.

## Stack obrigatória (site instalável / PWA — aprovada em 09/11/2026)

Site: **React 19 + Vite 8 + TypeScript strict** · **Tailwind CSS 3.4** (cores de `src/theme/palette.js`) · **React Router 7** (rotas com `#`, ex.: `/#/pets`) · **vite-plugin-pwa** (manifesto, ícones, service worker, instalação) · fonte Nunito local (`@fontsource/nunito`, só alfabeto latino) · React Hook Form · Zod · Zustand (estado de cliente) · TanStack Query (dados do servidor).
Login: **somente e-mail e senha** (Google removido a pedido do responsável em 09/11/2026).
Lançamento: Nova Iguaçu – Baixada Fluminense (RJ).
Endereço: **https://petfriends.wearefield.io** (Hostinger, subdomínio do domínio do responsável; SSL vitalício, HTTPS forçado, CDN). Nomes livres caso queiram domínio próprio depois: `meupetfriends.com.br`, `petfriendsapp.com.br` (exigem CPF/CNPJ). O site usa caminhos relativos (`base: './'`). Como publicar: `docs/PUBLICACAO.md`.
Backend: Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) com RLS.
Notificações: **Web Push** (service worker + Supabase). Mapas: Google Maps para web + Places via Edge Function. Gráfico de peso: SVG simples. Monitoramento: Sentry (web). Testes: **Vitest + Testing Library**, E2E com **Playwright**.
Publicar o site no ar (GitHub Pages, Hostinger, Vercel etc.) **só com autorização explícita do responsável**.

**Não troque nem adicione bibliotecas relevantes sem justificar e obter aprovação.**

## Estrutura

- `src/pages/` — telas (rotas). Telas finas: compõem componentes e hooks; sem chamadas diretas ao Supabase.
- `src/components/` — Design System (`ui.tsx`, `Icon`, `Sheet`, `Layout`, `InstallSheet`, `Toast`).
- `src/pwa/` — instalação na tela de início e detecção do aparelho.
- `public/` — ícones do PWA e logo.
- `src/features/<feature>/{components,hooks,services,schemas,types}` — auth, pets, health, care, reminders, family, vets, reports.
- `src/services/` — cliente Supabase e infraestrutura. **Só services falam com Supabase/APIs.**
- `src/stores/` (Zustand) · `src/integrations/` · `src/validation/` · `src/types/` · `src/config/` · `src/theme/` · `src/i18n/` · `src/utils/`.
- `supabase/migrations/`, `supabase/functions/`, `supabase/tests/` (pgTAP).
- `e2e/` — fluxos E2E (Playwright).

Imports com alias `@/` → `src/`.

## Convenções de código

- TypeScript `strict`; proibido `any` e `@ts-ignore` (use `unknown` + Zod).
- Identificadores, tabelas e colunas em **inglês**; **todo texto visível ao usuário em português brasileiro**, centralizado em `src/i18n/`. Rotas em pt-BR (`/pets/[petId]/saude`).
- Um schema Zod por entidade em `features/*/schemas`, usado no formulário (`zodResolver`) e no service. Mensagens de erro em pt-BR.
- Tipos do banco: gerar com `npm run db:types` após qualquer migration; nunca editar `src/types/database.ts` à mão.
- Dados do servidor: TanStack Query (query keys por feature, ex.: `['pets', petId, 'health']`), invalidados por eventos Realtime. Zustand apenas para estado de cliente (sessão, pet ativo, preferências) — nunca copiar dados do servidor para stores.
- Datas: banco em `timestamptz`/`date`; exibir com `date-fns` + `ptBR`; lembretes guardam fuso IANA.
- Componentes funcionais, nomes em PascalCase, hooks `useX`, arquivos de tela em minúsculas.
- Commits no padrão Conventional Commits (`feat(pets): ...`, `fix(reminders): ...`).

## Design System

- Usar **somente** a identidade visual oficial (logo, paleta, tipografia, elementos). Não inventar cores ou fontes. Referência completa: `docs/DESIGN_SYSTEM.md`.
- **Paleta oficial (08/11/2026):** laranja `#F97316` (botões de ação, destaques, ícones), verde `#16A34A` (ícone do app, confirmações, concluído), creme `#FFF8EF` (fundo). Tons de apoio do protótipo em `src/theme/palette.js`. Nota: texto branco sobre o laranja tem contraste abaixo do AA; mitigado com texto em negrito ≥ 16,5px (decisão do responsável).
- Referência visual de telas, textos, ícones e fluxos: `prototipo/pet-friends.html` (recriar no site, **não copiar** o código).
- Fonte: Nunito (`@fontsource/nunito`). O letreiro do logo é sempre imagem (`assets/brand/`).
- Abas (como no protótipo): **Início · Pets · Caderneta · Lembretes · Locais**. O **Perfil** abre pelo avatar no topo. Nunca criar aba/área de "Comunidade".
- Estilo apenas via tokens (`src/theme` + `tailwind.config.js`); nada de cor/tamanho hardcoded nas telas.
- Visual moderno, minimalista, acolhedor; sem excesso de decoração.
- Acessibilidade: `accessibilityLabel` em ícones/botões, área de toque ≥ 44pt, contraste AA, suporte a fonte grande.
- Todo estado de tela previsto: carregando (skeleton), vazio (EmptyState), erro (com ação de tentar novamente).

## Segurança e privacidade (inegociável)

- **RLS habilitado em toda tabela**, sem exceção. Acesso por pet sempre via `is_pet_member()` / `has_pet_role()` baseados em `pet_members`.
- Papéis exibidos: **Tutor** e **Convidado**. No banco: `role` = `tutor` | `guest`; convidado tem `permission` = `edit` (registra cuidados e saúde) ou `view` (só visualiza). Só o tutor convida, muda permissões e remove pessoas.
- Toda migration que cria/altera tabela inclui políticas RLS **e** testes pgTAP correspondentes.
- Funções `security definer` sempre com `set search_path = ''` e nomes qualificados.
- Buckets de Storage **privados**; caminho `{pet_id}/...`; leitura via signed URL de curta duração.
- O site só conhece variáveis `VITE_*` (URL do Supabase, anon key, DSN do Sentry, chave Maps restrita). **`service_role`, chave Places, tokens do Sentry/EAS nunca entram no app nem no Git** — ficam em secrets de Edge Functions / EAS.
- `.env*` no `.gitignore`; manter `.env.example` atualizado.
- Tokens (convites, links de veterinário): aleatórios, armazenados só como hash, com expiração e revogação.
- LGPD: coletar o mínimo; consentimento versionado (`user_consents`); exclusão de conta e dados pelo app; não enviar dados de saúde para Sentry (usar `beforeSend` para remover PII).
- Validar entrada no app (Zod) **e** no servidor (constraints SQL / Zod nas Edge Functions).

## Diretório veterinário

**Nunca inventar estabelecimentos, telefones, horários ou especialidades** — nem em mocks que possam chegar à produção. Todo registro tem `source` e `source_ref`. Horário só aparece se vier da fonte ou estiver verificado (`hours_verified_at`). Respeitar os termos do Google Places (guardar só `place_id`; demais dados buscados em tempo real pela Edge Function). `seed.sql` usa dados claramente fictícios e só roda em ambiente local.

## Comandos

```bash
npm install
npm run dev              # site local
npm run typecheck && npm run lint
npm test                 # Vitest + Testing Library
npm run build            # gera dist/ (com service worker e manifesto)
npm run preview          # testa o build localmente
supabase test db         # testes pgTAP de RLS
```

## Definição de pronto

Uma tarefa só está pronta quando: lint e typecheck passam; testes novos/afetados passam (unitários, RLS quando houver banco, Maestro quando for fluxo crítico); textos em pt-BR; estados de carregando/vazio/erro tratados; sem segredos no código; nada fora do escopo aprovado; `docs/` atualizado quando houver decisão técnica nova.

## Processo

- Seguir a ordem das etapas em `docs/PLANO_PWA.md` e pedir aprovação ao fim de cada etapa.
- Antes de mudanças grandes, apresentar plano curto. Relatar com honestidade o que foi e o que não foi testado.

## Status atual

- Rota: **site instalável (PWA)**, plano em `docs/PLANO_PWA.md`. A rota antiga (app nativo) está em `docs/PLANO_APP_NATIVO.md`, só como histórico.
- **Etapas 1, 2 e 3 publicadas** em https://petfriends.wearefield.io (09/11/2026), branch `etapa-1-base` (PR #2):
  - Etapa 1: base do site e instalação.
  - Etapa 2: banco com RLS, migration `supabase/migrations/20261109010000_etapa2_base.sql`, testes `supabase/tests/rls_etapa2.sql`, pasta privada `pet-photos`.
  - Etapa 3: login com e-mail e senha, esqueci a senha e nova senha. Google pronto no código, mas desligado (`VITE_GOOGLE_LOGIN_ENABLED=false`) até configurar.
- **Pendências do responsável no painel do Supabase:** (1) Authentication > URL Configuration: Site URL `https://petfriends.wearefield.io` e o mesmo em Redirect URLs; (2) SMTP próprio, porque o e-mail padrão só envia para membros da equipe do Supabase; 
- **Etapa 4 em andamento.** Parte 1 pronta: pets (cadastro com foto comprimida e sem EXIF, edição, perfil, exclusão, histórico de peso `pet_weights`). Parte 2 pronta: carteira de saúde (`health_records`, `health_documents`, pasta privada `pet-documents`; vacinas, vermífugos, antipulgas, medicamentos, consultas e exames com anexos, próxima dose, lembretes de saúde em Lembretes, "Saúde em breve" no Início, controle de vacinas na Caderneta). Faltam: cuidados em casa, Locais por CEP e o calendário de vacinas.
- Tabelas de saúde, cuidados, lembretes e convites entram nas Etapas 4 e 5.
- Ícones do PWA com sufixo `-v2` no nome, para furar o cache. Ao trocar o ícone de novo, mude o sufixo.
- **Métricas de uso (09/11/2026, pedido do responsável):** `public.app_usage` guarda só minutos por dia, via `track_usage`, com limite de 2 min por chamada. O **Painel** (`/#/painel`) é só para quem está em `private.admins` (a conta do responsável). `admin_stats()` devolve apenas totais. O advisor avisa sobre `is_admin`/`admin_stats` serem SECURITY DEFINER: é intencional, porque a checagem de admin fica dentro das funções.
- Ícone do app = logo oficial completo sobre o creme `#FFF1D7` (`public/icons/`).
- Login com Google: **removido** (09/11/2026).
- **Painel: acesso exclusivo do responsável** (conta jpvalentinmmind7@gmail.com, única em `private.admins`). Travado no banco pela constraint `admins_somente_dono` (migration `20261109030000_painel_somente_dono.sql`). Para abrir o Painel, o app pede a senha de novo, e o acesso vale por 15 minutos na aba. Nunca alterar isso sem pedido explícito dele.
- Hostinger: conta `u702147711`, pedido `1010187851`. Os sites `wearefield.io` (WordPress) e `bio.wearefield.io` (bio) são de outros projetos: **não mexer**.
- Regras do responsável: uma etapa por vez; testar e dizer o que ele confere no celular; não adicionar nada fora da especificação sem perguntar; explicar em linguagem simples (ele não é programador).
- Repositório: `joaovalentinm/pet-friends.html`. A branch `claude/joao-content-intelligence-9ze5og` é de **outro sistema** (FIELD): não mexer.
- Supabase oficial: **"PET FRIENDS BACK SP"** (`eytigmsbliglsmbgrujq`, São Paulo). Nunca usar o pausado "PET FRIENDS BACK" (`bwvsalfevnwpiftkdvuc`) nem o "FIELD Project" (`jlqcgtyyjeevtkeehcdg`).
- Segurança: checklist em `docs/SEGURANCA.md`.

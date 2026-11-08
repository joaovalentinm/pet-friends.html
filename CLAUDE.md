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

> ⚠️ **MUDANÇA DE ROTA (09/11/2026):** o produto passa a ser um **site instalável (PWA)**, sem Play Store e sem App Store. A proposta de plano e a troca de stack estão em `docs/PLANO_PWA.md`, **aguardando aprovação**. Até a aprovação, não programar a nova rota.

## Proibido (fora do escopo — não implementar, nem "preparar terreno")

Pagamentos, assinaturas, plano Premium · comunidade/rede social · GPS/rastreamento de animais · marketplace · painel de parceiros · agendamento próprio · qualquer funcionalidade não listada acima. Na dúvida, **pergunte antes**.

## Stack obrigatória

App: React Native · Expo (development builds, não Expo Go) · TypeScript strict · Expo Router · NativeWind · React Hook Form · Zod · Zustand (estado de cliente) · TanStack Query (dados do servidor — aprovado em 02/11/2026).
Login: e-mail/senha + Google; "Entrar com Apple" no iOS (exigência da App Store 4.8).
Lançamento: Nova Iguaçu – Baixada Fluminense (RJ). Região padrão do mapa e da curadoria do diretório.
Domínio ainda provisório: scheme `petfriends://`, URL web sempre via `EXPO_PUBLIC_WEB_URL` (nunca fixa no código).
Backend: Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) com RLS.
Apoio de UI: `react-native-svg` (ícones do protótipo), `@expo-google-fonts/nunito`. `react-dom`/`react-native-web` só para prévia e testes automatizados de tela, não são alvo de produto.
Versões atuais: Expo SDK 58, React Native 0.88, NativeWind 4.2.7 + Tailwind 3.4 (NativeWind 5 ainda é RC). Em ambiente com proxy, `npx expo install` precisa de `EXPO_OFFLINE=1`.
Complementos: Expo Notifications · Google Maps Platform (`react-native-maps` + Places API via Edge Function) · Victory Native · Sentry · Jest + React Native Testing Library · Maestro · EAS Build/Submit.

**Não troque nem adicione bibliotecas relevantes sem justificar e obter aprovação.** Instale pacotes nativos com `npx expo install`.

## Estrutura

- `app/` — rotas do Expo Router. Telas finas: compõem componentes e hooks; sem chamadas diretas ao Supabase.
- `src/components/` — Design System (genérico, sem regra de negócio).
- `src/features/<feature>/{components,hooks,services,schemas,types}` — auth, pets, health, care, reminders, family, vets, reports.
- `src/services/` — cliente Supabase e infraestrutura. **Só services falam com Supabase/APIs.**
- `src/stores/` (Zustand) · `src/integrations/` · `src/validation/` · `src/types/` · `src/config/` · `src/theme/` · `src/i18n/` · `src/utils/`.
- `supabase/migrations/`, `supabase/functions/`, `supabase/tests/` (pgTAP).
- `.maestro/` — fluxos E2E.

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
- Referência visual de telas, textos, ícones e fluxos: `prototipo/pet-friends.html` (recriar em nativo, **não copiar** o código).
- Fonte: Nunito (`@expo-google-fonts/nunito`). O letreiro do logo é sempre imagem (`assets/brand/`).
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
- O app só conhece variáveis `EXPO_PUBLIC_*` (URL do Supabase, anon key, DSN do Sentry, chave Maps restrita). **`service_role`, chave Places, tokens do Sentry/EAS nunca entram no app nem no Git** — ficam em secrets de Edge Functions / EAS.
- `.env*` no `.gitignore`; manter `.env.example` atualizado.
- Tokens (convites, links de veterinário): aleatórios, armazenados só como hash, com expiração e revogação.
- LGPD: coletar o mínimo; consentimento versionado (`user_consents`); exclusão de conta e dados pelo app; não enviar dados de saúde para Sentry (usar `beforeSend` para remover PII).
- Validar entrada no app (Zod) **e** no servidor (constraints SQL / Zod nas Edge Functions).

## Diretório veterinário

**Nunca inventar estabelecimentos, telefones, horários ou especialidades** — nem em mocks que possam chegar à produção. Todo registro tem `source` e `source_ref`. Horário só aparece se vier da fonte ou estiver verificado (`hours_verified_at`). Respeitar os termos do Google Places (guardar só `place_id`; demais dados buscados em tempo real pela Edge Function). `seed.sql` usa dados claramente fictícios e só roda em ambiente local.

## Comandos

```bash
npx expo start --dev-client      # app em development build
npm run lint && npm run typecheck
npm test                         # Jest + RNTL
supabase start                   # stack local
supabase db reset                # reaplica migrations + seed local
supabase test db                 # testes pgTAP de RLS
npm run db:types                 # supabase gen types typescript --local > src/types/database.ts
supabase functions serve         # Edge Functions locais
maestro test .maestro/           # E2E
eas build --profile development|preview|production
```

## Definição de pronto

Uma tarefa só está pronta quando: lint e typecheck passam; testes novos/afetados passam (unitários, RLS quando houver banco, Maestro quando for fluxo crítico); textos em pt-BR; estados de carregando/vazio/erro tratados; sem segredos no código; nada fora do escopo aprovado; `docs/` atualizado quando houver decisão técnica nova.

## Processo

- Seguir a ordem das etapas em `docs/PLANO_APP_NATIVO.md` e pedir aprovação ao fim de cada etapa.
- Antes de mudanças grandes, apresentar plano curto. Relatar com honestidade o que foi e o que não foi testado.

## Status atual

- Plano do app nativo em 9 etapas **aprovado** (08/11/2026): `docs/PLANO_APP_NATIVO.md`. Regras do responsável: uma etapa por vez; testar e dizer o que ele confere no Android; não adicionar nada fora da especificação sem perguntar; explicar em linguagem simples (ele não é programador).
- **Etapa 1 (projeto base + Design System) em andamento** na branch `etapa-1-base`.
- Repositório: `joaovalentinm/pet-friends.html`. A branch `claude/joao-content-intelligence-9ze5og` é de **outro sistema** (FIELD): não mexer.
- Supabase oficial: **"PET FRIENDS BACK SP"** (`eytigmsbliglsmbgrujq`, São Paulo). Nunca usar o pausado "PET FRIENDS BACK" (`bwvsalfevnwpiftkdvuc`) nem o "FIELD Project" (`jlqcgtyyjeevtkeehcdg`).
- Segurança: checklist em `docs/SEGURANCA.md`.

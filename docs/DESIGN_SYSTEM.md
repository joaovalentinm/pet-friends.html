# Pet Friends: Design System

> v1.0 · 08/11/2026 · Referência visual: `prototipo/pet-friends.html` · Prancha da marca: `assets/brand/brand-board-reference.webp`
> Código: `src/theme/palette.js` (cores), `src/theme/tokens.ts`, `tailwind.config.js`, `src/components/ui/`.

## Cores oficiais (definidas pelo responsável)

| Cor | HEX | Uso |
|---|---|---|
| Laranja principal | `#F97316` | Botões de ação, destaques, ícones |
| Verde principal | `#16A34A` | Ícone do app, confirmações, itens concluídos, aba ativa |
| Creme | `#FFF8EF` | Fundo das telas |

Tons de apoio (vindos do protótipo):

| Token | HEX | Uso |
|---|---|---|
| `heading` | `#14532D` | Títulos (verde escuro) |
| `text` / `textMuted` | `#1E2B22` / `#6B7280` | Texto / texto secundário |
| `surface` / `surfaceAlt` | `#FFFFFF` / `#FEF1E2` | Cartões / caixas de ícone, chips, blocos de destaque |
| `line` | `#F0E2D0` | Bordas e divisórias |
| `doneBg` / `doneInk` | `#E4F5E9` / `#14532D` | Concluído, etiqueta "Tutor" |
| `warnBg` / `warnInk` | `#FFEADB` / `#B4410C` | Atrasado, alertas, etiqueta "Convidado" |
| `infoBg` | `#EAF3EC` | Informação |

**Acessibilidade:** o texto branco sobre o laranja `#F97316` tem contraste de 2,8:1, abaixo do mínimo recomendado (4,5:1). Por decisão do responsável mantemos a cor oficial. Para reduzir o problema, os rótulos dos botões são sempre em ExtraBold de 16,5px ou mais. Títulos usam o verde escuro `#14532D`, com contraste de 10:1.

## Tipografia
**Nunito** (Google Fonts, licença livre), nos pesos 400, 600, 700, 800 e 900. Títulos de tela usam Black 22px, e o título do bloco de destaque usa Black 26px. Corpo de texto em Regular 16px, rótulos e botões em ExtraBold. O letreiro "PET FRIENDS" é sempre imagem (`assets/brand/`).

## Forma
Botões em formato pílula (altura 48, ou 38 na versão pequena). Raio dos cartões: 22. Bloco de destaque com raio 26 e as **colinas** verde e laranja no rodapé. Campos com raio 14. Sombra verde bem suave. Área de toque mínima de 44.

## Componentes (`src/components/ui`)
`Button` (accent · primary · ghost · soft · danger), `Card`, `Badge` (done · warn · info), `RoleTag` (Tutor/Convidado), `Avatar` (inicial com cor fixa por nome), `EmptyState`, `Hero` com `Hills`, `Segmented`, `Icon`. Os ícones são os desenhos de traço do protótipo, recriados com `react-native-svg`. Layout: `Screen` e `TopBar`.

## Navegação
Abas: **Início · Pets · Caderneta · Lembretes · Locais**. O **Perfil** abre pelo botão no topo, à direita. Não há aba de "Comunidade".

## Ícone do app
Letreiro "PET FRIENDS" branco sobre o verde `#16A34A` (`assets/brand/icon.png`, ícone adaptativo do Android e `play-store-icon-512.png`). Ele foi gerado a partir do PNG do logo; se houver o logo em vetor, troque por ele para ganhar nitidez.

## Fora do app (decisão de 08/11/2026)
Modo escuro, som da marca, pet shops, restaurar backup e o tipo de registro "Cirurgia".

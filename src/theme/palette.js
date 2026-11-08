/**
 * Pet Friends — paleta oficial (definida pelo responsável em 08/11/2026).
 *
 *   Laranja principal  #F97316  botões de ação, destaques, ícones
 *   Verde principal    #16A34A  ícone do app, confirmações, itens concluídos
 *   Creme              #FFF8EF  fundo das telas
 *
 * Tons de apoio (verde escuro, bordas, fundos de estado) vêm do protótipo
 * oficial (prototipo/pet-friends.html). Não adicione cores fora deste arquivo.
 *
 * CommonJS para ser lido pelo tailwind.config.js e pelo app.
 */

const brand = {
  orange: '#F97316',
  green: '#16A34A',
  cream: '#FFF8EF',
};

const semantic = {
  // fundos
  background: '#FFF8EF', // telas
  page: '#F8EEDF',
  surface: '#FFFFFF', // cartões
  surfaceAlt: '#FEF1E2', // ícones em caixa, chips, áreas suaves
  line: '#F0E2D0', // bordas e divisórias

  // textos
  text: '#1E2B22',
  textMuted: '#6B7280',
  heading: '#14532D', // verde escuro dos títulos

  // ações
  accent: '#F97316', // botão de ação principal, destaques
  onAccent: '#FFFFFF',
  primary: '#16A34A', // confirmações, concluído, aba ativa
  onPrimary: '#FFFFFF',

  // estados
  doneBg: '#E4F5E9',
  doneInk: '#14532D',
  warnBg: '#FFEADB',
  warnInk: '#B4410C',
  infoBg: '#EAF3EC',

  overlay: 'rgba(10, 30, 18, 0.42)',
};

/** Cores dos avatares (iniciais), como no protótipo. */
const avatarColors = ['#F97316', '#16A34A', '#14532D', '#C2410C', '#15803D', '#9A3412'];

module.exports = { brand, semantic, avatarColors };

/** Todos os textos visíveis ao usuário (pt-BR). Fonte: protótipo oficial. */
export const t = {
  brand: {
    name: 'Pet Friends',
    slogan: 'Casa do seu melhor amigo.',
  },
  tabs: {
    home: 'Início',
    pets: 'Pets',
    booklet: 'Caderneta',
    reminders: 'Lembretes',
    places: 'Locais',
  },
  common: {
    profileButton: 'Perfil e configurações',
    comingSoonTitle: 'Em breve',
    comingSoon: (what: string) => `${what} chega nas próximas etapas do app.`,
  },
  greeting: {
    morning: 'Bom dia',
    afternoon: 'Boa tarde',
    evening: 'Boa noite',
  },
  home: {
    noPets: 'Vamos começar cadastrando o seu pet.',
    emptyTitle: 'Nenhum pet ainda',
    emptyText:
      'Cadastre seu cão ou gato para organizar vacinas, remédios e a rotina da casa.',
    emptyButton: 'Cadastrar pet',
  },
  pets: {
    title: 'Meus pets',
    add: 'Cadastrar pet',
    emptyTitle: 'Nenhum pet cadastrado',
    emptyText: 'Adicione seu cão ou gato para começar a carteirinha de saúde.',
  },
  booklet: {
    title: 'Caderneta',
    emptyTitle: 'Caderneta vazia',
    emptyText:
      'Cadastre seu pet para montar a caderneta de saúde que você leva ao veterinário.',
  },
  reminders: {
    title: 'Lembretes',
    add: 'Novo lembrete',
    segments: { upcoming: 'Próximos', late: 'Atrasados', done: 'Concluídos' },
    emptyTitle: 'Nenhum lembrete',
    emptyText:
      'Ao registrar uma vacina ou remédio com data da próxima dose, o lembrete aparece aqui. Você também pode criar o seu.',
    lateEmptyTitle: 'Nada atrasado',
    lateEmptyText: 'Todos os cuidados de saúde estão em dia.',
    doneEmpty: 'Os lembretes concluídos aparecem aqui.',
    footnote: 'Lembretes de rotina diária (comida, passeio, remédio) ficam na tela Início.',
  },
  places: {
    title: 'Locais',
    heroTitle: 'Clínicas e hospitais veterinários perto de você',
    heroText: 'Informe o seu CEP para ver os locais da sua região.',
    cepLabel: 'Seu CEP',
    cepPlaceholder: '00000-000',
    search: 'Buscar locais',
  },
  install: {
    title: 'Instalar o app',
    subtitle: 'Na tela de início, abrindo como app',
    close: 'Fechar',
    inAppWhy: 'Você abriu o link por dentro de outro app (Instagram, WhatsApp...). Por aqui não dá para instalar: abra no navegador do celular.',
    iosWhy: 'No iPhone, o Pet Friends fica na tela de início como um app, em poucos toques.',
    androidWhy: 'Coloque o Pet Friends na tela de início para abrir como um app.',
    desktopWhy: 'Instale o Pet Friends para abrir em uma janela própria, como um app.',
    installNow: 'Instalar agora',
    fallback: 'Se o botão não funcionar, siga os passos abaixo.',
    cardTitle: 'Usar o app',
    cardText: 'Coloque o Pet Friends na tela de início',
    section: 'Usar como app',
  },
  profile: {
    title: 'Perfil',
    back: 'Voltar',
    soonText: 'Login, dados do tutor e quem cuida do pet chegam nas próximas etapas.',
  },
} as const;

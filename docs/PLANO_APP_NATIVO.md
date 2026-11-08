# Pet Friends: plano do app

> ⚠️ **MUDANÇA DE ROTA (09/11/2026, decisão do responsável):** o Pet Friends deixa de ser app de loja. Vira um **site instalável no celular (PWA)**: sem Play Store e sem App Store. A pessoa abre o link e coloca o app na tela de início seguindo a tela "Instalar o app". O plano abaixo descreve a rota antiga (app nativo). A **proposta da nova rota** está em `docs/PLANO_PWA.md`, aguardando aprovação.

# (Rota antiga) Plano do app nativo (Android primeiro)

> Status: **aprovado** em 08/11/2026 · Etapa 1 concluída no código; aguarda teste no celular (precisa da conta Expo)
> Referências: `CLAUDE.md` (fonte da verdade), protótipo `pet-friends.html` (visual, telas, textos e fluxos), logo oficial (`assets/brand/`).
> Regra de trabalho: uma etapa por vez. Cada etapa termina com um teste no celular Android do responsável e só avançamos com a aprovação dele.

---

## Como você vai testar no seu Android (vale para todas as etapas)

1. Na **Etapa 1**, eu gero uma versão de teste do app pelo EAS (o serviço de compilação do Expo) e te mando um **link**. Você abre o link no celular, baixa e instala. O Android vai pedir para permitir instalar de "fonte desconhecida", e isso é normal nesta fase.
2. Nas etapas seguintes, as mudanças chegam **sozinhas**: você fecha e abre o app de novo e ele atualiza (recurso EAS Update). Só preciso gerar um link novo quando entrar algo "nativo", como notificações ou login com Google.
3. Ao fim de cada etapa eu te passo um roteiro curto do tipo "abra, toque em X, deve aparecer Y".

---

## Etapas

### 1. Projeto base + Design System
- Expo + TypeScript + Expo Router + NativeWind, com as pastas definidas no `CLAUDE.md`.
- Cores e fonte da marca (Nunito) viram "tokens": nenhuma cor fica escrita direto nas telas.
- Componentes base recriados a partir do protótipo: botões, cartões, campos, chips, etiquetas, folha que sobe de baixo (bottom sheet), aviso rápido com "Desfazer" e estado vazio.
- Barra inferior com **Início · Pets · Caderneta · Lembretes · Locais**. O **Perfil** abre pelo avatar no topo, como no protótipo.
- Ícone do app e tela de abertura com o logo.
- **Teste no celular:** instalar pelo link, ver a abertura com o logo e navegar pelas 5 abas (ainda vazias).

### 2. Supabase: banco, regras de acesso e fotos
- Tabelas: perfis, pets, membros (tutor/convidado), convites, registros de saúde, anexos, pesagens, rotinas, cuidados feitos, lembretes, locais salvos, dispositivos para notificação, consentimentos.
- **Regras de acesso (RLS) em todas as tabelas:** cada pessoa só vê os pets da própria casa. Convidado com "só visualizar" não consegue gravar nada.
- Pastas **privadas** para fotos e anexos, com limite de tamanho e de tipo de arquivo.
- Testes automáticos do tipo "o usuário A não vê o pet do usuário B" e o verificador de segurança do Supabase sem alertas.
- **Teste no celular:** nada visível ainda. Eu te mostro o resultado dos testes de segurança em linguagem simples.

### 3. Login real
- Criar conta com **e-mail e senha** (senha criada só para o app), confirmação por e-mail, **Entrar com Google** e **Esqueci a senha** (link por e-mail que abre o app).
- Aceite da Política de Privacidade no cadastro.
- **Teste no celular:** criar conta, sair, entrar de novo, recuperar a senha e entrar com Google.

### 4. Telas do protótipo, com dados reais
- **Início:** saudação, cuidados do dia por pet (marcar feito / atrasado), registro rápido, "Saúde em breve", atividade da família.
- **Pets:** lista, cadastro com foto, perfil do pet (Saúde · Rotina · Peso com gráfico).
- **Caderneta:** as 4 seções do protótipo e o status das vacinas.
- **Lembretes:** Próximos · Atrasados · Concluídos; concluir, adiar e cancelar.
- **Locais:** ver item 3 das decisões abaixo.
- **Perfil:** dados do tutor, quem cuida e preferências.
- Aviso de "remédio já foi dado" para evitar dose dupla, como no protótipo.
- **Teste no celular:** cadastrar um pet com foto, criar uma rotina, marcar um cuidado e registrar uma vacina com a próxima dose.

### 5. Convites por link e por código
- O tutor cria o convite e escolhe a permissão (registrar ou só visualizar). O convite vira um **link** para mandar pelo WhatsApp e também um **código** (ex.: `K7M-2QX`) válido por 7 dias.
- Quem recebe toca em "Tenho um convite" ou abre o link e entra na casa.
- Etiquetas **"Tutor"** e **"Convidado"** ao lado dos nomes em todo o app.
- O tutor pode mudar a permissão ou remover a pessoa.
- **Teste:** no seu celular e em um segundo aparelho (de alguém da família), convidar, aceitar e ver o cuidado marcado por um aparecer no outro.

### 6. Notificações (com sons escolhidos pela pessoa)
Requisitos do responsável (09/11/2026): **toda informação cadastrada gera aviso**, sempre com o **nome do pet**.
- **Horários da rotina:** "Hora da comida do Buddy 🍽️", "Hora do passeio do Buddy", "Hora do remédio do Buddy". Valem para comida, água, passeio, remédio, banho e higiene, e para os cuidados personalizados.
- **Cuidado atrasado:** "O remédio do Buddy das 20:00 ainda não foi dado". Sai 30 minutos depois do horário e repete até alguém marcar como feito.
- **Dia de algo:** vacina, vermífugo, antipulgas, consulta, exame e lembretes personalizados avisam **no dia** e também **na véspera**.
- **Remédios e doses atrasados:** aviso diário enquanto não for registrado.
- **Algo novo foi adicionado:** **todos** recebem aviso, inclusive quem cadastrou (decisão de 09/11/2026). Exemplo: "Vacina V10 do Buddy registrada por Lucas".
- **Som da notificação escolhido pela pessoa** no Perfil: 🐶 latido, 🐱 miado, 🐦 passarinho ou 🔔 "plim". (O som de passarinho é só uma opção de toque; o app continua sendo para cães e gatos.)
- **Ao abrir o app:** toca a voz dizendo **"Pet Friends"** (voz sintética). Pode ser desligado no Perfil e respeita o modo silencioso do celular.
- **Origem dos sons:** latido, miado, passarinho e "plim" vêm de bancos de sons livres (CC0 ou licença que permita uso em app). Cada arquivo tem a fonte e a licença registradas em `assets/sounds/CREDITOS.md`.
- Técnica: sons embutidos no app (plugin do `expo-notifications`). No Android, cada som exige um canal de notificação próprio. Avisos locais agendados no celular + push do servidor (Supabase + serviço de push do Expo) para a família. O áudio de abertura usa `expo-audio`, do próprio Expo.
- **Teste:** escolher o som de latido, criar um horário para daqui a 2 minutos com o app fechado e ouvir o latido com "Hora da comida do Buddy". Marcar um cuidado no outro celular e receber o aviso da família.

### 7. Caderneta em PDF
- Gerada **no próprio celular**, no layout do protótipo: identificação, vacinas com **espaço para assinatura e carimbo (CRMV)** em cada linha, histórico, peso, cirurgias e anexos.
- Botões: compartilhar (WhatsApp ou e-mail) e salvar.
- **Teste:** gerar o PDF do pet e abrir no celular.

### 8. LGPD
- Tela de **Política de Privacidade** (eu escrevo o rascunho técnico; você revisa) e publicação em um endereço web, que o Google exige.
- **Excluir conta pelo app:** apaga conta, pets, fotos e anexos.
- **Exportar meus dados:** arquivo com tudo que é seu.
- **Teste:** exportar os dados e excluir uma conta de teste.

### 9. Preparar a Play Store
- Gerar o **.aab** com EAS (versão de produção, assinada).
- Criar uma **conta de teste para o revisor** do Google, com um pet de exemplo já cadastrado.
- Te entregar o **checklist do Play Console**: ficha da loja, ícone 512 px, imagem de destaque 1024×500, capturas de tela, classificação etária, público-alvo, **Segurança dos dados**, URL da política de privacidade, acesso do revisor, contato e categoria.
- ⚠️ **Regra do Google para contas pessoais novas:** antes de publicar para todos, o app precisa passar por um **teste fechado com pelo menos 12 testadores durante 14 dias seguidos**. Vale começar a juntar esses 12 contatos (familiares e amigos com Android) já.

---

## O que eu preciso de você antes de começar

| Item | Para quê | Quando |
|---|---|---|
| **Repositório no GitHub** | Guardar o código. Este ambiente é temporário e **pode ser apagado**. | Antes da Etapa 1 (urgente) |
| **Conta no Expo** (expo.dev, gratuita) + um token de acesso | Gerar o app instalável e as atualizações | Etapa 1 |
| **Projeto no Firebase** (gratuito) | Notificações no Android | Etapa 6 |
| **Google Cloud: credencial de login** | "Entrar com Google" | Etapa 3 (eu te guio passo a passo) |
| Serviço de e-mail (Resend, Brevo ou o e-mail da Hostinger) | E-mails de confirmação e recuperação de senha com o remetente da marca | Etapa 3 |
| Endereço para a Política de Privacidade | Exigência do Google | Etapa 8 |

---

## Propostas aguardando aprovação (09/11/2026)

- **Calendário anual de vacinas** dentro da Caderneta (aplicadas, próximas e sugestões por espécie e idade, sempre com "confirme com o veterinário"). Fica na Etapa 4.
- **Campanhas de vacinação**, cadastradas pela equipe a partir de fontes oficiais (Prefeitura de Nova Iguaçu e cidades vizinhas), cada uma com o link da fonte. Aparecem em Locais só quando houver campanha ativa na cidade do CEP, e geram aviso (Etapa 6).
- **APK fora da loja:** página de download no domínio próprio, assinado com a mesma chave do app. Ver a resposta de 09/11/2026 na conversa.

## Decisões tomadas (08/11/2026)

1. **Cores:** laranja `#F97316`, verde `#16A34A` e creme `#FFF8EF`.
2. **Itens extras do protótipo:** nenhum entra (sem pet shops, som, modo escuro, restaurar backup ou "Cirurgia").
3. **Locais:** a pessoa digita o CEP e vê os locais veterinários da região, com dados do Google.
4. **Link para o veterinário:** adiado. Por enquanto só o PDF (Etapa 7).
5. **Convites:** quem aceita entra como **"Convidado"**. O seletor "Registrando como" não existe no app.

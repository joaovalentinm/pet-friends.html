# Pet Friends: plano do site instalável (PWA)

> Status: **aprovado** em 09/11/2026 · Etapas 1, 2 e 3 **publicadas** em https://petfriends.wearefield.io · Etapa 4 em andamento (pets, carteira de saúde e cuidados prontos; faltam Locais e o calendário de vacinas)
> Decisão do responsável: sem Play Store e sem App Store. O Pet Friends é um site que a pessoa abre pelo link e instala na tela de início do celular.

## Proposta de tecnologia (troca de stack, precisa de aprovação)

| Antes (app nativo) | Agora (site instalável) | Por quê |
|---|---|---|
| React Native + Expo + EAS | **React + Vite + TypeScript** | É feito para web: mais leve, mais rápido e mais simples de instalar no celular |
| NativeWind | **Tailwind CSS** (as mesmas cores e tokens) | O design system atual é reaproveitado |
| Expo Router | **React Router** | Rotas de site |
| Expo Notifications | **Web Push** (service worker + Supabase) | Notificação de site instalado |
| react-native-maps | **Google Maps** para web | — |
| Victory Native | Gráfico de peso em SVG simples, como no protótipo | Evita uma biblioteca a mais |
| Maestro | **Playwright** | Testes automáticos no navegador |
| — | **vite-plugin-pwa** | Manifesto, ícones, funcionamento offline e instalação |

Continuam iguais: Supabase (São Paulo, RLS, armazenamento privado), Zustand, TanStack Query, React Hook Form, Zod, Sentry, Nunito, paleta oficial e o protótipo como referência.

## Limites do celular para sites instalados (importante)

| Recurso | Android | iPhone |
|---|---|---|
| Instalar na tela de início | ✅ Chrome: botão "Instalar" ou menu ⋮ | ✅ Safari: Compartilhar > "Adicionar à Tela de Início" |
| Notificações com o app fechado | ✅ | ✅ só depois de instalado na tela de início (iOS 16.4 ou mais novo) |
| **Som escolhido (latido, miado...) na notificação com o app fechado** | ❌ toca o som padrão do celular | ❌ toca o som padrão do celular |
| Som escolhido com o app aberto | ✅ | ✅ |
| Voz "Pet Friends" ao abrir | ✅ costuma tocar sozinha quando o app está instalado | ⚠️ toca no primeiro toque na tela (regra do iPhone) |
| Lembretes no horário certo | ✅ enviados pelo servidor (precisa de internet no celular) | ✅ idem |
| Foto do pet, PDF da caderneta, login com Google | ✅ | ✅ |

## Etapas

1. **Base do site + instalação:** design system, as 5 abas, ícone, tela "Instalar o app" (já desenhada) e publicação no seu domínio com HTTPS. *Você confere:* abrir o link no celular e instalar na tela de início.
2. **Supabase:** banco, regras de acesso e fotos privadas (igual ao plano anterior).
3. **Login:** e-mail e senha, Google e "esqueci a senha".
4. **Telas do protótipo** com dados reais, incluindo o calendário de vacinas, se aprovado.
5. **Convites** por link e por código (Tutor/Convidado). Pelo navegador, o link abre direto.
6. **Notificações** (Web Push): rotina, atrasados, dia e véspera, cadastros, campanhas. Sons e voz dentro dos limites acima.
7. **Caderneta em PDF** com assinatura e carimbo nas vacinas.
8. **LGPD:** política de privacidade, excluir conta e exportar dados.
9. **Publicação:** domínio definitivo, página de instalação, testes com família e amigos.

## O que deixa de existir
Play Console, conta de teste para o revisor do Google, regra dos 12 testadores por 14 dias, APK, EAS e o token do Expo.

## O que aproveitamos da Etapa 1
Paleta, tokens, configuração do Tailwind, textos, ícones, logo e o desenho das telas. O código das telas em React Native é refeito em React web, um trabalho pequeno porque as telas ainda estão vazias.

## Ideias em espera (não fazer antes de validar o app)
Decisão do responsável em 09/11/2026: ficam para uma etapa futura, depois da validação com usuários, e só entram com aprovação formal da mudança de escopo (hoje estão na lista de proibidos).
- Plano pago mensal (PIX e cartão recorrente por gateway brasileiro, liberação automática por webhook em Edge Function).
- Descontos em lojas parceiras e rações (cadastro de parceiros e cupons).
- Veterinários verificados pelo CRMV (conferência no cadastro do conselho antes do selo).
- Pré-requisitos: CNPJ ou MEI, termos de uso com regras de cancelamento (CDC), política de privacidade revisada (LGPD).
- Dá para construir na mesma estrutura atual (site + Supabase); não precisa de outro sistema.

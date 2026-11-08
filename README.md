# Pet Friends

**Casa do seu melhor amigo.** Um app gratuito para tutores de cães e gatos organizarem saúde, cuidados e rotina dos pets, com toda a família acompanhando.

- **Plataforma:** Android primeiro (Play Store), iOS depois
- **Tecnologia:** React Native + Expo (SDK 58) + TypeScript + Expo Router + NativeWind · Supabase (São Paulo)
- **Lançamento:** Nova Iguaçu, Baixada Fluminense (RJ)

## Onde está cada coisa

| Caminho | Conteúdo |
|---|---|
| `CLAUDE.md` | Regras permanentes do projeto (escopo, stack, segurança) |
| `docs/PLANO_APP_NATIVO.md` | Plano em 9 etapas e status |
| `docs/DESIGN_SYSTEM.md` | Cores, fonte, componentes |
| `docs/SEGURANCA.md` | Checklist de segurança e LGPD |
| `prototipo/pet-friends.html` | Protótipo oficial (referência visual e de fluxos) |
| `app/` | Telas (rotas do Expo Router) |
| `src/` | Componentes, tema, textos, utilitários |
| `assets/brand/` | Logo e ícones oficiais |

## Rodar localmente (para desenvolvedores)

```bash
npm install
npm run typecheck && npm run lint && npm test
npx expo start --dev-client
```

Variáveis públicas em `.env` (veja `.env.example`). Chaves secretas nunca entram no app nem no Git.

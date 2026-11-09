# Pet Friends

**Casa do seu melhor amigo.** Um app gratuito para tutores de cães e gatos organizarem saúde, cuidados e rotina dos pets, com toda a família acompanhando.

- **Plataforma:** site instalável no celular (PWA): Android e iPhone pelo mesmo link, sem lojas
- **Tecnologia:** React + Vite + TypeScript + Tailwind + vite-plugin-pwa · Supabase (São Paulo)
- **Lançamento:** Nova Iguaçu, Baixada Fluminense (RJ)

## Onde está cada coisa

| Caminho | Conteúdo |
|---|---|
| `CLAUDE.md` | Regras permanentes do projeto (escopo, stack, segurança) |
| `docs/PLANO_PWA.md` | Plano em 9 etapas e status |
| `docs/DESIGN_SYSTEM.md` | Cores, fonte, componentes |
| `docs/SEGURANCA.md` | Checklist de segurança e LGPD |
| `prototipo/pet-friends.html` | Protótipo oficial (referência visual e de fluxos) |
| `src/pages/` | Telas |
| `src/components/` | Design System |
| `public/` | Ícones do PWA e logo |
| `assets/brand/` | Logo e ícones oficiais |

## Rodar localmente (para desenvolvedores)

```bash
npm install
npm run typecheck && npm run lint && npm test
npm run dev
```

Variáveis públicas em `.env` (veja `.env.example`). Chaves secretas nunca entram no app nem no Git.

# Pet Friends — Segurança e Privacidade dos Dados

> Checklist de segurança para os dados dos usuários (e-mail, senha, fotos e dados de saúde do pet).
> Status: **nada implementado ainda.** Projeto oficial criado em São Paulo, ainda vazio (ver §0).
> Atualizado em 08/11/2026.

Legenda: 🟢 o Supabase já faz · 🔧 configurar no painel · 💻 desenvolver (código/SQL) · 👤 depende de você

---

## 0. Projeto Supabase oficial

**Projeto da Pet Friends: "PET FRIENDS BACK SP"**, ID `eytigmsbliglsmbgrujq`, região **sa-east-1 (São Paulo)**. Criado em 08/11/2026 na organização "Field IA" (plano Free).

| Projeto | ID | Região | Situação |
|---|---|---|---|
| **PET FRIENDS BACK SP** | `eytigmsbliglsmbgrujq` | **São Paulo** | ✅ **Oficial**: vazio, advisor de segurança sem alertas |
| PET FRIENDS BACK | `bwvsalfevnwpiftkdvuc` | EUA | ⏸️ Pausado (vazio). Recomendado excluir no painel e depois renomear o oficial para "PET FRIENDS BACK" |
| FIELD Project | `jlqcgtyyjeevtkeehcdg` | EUA | Outro sistema: **não mexer** |

Observações:
- O projeto novo **não** tem o gatilho automático de RLS (`ensure_rls`), que é uma opção da criação pelo painel. Isso não é um problema: toda migration nossa ativa o RLS explicitamente e os testes pgTAP verificam.
- No plano Free o limite é de 2 projetos ativos (FIELD + Pet Friends).

- 👤 Ativar a verificação em duas etapas (MFA) na **sua conta** do Supabase. Quem entra na conta tem acesso a todos os dados.
- 👤 Guardar a senha do banco em um gerenciador de senhas. Ela nunca vai para o código.
- 🔧 Ter dois ambientes: **dev** (testes) e **prod** (usuários reais). Pode ser um projeto separado ou uma branch.

## 1. E-mail e senha (Supabase Auth)

| # | Item | Tipo | Detalhe |
|---|---|---|---|
| 1.1 | Senhas nunca ficam guardadas em texto | 🟢 | O Supabase guarda só o *hash* bcrypt. Nem nós nem o app conseguimos ver a senha. |
| 1.2 | Senha mínima forte | 🔧 | Mínimo de 8 caracteres, com letras e números. O app valida a mesma regra com Zod, com mensagens em pt-BR. |
| 1.3 | Bloquear senhas vazadas (HaveIBeenPwned) | 🔧 👤 | **Disponível só no plano Pro** (US$ 25/mês). Recomendado antes do lançamento público. |
| 1.4 | Confirmação de e-mail obrigatória | 🔧 | Impede cadastro com o e-mail de outra pessoa. O link abre o app por deep link (`petfriends://`). |
| 1.5 | SMTP próprio | 🔧 👤 | O e-mail padrão do Supabase tem limite baixo de envios por hora, não tem garantia de entrega e **não serve para produção**. Usar Resend, Brevo, SES ou o e-mail da Hostinger, com o remetente do seu domínio. |
| 1.6 | CAPTCHA no cadastro, login e "esqueci a senha" | 🔧 💻 | Cloudflare Turnstile ou hCaptcha. Evita robôs criando contas e testando senhas. |
| 1.7 | Limites de tentativas (rate limit) | 🟢 🔧 | Já vêm ativos. Revisar os valores antes do lançamento. |
| 1.8 | Não revelar se um e-mail está cadastrado | 💻 | Telas de login e de recuperação mostram mensagens neutras: "Se este e-mail estiver cadastrado, você receberá um link". |
| 1.9 | Lista de URLs de retorno permitidas | 🔧 | Só `petfriends://*` e o domínio oficial. Impede que links de login sejam desviados. |
| 1.10 | Reautenticação para trocar senha ou e-mail | 🔧 | Exige login recente ou código por e-mail. |
| 1.11 | Sessão segura no celular | 💻 | Token criptografado. A chave de criptografia fica no `expo-secure-store` (chaveiro do iOS/Keystore do Android). A renovação automática do token já vem ativa 🟢. |
| 1.12 | Login com Google e Apple | 🔧 💻 👤 | Credenciais OAuth no Google Cloud e no Apple Developer. As chaves secretas ficam só no painel do Supabase. |
| 1.13 | Ao excluir a conta, encerrar todas as sessões | 💻 | Edge Function `delete-account`: encerra as sessões, apaga arquivos e dados e remove o usuário. Excluir um usuário **não** invalida tokens já emitidos, por isso as sessões são encerradas antes. |
| 1.14 | Nunca usar `user_metadata` para dar permissões | 💻 | O próprio usuário consegue editar esse campo. Permissões vêm sempre de `pet_members`. |

## 2. Fotos do pet e documentos (Supabase Storage)

| # | Item | Tipo | Detalhe |
|---|---|---|---|
| 2.1 | Buckets **privados** | 💻 | `pet-photos` e `pet-documents`, ambos com `public = false`. Nenhuma foto tem link público permanente. |
| 2.2 | Caminho com o ID do pet | 💻 | `{pet_id}/{arquivo}`. As regras de acesso leem o ID pelo caminho. |
| 2.3 | Regras de acesso (RLS em `storage.objects`) | 💻 | **Ver:** só membros do pet (`is_pet_member`). **Enviar, trocar ou apagar:** só tutor ou editor (`has_pet_role`). O upsert precisa das regras de INSERT, SELECT e UPDATE juntas. |
| 2.4 | Limite de tamanho e de tipo no servidor | 💻 | Fotos até 5 MB e documentos até 15 MB. Tipos aceitos: JPEG, PNG, WebP, HEIC e PDF. A validação fica no bucket, não só no app. |
| 2.5 | **Remover a localização (GPS) das fotos** | 💻 | Fotos de celular guardam no EXIF as coordenadas de onde foram tiradas, geralmente a **casa do tutor**. O app recomprime a imagem com `expo-image-manipulator` antes de enviar, o que remove esses metadados e também reduz o tamanho. |
| 2.6 | Links temporários para exibir | 💻 | *Signed URLs* com validade curta (ex.: 1 hora) e cache local no app. |
| 2.7 | Nome de arquivo aleatório | 💻 | UUID, nunca o nome original. Nomes podem conter dados pessoais. |
| 2.8 | Apagar arquivos junto com o pet ou a conta | 💻 | Não deixar fotos órfãs no Storage. |

## 3. Banco de dados (dados do pet, saúde, família)

| # | Item | Tipo | Detalhe |
|---|---|---|---|
| 3.1 | RLS em **todas** as tabelas | 💻 | Conforme a matriz de permissões em `docs/PLANEJAMENTO.md` §3.4. |
| 3.2 | Regras com dono **e** permissão | 💻 | Nunca só "estar logado" (`TO authenticated` sozinho permite ver dados de outros). UPDATE com `USING` e `WITH CHECK`. |
| 3.3 | Funções privilegiadas fora do schema público | 💻 | `is_pet_member` / `has_pet_role` ficam em um schema não exposto, com `search_path` fixo e `EXECUTE` revogado de `anon`. São exatamente os alertas que o FIELD Project tem hoje. |
| 3.4 | Views com `security_invoker` | 💻 | A view `pet_timeline` respeita as regras de acesso. |
| 3.5 | E-mail não fica visível para familiares | 💻 | `profiles` guarda só o nome e a foto. O e-mail fica apenas no `auth.users`. Convites usam token, não listas de e-mails. |
| 3.6 | Testes automáticos de permissão | 💻 | pgTAP: "usuário A não vê o pet de B", "leitor não edita", "ex-membro perde acesso" etc. Rodam a cada mudança. |
| 3.7 | Advisor de segurança zerado | 💻 | Rodar `get_advisors` a cada migration. |
| 3.8 | Chaves | 💻 | O app usa só a chave **publishable**. A `service_role`/secret fica só nas Edge Functions. |
| 3.9 | Backups | 👤 | **No plano Free não é possível baixar backups, e o projeto é pausado após 7 dias sem uso.** Para usuários reais, o plano Pro é necessário. |

## 4. LGPD

| # | Item | Tipo |
|---|---|---|
| 4.1 | Política de Privacidade e Termos de Uso publicados (URL no app e nas lojas) | 👤 (rascunho técnico: 💻) |
| 4.2 | Consentimento registrado com versão (`user_consents`) no cadastro | 💻 |
| 4.3 | Excluir conta e todos os dados pelo próprio app (também exigido pela Apple e pelo Google) | 💻 |
| 4.4 | Exportar meus dados (JSON + PDF) | 💻 |
| 4.5 | Coletar o mínimo: sem CPF, telefone ou endereço do tutor | 💻 |
| 4.6 | Encarregado de dados (DPO): nome e e-mail de contato na política | 👤 |
| 4.7 | Sentry sem dados pessoais (e-mail, nomes e dados de saúde removidos antes do envio) | 💻 |
| 4.8 | Plano de resposta a incidentes (quem avisar e em quanto tempo: ANPD e usuários) | 👤 💻 |
| 4.9 | Formulários de privacidade das lojas (App Privacy / Data Safety) | 👤 💻 |

## 5. Ordem de implementação proposta

1. ✅ Projeto criado em São Paulo · 👤 ativar MFA na sua conta do Supabase.
2. 💻 Migration base: tabelas, funções de permissão, RLS, buckets privados e regras de Storage, mais os testes pgTAP. Advisor zerado.
3. 🔧 Auth: senha forte, confirmação de e-mail, URLs permitidas, reautenticação.
4. 💻 App: login/cadastro com sessão segura, upload de foto sem EXIF, links temporários.
5. 💻 Edge Function `delete-account` + exportação de dados.
6. 👤 🔧 Antes do beta público: SMTP próprio, CAPTCHA, plano Pro (senhas vazadas, backups, sem pausa), Google/Apple, política de privacidade.

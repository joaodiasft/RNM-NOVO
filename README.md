# Redação Nota Mil — Sistema de Gestão Acadêmica

Plataforma web para gestão de cursos (Redação, Exatas, Matemática) com 4 perfis de acesso.

## Stack

- Next.js 15 + TypeScript + Tailwind CSS
- Neon Postgres + Prisma
- Auth.js (4 tipos de login)
- Google Drive (fotos de perfil)
- Google Sheets (logs completos)
- Resend + Gmail SMTP (token admin)
- Deploy: Cloudflare Workers (OpenNext)

## Configuração

Siga o guia completo em [SETUP.md](./SETUP.md).

1. Copie `.env.example` para `.env` e preencha as credenciais
2. Instale dependências: `npm install`
3. Banco: `npm run db:generate && npm run db:push && npm run db:seed`
4. Dev: `npm run dev`

## Login inicial (seed)

- **Admin:** e-mail e senha definidos em `ADMIN_EMAIL` / `ADMIN_SENHA_INICIAL`
- **Professores:** `*@redacaonota1000.com.br` / `Prof@2026`

## Deploy Cloudflare Workers

Guia completo: [DEPLOY.md](./DEPLOY.md)

| Campo no Cloudflare | Valor |
|---|---|
| Build command | `npm run pages:build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Build output directory | **vazio** |

Configure todas as variáveis de ambiente no painel Cloudflare (ver SETUP.md).

## Referências

- [redacao-nota-mil-especificacao.md](./redacao-nota-mil-especificacao.md)
- [enviar_token_admin.py](./enviar_token_admin.py) — referência Python (lógica portada para `lib/email/token-admin.ts`)

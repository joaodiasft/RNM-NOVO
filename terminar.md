# terminar.md — Versionar e fazer o deploy (instruções para o Cursor/IA)

> **Contexto:** o sistema Redação Nota Mil está **pronto e validado localmente**
> (build de produção OK, build Cloudflare OK, lint OK, TypeScript OK, login
> testado de ponta a ponta). O que falta é apenas **versionar no Git** e
> **publicar na Cloudflare**. Siga os passos abaixo na ordem. Não altere
> código de aplicação — se algo falhar, o problema estará em ambiente/credenciais.

---

## 1. Estado atual (o que já foi feito — não refazer)

- ✅ `npm run build` passa sem erros nem warnings de lint
- ✅ `npm run pages:build` (OpenNext/Cloudflare) gera o worker sem erros
- ✅ `npx prisma db push` já foi executado — o banco Neon está em sincronia
  com o schema (incluindo os índices novos de performance)
- ✅ Login/logout testados de ponta a ponta nos 4 perfis (fluxo de
  credenciais); segurança das APIs auditada (validação Zod + escopo por
  papel em todas as rotas)
- ✅ `.gitignore` já cobre `.env`, `.open-next/`, `.claude/settings.local.json`

## 2. Versionar no Git

```bash
git add -A
git status   # conferir: NENHUM arquivo .env pode aparecer na lista
```

**Checagem obrigatória antes do commit:** se `git status` listar `.env`,
`.env.local` ou qualquer arquivo com credenciais, PARE e adicione ao
`.gitignore` antes de continuar.

```bash
git commit -m "feat: seguranca backend completa (zod + escopo por papel), avisos direcionados, redacao com notas, pagina de perfil, cores dos cursos e indices de performance"
git push origin main
```

## 3. Deploy na Cloudflare Workers

O projeto já está configurado (wrangler.toml + OpenNext). Duas opções:

### Opção A — Deploy pelo painel (build automático no push)

Se o projeto Cloudflare está conectado ao repositório GitHub, o `git push`
acima já dispara o build. Configuração esperada no painel:

| Campo | Valor |
|---|---|
| Build command | `npm run pages:build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Build output directory | *(vazio)* |

### Opção B — Deploy manual pela máquina local

```bash
npm run pages:build
npx opennextjs-cloudflare deploy
```

(Requer `npx wrangler login` na primeira vez.)

## 4. Variáveis de ambiente na Cloudflare (conferir, não recriar)

Todas devem existir no painel do Worker (Settings → Variables). A lista
completa está em `cloudflare-env-checklist.txt`. As críticas:

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Conexão Neon Postgres (usar a URL **pooled**) |
| `AUTH_SECRET` | Assinatura das sessões JWT (NUNCA trocar sem avisar — desloga todo mundo) |
| `AUTH_URL` / `NEXTAUTH_URL` | URL pública HTTPS do sistema |
| `ENCRYPTION_KEY` | Criptografia AES das senhas de acessos externos (64 hex) |
| `ADMIN_EMAIL` | E-mail do administrador |
| `RESEND_API_KEY` (+ `RESEND_REMETENTE`) | Envio do token de 6 dígitos do admin |
| `SMTP_USUARIO` / `SMTP_SENHA_APP` | Fallback de e-mail via Gmail |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` | Logs no Sheets + fotos no Drive |
| `GOOGLE_SHEETS_SPREADSHEET_ID` / `GOOGLE_DRIVE_FOLDER_ID` | Destinos dos logs/fotos |

## 5. Smoke test pós-deploy (2 minutos)

1. Abrir `https://SEU-DOMINIO/login` — a tela deve mostrar os 3 chips de
   curso (Redação rosa, Exatas verde, Matemática azul).
2. Login professor: `martinha@redacaonota1000.com.br` / `Prof@2026` →
   deve cair no dashboard do professor.
3. Clicar no avatar → `/perfil` deve abrir com "Alterar senha".
4. Sair → deve voltar para `/login` sem sessão.
5. Login admin: e-mail do `ADMIN_EMAIL` + senha → deve chegar o código de
   6 dígitos por e-mail (se não chegar, conferir `RESEND_API_KEY`).
6. Teste de segurança rápido (deve dar **401**):
   `curl -s https://SEU-DOMINIO/api/operacional?tipo=pagamentos`

## 6. Se o build da Cloudflare falhar

- **Erro de tamanho (25 MiB):** já mitigado pelo `scripts/cleanup-next-cache.mjs`
  que roda no `pages:build`. Confirmar que o Build command é
  `npm run pages:build` (e não `next build`).
- **Erro de Prisma/wasm:** produção usa `@prisma/client/wasm`
  (em `lib/prisma.ts`) — NÃO trocar esse import; o alias para dev fica
  isolado no `next.config.ts`.
- **Erro de variável ausente:** o worker loga `DATABASE_URL não configurada`
  ou similar — conferir seção 4.

## 7. O que NÃO fazer

- ❌ Não atualizar `prisma`/`@prisma/client` para v7 (o aviso no console é
  esperado; a combinação client 6.19 + adapter-neon 7.8 está validada).
- ❌ Não reativar `--turbopack` no script `dev` (não resolve o subpath wasm).
- ❌ Não mudar a detecção de cookie no `middleware.ts` (o cookie de sessão é
  `__Secure-authjs.session-token` porque o `AUTH_URL` é HTTPS).
- ❌ Não commitar `.env` nem imprimir credenciais em log.

# Deploy Cloudflare Pages — passo a passo

## Parte A — GitHub (5 min)

### 1. Criar repositório
1. Abra [https://github.com/new](https://github.com/new)
2. Nome: `redacao-nota-mil`
3. **Private**
4. **Não** marque README / .gitignore (já existem no projeto)
5. Clique **Create repository**

### 2. Enviar o código (no terminal, pasta RNM - Novo)

```powershell
cd "d:\Jc-Solucoes 2026\RNM - Novo"
git init
git add .
git commit -m "Initial commit — Redação Nota Mil"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/redacao-nota-mil.git
git push -u origin main
```

Substitua `SEU-USUARIO` pelo seu usuário GitHub.

---

## Parte B — Cloudflare Workers (10 min)

> O projeto usa **OpenNext** (`@opennextjs/cloudflare`), não mais `@cloudflare/next-on-pages`.
> Isso permite Prisma, Google APIs, bcrypt e nodemailer no runtime Node.js do Workers.

### 1. Conectar ao Git
1. [https://dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**
2. **Create** → **Workers** → **Connect to Git** (ou edite o projeto Pages existente)
3. Autorize GitHub e selecione `RNM-NOVO` (ou `redacao-nota-mil`)

### 2. Configuração de build

| Campo | Valor |
|---|---|
| Production branch | `main` |
| Build command | `npm run pages:build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Node.js version | `20` |

**Não** use `.vercel/output/static` — o output fica em `.open-next/` (gerenciado pelo Wrangler).

Clique **Environment variables** e adicione **todas** as variáveis do seu `.env` local.

Use o arquivo [cloudflare-env-checklist.txt](./cloudflare-env-checklist.txt) como lista de verificação.

**Importante para o primeiro deploy:**
```env
NEXTAUTH_URL=https://redacao-nota-mil.SEU-SUBDOMINIO.workers.dev
```
(Ajuste para a URL real que o Cloudflare gerar)

### 3. Deploy
Clique **Save and Deploy** e aguarde o build (5–10 min).

---

## Parte C — Após o deploy

### 1. Atualizar NEXTAUTH_URL
1. Copie a URL final do site (ex.: `https://redacao-nota-mil.workers.dev`)
2. Worker → **Settings** → **Variables and Secrets**
3. Edite `NEXTAUTH_URL` com a URL exata
4. **Redeploy** (Deployments → Retry deployment)

### 2. Testar
- [ ] Login admin (`jcsolucoes3d@gmail.com` + token por e-mail)
- [ ] Login professor (`martinha@redacaonota1000.com.br` / `Prof@2026`)
- [ ] Log aparece no Google Sheets ao fazer login

### 3. Domínio customizado (opcional)
Worker → **Settings** → **Domains & Routes** → adicionar ex.: `app.redacaonota1000.com.br`
Depois atualize `NEXTAUTH_URL` e `RESEND_REMETENTE` (quando tiver domínio verificado na Resend).

---

## Problemas comuns

| Erro | Solução |
|---|---|
| `npx vercel build` falhou | Projeto migrado para OpenNext — atualize o repo e use `npm run pages:build` |
| Build falha no Prisma | Confirme `DATABASE_URL` nas env vars do Cloudflare |
| Login redireciona errado | `NEXTAUTH_URL` deve ser a URL pública exata |
| Token admin não chega | Resend `onboarding@resend.dev` só envia para e-mail da conta Resend |
| Build local no Windows falha | Normal — o build roda no Linux do Cloudflare |

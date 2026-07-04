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

## Parte B — Cloudflare Pages (10 min)

### 1. Conectar ao Git
1. [https://dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**
2. **Create** → **Pages** → **Connect to Git**
3. Autorize GitHub e selecione `redacao-nota-mil`

### 2. Configuração de build

| Campo | Valor |
|---|---|
| Production branch | `main` |
| Build command | `npm run pages:build` |
| Build output directory | `.vercel/output/static` |

Clique **Environment variables (advanced)** e adicione **todas** as variáveis do seu `.env` local.

Use o arquivo [cloudflare-env-checklist.txt](./cloudflare-env-checklist.txt) como lista de verificação.

**Importante para o primeiro deploy:**
```env
NEXTAUTH_URL=https://redacao-nota-mil.pages.dev
```
(Ajuste para o nome real que o Cloudflare gerar — ex.: `redacao-nota-mil-abc.pages.dev`)

### 3. Deploy
Clique **Save and Deploy** e aguarde o build (5–10 min).

---

## Parte C — Após o deploy

### 1. Atualizar NEXTAUTH_URL
1. Copie a URL final do site (ex.: `https://redacao-nota-mil.pages.dev`)
2. Pages → **Settings** → **Environment variables**
3. Edite `NEXTAUTH_URL` com a URL exata
4. **Redeploy** (Deployments → Retry deployment)

### 2. Testar
- [ ] Login admin (`jcsolucoes3d@gmail.com` + token por e-mail)
- [ ] Login professor (`martinha@redacaonota1000.com.br` / `Prof@2026`)
- [ ] Log aparece no Google Sheets ao fazer login

### 3. Domínio customizado (opcional)
Pages → **Custom domains** → adicionar ex.: `app.redacaonota1000.com.br`
Depois atualize `NEXTAUTH_URL` e `RESEND_REMETENTE` (quando tiver domínio verificado na Resend).

---

## Problemas comuns

| Erro | Solução |
|---|---|
| Build falha no Prisma | Confirme `DATABASE_URL` nas env vars do Cloudflare |
| Login redireciona errado | `NEXTAUTH_URL` deve ser a URL pública exata |
| Token admin não chega | Resend `onboarding@resend.dev` só envia para e-mail da conta Resend |
| Build local no Windows falha | Normal — o build roda no Linux do Cloudflare |

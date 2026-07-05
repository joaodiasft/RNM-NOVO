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

## Parte B — Cloudflare Workers (NÃO use Pages)

> **Importante:** este app usa SSR (Prisma, APIs). Deve ser deployado como **Worker**, não como **Pages** com diretório de saída.
>
> Se você vir o erro *"Pages só suporta arquivos de até 25 MiB"* com `.next/cache/...pack`, o projeto está configurado como **Pages** com **Build output directory** preenchido. Isso está errado — veja a seção de correção abaixo.

### 1. Conectar ao Git
1. [https://dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**
2. **Create** → **Workers** → **Connect to Git**
3. Autorize GitHub e selecione `RNM-NOVO`

### 2. Configuração de build (Workers Builds)

| Campo | Valor |
|---|---|
| Production branch | `main` |
| **Build command** | `npm run pages:build` |
| **Deploy command** | `npx opennextjs-cloudflare deploy` |
| **Build output directory** | **deixe VAZIO** (não preencha) |
| Node.js version | `20` |

O deploy usa `wrangler.toml` → `.open-next/worker.js` + `.open-next/assets`. O Wrangler faz o upload; não há pasta de saída manual.

### Corrigir erro "25 MiB" / `.next/cache`

Se o projeto foi criado como **Pages**:

1. **Workers & Pages** → seu projeto → **Settings** → **Build**
2. **Apague** o valor de **Build output directory** (`.vercel/output/static`, `.open-next`, `.` etc.)
3. Adicione **Deploy command**: `npx opennextjs-cloudflare deploy`
4. Se não existir campo "Deploy command", o projeto é **Pages** — crie um **novo Worker** conectado ao mesmo repo e delete o Pages antigo

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
| `Pages só suporta arquivos de até 25 MiB` + `.next/cache` | Projeto está como **Pages** com output directory — remova o campo ou crie **Worker** novo (ver Parte B) |
| `npx vercel build` falhou | Projeto migrado para OpenNext — atualize o repo e use `npm run pages:build` |
| Build falha no Prisma | Confirme `DATABASE_URL` nas env vars do Cloudflare |
| Login redireciona errado | `NEXTAUTH_URL` deve ser a URL pública exata |
| Token admin não chega | Resend `onboarding@resend.dev` só envia para e-mail da conta Resend |
| Build local no Windows falha | Normal — o build roda no Linux do Cloudflare |

# Configuração de Credenciais — Redação Nota Mil

Siga cada seção na ordem. Copie os valores para o arquivo `.env` (nunca commite o `.env`).

Use `.env.example` como modelo.

## 1. Neon (DATABASE_URL)

1. Acesse https://neon.tech
2. Create Project → `redacao-nota-mil`
3. Copie a connection string
4. Cole em `DATABASE_URL`

## 2. Chaves de segurança

No terminal:

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 32      # ENCRYPTION_KEY
```

## 3. Google Cloud (Drive + Sheets)

1. https://console.cloud.google.com → New Project → `redacao-nota-mil`
2. Ative **Google Drive API** e **Google Sheets API**
3. Credentials → Service Account → `rnm-backend` → baixe JSON
4. Extraia: `client_email`, `private_key`, `project_id`
5. Drive: crie pasta `RNM - Fotos de Perfil`, compartilhe com a service account (Editor), copie o ID da URL
6. Sheets: crie planilha `RNM - Logs do Sistema`, abas `Logs` e `ResumoDiario`, compartilhe com a service account, copie o Spreadsheet ID

## 4. Resend

1. https://resend.com → API Keys → copie `re_...`
2. Configure domínio ou use `onboarding@resend.dev` para testes

## 5. Gmail SMTP (fallback)

1. Ative 2FA no Google
2. https://myaccount.google.com/apppasswords → crie senha de app
3. Preencha `SMTP_USUARIO` e `SMTP_SENHA_APP`

## 6. Cloudflare Pages

1. https://dash.cloudflare.com → Workers & Pages → Connect Git
2. Build: `npm run pages:build`
3. Adicione todas as variáveis de ambiente em Settings

## Comandos após configurar .env

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

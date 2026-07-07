<div align="center">

# 🎓 Redação Nota Mil — Sistema de Gestão Acadêmica

**Plataforma web completa para gestão de uma escola com três cursos — Redação 🌸, Exatas 💚 e Matemática 💙 — com quatro perfis de acesso e prioridade total no celular.**

![Next.js](https://img.shields.io/badge/Next.js_15-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![Neon Postgres](https://img.shields.io/badge/Neon_Postgres-00E599?logo=postgresql&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white)

</div>

> 📸 *Sugestão: adicione prints em `docs/screenshots/` e referencie aqui.*
>
> | Login | Dashboard Admin | Área do Aluno (mobile) |
> |---|---|---|
> | ![Login](docs/screenshots/login.png) | ![Admin](docs/screenshots/admin-dashboard.png) | ![Aluno](docs/screenshots/aluno-mobile.png) |

---

## 📋 Índice

1. [O que é o sistema](#-o-que-é-o-sistema)
2. [Funcionalidades por perfil](#-funcionalidades-por-perfil)
3. [Stack e arquitetura](#-stack-e-arquitetura)
4. [Segurança](#-segurança)
5. [Rodando localmente](#-rodando-localmente)
6. [Deploy (Cloudflare Workers)](#-deploy-cloudflare-workers)
7. [Variáveis de ambiente](#-variáveis-de-ambiente)
8. [Estrutura do projeto](#-estrutura-do-projeto)
9. [Caminho para o app mobile](#-caminho-para-o-app-mobile)
10. [Rotina de uso do mês](#-rotina-de-uso-do-mês)

---

## 🎯 O que é o sistema

Sistema de gestão acadêmica da escola **Redação Nota Mil** (Goiânia/GO), cobrindo o ciclo completo:

- 👥 Cadastro de alunos (com responsáveis), professores e turmas
- 📅 Módulos mensais com 4 aulas geradas automaticamente + temas e materiais (PDF) por aula
- ✅ Frequência com status detalhado (presente, falta, falta justificada, reposições) — lançada **somente pelo admin**
- ✍️ Fluxo de redação estilo ENEM: admin registra a quantidade entregue → aluno/professor lança **nota da professora + nota Sofia + 5 competências** → admin aprova com feedback → aluno vê o desempenho
- 💰 Financeiro com inadimplência automática, confirmação de pagamentos e **repasses por curso** (Exatas: 70% professor / 30% administrativo · Matemática: 80% professor / 20% administrativo)
- 📣 Avisos direcionados (todos / curso / turma / aluno) com confirmação de leitura
- 🔁 Rematrícula com confirmação de dados e trava até aprovação do admin
- 📄 PDFs em A4: **ficha de primeiro acesso** e **relatório individual completo do aluno para o responsável**
- 🎁 Promoções de cursos com período de validade
- 🔑 Acessos externos (Sofia, Coredação...) com senha criptografada

### Identidade visual

| Curso | Cor |
|---|---|
| 🌸 Redação | Rosa `#D6336C` |
| 💚 Exatas | Verde `#2F9E44` |
| 💙 Matemática | Azul `#1971C2` |

As cores dos cursos aparecem em badges, bordas e gráficos em **todas** as telas.

---

## 👤 Funcionalidades por perfil

### 🛡️ Administrador (`/admin`)
Login: e-mail + senha + **código de 6 dígitos por e-mail** (2FA, expira em 5 min).

| Módulo | O que faz |
|---|---|
| Dashboard | KPIs (alunos, matrículas, receita do mês, inadimplência, frequência média, ocupação de vagas), alertas acionáveis, ocupação por turma com a cor do curso, leituras de avisos, aniversariantes do mês |
| Usuários | Cadastro completo do aluno (obrigatórios: nome, telefone, escola, série, nascimento, curso 1/turma/plano · opcionais: e-mail, CPF, RG, endereço, curso 2) com responsável **novo ou puxado do sistema** (irmãos) + busca |
| Acadêmico | Turmas, professores, geração de módulo mensal com mês de referência, tema + material PDF por aula, promoções |
| Matrículas | Matrícula direta de aluno já cadastrado + análise de rematrículas com os dados confirmados |
| Frequência | Lançamento exclusivo do admin, com status pré-carregados e "salvar todos" |
| Redação | Registrar quantidade entregue, conferir notas lançadas e aprovar com feedback |
| Financeiro | Separado por curso, com **repasses professor/administrativo** calculados |
| Acessos | Credenciais externas com busca e remoção |
| Avisos | Publicação segmentada + contagem de leitura (não lido após 2 dias fica marcado) |
| Relatórios | Excel por turma · **PDF primeiro acesso** · **PDF relatório do aluno para o pai** |
| Configurações | Controle de acessos (ativar/inativar login de alunos e professores) + auditoria |

### 🎒 Aluno (`/aluno`)
Login: código de matrícula (ex.: `RNM2026-0001`) + senha. **Esqueci a senha**: nova senha gerada a partir da matrícula e enviada por e-mail (Resend).

- Dashboard com frequência, módulo, redações entregues, cursos (ativo/pendente), aulas passadas coloridas (🟢 presente · 🔴 falta · 🟡 reposição) e financeiro com **botão de WhatsApp para regularizar via Pix**
- Cursos com **promoções ativas** cadastradas pelo admin
- Agenda visual do módulo
- Redação: lança notas professora/Sofia + competências ENEM; vê desempenho após aprovação; baixa o PDF da aula que perdeu
- Rematrícula completa (confirma dados, escolhe turma/plano/pagamento) com **bloqueio até o admin decidir**

### 👨‍👩‍👧 Responsável (`/responsavel`)
Login: matrícula do filho + senha própria (criada pelo admin no cadastro).

- Acompanha frequência, financeiro, avisos e rematrícula **somente dos filhos vinculados**
- Seletor de filho quando há mais de um (validado no servidor)
- **Baixa o relatório completo do filho em PDF**

### 👩‍🏫 Professor (`/professor`)
Login: e-mail + senha.

- Dashboard com turmas, próximas aulas e alertas de frequência < 75%
- Correção de redações das próprias turmas (notas + competências)
- Frequência somente leitura (lançamento é do admin)
- Relatórios Excel das próprias turmas

---

## 🏗️ Stack e arquitetura

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 15** (App Router) + TypeScript |
| Estilo | **Tailwind CSS v4** — design system próprio, mobile-first, bottom-nav no celular |
| Banco | **Neon Postgres** (serverless) via **Prisma** + adapter HTTP |
| Autenticação | **Auth.js v5** (Credentials custom, sessão JWT em cookie httpOnly) |
| E-mail | **Resend** com fallback SMTP (Gmail) |
| Arquivos/Logs | Google Drive (fotos) + Google Sheets (espelho da auditoria) |
| PDFs | **pdf-lib** (geração no servidor) |
| Deploy | **Cloudflare Workers** via OpenNext |

```
Navegador ──► Middleware (sessão + papel + headers de segurança)
                 │
                 ▼
        Páginas RSC (dados via Prisma, sem API pública)
        Rotas /api/* (Zod + escopo por papel + auditoria)
                 │
                 ▼
     Neon Postgres · Resend · Google Sheets/Drive
```

---

## 🔐 Segurança

**Princípio: o front nunca é confiável.** Toda validação e autorização acontece no servidor.

- ✅ **Validação Zod em 100% das rotas** — limites de tamanho, formatos, enums ([lib/validacao.ts](lib/validacao.ts))
- ✅ **Escopo por papel no banco**: aluno só acessa o próprio dado; responsável só filhos **vinculados**; professor só as **próprias turmas**; admin é o único que altera dados de terceiros
- ✅ **Anti-força-bruta**: 5 tentativas erradas em 15 min bloqueiam o identificador
- ✅ **2FA do admin** por e-mail (código CSPRNG, 5 min, 5 tentativas, reenvio 60 s)
- ✅ Senhas com **bcrypt**; credenciais externas com **AES-256-CBC**; sessão **JWT httpOnly**
- ✅ **Erros sanitizados**: nenhuma mensagem interna (Prisma/stack/SQL) chega ao cliente
- ✅ Headers: HSTS, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`; sem `X-Powered-By`
- ✅ Troca de senha exige a senha atual; upload de foto restrito ao próprio usuário (tipo/ID forçados no servidor)
- ✅ Trilha de auditoria de todas as ações sensíveis (Postgres + Google Sheets)

---

## 💻 Rodando localmente

Pré-requisitos: **Node 20+** e um banco Neon (gratuito).

```bash
git clone <repo>
cd redacao-nota-mil
npm install

cp .env.example .env    # preencha as credenciais (ver tabela abaixo)

npm run db:push          # cria as tabelas no Neon
npm run db:seed          # admin, professores, cursos, turmas e planos
npm run dev              # http://localhost:3000
```

**Logins do seed:**

| Perfil | Login | Senha |
|---|---|---|
| Admin | valor de `ADMIN_EMAIL` | valor de `ADMIN_SENHA_INICIAL` |
| Professores | `martinha@redacaonota1000.com.br` (e outros) | `Prof@2026` |

> ⚠️ Em dev o Prisma usa o cliente padrão via alias no `next.config.ts`; em produção (Workers) usa `@prisma/client/wasm`. Não altere o import em `lib/prisma.ts` nem reative `--turbopack`.

---

## 🚀 Deploy (Cloudflare Workers)

| Campo no painel | Valor |
|---|---|
| Build command | `npm run pages:build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Build output directory | *(vazio)* |

Deploy manual:

```bash
npm run pages:build
npx opennextjs-cloudflare deploy
```

Domínio próprio: descomente o bloco `[[routes]]` no [wrangler.toml](wrangler.toml) após apontar os nameservers.

---

## 🔑 Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|:---:|---|
| `DATABASE_URL` | ✅ | Neon Postgres (URL *pooled*) |
| `AUTH_SECRET` | ✅ | Assinatura das sessões JWT |
| `AUTH_URL` / `NEXTAUTH_URL` | ✅ | URL pública HTTPS |
| `ENCRYPTION_KEY` | ✅ | AES-256 dos acessos externos (64 hex) |
| `ADMIN_EMAIL` / `ADMIN_SENHA_INICIAL` / `ADMIN_NOME` | ✅ | Admin do seed |
| `RESEND_API_KEY` / `RESEND_REMETENTE` | ✅ | Token 2FA + reset de senha do aluno |
| `SMTP_USUARIO` / `SMTP_SENHA_APP` | — | Fallback de e-mail (Gmail) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` | — | Sheets (logs) e Drive (fotos) |
| `GOOGLE_SHEETS_SPREADSHEET_ID` / `GOOGLE_DRIVE_FOLDER_ID` | — | Destinos no Google |
| `WHATSAPP_PIX` | — | Número do botão "regularizar via Pix" (ex.: `5562900000000`) |

Lista completa: [cloudflare-env-checklist.txt](cloudflare-env-checklist.txt).

---

## 📁 Estrutura do projeto

```
app/
├── login/                # Login dos 4 perfis + esqueci a senha
├── admin/                # 11 módulos administrativos
├── aluno/                # Dashboard, cursos, agenda, redação, rematrícula...
├── professor/            # Turmas, correção de redação, relatórios
├── responsavel/          # Acompanhamento dos filhos
├── perfil/               # Troca de senha e foto (todos os perfis)
├── manifest.ts           # PWA (instalável no celular)
└── api/                  # Rotas validadas com Zod + escopo por papel
components/
├── DashboardShell.tsx    # Sidebar desktop + bottom-nav mobile + tema por papel
├── ui/                   # Ícones, badges de curso
└── forms/                # ~20 formulários client-side
lib/
├── auth/                 # Auth.js, 2FA, anti-brute-force
├── services/             # Regras de negócio (única porta para o banco)
├── validacao.ts          # Schemas Zod de TODAS as entradas
└── prisma.ts             # Cliente Neon (wasm em produção)
prisma/schema.prisma      # 20+ modelos com índices de performance
```

---

## 📱 Caminho para o app mobile

O sistema **já é um PWA**: no celular, use "Adicionar à tela de início" e ele abre em tela cheia com a barra de navegação inferior, como um app nativo.

Para o app de loja (React Native/Expo), a base já está pronta:

1. **API completa e desacoplada** — todas as regras de negócio vivem em `/api/*` e `lib/services/`, validadas no servidor. O app mobile consome as mesmas rotas.
2. **Sessão via cookie JWT** — no mobile, troque o transporte para o header `Authorization` reutilizando o mesmo Auth.js (ou chame `/api/auth/login` e guarde o cookie no SecureStore).
3. **Manifest e tema prontos** — cores, ícone e identidade já definidos em `app/manifest.ts` e `lib/nav.ts` (fonte única da navegação por perfil, reutilizável nas tabs do app).
4. **Push notifications** — o modelo `Aviso` já tem o campo `enviarPush`; basta plugar OneSignal/FCM.

---

## 🗓️ Rotina de uso do mês

1. **Início do mês (admin):** Acadêmico → gerar módulo de cada turma → cadastrar os temas das aulas
2. **A cada aula (admin):** lançar frequência · registrar quantidades de redação
3. **Aluno/professor:** lançam as notas das redações corrigidas
4. **Admin:** aprova redações com feedback · confirma pagamentos · publica avisos
5. **Fim do módulo:** alunos solicitam rematrícula → admin aprova → nova matrícula + cobrança
6. **Reunião com pais:** Relatórios → **PDF individual do aluno** 📄

---

<div align="center">

**Redação Nota Mil** · Goiânia/GO · Feito com Next.js + Cloudflare

*Documentação de uso detalhada: [readmetutorial.md](readmetutorial.md) · Deploy passo a passo: [terminar.md](terminar.md)*

</div>

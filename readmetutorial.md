# 📘 Tutorial de Uso — Redação Nota Mil

Guia prático de como usar o sistema no dia a dia, perfil por perfil.

**Cores dos cursos (identidade visual em todo o sistema):**
- 🌸 **Redação = rosa** (#D6336C)
- 💚 **Exatas = verde** (#2F9E44)
- 💙 **Matemática = azul** (#1971C2)

---

## 1. Como entrar (tela de login)

Acesse o endereço do sistema e escolha o seu perfil:

| Perfil | Login | Senha |
|---|---|---|
| **Aluno** | Código de matrícula (ex.: `RNM2026-0001`) | Senha definida pela secretaria (padrão inicial: `Aluno@2026`) |
| **Responsável** | Código de matrícula **do filho** | Sua senha de responsável (gerada no cadastro — ex.: `mariasilva`) |
| **Professor** | E-mail institucional | Senha própria (padrão inicial: `Prof@2026`) |
| **Administrador** | E-mail + senha | + **código de 6 dígitos** enviado por e-mail (vale 5 min) |

> 💡 No celular, o sistema tem navegação por barra inferior, como um
> aplicativo. Pode adicionar à tela inicial do celular pelo navegador
> ("Adicionar à tela de início").

> 🔑 **Aluno esqueceu a senha?** Na tela de login, clique em
> **"Esqueci minha senha"** e informe a matrícula: uma senha nova (gerada
> a partir da matrícula) é enviada para o e-mail cadastrado do aluno.
> Professores e responsáveis: a redefinição é feita pela secretaria.
> Todos podem trocar a própria senha em **Meu Perfil** (clique no avatar).

---

## 2. Área do ALUNO

| Menu | O que faz |
|---|---|
| **Dashboard** | Frequência atual (alerta vermelho se < 75%), seus cursos, próximas aulas e situação financeira. |
| **Cursos** | Seus cursos com turma, horário e plano — cada card com a cor do curso. |
| **Calendário** | Aulas do módulo atual (agendadas × realizadas). |
| **Redação** | Lançar quantas redações entregou em cada aula (0 a 3) e a nota recebida. O lançamento **aguarda aprovação do admin**. |
| **Acessos Externos** | Logins/senhas das plataformas parceiras (Sofia, Coredação...), somente leitura. |
| **Avisos** | Mural com avisos gerais, do seu curso, da sua turma e pessoais. |
| **Rematrícula** | Solicitar renovação para o próximo módulo e acompanhar o status. |

## 3. Área do RESPONSÁVEL

- Vê **frequência, financeiro, avisos e rematrícula do filho**.
- Se tiver **mais de um filho**, use o seletor no topo para alternar.
- Pode solicitar rematrícula em nome do filho.
- Segurança: o responsável só enxerga dados dos filhos vinculados a ele.

## 4. Área do PROFESSOR

| Menu | O que faz |
|---|---|
| **Dashboard** | Suas turmas, próxima aula, alunos com frequência abaixo de 75%. |
| **Turmas** | Lista de alunos de cada turma sua. |
| **Frequência** | Lançar presença por aula: PRESENTE, FALTA, FALTA JUSTIFICADA (+ reposições no curso de Redação). Tem botão **"Salvar todos"**. |
| **Redação** | (Só turmas de Redação) Lançar quantidade entregue e nota por aluno — também passa pela aprovação do admin. |
| **Avisos** | Mural com avisos gerais e os direcionados às suas turmas. |
| **Relatórios** | Exportar Excel da turma (frequência, entregas, médias). |

> 🔒 O professor só consegue lançar/consultar dados **das próprias turmas**
> — isso é garantido pelo servidor, não apenas pela tela.

## 5. Área do ADMINISTRADOR

| Menu | O que faz |
|---|---|
| **Dashboard** | KPIs: alunos ativos, matrículas, turmas, pagamentos atrasados, redações e rematrículas pendentes + atalhos rápidos. |
| **Usuários** | Cadastrar aluno (código gerado automaticamente, ex.: `RNM2026-0007`) com responsável opcional — a senha do responsável é gerada e exibida **uma única vez**. |
| **Acadêmico** | Criar turmas, cadastrar professores e **gerar o módulo do mês** (4 aulas automáticas no dia da semana da turma). ⚠️ Gere o módulo todo início de mês — sem ele não há lançamento de frequência. |
| **Matrículas** | Aprovar/recusar rematrículas (aprovar cria matrícula + 1ª cobrança automaticamente). |
| **Frequência** | Visão consolidada de todas as turmas, com lançamento direto. |
| **Redação** | Fila de aprovação das entregas: confira a quantidade, preencha/ajuste as **notas** e aprove. |
| **Financeiro** | Resumo (recebido, em atraso), confirmar pagamentos (PIX/dinheiro/cartão) e histórico. Pagamentos pendentes de meses anteriores viram **ATRASADO** automaticamente. |
| **Acessos Externos** | Cadastrar credenciais de plataformas por aluno (senha criptografada no banco). |
| **Avisos** | Publicar para **todos**, **um curso**, **uma turma** ou **um aluno**. |
| **Relatórios** | Exportar Excel por turma. |
| **Configurações** | Foto de perfil e trilha de auditoria (últimas ações; espelho no Google Sheets). |

### Login do admin passo a passo
1. Selecione "Administrador", informe e-mail e senha → **Enviar código**.
2. Chega um código de 6 dígitos no seu e-mail (validade: 5 minutos,
   máximo 5 tentativas, reenvio a cada 60s).
3. Digite o código → **Verificar código** → pronto.

---

## 6. Fluxos do mês (rotina recomendada)

1. **Início do mês (admin):** Acadêmico → "Gerar módulo do mês" em cada
   turma ativa. Isso cria as 4 aulas do mês.
2. **A cada aula (professor):** Frequência → selecionar status por aluno →
   "Salvar todos". Nas turmas de Redação, lançar também as entregas.
3. **Ao longo do mês (admin):** aprovar redações pendentes (com notas),
   confirmar pagamentos recebidos, publicar avisos.
4. **Fim do módulo:** alunos/responsáveis solicitam rematrícula → admin
   aprova (cria matrícula nova + cobrança).
5. **Relatórios:** exportar Excel por turma para reuniões e, para conversar
   com os pais, gerar o **Relatório individual do aluno (PDF A4)** em
   Relatórios — com frequência, notas de redação (professora/Sofia +
   competências ENEM + feedback) e situação financeira. O responsável
   também baixa esse PDF direto no painel dele.

---

## 7. Segurança (como o sistema protege os dados)

- **Toda validação é feita no servidor** — regras de negócio, limites e
  permissões não dependem do navegador.
- Cada perfil só acessa o que a matriz de permissões permite (ex.: aluno
  nunca vê dados de outro aluno; responsável só vê filhos vinculados;
  professor só vê as próprias turmas). Tentativas fora do escopo retornam
  403 e ficam registradas na auditoria.
- Senhas guardadas com **bcrypt** (hash); senhas de plataformas externas
  com **AES-256**; sessões em **cookie httpOnly assinado** (JWT).
- Login do admin exige **duplo fator por e-mail** (código de 6 dígitos
  gerado com CSPRNG).
- Headers de segurança em todas as respostas (nosniff, X-Frame-Options
  DENY, referrer-policy, permissions-policy).
- Trilha de auditoria: ações relevantes vão para o Postgres e para o
  Google Sheets.

## 8. Capacidade

O sistema foi dimensionado para **algumas centenas de usuários com folga**
(250+ tranquilamente): sessões JWT sem consulta ao banco, Postgres
serverless (Neon) com **índices nos campos mais consultados**, consultas
com limite de resultados e deploy na borda (Cloudflare Workers). Os planos
gratuitos dos serviços usados comportam essa escala (ver especificação,
seção 2.3).

## 9. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| "Credenciais inválidas" | Código/e-mail ou senha errados, ou usuário inativo | Conferir com a secretaria; admin pode redefinir a senha |
| Código do admin não chega | RESEND_API_KEY/SMTP não configurados | Conferir variáveis no painel Cloudflare; olhar spam |
| "Aguarde Xs para reenviar" | Proteção anti-spam do token | Aguardar 60s |
| Frequência sem aulas para lançar | Módulo do mês não foi gerado | Admin → Acadêmico → Gerar módulo |
| Aviso não aparece para o aluno | Aviso direcionado a outro curso/turma | Conferir o público-alvo do aviso |
| Foto não sobe | Google Drive não configurado ou arquivo > 4 MB | Conferir GOOGLE_* no painel; usar JPG/PNG/WebP até 4 MB |

## 10. Rodando localmente (desenvolvedor)

```bash
npm install
cp .env.example .env   # preencher credenciais
npm run db:push        # sincroniza o schema no Neon
npm run db:seed        # admin, professores, cursos, turmas, planos
npm run dev            # http://localhost:3000
```

Deploy: ver **terminar.md**.

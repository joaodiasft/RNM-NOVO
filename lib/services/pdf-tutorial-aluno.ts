import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";

const SITE = "https://redacaonotamil.site";
const LOGIN = `${SITE}/login`;

const COR_ROSA = rgb(0.84, 0.2, 0.42);
const COR_ESCURO = rgb(0.13, 0.15, 0.16);
const COR_TEXTO = rgb(0.15, 0.15, 0.15);
const COR_MUTED = rgb(0.45, 0.45, 0.45);
const COR_FUNDO = rgb(0.96, 0.97, 0.99);

const MARGEM = 48;
const LARGURA_A4 = 595.28;
const ALTURA_A4 = 841.89;
const LARGURA_UTIL = LARGURA_A4 - MARGEM * 2;

type Ctx = {
  pdf: PDFDocument;
  font: PDFFont;
  fontBold: PDFFont;
  page: PDFPage;
  y: number;
  imagens: Record<string, Awaited<ReturnType<PDFDocument["embedPng"]>>>;
};

function imgPath(nome: string) {
  return join(process.cwd(), "public", "tutorial", nome);
}

function quebrarLinhas(texto: string, maxChars: number): string[] {
  const palavras = texto.split(" ");
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (teste.length > maxChars) {
      if (atual) linhas.push(atual);
      atual = p;
    } else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function novaPagina(ctx: Ctx, titulo?: string) {
  ctx.page = ctx.pdf.addPage([LARGURA_A4, ALTURA_A4]);
  ctx.y = ALTURA_A4 - MARGEM;
  if (titulo) {
    ctx.page.drawRectangle({
      x: 0,
      y: ALTURA_A4 - 36,
      width: LARGURA_A4,
      height: 36,
      color: COR_ESCURO,
    });
    ctx.page.drawText(titulo, {
      x: MARGEM,
      y: ALTURA_A4 - 24,
      size: 11,
      font: ctx.fontBold,
      color: rgb(1, 1, 1),
    });
    ctx.y = ALTURA_A4 - 56;
  }
  rodape(ctx);
}

function rodape(ctx: Ctx) {
  ctx.page.drawText("Redacao Nota Mil — Tutorial do Aluno", {
    x: MARGEM,
    y: 28,
    size: 8,
    font: ctx.font,
    color: COR_MUTED,
  });
  ctx.page.drawText(SITE, {
    x: LARGURA_A4 - MARGEM - 130,
    y: 28,
    size: 8,
    font: ctx.font,
    color: COR_MUTED,
  });
}

function texto(
  ctx: Ctx,
  t: string,
  opts?: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; indent?: number }
) {
  const size = opts?.size ?? 10;
  const font = opts?.bold ? ctx.fontBold : ctx.font;
  const color = opts?.color ?? COR_TEXTO;
  const x = MARGEM + (opts?.indent ?? 0);
  if (ctx.y < 60) novaPagina(ctx);
  ctx.page.drawText(t, { x, y: ctx.y, size, font, color });
  ctx.y -= size + 6;
}

function paragrafo(ctx: Ctx, t: string, indent = 0) {
  for (const ln of quebrarLinhas(t, 92)) {
    if (ctx.y < 60) novaPagina(ctx);
    ctx.page.drawText(ln, {
      x: MARGEM + indent,
      y: ctx.y,
      size: 10,
      font: ctx.font,
      color: COR_TEXTO,
    });
    ctx.y -= 14;
  }
  ctx.y -= 4;
}

function secao(ctx: Ctx, titulo: string) {
  ctx.y -= 8;
  if (ctx.y < 80) novaPagina(ctx);
  ctx.page.drawRectangle({
    x: MARGEM,
    y: ctx.y - 4,
    width: LARGURA_UTIL,
    height: 22,
    color: COR_FUNDO,
  });
  texto(ctx, titulo, { size: 11, bold: true, color: COR_ROSA });
  ctx.y -= 4;
}

function lista(ctx: Ctx, itens: string[]) {
  for (const item of itens) {
    if (ctx.y < 60) novaPagina(ctx);
    texto(ctx, `• ${item}`, { indent: 8 });
  }
  ctx.y -= 4;
}

function passo(ctx: Ctx, num: number, titulo: string, desc: string) {
  if (ctx.y < 100) novaPagina(ctx);
  texto(ctx, `Passo ${num} — ${titulo}`, { bold: true, size: 11 });
  paragrafo(ctx, desc, 8);
}

function imagem(ctx: Ctx, chave: string, legenda: string, alturaMax = 200) {
  const img = ctx.imagens[chave];
  if (!img) return;
  const escala = Math.min(LARGURA_UTIL / img.width, alturaMax / img.height);
  const w = img.width * escala;
  const h = img.height * escala;
  if (ctx.y - h - 30 < 50) novaPagina(ctx);
  const x = MARGEM + (LARGURA_UTIL - w) / 2;
  ctx.page.drawImage(img, { x, y: ctx.y - h, width: w, height: h });
  ctx.y -= h + 8;
  ctx.page.drawText(legenda, {
    x: MARGEM,
    y: ctx.y,
    size: 8,
    font: ctx.font,
    color: COR_MUTED,
  });
  ctx.y -= 20;
}

async function carregarImagens(pdf: PDFDocument) {
  const mapa: Ctx["imagens"] = {};
  const arquivos = [
    "tutorial-00-capa.png",
    "tutorial-01-login.png",
    "tutorial-02-dashboard.png",
    "tutorial-03-navegacao.png",
    "tutorial-04-calendario.png",
    "tutorial-05-redacao.png",
  ];
  for (const arq of arquivos) {
    const p = imgPath(arq);
    if (existsSync(p)) {
      mapa[arq] = await pdf.embedPng(readFileSync(p));
    }
  }
  return mapa;
}

/** Gera PDF A4 completo — tutorial de acesso e uso para o aluno. */
export async function gerarPdfTutorialAluno(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const imagens = await carregarImagens(pdf);

  const ctx: Ctx = {
    pdf,
    font,
    fontBold,
    page: pdf.addPage([LARGURA_A4, ALTURA_A4]),
    y: ALTURA_A4 - MARGEM,
    imagens,
  };

  // ===== CAPA =====
  const capa = imagens["tutorial-00-capa.png"];
  if (capa) {
    const escala = Math.min(LARGURA_A4 / capa.width, ALTURA_A4 / capa.height);
    ctx.page.drawImage(capa, {
      x: 0,
      y: ALTURA_A4 - capa.height * escala,
      width: capa.width * escala,
      height: capa.height * escala,
    });
  } else {
    ctx.page.drawRectangle({ x: 0, y: 0, width: LARGURA_A4, height: ALTURA_A4, color: COR_ESCURO });
    texto(ctx, "TUTORIAL DO ALUNO", { size: 28, bold: true, color: rgb(1, 1, 1) });
    texto(ctx, "Redacao Nota Mil", { size: 16, color: rgb(0.9, 0.9, 0.9) });
  }
  ctx.page.drawText(`Atualizado em ${new Date().toLocaleDateString("pt-BR")}`, {
    x: MARGEM,
    y: 40,
    size: 9,
    font,
    color: rgb(0.7, 0.7, 0.7),
  });

  // ===== INDICE =====
  novaPagina(ctx, "Indice");
  const indice = [
    "1. Como acessar o sistema",
    "2. Primeiro login do aluno",
    "3. Esqueci minha senha",
    "4. Tela inicial (Dashboard)",
    "5. Menu e navegacao no celular",
    "6. Meus Cursos",
    "7. Calendario de aulas",
    "8. Redacao e notas",
    "9. Acessos externos (Sofia, Coredacao)",
    "10. Avisos da escola",
    "11. Rematricula",
    "12. Financeiro e pagamentos",
    "13. Conquistas e premios",
    "14. Duvidas frequentes",
  ];
  lista(ctx, indice);

  // ===== 1. ACESSO =====
  novaPagina(ctx, "1. Como acessar");
  paragrafo(
    ctx,
    "O sistema Redacao Nota Mil funciona no celular, tablet ou computador, direto pelo navegador (Chrome, Safari, Edge). Nao precisa instalar aplicativo."
  );
  secao(ctx, "Endereco do site");
  texto(ctx, SITE, { bold: true, size: 12, color: COR_ROSA });
  texto(ctx, `Pagina de login: ${LOGIN}`, { size: 10, color: COR_MUTED });
  ctx.y -= 8;
  secao(ctx, "Recomendacoes");
  lista(ctx, [
    "Use conexao com internet estavel (Wi-Fi ou 4G/5G).",
    "No celular, adicione o site a tela inicial para acesso rapido (menu do navegador > Adicionar a tela de inicio).",
    "Mantenha sua matricula e senha em local seguro — nao compartilhe com colegas.",
  ]);

  // ===== 2. LOGIN =====
  novaPagina(ctx, "2. Primeiro login");
  imagem(ctx, "tutorial-01-login.png", "Figura 1 — Tela de login (perfil Aluno selecionado)", 220);
  passo(
    ctx,
    1,
    "Abra o site",
    `Acesse ${SITE} no navegador. Voce sera direcionado para a pagina de login.`
  );
  passo(
    ctx,
    2,
    "Selecione o perfil Aluno",
    "Toque na aba ALUNO (icone de pessoa). Os outros perfis sao para responsavel, professor e administracao."
  );
  passo(
    ctx,
    3,
    "Informe matricula e senha",
    "Codigo de matricula: fornecido pela secretaria (ex.: RNM2026-0001). Senha: definida no cadastro ou enviada no primeiro acesso."
  );
  passo(ctx, 4, "Toque em Entrar", "Aguarde a validacao. Se estiver correto, voce entra no seu painel pessoal.");
  secao(ctx, "Dados de exemplo (treinamento)");
  lista(ctx, [
    "Matricula: RNM2026-0001",
    "Senha: Aluno@2026",
    "(Use os dados reais que a escola entregou para voce.)",
  ]);

  // ===== 3. ESQUECI SENHA =====
  novaPagina(ctx, "3. Esqueci minha senha");
  passo(
    ctx,
    1,
    "Na tela de login",
    "Com o perfil Aluno selecionado, toque em Esqueci minha senha."
  );
  passo(
    ctx,
    2,
    "Informe sua matricula",
    "Digite o codigo de matricula e confirme."
  );
  passo(
    ctx,
    3,
    "Verifique seu e-mail",
    "Uma nova senha sera enviada para o e-mail cadastrado pela escola (misturada com sua matricula). Se nao receber, confira o spam ou fale com a secretaria para cadastrar seu e-mail."
  );

  // ===== 4. DASHBOARD =====
  novaPagina(ctx, "4. Dashboard");
  imagem(ctx, "tutorial-02-dashboard.png", "Figura 2 — Painel inicial do aluno", 200);
  paragrafo(
    ctx,
    "Apos o login, voce ve seu nome, matricula e um resumo completo da sua vida academica."
  );
  secao(ctx, "O que aparece no painel");
  lista(ctx, [
    "Frequencia % — percentual de presenca nas aulas (alerta se abaixo de 75%).",
    "Modulo — numero do modulo atual do curso.",
    "Redacoes aprovadas — quantidade de entregas ja liberadas.",
    "Cursos ativos — quantos cursos voce esta matriculado (maximo 2).",
    "Meus cursos — turma, horario e situacao (ativo ou pendencia financeira).",
    "Proximas aulas — com cores: verde = presente, vermelho = falta, amarelo = reposicao.",
    "Financeiro — pagamentos pendentes, atrasados ou confirmados + botao WhatsApp para PIX.",
    "Conquistas — badges automaticos e premios da escola.",
  ]);

  // ===== 5. NAVEGACAO =====
  novaPagina(ctx, "5. Menu e navegacao");
  imagem(ctx, "tutorial-03-navegacao.png", "Figura 3 — Barra inferior no celular", 120);
  paragrafo(
    ctx,
    "No celular, o menu fica na barra inferior. No computador, o menu lateral esquerdo mostra as mesmas opcoes."
  );
  secao(ctx, "Telas disponiveis");
  lista(ctx, [
    "Dashboard — resumo geral (tela inicial).",
    "Cursos — detalhes das matriculas e promocoes.",
    "Calendario (Agenda) — grade mensal e lista de aulas.",
    "Redacao — notas e entregas (se matriculado em Redacao).",
    "Acessos Externos — login e senha das plataformas parceiras.",
    "Avisos — mural de comunicados da escola.",
    "Rematricula — solicitar renovacao do semestre/modulo.",
  ]);
  paragrafo(ctx, "Toque no icone do seu nome (canto superior) para acessar Perfil e trocar senha ou foto.");

  // ===== 6. CURSOS =====
  novaPagina(ctx, "6. Meus Cursos");
  secao(ctx, "Informacoes exibidas");
  lista(ctx, [
    "Nome do curso (Redacao, Exatas ou Matematica) com cor propria.",
    "Turma, dia da semana e horario das aulas.",
    "Plano contratado (Mensal, Bimestral, etc.).",
    "Promocoes ativas com desconto e validade.",
    "Avaliacao do curso — voce pode dar de 1 a 5 estrelas e deixar comentario.",
  ]);

  // ===== 7. CALENDARIO =====
  novaPagina(ctx, "7. Calendario");
  imagem(ctx, "tutorial-04-calendario.png", "Figura 4 — Calendario visual com aulas por dia", 200);
  lista(ctx, [
    "Grade mensal navegavel (setas para mudar o mes).",
    "Pontos coloridos nos dias com aula (cor de cada curso).",
    "Cards das proximas aulas com data e turma.",
    "Lista detalhada: tema da aula e status da chamada (presente/falta/reposicao).",
  ]);

  // ===== 8. REDACAO =====
  novaPagina(ctx, "8. Redacao");
  imagem(ctx, "tutorial-05-redacao.png", "Figura 5 — Acompanhamento de redacoes e notas", 200);
  paragrafo(
    ctx,
    "Disponivel para alunos matriculados em Redacao. As notas so aparecem apos aprovacao da administracao."
  );
  secao(ctx, "Fluxo da redacao");
  lista(ctx, [
    "1. Admin registra quantidade de redacoes entregues na aula.",
    "2. Professor/Admin lanca nota da professora e nota Sofia + 5 competencias ENEM.",
    "3. Admin aprova a entrega.",
    "4. Voce visualiza notas, feedback e desempenho no sistema.",
  ]);
  secao(ctx, "Material de aula");
  paragrafo(
    ctx,
    "Se voce faltou, o admin pode cadastrar um link de PDF com o tema da aula. Aparece como Baixar material da aula."
  );

  // ===== 9. ACESSOS =====
  novaPagina(ctx, "9. Acessos externos");
  lista(ctx, [
    "Credenciais das plataformas parceiras (ex.: Sofia, Coredacao).",
    "Cadastradas pela escola — voce apenas visualiza, nao edita.",
    "Link direto para abrir a plataforma + e-mail e senha exibidos.",
    "Se estiver vazio, aguarde a secretaria cadastrar seus acessos.",
  ]);

  // ===== 10. AVISOS =====
  novaPagina(ctx, "10. Avisos");
  lista(ctx, [
    "Comunicados da escola filtrados para seu curso/turma.",
    "Marque como lido ao ler — avisos sem resposta em 2 dias ficam como nao lido.",
    "Criados apenas pela administracao (voce nao cria avisos).",
  ]);

  // ===== 11. REMATRICULA =====
  novaPagina(ctx, "11. Rematricula");
  secao(ctx, "Como solicitar");
  lista(ctx, [
    "Confirme nome, telefone, WhatsApp e Instagram.",
    "Escolha turma do curso 1 (e curso 2, se tiver duas matriculas).",
    "Selecione plano e forma de pagamento.",
    "Informe dados do responsavel.",
    "Envie a solicitacao — fica bloqueada ate o admin aprovar.",
  ]);
  paragrafo(
    ctx,
    "Apos aprovacao, a nova matricula e gerada automaticamente com o primeiro pagamento pendente."
  );

  // ===== 12. FINANCEIRO =====
  novaPagina(ctx, "12. Financeiro");
  lista(ctx, [
    "No Dashboard, veja pagamentos PENDENTE, ATRASADO ou CONFIRMADO.",
    "Cada curso tem cobranca separada (se matriculado em 2 cursos, sao 2 mensalidades).",
    "Botao WhatsApp para pedir PIX e regularizar pagamento.",
    "Pagamentos sao confirmados pela secretaria apos o recebimento.",
  ]);

  // ===== 13. CONQUISTAS =====
  novaPagina(ctx, "13. Conquistas");
  lista(ctx, [
    "Badges automaticos: frequencia alta, redacoes entregues, notas boas, financeiro em dia.",
    "Premios especiais concedidos pelo admin (aparecem com icone de medalha).",
    "Visiveis no Dashboard em Minhas conquistas.",
  ]);

  // ===== 14. FAQ =====
  novaPagina(ctx, "14. Duvidas frequentes");
  secao(ctx, "Nao consigo entrar");
  paragrafo(ctx, "Verifique se selecionou o perfil ALUNO, se a matricula esta correta e se a senha nao tem espacos extras. Tente Esqueci minha senha ou fale com a secretaria.");
  secao(ctx, "Nao vejo minhas notas de redacao");
  paragrafo(ctx, "As notas so aparecem apos o admin aprovar a correcao. Aguarde ou pergunte ao professor.");
  secao(ctx, "Frequencia baixa");
  paragrafo(ctx, "Abaixo de 75% aparece alerta. Procure a secretaria para agendar reposicao.");
  secao(ctx, "Suporte");
  paragrafo(ctx, "Em caso de duvida, entre em contato com a secretaria da Redacao Nota Mil. Informe seu nome completo e codigo de matricula.");

  return pdf.save();
}

/** Salva o PDF em public/docs/tutorial-aluno.pdf */
export async function salvarPdfTutorialAluno(): Promise<string> {
  const bytes = await gerarPdfTutorialAluno();
  const dir = join(process.cwd(), "public", "docs");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const caminho = join(dir, "tutorial-aluno.pdf");
  writeFileSync(caminho, bytes);
  return caminho;
}

import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CORES_CURSO } from "@/lib/constants/cores";

const LABEL_CURSO: Record<string, string> = {
  REDACAO: "Redacao",
  EXATAS: "Exatas",
  MATEMATICA: "Matematica",
};

function fmtData(d: Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("pt-BR");
}

export async function buscarDadosPrimeiroAcesso(alunoId: string) {
  return prisma.aluno.findUniqueOrThrow({
    where: { id: alunoId },
    include: {
      responsaveis: { include: { responsavel: true } },
      matriculas: {
        where: { status: "ATIVA" },
        include: {
          turma: {
            include: {
              curso: true,
              professores: { include: { professor: true } },
              modulos: {
                orderBy: { numero: "desc" },
                take: 1,
                include: { aulas: { orderBy: { data: "asc" } } },
              },
            },
          },
          plano: true,
        },
      },
    },
  });
}

/** Gera PDF A4 com ficha completa do aluno (primeiro acesso / boas-vindas). */
export async function gerarPdfPrimeiroAcesso(alunoId: string): Promise<Uint8Array> {
  const aluno = await buscarDadosPrimeiroAcesso(alunoId);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const w = page.getWidth();
  const margem = 48;
  let y = page.getHeight() - margem;

  const corEscola = rgb(0.13, 0.15, 0.16);
  const corSecao = rgb(0.31, 0.27, 0.9);
  const corTexto = rgb(0.15, 0.15, 0.15);
  const corMuted = rgb(0.45, 0.45, 0.45);

  function drawText(
    text: string,
    x: number,
    yPos: number,
    size = 10,
    bold = false,
    color = corTexto
  ) {
    page.drawText(text, {
      x,
      y: yPos,
      size,
      font: bold ? fontBold : font,
      color,
    });
  }

  function secao(titulo: string) {
    y -= 18;
    page.drawRectangle({
      x: margem,
      y: y - 4,
      width: w - margem * 2,
      height: 22,
      color: rgb(0.96, 0.97, 0.99),
    });
    drawText(titulo, margem + 8, y + 2, 11, true, corSecao);
    y -= 28;
  }

  function campo(label: string, valor: string) {
    drawText(label, margem, y, 8, false, corMuted);
    drawText(valor || "-", margem, y - 12, 10, false, corTexto);
    y -= 28;
  }

  // Cabeçalho
  drawText("REDACAO NOTA MIL", margem, y, 18, true, corEscola);
  drawText("Ficha de Primeiro Acesso", margem, y - 22, 12, false, corMuted);
  drawText(`Emitido em ${new Date().toLocaleString("pt-BR")}`, w - margem - 160, y, 8, false, corMuted);
  y -= 44;

  page.drawLine({
    start: { x: margem, y },
    end: { x: w - margem, y },
    thickness: 1,
    color: rgb(0.88, 0.88, 0.9),
  });
  y -= 20;

  secao("Dados do aluno");
  campo("Nome completo", aluno.nome);
  campo("Matricula", aluno.codigo);
  campo("Data de nascimento", fmtData(aluno.dataNascimento));
  campo("Telefone / WhatsApp", [aluno.telefone, aluno.whatsapp].filter(Boolean).join(" · ") || "-");
  campo("E-mail", aluno.email || "-");
  campo("Escola / Serie", [aluno.escola, aluno.serie].filter(Boolean).join(" · ") || "-");
  if (aluno.cpf) campo("CPF", aluno.cpf);
  if (aluno.endereco) campo("Endereco", aluno.endereco);

  secao("Responsaveis");
  if (aluno.responsaveis.length === 0) {
    drawText("Nenhum responsavel vinculado.", margem, y, 10, false, corMuted);
    y -= 24;
  } else {
    for (const r of aluno.responsaveis) {
      const resp = r.responsavel;
      drawText(
        `${resp.nome}${r.parentesco ? ` (${r.parentesco})` : ""} — ${resp.telefone || "sem telefone"}`,
        margem,
        y,
        10
      );
      y -= 16;
    }
    y -= 8;
  }

  secao("Matriculas e turmas");
  if (aluno.matriculas.length === 0) {
    drawText("Sem matricula ativa no momento.", margem, y, 10, false, corMuted);
    y -= 24;
  } else {
    for (const m of aluno.matriculas) {
      const cursoNome = LABEL_CURSO[m.turma.curso.nome] || m.turma.curso.nome;
      const corHex = CORES_CURSO[m.turma.curso.nome]?.primaria;
      if (corHex) {
        const r = parseInt(corHex.slice(1, 3), 16) / 255;
        const g = parseInt(corHex.slice(3, 5), 16) / 255;
        const b = parseInt(corHex.slice(5, 7), 16) / 255;
        page.drawRectangle({
          x: margem,
          y: y - 6,
          width: 6,
          height: 48,
          color: rgb(r, g, b),
        });
      }
      drawText(`Curso: ${cursoNome}`, margem + 14, y, 11, true);
      drawText(
        `Turma ${m.turma.nome} · ${m.turma.diaSemana} ${m.turma.horaInicio}-${m.turma.horaFim}`,
        margem + 14,
        y - 14,
        9,
        false,
        corMuted
      );
      drawText(`Plano: ${m.plano.nome}`, margem + 14, y - 26, 9);
      const profs = m.turma.professores.map((p) => p.professor.nome).join(", ");
      if (profs) drawText(`Professor(es): ${profs}`, margem + 14, y - 38, 9, false, corMuted);
      y -= 58;

      const modulo = m.turma.modulos[0];
      if (modulo && modulo.aulas.length > 0) {
        drawText(`Modulo ${modulo.numero} — calendario de aulas:`, margem + 14, y, 9, true);
        y -= 14;
        const aulasTxt = modulo.aulas
          .slice(0, 8)
          .map((a) => `Aula ${a.numero}: ${fmtData(a.data)}`)
          .join("  |  ");
        const linhas = quebrarTexto(aulasTxt, 85);
        for (const ln of linhas) {
          drawText(ln, margem + 14, y, 8, false, corMuted);
          y -= 11;
        }
        if (modulo.aulas.length > 8) {
          drawText(`+ ${modulo.aulas.length - 8} aula(s) adicionais`, margem + 14, y, 8, false, corMuted);
          y -= 11;
        }
        y -= 8;
      }
    }
  }

  secao("Acesso ao sistema");
  drawText("Login do aluno: use sua matricula como usuario.", margem, y, 10);
  y -= 14;
  drawText("Login do responsavel: matricula do aluno + senha cadastrada.", margem, y, 10);
  y -= 14;
  drawText("Em caso de duvidas, entre em contato com a administracao da escola.", margem, y, 9, false, corMuted);

  // Rodapé
  drawText(
    "Redacao Nota Mil — Documento gerado automaticamente pelo sistema.",
    margem,
    36,
    8,
    false,
    corMuted
  );

  return pdf.save();
}

function quebrarTexto(texto: string, maxChars: number): string[] {
  const palavras = texto.split(" ");
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (teste.length > maxChars) {
      if (atual) linhas.push(atual);
      atual = p;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import {
  calcularPercentualFrequencia,
  FREQUENCIA_ALERTA_PERCENTUAL,
} from "@/lib/utils/index";

const LABEL_CURSO: Record<string, string> = {
  REDACAO: "Redacao",
  EXATAS: "Exatas",
  MATEMATICA: "Matematica",
};

const COR_HEX: Record<string, [number, number, number]> = {
  REDACAO: [0.84, 0.2, 0.42],
  EXATAS: [0.18, 0.62, 0.27],
  MATEMATICA: [0.1, 0.44, 0.76],
};

function fmtData(d: Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("pt-BR");
}

/** Remove acentos — as fontes padrão do pdf-lib são WinAnsi. */
function ascii(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Relatório individual e completo do aluno, pensado para ser entregue
 * ao pai/responsável: identificação, cursos, frequência, redações
 * (notas professora/Sofia + competências + feedback) e financeiro.
 */
export async function gerarPdfRelatorioAluno(alunoId: string): Promise<Uint8Array> {
  const aluno = await prisma.aluno.findUniqueOrThrow({
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
            },
          },
          plano: true,
          pagamentos: { orderBy: { competencia: "desc" }, take: 6 },
        },
      },
      frequencias: {
        include: { aula: { include: { modulo: { include: { turma: true } } } } },
        orderBy: { id: "desc" },
      },
      entregasRedacao: {
        where: { status: "APROVADA" },
        include: { correcoes: { orderBy: { numero: "asc" } }, aula: true },
      },
    },
  });

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const A4: [number, number] = [595.28, 841.89];
  const margem = 48;
  let page = pdf.addPage(A4);
  let y = page.getHeight() - margem;

  const corTitulo = rgb(0.13, 0.15, 0.16);
  const corSecao = rgb(0.31, 0.27, 0.9);
  const corTexto = rgb(0.15, 0.15, 0.15);
  const corMuted = rgb(0.45, 0.45, 0.45);
  const corOk = rgb(0.09, 0.55, 0.29);
  const corRuim = rgb(0.8, 0.15, 0.15);

  function novaPaginaSePrecisar(espaco: number) {
    if (y - espaco < margem + 30) {
      page = pdf.addPage(A4);
      y = page.getHeight() - margem;
    }
  }

  function texto(
    t: string,
    x: number,
    yPos: number,
    size = 10,
    bold = false,
    color = corTexto,
    pagina: PDFPage = page,
    fonte: PDFFont = bold ? fontBold : font
  ) {
    pagina.drawText(ascii(t), { x, y: yPos, size, font: fonte, color });
  }

  function secao(titulo: string) {
    novaPaginaSePrecisar(60);
    y -= 16;
    page.drawRectangle({
      x: margem,
      y: y - 4,
      width: page.getWidth() - margem * 2,
      height: 22,
      color: rgb(0.96, 0.97, 0.99),
    });
    texto(titulo, margem + 8, y + 2, 11, true, corSecao);
    y -= 30;
  }

  function linha(t: string, size = 10, cor = corTexto, indent = 0, bold = false) {
    novaPaginaSePrecisar(16);
    texto(t, margem + indent, y, size, bold, cor);
    y -= size + 5;
  }

  // ===== Cabeçalho =====
  texto("REDACAO NOTA MIL", margem, y, 18, true, corTitulo);
  texto(
    `Emitido em ${new Date().toLocaleDateString("pt-BR")}`,
    page.getWidth() - margem - 130,
    y,
    8,
    false,
    corMuted
  );
  y -= 20;
  texto("Relatorio individual do aluno — para pais e responsaveis", margem, y, 11, false, corMuted);
  y -= 24;
  page.drawLine({
    start: { x: margem, y },
    end: { x: page.getWidth() - margem, y },
    thickness: 1,
    color: rgb(0.88, 0.88, 0.9),
  });
  y -= 22;

  // ===== Identificação =====
  secao("Identificacao");
  linha(`${aluno.nome}  (matricula ${aluno.codigo})`, 13, corTexto, 0, true);
  linha(
    [
      aluno.serie ? `Serie: ${aluno.serie}` : null,
      aluno.escola ? `Escola: ${aluno.escola}` : null,
      aluno.dataNascimento ? `Nascimento: ${fmtData(aluno.dataNascimento)}` : null,
    ]
      .filter(Boolean)
      .join("   |   ") || "-",
    9,
    corMuted
  );
  if (aluno.responsaveis.length > 0) {
    linha(
      "Responsavel(is): " +
        aluno.responsaveis
          .map(
            (r) =>
              `${r.responsavel.nome}${r.parentesco ? ` (${r.parentesco})` : ""}${
                r.responsavel.telefone ? ` - ${r.responsavel.telefone}` : ""
              }`
          )
          .join(" | "),
      9,
      corMuted
    );
  }

  // ===== Cursos =====
  secao("Cursos e turmas");
  if (aluno.matriculas.length === 0) {
    linha("Sem matricula ativa no momento.", 10, corMuted);
  }
  for (const m of aluno.matriculas) {
    novaPaginaSePrecisar(46);
    const [r, g, b] = COR_HEX[m.turma.curso.nome] ?? [0.5, 0.5, 0.5];
    page.drawRectangle({ x: margem, y: y - 20, width: 6, height: 32, color: rgb(r, g, b) });
    texto(
      `${LABEL_CURSO[m.turma.curso.nome] ?? m.turma.curso.nome} — Turma ${m.turma.nome}`,
      margem + 14,
      y,
      11,
      true
    );
    y -= 14;
    texto(
      `${m.turma.diaSemana} ${m.turma.horaInicio}-${m.turma.horaFim} · Plano ${m.plano.nome} · Prof.: ${
        m.turma.professores.map((p) => p.professor.nome).join(", ") || "-"
      }`,
      margem + 14,
      y,
      9,
      false,
      corMuted
    );
    y -= 22;
  }

  // ===== Frequência =====
  secao("Frequencia");
  const pctGeral = calcularPercentualFrequencia(aluno.frequencias);
  const abaixo = pctGeral < FREQUENCIA_ALERTA_PERCENTUAL;
  linha(
    `Frequencia geral: ${pctGeral}%  (${aluno.frequencias.length} registro(s))`,
    12,
    abaixo ? corRuim : corOk,
    0,
    true
  );
  if (abaixo) {
    linha(
      `Atencao: abaixo do minimo recomendado de ${FREQUENCIA_ALERTA_PERCENTUAL}%.`,
      9,
      corRuim
    );
  }
  const ultimas = aluno.frequencias.slice(0, 12);
  if (ultimas.length > 0) {
    linha("Ultimos registros:", 9, corMuted);
    for (const f of ultimas) {
      const presente = f.status === "PRESENTE" || f.status.startsWith("REPOSICAO");
      linha(
        `${fmtData(f.aula.data)} — Turma ${f.aula.modulo.turma.nome} — ${f.status.replace(/_/g, " ")}`,
        9,
        presente ? corOk : f.status === "FALTA_JUSTIFICADA" ? corMuted : corRuim,
        12
      );
    }
  }

  // ===== Redações =====
  secao("Redacoes (aprovadas pela secretaria)");
  if (aluno.entregasRedacao.length === 0) {
    linha("Nenhuma redacao aprovada ate o momento.", 10, corMuted);
  } else {
    const totalEntregues = aluno.entregasRedacao.reduce(
      (s, e) => s + e.quantidadeEntregue,
      0
    );
    const notasProf = aluno.entregasRedacao
      .flatMap((e) => e.correcoes)
      .map((c) => (c.nota != null ? Number(c.nota) : null))
      .filter((n): n is number => n !== null);
    const media =
      notasProf.length > 0
        ? Math.round(notasProf.reduce((a, b) => a + b, 0) / notasProf.length)
        : null;
    linha(
      `Total entregue: ${totalEntregues} redacao(oes)` +
        (media !== null ? `   |   Media (professora): ${media}` : ""),
      11,
      corTexto,
      0,
      true
    );
    y -= 4;
    for (const e of aluno.entregasRedacao) {
      novaPaginaSePrecisar(30 + e.correcoes.length * 34);
      linha(`Aula de ${fmtData(e.aula.data)} — ${e.quantidadeEntregue} entregue(s)`, 10, corTexto, 0, true);
      for (const c of e.correcoes) {
        const comps = c.competencias
          ? (JSON.parse(c.competencias) as number[])
          : null;
        linha(
          `Redacao ${c.numero}:  Professora ${c.nota != null ? Number(c.nota) : "-"}   |   Sofia ${
            c.notaSofia != null ? Number(c.notaSofia) : "-"
          }` + (comps ? `   |   Competencias: ${comps.join(" / ")}` : ""),
          9,
          corTexto,
          12
        );
        if (c.feedback) {
          linha(`Feedback: ${c.feedback}`, 8, corMuted, 12);
        }
      }
      y -= 4;
    }
  }

  // ===== Financeiro =====
  secao("Financeiro (ultimas competencias)");
  const pagamentos = aluno.matriculas.flatMap((m) =>
    m.pagamentos.map((p) => ({ ...p, curso: m.turma.curso.nome }))
  );
  if (pagamentos.length === 0) {
    linha("Nenhum pagamento registrado.", 10, corMuted);
  } else {
    for (const p of pagamentos) {
      const cor =
        p.status === "CONFIRMADO" ? corOk : p.status === "ATRASADO" ? corRuim : corMuted;
      linha(
        `${p.competencia} — ${LABEL_CURSO[p.curso] ?? p.curso} — R$ ${Number(p.valor).toFixed(2)} — ${p.status}`,
        9,
        cor
      );
    }
  }

  // ===== Rodapé em todas as páginas =====
  const paginas = pdf.getPages();
  paginas.forEach((p, i) => {
    p.drawText(
      ascii(
        `Redacao Nota Mil — Relatorio de ${aluno.nome} (${aluno.codigo}) — pagina ${i + 1}/${paginas.length}`
      ),
      { x: margem, y: 30, size: 8, font, color: corMuted }
    );
  });

  return pdf.save();
}

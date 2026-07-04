import { prisma } from "@/lib/prisma";
import {
  calcularPercentualFrequencia,
  FREQUENCIA_ALERTA_PERCENTUAL,
} from "@/lib/utils";

export async function relatorioTurmaProfessor(turmaId: string) {
  const turma = await prisma.turma.findUniqueOrThrow({
    where: { id: turmaId },
    include: {
      curso: true,
      matriculas: {
        where: { status: "ATIVA" },
        include: {
          aluno: {
            include: {
              frequencias: { include: { aula: { include: { modulo: true } } } },
              entregasRedacao: {
                where: { status: "APROVADA" },
                include: { correcoes: true },
              },
            },
          },
        },
      },
      modulos: { include: { aulas: true }, orderBy: { numero: "desc" }, take: 1 },
    },
  });

  const moduloAtual = turma.modulos[0];
  const aulaIdsModulo = moduloAtual?.aulas.map((a) => a.id) ?? [];

  const alunos = turma.matriculas.map((m) => {
    const freqs = m.aluno.frequencias.filter((f) =>
      aulaIdsModulo.includes(f.aulaId)
    );
    const percentual = calcularPercentualFrequencia(freqs);
    const entregas = m.aluno.entregasRedacao.filter((e) =>
      aulaIdsModulo.includes(e.aulaId)
    );
    const notas = entregas.flatMap((e) =>
      e.correcoes.filter((c) => c.nota).map((c) => Number(c.nota))
    );
    const mediaNotas =
      notas.length > 0
        ? notas.reduce((a, b) => a + b, 0) / notas.length
        : null;

    return {
      id: m.aluno.id,
      nome: m.aluno.nome,
      codigo: m.aluno.codigo,
      percentualFrequencia: percentual,
      alertaFrequencia: percentual < FREQUENCIA_ALERTA_PERCENTUAL,
      totalEntregas: entregas.reduce((s, e) => s + e.quantidadeEntregue, 0),
      mediaNotas,
    };
  });

  const mediaTurma =
    alunos.length > 0
      ? Math.round(
          alunos.reduce((s, a) => s + a.percentualFrequencia, 0) / alunos.length
        )
      : 100;

  return { turma, alunos, mediaTurma, moduloAtual };
}

export async function relatorioAdminFinanceiro() {
  const pagamentos = await prisma.pagamento.findMany({
    include: {
      matriculaCurso: {
        include: {
          aluno: true,
          turma: { include: { curso: true } },
        },
      },
    },
    orderBy: { competencia: "desc" },
  });

  const porMes: Record<string, { confirmado: number; pendente: number; atrasado: number }> = {};
  for (const p of pagamentos) {
    if (!porMes[p.competencia]) {
      porMes[p.competencia] = { confirmado: 0, pendente: 0, atrasado: 0 };
    }
    const val = Number(p.valor);
    if (p.status === "CONFIRMADO") porMes[p.competencia].confirmado += val;
    else if (p.status === "ATRASADO") porMes[p.competencia].atrasado += val;
    else porMes[p.competencia].pendente += val;
  }

  return { pagamentos, porMes };
}

export async function exportarRelatorioTurmaXlsx(turmaId: string) {
  const { turma, alunos } = await relatorioTurmaProfessor(turmaId);
  const XLSX = await import("xlsx");
  const rows = alunos.map((a) => ({
    Codigo: a.codigo,
    Nome: a.nome,
    "Frequencia %": a.percentualFrequencia,
    Alerta: a.alertaFrequencia ? "Sim" : "Não",
    Entregas: a.totalEntregas,
    "Media Notas": a.mediaNotas?.toFixed(1) ?? "-",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, turma.nome);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

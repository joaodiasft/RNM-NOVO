import { prisma } from "@/lib/prisma";

const DIAS_EXPIRA_NAO_LIDO = 2;

function expirado(criadoEm: Date, lido: boolean) {
  if (lido) return false;
  const limite = new Date(criadoEm);
  limite.setDate(limite.getDate() + DIAS_EXPIRA_NAO_LIDO);
  return new Date() > limite;
}

export async function avisosComLeitura(
  avisos: { id: string; titulo: string; mensagem: string; criadoEm: Date }[],
  usuarioId: string
) {
  if (avisos.length === 0) return [];
  const leituras = await prisma.avisoLeitura.findMany({
    where: {
      usuarioId,
      avisoId: { in: avisos.map((a) => a.id) },
    },
  });
  const lidos = new Set(leituras.map((l) => l.avisoId));
  return avisos.map((a) => ({
    ...a,
    lido: lidos.has(a.id),
    expirado: expirado(a.criadoEm, lidos.has(a.id)),
  }));
}

/** Mural do aluno: TODOS + direcionados a ele, às turmas e aos cursos dele. */
export async function avisosParaAluno(alunoId: string, limite = 20) {
  const matriculas = await prisma.matriculaCurso.findMany({
    where: { alunoId, status: "ATIVA" },
    select: { turmaId: true, turma: { select: { cursoId: true } } },
  });

  const avisos = await prisma.aviso.findMany({
    where: {
      OR: [
        { publicoAlvo: "TODOS" },
        { publicoAlvo: "ALUNO", alunoId },
        {
          publicoAlvo: "TURMA",
          turmaId: { in: matriculas.map((m) => m.turmaId) },
        },
        {
          publicoAlvo: "CURSO",
          cursoId: { in: matriculas.map((m) => m.turma.cursoId) },
        },
      ],
    },
    orderBy: { criadoEm: "desc" },
    take: limite,
  });

  return avisosComLeitura(avisos, alunoId);
}

/** Mural do professor: TODOS + direcionados às turmas/cursos em que leciona. */
export async function avisosParaProfessor(professorId: string, limite = 20) {
  const turmas = await prisma.turmaProfessor.findMany({
    where: { professorId },
    select: { turmaId: true, turma: { select: { cursoId: true } } },
  });

  const avisos = await prisma.aviso.findMany({
    where: {
      OR: [
        { publicoAlvo: "TODOS" },
        { publicoAlvo: "TURMA", turmaId: { in: turmas.map((t) => t.turmaId) } },
        {
          publicoAlvo: "CURSO",
          cursoId: { in: turmas.map((t) => t.turma.cursoId) },
        },
      ],
    },
    orderBy: { criadoEm: "desc" },
    take: limite,
  });

  return avisosComLeitura(avisos, professorId);
}

export async function contarAvisosNaoLidos(
  avisos: { id: string; criadoEm: Date }[],
  usuarioId: string
) {
  const comLeitura = await avisosComLeitura(
    avisos.map((a) => ({
      ...a,
      titulo: "",
      mensagem: "",
    })),
    usuarioId
  );
  return comLeitura.filter((a) => !a.lido).length;
}

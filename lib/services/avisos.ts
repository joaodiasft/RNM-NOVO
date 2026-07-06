import { prisma } from "@/lib/prisma";

/** Mural do aluno: TODOS + direcionados a ele, às turmas e aos cursos dele. */
export async function avisosParaAluno(alunoId: string, limite = 20) {
  const matriculas = await prisma.matriculaCurso.findMany({
    where: { alunoId, status: "ATIVA" },
    select: { turmaId: true, turma: { select: { cursoId: true } } },
  });

  return prisma.aviso.findMany({
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
}

/** Mural do professor: TODOS + direcionados às turmas/cursos em que leciona. */
export async function avisosParaProfessor(professorId: string, limite = 20) {
  const turmas = await prisma.turmaProfessor.findMany({
    where: { professorId },
    select: { turmaId: true, turma: { select: { cursoId: true } } },
  });

  return prisma.aviso.findMany({
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
}

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { PapelUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/logging/sheets";

export async function requireApiAuth(papeis?: PapelUsuario[]) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ erro: "Não autorizado" }, { status: 401 }) };
  }
  if (papeis && !papeis.includes(session.user.papel)) {
    registrarLog({
      nivel: "WARN",
      categoria: "AUTH",
      acao: "ACESSO_NEGADO",
      usuarioId: session.user.id,
      papel: session.user.papel,
    });
    return { error: NextResponse.json({ erro: "Sem permissão" }, { status: 403 }) };
  }
  return { session };
}

/**
 * Nunca vaza detalhes internos (Prisma, stack, SQL) para o cliente.
 * Só expõe mensagens de regras de negócio lançadas pelos nossos serviços
 * (`new Error("...")` puro). Qualquer outra coisa vira erro genérico.
 */
export function handleApiError(err: unknown) {
  console.error("[api]", err);
  const ehErroDeNegocio =
    err instanceof Error &&
    err.constructor === Error &&
    err.message.length > 0 &&
    err.message.length <= 200;
  const mensagem = ehErroDeNegocio
    ? (err as Error).message
    : "Não foi possível concluir a operação. Tente novamente.";
  return NextResponse.json(
    { erro: mensagem },
    { status: ehErroDeNegocio ? 400 : 500 }
  );
}

export function respostaProibida(motivo = "Sem permissão") {
  return NextResponse.json({ erro: motivo }, { status: 403 });
}

/* ------------------------------------------------------------------ */
/* Checagens de vínculo — autorização fina, sempre no banco.           */
/* ------------------------------------------------------------------ */

/** O aluno pertence a este responsável? */
export async function alunoPertenceAoResponsavel(
  responsavelId: string,
  alunoId: string
): Promise<boolean> {
  const vinculo = await prisma.alunoResponsavel.findFirst({
    where: { responsavelId, alunoId },
    select: { id: true },
  });
  return !!vinculo;
}

/** O professor leciona nesta turma? */
export async function professorLecionaTurma(
  professorId: string,
  turmaId: string
): Promise<boolean> {
  const vinculo = await prisma.turmaProfessor.findFirst({
    where: { professorId, turmaId },
    select: { id: true },
  });
  return !!vinculo;
}

/** O professor leciona na turma desta aula? (retorna a turmaId ou null) */
export async function turmaDaAulaSeProfessorLeciona(
  professorId: string,
  aulaId: string
): Promise<string | null> {
  const aula = await prisma.aula.findUnique({
    where: { id: aulaId },
    select: { modulo: { select: { turmaId: true } } },
  });
  if (!aula) return null;
  const leciona = await professorLecionaTurma(professorId, aula.modulo.turmaId);
  return leciona ? aula.modulo.turmaId : null;
}

/** O aluno está matriculado (matrícula ATIVA) na turma desta aula? */
export async function alunoMatriculadoNaAula(
  alunoId: string,
  aulaId: string
): Promise<boolean> {
  const aula = await prisma.aula.findUnique({
    where: { id: aulaId },
    select: { modulo: { select: { turmaId: true } } },
  });
  if (!aula) return false;
  const matricula = await prisma.matriculaCurso.findFirst({
    where: { alunoId, turmaId: aula.modulo.turmaId, status: "ATIVA" },
    select: { id: true },
  });
  return !!matricula;
}

/**
 * Resolve qual aluno um RESPONSAVEL pode acessar: usa o selecionado na
 * sessão (se realmente for filho dele) ou o primeiro filho vinculado.
 */
export async function alunoDoResponsavel(
  responsavelId: string,
  alunoSelecionadoId?: string
): Promise<string | null> {
  const vinculo = await prisma.alunoResponsavel.findFirst({
    where: {
      responsavelId,
      ...(alunoSelecionadoId ? { alunoId: alunoSelecionadoId } : {}),
    },
    select: { alunoId: true },
  });
  if (vinculo) return vinculo.alunoId;
  if (alunoSelecionadoId) {
    // selecionado não pertence a ele — cai para o primeiro filho real
    const primeiro = await prisma.alunoResponsavel.findFirst({
      where: { responsavelId },
      select: { alunoId: true },
    });
    return primeiro?.alunoId ?? null;
  }
  return null;
}

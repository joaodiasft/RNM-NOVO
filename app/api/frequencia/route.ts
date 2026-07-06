import { NextResponse } from "next/server";
import {
  requireApiAuth,
  handleApiError,
  respostaProibida,
  turmaDaAulaSeProfessorLeciona,
  professorLecionaTurma,
  alunoDoResponsavel,
} from "@/lib/api-helpers";
import { lancarFrequencia } from "@/lib/services/academico";
import { prisma } from "@/lib/prisma";
import { frequenciaSchema, validar } from "@/lib/validacao";

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth(["ADMIN", "PROFESSOR"]);
  if (error) return error;

  try {
    const bruto = await request.json().catch(() => null);
    const body = validar(frequenciaSchema, bruto);
    if (body.erro !== null) {
      return NextResponse.json({ erro: body.erro }, { status: 400 });
    }
    const dados = body.data;

    // Professor só lança frequência nas turmas em que leciona
    if (session!.user.papel === "PROFESSOR") {
      const turmaId = await turmaDaAulaSeProfessorLeciona(
        session!.user.id,
        dados.aulaId
      );
      if (!turmaId) {
        return respostaProibida("Você não leciona na turma desta aula");
      }
    }

    const freq = await lancarFrequencia({
      aulaId: dados.aulaId,
      alunoId: dados.alunoId,
      status: dados.status,
      reposicaoData: dados.reposicaoData ?? undefined,
      reposicaoTurmaId: dados.reposicaoTurmaId ?? undefined,
      usuarioId: session!.user.id,
      papel: session!.user.papel,
    });
    return NextResponse.json(freq);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(request: Request) {
  const { session, error } = await requireApiAuth([
    "ADMIN",
    "PROFESSOR",
    "ALUNO",
    "RESPONSAVEL",
  ]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const turmaIdParam = searchParams.get("turmaId");
  const alunoIdParam = searchParams.get("alunoId");
  const papel = session!.user.papel;

  const where: Record<string, unknown> = {};

  // Escopo por papel — nunca confie nos parâmetros do cliente
  if (papel === "ALUNO") {
    where.alunoId = session!.user.id;
  } else if (papel === "RESPONSAVEL") {
    const alunoId = await alunoDoResponsavel(
      session!.user.id,
      alunoIdParam || session!.user.alunoSelecionadoId
    );
    if (!alunoId) return NextResponse.json([]);
    where.alunoId = alunoId;
  } else if (papel === "PROFESSOR") {
    if (turmaIdParam) {
      const leciona = await professorLecionaTurma(session!.user.id, turmaIdParam);
      if (!leciona) return respostaProibida("Você não leciona nesta turma");
      where.aula = { modulo: { turmaId: turmaIdParam } };
    } else {
      where.aula = {
        modulo: {
          turma: { professores: { some: { professorId: session!.user.id } } },
        },
      };
    }
    if (alunoIdParam) where.alunoId = alunoIdParam;
  } else {
    // ADMIN
    if (alunoIdParam) where.alunoId = alunoIdParam;
    if (turmaIdParam) where.aula = { modulo: { turmaId: turmaIdParam } };
  }

  const frequencias = await prisma.frequencia.findMany({
    where,
    include: { aula: true, aluno: { select: { id: true, nome: true, codigo: true } } },
    take: 2000,
  });
  return NextResponse.json(frequencias);
}

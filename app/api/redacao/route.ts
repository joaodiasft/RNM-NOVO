import { NextResponse } from "next/server";
import {
  requireApiAuth,
  handleApiError,
  respostaProibida,
  turmaDaAulaSeProfessorLeciona,
  alunoMatriculadoNaAula,
} from "@/lib/api-helpers";
import {
  lancarEntregaRedacao,
  aprovarEntregaRedacao,
} from "@/lib/services/academico";
import { prisma } from "@/lib/prisma";
import { redacaoPostSchema, redacaoPatchSchema, validar } from "@/lib/validacao";

export async function GET(request: Request) {
  const { session, error } = await requireApiAuth(["ADMIN", "PROFESSOR", "ALUNO"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const papel = session!.user.papel;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  // Escopo por papel
  if (papel === "ALUNO") {
    where.alunoId = session!.user.id;
  } else if (papel === "PROFESSOR") {
    where.aula = {
      modulo: {
        turma: { professores: { some: { professorId: session!.user.id } } },
      },
    };
  }

  const entregas = await prisma.entregaRedacao.findMany({
    where,
    include: {
      aluno: { select: { id: true, nome: true, codigo: true } },
      aula: { include: { modulo: { include: { turma: true } } } },
      correcoes: true,
    },
    orderBy: { id: "desc" },
    take: 500,
  });
  return NextResponse.json(entregas);
}

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth(["ADMIN", "PROFESSOR", "ALUNO"]);
  if (error) return error;

  try {
    const bruto = await request.json().catch(() => null);
    const body = validar(redacaoPostSchema, bruto);
    if (body.erro !== null) {
      return NextResponse.json({ erro: body.erro }, { status: 400 });
    }
    const dados = body.data;
    const papel = session!.user.papel;

    // Aluno só lança a própria entrega e precisa estar matriculado na turma da aula
    let alunoId: string;
    if (papel === "ALUNO") {
      alunoId = session!.user.id;
      const matriculado = await alunoMatriculadoNaAula(alunoId, dados.aulaId);
      if (!matriculado) {
        return respostaProibida("Você não está matriculado na turma desta aula");
      }
    } else {
      if (!dados.alunoId) {
        return NextResponse.json({ erro: "Informe o aluno" }, { status: 400 });
      }
      alunoId = dados.alunoId;
      if (papel === "PROFESSOR") {
        const turmaId = await turmaDaAulaSeProfessorLeciona(
          session!.user.id,
          dados.aulaId
        );
        if (!turmaId) {
          return respostaProibida("Você não leciona na turma desta aula");
        }
      }
      const matriculado = await alunoMatriculadoNaAula(alunoId, dados.aulaId);
      if (!matriculado) {
        return NextResponse.json(
          { erro: "Aluno não está matriculado na turma desta aula" },
          { status: 400 }
        );
      }
    }

    const entrega = await lancarEntregaRedacao({
      aulaId: dados.aulaId,
      alunoId,
      quantidadeEntregue: dados.quantidadeEntregue,
      correcoes: dados.correcoes?.map((c) => ({
        numero: c.numero,
        nota: c.nota ?? undefined,
        comentario: c.comentario ?? undefined,
      })),
      usuarioId: session!.user.id,
      papel,
    });
    return NextResponse.json(entrega);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  const { session, error } = await requireApiAuth(["ADMIN"]);
  if (error) return error;

  try {
    const bruto = await request.json().catch(() => null);
    const body = validar(redacaoPatchSchema, bruto);
    if (body.erro !== null) {
      return NextResponse.json({ erro: body.erro }, { status: 400 });
    }
    const entrega = await aprovarEntregaRedacao(
      body.data.entregaId,
      session!.user.id,
      session!.user.papel,
      body.data.correcoes?.map((c) => ({
        numero: c.numero,
        nota: c.nota ?? undefined,
        comentario: c.comentario ?? undefined,
      }))
    );
    return NextResponse.json(entrega);
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/logging/sheets";
import { feedbackCursoSchema, validar } from "@/lib/validacao";

/**
 * Feedback do curso — o ALUNO avalia (1-5 estrelas + comentário) apenas
 * cursos em que está matriculado. Um feedback por curso (atualizável).
 */
export async function POST(request: Request) {
  const { session, error } = await requireApiAuth(["ALUNO"]);
  if (error) return error;

  try {
    const bruto = await request.json().catch(() => null);
    const body = validar(feedbackCursoSchema, bruto);
    if (body.erro !== null) {
      return NextResponse.json({ erro: body.erro }, { status: 400 });
    }
    const alunoId = session!.user.id;

    // Só avalia curso em que tem matrícula ativa — checado no banco
    const matricula = await prisma.matriculaCurso.findFirst({
      where: {
        alunoId,
        status: "ATIVA",
        turma: { cursoId: body.data.cursoId },
      },
      select: { id: true },
    });
    if (!matricula) {
      return NextResponse.json(
        { erro: "Você não está matriculado neste curso" },
        { status: 403 }
      );
    }

    const feedback = await prisma.feedbackCurso.upsert({
      where: {
        alunoId_cursoId: { alunoId, cursoId: body.data.cursoId },
      },
      update: {
        nota: body.data.nota,
        comentario: body.data.comentario || null,
      },
      create: {
        alunoId,
        cursoId: body.data.cursoId,
        nota: body.data.nota,
        comentario: body.data.comentario || null,
      },
    });

    registrarLog({
      nivel: "INFO",
      categoria: "FEEDBACK",
      acao: "FEEDBACK_CURSO",
      usuarioId: alunoId,
      papel: "ALUNO",
      entidade: "FeedbackCurso",
      entidadeId: feedback.id,
      detalhes: { cursoId: body.data.cursoId, nota: body.data.nota },
    });

    return NextResponse.json({ ok: true, feedback });
  } catch (err) {
    return handleApiError(err);
  }
}

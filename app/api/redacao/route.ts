import { NextResponse } from "next/server";
import {
  requireApiAuth,
  handleApiError,
  respostaProibida,
  alunoMatriculadoNaAula,
} from "@/lib/api-helpers";
import {
  registrarEntregaRedacao,
  lancarNotasRedacao,
  aprovarEntregaRedacao,
} from "@/lib/services/academico";
import { prisma } from "@/lib/prisma";
import {
  registrarEntregaSchema,
  lancarNotasSchema,
  aprovarEntregaSchema,
  validar,
} from "@/lib/validacao";

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
  const { session, error } = await requireApiAuth(["ADMIN", "PROFESSOR"]);
  if (error) return error;

  try {
    const bruto = (await request.json().catch(() => null)) as {
      acao?: string;
    } | null;
    if (!bruto?.acao) {
      return NextResponse.json({ erro: "Ação inválida" }, { status: 400 });
    }
    const papel = session!.user.papel;
    const quem = { usuarioId: session!.user.id, papel };

    switch (bruto.acao) {
      // 1) Admin registra a quantidade entregue na aula
      case "registrar": {
        if (papel !== "ADMIN") {
          return respostaProibida("Somente o admin registra a quantidade entregue");
        }
        const body = validar(registrarEntregaSchema, bruto);
        if (body.erro !== null) {
          return NextResponse.json({ erro: body.erro }, { status: 400 });
        }
        const matriculado = await alunoMatriculadoNaAula(
          body.data.alunoId,
          body.data.aulaId
        );
        if (!matriculado) {
          return NextResponse.json(
            { erro: "Aluno não está matriculado na turma desta aula" },
            { status: 400 }
          );
        }
        return NextResponse.json(
          await registrarEntregaRedacao({ ...body.data, ...quem })
        );
      }

      // 2) Admin ou professor lança notas professora/Sofia
      case "notas": {
        if (papel !== "ADMIN" && papel !== "PROFESSOR") {
          return respostaProibida("Somente admin ou professor lança notas");
        }
        const body = validar(lancarNotasSchema, bruto);
        if (body.erro !== null) {
          return NextResponse.json({ erro: body.erro }, { status: 400 });
        }
        if (papel === "PROFESSOR") {
          const entrega = await prisma.entregaRedacao.findUnique({
            where: { id: body.data.entregaId },
            include: {
              aula: {
                include: {
                  modulo: {
                    include: {
                      turma: {
                        include: {
                          professores: { where: { professorId: session!.user.id } },
                        },
                      },
                    },
                  },
                },
              },
            },
          });
          if (
            !entrega ||
            entrega.aula.modulo.turma.professores.length === 0
          ) {
            return respostaProibida("Entrega fora das suas turmas");
          }
        }
        return NextResponse.json(
          await lancarNotasRedacao({
            entregaId: body.data.entregaId,
            correcoes: body.data.correcoes,
            ...quem,
          })
        );
      }

      // 3) Admin aprova com feedback — libera a visão do aluno
      case "aprovar": {
        if (papel !== "ADMIN") return respostaProibida();
        const body = validar(aprovarEntregaSchema, bruto);
        if (body.erro !== null) {
          return NextResponse.json({ erro: body.erro }, { status: 400 });
        }
        return NextResponse.json(
          await aprovarEntregaRedacao(
            body.data.entregaId,
            session!.user.id,
            papel,
            body.data.feedback || undefined
          )
        );
      }

      default:
        return NextResponse.json({ erro: "Ação inválida" }, { status: 400 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError, respostaProibida } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/logging/sheets";
import {
  premiarAlunoSchema,
  removerPremiacaoSchema,
  validar,
} from "@/lib/validacao";

/** Premiações manuais — SOMENTE o admin concede e remove. */
export async function POST(request: Request) {
  const { session, error } = await requireApiAuth(["ADMIN"]);
  if (error) return error;

  try {
    const bruto = (await request.json().catch(() => null)) as {
      acao?: string;
    } | null;
    if (!bruto?.acao) {
      return NextResponse.json({ erro: "Ação inválida" }, { status: 400 });
    }

    switch (bruto.acao) {
      case "premiar": {
        const body = validar(premiarAlunoSchema, bruto);
        if (body.erro !== null) {
          return NextResponse.json({ erro: body.erro }, { status: 400 });
        }
        const aluno = await prisma.aluno.findUnique({
          where: { id: body.data.alunoId },
          select: { id: true },
        });
        if (!aluno) {
          return NextResponse.json({ erro: "Aluno não encontrado" }, { status: 404 });
        }
        const premiacao = await prisma.premiacao.create({
          data: {
            alunoId: body.data.alunoId,
            titulo: body.data.titulo,
            descricao: body.data.descricao || null,
            icone: body.data.icone || "🏅",
            criadoPorId: session!.user.id,
          },
        });
        registrarLog({
          nivel: "INFO",
          categoria: "PREMIACAO",
          acao: "PREMIACAO_CONCEDIDA",
          usuarioId: session!.user.id,
          papel: session!.user.papel,
          entidade: "Premiacao",
          entidadeId: premiacao.id,
          detalhes: { alunoId: body.data.alunoId, titulo: body.data.titulo },
        });
        return NextResponse.json(premiacao);
      }

      case "remover": {
        const body = validar(removerPremiacaoSchema, bruto);
        if (body.erro !== null) {
          return NextResponse.json({ erro: body.erro }, { status: 400 });
        }
        await prisma.premiacao.delete({ where: { id: body.data.premiacaoId } });
        return NextResponse.json({ ok: true });
      }

      default:
        return respostaProibida("Ação inválida");
    }
  } catch (err) {
    return handleApiError(err);
  }
}

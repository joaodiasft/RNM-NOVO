export const runtime = "edge";

import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import {
  lancarEntregaRedacao,
  aprovarEntregaRedacao,
} from "@/lib/services/academico";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { error } = await requireApiAuth(["ADMIN", "PROFESSOR", "ALUNO"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const entregas = await prisma.entregaRedacao.findMany({
    where: status ? { status } : undefined,
    include: {
      aluno: true,
      aula: { include: { modulo: { include: { turma: true } } } },
      correcoes: true,
    },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(entregas);
}

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth(["ADMIN", "PROFESSOR", "ALUNO"]);
  if (error) return error;

  try {
    const body = await request.json();
    const alunoId =
      session!.user.papel === "ALUNO" ? session!.user.id : body.alunoId;
    const entrega = await lancarEntregaRedacao({
      aulaId: body.aulaId,
      alunoId,
      quantidadeEntregue: body.quantidadeEntregue,
      correcoes: body.correcoes,
      usuarioId: session!.user.id,
      papel: session!.user.papel,
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
    const { entregaId } = await request.json();
    const entrega = await aprovarEntregaRedacao(
      entregaId,
      session!.user.id,
      session!.user.papel
    );
    return NextResponse.json(entrega);
  } catch (err) {
    return handleApiError(err);
  }
}

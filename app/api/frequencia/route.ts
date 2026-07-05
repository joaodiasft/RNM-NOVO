export const runtime = "edge";

import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import { lancarFrequencia } from "@/lib/services/academico";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth(["ADMIN", "PROFESSOR"]);
  if (error) return error;

  try {
    const body = await request.json();
    const freq = await lancarFrequencia({
      aulaId: body.aulaId,
      alunoId: body.alunoId,
      status: body.status,
      reposicaoData: body.reposicaoData,
      reposicaoTurmaId: body.reposicaoTurmaId,
      usuarioId: session!.user.id,
      papel: session!.user.papel,
    });
    return NextResponse.json(freq);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(request: Request) {
  const { error } = await requireApiAuth(["ADMIN", "PROFESSOR", "ALUNO", "RESPONSAVEL"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const turmaId = searchParams.get("turmaId");
  const alunoId = searchParams.get("alunoId");

  const where: Record<string, unknown> = {};
  if (alunoId) where.alunoId = alunoId;
  if (turmaId) {
    where.aula = { modulo: { turmaId } };
  }

  const frequencias = await prisma.frequencia.findMany({
    where,
    include: { aula: true, aluno: true },
  });
  return NextResponse.json(frequencias);
}

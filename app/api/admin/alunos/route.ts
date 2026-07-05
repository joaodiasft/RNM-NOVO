export const runtime = "edge";

import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import { criarAluno, criarResponsavel, criarMatricula } from "@/lib/services/usuarios";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/crypto";

export async function GET() {
  const { error } = await requireApiAuth(["ADMIN"]);
  if (error) return error;

  const alunos = await prisma.aluno.findMany({
    include: {
      matriculas: { include: { turma: { include: { curso: true } } } },
      responsaveis: { include: { responsavel: true } },
    },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(alunos);
}

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth(["ADMIN"]);
  if (error) return error;

  try {
    const body = await request.json();
    const aluno = await criarAluno({
      nome: body.nome,
      senha: body.senha,
      dataNascimento: body.dataNascimento,
      usuarioId: session!.user.id,
      papel: session!.user.papel,
    });

    let responsavelInfo = null;
    if (body.responsavel?.nome) {
      responsavelInfo = await criarResponsavel({
        nome: body.responsavel.nome,
        telefone: body.responsavel.telefone,
        alunoId: aluno.id,
        parentesco: body.responsavel.parentesco,
        usuarioId: session!.user.id,
        papel: session!.user.papel,
      });
    }

    if (body.turmaId && body.planoId) {
      await criarMatricula({
        alunoId: aluno.id,
        turmaId: body.turmaId,
        planoId: body.planoId,
        usuarioId: session!.user.id,
        papel: session!.user.papel,
      });
    }

    return NextResponse.json({
      aluno,
      senhaResponsavel: responsavelInfo?.senhaGerada,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  const { error } = await requireApiAuth(["ADMIN"]);
  if (error) return error;

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.nome) data.nome = body.nome;
  if (body.ativo !== undefined) data.ativo = body.ativo;
  if (body.senha) data.senhaHash = await hashSenha(body.senha);
  if (body.fotoUrl) data.fotoUrl = body.fotoUrl;

  const aluno = await prisma.aluno.update({
    where: { id: body.id },
    data,
  });
  return NextResponse.json(aluno);
}

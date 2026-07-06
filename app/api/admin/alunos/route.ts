import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import { criarAluno, criarResponsavel, criarMatricula } from "@/lib/services/usuarios";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/crypto";
import { novoAlunoSchema, alunoPatchSchema, validar } from "@/lib/validacao";

export async function GET() {
  const { error } = await requireApiAuth(["ADMIN"]);
  if (error) return error;

  const alunos = await prisma.aluno.findMany({
    include: {
      matriculas: { include: { turma: { include: { curso: true } } } },
      responsaveis: { include: { responsavel: true } },
    },
    orderBy: { nome: "asc" },
    take: 1000,
  });
  return NextResponse.json(alunos);
}

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth(["ADMIN"]);
  if (error) return error;

  try {
    const bruto = await request.json().catch(() => null);
    const body = validar(novoAlunoSchema, bruto);
    if (body.erro !== null) {
      return NextResponse.json({ erro: body.erro }, { status: 400 });
    }
    const dados = body.data;

    const aluno = await criarAluno({
      nome: dados.nome,
      senha: dados.senha,
      dataNascimento: dados.dataNascimento,
      usuarioId: session!.user.id,
      papel: session!.user.papel,
    });

    let responsavelInfo = null;
    if (dados.responsavel?.nome) {
      responsavelInfo = await criarResponsavel({
        nome: dados.responsavel.nome,
        telefone: dados.responsavel.telefone || undefined,
        alunoId: aluno.id,
        parentesco: dados.responsavel.parentesco || undefined,
        usuarioId: session!.user.id,
        papel: session!.user.papel,
      });
    }

    if (dados.turmaId && dados.planoId) {
      await criarMatricula({
        alunoId: aluno.id,
        turmaId: dados.turmaId,
        planoId: dados.planoId,
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

  try {
    const bruto = await request.json().catch(() => null);
    const body = validar(alunoPatchSchema, bruto);
    if (body.erro !== null) {
      return NextResponse.json({ erro: body.erro }, { status: 400 });
    }
    const dados = body.data;

    const data: Record<string, unknown> = {};
    if (dados.nome) data.nome = dados.nome;
    if (dados.ativo !== undefined) data.ativo = dados.ativo;
    if (dados.senha) data.senhaHash = await hashSenha(dados.senha);
    if (dados.fotoUrl) data.fotoUrl = dados.fotoUrl;

    const aluno = await prisma.aluno.update({
      where: { id: dados.id },
      data,
    });
    return NextResponse.json(aluno);
  } catch (err) {
    return handleApiError(err);
  }
}

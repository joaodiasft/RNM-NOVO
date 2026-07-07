import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import {
  criarAluno,
  criarResponsavel,
  criarMatricula,
  vincularResponsavelExistente,
} from "@/lib/services/usuarios";
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
    const quem = { usuarioId: session!.user.id, papel: session!.user.papel };

    const aluno = await criarAluno({
      nome: dados.nome,
      senha: dados.senha || undefined,
      dataNascimento: dados.dataNascimento,
      telefone: dados.telefone,
      email: dados.email || undefined,
      whatsapp: dados.whatsapp || undefined,
      instagram: dados.instagram || undefined,
      escola: dados.escola,
      serie: dados.serie,
      cpf: dados.cpf || undefined,
      rg: dados.rg || undefined,
      endereco: dados.endereco || undefined,
      ...quem,
    });

    // Responsável: novo cadastro (com acesso) ou vínculo com um existente
    let senhaResponsavel: string | undefined;
    let responsavelNome: string | undefined;
    if (dados.responsavel) {
      if (dados.responsavel.modo === "novo") {
        const r = await criarResponsavel({
          nome: dados.responsavel.nome,
          telefone: dados.responsavel.telefone,
          alunoId: aluno.id,
          parentesco: dados.responsavel.parentesco || undefined,
          senha: dados.responsavel.senha || undefined,
          ...quem,
        });
        senhaResponsavel = r.senhaGerada;
        responsavelNome = r.responsavel.nome;
      } else {
        const r = await vincularResponsavelExistente({
          responsavelId: dados.responsavel.responsavelId,
          alunoId: aluno.id,
          parentesco: dados.responsavel.parentesco || undefined,
          ...quem,
        });
        responsavelNome = r.nome;
      }
    }

    // Matrícula no curso 1 (obrigatória) e curso 2 (opcional)
    await criarMatricula({
      alunoId: aluno.id,
      turmaId: dados.turmaId,
      planoId: dados.planoId,
      ...quem,
    });
    if (dados.turma2Id) {
      await criarMatricula({
        alunoId: aluno.id,
        turmaId: dados.turma2Id,
        planoId: dados.plano2Id || dados.planoId,
        ...quem,
      });
    }

    return NextResponse.json({
      aluno,
      responsavelNome,
      senhaResponsavel,
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

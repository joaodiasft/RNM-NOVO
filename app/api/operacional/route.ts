export const runtime = "edge";

import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import {
  confirmarPagamento,
  atualizarPagamentosAtrasados,
  cadastrarAcessoExterno,
  criarAviso,
  solicitarRematricula,
  responderRematricula,
} from "@/lib/services/operacional";
import { prisma } from "@/lib/prisma";
import { descriptografar } from "@/lib/crypto";

export async function GET(request: Request) {
  const { session, error } = await requireApiAuth([
    "ADMIN",
    "ALUNO",
    "RESPONSAVEL",
  ]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");

  if (tipo === "pagamentos") {
    await atualizarPagamentosAtrasados();
    const pagamentos = await prisma.pagamento.findMany({
      include: {
        matriculaCurso: {
          include: { aluno: true, turma: { include: { curso: true } } },
        },
      },
      orderBy: { competencia: "desc" },
    });
    return NextResponse.json(pagamentos);
  }

  if (tipo === "acessos") {
    let alunoId = searchParams.get("alunoId");
    if (session!.user.papel === "ALUNO") alunoId = session!.user.id;
    if (session!.user.papel === "RESPONSAVEL") {
      alunoId = session!.user.alunoSelecionadoId || alunoId;
    }
    const acessos = await prisma.acessoExterno.findMany({
      where: alunoId ? { alunoId } : undefined,
    });
    return NextResponse.json(
      acessos.map((a) => ({
        ...a,
        senha: descriptografar(a.senha),
      }))
    );
  }

  if (tipo === "avisos") {
    const avisos = await prisma.aviso.findMany({
      orderBy: { criadoEm: "desc" },
    });
    return NextResponse.json(avisos);
  }

  if (tipo === "rematriculas") {
    const solicitacoes = await prisma.solicitacaoRematricula.findMany({
      include: { aluno: true },
      orderBy: { dataSolicitacao: "desc" },
    });
    return NextResponse.json(solicitacoes);
  }

  return NextResponse.json({ erro: "tipo inválido" }, { status: 400 });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth([
    "ADMIN",
    "ALUNO",
    "RESPONSAVEL",
  ]);
  if (error) return error;

  try {
    const body = await request.json();

    switch (body.acao) {
      case "confirmar_pagamento":
        if (session!.user.papel !== "ADMIN") {
          return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
        }
        return NextResponse.json(
          await confirmarPagamento({
            pagamentoId: body.pagamentoId,
            formaPagamento: body.formaPagamento,
            usuarioId: session!.user.id,
            papel: session!.user.papel,
            observacao: body.observacao,
          })
        );

      case "cadastrar_acesso":
        if (session!.user.papel !== "ADMIN") {
          return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
        }
        return NextResponse.json(
          await cadastrarAcessoExterno({
            ...body,
            usuarioId: session!.user.id,
            papel: session!.user.papel,
          })
        );

      case "criar_aviso":
        if (session!.user.papel !== "ADMIN") {
          return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
        }
        return NextResponse.json(
          await criarAviso({ ...body, criadoPorId: session!.user.id })
        );

      case "solicitar_rematricula":
        return NextResponse.json(
          await solicitarRematricula({
            alunoId: body.alunoId || session!.user.id,
            turmaId: body.turmaId,
            planoId: body.planoId,
            usuarioId: session!.user.id,
            papel: session!.user.papel,
          })
        );

      case "responder_rematricula":
        if (session!.user.papel !== "ADMIN") {
          return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
        }
        return NextResponse.json(
          await responderRematricula({
            solicitacaoId: body.solicitacaoId,
            status: body.status,
            respondidoPorId: session!.user.id,
            observacao: body.observacao,
          })
        );

      default:
        return NextResponse.json({ erro: "Ação inválida" }, { status: 400 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}

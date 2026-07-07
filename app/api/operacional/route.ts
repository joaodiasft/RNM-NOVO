import { NextResponse } from "next/server";
import {
  requireApiAuth,
  handleApiError,
  respostaProibida,
  alunoDoResponsavel,
  alunoPertenceAoResponsavel,
} from "@/lib/api-helpers";
import {
  confirmarPagamento,
  atualizarPagamentosAtrasados,
  gerarPagamentosCompetencia,
  cadastrarAcessoExterno,
  criarAviso,
  solicitarRematricula,
  responderRematricula,
} from "@/lib/services/operacional";
import { prisma } from "@/lib/prisma";
import { descriptografar } from "@/lib/crypto";
import {
  confirmarPagamentoSchema,
  acessoExternoSchema,
  avisoSchema,
  responderRematriculaSchema,
  criarMatriculaSchema,
  gerarCobrancasSchema,
  rematriculaCompletaSchema,
  validar,
} from "@/lib/validacao";
import { criarMatricula } from "@/lib/services/usuarios";

export async function GET(request: Request) {
  const { session, error } = await requireApiAuth([
    "ADMIN",
    "ALUNO",
    "RESPONSAVEL",
  ]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const papel = session!.user.papel;

  // Resolve o aluno permitido para ALUNO/RESPONSAVEL — sempre no banco
  async function alunoPermitido(): Promise<string | null> {
    if (papel === "ALUNO") return session!.user.id;
    if (papel === "RESPONSAVEL") {
      return alunoDoResponsavel(
        session!.user.id,
        searchParams.get("alunoId") || session!.user.alunoSelecionadoId
      );
    }
    return null; // ADMIN
  }

  if (tipo === "pagamentos") {
    await atualizarPagamentosAtrasados();
    const alunoId = await alunoPermitido();
    if (papel !== "ADMIN" && !alunoId) return NextResponse.json([]);
    const pagamentos = await prisma.pagamento.findMany({
      where: alunoId ? { matriculaCurso: { alunoId } } : undefined,
      include: {
        matriculaCurso: {
          include: {
            aluno: { select: { id: true, nome: true, codigo: true } },
            turma: { include: { curso: true } },
          },
        },
      },
      orderBy: { competencia: "desc" },
      take: 500,
    });
    return NextResponse.json(pagamentos);
  }

  if (tipo === "acessos") {
    let alunoId: string | null;
    if (papel === "ADMIN") {
      alunoId = searchParams.get("alunoId");
    } else {
      alunoId = await alunoPermitido();
      if (!alunoId) return NextResponse.json([]);
    }
    const acessos = await prisma.acessoExterno.findMany({
      where: alunoId ? { alunoId } : undefined,
      take: 500,
    });
    return NextResponse.json(
      acessos.map((a) => ({
        ...a,
        senha: descriptografar(a.senha),
      }))
    );
  }

  if (tipo === "avisos") {
    // Mural filtrado por papel (curso/turma/aluno)
    if (papel === "ADMIN") {
      const avisos = await prisma.aviso.findMany({
        orderBy: { criadoEm: "desc" },
        take: 100,
      });
      return NextResponse.json(avisos);
    }
    const alunoId = await alunoPermitido();
    if (!alunoId) return NextResponse.json([]);
    const matriculas = await prisma.matriculaCurso.findMany({
      where: { alunoId, status: "ATIVA" },
      select: { turmaId: true, turma: { select: { cursoId: true } } },
    });
    const avisos = await prisma.aviso.findMany({
      where: {
        OR: [
          { publicoAlvo: "TODOS" },
          { publicoAlvo: "ALUNO", alunoId },
          { publicoAlvo: "TURMA", turmaId: { in: matriculas.map((m) => m.turmaId) } },
          {
            publicoAlvo: "CURSO",
            cursoId: { in: matriculas.map((m) => m.turma.cursoId) },
          },
        ],
      },
      orderBy: { criadoEm: "desc" },
      take: 100,
    });
    return NextResponse.json(avisos);
  }

  if (tipo === "rematriculas") {
    const alunoId = await alunoPermitido();
    if (papel !== "ADMIN" && !alunoId) return NextResponse.json([]);
    const solicitacoes = await prisma.solicitacaoRematricula.findMany({
      where: alunoId ? { alunoId } : undefined,
      include: { aluno: { select: { id: true, nome: true, codigo: true } } },
      orderBy: { dataSolicitacao: "desc" },
      take: 500,
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
    const bruto = (await request.json().catch(() => null)) as {
      acao?: string;
    } | null;
    if (!bruto?.acao) {
      return NextResponse.json({ erro: "Ação inválida" }, { status: 400 });
    }
    const papel = session!.user.papel;

    switch (bruto.acao) {
      case "confirmar_pagamento": {
        if (papel !== "ADMIN") return respostaProibida();
        const body = validar(confirmarPagamentoSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });
        return NextResponse.json(
          await confirmarPagamento({
            pagamentoId: body.data.pagamentoId,
            formaPagamento: body.data.formaPagamento,
            usuarioId: session!.user.id,
            papel,
            observacao: body.data.observacao || undefined,
          })
        );
      }

      case "cadastrar_acesso": {
        if (papel !== "ADMIN") return respostaProibida();
        const body = validar(acessoExternoSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });
        return NextResponse.json(
          await cadastrarAcessoExterno({
            ...body.data,
            usuarioId: session!.user.id,
            papel,
          })
        );
      }

      case "criar_aviso": {
        if (papel !== "ADMIN") return respostaProibida();
        const body = validar(avisoSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });
        return NextResponse.json(
          await criarAviso({
            titulo: body.data.titulo,
            mensagem: body.data.mensagem,
            publicoAlvo: body.data.publicoAlvo,
            cursoId: body.data.cursoId || undefined,
            turmaId: body.data.turmaId || undefined,
            alunoId: body.data.alunoId || undefined,
            criadoPorId: session!.user.id,
          })
        );
      }

      // Matrícula direta feita pelo admin (após cadastrar o aluno)
      case "criar_matricula": {
        if (papel !== "ADMIN") return respostaProibida();
        const body = validar(criarMatriculaSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });
        const quem = { usuarioId: session!.user.id, papel };
        const m1 = await criarMatricula({
          alunoId: body.data.alunoId,
          turmaId: body.data.turmaId,
          planoId: body.data.planoId,
          valor: body.data.valor,
          ...quem,
        });
        let m2 = null;
        if (body.data.turma2Id) {
          m2 = await criarMatricula({
            alunoId: body.data.alunoId,
            turmaId: body.data.turma2Id,
            planoId: body.data.plano2Id || body.data.planoId,
            valor: body.data.valor2,
            ...quem,
          });
        }
        return NextResponse.json({ matriculas: [m1, m2].filter(Boolean) });
      }

      case "gerar_cobrancas": {
        if (papel !== "ADMIN") return respostaProibida();
        const body = validar(gerarCobrancasSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });
        return NextResponse.json(
          await gerarPagamentosCompetencia(body.data.competencia)
        );
      }

      case "solicitar_rematricula": {
        const body = validar(rematriculaCompletaSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });

        // Escopo: aluno só solicita para si; responsável só para filho vinculado
        let alunoId: string;
        if (papel === "ALUNO") {
          alunoId = session!.user.id;
        } else if (papel === "RESPONSAVEL") {
          const alvo = body.data.alunoId || session!.user.alunoSelecionadoId;
          if (!alvo || !(await alunoPertenceAoResponsavel(session!.user.id, alvo))) {
            return respostaProibida("Este aluno não está vinculado a você");
          }
          alunoId = alvo;
        } else {
          return respostaProibida("Admin cria matrícula direto em Matrículas");
        }

        // Bloqueio: só uma solicitação pendente por vez
        const pendente = await prisma.solicitacaoRematricula.findFirst({
          where: { alunoId, status: "PENDENTE" },
        });
        if (pendente) {
          return NextResponse.json(
            { erro: "Você já tem uma solicitação aguardando análise do admin" },
            { status: 409 }
          );
        }

        // Atualiza os dados confirmados no cadastro do aluno
        await prisma.aluno.update({
          where: { id: alunoId },
          data: {
            nome: body.data.nome,
            telefone: body.data.telefone,
            whatsapp: body.data.whatsapp || null,
            instagram: body.data.instagram || null,
          },
        });

        return NextResponse.json(
          await solicitarRematricula({
            alunoId,
            turmaId: body.data.turmaId,
            planoId: body.data.planoId,
            usuarioId: session!.user.id,
            papel,
            dados: {
              nome: body.data.nome,
              telefone: body.data.telefone,
              whatsapp: body.data.whatsapp || null,
              instagram: body.data.instagram || null,
              formaPagamento: body.data.formaPagamento,
              turma2Id: body.data.turma2Id || null,
              responsavelNome: body.data.responsavelNome || null,
              responsavelTelefone: body.data.responsavelTelefone || null,
            },
          })
        );
      }

      case "remover_acesso": {
        if (papel !== "ADMIN") return respostaProibida();
        const id = typeof bruto === "object" && bruto !== null
          ? (bruto as Record<string, unknown>).acessoId
          : null;
        if (typeof id !== "string" || id.length < 10) {
          return NextResponse.json({ erro: "Acesso inválido" }, { status: 400 });
        }
        await prisma.acessoExterno.delete({ where: { id } });
        return NextResponse.json({ ok: true });
      }

      case "responder_rematricula": {
        if (papel !== "ADMIN") return respostaProibida();
        const body = validar(responderRematriculaSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });
        return NextResponse.json(
          await responderRematricula({
            solicitacaoId: body.data.solicitacaoId,
            status: body.data.status,
            respondidoPorId: session!.user.id,
            observacao: body.data.observacao,
          })
        );
      }

      default:
        return NextResponse.json({ erro: "Ação inválida" }, { status: 400 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}

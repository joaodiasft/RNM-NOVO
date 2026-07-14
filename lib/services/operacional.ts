import { prisma } from "@/lib/prisma";
import { criptografar } from "@/lib/crypto";
import { registrarLog } from "@/lib/logging/sheets";
import { calcularRepasse } from "@/lib/repasse";
import type { PapelUsuario, StatusPagamento } from "@prisma/client";

export async function confirmarPagamento(data: {
  pagamentoId: string;
  formaPagamento: string;
  usuarioId: string;
  papel: PapelUsuario;
  observacao?: string;
}) {
  const existente = await prisma.pagamento.findUniqueOrThrow({
    where: { id: data.pagamentoId },
    include: {
      matriculaCurso: { include: { turma: { include: { curso: true } } } },
    },
  });

  const valor = Number(existente.valor);
  const repasse = calcularRepasse(
    valor,
    existente.matriculaCurso.turma.curso.nome
  );

  const pagamento = await prisma.pagamento.update({
    where: { id: data.pagamentoId },
    data: {
      status: "CONFIRMADO",
      formaPagamento: data.formaPagamento,
      dataPagamento: new Date(),
      confirmadoPorId: data.usuarioId,
      observacao: data.observacao,
      valorEscola: repasse.valorEscola,
      valorProfessor: repasse.valorProfessor,
      percentualEscola: repasse.percentualEscola,
      percentualProfessor: repasse.percentualProfessor,
    },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "FINANCEIRO",
    acao: "PAGAMENTO_CONFIRMADO",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "Pagamento",
    entidadeId: pagamento.id,
  });

  return pagamento;
}

/** Gera cobrança pendente do mês para matrículas ativas que ainda não têm. */
export async function gerarPagamentosCompetencia(competencia?: string) {
  const comp = competencia || new Date().toISOString().slice(0, 7);
  const matriculas = await prisma.matriculaCurso.findMany({
    where: { status: "ATIVA" },
    include: {
      pagamentos: { where: { competencia: comp } },
      turma: { include: { curso: true } },
      plano: true,
    },
  });

  let criados = 0;
  for (const m of matriculas) {
    if (m.pagamentos.length > 0) continue;
    const cursoPlano = await prisma.cursoPlano.findFirst({
      where: { cursoId: m.turma.cursoId, planoId: m.planoId },
    });
    if (!cursoPlano) continue;
    await prisma.pagamento.create({
      data: {
        matriculaCursoId: m.id,
        competencia: comp,
        valor: cursoPlano.valor,
        status: "PENDENTE",
      },
    });
    criados++;
  }
  return { criados, competencia: comp, totalMatriculas: matriculas.length };
}

/**
 * Marca pendentes de competências anteriores como ATRASADO.
 * Não usa updateMany: o adapter Neon HTTP (Cloudflare Workers) não
 * suporta transações — updateMany falha com "Transactions are not supported in HTTP mode".
 */
export async function atualizarPagamentosAtrasados() {
  const competenciaAtual = new Date().toISOString().slice(0, 7);
  const pendentes = await prisma.pagamento.findMany({
    where: {
      status: "PENDENTE",
      competencia: { lt: competenciaAtual },
    },
    select: { id: true },
  });
  if (pendentes.length === 0) return 0;

  await Promise.all(
    pendentes.map((p) =>
      prisma.pagamento.update({
        where: { id: p.id },
        data: { status: "ATRASADO" as StatusPagamento },
      })
    )
  );
  return pendentes.length;
}

export async function cadastrarAcessoExterno(data: {
  alunoId: string;
  plataforma: string;
  urlAcesso: string;
  email: string;
  senha: string;
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const acesso = await prisma.acessoExterno.create({
    data: {
      alunoId: data.alunoId,
      plataforma: data.plataforma,
      urlAcesso: data.urlAcesso,
      email: data.email,
      senha: criptografar(data.senha),
    },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "ACESSO_EXTERNO",
    acao: "ACESSO_CADASTRADO",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "AcessoExterno",
    entidadeId: acesso.id,
  });

  return acesso;
}

export async function criarAviso(data: {
  titulo: string;
  mensagem: string;
  publicoAlvo: "TODOS" | "CURSO" | "TURMA" | "ALUNO";
  cursoId?: string;
  turmaId?: string;
  alunoId?: string;
  criadoPorId: string;
}) {
  const aviso = await prisma.aviso.create({ data });

  registrarLog({
    nivel: "INFO",
    categoria: "AVISO",
    acao: "AVISO_CRIADO",
    usuarioId: data.criadoPorId,
    papel: "ADMIN",
    entidade: "Aviso",
    entidadeId: aviso.id,
  });

  return aviso;
}

export async function solicitarRematricula(data: {
  alunoId: string;
  turmaId: string;
  planoId: string;
  usuarioId: string;
  papel: PapelUsuario;
  dados?: Record<string, unknown>; // confirmação de dados do formulário
}) {
  const turma = await prisma.turma.findUnique({ where: { id: data.turmaId } });
  if (!turma || !turma.ativa) throw new Error("Turma indisponível");

  const plano = await prisma.plano.findUnique({ where: { id: data.planoId } });
  if (!plano || !plano.ativo) throw new Error("Plano indisponível");

  const pendente = await prisma.solicitacaoRematricula.findFirst({
    where: { alunoId: data.alunoId, turmaId: data.turmaId, status: "PENDENTE" },
  });
  if (pendente) {
    throw new Error("Já existe uma solicitação pendente para esta turma");
  }

  const solicitacao = await prisma.solicitacaoRematricula.create({
    data: {
      alunoId: data.alunoId,
      turmaId: data.turmaId,
      planoId: data.planoId,
      dados: data.dados ? JSON.parse(JSON.stringify(data.dados)) : undefined,
    },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "REMATRICULA",
    acao: "REMATRICULA_SOLICITADA",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "SolicitacaoRematricula",
    entidadeId: solicitacao.id,
  });

  return solicitacao;
}

export async function responderRematricula(data: {
  solicitacaoId: string;
  status: "APROVADA" | "RECUSADA";
  respondidoPorId: string;
  observacao?: string;
}) {
  const solicitacao = await prisma.solicitacaoRematricula.update({
    where: { id: data.solicitacaoId },
    data: {
      status: data.status,
      respondidoPorId: data.respondidoPorId,
      observacao: data.observacao,
    },
    include: { aluno: true },
  });

  if (data.status === "APROVADA") {
    const { criarMatricula } = await import("@/lib/services/usuarios");
    await criarMatricula({
      alunoId: solicitacao.alunoId,
      turmaId: solicitacao.turmaId,
      planoId: solicitacao.planoId,
      usuarioId: data.respondidoPorId,
      papel: "ADMIN",
    });
  }

  registrarLog({
    nivel: "INFO",
    categoria: "REMATRICULA",
    acao: `REMATRICULA_${data.status}`,
    usuarioId: data.respondidoPorId,
    papel: "ADMIN",
    entidade: "SolicitacaoRematricula",
    entidadeId: solicitacao.id,
  });

  return solicitacao;
}

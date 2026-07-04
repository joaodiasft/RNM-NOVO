import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/logging/sheets";
import { proximaDataDiaSemana } from "@/lib/utils";
import type { PapelUsuario } from "@prisma/client";

export async function gerarModuloParaTurma(
  turmaId: string,
  numero: number,
  mesReferencia: Date,
  usuarioId: string,
  papel: PapelUsuario
) {
  const turma = await prisma.turma.findUniqueOrThrow({ where: { id: turmaId } });

  const modulo = await prisma.modulo.create({
    data: { turmaId, numero, mesReferencia },
  });

  for (let i = 0; i < 4; i++) {
    await prisma.aula.create({
      data: {
        moduloId: modulo.id,
        data: proximaDataDiaSemana(turma.diaSemana, mesReferencia, i),
        numero: i + 1,
      },
    });
  }

  registrarLog({
    nivel: "INFO",
    categoria: "ACADEMICO",
    acao: "MODULO_GERADO",
    usuarioId,
    papel,
    entidade: "Modulo",
    entidadeId: modulo.id,
    detalhes: { turmaId, numero },
  });

  return modulo;
}

export async function lancarFrequencia(data: {
  aulaId: string;
  alunoId: string;
  status: string;
  reposicaoData?: string;
  reposicaoTurmaId?: string;
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const freq = await prisma.frequencia.upsert({
    where: { aulaId_alunoId: { aulaId: data.aulaId, alunoId: data.alunoId } },
    update: {
      status: data.status,
      reposicaoData: data.reposicaoData ? new Date(data.reposicaoData) : null,
      reposicaoTurmaId: data.reposicaoTurmaId,
    },
    create: {
      aulaId: data.aulaId,
      alunoId: data.alunoId,
      status: data.status,
      reposicaoData: data.reposicaoData ? new Date(data.reposicaoData) : null,
      reposicaoTurmaId: data.reposicaoTurmaId,
    },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "FREQUENCIA",
    acao: "FREQUENCIA_LANCADA",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "Frequencia",
    entidadeId: freq.id,
    detalhes: { status: data.status },
  });

  return freq;
}

export async function lancarEntregaRedacao(data: {
  aulaId: string;
  alunoId: string;
  quantidadeEntregue: number;
  correcoes?: { numero: number; nota?: number; comentario?: string }[];
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const entrega = await prisma.entregaRedacao.upsert({
    where: { aulaId_alunoId: { aulaId: data.aulaId, alunoId: data.alunoId } },
    update: {
      quantidadeEntregue: data.quantidadeEntregue,
      status: "AGUARDANDO_APROVACAO",
    },
    create: {
      aulaId: data.aulaId,
      alunoId: data.alunoId,
      quantidadeEntregue: data.quantidadeEntregue,
    },
  });

  if (data.correcoes?.length) {
    await prisma.correcaoRedacao.deleteMany({ where: { entregaId: entrega.id } });
    for (const c of data.correcoes) {
      await prisma.correcaoRedacao.create({
        data: {
          entregaId: entrega.id,
          numero: c.numero,
          nota: c.nota,
          comentario: c.comentario,
        },
      });
    }
  }

  registrarLog({
    nivel: "INFO",
    categoria: "REDACAO",
    acao: "ENTREGA_LANCADA",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "EntregaRedacao",
    entidadeId: entrega.id,
  });

  return entrega;
}

export async function aprovarEntregaRedacao(
  entregaId: string,
  usuarioId: string,
  papel: PapelUsuario
) {
  const entrega = await prisma.entregaRedacao.update({
    where: { id: entregaId },
    data: { status: "APROVADA" },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "REDACAO",
    acao: "ENTREGA_APROVADA",
    usuarioId,
    papel,
    entidade: "EntregaRedacao",
    entidadeId: entregaId,
  });

  return entrega;
}

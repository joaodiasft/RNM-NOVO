import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/logging/sheets";
import { proximaDataDiaSemana } from "@/lib/utils";
import { hashSenha } from "@/lib/crypto";
import type { NomeCurso, PapelUsuario } from "@prisma/client";

export async function criarTurma(data: {
  nome: string;
  cursoNome: NomeCurso;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  capacidade?: number;
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const curso = await prisma.curso.findUnique({ where: { nome: data.cursoNome } });
  if (!curso) throw new Error("Curso não encontrado");

  const turma = await prisma.turma.create({
    data: {
      nome: data.nome,
      cursoId: curso.id,
      diaSemana: data.diaSemana,
      horaInicio: data.horaInicio,
      horaFim: data.horaFim,
      capacidade: data.capacidade || 30,
    },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "ACADEMICO",
    acao: "TURMA_CRIADA",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "Turma",
    entidadeId: turma.id,
    detalhes: { nome: data.nome, curso: data.cursoNome },
  });

  return turma;
}

export async function criarProfessor(data: {
  nome: string;
  email: string;
  senha?: string;
  turmaId?: string;
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const email = data.email.toLowerCase().trim();
  const existente = await prisma.professor.findUnique({ where: { email } });
  if (existente) throw new Error("Já existe um professor com este e-mail");

  const professor = await prisma.professor.create({
    data: {
      nome: data.nome,
      email,
      senhaHash: await hashSenha(data.senha || "Prof@2026"),
    },
  });

  if (data.turmaId) {
    await prisma.turmaProfessor.create({
      data: { turmaId: data.turmaId, professorId: professor.id },
    });
  }

  registrarLog({
    nivel: "INFO",
    categoria: "ACADEMICO",
    acao: "PROFESSOR_CRIADO",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "Professor",
    entidadeId: professor.id,
    detalhes: { email },
  });

  return professor;
}

export async function gerarProximoModulo(data: {
  turmaId: string;
  mesReferencia?: string; // "YYYY-MM"
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const ultimo = await prisma.modulo.findFirst({
    where: { turmaId: data.turmaId },
    orderBy: { numero: "desc" },
  });
  const numero = (ultimo?.numero ?? 0) + 1;

  let mes: Date;
  if (data.mesReferencia) {
    const [ano, mesNum] = data.mesReferencia.split("-").map(Number);
    mes = new Date(ano, (mesNum || 1) - 1, 1, 12);
  } else {
    const hoje = new Date();
    mes = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 12);
  }

  const duplicado = await prisma.modulo.findFirst({
    where: {
      turmaId: data.turmaId,
      mesReferencia: {
        gte: new Date(mes.getFullYear(), mes.getMonth(), 1),
        lt: new Date(mes.getFullYear(), mes.getMonth() + 1, 1),
      },
    },
  });
  if (duplicado) {
    throw new Error("Já existe um módulo para este mês nesta turma");
  }

  return gerarModuloParaTurma(data.turmaId, numero, mes, data.usuarioId, data.papel);
}

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
  papel: PapelUsuario,
  correcoes?: { numero: number; nota?: number; comentario?: string }[]
) {
  // O admin pode registrar/ajustar as notas no momento da aprovação
  if (correcoes?.length) {
    await prisma.correcaoRedacao.deleteMany({ where: { entregaId } });
    await prisma.correcaoRedacao.createMany({
      data: correcoes.map((c) => ({
        entregaId,
        numero: c.numero,
        nota: c.nota,
        comentario: c.comentario,
      })),
    });
  }

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

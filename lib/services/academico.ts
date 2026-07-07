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

/**
 * Fluxo de redação:
 * 1. ADMIN registra a quantidade entregue (status AGUARDANDO_NOTAS)
 * 2. ALUNO (ou admin) lança as notas: professora + Sofia + competências ENEM
 *    (status AGUARDANDO_APROVACAO)
 * 3. ADMIN aprova com feedback (status APROVADA) — só então o aluno vê o
 *    desempenho consolidado
 */

export async function registrarEntregaRedacao(data: {
  aulaId: string;
  alunoId: string;
  quantidadeEntregue: number;
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const entrega = await prisma.entregaRedacao.upsert({
    where: { aulaId_alunoId: { aulaId: data.aulaId, alunoId: data.alunoId } },
    update: {
      quantidadeEntregue: data.quantidadeEntregue,
      status: "AGUARDANDO_NOTAS",
    },
    create: {
      aulaId: data.aulaId,
      alunoId: data.alunoId,
      quantidadeEntregue: data.quantidadeEntregue,
      status: "AGUARDANDO_NOTAS",
    },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "REDACAO",
    acao: "ENTREGA_REGISTRADA",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "EntregaRedacao",
    entidadeId: entrega.id,
    detalhes: { quantidade: data.quantidadeEntregue },
  });

  return entrega;
}

export interface NotaRedacao {
  numero: number;
  nota?: number | null; // professora
  notaSofia?: number | null;
  competencias?: number[] | null; // 5 competências estilo ENEM (0-200)
}

export async function lancarNotasRedacao(data: {
  entregaId: string;
  correcoes: NotaRedacao[];
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const entrega = await prisma.entregaRedacao.findUnique({
    where: { id: data.entregaId },
  });
  if (!entrega) throw new Error("Entrega não encontrada");
  if (entrega.status === "APROVADA") {
    throw new Error("Entrega já aprovada — peça ao admin para reabrir");
  }
  if (entrega.quantidadeEntregue === 0) {
    throw new Error("Nenhuma redação registrada nesta aula");
  }

  for (const c of data.correcoes) {
    if (c.numero > entrega.quantidadeEntregue) {
      throw new Error(`Só foram registradas ${entrega.quantidadeEntregue} redação(ões)`);
    }
    // preserva o feedback do admin já existente
    const existente = await prisma.correcaoRedacao.findFirst({
      where: { entregaId: entrega.id, numero: c.numero },
    });
    const valores = {
      nota: c.nota ?? null,
      notaSofia: c.notaSofia ?? null,
      competencias: c.competencias ? JSON.stringify(c.competencias) : null,
    };
    if (existente) {
      await prisma.correcaoRedacao.update({
        where: { id: existente.id },
        data: valores,
      });
    } else {
      await prisma.correcaoRedacao.create({
        data: { entregaId: entrega.id, numero: c.numero, ...valores },
      });
    }
  }

  const atualizada = await prisma.entregaRedacao.update({
    where: { id: entrega.id },
    data: { status: "AGUARDANDO_APROVACAO" },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "REDACAO",
    acao: "NOTAS_LANCADAS",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "EntregaRedacao",
    entidadeId: entrega.id,
  });

  return atualizada;
}

export async function aprovarEntregaRedacao(
  entregaId: string,
  usuarioId: string,
  papel: PapelUsuario,
  feedback?: string
) {
  const entrega = await prisma.entregaRedacao.update({
    where: { id: entregaId },
    data: { status: "APROVADA" },
  });

  // Feedback final do admin fica na 1ª correção (cria se não existir)
  if (feedback) {
    const primeira = await prisma.correcaoRedacao.findFirst({
      where: { entregaId, numero: 1 },
    });
    if (primeira) {
      await prisma.correcaoRedacao.update({
        where: { id: primeira.id },
        data: { feedback },
      });
    } else {
      await prisma.correcaoRedacao.create({
        data: { entregaId, numero: 1, feedback },
      });
    }
  }

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

/** Admin define o tema e o material (PDF) de uma aula. */
export async function atualizarAula(data: {
  aulaId: string;
  conteudo?: string;
  materialUrl?: string;
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const aula = await prisma.aula.update({
    where: { id: data.aulaId },
    data: {
      conteudo: data.conteudo ?? undefined,
      materialUrl: data.materialUrl === "" ? null : data.materialUrl ?? undefined,
    },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "ACADEMICO",
    acao: "AULA_ATUALIZADA",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "Aula",
    entidadeId: aula.id,
  });

  return aula;
}

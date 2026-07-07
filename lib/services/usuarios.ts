import { prisma } from "@/lib/prisma";
import { hashSenha, gerarSenhaResponsavel } from "@/lib/crypto";
import { gerarCodigoAluno } from "@/lib/utils";
import { registrarLog } from "@/lib/logging/sheets";
import type { PapelUsuario } from "@prisma/client";

export async function criarAluno(data: {
  nome: string;
  senha?: string;
  dataNascimento?: string;
  telefone?: string;
  email?: string;
  whatsapp?: string;
  instagram?: string;
  escola?: string;
  serie?: string;
  cpf?: string;
  rg?: string;
  endereco?: string;
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const ano = new Date().getFullYear();
  const codigo = await gerarCodigoAluno(ano);
  const senhaHash = await hashSenha(data.senha || "Aluno@2026");

  const aluno = await prisma.aluno.create({
    data: {
      codigo,
      nome: data.nome,
      senhaHash,
      dataNascimento: data.dataNascimento
        ? new Date(data.dataNascimento)
        : undefined,
      telefone: data.telefone || null,
      email: data.email?.toLowerCase() || null,
      whatsapp: data.whatsapp || null,
      instagram: data.instagram || null,
      escola: data.escola || null,
      serie: data.serie || null,
      cpf: data.cpf || null,
      rg: data.rg || null,
      endereco: data.endereco || null,
    },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "USUARIO",
    acao: "ALUNO_CRIADO",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "Aluno",
    entidadeId: aluno.id,
    detalhes: { codigo },
  });

  return aluno;
}

/** Vincula um responsável já cadastrado a outro aluno (irmãos). */
export async function vincularResponsavelExistente(data: {
  responsavelId: string;
  alunoId: string;
  parentesco?: string;
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const responsavel = await prisma.responsavel.findUnique({
    where: { id: data.responsavelId },
  });
  if (!responsavel) throw new Error("Responsável não encontrado");

  const jaVinculado = await prisma.alunoResponsavel.findFirst({
    where: { responsavelId: data.responsavelId, alunoId: data.alunoId },
  });
  if (jaVinculado) throw new Error("Responsável já vinculado a este aluno");

  await prisma.alunoResponsavel.create({
    data: {
      alunoId: data.alunoId,
      responsavelId: data.responsavelId,
      parentesco: data.parentesco || null,
    },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "USUARIO",
    acao: "RESPONSAVEL_VINCULADO",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "Responsavel",
    entidadeId: data.responsavelId,
    detalhes: { alunoId: data.alunoId },
  });

  return responsavel;
}

export async function criarResponsavel(data: {
  nome: string;
  telefone?: string;
  alunoId: string;
  parentesco?: string;
  senha?: string; // senha definida pelo admin (opcional)
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const senhaBase = data.senha || gerarSenhaResponsavel(data.nome, data.telefone);
  let senhaFinal = senhaBase;

  const vinculos = await prisma.alunoResponsavel.findMany({
    where: { alunoId: data.alunoId },
    include: { responsavel: true },
  });

  for (const v of vinculos) {
    const { verificarSenha } = await import("@/lib/crypto");
    if (await verificarSenha(senhaBase, v.responsavel.senhaHash)) {
      senhaFinal = gerarSenhaResponsavel(data.nome, data.telefone, true);
      break;
    }
  }

  const responsavel = await prisma.responsavel.create({
    data: {
      nome: data.nome,
      telefone: data.telefone,
      senhaHash: await hashSenha(senhaFinal),
      filhos: {
        create: {
          alunoId: data.alunoId,
          parentesco: data.parentesco,
        },
      },
    },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "USUARIO",
    acao: "RESPONSAVEL_CRIADO",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "Responsavel",
    entidadeId: responsavel.id,
  });

  return { responsavel, senhaGerada: senhaFinal };
}

export async function criarMatricula(data: {
  alunoId: string;
  turmaId: string;
  planoId: string;
  valor?: number;
  usuarioId: string;
  papel: PapelUsuario;
}) {
  const matriculasAtivas = await prisma.matriculaCurso.count({
    where: { alunoId: data.alunoId, status: "ATIVA" },
  });
  if (matriculasAtivas >= 2) {
    throw new Error("Aluno já está matriculado em 2 cursos");
  }

  const turma = await prisma.turma.findUniqueOrThrow({
    where: { id: data.turmaId },
    include: { matriculas: { where: { status: "ATIVA" } } },
  });

  if (turma.matriculas.length >= turma.capacidade) {
    throw new Error("Turma sem vagas");
  }

  const matriculaExistente = await prisma.matriculaCurso.findFirst({
    where: {
      alunoId: data.alunoId,
      status: "ATIVA",
      turma: { cursoId: turma.cursoId },
    },
  });
  if (matriculaExistente) {
    throw new Error("Aluno já matriculado neste curso");
  }

  const cursoPlano = await prisma.cursoPlano.findFirst({
    where: { cursoId: turma.cursoId, planoId: data.planoId },
  });
  if (!cursoPlano) throw new Error("Plano não disponível para este curso");

  const matricula = await prisma.matriculaCurso.create({
    data: {
      alunoId: data.alunoId,
      turmaId: data.turmaId,
      planoId: data.planoId,
    },
  });

  const competencia = new Date().toISOString().slice(0, 7);
  const valorFinal = data.valor ?? Number(cursoPlano.valor);
  await prisma.pagamento.create({
    data: {
      matriculaCursoId: matricula.id,
      competencia,
      valor: valorFinal,
      status: "PENDENTE",
    },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "MATRICULA",
    acao: "MATRICULA_CRIADA",
    usuarioId: data.usuarioId,
    papel: data.papel,
    entidade: "MatriculaCurso",
    entidadeId: matricula.id,
  });

  return matricula;
}

/**
 * Cria o primeiro aluno de teste + responsável + matrícula (turma Redação R1).
 * Uso: npx tsx scripts/criar-aluno-inicial.ts
 */
import { PrismaClient } from "@prisma/client";
import { hashSenha, gerarSenhaResponsavel } from "../lib/crypto";

const prisma = new PrismaClient();

const ALUNO = {
  nome: "João Victor Dias",
  dataNascimento: "2010-03-15",
  senha: "Aluno@2026",
};

const RESPONSAVEL = {
  nome: "Maria Dias",
  telefone: "41999887766",
  parentesco: "Mãe",
};

async function gerarCodigoAluno(ano: number): Promise<string> {
  const seq = await prisma.sequenciaCodigo.upsert({
    where: { id: "aluno" },
    create: { id: "aluno", ano, valor: 1 },
    update: {},
  });

  let valor = seq.valor;
  if (seq.ano !== ano) {
    await prisma.sequenciaCodigo.update({
      where: { id: "aluno" },
      data: { ano, valor: 1 },
    });
    valor = 1;
  } else {
    await prisma.sequenciaCodigo.update({
      where: { id: "aluno" },
      data: { valor: { increment: 1 } },
    });
    valor = seq.valor + 1;
  }

  return `RNM${ano}-${String(valor).padStart(4, "0")}`;
}

async function main() {
  const existente = await prisma.aluno.findFirst({
    where: { nome: ALUNO.nome },
    include: { responsaveis: { include: { responsavel: true } } },
  });

  if (existente) {
    const resp = existente.responsaveis[0]?.responsavel;
    console.log("ℹ️  Aluno já existe no banco:");
    console.log(JSON.stringify({
      codigo: existente.codigo,
      aluno: existente.nome,
      senhaAluno: ALUNO.senha,
      responsavel: resp?.nome,
      loginResponsavel: existente.codigo,
      senhaResponsavel: resp ? gerarSenhaResponsavel(resp.nome, resp.telefone) : "(ver cadastro)",
    }, null, 2));
    return;
  }

  const turma = await prisma.turma.findFirst({
    where: { nome: "R1" },
    include: { curso: true },
  });
  if (!turma) throw new Error("Turma R1 não encontrada — rode o seed antes.");

  const plano = await prisma.plano.findUnique({ where: { nome: "Mensal" } });
  if (!plano) throw new Error("Plano Mensal não encontrado — rode o seed antes.");

  const cursoPlano = await prisma.cursoPlano.findFirst({
    where: { cursoId: turma.cursoId, planoId: plano.id },
  });
  if (!cursoPlano) throw new Error("CursoPlano não encontrado.");

  const ano = new Date().getFullYear();
  const codigo = await gerarCodigoAluno(ano);
  const senhaResp = gerarSenhaResponsavel(RESPONSAVEL.nome, RESPONSAVEL.telefone);

  const aluno = await prisma.aluno.create({
    data: {
      codigo,
      nome: ALUNO.nome,
      senhaHash: await hashSenha(ALUNO.senha),
      dataNascimento: new Date(ALUNO.dataNascimento),
    },
  });

  await prisma.responsavel.create({
    data: {
      nome: RESPONSAVEL.nome,
      telefone: RESPONSAVEL.telefone,
      senhaHash: await hashSenha(senhaResp),
      filhos: {
        create: {
          alunoId: aluno.id,
          parentesco: RESPONSAVEL.parentesco,
        },
      },
    },
  });

  const matricula = await prisma.matriculaCurso.create({
    data: {
      alunoId: aluno.id,
      turmaId: turma.id,
      planoId: plano.id,
    },
  });

  const competencia = new Date().toISOString().slice(0, 7);
  await prisma.pagamento.create({
    data: {
      matriculaCursoId: matricula.id,
      competencia,
      valor: cursoPlano.valor,
      status: "PENDENTE",
    },
  });

  console.log("✅ Aluno e responsável criados com sucesso!\n");
  console.log(JSON.stringify({
    url: "https://redacao-nota-mil.jmdias2901.workers.dev/login",
    aluno: {
      perfil: "ALUNO",
      nome: ALUNO.nome,
      matricula: codigo,
      senha: ALUNO.senha,
      turma: "R1 — Redação",
      plano: "Mensal",
    },
    responsavel: {
      perfil: "RESPONSAVEL",
      nome: RESPONSAVEL.nome,
      login: codigo,
      senha: senhaResp,
      parentesco: RESPONSAVEL.parentesco,
      telefone: RESPONSAVEL.telefone,
    },
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * Cria segundo aluno vinculado ao mesmo responsável (Maria Dias),
 * matriculado em 2 cursos (Exatas + Matemática).
 * Uso: npx tsx scripts/criar-segundo-aluno.ts
 */
import { PrismaClient } from "@prisma/client";
import { hashSenha, gerarSenhaResponsavel } from "../lib/crypto";

const prisma = new PrismaClient();

const ALUNO = {
  nome: "Ana Clara Dias",
  dataNascimento: "2012-08-20",
  senha: "Aluno@2026",
  telefone: "41988776655",
  escola: "Colégio Objetivo",
  serie: "8º ano",
  email: "anaclara.dias@email.com",
};

const RESPONSAVEL_NOME = "Maria Dias";
const TURMAS = ["Ex1", "M1"]; // Exatas + Matemática

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
    include: {
      matriculas: { include: { turma: { include: { curso: true } } } },
      responsaveis: { include: { responsavel: true } },
    },
  });

  if (existente) {
    const resp = existente.responsaveis[0]?.responsavel;
    console.log("ℹ️  Aluno já existe no banco:");
    console.log(
      JSON.stringify(
        {
          codigo: existente.codigo,
          aluno: existente.nome,
          senhaAluno: ALUNO.senha,
          cursos: existente.matriculas.map(
            (m) => `${m.turma.nome} (${m.turma.curso.nome})`
          ),
          responsavel: resp?.nome,
          loginResponsavel: existente.codigo,
          senhaResponsavel: resp
            ? gerarSenhaResponsavel(resp.nome, resp.telefone)
            : "(ver cadastro)",
        },
        null,
        2
      )
    );
    return;
  }

  const responsavel = await prisma.responsavel.findFirst({
    where: { nome: RESPONSAVEL_NOME },
    include: { filhos: { include: { aluno: true } } },
  });

  if (!responsavel) {
    throw new Error(
      `Responsável "${RESPONSAVEL_NOME}" não encontrado — rode criar-aluno-inicial.ts antes.`
    );
  }

  const plano = await prisma.plano.findUnique({ where: { nome: "Mensal" } });
  if (!plano) throw new Error("Plano Mensal não encontrado.");

  const turmas = await Promise.all(
    TURMAS.map(async (nome) => {
      const t = await prisma.turma.findFirst({
        where: { nome },
        include: { curso: true },
      });
      if (!t) throw new Error(`Turma ${nome} não encontrada.`);
      return t;
    })
  );

  const ano = new Date().getFullYear();
  const codigo = await gerarCodigoAluno(ano);

  const aluno = await prisma.aluno.create({
    data: {
      codigo,
      nome: ALUNO.nome,
      senhaHash: await hashSenha(ALUNO.senha),
      dataNascimento: new Date(ALUNO.dataNascimento),
      telefone: ALUNO.telefone,
      email: ALUNO.email,
      escola: ALUNO.escola,
      serie: ALUNO.serie,
    },
  });

  await prisma.alunoResponsavel.create({
    data: {
      alunoId: aluno.id,
      responsavelId: responsavel.id,
      parentesco: "Mãe",
    },
  });

  const competencia = new Date().toISOString().slice(0, 7);
  const matriculasCriadas: { turma: string; curso: string; valor: string }[] =
    [];

  for (const turma of turmas) {
    const cursoPlano = await prisma.cursoPlano.findFirst({
      where: { cursoId: turma.cursoId, planoId: plano.id },
    });
    if (!cursoPlano) throw new Error(`CursoPlano não encontrado para ${turma.nome}.`);

    const matricula = await prisma.matriculaCurso.create({
      data: {
        alunoId: aluno.id,
        turmaId: turma.id,
        planoId: plano.id,
      },
    });

    await prisma.pagamento.create({
      data: {
        matriculaCursoId: matricula.id,
        competencia,
        valor: cursoPlano.valor,
        status: "PENDENTE",
      },
    });

    matriculasCriadas.push({
      turma: turma.nome,
      curso: turma.curso.nome,
      valor: String(cursoPlano.valor),
    });
  }

  const irmao = responsavel.filhos[0]?.aluno;

  console.log("✅ Segundo aluno criado com sucesso!\n");
  console.log(
    JSON.stringify(
      {
        url: "https://redacao-nota-mil.jmdias2901.workers.dev/login",
        aluno: {
          perfil: "ALUNO",
          nome: ALUNO.nome,
          matricula: codigo,
          senha: ALUNO.senha,
          matriculas: matriculasCriadas,
        },
        responsavel: {
          perfil: "RESPONSAVEL",
          nome: responsavel.nome,
          login: "matricula de cada filho (RNM2026-XXXX)",
          senha: gerarSenhaResponsavel(responsavel.nome, responsavel.telefone),
          filhos: [
            irmao ? { nome: irmao.nome, matricula: irmao.codigo } : null,
            { nome: ALUNO.nome, matricula: codigo },
          ].filter(Boolean),
        },
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

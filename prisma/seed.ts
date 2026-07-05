import { PrismaClient, NomeCurso } from "@prisma/client";
import { hashSenha } from "../lib/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  const adminEmail =
    process.env.ADMIN_EMAIL || "admin@redacaonota1000.com.br";
  const adminSenha = process.env.ADMIN_SENHA_INICIAL || "Admin@2026";
  const adminNome = process.env.ADMIN_NOME || "Administrador";

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { senhaHash: await hashSenha(adminSenha) },
    create: {
      nome: adminNome,
      email: adminEmail,
      senhaHash: await hashSenha(adminSenha),
    },
  });
  console.log(`✅ Admin: ${adminEmail}`);

  const cursos = [
    { nome: NomeCurso.REDACAO, corPrimaria: "#D6336C" },
    { nome: NomeCurso.EXATAS, corPrimaria: "#2F9E44" },
    { nome: NomeCurso.MATEMATICA, corPrimaria: "#1971C2" },
  ];

  for (const c of cursos) {
    await prisma.curso.upsert({
      where: { nome: c.nome },
      update: { corPrimaria: c.corPrimaria },
      create: c,
    });
  }

  const cursoRedacao = await prisma.curso.findUniqueOrThrow({
    where: { nome: NomeCurso.REDACAO },
  });
  const cursoExatas = await prisma.curso.findUniqueOrThrow({
    where: { nome: NomeCurso.EXATAS },
  });
  const cursoMatematica = await prisma.curso.findUniqueOrThrow({
    where: { nome: NomeCurso.MATEMATICA },
  });

  const planosData = [
    { nome: "Mensal", duracaoMeses: 1, percentualDesconto: 0 },
    { nome: "Bimestral", duracaoMeses: 2, percentualDesconto: 0 },
    { nome: "Trimestral", duracaoMeses: 3, percentualDesconto: 0 },
    { nome: "Bolsa 50%", duracaoMeses: 1, percentualDesconto: 50 },
    { nome: "Bolsa 100%", duracaoMeses: 1, percentualDesconto: 100 },
  ];

  for (const p of planosData) {
    await prisma.plano.upsert({
      where: { nome: p.nome },
      update: p,
      create: p,
    });
  }

  const planoMensal = await prisma.plano.findUniqueOrThrow({
    where: { nome: "Mensal" },
  });

  const valores: Record<NomeCurso, number> = {
    REDACAO: 350,
    EXATAS: 450,
    MATEMATICA: 200,
  };

  for (const [cursoNome, valor] of Object.entries(valores)) {
    const curso = await prisma.curso.findUniqueOrThrow({
      where: { nome: cursoNome as NomeCurso },
    });
    const planos = await prisma.plano.findMany();
    for (const plano of planos) {
      const valorFinal =
        valor * plano.duracaoMeses * (1 - plano.percentualDesconto / 100);
      await prisma.cursoPlano.upsert({
        where: { cursoId_planoId: { cursoId: curso.id, planoId: plano.id } },
        update: { valor: valorFinal },
        create: { cursoId: curso.id, planoId: plano.id, valor: valorFinal },
      });
    }
  }

  const senhaProf = await hashSenha("Prof@2026");
  const professores = [
    { nome: "Martinha", email: "martinha@redacaonota1000.com.br" },
    { nome: "Bruno", email: "bruno@redacaonota1000.com.br" },
    { nome: "Adriano", email: "adriano@redacaonota1000.com.br" },
    { nome: "Marcus", email: "marcus@redacaonota1000.com.br" },
    { nome: "Michael", email: "michael@redacaonota1000.com.br" },
  ];

  for (const p of professores) {
    await prisma.professor.upsert({
      where: { email: p.email },
      update: { senhaHash: senhaProf },
      create: { ...p, senhaHash: senhaProf },
    });
  }

  const martinha = await prisma.professor.findUniqueOrThrow({
    where: { email: "martinha@redacaonota1000.com.br" },
  });
  const bruno = await prisma.professor.findUniqueOrThrow({
    where: { email: "bruno@redacaonota1000.com.br" },
  });
  const adriano = await prisma.professor.findUniqueOrThrow({
    where: { email: "adriano@redacaonota1000.com.br" },
  });
  const marcus = await prisma.professor.findUniqueOrThrow({
    where: { email: "marcus@redacaonota1000.com.br" },
  });
  const michael = await prisma.professor.findUniqueOrThrow({
    where: { email: "michael@redacaonota1000.com.br" },
  });

  const turmas = [
    { nome: "R1", cursoId: cursoRedacao.id, diaSemana: "TERCA", horaInicio: "18:00", horaFim: "19:30", prof: martinha },
    { nome: "R2", cursoId: cursoRedacao.id, diaSemana: "TERCA", horaInicio: "19:30", horaFim: "21:00", prof: martinha },
    { nome: "R3", cursoId: cursoRedacao.id, diaSemana: "SABADO", horaInicio: "07:30", horaFim: "09:00", prof: martinha },
    { nome: "R4", cursoId: cursoRedacao.id, diaSemana: "SABADO", horaInicio: "09:00", horaFim: "10:30", prof: martinha },
    { nome: "R5", cursoId: cursoRedacao.id, diaSemana: "SABADO", horaInicio: "10:30", horaFim: "12:00", prof: martinha },
    { nome: "R6", cursoId: cursoRedacao.id, diaSemana: "SABADO", horaInicio: "15:00", horaFim: "16:30", prof: martinha },
    { nome: "Ex1", cursoId: cursoExatas.id, diaSemana: "SEGUNDA", horaInicio: "19:00", horaFim: "22:00", prof: null },
    { nome: "M1", cursoId: cursoMatematica.id, diaSemana: "SABADO", horaInicio: "13:30", horaFim: "14:30", prof: michael },
  ];

  for (const t of turmas) {
    const existente = await prisma.turma.findFirst({
      where: { nome: t.nome, cursoId: t.cursoId },
    });
    const turma =
      existente ??
      (await prisma.turma.create({
        data: {
          nome: t.nome,
          cursoId: t.cursoId,
          diaSemana: t.diaSemana,
          horaInicio: t.horaInicio,
          horaFim: t.horaFim,
        },
      }));

    if (t.prof && t.nome !== "Ex1") {
      const existente = await prisma.turmaProfessor.findFirst({
        where: { turmaId: turma.id, professorId: t.prof.id, materia: null },
      });
      if (!existente) {
        await prisma.turmaProfessor.create({
          data: { turmaId: turma.id, professorId: t.prof.id },
        });
      }
    }

    if (t.nome === "Ex1") {
      const exProf = [
        { prof: bruno, materia: "Matemática", horaInicio: "19:00", horaFim: "20:00", ordem: 1 },
        { prof: adriano, materia: "Física", horaInicio: "20:00", horaFim: "21:00", ordem: 2 },
        { prof: marcus, materia: "Química", horaInicio: "21:00", horaFim: "22:00", ordem: 3 },
      ];
      for (const ep of exProf) {
        await prisma.turmaProfessor.upsert({
          where: {
            turmaId_professorId_materia: {
              turmaId: turma.id,
              professorId: ep.prof.id,
              materia: ep.materia,
            },
          },
          update: { ordem: ep.ordem, horaInicio: ep.horaInicio, horaFim: ep.horaFim },
          create: {
            turmaId: turma.id,
            professorId: ep.prof.id,
            materia: ep.materia,
            horaInicio: ep.horaInicio,
            horaFim: ep.horaFim,
            ordem: ep.ordem,
          },
        });
      }
    }

    const modExist = await prisma.modulo.findFirst({
      where: { turmaId: turma.id, numero: 1 },
    });
    if (!modExist) {
      const mesRef = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const modulo = await prisma.modulo.create({
        data: { turmaId: turma.id, numero: 1, mesReferencia: mesRef },
      });

      const { proximaDataDiaSemana } = await import("../lib/utils");
      for (let i = 0; i < 4; i++) {
        await prisma.aula.create({
          data: {
            moduloId: modulo.id,
            data: proximaDataDiaSemana(turma.diaSemana, mesRef, i),
            numero: i + 1,
          },
        });
      }
    }
  }

  await prisma.sequenciaCodigo.upsert({
    where: { id: "aluno" },
    update: {},
    create: { id: "aluno", ano: new Date().getFullYear(), valor: 0 },
  });

  console.log("✅ Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

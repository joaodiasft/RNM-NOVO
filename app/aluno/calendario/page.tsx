import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { CalendarioAlunoVisual } from "@/components/CalendarioAlunoVisual";
import { CORES_CURSO } from "@/lib/utils/index";

export default async function AlunoCalendarioPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const aluno = await prisma.aluno.findUniqueOrThrow({
    where: { id: session.user.id },
    include: {
      frequencias: true,
      matriculas: {
        where: { status: "ATIVA" },
        include: {
          turma: {
            include: {
              curso: true,
              modulos: {
                orderBy: { numero: "desc" },
                take: 1,
                include: { aulas: { orderBy: { data: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  const freqMap = new Map(aluno.frequencias.map((f) => [f.aulaId, f.status]));

  const matriculas = aluno.matriculas.map((m) => {
    const modulo = m.turma.modulos[0];
    return {
      turmaNome: m.turma.nome,
      curso: m.turma.curso.nome,
      diaSemana: m.turma.diaSemana,
      horaInicio: m.turma.horaInicio,
      horaFim: m.turma.horaFim,
      moduloNum: modulo?.numero,
      aulas: (modulo?.aulas ?? []).map((a) => ({
        id: a.id,
        numero: a.numero,
        data: a.data.toISOString(),
        conteudo: a.conteudo,
        statusFreq: freqMap.get(a.id),
        turmaNome: m.turma.nome,
        curso: m.turma.curso.nome,
        diaSemana: m.turma.diaSemana,
        horaInicio: m.turma.horaInicio,
        horaFim: m.turma.horaFim,
      })),
    };
  });

  const cor = aluno.matriculas[0]?.turma.curso
    ? CORES_CURSO[aluno.matriculas[0].turma.curso.nome]?.primaria
    : undefined;

  return (
    <DashboardShell
      titulo="Calendário"
      corAccent={cor}
      userName={aluno.nome}
      papel="ALUNO"
    >
      {matriculas.length === 0 ? (
        <Card>
          <EmptyState icone="calendar" titulo="Nenhuma matrícula ativa" />
        </Card>
      ) : matriculas.every((m) => m.aulas.length === 0) ? (
        <Card title="Agenda de aulas">
          <EmptyState
            icone="calendar"
            titulo="Nenhuma aula agendada"
            descricao="O módulo atual ainda não foi gerado pela administração."
          />
        </Card>
      ) : (
        <CalendarioAlunoVisual matriculas={matriculas} />
      )}
    </DashboardShell>
  );
}

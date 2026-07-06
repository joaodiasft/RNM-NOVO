import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState, Badge } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import { CORES_CURSO } from "@/lib/utils/index";

export default async function AlunoCalendarioPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const aluno = await prisma.aluno.findUniqueOrThrow({
    where: { id: session.user.id },
    include: {
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

  const cor = aluno.matriculas[0]?.turma.curso
    ? CORES_CURSO[aluno.matriculas[0].turma.curso.nome]?.primaria
    : undefined;

  const hoje = new Date();

  return (
    <DashboardShell
      titulo="Calendário"
      corAccent={cor}
      userName={aluno.nome}
      papel="ALUNO"
    >
      {aluno.matriculas.length === 0 ? (
        <Card>
          <EmptyState icone="calendar" titulo="Nenhuma matrícula ativa" />
        </Card>
      ) : (
        <div className="space-y-4">
          {aluno.matriculas.map((m) => (
            <Card
              key={m.id}
              title={`Turma ${m.turma.nome}`}
              descricao={`${m.turma.diaSemana} · ${m.turma.horaInicio}–${m.turma.horaFim}`}
              acao={<CursoBadge curso={m.turma.curso.nome} />}
            >
              {!m.turma.modulos[0] || m.turma.modulos[0].aulas.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhuma aula agendada para este mês ainda.
                </p>
              ) : (
                <ul className="space-y-2">
                  {m.turma.modulos[0].aulas.map((a) => {
                    const passada = new Date(a.data) < hoje;
                    return (
                      <li
                        key={a.id}
                        className={`flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm ${
                          passada ? "opacity-60" : ""
                        }`}
                      >
                        <span className="font-medium text-gray-800">
                          Aula {a.numero}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">
                            {new Date(a.data).toLocaleDateString("pt-BR")}
                          </span>
                          {passada ? (
                            <Badge tom="gray">Realizada</Badge>
                          ) : (
                            <Badge tom="green">Agendada</Badge>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";

export default async function ProfessorTurmasPage() {
  const session = await auth();
  if (!session || session.user.papel !== "PROFESSOR") redirect("/login");

  const turmas = await prisma.turma.findMany({
    where: { professores: { some: { professorId: session.user.id } } },
    include: {
      curso: true,
      matriculas: { where: { status: "ATIVA" }, include: { aluno: true } },
    },
  });

  return (
    <DashboardShell titulo="Minhas Turmas" userName={session.user.nome} papel="PROFESSOR">
      {turmas.length === 0 ? (
        <Card>
          <EmptyState icone="users" titulo="Nenhuma turma vinculada" />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {turmas.map((t) => (
            <Card
              key={t.id}
              title={`Turma ${t.nome}`}
              descricao={`${t.diaSemana} · ${t.horaInicio}–${t.horaFim}`}
              acao={<CursoBadge curso={t.curso.nome} />}
            >
              {t.matriculas.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum aluno matriculado.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {t.matriculas.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50/70 px-3 py-2"
                    >
                      <span className="font-medium text-gray-800">{m.aluno.nome}</span>
                      <span className="text-xs text-gray-400">{m.aluno.codigo}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

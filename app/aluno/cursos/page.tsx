import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { CORES_CURSO } from "@/lib/utils/index";

export default async function AlunoCursosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const aluno = await prisma.aluno.findUniqueOrThrow({
    where: { id: session.user.id },
    include: {
      matriculas: {
        where: { status: "ATIVA" },
        include: { turma: { include: { curso: true } }, plano: true },
      },
    },
  });

  const cor = aluno.matriculas[0]?.turma.curso
    ? CORES_CURSO[aluno.matriculas[0].turma.curso.nome]?.primaria
    : undefined;

  return (
    <DashboardShell
      titulo="Meus Cursos"
      corAccent={cor}
      userName={aluno.nome}
      papel="ALUNO"
    >
      {aluno.matriculas.length === 0 ? (
        <Card>
          <EmptyState
            icone="book"
            titulo="Nenhuma matrícula ativa"
            descricao="Fale com a secretaria para se matricular."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {aluno.matriculas.map((m) => {
            const info = CORES_CURSO[m.turma.curso.nome];
            return (
              <div
                key={m.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06)]"
              >
                <div
                  className="px-5 py-4 text-white"
                  style={{
                    background: `linear-gradient(120deg, ${info?.escura ?? "#333"}, ${info?.primaria ?? "#666"})`,
                  }}
                >
                  <p className="text-xs uppercase tracking-wider text-white/70">Curso</p>
                  <h3 className="font-display text-lg font-bold">
                    {info?.label ?? m.turma.curso.nome}
                  </h3>
                </div>
                <div className="space-y-1.5 px-5 py-4 text-sm text-gray-700">
                  <p>
                    <span className="text-gray-400">Turma:</span> {m.turma.nome}
                  </p>
                  <p>
                    <span className="text-gray-400">Horário:</span> {m.turma.diaSemana} ·{" "}
                    {m.turma.horaInicio}–{m.turma.horaFim}
                  </p>
                  <p>
                    <span className="text-gray-400">Plano:</span> {m.plano.nome}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

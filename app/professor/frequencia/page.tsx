import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState, AlertBanner } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import { FrequenciaSomenteLeitura } from "@/components/FrequenciaSomenteLeitura";

export default async function ProfessorFrequenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ turma?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.papel !== "PROFESSOR") redirect("/login");

  const params = await searchParams;
  const turmaId = params.turma;

  const turmas = await prisma.turma.findMany({
    where: {
      professores: { some: { professorId: session.user.id } },
      ...(turmaId ? { id: turmaId } : {}),
    },
    include: {
      curso: true,
      modulos: {
        orderBy: { numero: "desc" },
        take: 1,
        include: {
          aulas: { orderBy: { numero: "asc" }, include: { frequencias: true } },
        },
      },
      matriculas: { where: { status: "ATIVA" }, include: { aluno: true } },
    },
  });

  return (
    <DashboardShell
      titulo="Frequência das Turmas"
      userName={session.user.nome}
      papel="PROFESSOR"
    >
      <AlertBanner tipo="info">
        <strong>Somente visualização.</strong> O lançamento e a edição de frequência são
        feitos exclusivamente pela administração. Aqui você acompanha a chamada já
        registrada para cada aula.
      </AlertBanner>

      {turmas.length === 0 ? (
        <Card className="mt-4">
          <EmptyState
            icone="check-circle"
            titulo="Nenhuma turma vinculada"
            descricao="Fale com a administração para vincular você a uma turma."
          />
        </Card>
      ) : (
        <div className="mt-4 space-y-6">
          {turmas.map((t) => (
            <Card
              key={t.id}
              title={`Turma ${t.nome}`}
              acao={<CursoBadge curso={t.curso.nome} />}
            >
              {!t.modulos[0] ? (
                <p className="text-sm text-gray-500">
                  Sem módulo ativo neste mês.
                </p>
              ) : (
                t.modulos[0].aulas.map((aula) => {
                  const iniciais = Object.fromEntries(
                    aula.frequencias.map((f) => [f.alunoId, f.status])
                  );
                  return (
                    <div key={aula.id} className="mb-5 last:mb-0">
                      <p className="mb-2 text-sm font-semibold text-gray-800">
                        Aula {aula.numero} —{" "}
                        {new Date(aula.data).toLocaleDateString("pt-BR")}
                      </p>
                      <FrequenciaSomenteLeitura
                        alunos={t.matriculas.map((m) => m.aluno)}
                        frequencias={iniciais}
                      />
                    </div>
                  );
                })
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

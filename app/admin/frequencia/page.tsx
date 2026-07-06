import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import { FormFrequencia } from "@/components/forms/FormFrequencia";

export default async function FrequenciaAdminPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const turmas = await prisma.turma.findMany({
    include: {
      curso: true,
      modulos: {
        orderBy: { numero: "desc" },
        take: 1,
        include: {
          aulas: { orderBy: { numero: "asc" }, include: { frequencias: true } },
        },
      },
      matriculas: {
        where: { status: "ATIVA" },
        include: { aluno: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <DashboardShell titulo="Frequência" userName={session.user.nome} papel="ADMIN">
      {turmas.length === 0 ? (
        <Card>
          <EmptyState
            icone="check-circle"
            titulo="Nenhuma turma cadastrada"
            descricao="Crie turmas e gere módulos em Acadêmico para lançar frequência."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {turmas.map((t) => {
            const modulo = t.modulos[0];
            const alunos = t.matriculas.map((m) => m.aluno);
            return (
              <Card
                key={t.id}
                title={`Turma ${t.nome}`}
                acao={<CursoBadge curso={t.curso.nome} />}
              >
                {!modulo ? (
                  <p className="text-sm text-gray-500">
                    Sem módulo ativo. Gere o módulo do mês em <strong>Acadêmico</strong>.
                  </p>
                ) : (
                  modulo.aulas.map((aula) => {
                    const iniciais = Object.fromEntries(
                      aula.frequencias.map((f) => [f.alunoId, f.status])
                    );
                    return (
                      <div key={aula.id} className="mb-5 last:mb-0">
                        <p className="mb-2 text-sm font-semibold text-gray-800">
                          Aula {aula.numero} —{" "}
                          {new Date(aula.data).toLocaleDateString("pt-BR")}
                        </p>
                        <FormFrequencia
                          aulaId={aula.id}
                          alunos={alunos}
                          cursoRedacao={t.curso.nome === "REDACAO"}
                          iniciais={iniciais}
                        />
                      </div>
                    );
                  })
                )}
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import { CORES_CURSO } from "@/lib/utils/index";
import { FormNovaTurma } from "@/components/forms/FormNovaTurma";
import { FormNovoProfessor } from "@/components/forms/FormNovoProfessor";
import { BotaoGerarModulo } from "@/components/forms/BotaoGerarModulo";

export default async function AcademicoPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const turmas = await prisma.turma.findMany({
    include: {
      curso: true,
      professores: { include: { professor: true } },
      modulos: { orderBy: { numero: "desc" }, take: 1, include: { aulas: true } },
      _count: { select: { matriculas: { where: { status: "ATIVA" } } } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <DashboardShell titulo="Gestão Acadêmica" userName={session.user.nome} papel="ADMIN">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {turmas.length === 0 ? (
            <Card>
              <EmptyState
                icone="book"
                titulo="Nenhuma turma cadastrada"
                descricao="Crie a primeira turma no formulário ao lado."
              />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {turmas.map((t) => {
                const info = CORES_CURSO[t.curso.nome];
                const cor = info?.primaria || "#4f46e5";
                const modulo = t.modulos[0];
                return (
                  <Card key={t.id}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cor }}
                        />
                        <h3 className="font-display font-semibold text-gray-900">
                          Turma {t.nome}
                        </h3>
                      </div>
                      <CursoBadge curso={t.curso.nome} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {t.diaSemana} · {t.horaInicio}–{t.horaFim}
                    </p>
                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <p>
                        <span className="text-gray-400">Ocupação:</span>{" "}
                        {t._count.matriculas}/{t.capacidade} vagas
                      </p>
                      <p>
                        <span className="text-gray-400">Professores:</span>{" "}
                        {t.professores.map((p) => p.professor.nome).join(", ") || "—"}
                      </p>
                      <p>
                        <span className="text-gray-400">Módulo atual:</span>{" "}
                        {modulo
                          ? `nº ${modulo.numero} (${modulo.aulas.length} aulas)`
                          : "nenhum módulo gerado"}
                      </p>
                    </div>
                    <BotaoGerarModulo turmaId={t.id} />
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Nova turma" descricao="Crie uma turma para um dos cursos">
            <FormNovaTurma />
          </Card>
          <Card title="Novo professor" descricao="Login: e-mail + senha">
            <FormNovoProfessor turmas={turmas} />
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

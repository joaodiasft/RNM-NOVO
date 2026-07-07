import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import { CORES_CURSO } from "@/lib/utils/index";
import { FormNovaTurma } from "@/components/forms/FormNovaTurma";
import { FormNovoProfessor } from "@/components/forms/FormNovoProfessor";
import { FormGerarModulo } from "@/components/forms/FormGerarModulo";
import { FormTemaAula } from "@/components/forms/FormTemaAula";
import { FormPromocao } from "@/components/forms/FormPromocao";

export default async function AcademicoPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const [turmas, cursos, promocoes] = await Promise.all([
    prisma.turma.findMany({
      include: {
        curso: true,
        professores: { include: { professor: true } },
        modulos: {
          orderBy: { numero: "desc" },
          take: 1,
          include: { aulas: { orderBy: { numero: "asc" } } },
        },
        _count: { select: { matriculas: { where: { status: "ATIVA" } } } },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.curso.findMany({ orderBy: { nome: "asc" } }),
    prisma.promocao.findMany({ orderBy: { criadoEm: "desc" }, take: 10 }),
  ]);

  return (
    <DashboardShell titulo="Gestão Acadêmica" userName={session.user.nome} papel="ADMIN">
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {turmas.length === 0 ? (
            <Card>
              <EmptyState
                icone="book"
                titulo="Nenhuma turma cadastrada"
                descricao="Crie a primeira turma no formulário ao lado."
              />
            </Card>
          ) : (
            turmas.map((t) => {
              const info = CORES_CURSO[t.curso.nome];
              const modulo = t.modulos[0];
              return (
                <Card
                  key={t.id}
                  title={`Turma ${t.nome}`}
                  descricao={`${t.diaSemana} · ${t.horaInicio}–${t.horaFim} · ${t._count.matriculas}/${t.capacidade} vagas · Prof.: ${
                    t.professores.map((p) => p.professor.nome).join(", ") || "—"
                  }`}
                  acao={<CursoBadge curso={t.curso.nome} />}
                >
                  {!modulo ? (
                    <p className="text-sm text-gray-500">
                      Nenhum módulo gerado ainda para esta turma.
                    </p>
                  ) : (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-gray-800">
                        Módulo {modulo.numero} —{" "}
                        {new Date(modulo.mesReferencia).toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <div className="space-y-2.5">
                        {modulo.aulas.map((aula) => (
                          <div
                            key={aula.id}
                            className="rounded-xl border-l-4 border border-gray-100 p-3"
                            style={{ borderLeftColor: info?.primaria }}
                          >
                            <p className="mb-2 text-xs font-semibold text-gray-600">
                              Aula {aula.numero} ·{" "}
                              {new Date(aula.data).toLocaleDateString("pt-BR")}
                            </p>
                            <FormTemaAula
                              aulaId={aula.id}
                              temaInicial={aula.conteudo}
                              materialInicial={aula.materialUrl}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <FormGerarModulo turmaId={t.id} />
                </Card>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <Card title="Nova turma">
            <FormNovaTurma />
          </Card>
          <Card title="Novo professor" descricao="Login: e-mail + senha">
            <FormNovoProfessor turmas={turmas} />
          </Card>
          <Card
            title="Promoções de cursos"
            descricao="Aparecem para os alunos em Cursos, dentro do período"
          >
            <FormPromocao
              cursos={cursos}
              promocoes={promocoes.map((p) => ({
                id: p.id,
                titulo: p.titulo,
                ativo: p.ativo,
                dataInicio: p.dataInicio.toISOString(),
                dataFim: p.dataFim.toISOString(),
              }))}
            />
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

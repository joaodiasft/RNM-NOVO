import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, Badge, EmptyState } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";

const LABEL_STATUS: Record<string, { label: string; tom: "green" | "amber" | "blue" }> = {
  APROVADA: { label: "Aprovada", tom: "green" },
  AGUARDANDO_NOTAS: { label: "Aguardando notas", tom: "amber" },
  AGUARDANDO_APROVACAO: { label: "Aguardando aprovação", tom: "blue" },
};

/**
 * Visualização (somente leitura) — o lançamento de quantidades e notas
 * é feito pelo admin e pelo próprio aluno.
 */
export default async function ProfessorRedacaoPage() {
  const session = await auth();
  if (!session || session.user.papel !== "PROFESSOR") redirect("/login");

  const turmas = await prisma.turma.findMany({
    where: {
      professores: { some: { professorId: session.user.id } },
      curso: { nome: "REDACAO" },
    },
    include: {
      curso: true,
      modulos: {
        orderBy: { numero: "desc" },
        take: 1,
        include: {
          aulas: {
            orderBy: { numero: "asc" },
            include: {
              entregasRedacao: {
                include: {
                  aluno: { select: { nome: true, codigo: true } },
                  correcoes: { orderBy: { numero: "asc" } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <DashboardShell
      titulo="Redações das Turmas"
      userName={session.user.nome}
      papel="PROFESSOR"
    >
      <p className="mb-4 text-sm text-gray-600">
        Acompanhe as entregas e notas dos seus alunos. Os lançamentos são feitos
        pela secretaria e pelos próprios alunos.
      </p>
      {turmas.length === 0 ? (
        <Card>
          <EmptyState icone="pencil" titulo="Nenhuma turma de Redação" />
        </Card>
      ) : (
        <div className="space-y-6">
          {turmas.map((t) => (
            <Card
              key={t.id}
              title={`Turma ${t.nome}`}
              acao={<CursoBadge curso={t.curso.nome} />}
            >
              {!t.modulos[0] ? (
                <p className="text-sm text-gray-500">Sem módulo ativo.</p>
              ) : (
                t.modulos[0].aulas.map((aula) => (
                  <div key={aula.id} className="mb-6 last:mb-0">
                    <p className="mb-1 text-sm font-semibold text-gray-800">
                      Aula {aula.numero} —{" "}
                      {new Date(aula.data).toLocaleDateString("pt-BR")}
                    </p>
                    {aula.conteudo && (
                      <p className="mb-2 text-xs text-gray-500">
                        Tema: {aula.conteudo}
                      </p>
                    )}
                    {aula.entregasRedacao.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        Nenhuma entrega registrada nesta aula.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {aula.entregasRedacao.map((e) => {
                          const st = LABEL_STATUS[e.status] ?? {
                            label: e.status,
                            tom: "amber" as const,
                          };
                          return (
                            <li
                              key={e.id}
                              className="rounded-xl border border-gray-100 px-3.5 py-2.5 text-sm"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {e.aluno.nome}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {e.aluno.codigo} · {e.quantidadeEntregue}{" "}
                                    redação(ões)
                                  </p>
                                </div>
                                <Badge tom={st.tom}>{st.label}</Badge>
                              </div>
                              {e.correcoes.length > 0 && (
                                <div className="mt-2 space-y-1 border-t border-gray-50 pt-2 text-xs text-gray-600">
                                  {e.correcoes.map((c) => {
                                    const comps = c.competencias
                                      ? (JSON.parse(c.competencias) as number[])
                                      : null;
                                    return (
                                      <p key={c.numero}>
                                        Redação {c.numero}: Professora{" "}
                                        <strong>
                                          {c.nota != null ? Number(c.nota) : "—"}
                                        </strong>{" "}
                                        · Sofia{" "}
                                        <strong>
                                          {c.notaSofia != null
                                            ? Number(c.notaSofia)
                                            : "—"}
                                        </strong>
                                        {comps ? ` · C: ${comps.join("/")}` : ""}
                                      </p>
                                    );
                                  })}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

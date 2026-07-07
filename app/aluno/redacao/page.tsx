import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, Badge, EmptyState } from "@/components/DashboardShell";

export default async function AlunoRedacaoPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const matricula = await prisma.matriculaCurso.findFirst({
    where: {
      alunoId: session.user.id,
      status: "ATIVA",
      turma: { curso: { nome: "REDACAO" } },
    },
    include: {
      turma: {
        include: {
          modulos: {
            orderBy: { numero: "desc" },
            take: 1,
            include: {
              aulas: { orderBy: { numero: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!matricula) {
    return (
      <DashboardShell titulo="Redação" userName={session.user.nome} papel="ALUNO">
        <Card>
          <EmptyState
            icone="pencil"
            titulo="Você não está matriculado em Redação"
          />
        </Card>
      </DashboardShell>
    );
  }

  const modulo = matricula.turma.modulos[0];
  const aulas = modulo?.aulas ?? [];

  const entregas = await prisma.entregaRedacao.findMany({
    where: {
      alunoId: session.user.id,
      aulaId: { in: aulas.map((a) => a.id) },
    },
    include: { correcoes: { orderBy: { numero: "asc" } } },
  });
  const mapa = new Map(entregas.map((e) => [e.aulaId, e]));

  return (
    <DashboardShell
      titulo="Minhas Redações"
      userName={session.user.nome}
      papel="ALUNO"
    >
      {modulo && (
        <p className="mb-4 text-sm text-gray-600">
          Módulo <strong>{modulo.numero}</strong> · Turma {matricula.turma.nome}
        </p>
      )}

      {aulas.length === 0 ? (
        <Card>
          <EmptyState icone="calendar" titulo="Nenhuma aula no módulo atual" />
        </Card>
      ) : (
        <div className="space-y-4">
          {aulas.map((a) => {
            const e = mapa.get(a.id);
            const aprovada = e?.status === "APROVADA";
            return (
              <Card
                key={a.id}
                title={`Aula ${a.numero} — ${new Date(a.data).toLocaleDateString("pt-BR")}`}
                descricao={a.conteudo || "Tema a definir pela secretaria"}
                acao={
                  e ? (
                    <Badge
                      tom={
                        aprovada ? "green" : e.status === "AGUARDANDO_NOTAS" ? "amber" : "blue"
                      }
                    >
                      {aprovada
                        ? "Liberado"
                        : e.status.replace(/_/g, " ")}
                    </Badge>
                  ) : (
                    <Badge tom="gray">Sem registro</Badge>
                  )
                }
              >
                {!e && (
                  <p className="text-sm text-gray-500">
                    A secretaria ainda não registrou suas entregas nesta aula.
                  </p>
                )}
                {e && !aprovada && (
                  <p className="text-sm text-amber-800">
                    {e.quantidadeEntregue} redação(ões) registradas — aguardando
                    correção e aprovação do admin para ver notas.
                  </p>
                )}
                {e && aprovada && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      Entregues: {e.quantidadeEntregue}
                    </p>
                    {e.correcoes.map((c) => {
                      const comps = c.competencias
                        ? (JSON.parse(c.competencias) as number[])
                        : null;
                      return (
                        <div
                          key={c.numero}
                          className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-sm"
                        >
                          <p className="font-semibold text-gray-900">
                            Redação {c.numero}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                            <span>
                              Professora:{" "}
                              <strong>{c.nota != null ? String(c.nota) : "—"}</strong>
                            </span>
                            <span>
                              Sofia: <strong>{c.notaSofia != null ? String(c.notaSofia) : "—"}</strong>
                            </span>
                          </div>
                          {comps && (
                            <p className="mt-2 text-xs text-gray-600">
                              Competências: {comps.join(" · ")}
                            </p>
                          )}
                          {c.feedback && (
                            <p className="mt-2 rounded-lg bg-white p-2 text-xs text-gray-700">
                              {c.feedback}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {a.materialUrl && (
                  <a
                    href={a.materialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Baixar material da aula (PDF)
                  </a>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

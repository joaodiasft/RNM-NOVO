import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, StatCard, EmptyState } from "@/components/DashboardShell";
import {
  calcularPercentualFrequencia,
  FREQUENCIA_ALERTA_PERCENTUAL,
} from "@/lib/utils/index";

export default async function ResponsavelFrequenciaPage() {
  const session = await auth();
  if (!session || session.user.papel !== "RESPONSAVEL") redirect("/login");

  // Usa o filho selecionado ou o primeiro vinculado
  const filho = await prisma.aluno.findFirst({
    where: {
      responsaveis: { some: { responsavelId: session.user.id } },
      ...(session.user.alunoSelecionadoId ? { id: session.user.alunoSelecionadoId } : {}),
    },
    include: {
      frequencias: {
        include: { aula: { include: { modulo: { include: { turma: true } } } } },
      },
    },
  });

  const pct = filho ? calcularPercentualFrequencia(filho.frequencias) : 100;

  return (
    <DashboardShell titulo="Frequência" userName={session.user.nome} papel="RESPONSAVEL">
      {!filho ? (
        <Card>
          <EmptyState icone="users" titulo="Nenhum filho vinculado" />
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            Acompanhando: <strong>{filho.nome}</strong> ({filho.codigo})
          </p>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard
              label="Frequência geral"
              value={`${pct}%`}
              cor={pct < FREQUENCIA_ALERTA_PERCENTUAL ? "#dc2626" : "#16a34a"}
              icone="check-circle"
            />
            <StatCard
              label="Registros"
              value={filho.frequencias.length}
              icone="clipboard"
            />
          </div>
          <Card title="Histórico de presenças">
            {filho.frequencias.length === 0 ? (
              <EmptyState
                icone="calendar"
                titulo="Nenhuma frequência lançada ainda"
                descricao="Os lançamentos das aulas aparecem aqui."
              />
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {filho.frequencias
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.aula.data).getTime() - new Date(a.aula.data).getTime()
                  )
                  .map((f) => (
                    <li key={f.id} className="flex items-center justify-between py-2.5">
                      <span className="text-gray-700">
                        {new Date(f.aula.data).toLocaleDateString("pt-BR")} — Turma{" "}
                        {f.aula.modulo.turma.nome}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          f.status === "PRESENTE" ||
                          f.status.startsWith("REPOSICAO")
                            ? "text-emerald-600"
                            : f.status === "FALTA_JUSTIFICADA"
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {f.status.replace(/_/g, " ")}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </DashboardShell>
  );
}

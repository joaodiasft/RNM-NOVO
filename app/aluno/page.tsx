import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  DashboardShell,
  Card,
  StatCard,
  AlertBanner,
  Badge,
  EmptyState,
} from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import {
  calcularPercentualFrequencia,
  FREQUENCIA_ALERTA_PERCENTUAL,
  CORES_CURSO,
} from "@/lib/utils/index";

export default async function AlunoDashboard() {
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
          pagamentos: { orderBy: { competencia: "desc" }, take: 3 },
        },
      },
      frequencias: true,
    },
  });

  const pct = calcularPercentualFrequencia(aluno.frequencias);
  const curso = aluno.matriculas[0]?.turma.curso;
  const cor = curso ? CORES_CURSO[curso.nome]?.primaria : "#d6336c";

  const proximasAulas = aluno.matriculas.flatMap((m) =>
    (m.turma.modulos[0]?.aulas ?? [])
      .filter((a) => new Date(a.data) >= new Date())
      .slice(0, 2)
      .map((a) => ({ id: a.id, turma: m.turma.nome, data: a.data, numero: a.numero }))
  );

  const pagamentos = aluno.matriculas.flatMap((m) => m.pagamentos);

  return (
    <DashboardShell
      titulo={`Olá, ${aluno.nome.split(" ")[0]}!`}
      corAccent={cor}
      userName={aluno.nome}
      papel="ALUNO"
    >
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          label="Frequência"
          value={`${pct}%`}
          cor={pct < FREQUENCIA_ALERTA_PERCENTUAL ? "#dc2626" : cor}
          icone="check-circle"
        />
        <StatCard label="Matrícula" value={aluno.codigo} icone="user" />
      </div>

      {pct < FREQUENCIA_ALERTA_PERCENTUAL && (
        <div className="mb-4">
          <AlertBanner tipo="warn">
            Sua frequência está abaixo de {FREQUENCIA_ALERTA_PERCENTUAL}%. Procure a
            secretaria para agendar reposições.
          </AlertBanner>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Meus cursos">
          {aluno.matriculas.length === 0 ? (
            <EmptyState
              icone="book"
              titulo="Nenhuma matrícula ativa"
              descricao="Fale com a secretaria para se matricular em um curso."
            />
          ) : (
            <ul className="space-y-3">
              {aluno.matriculas.map((m) => {
                const info = CORES_CURSO[m.turma.curso.nome];
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-xl border-l-4 border border-gray-100 bg-gray-50/60 px-4 py-3"
                    style={{ borderLeftColor: info?.primaria }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Turma {m.turma.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {m.turma.diaSemana} · {m.turma.horaInicio}–{m.turma.horaFim}
                      </p>
                    </div>
                    <CursoBadge curso={m.turma.curso.nome} />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Próximas aulas">
          {proximasAulas.length === 0 ? (
            <EmptyState
              icone="calendar"
              titulo="Nenhuma aula agendada"
              descricao="Quando o módulo do mês for gerado, suas aulas aparecem aqui."
            />
          ) : (
            <ul className="space-y-2">
              {proximasAulas.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm"
                >
                  <span className="font-medium text-gray-800">
                    Turma {a.turma} · Aula {a.numero}
                  </span>
                  <span className="text-gray-500">
                    {new Date(a.data).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Financeiro" className="mt-4" descricao="Últimas competências">
        {pagamentos.length === 0 ? (
          <EmptyState icone="currency" titulo="Nenhum pagamento registrado" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {pagamentos.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-gray-700">{p.competencia}</span>
                <Badge
                  tom={
                    p.status === "CONFIRMADO"
                      ? "green"
                      : p.status === "ATRASADO"
                        ? "red"
                        : "amber"
                  }
                >
                  {p.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}

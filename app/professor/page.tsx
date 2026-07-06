import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  DashboardShell,
  Card,
  StatCard,
  AlertBanner,
  EmptyState,
} from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import {
  calcularPercentualFrequencia,
  FREQUENCIA_ALERTA_PERCENTUAL,
} from "@/lib/utils/index";
import Link from "next/link";

export default async function ProfessorDashboard() {
  const session = await auth();
  if (!session || session.user.papel !== "PROFESSOR") redirect("/login");

  const turmas = await prisma.turma.findMany({
    where: { professores: { some: { professorId: session.user.id } } },
    include: {
      curso: true,
      modulos: {
        orderBy: { numero: "desc" },
        take: 1,
        include: { aulas: { orderBy: { data: "asc" } } },
      },
      matriculas: {
        where: { status: "ATIVA" },
        include: { aluno: { include: { frequencias: true } } },
      },
    },
  });

  const totalAlunos = turmas.reduce((s, t) => s + t.matriculas.length, 0);
  const totalAlertas = turmas.reduce(
    (s, t) =>
      s +
      t.matriculas.filter(
        (m) =>
          calcularPercentualFrequencia(m.aluno.frequencias) <
          FREQUENCIA_ALERTA_PERCENTUAL
      ).length,
    0
  );

  return (
    <DashboardShell
      titulo={`Olá, ${session.user.nome.split(" ")[0]}!`}
      userName={session.user.nome}
      papel="PROFESSOR"
    >
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Minhas turmas" value={turmas.length} icone="users" />
        <StatCard label="Alunos" value={totalAlunos} icone="user" cor="#0d9488" />
        <StatCard
          label="Alertas de frequência"
          value={totalAlertas}
          icone="alert"
          cor={totalAlertas > 0 ? "#dc2626" : "#16a34a"}
        />
      </div>

      {turmas.length === 0 ? (
        <Card>
          <EmptyState
            icone="book"
            titulo="Nenhuma turma vinculada"
            descricao="Fale com a administração para vincular você a uma turma."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {turmas.map((t) => {
            const proximaAula = t.modulos[0]?.aulas.find(
              (a) => new Date(a.data) >= new Date()
            );
            const alertas = t.matriculas.filter((m) => {
              const pct = calcularPercentualFrequencia(m.aluno.frequencias);
              return pct < FREQUENCIA_ALERTA_PERCENTUAL;
            });
            return (
              <Card
                key={t.id}
                title={`Turma ${t.nome}`}
                acao={
                  <div className="flex items-center gap-2">
                    <CursoBadge curso={t.curso.nome} />
                    <Link
                      href={`/professor/frequencia?turma=${t.id}`}
                      className="btn-primary px-3 py-2 text-xs"
                    >
                      Lançar frequência
                    </Link>
                  </div>
                }
              >
                <p className="text-sm text-gray-500">
                  {t.diaSemana} · {t.horaInicio}–{t.horaFim} · {t.matriculas.length}{" "}
                  aluno(s)
                </p>
                {proximaAula && (
                  <p className="mt-1.5 text-sm text-gray-700">
                    Próxima aula:{" "}
                    <strong>
                      {new Date(proximaAula.data).toLocaleDateString("pt-BR")}
                    </strong>
                  </p>
                )}
                {alertas.length > 0 && (
                  <div className="mt-3">
                    <AlertBanner tipo="warn">
                      {alertas.length} aluno(s) com frequência abaixo de{" "}
                      {FREQUENCIA_ALERTA_PERCENTUAL}%:{" "}
                      {alertas.map((m) => m.aluno.nome.split(" ")[0]).join(", ")}
                    </AlertBanner>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

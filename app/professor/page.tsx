export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, StatCard, AlertBanner } from "@/components/DashboardShell";
import { calcularPercentualFrequencia, FREQUENCIA_ALERTA_PERCENTUAL } from "@/lib/utils/index";
import Link from "next/link";

export default async function ProfessorDashboard() {
  const session = await auth();
  if (!session || session.user.papel !== "PROFESSOR") redirect("/login");

  const turmas = await prisma.turma.findMany({
    where: { professores: { some: { professorId: session.user.id } } },
    include: {
      curso: true,
      modulos: { orderBy: { numero: "desc" }, take: 1, include: { aulas: { orderBy: { data: "asc" } } } },
      matriculas: { where: { status: "ATIVA" }, include: { aluno: { include: { frequencias: true } } } },
    },
  });

  return (
    <DashboardShell
      titulo="Painel do Professor"
      corAccent="#212529"
      userName={session.user.nome}
      papel="PROFESSOR"
      navItems={[
        { href: "/professor", label: "Dashboard" },
        { href: "/professor/turmas", label: "Turmas" },
        { href: "/professor/frequencia", label: "Frequência" },
        { href: "/professor/relatorios", label: "Relatórios" },
      ]}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Minhas turmas" value={turmas.length} />
        <StatCard label="Total alunos" value={turmas.reduce((s, t) => s + t.matriculas.length, 0)} />
      </div>
      <div className="space-y-4">
        {turmas.map((t) => {
          const proximaAula = t.modulos[0]?.aulas.find((a) => new Date(a.data) >= new Date());
          const alertas = t.matriculas.filter((m) => {
            const pct = calcularPercentualFrequencia(m.aluno.frequencias);
            return pct < FREQUENCIA_ALERTA_PERCENTUAL;
          });
          return (
            <Card key={t.id} title={`Turma ${t.nome}`}>
              <p className="text-sm text-gray-500 mb-2">{t.diaSemana} {t.horaInicio}–{t.horaFim}</p>
              {proximaAula && (
                <p className="text-sm">Próxima aula: {new Date(proximaAula.data).toLocaleDateString("pt-BR")}</p>
              )}
              {alertas.length > 0 && (
                <AlertBanner tipo="warn">
                  {alertas.length} aluno(s) com frequência abaixo de {FREQUENCIA_ALERTA_PERCENTUAL}%
                </AlertBanner>
              )}
              <Link href={`/professor/frequencia?turma=${t.id}`} className="text-sm text-rnm-matematica underline mt-2 inline-block">
                Lançar frequência
              </Link>
            </Card>
          );
        })}
      </div>
    </DashboardShell>
  );
}

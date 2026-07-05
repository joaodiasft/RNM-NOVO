import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, StatCard, AlertBanner } from "@/components/DashboardShell";
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
          turma: { include: { curso: true, modulos: { orderBy: { numero: "desc" }, take: 1, include: { aulas: true } } } },
          pagamentos: { orderBy: { competencia: "desc" }, take: 3 },
        },
      },
      frequencias: true,
    },
  });

  const pct = calcularPercentualFrequencia(aluno.frequencias);
  const curso = aluno.matriculas[0]?.turma.curso;
  const cor = curso ? CORES_CURSO[curso.nome]?.primaria : "#D6336C";

  return (
    <DashboardShell
      titulo="Meu Painel"
      corAccent={cor}
      userName={aluno.nome}
      papel="ALUNO"
      navItems={[
        { href: "/aluno", label: "Dashboard" },
        { href: "/aluno/cursos", label: "Cursos" },
        { href: "/aluno/calendario", label: "Calendário" },
        { href: "/aluno/acessos", label: "Acessos Externos" },
        { href: "/aluno/redacao", label: "Redação" },
        { href: "/aluno/avisos", label: "Avisos" },
        { href: "/aluno/rematricula", label: "Rematrícula" },
      ]}
    >
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <StatCard label="Frequência" value={`${pct}%`} cor={cor} />
        <StatCard label="Código" value={aluno.codigo} />
      </div>
      {pct < FREQUENCIA_ALERTA_PERCENTUAL && (
        <AlertBanner tipo="warn">
          Sua frequência está abaixo de {FREQUENCIA_ALERTA_PERCENTUAL}%. Procure recuperar presenças.
        </AlertBanner>
      )}
      <Card title="Próximas aulas" className="mt-4">
        {aluno.matriculas.flatMap((m) =>
          m.turma.modulos[0]?.aulas
            .filter((a) => new Date(a.data) >= new Date())
            .slice(0, 2)
            .map((a) => (
              <p key={a.id} className="text-sm">
                {m.turma.nome}: {new Date(a.data).toLocaleDateString("pt-BR")} — aula {a.numero}
              </p>
            ))
        )}
      </Card>
      <Card title="Financeiro" className="mt-4">
        {aluno.matriculas.flatMap((m) =>
          m.pagamentos.map((p) => (
            <p key={p.id} className="text-sm flex justify-between">
              <span>{p.competencia}</span>
              <span className={p.status === "ATRASADO" ? "text-red-600" : ""}>{p.status}</span>
            </p>
          ))
        )}
      </Card>
    </DashboardShell>
  );
}

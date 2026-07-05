export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { FormFrequencia } from "@/components/forms/FormFrequencia";

export default async function ProfessorFrequenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ turma?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.papel !== "PROFESSOR") redirect("/login");

  const params = await searchParams;
  const turmaId = params.turma;

  const turmas = await prisma.turma.findMany({
    where: {
      professores: { some: { professorId: session.user.id } },
      ...(turmaId ? { id: turmaId } : {}),
    },
    include: {
      curso: true,
      modulos: { orderBy: { numero: "desc" }, take: 1, include: { aulas: { orderBy: { numero: "asc" } } } },
      matriculas: { where: { status: "ATIVA" }, include: { aluno: true } },
    },
  });

  return (
    <DashboardShell
      titulo="Lançamento de Frequência"
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
      {turmas.map((t) => (
        <Card key={t.id} title={`${t.nome} — ${t.curso.nome}`} className="mb-4">
          {t.modulos[0]?.aulas.map((aula) => (
            <div key={aula.id} className="mb-4">
              <p className="text-sm font-medium mb-2">
                Aula {aula.numero} — {new Date(aula.data).toLocaleDateString("pt-BR")}
              </p>
              <FormFrequencia
                aulaId={aula.id}
                alunos={t.matriculas.map((m) => m.aluno)}
                cursoRedacao={t.curso.nome === "REDACAO"}
              />
            </div>
          ))}
        </Card>
      ))}
    </DashboardShell>
  );
}

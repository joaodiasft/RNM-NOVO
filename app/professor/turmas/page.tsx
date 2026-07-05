export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";

export default async function ProfessorTurmasPage() {
  const session = await auth();
  if (!session || session.user.papel !== "PROFESSOR") redirect("/login");

  const turmas = await prisma.turma.findMany({
    where: { professores: { some: { professorId: session.user.id } } },
    include: {
      curso: true,
      matriculas: { where: { status: "ATIVA" }, include: { aluno: true } },
    },
  });

  return (
    <DashboardShell
      titulo="Minhas Turmas"
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
          <ul className="text-sm space-y-1">
            {t.matriculas.map((m) => (
              <li key={m.id}>{m.aluno.nome} ({m.aluno.codigo})</li>
            ))}
          </ul>
        </Card>
      ))}
    </DashboardShell>
  );
}

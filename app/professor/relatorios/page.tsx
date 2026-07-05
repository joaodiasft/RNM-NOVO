import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import Link from "next/link";

export default async function ProfessorRelatoriosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "PROFESSOR") redirect("/login");

  const turmas = await prisma.turma.findMany({
    where: { professores: { some: { professorId: session.user.id } } },
    orderBy: { nome: "asc" },
  });

  return (
    <DashboardShell
      titulo="Relatórios"
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
      <Card title="Exportar turma">
        <ul className="space-y-2">
          {turmas.map((t) => (
            <li key={t.id}>
              <Link href={`/api/relatorios?tipo=turma&turmaId=${t.id}&formato=xlsx`} className="text-sm underline">
                Excel — {t.nome}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </DashboardShell>
  );
}

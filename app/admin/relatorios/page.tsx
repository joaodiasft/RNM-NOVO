import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { Icon } from "@/components/ui/Icons";
import Link from "next/link";

export default async function RelatoriosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const turmas = await prisma.turma.findMany({
    include: { curso: true },
    orderBy: { nome: "asc" },
  });

  return (
    <DashboardShell titulo="Relatórios" userName={session.user.nome} papel="ADMIN">
      <Card
        title="Exportar por turma"
        descricao="Planilha Excel com frequência, entregas e médias do módulo atual"
      >
        {turmas.length === 0 ? (
          <EmptyState icone="chart" titulo="Nenhuma turma para exportar" />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {turmas.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/api/relatorios?tipo=turma&turmaId=${t.id}&formato=xlsx`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <span>
                    Turma {t.nome} — {t.curso.nome}
                  </span>
                  <Icon name="download" className="h-4.5 w-4.5 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}

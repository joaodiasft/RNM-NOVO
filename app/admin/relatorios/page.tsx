import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { ADMIN_COR } from "@/lib/utils/index";
import Link from "next/link";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/academico", label: "Acadêmico" },
  { href: "/admin/matriculas", label: "Matrículas" },
  { href: "/admin/frequencia", label: "Frequência" },
  { href: "/admin/redacao", label: "Redação" },
  { href: "/admin/financeiro", label: "Financeiro" },
  { href: "/admin/acessos", label: "Acessos Externos" },
  { href: "/admin/avisos", label: "Avisos" },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default async function RelatoriosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const turmas = await prisma.turma.findMany({ orderBy: { nome: "asc" } });

  return (
    <DashboardShell titulo="Relatórios" corAccent={ADMIN_COR} userName={session.user.nome} papel="ADMIN" navItems={nav}>
      <Card title="Exportar por turma">
        <ul className="space-y-2">
          {turmas.map((t) => (
            <li key={t.id}>
              <Link
                href={`/api/relatorios?tipo=turma&turmaId=${t.id}&formato=xlsx`}
                className="text-sm text-rnm-matematica underline"
              >
                Excel — Turma {t.nome}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </DashboardShell>
  );
}

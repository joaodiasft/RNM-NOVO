export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { ADMIN_COR } from "@/lib/utils/index";
import { FormAviso } from "@/components/forms/FormAviso";

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

export default async function AvisosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const avisos = await prisma.aviso.findMany({ orderBy: { criadoEm: "desc" }, take: 20 });

  return (
    <DashboardShell titulo="Avisos" corAccent={ADMIN_COR} userName={session.user.nome} papel="ADMIN" navItems={nav}>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Novo aviso"><FormAviso /></Card>
        <Card title="Publicados">
          <ul className="space-y-2 text-sm">
            {avisos.map((a) => (
              <li key={a.id} className="border-b border-gray-50 pb-2">
                <strong>{a.titulo}</strong>
                <p className="text-gray-500">{a.publicoAlvo}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </DashboardShell>
  );
}

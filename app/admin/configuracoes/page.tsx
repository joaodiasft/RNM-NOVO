export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { ADMIN_COR } from "@/lib/utils/index";
import { FormUploadFoto } from "@/components/forms/FormUploadFoto";

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

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const logs = await prisma.logAuditoria.findMany({
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  return (
    <DashboardShell titulo="Configurações" corAccent={ADMIN_COR} userName={session.user.nome} papel="ADMIN" navItems={nav}>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Foto de perfil (Google Drive)">
          <FormUploadFoto tipo="admin" userId={session.user.id} />
        </Card>
        <Card title="Logs locais (espelho do Sheets)">
          <div className="max-h-80 overflow-y-auto text-xs space-y-1">
            {logs.map((l) => (
              <div key={l.id} className="border-b border-gray-50 pb-1">
                {l.timestamp.toISOString()} · {l.acao} · {l.entidade}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

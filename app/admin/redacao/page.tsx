import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { ADMIN_COR } from "@/lib/utils/index";
import { FormAprovarRedacao } from "@/components/forms/FormAprovarRedacao";

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

export default async function RedacaoAdminPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const entregas = await prisma.entregaRedacao.findMany({
    where: { status: "AGUARDANDO_APROVACAO" },
    include: {
      aluno: true,
      correcoes: true,
      aula: { include: { modulo: { include: { turma: true } } } },
    },
  });

  return (
    <DashboardShell titulo="Aprovação de Redações" corAccent={ADMIN_COR} userName={session.user.nome} papel="ADMIN" navItems={nav}>
      <Card title={`Pendentes (${entregas.length})`}>
        {entregas.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma entrega aguardando aprovação.</p>
        ) : (
          <FormAprovarRedacao entregas={entregas} />
        )}
      </Card>
    </DashboardShell>
  );
}

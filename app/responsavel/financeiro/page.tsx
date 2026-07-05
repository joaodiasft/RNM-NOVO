import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";

export default async function ResponsavelFinanceiroPage() {
  const session = await auth();
  if (!session || session.user.papel !== "RESPONSAVEL") redirect("/login");

  const alunoId = session.user.alunoSelecionadoId;
  const pagamentos = alunoId
    ? await prisma.pagamento.findMany({
        where: { matriculaCurso: { alunoId } },
        orderBy: { competencia: "desc" },
      })
    : [];

  return (
    <DashboardShell titulo="Financeiro" corAccent="#212529" userName={session.user.nome} papel="RESPONSAVEL" navItems={[
      { href: "/responsavel", label: "Dashboard" },
      { href: "/responsavel/financeiro", label: "Financeiro" },
    ]}>
      <Card title="Pagamentos">
        {pagamentos.map((p) => (
          <p key={p.id} className="text-sm flex justify-between">
            <span>{p.competencia}</span>
            <span>{p.status}</span>
          </p>
        ))}
      </Card>
    </DashboardShell>
  );
}

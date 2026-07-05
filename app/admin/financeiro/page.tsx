import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, AlertBanner } from "@/components/DashboardShell";
import { ADMIN_COR } from "@/lib/utils/index";
import { atualizarPagamentosAtrasados } from "@/lib/services/operacional";
import { FormConfirmarPagamento } from "@/components/forms/FormConfirmarPagamento";

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

export default async function FinanceiroPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  await atualizarPagamentosAtrasados();

  const pagamentos = await prisma.pagamento.findMany({
    include: {
      matriculaCurso: {
        include: { aluno: true, turma: { include: { curso: true } } },
      },
    },
    orderBy: [{ status: "asc" }, { competencia: "desc" }],
  });

  const atrasados = pagamentos.filter((p) => p.status === "ATRASADO");
  const pendentes = pagamentos.filter((p) => p.status === "PENDENTE");

  return (
    <DashboardShell titulo="Financeiro" corAccent={ADMIN_COR} userName={session.user.nome} papel="ADMIN" navItems={nav}>
      {atrasados.length > 0 && (
        <AlertBanner tipo="error">
          {atrasados.length} pagamento(s) atrasado(s)
        </AlertBanner>
      )}
      <div className="grid lg:grid-cols-2 gap-6 mt-4">
        <Card title="Confirmar pagamento">
          <FormConfirmarPagamento pagamentos={pendentes.concat(atrasados)} />
        </Card>
        <Card title="Histórico">
          <div className="space-y-2 max-h-96 overflow-y-auto text-sm">
            {pagamentos.slice(0, 30).map((p) => (
              <div key={p.id} className="flex justify-between border-b border-gray-50 pb-1">
                <span>{p.matriculaCurso.aluno.nome} — {p.competencia}</span>
                <span className={p.status === "CONFIRMADO" ? "text-green-600" : p.status === "ATRASADO" ? "text-red-600" : "text-amber-600"}>
                  {p.status} R$ {Number(p.valor).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

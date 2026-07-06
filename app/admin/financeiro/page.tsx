import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  DashboardShell,
  Card,
  AlertBanner,
  Badge,
  StatCard,
  EmptyState,
} from "@/components/DashboardShell";
import { atualizarPagamentosAtrasados } from "@/lib/services/operacional";
import { FormConfirmarPagamento } from "@/components/forms/FormConfirmarPagamento";

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
  const confirmados = pagamentos.filter((p) => p.status === "CONFIRMADO");
  const somaConfirmados = confirmados.reduce((s, p) => s + Number(p.valor), 0);
  const somaAtrasados = atrasados.reduce((s, p) => s + Number(p.valor), 0);

  return (
    <DashboardShell titulo="Financeiro" userName={session.user.nome} papel="ADMIN">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Recebido"
          value={`R$ ${somaConfirmados.toFixed(0)}`}
          cor="#16a34a"
          icone="currency"
        />
        <StatCard
          label="Em atraso"
          value={`R$ ${somaAtrasados.toFixed(0)}`}
          cor={somaAtrasados > 0 ? "#dc2626" : "#16a34a"}
          icone="alert"
        />
        <StatCard label="Pendentes" value={pendentes.length} icone="clipboard" cor="#b45309" />
        <StatCard label="Confirmados" value={confirmados.length} icone="check-circle" cor="#16a34a" />
      </div>

      {atrasados.length > 0 && (
        <div className="mb-4">
          <AlertBanner tipo="error">
            {atrasados.length} pagamento(s) atrasado(s) — total R${" "}
            {somaAtrasados.toFixed(2)}
          </AlertBanner>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Confirmar pagamento">
          <FormConfirmarPagamento pagamentos={pendentes.concat(atrasados)} />
        </Card>
        <Card title="Histórico" descricao="Últimos 30 lançamentos">
          {pagamentos.length === 0 ? (
            <EmptyState icone="currency" titulo="Nenhum pagamento registrado" />
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {pagamentos.slice(0, 30).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3.5 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {p.matriculaCurso.aluno.nome}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.competencia} · R$ {Number(p.valor).toFixed(2)}
                    </p>
                  </div>
                  <Badge
                    tom={
                      p.status === "CONFIRMADO"
                        ? "green"
                        : p.status === "ATRASADO"
                          ? "red"
                          : "amber"
                    }
                  >
                    {p.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

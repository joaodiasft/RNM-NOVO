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

  // Resumo por competência (últimos 4 meses com lançamentos)
  const porMes = new Map<
    string,
    { previsto: number; recebido: number; atrasado: number }
  >();
  for (const p of pagamentos) {
    const m = porMes.get(p.competencia) ?? { previsto: 0, recebido: 0, atrasado: 0 };
    const v = Number(p.valor);
    m.previsto += v;
    if (p.status === "CONFIRMADO") m.recebido += v;
    if (p.status === "ATRASADO") m.atrasado += v;
    porMes.set(p.competencia, m);
  }
  const meses = [...porMes.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 4);

  const repassePorCurso = confirmados.reduce(
    (acc, p) => {
      const curso = p.matriculaCurso.turma.curso.nome;
      if (!acc[curso]) acc[curso] = { escola: 0, professor: 0, total: 0 };
      acc[curso].total += Number(p.valor);
      acc[curso].escola += Number(p.valorEscola ?? 0);
      acc[curso].professor += Number(p.valorProfessor ?? 0);
      return acc;
    },
    {} as Record<string, { escola: number; professor: number; total: number }>
  );

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

      {meses.length > 0 && (
        <Card
          title="Resumo por mês"
          descricao="Previsto × recebido × em atraso por competência"
          className="mb-4"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {meses.map(([competencia, v]) => {
              const pct =
                v.previsto > 0 ? Math.round((v.recebido / v.previsto) * 100) : 0;
              return (
                <div
                  key={competencia}
                  className="rounded-xl border border-gray-100 p-4 text-sm"
                >
                  <p className="font-display font-semibold text-gray-900">
                    {competencia}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Recebido <strong className="text-emerald-700">R$ {v.recebido.toFixed(0)}</strong>{" "}
                    de R$ {v.previsto.toFixed(0)} ({pct}%)
                  </p>
                  {v.atrasado > 0 && (
                    <p className="text-xs font-medium text-red-600">
                      R$ {v.atrasado.toFixed(0)} em atraso
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card
        title="Repasse por curso (confirmados)"
        descricao="Exatas: 30% escola / 70% professor · Matemática: 20% / 80% · Redação: 100% escola"
        className="mb-4"
      >
        {Object.keys(repassePorCurso).length === 0 ? (
          <EmptyState icone="currency" titulo="Nenhum repasse calculado ainda" descricao="Confirme pagamentos para ver a divisão." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(repassePorCurso).map(([curso, v]) => (
              <div key={curso} className="rounded-xl border border-gray-100 p-4 text-sm">
                <p className="font-semibold text-gray-900">{curso}</p>
                <p className="mt-2 text-gray-600">
                  Total: R$ {v.total.toFixed(2)}
                </p>
                <p className="text-emerald-700">Escola: R$ {v.escola.toFixed(2)}</p>
                <p className="text-indigo-700">Professor: R$ {v.professor.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

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

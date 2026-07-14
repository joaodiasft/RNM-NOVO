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
import { CursoBadge } from "@/components/ui/CursoBadge";
import { atualizarPagamentosAtrasados } from "@/lib/services/operacional";
import { FormConfirmarPagamento } from "@/components/forms/FormConfirmarPagamento";
import { FormGerarCobrancas } from "@/components/forms/FormGerarCobrancas";
import { cursoTemRepasse } from "@/lib/repasse";

const LABEL_CURSO: Record<string, string> = {
  REDACAO: "Redação",
  EXATAS: "Exatas",
  MATEMATICA: "Matemática",
};

export default async function FinanceiroPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  // Best-effort: nunca derrubar a página se a marcação de atraso falhar
  try {
    await atualizarPagamentosAtrasados();
  } catch (err) {
    console.error("[financeiro] atualizarPagamentosAtrasados", err);
  }
  const competenciaAtual = new Date().toISOString().slice(0, 7);

  const pagamentos = await prisma.pagamento.findMany({
    include: {
      matriculaCurso: {
        include: { aluno: true, turma: { include: { curso: true } }, plano: true },
      },
    },
    orderBy: [{ status: "asc" }, { competencia: "desc" }],
  });

  const atrasados = pagamentos.filter((p) => p.status === "ATRASADO");
  const pendentes = pagamentos.filter((p) => p.status === "PENDENTE");
  const confirmados = pagamentos.filter((p) => p.status === "CONFIRMADO");
  const somaConfirmados = confirmados.reduce((s, p) => s + Number(p.valor), 0);
  const somaAtrasados = atrasados.reduce((s, p) => s + Number(p.valor), 0);
  const aConfirmar = pendentes.concat(atrasados);

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

  // Repasse só Exatas (30/70) e Matemática (20/80) — Redação não entra
  const repassePorCurso = confirmados.reduce(
    (acc, p) => {
      const curso = p.matriculaCurso.turma.curso.nome;
      if (!cursoTemRepasse(curso)) return acc;
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
      <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
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

      {pagamentos.length === 0 && (
        <div className="mb-4">
          <AlertBanner tipo="info">
            Nenhum pagamento no sistema. Matricule alunos em{" "}
            <strong>Matrículas</strong> ou clique em &quot;Gerar cobranças do mês&quot; abaixo.
          </AlertBanner>
        </div>
      )}

      {atrasados.length > 0 && (
        <div className="mb-4">
          <AlertBanner tipo="error">
            {atrasados.length} pagamento(s) atrasado(s) — total R${" "}
            {somaAtrasados.toFixed(2)}
          </AlertBanner>
        </div>
      )}

      <Card
        title="Gerar cobranças"
        descricao="Cria pagamentos pendentes para matrículas ativas sem cobrança no mês"
        className="mb-4"
      >
        <FormGerarCobrancas competenciaAtual={competenciaAtual} />
      </Card>

      {meses.length > 0 && (
        <Card
          title="Resumo por mês"
          descricao="Previsto × recebido × em atraso"
          className="mb-4"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {meses.map(([competencia, v]) => {
              const pct =
                v.previsto > 0 ? Math.round((v.recebido / v.previsto) * 100) : 0;
              return (
                <div
                  key={competencia}
                  className="rounded-xl border border-gray-100 p-3 sm:p-4 text-sm"
                >
                  <p className="font-display font-semibold text-gray-900">{competencia}</p>
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
        descricao="Somente Exatas (escola 30% / professor 70%) e Matemática (escola 20% / professor 80%). Redação não tem repasse."
        className="mb-4"
      >
        {Object.keys(repassePorCurso).length === 0 ? (
          <EmptyState
            icone="currency"
            titulo="Nenhum repasse ainda"
            descricao="Confirme pagamentos de Exatas ou Matemática para ver a divisão."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(repassePorCurso).map(([curso, v]) => (
              <div key={curso} className="rounded-xl border border-gray-100 p-3 sm:p-4 text-sm">
                <p className="font-semibold text-gray-900">
                  {LABEL_CURSO[curso] ?? curso}
                </p>
                <p className="mt-2 text-gray-600">Total: R$ {v.total.toFixed(2)}</p>
                <p className="text-emerald-700">Escola: R$ {v.escola.toFixed(2)}</p>
                <p className="text-indigo-700">Professor: R$ {v.professor.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Confirmar pagamento">
          <FormConfirmarPagamento pagamentos={aConfirmar} />
        </Card>
        <Card title="Histórico" descricao="Últimos 30 lançamentos">
          {pagamentos.length === 0 ? (
            <EmptyState icone="currency" titulo="Nenhum pagamento registrado" />
          ) : (
            <ul className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {pagamentos.slice(0, 30).map((p) => {
                const curso = p.matriculaCurso.turma.curso.nome;
                return (
                  <li
                    key={p.id}
                    className="rounded-xl border border-gray-100 px-3 py-2.5 text-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {p.matriculaCurso.aluno.nome}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.competencia} · Turma {p.matriculaCurso.turma.nome} · R${" "}
                          {Number(p.valor).toFixed(2)}
                        </p>
                        <div className="mt-1">
                          <CursoBadge curso={curso} tamanho="sm" />
                        </div>
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
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

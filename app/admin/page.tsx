import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  DashboardShell,
  Card,
  StatCard,
  AlertBanner,
  EmptyState,
  Badge,
} from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import { CORES_CURSO, calcularPercentualFrequencia } from "@/lib/utils/index";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const competenciaAtual = new Date().toISOString().slice(0, 7);

  const [
    alunosAtivos,
    pagamentosAtrasados,
    matriculasAtivas,
    turmas,
    redacoesPendentes,
    rematriculasPendentes,
    avisosRecentes,
    pagamentosMes,
    frequencias,
    professoresAtivos,
  ] = await Promise.all([
    prisma.aluno.count({ where: { ativo: true } }),
    prisma.pagamento.findMany({ where: { status: "ATRASADO" } }),
    prisma.matriculaCurso.count({ where: { status: "ATIVA" } }),
    prisma.turma.findMany({
      where: { ativa: true },
      include: {
        curso: true,
        _count: { select: { matriculas: { where: { status: "ATIVA" } } } },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.entregaRedacao.count({
      where: { status: { in: ["AGUARDANDO_APROVACAO", "AGUARDANDO_NOTAS"] } },
    }),
    prisma.solicitacaoRematricula.count({ where: { status: "PENDENTE" } }),
    prisma.aviso.findMany({
      take: 5,
      orderBy: { criadoEm: "desc" },
      include: { _count: { select: { leituras: true } } },
    }),
    prisma.pagamento.findMany({ where: { competencia: competenciaAtual } }),
    prisma.frequencia.findMany({ select: { status: true } }),
    prisma.professor.count({ where: { ativo: true } }),
  ]);

  // Aniversariantes do mês
  const alunosComNascimento = await prisma.aluno.findMany({
    where: { ativo: true, dataNascimento: { not: null } },
    select: { id: true, nome: true, codigo: true, dataNascimento: true },
  });
  const mesAtual = new Date().getMonth();
  const aniversariantes = alunosComNascimento
    .filter((a) => a.dataNascimento && new Date(a.dataNascimento).getMonth() === mesAtual)
    .sort(
      (a, b) =>
        new Date(a.dataNascimento!).getDate() - new Date(b.dataNascimento!).getDate()
    );

  const somaAtrasados = pagamentosAtrasados.reduce((s, p) => s + Number(p.valor), 0);
  const recebidoMes = pagamentosMes
    .filter((p) => p.status === "CONFIRMADO")
    .reduce((s, p) => s + Number(p.valor), 0);
  const previstoMes = pagamentosMes.reduce((s, p) => s + Number(p.valor), 0);
  const freqMedia = calcularPercentualFrequencia(frequencias);
  const vagasTotais = turmas.reduce((s, t) => s + t.capacidade, 0);
  const vagasUsadas = turmas.reduce((s, t) => s + t._count.matriculas, 0);

  const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <DashboardShell titulo="Painel Administrativo" userName={session.user.nome} papel="ADMIN">
      {/* KPIs principais */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Alunos ativos" value={alunosAtivos} icone="users" cor="#4f46e5" />
        <StatCard label="Matrículas ativas" value={matriculasAtivas} icone="clipboard" cor="#0d9488" />
        <StatCard
          label="Recebido no mês"
          value={brl(recebidoMes)}
          hint={`previsto ${brl(previstoMes)}`}
          icone="currency"
          cor="#16a34a"
        />
        <StatCard
          label="Inadimplência"
          value={brl(somaAtrasados)}
          hint={`${pagamentosAtrasados.length} pagamento(s)`}
          icone="alert"
          cor={somaAtrasados > 0 ? "#dc2626" : "#16a34a"}
        />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Frequência média"
          value={`${freqMedia}%`}
          icone="check-circle"
          cor={freqMedia < 75 ? "#dc2626" : "#16a34a"}
        />
        <StatCard
          label="Ocupação de vagas"
          value={`${vagasUsadas}/${vagasTotais}`}
          hint={vagasTotais > 0 ? `${Math.round((vagasUsadas / vagasTotais) * 100)}% ocupado` : undefined}
          icone="book"
          cor="#1971c2"
        />
        <StatCard label="Redações p/ tratar" value={redacoesPendentes} icone="pencil" cor="#d6336c" />
        <StatCard
          label="Rematrículas"
          value={rematriculasPendentes}
          hint="aguardando análise"
          icone="refresh"
          cor="#b45309"
        />
      </div>

      {/* Alertas acionáveis */}
      <div className="space-y-3">
        {pagamentosAtrasados.length > 0 && (
          <AlertBanner tipo="error">
            {pagamentosAtrasados.length} pagamento(s) atrasado(s) somando{" "}
            {brl(somaAtrasados)}.{" "}
            <Link href="/admin/financeiro" className="font-semibold underline">
              Ver inadimplência
            </Link>
          </AlertBanner>
        )}
        {redacoesPendentes > 0 && (
          <AlertBanner tipo="info">
            {redacoesPendentes} entrega(s) de redação para registrar/aprovar.{" "}
            <Link href="/admin/redacao" className="font-semibold underline">
              Tratar agora
            </Link>
          </AlertBanner>
        )}
        {rematriculasPendentes > 0 && (
          <AlertBanner tipo="warn">
            {rematriculasPendentes} solicitação(ões) de rematrícula pendente(s).{" "}
            <Link href="/admin/matriculas" className="font-semibold underline">
              Analisar
            </Link>
          </AlertBanner>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Ocupação por turma com a cor do curso */}
        <Card title="Ocupação por turma" descricao={`${turmas.length} turmas ativas · ${professoresAtivos} professores`}>
          {turmas.length === 0 ? (
            <EmptyState icone="book" titulo="Nenhuma turma ativa" />
          ) : (
            <ul className="space-y-3">
              {turmas.map((t) => {
                const info = CORES_CURSO[t.curso.nome];
                const pct = Math.min(
                  100,
                  Math.round((t._count.matriculas / t.capacidade) * 100)
                );
                return (
                  <li key={t.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-gray-800">
                        Turma {t.nome}
                        <CursoBadge curso={t.curso.nome} tamanho="sm" />
                      </span>
                      <span className="text-xs text-gray-500">
                        {t._count.matriculas}/{t.capacidade}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: info?.primaria }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card title="Avisos recentes" descricao="Com contagem de leituras">
            {avisosRecentes.length === 0 ? (
              <EmptyState icone="bell" titulo="Nenhum aviso publicado" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {avisosRecentes.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {a.titulo}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(a.criadoEm).toLocaleDateString("pt-BR")} · {a.publicoAlvo}
                      </p>
                    </div>
                    <Badge tom={a._count.leituras > 0 ? "green" : "gray"}>
                      {a._count.leituras} leitura(s)
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`Aniversariantes do mês (${aniversariantes.length})`} descricao="Uma mensagem faz diferença 🎉">
            {aniversariantes.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum aniversariante este mês.</p>
            ) : (
              <ul className="max-h-44 space-y-1.5 overflow-y-auto pr-1 text-sm">
                {aniversariantes.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span className="truncate font-medium text-gray-800">{a.nome}</span>
                    <span className="shrink-0 text-xs text-gray-500">
                      dia {new Date(a.dataNascimento!).getDate()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Atalhos rápidos">
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/admin/usuarios", label: "Cadastrar aluno" },
                { href: "/admin/matriculas", label: "Nova matrícula" },
                { href: "/admin/frequencia", label: "Lançar frequência" },
                { href: "/admin/redacao", label: "Redações" },
                { href: "/admin/financeiro", label: "Confirmar pagamento" },
                { href: "/admin/avisos", label: "Publicar aviso" },
              ].map((atalho) => (
                <Link
                  key={atalho.href + atalho.label}
                  href={atalho.href}
                  className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {atalho.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

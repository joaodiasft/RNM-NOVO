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
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const [
    alunosAtivos,
    pagamentosAtrasados,
    matriculasAtivas,
    turmasAtivas,
    redacoesPendentes,
    rematriculasPendentes,
    avisosRecentes,
  ] = await Promise.all([
    prisma.aluno.count({ where: { ativo: true } }),
    prisma.pagamento.count({ where: { status: "ATRASADO" } }),
    prisma.matriculaCurso.count({ where: { status: "ATIVA" } }),
    prisma.turma.count({ where: { ativa: true } }),
    prisma.entregaRedacao.count({ where: { status: "AGUARDANDO_APROVACAO" } }),
    prisma.solicitacaoRematricula.count({ where: { status: "PENDENTE" } }),
    prisma.aviso.findMany({ take: 5, orderBy: { criadoEm: "desc" } }),
  ]);

  return (
    <DashboardShell
      titulo="Painel Administrativo"
      userName={session.user.nome}
      papel="ADMIN"
    >
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Alunos ativos" value={alunosAtivos} icone="users" cor="#4f46e5" />
        <StatCard label="Matrículas" value={matriculasAtivas} icone="clipboard" cor="#0d9488" />
        <StatCard label="Turmas ativas" value={turmasAtivas} icone="book" cor="#1971c2" />
        <StatCard
          label="Pag. atrasados"
          value={pagamentosAtrasados}
          icone="currency"
          cor={pagamentosAtrasados > 0 ? "#dc2626" : "#16a34a"}
        />
        <StatCard
          label="Redações pendentes"
          value={redacoesPendentes}
          icone="pencil"
          cor="#d6336c"
        />
        <StatCard
          label="Rematrículas"
          value={rematriculasPendentes}
          icone="refresh"
          cor="#b45309"
          hint="aguardando análise"
        />
      </div>

      <div className="space-y-3">
        {pagamentosAtrasados > 0 && (
          <AlertBanner tipo="warn">
            {pagamentosAtrasados} pagamento(s) atrasado(s).{" "}
            <Link href="/admin/financeiro" className="font-semibold underline">
              Ver inadimplência
            </Link>
          </AlertBanner>
        )}
        {redacoesPendentes > 0 && (
          <AlertBanner tipo="info">
            {redacoesPendentes} entrega(s) de redação aguardando aprovação.{" "}
            <Link href="/admin/redacao" className="font-semibold underline">
              Aprovar agora
            </Link>
          </AlertBanner>
        )}
        {rematriculasPendentes > 0 && (
          <AlertBanner tipo="info">
            {rematriculasPendentes} solicitação(ões) de rematrícula pendente(s).{" "}
            <Link href="/admin/matriculas" className="font-semibold underline">
              Analisar
            </Link>
          </AlertBanner>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Avisos recentes" descricao="Últimas publicações para a comunidade">
          {avisosRecentes.length === 0 ? (
            <EmptyState
              icone="bell"
              titulo="Nenhum aviso publicado"
              descricao="Publique avisos em Avisos para alunos e responsáveis."
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {avisosRecentes.map((a) => (
                <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900">{a.titulo}</p>
                    <Badge tom="blue">{a.publicoAlvo}</Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{a.mensagem}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(a.criadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Atalhos rápidos" descricao="Ações mais comuns do dia a dia">
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/admin/usuarios", label: "Cadastrar aluno" },
              { href: "/admin/frequencia", label: "Lançar frequência" },
              { href: "/admin/financeiro", label: "Confirmar pagamento" },
              { href: "/admin/avisos", label: "Publicar aviso" },
              { href: "/admin/academico", label: "Gerar módulo do mês" },
              { href: "/admin/relatorios", label: "Exportar relatório" },
            ].map((atalho) => (
              <Link
                key={atalho.href + atalho.label}
                href={atalho.href}
                className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3.5 text-sm font-medium text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {atalho.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

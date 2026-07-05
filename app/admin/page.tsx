export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, StatCard, AlertBanner } from "@/components/DashboardShell";
import { ADMIN_COR } from "@/lib/utils/index";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const [alunosAtivos, pagamentosAtrasados, matriculasAtivas, avisosRecentes] =
    await Promise.all([
      prisma.aluno.count({ where: { ativo: true } }),
      prisma.pagamento.count({ where: { status: "ATRASADO" } }),
      prisma.matriculaCurso.count({ where: { status: "ATIVA" } }),
      prisma.aviso.findMany({ take: 5, orderBy: { criadoEm: "desc" } }),
    ]);

  return (
    <DashboardShell
      titulo="Painel Administrativo"
      corAccent={ADMIN_COR}
      userName={session.user.nome}
      papel="ADMIN"
      navItems={[
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
      ]}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Alunos ativos" value={alunosAtivos} />
        <StatCard label="Matrículas ativas" value={matriculasAtivas} />
        <StatCard
          label="Pagamentos atrasados"
          value={pagamentosAtrasados}
          cor="#D6336C"
        />
        <StatCard label="Turmas" value={8} />
      </div>

      {pagamentosAtrasados > 0 && (
        <AlertBanner tipo="warn" >
          {pagamentosAtrasados} pagamento(s) atrasado(s).{" "}
          <Link href="/admin/financeiro" className="underline font-medium">
            Ver inadimplência
          </Link>
        </AlertBanner>
      )}

      <Card title="Avisos recentes" className="mt-6">
        {avisosRecentes.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum aviso publicado.</p>
        ) : (
          <ul className="space-y-3">
            {avisosRecentes.map((a) => (
              <li key={a.id} className="border-b border-gray-100 pb-2">
                <p className="font-medium">{a.titulo}</p>
                <p className="text-sm text-gray-500">{a.mensagem.slice(0, 120)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { ADMIN_COR } from "@/lib/utils/index";
import { FormRematriculaAdmin } from "@/components/forms/FormRematriculaAdmin";

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

export default async function MatriculasPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const solicitacoes = await prisma.solicitacaoRematricula.findMany({
    where: { status: "PENDENTE" },
    include: { aluno: true },
    orderBy: { dataSolicitacao: "desc" },
  });

  const matriculas = await prisma.matriculaCurso.findMany({
    where: { status: "ATIVA" },
    include: { aluno: true, turma: { include: { curso: true } }, plano: true },
    take: 30,
  });

  return (
    <DashboardShell titulo="Matrículas" corAccent={ADMIN_COR} userName={session.user.nome} papel="ADMIN" navItems={nav}>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title={`Rematrículas pendentes (${solicitacoes.length})`}>
          <FormRematriculaAdmin solicitacoes={solicitacoes} />
        </Card>
        <Card title="Matrículas ativas">
          <ul className="text-sm space-y-2 max-h-96 overflow-y-auto">
            {matriculas.map((m) => (
              <li key={m.id} className="border-b border-gray-50 pb-1">
                {m.aluno.nome} — {m.turma.nome} ({m.turma.curso.nome}) — {m.plano.nome}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </DashboardShell>
  );
}

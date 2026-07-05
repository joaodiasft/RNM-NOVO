export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { ADMIN_COR } from "@/lib/utils/index";
import { FormNovoAluno } from "@/components/forms/FormNovoAluno";

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

export default async function UsuariosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const [alunos, professores, turmas, planos] = await Promise.all([
    prisma.aluno.findMany({
      include: {
        matriculas: { include: { turma: true } },
        responsaveis: { include: { responsavel: true } },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.professor.findMany({ orderBy: { nome: "asc" } }),
    prisma.turma.findMany({ include: { curso: true }, orderBy: { nome: "asc" } }),
    prisma.plano.findMany({ where: { ativo: true } }),
  ]);

  return (
    <DashboardShell
      titulo="Gestão de Usuários"
      corAccent={ADMIN_COR}
      userName={session.user.nome}
      papel="ADMIN"
      navItems={nav}
    >
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Novo aluno">
          <FormNovoAluno turmas={turmas} planos={planos} />
        </Card>
        <Card title={`Alunos (${alunos.length})`}>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alunos.map((a) => (
              <div key={a.id} className="border-b border-gray-100 pb-2">
                <p className="font-medium">{a.nome}</p>
                <p className="text-xs text-gray-500">
                  {a.codigo} · {a.matriculas.map((m) => m.turma.nome).join(", ") || "Sem turma"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title={`Professores (${professores.length})`} className="mt-6">
        <ul className="grid sm:grid-cols-2 gap-2">
          {professores.map((p) => (
            <li key={p.id} className="text-sm">
              <span className="font-medium">{p.nome}</span>
              <span className="text-gray-500"> — {p.email}</span>
            </li>
          ))}
        </ul>
      </Card>
    </DashboardShell>
  );
}

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, Badge, EmptyState } from "@/components/DashboardShell";
import { FormNovoAluno } from "@/components/forms/FormNovoAluno";

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
    <DashboardShell titulo="Gestão de Usuários" userName={session.user.nome} papel="ADMIN">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Novo aluno" descricao="Gera código de matrícula automaticamente">
          <FormNovoAluno turmas={turmas} planos={planos} />
        </Card>
        <Card title={`Alunos (${alunos.length})`}>
          {alunos.length === 0 ? (
            <EmptyState icone="users" titulo="Nenhum aluno cadastrado" />
          ) : (
            <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {alunos.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{a.nome}</p>
                    <p className="truncate text-xs text-gray-500">
                      {a.codigo} ·{" "}
                      {a.matriculas.map((m) => m.turma.nome).join(", ") || "Sem turma"}
                      {a.responsaveis.length > 0 &&
                        ` · Resp.: ${a.responsaveis
                          .map((r) => r.responsavel.nome)
                          .join(", ")}`}
                    </p>
                  </div>
                  <Badge tom={a.ativo ? "green" : "gray"}>
                    {a.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title={`Professores (${professores.length})`} className="mt-4">
        {professores.length === 0 ? (
          <EmptyState
            icone="book"
            titulo="Nenhum professor cadastrado"
            descricao="Cadastre professores em Acadêmico."
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {professores.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3.5 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{p.nome}</p>
                  <p className="truncate text-xs text-gray-500">{p.email}</p>
                </div>
                <Badge tom={p.ativo ? "green" : "gray"}>
                  {p.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}

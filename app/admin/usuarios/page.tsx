import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, Badge, EmptyState } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import { FormNovoAluno } from "@/components/forms/FormNovoAluno";

export default async function UsuariosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const [alunos, turmas, planos, responsaveis] = await Promise.all([
    prisma.aluno.findMany({
      include: {
        matriculas: {
          where: { status: "ATIVA" },
          include: { turma: { include: { curso: true } } },
        },
        responsaveis: { include: { responsavel: true } },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.turma.findMany({
      where: { ativa: true },
      include: { curso: true },
      orderBy: { nome: "asc" },
    }),
    prisma.plano.findMany({ where: { ativo: true } }),
    prisma.responsavel.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <DashboardShell titulo="Cadastro de Alunos" userName={session.user.nome} papel="ADMIN">
      <div className="grid gap-4 xl:grid-cols-5">
        <Card
          title="Novo aluno"
          descricao="Cadastro completo: dados, matrícula (curso 1 e 2) e responsável"
          className="xl:col-span-3"
        >
          <FormNovoAluno turmas={turmas} planos={planos} responsaveis={responsaveis} />
        </Card>

        <Card title={`Alunos (${alunos.length})`} className="xl:col-span-2">
          {alunos.length === 0 ? (
            <EmptyState icone="users" titulo="Nenhum aluno cadastrado" />
          ) : (
            <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
              {alunos.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-gray-100 px-3.5 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {a.nome}
                    </p>
                    <Badge tom={a.ativo ? "green" : "red"}>
                      {a.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {a.codigo}
                    {a.telefone ? ` · ${a.telefone}` : ""}
                    {a.serie ? ` · ${a.serie}` : ""}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {a.matriculas.map((m) => (
                      <CursoBadge key={m.id} curso={m.turma.curso.nome} tamanho="sm" />
                    ))}
                    {a.matriculas.length === 0 && (
                      <span className="text-xs text-gray-400">Sem matrícula ativa</span>
                    )}
                  </div>
                  {a.responsaveis.length > 0 && (
                    <p className="mt-1 text-xs text-gray-400">
                      Resp.: {a.responsaveis.map((r) => r.responsavel.nome).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

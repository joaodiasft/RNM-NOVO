import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { FormNovoAluno } from "@/components/forms/FormNovoAluno";
import { ListaAlunosBusca } from "@/components/ListaAlunosBusca";

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
            <ListaAlunosBusca
              alunos={alunos.map((a) => ({
                id: a.id,
                nome: a.nome,
                codigo: a.codigo,
                ativo: a.ativo,
                telefone: a.telefone,
                serie: a.serie,
                cursos: a.matriculas.map((m) => m.turma.curso.nome),
                responsaveis: a.responsaveis.map((r) => r.responsavel.nome),
              }))}
            />
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

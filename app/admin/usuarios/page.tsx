import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { FormNovoAluno } from "@/components/forms/FormNovoAluno";
import { FormPremiarAluno } from "@/components/forms/FormPremiarAluno";
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

  const premiacoes = await prisma.premiacao.findMany({
    include: { aluno: { select: { nome: true } } },
    orderBy: { criadoEm: "desc" },
    take: 15,
  });

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

        <div className="space-y-4 xl:col-span-2">
        <Card
          title="Premiações 🏆"
          descricao="Conceda troféus e destaques — o aluno vê nas Conquistas dele"
        >
          <FormPremiarAluno
            alunos={alunos
              .filter((a) => a.ativo)
              .map((a) => ({ id: a.id, nome: a.nome, codigo: a.codigo }))}
            premiacoes={premiacoes.map((p) => ({
              id: p.id,
              titulo: p.titulo,
              icone: p.icone,
              alunoNome: p.aluno.nome,
              criadoEm: p.criadoEm.toISOString(),
            }))}
          />
        </Card>

        <Card title={`Alunos (${alunos.length})`}>
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
      </div>
    </DashboardShell>
  );
}

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, Badge, EmptyState } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import { FormRematriculaAdmin } from "@/components/forms/FormRematriculaAdmin";
import { FormMatricula } from "@/components/forms/FormMatricula";

export default async function MatriculasPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const [solicitacoes, matriculas, alunos, turmas, planos] = await Promise.all([
    prisma.solicitacaoRematricula.findMany({
      where: { status: "PENDENTE" },
      include: { aluno: true },
      orderBy: { dataSolicitacao: "desc" },
    }),
    prisma.matriculaCurso.findMany({
      where: { status: "ATIVA" },
      include: { aluno: true, turma: { include: { curso: true } }, plano: true },
      orderBy: { dataInicio: "desc" },
      take: 50,
    }),
    prisma.aluno.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.turma.findMany({
      where: { ativa: true },
      include: { curso: true },
      orderBy: { nome: "asc" },
    }),
    prisma.plano.findMany({ where: { ativo: true } }),
  ]);

  return (
    <DashboardShell titulo="Matrículas" userName={session.user.nome} papel="ADMIN">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card
            title="Nova matrícula"
            descricao="Matricule um aluno já cadastrado em um curso"
          >
            <FormMatricula alunos={alunos} turmas={turmas} planos={planos} />
          </Card>
          <Card
            title={`Rematrículas pendentes (${solicitacoes.length})`}
            descricao="Aprovar cria a matrícula e o 1º pagamento automaticamente"
          >
            <FormRematriculaAdmin
              solicitacoes={solicitacoes.map((s) => ({
                id: s.id,
                aluno: { nome: s.aluno.nome, codigo: s.aluno.codigo },
                dados: (s.dados as Record<string, unknown> | null) ?? null,
                dataSolicitacao: s.dataSolicitacao.toISOString(),
              }))}
            />
          </Card>
        </div>

        <Card title={`Matrículas ativas (${matriculas.length})`} descricao="Mais recentes primeiro">
          {matriculas.length === 0 ? (
            <EmptyState icone="clipboard" titulo="Nenhuma matrícula ativa" />
          ) : (
            <ul className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
              {matriculas.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3.5 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{m.aluno.nome}</p>
                    <p className="truncate text-xs text-gray-500">
                      {m.aluno.codigo} · Turma {m.turma.nome} · {m.plano.nome} · desde{" "}
                      {new Date(m.dataInicio).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <CursoBadge curso={m.turma.curso.nome} tamanho="sm" />
                    <Badge tom="green">ATIVA</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

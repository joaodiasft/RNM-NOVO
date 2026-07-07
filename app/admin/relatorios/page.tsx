import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState, Badge } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import { Icon } from "@/components/ui/Icons";
import Link from "next/link";

export default async function RelatoriosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const [turmas, alunos] = await Promise.all([
    prisma.turma.findMany({
      include: { curso: true },
      orderBy: { nome: "asc" },
    }),
    prisma.aluno.findMany({
      orderBy: { nome: "asc" },
      include: {
        matriculas: {
          where: { status: "ATIVA" },
          include: { turma: { include: { curso: true } } },
        },
      },
    }),
  ]);

  return (
    <DashboardShell titulo="Relatórios" userName={session.user.nome} papel="ADMIN">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Relatório do aluno — para o responsável"
          descricao="PDF A4 completo: frequência, redações (notas, competências ENEM e feedback), cursos e financeiro — pronto para entregar ao pai"
          className="lg:col-span-2"
        >
          {alunos.length === 0 ? (
            <EmptyState icone="users" titulo="Nenhum aluno cadastrado" />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {alunos.map((a) => (
                <li key={`rel-${a.id}`}>
                  <Link
                    href={`/api/relatorios?tipo=aluno&alunoId=${a.id}`}
                    className="flex items-start justify-between gap-2 rounded-xl border border-gray-100 px-4 py-3 text-sm transition hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-800">{a.nome}</p>
                      <p className="text-xs text-gray-500">{a.codigo}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {a.matriculas.map((m) => (
                          <CursoBadge key={m.id} curso={m.turma.curso.nome} tamanho="sm" />
                        ))}
                      </div>
                    </div>
                    <Icon name="chart" className="h-4.5 w-4.5 shrink-0 text-indigo-600" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Primeiro acesso — PDF A4"
          descricao="Ficha completa do aluno com dados pessoais, responsáveis, matrículas e calendário do módulo"
          className="lg:col-span-2"
        >
          {alunos.length === 0 ? (
            <EmptyState icone="users" titulo="Nenhum aluno cadastrado" />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {alunos.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/api/relatorios?tipo=primeiro-acesso&alunoId=${a.id}&formato=pdf`}
                    className="flex items-start justify-between gap-2 rounded-xl border border-gray-100 px-4 py-3 text-sm transition hover:border-pink-200 hover:bg-pink-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-800">{a.nome}</p>
                      <p className="text-xs text-gray-500">{a.codigo}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {a.matriculas.map((m) => (
                          <CursoBadge key={m.id} curso={m.turma.curso.nome} tamanho="sm" />
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Icon name="download" className="h-4.5 w-4.5 text-pink-600" />
                      <Badge tom={a.ativo ? "green" : "red"}>
                        {a.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Exportar por turma"
          descricao="Planilha Excel com frequência, entregas e médias do módulo atual"
          className="lg:col-span-2"
        >
          {turmas.length === 0 ? (
            <EmptyState icone="chart" titulo="Nenhuma turma para exportar" />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {turmas.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/api/relatorios?tipo=turma&turmaId=${t.id}&formato=xlsx`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <span>
                      Turma {t.nome} — {t.curso.nome}
                    </span>
                    <Icon name="download" className="h-4.5 w-4.5 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

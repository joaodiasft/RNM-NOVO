import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, Badge, EmptyState } from "@/components/DashboardShell";
import { FormRematriculaAdmin } from "@/components/forms/FormRematriculaAdmin";

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
    orderBy: { dataInicio: "desc" },
    take: 30,
  });

  return (
    <DashboardShell titulo="Matrículas" userName={session.user.nome} papel="ADMIN">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title={`Rematrículas pendentes (${solicitacoes.length})`}
          descricao="Aprovar cria a matrícula e o 1º pagamento automaticamente"
        >
          <FormRematriculaAdmin solicitacoes={solicitacoes} />
        </Card>
        <Card title="Matrículas ativas" descricao="Últimas 30 matrículas">
          {matriculas.length === 0 ? (
            <EmptyState icone="clipboard" titulo="Nenhuma matrícula ativa" />
          ) : (
            <ul className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {matriculas.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3.5 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{m.aluno.nome}</p>
                    <p className="truncate text-xs text-gray-500">
                      Turma {m.turma.nome} · {m.turma.curso.nome} · {m.plano.nome}
                    </p>
                  </div>
                  <Badge tom="green">ATIVA</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

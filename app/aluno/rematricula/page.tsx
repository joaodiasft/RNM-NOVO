import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, Badge, EmptyState } from "@/components/DashboardShell";
import { FormRematriculaAluno } from "@/components/forms/FormRematriculaAluno";

export default async function AlunoRematriculaPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const [turmas, planos, solicitacoes] = await Promise.all([
    prisma.turma.findMany({ where: { ativa: true }, orderBy: { nome: "asc" } }),
    prisma.plano.findMany({ where: { ativo: true } }),
    prisma.solicitacaoRematricula.findMany({
      where: { alunoId: session.user.id },
      orderBy: { dataSolicitacao: "desc" },
    }),
  ]);

  return (
    <DashboardShell titulo="Rematrícula" userName={session.user.nome} papel="ALUNO">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Solicitar renovação"
          descricao="A secretaria analisa e confirma a rematrícula"
        >
          <FormRematriculaAluno
            alunoId={session.user.id}
            turmas={turmas}
            planos={planos}
          />
        </Card>
        <Card title="Histórico de solicitações">
          {solicitacoes.length === 0 ? (
            <EmptyState icone="refresh" titulo="Nenhuma solicitação enviada" />
          ) : (
            <ul className="space-y-2">
              {solicitacoes.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm"
                >
                  <span className="text-gray-700">
                    {new Date(s.dataSolicitacao).toLocaleDateString("pt-BR")}
                  </span>
                  <Badge
                    tom={
                      s.status === "APROVADA"
                        ? "green"
                        : s.status === "RECUSADA"
                          ? "red"
                          : "amber"
                    }
                  >
                    {s.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

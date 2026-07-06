import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState, Badge } from "@/components/DashboardShell";
import { FormEntregaRedacao } from "@/components/forms/FormEntregaRedacao";

export default async function AlunoRedacaoPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const matricula = await prisma.matriculaCurso.findFirst({
    where: {
      alunoId: session.user.id,
      status: "ATIVA",
      turma: { curso: { nome: "REDACAO" } },
    },
    include: {
      turma: {
        include: {
          modulos: {
            orderBy: { numero: "desc" },
            take: 1,
            include: { aulas: { orderBy: { data: "desc" }, take: 4 } },
          },
        },
      },
    },
  });

  if (!matricula) {
    return (
      <DashboardShell titulo="Redação" userName={session.user.nome} papel="ALUNO">
        <Card>
          <EmptyState
            icone="pencil"
            titulo="Você não está matriculado em Redação"
            descricao="Fale com a secretaria se quiser participar do curso de Redação."
          />
        </Card>
      </DashboardShell>
    );
  }

  const aulas = matricula.turma.modulos[0]?.aulas ?? [];

  // Entregas já lançadas pelo aluno nessas aulas
  const entregas = await prisma.entregaRedacao.findMany({
    where: { alunoId: session.user.id, aulaId: { in: aulas.map((a) => a.id) } },
  });
  const entregaPorAula = new Map(entregas.map((e) => [e.aulaId, e]));

  return (
    <DashboardShell titulo="Entrega de Redação" userName={session.user.nome} papel="ALUNO">
      {aulas.length === 0 ? (
        <Card>
          <EmptyState
            icone="calendar"
            titulo="Nenhuma aula disponível"
            descricao="Quando o módulo do mês for gerado, as aulas aparecem aqui."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {aulas.map((a) => {
            const entrega = entregaPorAula.get(a.id);
            return (
              <Card
                key={a.id}
                title={`Aula ${a.numero} — ${new Date(a.data).toLocaleDateString("pt-BR")}`}
                acao={
                  entrega ? (
                    <Badge tom={entrega.status === "APROVADA" ? "green" : "amber"}>
                      {entrega.status === "APROVADA"
                        ? `Aprovada (${entrega.quantidadeEntregue})`
                        : "Aguardando aprovação"}
                    </Badge>
                  ) : undefined
                }
              >
                <FormEntregaRedacao aulaId={a.id} />
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { FormAprovarRedacao } from "@/components/forms/FormAprovarRedacao";

export default async function RedacaoAdminPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const entregas = await prisma.entregaRedacao.findMany({
    where: { status: "AGUARDANDO_APROVACAO" },
    include: {
      aluno: true,
      correcoes: true,
      aula: { include: { modulo: { include: { turma: true } } } },
    },
  });

  return (
    <DashboardShell titulo="Aprovação de Redações" userName={session.user.nome} papel="ADMIN">
      <Card
        title={`Entregas pendentes (${entregas.length})`}
        descricao="Entregas lançadas pelos alunos aguardando validação"
      >
        {entregas.length === 0 ? (
          <EmptyState
            icone="pencil"
            titulo="Nenhuma entrega aguardando aprovação"
            descricao="Quando os alunos lançarem redações, elas aparecem aqui."
          />
        ) : (
          <FormAprovarRedacao entregas={entregas} />
        )}
      </Card>
    </DashboardShell>
  );
}

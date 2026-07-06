import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { FormRematriculaAluno } from "@/components/forms/FormRematriculaAluno";

export default async function ResponsavelRematriculaPage() {
  const session = await auth();
  if (!session || session.user.papel !== "RESPONSAVEL") redirect("/login");

  // Usa o filho selecionado ou o primeiro vinculado
  const vinculo = await prisma.alunoResponsavel.findFirst({
    where: {
      responsavelId: session.user.id,
      ...(session.user.alunoSelecionadoId
        ? { alunoId: session.user.alunoSelecionadoId }
        : {}),
    },
    include: { aluno: true },
  });

  if (!vinculo) {
    return (
      <DashboardShell titulo="Rematrícula" userName={session.user.nome} papel="RESPONSAVEL">
        <Card>
          <EmptyState icone="users" titulo="Nenhum filho vinculado" />
        </Card>
      </DashboardShell>
    );
  }

  const [turmas, planos] = await Promise.all([
    prisma.turma.findMany({ where: { ativa: true }, orderBy: { nome: "asc" } }),
    prisma.plano.findMany({ where: { ativo: true } }),
  ]);

  return (
    <DashboardShell titulo="Rematrícula" userName={session.user.nome} papel="RESPONSAVEL">
      <Card
        title={`Solicitar para ${vinculo.aluno.nome.split(" ")[0]}`}
        descricao="A secretaria analisa e confirma a rematrícula"
      >
        <FormRematriculaAluno alunoId={vinculo.alunoId} turmas={turmas} planos={planos} />
      </Card>
    </DashboardShell>
  );
}

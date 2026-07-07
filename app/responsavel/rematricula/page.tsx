import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { FormRematriculaAluno } from "@/components/forms/FormRematriculaAluno";

export default async function ResponsavelRematriculaPage() {
  const session = await auth();
  if (!session || session.user.papel !== "RESPONSAVEL") redirect("/login");

  const vinculo = await prisma.alunoResponsavel.findFirst({
    where: {
      responsavelId: session.user.id,
      ...(session.user.alunoSelecionadoId
        ? { alunoId: session.user.alunoSelecionadoId }
        : {}),
    },
    include: {
      aluno: {
        include: {
          matriculas: {
            where: { status: "ATIVA" },
            include: { turma: { include: { curso: true } } },
          },
        },
      },
    },
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

  const aluno = vinculo.aluno;
  const [turmas, planos, solicitacoes] = await Promise.all([
    prisma.turma.findMany({
      where: { ativa: true },
      include: { curso: true },
      orderBy: { nome: "asc" },
    }),
    prisma.plano.findMany({ where: { ativo: true } }),
    prisma.solicitacaoRematricula.findMany({
      where: { alunoId: aluno.id, status: "PENDENTE" },
    }),
  ]);

  const curso1 = aluno.matriculas[0]?.turma.curso.nome;
  const turmasC1 = turmas
    .filter((t) => !curso1 || t.curso.nome === curso1)
    .map((t) => ({ id: t.id, nome: t.nome, curso: t.curso.nome }));
  const turmasC2 = turmas
    .filter((t) => aluno.matriculas.length > 1 && t.curso.nome !== curso1)
    .map((t) => ({ id: t.id, nome: t.nome, curso: t.curso.nome }));

  return (
    <DashboardShell titulo="Rematrícula" userName={session.user.nome} papel="RESPONSAVEL">
      <Card title={`Solicitar para ${aluno.nome}`}>
        <FormRematriculaAluno
          alunoId={aluno.id}
          alunoNome={aluno.nome}
          alunoTelefone={aluno.telefone}
          alunoWhatsapp={aluno.whatsapp}
          alunoInstagram={aluno.instagram}
          responsavelNome={session.user.nome}
          responsavelTelefone={null}
          turmas={turmasC1.length ? turmasC1 : turmas.map((t) => ({ id: t.id, nome: t.nome, curso: t.curso.nome }))}
          turmas2={turmasC2}
          planos={planos}
          bloqueado={solicitacoes.length > 0}
        />
      </Card>
    </DashboardShell>
  );
}

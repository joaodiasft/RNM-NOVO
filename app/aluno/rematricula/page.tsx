import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, Badge, EmptyState } from "@/components/DashboardShell";
import { FormRematriculaAluno } from "@/components/forms/FormRematriculaAluno";

export default async function AlunoRematriculaPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const aluno = await prisma.aluno.findUniqueOrThrow({
    where: { id: session.user.id },
    include: {
      responsaveis: { include: { responsavel: true }, take: 1 },
      matriculas: {
        where: { status: "ATIVA" },
        include: { turma: { include: { curso: true } } },
      },
    },
  });

  const [turmas, planos, solicitacoes] = await Promise.all([
    prisma.turma.findMany({
      where: { ativa: true },
      include: { curso: true },
      orderBy: { nome: "asc" },
    }),
    prisma.plano.findMany({ where: { ativo: true } }),
    prisma.solicitacaoRematricula.findMany({
      where: { alunoId: session.user.id },
      orderBy: { dataSolicitacao: "desc" },
    }),
  ]);

  const curso1 = aluno.matriculas[0]?.turma.curso.nome;
  const turmasC1 = turmas
    .filter((t) => !curso1 || t.curso.nome === curso1)
    .map((t) => ({ id: t.id, nome: t.nome, curso: t.curso.nome }));
  const turmasC2 = turmas
    .filter((t) => aluno.matriculas.length > 1 && t.curso.nome !== curso1)
    .map((t) => ({ id: t.id, nome: t.nome, curso: t.curso.nome }));

  const resp = aluno.responsaveis[0]?.responsavel;
  const bloqueado = solicitacoes.some((s) => s.status === "PENDENTE");

  return (
    <DashboardShell titulo="Rematrícula" userName={session.user.nome} papel="ALUNO">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Solicitar renovação">
          <FormRematriculaAluno
            alunoId={session.user.id}
            alunoNome={aluno.nome}
            alunoTelefone={aluno.telefone}
            alunoWhatsapp={aluno.whatsapp}
            alunoInstagram={aluno.instagram}
            responsavelNome={resp?.nome}
            responsavelTelefone={resp?.telefone}
            turmas={turmasC1.length ? turmasC1 : turmas.map((t) => ({ id: t.id, nome: t.nome, curso: t.curso.nome }))}
            turmas2={turmasC2}
            planos={planos}
            bloqueado={bloqueado}
          />
        </Card>
        <Card title="Histórico">
          {solicitacoes.length === 0 ? (
            <EmptyState icone="refresh" titulo="Nenhuma solicitação" />
          ) : (
            <ul className="space-y-2">
              {solicitacoes.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm"
                >
                  <span>
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

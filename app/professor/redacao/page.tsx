import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import { FormRedacaoProfessor } from "@/components/forms/FormRedacaoProfessor";

export default async function ProfessorRedacaoPage() {
  const session = await auth();
  if (!session || session.user.papel !== "PROFESSOR") redirect("/login");

  const turmas = await prisma.turma.findMany({
    where: {
      professores: { some: { professorId: session.user.id } },
      curso: { nome: "REDACAO" },
    },
    include: {
      curso: true,
      modulos: {
        orderBy: { numero: "desc" },
        take: 1,
        include: {
          aulas: { orderBy: { numero: "asc" }, include: { entregasRedacao: true } },
        },
      },
      matriculas: { where: { status: "ATIVA" }, include: { aluno: true } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <DashboardShell
      titulo="Entregas de Redação"
      userName={session.user.nome}
      papel="PROFESSOR"
    >
      {turmas.length === 0 ? (
        <Card>
          <EmptyState
            icone="pencil"
            titulo="Nenhuma turma de Redação vinculada"
            descricao="Esta área é exclusiva para as turmas do curso de Redação."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {turmas.map((t) => (
            <Card
              key={t.id}
              title={`Turma ${t.nome}`}
              acao={<CursoBadge curso={t.curso.nome} />}
            >
              {!t.modulos[0] ? (
                <p className="text-sm text-gray-500">
                  Sem módulo ativo. Peça à administração para gerar o módulo do mês.
                </p>
              ) : (
                t.modulos[0].aulas.map((aula) => (
                  <div key={aula.id} className="mb-5 last:mb-0">
                    <p className="mb-2 text-sm font-semibold text-gray-800">
                      Aula {aula.numero} —{" "}
                      {new Date(aula.data).toLocaleDateString("pt-BR")}
                    </p>
                    <FormRedacaoProfessor
                      aulaId={aula.id}
                      alunos={t.matriculas.map((m) => m.aluno)}
                      entregas={aula.entregasRedacao.map((e) => ({
                        alunoId: e.alunoId,
                        quantidadeEntregue: e.quantidadeEntregue,
                        status: e.status,
                      }))}
                    />
                  </div>
                ))
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

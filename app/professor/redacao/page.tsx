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
          aulas: {
            orderBy: { numero: "asc" },
            include: {
              entregasRedacao: {
                include: { aluno: true, correcoes: true },
              },
            },
          },
        },
      },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <DashboardShell
      titulo="Correção de Redações"
      userName={session.user.nome}
      papel="PROFESSOR"
    >
      <p className="mb-4 text-sm text-gray-600">
        Lance notas da professora, Sofia e competências ENEM. A quantidade entregue é
        registrada pelo admin.
      </p>
      {turmas.length === 0 ? (
        <Card>
          <EmptyState icone="pencil" titulo="Nenhuma turma de Redação" />
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
                <p className="text-sm text-gray-500">Sem módulo ativo.</p>
              ) : (
                t.modulos[0].aulas.map((aula) => (
                  <div key={aula.id} className="mb-6 last:mb-0">
                    <p className="mb-1 text-sm font-semibold">
                      Aula {aula.numero} —{" "}
                      {new Date(aula.data).toLocaleDateString("pt-BR")}
                    </p>
                    {aula.conteudo && (
                      <p className="mb-2 text-xs text-gray-500">Tema: {aula.conteudo}</p>
                    )}
                    <FormRedacaoProfessor
                      aulaId={aula.id}
                      alunos={[]}
                      entregas={aula.entregasRedacao.map((e) => ({
                        ...e,
                        aluno: e.aluno,
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

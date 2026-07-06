import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, Badge, EmptyState } from "@/components/DashboardShell";

export default async function ResponsavelFinanceiroPage() {
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

  const pagamentos = vinculo
    ? await prisma.pagamento.findMany({
        where: { matriculaCurso: { alunoId: vinculo.alunoId } },
        include: { matriculaCurso: { include: { turma: { include: { curso: true } } } } },
        orderBy: { competencia: "desc" },
      })
    : [];

  return (
    <DashboardShell titulo="Financeiro" userName={session.user.nome} papel="RESPONSAVEL">
      {vinculo && (
        <p className="mb-4 text-sm text-gray-600">
          Acompanhando: <strong>{vinculo.aluno.nome}</strong> ({vinculo.aluno.codigo})
        </p>
      )}
      <Card title="Pagamentos">
        {pagamentos.length === 0 ? (
          <EmptyState
            icone="currency"
            titulo="Nenhum pagamento encontrado"
            descricao="Os pagamentos das matrículas do seu filho aparecem aqui."
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {pagamentos.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">{p.competencia}</p>
                  <p className="text-xs text-gray-500">
                    {p.matriculaCurso.turma.curso.nome} — R$ {Number(p.valor).toFixed(2)}
                  </p>
                </div>
                <Badge
                  tom={
                    p.status === "CONFIRMADO"
                      ? "green"
                      : p.status === "ATRASADO"
                        ? "red"
                        : "amber"
                  }
                >
                  {p.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}

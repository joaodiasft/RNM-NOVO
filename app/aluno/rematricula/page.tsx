export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
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
    <DashboardShell titulo="Rematrícula" corAccent="#D6336C" userName={session.user.nome} papel="ALUNO" navItems={[
      { href: "/aluno", label: "Dashboard" },
      { href: "/aluno/rematricula", label: "Rematrícula" },
    ]}>
      <Card title="Solicitar renovação">
        <FormRematriculaAluno alunoId={session.user.id} turmas={turmas} planos={planos} />
      </Card>
      <Card title="Histórico" className="mt-4">
        {solicitacoes.map((s) => (
          <p key={s.id} className="text-sm">{new Date(s.dataSolicitacao).toLocaleDateString("pt-BR")} — {s.status}</p>
        ))}
      </Card>
    </DashboardShell>
  );
}

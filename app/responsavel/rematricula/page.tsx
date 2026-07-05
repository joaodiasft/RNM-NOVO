import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { FormRematriculaAluno } from "@/components/forms/FormRematriculaAluno";

export default async function ResponsavelRematriculaPage() {
  const session = await auth();
  if (!session || session.user.papel !== "RESPONSAVEL") redirect("/login");

  const alunoId = session.user.alunoSelecionadoId;
  if (!alunoId) redirect("/responsavel");

  const [turmas, planos] = await Promise.all([
    prisma.turma.findMany({ where: { ativa: true } }),
    prisma.plano.findMany({ where: { ativo: true } }),
  ]);

  return (
    <DashboardShell titulo="Rematrícula" corAccent="#212529" userName={session.user.nome} papel="RESPONSAVEL" navItems={[
      { href: "/responsavel", label: "Dashboard" },
      { href: "/responsavel/rematricula", label: "Rematrícula" },
    ]}>
      <Card title="Solicitar para o filho">
        <FormRematriculaAluno alunoId={alunoId} turmas={turmas} planos={planos} />
      </Card>
    </DashboardShell>
  );
}

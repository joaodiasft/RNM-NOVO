export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { calcularPercentualFrequencia } from "@/lib/utils/index";

export default async function ResponsavelFrequenciaPage() {
  const session = await auth();
  if (!session || session.user.papel !== "RESPONSAVEL") redirect("/login");

  const filho = await prisma.aluno.findFirst({
    where: {
      responsaveis: { some: { responsavelId: session.user.id } },
      id: session.user.alunoSelecionadoId,
    },
    include: { frequencias: { include: { aula: true } } },
  });

  const pct = filho ? calcularPercentualFrequencia(filho.frequencias) : 0;

  return (
    <DashboardShell titulo="Frequência" corAccent="#212529" userName={session.user.nome} papel="RESPONSAVEL" navItems={[
      { href: "/responsavel", label: "Dashboard" },
      { href: "/responsavel/frequencia", label: "Frequência" },
    ]}>
      <Card title="Percentual atual">
        <p className="text-3xl font-bold">{pct}%</p>
      </Card>
    </DashboardShell>
  );
}

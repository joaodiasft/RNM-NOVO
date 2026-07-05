export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, StatCard, AlertBanner } from "@/components/DashboardShell";
import { calcularPercentualFrequencia, FREQUENCIA_ALERTA_PERCENTUAL } from "@/lib/utils/index";
import { SeletorFilho } from "@/components/SeletorFilho";

export default async function ResponsavelDashboard() {
  const session = await auth();
  if (!session || session.user.papel !== "RESPONSAVEL") redirect("/login");

  const filhos = await prisma.alunoResponsavel.findMany({
    where: { responsavelId: session.user.id },
    include: {
      aluno: {
        include: {
          matriculas: { where: { status: "ATIVA" }, include: { turma: true } },
          frequencias: true,
        },
      },
    },
  });

  const alunoAtivo =
    filhos.find((f) => f.alunoId === session.user.alunoSelecionadoId)?.aluno ??
    filhos[0]?.aluno;

  if (!alunoAtivo) {
    return (
      <DashboardShell titulo="Responsável" corAccent="#212529" userName={session.user.nome} papel="RESPONSAVEL" navItems={[]}>
        <Card><p className="text-sm">Nenhum filho vinculado.</p></Card>
      </DashboardShell>
    );
  }

  const pct = calcularPercentualFrequencia(alunoAtivo.frequencias);

  return (
    <DashboardShell
      titulo="Painel do Responsável"
      corAccent="#212529"
      userName={session.user.nome}
      papel="RESPONSAVEL"
      navItems={[
        { href: "/responsavel", label: "Dashboard" },
        { href: "/responsavel/frequencia", label: "Frequência" },
        { href: "/responsavel/financeiro", label: "Financeiro" },
        { href: "/responsavel/avisos", label: "Avisos" },
        { href: "/responsavel/rematricula", label: "Rematrícula" },
      ]}
      extra={filhos.length > 1 ? <SeletorFilho filhos={filhos.map((f) => f.aluno)} /> : undefined}
    >
      <p className="text-sm text-gray-600 mb-4">Acompanhando: <strong>{alunoAtivo.nome}</strong> ({alunoAtivo.codigo})</p>
      <StatCard label="Frequência do filho" value={`${pct}%`} />
      {pct < FREQUENCIA_ALERTA_PERCENTUAL && (
        <AlertBanner tipo="warn" >
          Frequência abaixo de {FREQUENCIA_ALERTA_PERCENTUAL}%
        </AlertBanner>
      )}
      <Card title="Turmas" className="mt-4">
        {alunoAtivo.matriculas.map((m) => (
          <p key={m.id} className="text-sm">{m.turma.nome}</p>
        ))}
      </Card>
    </DashboardShell>
  );
}

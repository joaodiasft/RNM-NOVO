export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { FormEntregaRedacao } from "@/components/forms/FormEntregaRedacao";

export default async function AlunoRedacaoPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const matricula = await prisma.matriculaCurso.findFirst({
    where: { alunoId: session.user.id, status: "ATIVA", turma: { curso: { nome: "REDACAO" } } },
    include: {
      turma: {
        include: {
          modulos: { orderBy: { numero: "desc" }, take: 1, include: { aulas: { orderBy: { data: "desc" }, take: 4 } } },
        },
      },
    },
  });

  if (!matricula) {
    return (
      <DashboardShell titulo="Redação" corAccent="#D6336C" userName={session.user.nome} papel="ALUNO" navItems={[{ href: "/aluno", label: "Dashboard" }]}>
        <Card><p className="text-sm text-gray-500">Você não está matriculado em Redação.</p></Card>
      </DashboardShell>
    );
  }

  const aulas = matricula.turma.modulos[0]?.aulas ?? [];

  return (
    <DashboardShell titulo="Entrega de Redação" corAccent="#D6336C" userName={session.user.nome} papel="ALUNO" navItems={[
      { href: "/aluno", label: "Dashboard" },
      { href: "/aluno/redacao", label: "Redação" },
    ]}>
      {aulas.map((a) => (
        <Card key={a.id} title={`Aula ${a.numero} — ${new Date(a.data).toLocaleDateString("pt-BR")}`} className="mb-4">
          <FormEntregaRedacao aulaId={a.id} />
        </Card>
      ))}
    </DashboardShell>
  );
}

export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { CORES_CURSO } from "@/lib/utils/index";

export default async function AlunoCalendarioPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const aluno = await prisma.aluno.findUniqueOrThrow({
    where: { id: session.user.id },
    include: {
      matriculas: {
        where: { status: "ATIVA" },
        include: {
          turma: {
            include: {
              curso: true,
              modulos: { orderBy: { numero: "desc" }, take: 1, include: { aulas: true } },
            },
          },
        },
      },
    },
  });

  const cor = aluno.matriculas[0]?.turma.curso
    ? CORES_CURSO[aluno.matriculas[0].turma.curso.nome]?.primaria
    : "#D6336C";

  return (
    <DashboardShell titulo="Calendário" corAccent={cor} userName={aluno.nome} papel="ALUNO" navItems={[
      { href: "/aluno", label: "Dashboard" },
      { href: "/aluno/calendario", label: "Calendário" },
    ]}>
      {aluno.matriculas.map((m) => (
        <Card key={m.id} title={m.turma.nome} className="mb-4">
          {m.turma.modulos[0]?.aulas.map((a) => (
            <p key={a.id} className="text-sm">
              Aula {a.numero}: {new Date(a.data).toLocaleDateString("pt-BR")}
            </p>
          ))}
        </Card>
      ))}
    </DashboardShell>
  );
}

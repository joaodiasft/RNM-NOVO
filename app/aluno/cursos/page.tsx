import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { CORES_CURSO } from "@/lib/utils/index";

export default async function AlunoCursosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const aluno = await prisma.aluno.findUniqueOrThrow({
    where: { id: session.user.id },
    include: {
      matriculas: {
        where: { status: "ATIVA" },
        include: { turma: { include: { curso: true } } },
      },
    },
  });

  const cor = aluno.matriculas[0]?.turma.curso
    ? CORES_CURSO[aluno.matriculas[0].turma.curso.nome]?.primaria
    : "#D6336C";

  return (
    <DashboardShell titulo="Meus Cursos" corAccent={cor} userName={aluno.nome} papel="ALUNO" navItems={[
      { href: "/aluno", label: "Dashboard" },
      { href: "/aluno/cursos", label: "Cursos" },
    ]}>
      {aluno.matriculas.map((m) => (
        <Card key={m.id} title={`${CORES_CURSO[m.turma.curso.nome]?.label} — Turma ${m.turma.nome}`}>
          <p className="text-sm">{m.turma.diaSemana} {m.turma.horaInicio}–{m.turma.horaFim}</p>
        </Card>
      ))}
    </DashboardShell>
  );
}

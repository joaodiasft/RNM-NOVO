import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { CORES_CURSO } from "@/lib/utils/index";

export default async function AlunoCursosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const aluno = await prisma.aluno.findUniqueOrThrow({
    where: { id: session.user.id },
    include: {
      matriculas: {
        where: { status: "ATIVA" },
        include: { turma: { include: { curso: true } }, plano: true },
      },
    },
  });

  const cor = aluno.matriculas[0]?.turma.curso
    ? CORES_CURSO[aluno.matriculas[0].turma.curso.nome]?.primaria
    : undefined;

  const hoje = new Date();
  const promocoes = await prisma.promocao.findMany({
    where: {
      ativo: true,
      dataInicio: { lte: hoje },
      dataFim: { gte: hoje },
    },
    include: { curso: true },
    orderBy: { dataFim: "asc" },
  });

  return (
    <DashboardShell
      titulo="Meus Cursos"
      corAccent={cor}
      userName={aluno.nome}
      papel="ALUNO"
    >
      {promocoes.length > 0 && (
        <Card title="Promoções ativas" className="mb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {promocoes.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-pink-50 p-4"
              >
                <p className="font-semibold text-fuchsia-900">{p.titulo}</p>
                {p.descricao && (
                  <p className="mt-1 text-sm text-fuchsia-800/80">{p.descricao}</p>
                )}
                <p className="mt-2 text-xs font-medium text-fuchsia-700">
                  {p.percentualDesconto}% off
                  {p.curso ? ` · ${p.curso.nome}` : " · todos os cursos"}
                </p>
                <p className="text-[11px] text-fuchsia-600/70">
                  Até {new Date(p.dataFim).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
      {aluno.matriculas.length === 0 ? (
        <Card>
          <EmptyState
            icone="book"
            titulo="Nenhuma matrícula ativa"
            descricao="Fale com a secretaria para se matricular."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {aluno.matriculas.map((m) => {
            const info = CORES_CURSO[m.turma.curso.nome];
            return (
              <div
                key={m.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06)]"
              >
                <div
                  className="px-5 py-4 text-white"
                  style={{
                    background: `linear-gradient(120deg, ${info?.escura ?? "#333"}, ${info?.primaria ?? "#666"})`,
                  }}
                >
                  <p className="text-xs uppercase tracking-wider text-white/70">Curso</p>
                  <h3 className="font-display text-lg font-bold">
                    {info?.label ?? m.turma.curso.nome}
                  </h3>
                </div>
                <div className="space-y-1.5 px-5 py-4 text-sm text-gray-700">
                  <p>
                    <span className="text-gray-400">Turma:</span> {m.turma.nome}
                  </p>
                  <p>
                    <span className="text-gray-400">Horário:</span> {m.turma.diaSemana} ·{" "}
                    {m.turma.horaInicio}–{m.turma.horaFim}
                  </p>
                  <p>
                    <span className="text-gray-400">Plano:</span> {m.plano.nome}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

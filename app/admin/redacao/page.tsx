import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { FormAprovarRedacao } from "@/components/forms/FormAprovarRedacao";
import { FormRegistrarEntregaRedacao } from "@/components/forms/FormRegistrarEntregaRedacao";

export default async function RedacaoAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ turma?: string; aula?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");
  const sp = await searchParams;

  const turmas = await prisma.turma.findMany({
    where: { ativa: true, curso: { nome: "REDACAO" } },
    include: {
      modulos: {
        orderBy: { numero: "desc" },
        take: 1,
        include: { aulas: { orderBy: { numero: "asc" } } },
      },
      matriculas: {
        where: { status: "ATIVA" },
        include: { aluno: { select: { id: true, nome: true, codigo: true } } },
      },
    },
    orderBy: { nome: "asc" },
  });

  const turmaSel =
    turmas.find((t) => t.id === sp.turma) || turmas[0];
  const aulas = turmaSel?.modulos[0]?.aulas ?? [];
  const aulaSel = aulas.find((a) => a.id === sp.aula) || aulas[0];
  const alunos =
    turmaSel?.matriculas.map((m) => m.aluno) ?? [];

  const [aguardandoAprovacao, aguardandoNotas] = await Promise.all([
    prisma.entregaRedacao.findMany({
      where: { status: "AGUARDANDO_APROVACAO" },
      include: { aluno: true, correcoes: true },
      orderBy: { id: "desc" },
    }),
    prisma.entregaRedacao.findMany({
      where: { status: "AGUARDANDO_NOTAS" },
      include: {
        aluno: true,
        aula: { include: { modulo: { include: { turma: true } } } },
      },
      take: 50,
    }),
  ]);

  return (
    <DashboardShell titulo="Redação" userName={session.user.nome} papel="ADMIN">
      <div className="mb-4 flex flex-wrap gap-2">
        {turmas.map((t) => (
          <a
            key={t.id}
            href={`/admin/redacao?turma=${t.id}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              turmaSel?.id === t.id
                ? "bg-rnm-redacao text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Turma {t.nome}
          </a>
        ))}
      </div>

      {turmaSel && aulas.length > 0 && (
        <Card
          title="1. Registrar entregas por aula"
          descricao="Informe quantas redações cada aluno entregou — libera o lançamento de notas"
          className="mb-4"
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {aulas.map((a) => (
              <a
                key={a.id}
                href={`/admin/redacao?turma=${turmaSel.id}&aula=${a.id}`}
                className={`rounded-lg px-2.5 py-1 text-xs ${
                  aulaSel?.id === a.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100"
                }`}
              >
                Aula {a.numero}
                {a.conteudo ? ` · ${a.conteudo.slice(0, 24)}` : ""}
              </a>
            ))}
          </div>
          {aulaSel && (
            <FormRegistrarEntregaRedacao aulaId={aulaSel.id} alunos={alunos} />
          )}
        </Card>
      )}

      <Card
        title={`2. Aguardando notas (${aguardandoNotas.length})`}
        descricao="Entregas registradas — professor ou admin lança notas"
        className="mb-4"
      >
        {aguardandoNotas.length === 0 ? (
          <EmptyState icone="pencil" titulo="Nenhuma pendência de notas" />
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {aguardandoNotas.map((e) => (
              <li key={e.id} className="flex justify-between py-2">
                <span>
                  {e.aluno.nome} · Turma {e.aula.modulo.turma.nome} ·{" "}
                  {e.quantidadeEntregue} red.
                </span>
                <span className="text-amber-600">Aguardando notas</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title={`3. Aprovar e liberar (${aguardandoAprovacao.length})`}
        descricao="Após notas lançadas, aprove com feedback para o aluno ver"
      >
        {aguardandoAprovacao.length === 0 ? (
          <EmptyState
            icone="check-circle"
            titulo="Nenhuma entrega aguardando aprovação"
          />
        ) : (
          <FormAprovarRedacao entregas={aguardandoAprovacao} />
        )}
      </Card>
    </DashboardShell>
  );
}

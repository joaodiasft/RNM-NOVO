import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, Badge, EmptyState } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import { FormRematriculaAdmin } from "@/components/forms/FormRematriculaAdmin";
import { FormMatricula } from "@/components/forms/FormMatricula";

export default async function MatriculasPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const [solicitacoes, matriculas, alunos, turmas, planos, cursoPlanosRaw] =
    await Promise.all([
      prisma.solicitacaoRematricula.findMany({
        where: { status: "PENDENTE" },
        include: { aluno: true },
        orderBy: { dataSolicitacao: "desc" },
      }),
      prisma.matriculaCurso.findMany({
        where: { status: "ATIVA" },
        include: {
          aluno: true,
          turma: { include: { curso: true } },
          plano: true,
          pagamentos: { orderBy: { competencia: "desc" }, take: 1 },
        },
        orderBy: { dataInicio: "desc" },
        take: 50,
      }),
      prisma.aluno.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
      prisma.turma.findMany({
        where: { ativa: true },
        include: { curso: true },
        orderBy: { nome: "asc" },
      }),
      prisma.plano.findMany({ where: { ativo: true } }),
      prisma.cursoPlano.findMany(),
    ]);

  const cursoPlanos = cursoPlanosRaw.map((cp) => ({
    cursoId: cp.cursoId,
    planoId: cp.planoId,
    valor: Number(cp.valor),
  }));

  return (
    <DashboardShell titulo="Matrículas" userName={session.user.nome} papel="ADMIN">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card
            title="Nova matrícula"
            descricao="Curso 1 obrigatório · curso 2 opcional · valor por curso"
          >
            <FormMatricula
              alunos={alunos}
              turmas={turmas.map((t) => ({
                id: t.id,
                nome: t.nome,
                cursoId: t.cursoId,
                curso: t.curso,
              }))}
              planos={planos}
              cursoPlanos={cursoPlanos}
            />
          </Card>
          <Card
            title={`Rematrículas pendentes (${solicitacoes.length})`}
            descricao="Aprovar cria a matrícula e o 1º pagamento automaticamente"
          >
            <FormRematriculaAdmin
              solicitacoes={solicitacoes.map((s) => ({
                id: s.id,
                aluno: { nome: s.aluno.nome, codigo: s.aluno.codigo },
                dados: (s.dados as Record<string, unknown> | null) ?? null,
                dataSolicitacao: s.dataSolicitacao.toISOString(),
              }))}
            />
          </Card>
        </div>

        <Card title={`Matrículas ativas (${matriculas.length})`} descricao="Mais recentes primeiro">
          {matriculas.length === 0 ? (
            <EmptyState icone="clipboard" titulo="Nenhuma matrícula ativa" />
          ) : (
            <ul className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
              {matriculas.map((m) => {
                const ultimoPag = m.pagamentos[0];
                return (
                  <li
                    key={m.id}
                    className="rounded-xl border border-gray-100 px-3.5 py-3 text-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{m.aluno.nome}</p>
                        <p className="truncate text-xs text-gray-500">
                          {m.aluno.codigo} · Turma {m.turma.nome} · {m.plano.nome}
                        </p>
                        {ultimoPag && (
                          <p className="mt-1 text-xs text-gray-500">
                            Último pag.: {ultimoPag.competencia} — R${" "}
                            {Number(ultimoPag.valor).toFixed(2)}{" "}
                            <span className="font-medium">{ultimoPag.status}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <CursoBadge curso={m.turma.curso.nome} tamanho="sm" />
                        <Badge tom="green">ATIVA</Badge>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

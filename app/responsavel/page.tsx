import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  DashboardShell,
  Card,
  StatCard,
  AlertBanner,
  EmptyState,
  Badge,
} from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import {
  calcularPercentualFrequencia,
  FREQUENCIA_ALERTA_PERCENTUAL,
  CORES_CURSO,
} from "@/lib/utils/index";
import { SeletorFilho } from "@/components/SeletorFilho";

export default async function ResponsavelDashboard() {
  const session = await auth();
  if (!session || session.user.papel !== "RESPONSAVEL") redirect("/login");

  const filhos = await prisma.alunoResponsavel.findMany({
    where: { responsavelId: session.user.id },
    include: {
      aluno: {
        include: {
          matriculas: {
            where: { status: "ATIVA" },
            include: { turma: { include: { curso: true } } },
          },
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
      <DashboardShell
        titulo="Painel do Responsável"
        userName={session.user.nome}
        papel="RESPONSAVEL"
      >
        <Card>
          <EmptyState
            icone="users"
            titulo="Nenhum filho vinculado"
            descricao="Fale com a secretaria para vincular seu cadastro ao do aluno."
          />
        </Card>
      </DashboardShell>
    );
  }

  const pct = calcularPercentualFrequencia(alunoAtivo.frequencias);

  return (
    <DashboardShell
      titulo="Painel do Responsável"
      userName={session.user.nome}
      papel="RESPONSAVEL"
      extra={
        filhos.length > 1 ? (
          <SeletorFilho filhos={filhos.map((f) => f.aluno)} />
        ) : undefined
      }
    >
      <p className="mb-4 text-sm text-gray-600">
        Acompanhando: <strong>{alunoAtivo.nome}</strong> ({alunoAtivo.codigo})
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          label="Frequência"
          value={`${pct}%`}
          cor={pct < FREQUENCIA_ALERTA_PERCENTUAL ? "#dc2626" : "#16a34a"}
          icone="check-circle"
        />
        <StatCard
          label="Cursos ativos"
          value={alunoAtivo.matriculas.length}
          icone="book"
        />
      </div>

      {pct < FREQUENCIA_ALERTA_PERCENTUAL && (
        <div className="mb-4">
          <AlertBanner tipo="warn">
            A frequência está abaixo de {FREQUENCIA_ALERTA_PERCENTUAL}%. Converse com a
            escola sobre reposições.
          </AlertBanner>
        </div>
      )}

      <Card title="Turmas">
        {alunoAtivo.matriculas.length === 0 ? (
          <EmptyState icone="book" titulo="Nenhuma matrícula ativa" />
        ) : (
          <ul className="space-y-2">
            {alunoAtivo.matriculas.map((m) => {
              const info = CORES_CURSO[m.turma.curso.nome];
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-xl border-l-4 border border-gray-100 px-4 py-3"
                  style={{ borderLeftColor: info?.primaria }}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Turma {m.turma.nome}
                    </p>
                    <p className="text-xs text-gray-500">
                      {m.turma.diaSemana} · {m.turma.horaInicio}–{m.turma.horaFim}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CursoBadge curso={m.turma.curso.nome} tamanho="sm" />
                    <Badge tom="green">ATIVA</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}

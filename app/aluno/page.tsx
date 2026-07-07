import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  DashboardShell,
  Card,
  StatCard,
  AlertBanner,
  Badge,
  EmptyState,
} from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import {
  calcularPercentualFrequencia,
  FREQUENCIA_ALERTA_PERCENTUAL,
  CORES_CURSO,
} from "@/lib/utils/index";
import Link from "next/link";

const WHATS_PIX =
  process.env.WHATSAPP_PIX ||
  process.env.SMTP_USUARIO?.replace(/@.*/, "") ||
  "5562999999999";

function corFrequencia(status: string) {
  if (status === "PRESENTE") return "border-emerald-400 bg-emerald-50 text-emerald-800";
  if (status.startsWith("REPOSICAO")) return "border-amber-400 bg-amber-50 text-amber-900";
  return "border-red-300 bg-red-50 text-red-800";
}

export default async function AlunoDashboard() {
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
              modulos: {
                orderBy: { numero: "desc" },
                take: 1,
                include: { aulas: { orderBy: { data: "asc" } } },
              },
            },
          },
          pagamentos: { orderBy: { competencia: "desc" }, take: 6 },
        },
      },
      frequencias: { include: { aula: true } },
      entregasRedacao: { where: { status: "APROVADA" } },
    },
  });

  const pct = calcularPercentualFrequencia(aluno.frequencias);
  const curso = aluno.matriculas[0]?.turma.curso;
  const cor = curso ? CORES_CURSO[curso.nome]?.primaria : "#d6336c";
  const moduloNum = aluno.matriculas[0]?.turma.modulos[0]?.numero;

  const freqPorAula = new Map(aluno.frequencias.map((f) => [f.aulaId, f.status]));

  const proximasAulas = aluno.matriculas.flatMap((m) =>
    (m.turma.modulos[0]?.aulas ?? []).map((a) => ({
      ...a,
      turma: m.turma.nome,
      curso: m.turma.curso.nome,
      status: freqPorAula.get(a.id),
      passou: new Date(a.data) < new Date(),
    }))
  );

  const pagamentos = aluno.matriculas.flatMap((m) =>
    m.pagamentos.map((p) => ({
      ...p,
      turma: m.turma.nome,
      curso: m.turma.curso.nome,
    }))
  );
  const temPendente = pagamentos.some(
    (p) => p.status === "PENDENTE" || p.status === "ATRASADO"
  );
  const totalAberto = pagamentos
    .filter((p) => p.status === "PENDENTE")
    .reduce((s, p) => s + Number(p.valor), 0);
  const totalAtrasado = pagamentos
    .filter((p) => p.status === "ATRASADO")
    .reduce((s, p) => s + Number(p.valor), 0);
  const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <DashboardShell
      titulo={aluno.nome}
      corAccent={cor}
      userName={aluno.nome}
      papel="ALUNO"
      extra={
        <span className="text-sm font-normal text-gray-500">
          Matrícula {aluno.codigo}
        </span>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Frequência" value={`${pct}%`} icone="check-circle" cor={cor} />
        <StatCard
          label="Módulo"
          value={moduloNum ? `#${moduloNum}` : "—"}
          icone="calendar"
        />
        <StatCard
          label="Redações aprovadas"
          value={aluno.entregasRedacao.length}
          icone="pencil"
        />
        <StatCard label="Cursos ativos" value={aluno.matriculas.length} icone="book" />
      </div>

      {pct < FREQUENCIA_ALERTA_PERCENTUAL && (
        <div className="mb-4">
          <AlertBanner tipo="warn">
          Frequência abaixo de {FREQUENCIA_ALERTA_PERCENTUAL}%. Agende reposição com a
          secretaria.
        </AlertBanner>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Meus cursos">
          {aluno.matriculas.length === 0 ? (
            <EmptyState icone="book" titulo="Sem matrícula ativa" />
          ) : (
            <ul className="space-y-3">
              {aluno.matriculas.map((m) => {
                const pend = m.pagamentos.some(
                  (p) => p.status === "PENDENTE" || p.status === "ATRASADO"
                );
                return (
                  <li
                    key={m.id}
                    className="rounded-xl border border-gray-100 p-4"
                    style={{ borderLeftWidth: 4, borderLeftColor: CORES_CURSO[m.turma.curso.nome]?.primaria }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">Turma {m.turma.nome}</p>
                        <p className="text-xs text-gray-500">
                          {m.turma.diaSemana} · {m.turma.horaInicio}–{m.turma.horaFim}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <CursoBadge curso={m.turma.curso.nome} />
                        <Badge tom={pend ? "amber" : "green"}>
                          {pend ? "Pagamento pendente" : "Ativo"}
                        </Badge>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/aluno/cursos" className="mt-3 inline-block text-xs font-semibold text-indigo-600">
            Ver detalhes dos cursos →
          </Link>
        </Card>

        <Card title="Próximas aulas e chamada">
          {proximasAulas.length === 0 ? (
            <EmptyState icone="calendar" titulo="Sem aulas no módulo" />
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {proximasAulas.map((a) => (
                <li
                  key={a.id}
                  className={`flex items-center justify-between rounded-lg border-l-4 px-3 py-2 text-sm ${
                    a.status
                      ? corFrequencia(a.status)
                      : a.passou
                        ? "border-gray-200 bg-gray-50"
                        : "border-indigo-200 bg-indigo-50/50"
                  }`}
                >
                  <span>
                    {a.turma} · Aula {a.numero}
                    <span className="ml-1 text-xs opacity-70">
                      {new Date(a.data).toLocaleDateString("pt-BR")}
                    </span>
                  </span>
                  <span className="text-xs font-semibold uppercase">
                    {a.status
                      ? a.status.replace(/_/g, " ")
                      : a.passou
                        ? "Sem chamada"
                        : "Agendada"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Financeiro" className="mt-4">
        {pagamentos.length === 0 ? (
          <EmptyState icone="currency" titulo="Nenhum lançamento" />
        ) : (
          <>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  totalAtrasado > 0
                    ? "bg-red-50 text-red-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <p className="text-xs font-medium opacity-70">Em atraso</p>
                <p className="font-display text-lg font-bold">{brl(totalAtrasado)}</p>
              </div>
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <p className="text-xs font-medium opacity-70">A vencer</p>
                <p className="font-display text-lg font-bold">{brl(totalAberto)}</p>
              </div>
            </div>
            <ul className="divide-y divide-gray-100">
              {pagamentos.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{p.competencia}</p>
                    <p className="text-xs text-gray-500">
                      {p.turma} · {Number(p.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                  <Badge
                    tom={
                      p.status === "CONFIRMADO"
                        ? "green"
                        : p.status === "ATRASADO"
                          ? "red"
                          : "amber"
                    }
                  >
                    {p.status}
                  </Badge>
                </li>
              ))}
            </ul>
            {temPendente && (
              <a
                href={`https://wa.me/${WHATS_PIX.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Olá! Sou o aluno ${aluno.nome} (${aluno.codigo}) e gostaria de regularizar meu pagamento via PIX.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Regularizar via WhatsApp (PIX)
              </a>
            )}
          </>
        )}
      </Card>
    </DashboardShell>
  );
}

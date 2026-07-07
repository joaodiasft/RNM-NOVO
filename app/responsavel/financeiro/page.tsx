import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, Badge, EmptyState } from "@/components/DashboardShell";

const WHATS_PIX =
  process.env.WHATSAPP_PIX ||
  process.env.SMTP_USUARIO?.replace(/@.*/, "") ||
  "5562999999999";

export default async function ResponsavelFinanceiroPage() {
  const session = await auth();
  if (!session || session.user.papel !== "RESPONSAVEL") redirect("/login");

  // Usa o filho selecionado ou o primeiro vinculado
  const vinculo = await prisma.alunoResponsavel.findFirst({
    where: {
      responsavelId: session.user.id,
      ...(session.user.alunoSelecionadoId
        ? { alunoId: session.user.alunoSelecionadoId }
        : {}),
    },
    include: { aluno: true },
  });

  const pagamentos = vinculo
    ? await prisma.pagamento.findMany({
        where: { matriculaCurso: { alunoId: vinculo.alunoId } },
        include: {
          matriculaCurso: { include: { turma: { include: { curso: true } } } },
        },
        orderBy: { competencia: "desc" },
      })
    : [];

  const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const totalAtrasado = pagamentos
    .filter((p) => p.status === "ATRASADO")
    .reduce((s, p) => s + Number(p.valor), 0);
  const totalAberto = pagamentos
    .filter((p) => p.status === "PENDENTE")
    .reduce((s, p) => s + Number(p.valor), 0);
  const temPendente = totalAtrasado > 0 || totalAberto > 0;

  return (
    <DashboardShell titulo="Financeiro" userName={session.user.nome} papel="RESPONSAVEL">
      {vinculo && (
        <p className="mb-4 text-sm text-gray-600">
          Acompanhando: <strong>{vinculo.aluno.nome}</strong> ({vinculo.aluno.codigo})
        </p>
      )}
      <Card title="Pagamentos">
        {pagamentos.length === 0 ? (
          <EmptyState
            icone="currency"
            titulo="Nenhum pagamento encontrado"
            descricao="Os pagamentos das matrículas do seu filho aparecem aqui."
          />
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
                    <p className="font-medium text-gray-800">{p.competencia}</p>
                    <p className="text-xs text-gray-500">
                      {p.matriculaCurso.turma.curso.nome} — {brl(Number(p.valor))}
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
            {temPendente && vinculo && (
              <a
                href={`https://wa.me/${WHATS_PIX.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Olá! Sou responsável pelo aluno ${vinculo.aluno.nome} (${vinculo.aluno.codigo}) e gostaria de regularizar o pagamento via PIX.`
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

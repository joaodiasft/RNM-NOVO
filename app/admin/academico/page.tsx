export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { ADMIN_COR, CORES_CURSO } from "@/lib/utils/index";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/academico", label: "Acadêmico" },
  { href: "/admin/matriculas", label: "Matrículas" },
  { href: "/admin/frequencia", label: "Frequência" },
  { href: "/admin/redacao", label: "Redação" },
  { href: "/admin/financeiro", label: "Financeiro" },
  { href: "/admin/acessos", label: "Acessos Externos" },
  { href: "/admin/avisos", label: "Avisos" },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export default async function AcademicoPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const turmas = await prisma.turma.findMany({
    include: {
      curso: true,
      professores: { include: { professor: true } },
      modulos: { orderBy: { numero: "desc" }, take: 1, include: { aulas: true } },
      _count: { select: { matriculas: true } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <DashboardShell titulo="Gestão Acadêmica" corAccent={ADMIN_COR} userName={session.user.nome} papel="ADMIN" navItems={nav}>
      <div className="grid md:grid-cols-2 gap-4">
        {turmas.map((t) => {
          const cor = CORES_CURSO[t.curso.nome]?.primaria || ADMIN_COR;
          return (
            <Card key={t.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cor }} />
                <h3 className="font-semibold">{t.nome} — {CORES_CURSO[t.curso.nome]?.label}</h3>
              </div>
              <p className="text-sm text-gray-500">{t.diaSemana} {t.horaInicio}–{t.horaFim}</p>
              <p className="text-sm">Vagas: {t._count.matriculas}/{t.capacidade}</p>
              <p className="text-sm">Professores: {t.professores.map((p) => p.professor.nome).join(", ")}</p>
              <p className="text-sm">Aulas no módulo: {t.modulos[0]?.aulas.length ?? 0}</p>
            </Card>
          );
        })}
      </div>
    </DashboardShell>
  );
}

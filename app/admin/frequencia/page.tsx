export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { ADMIN_COR } from "@/lib/utils/index";
import { FormFrequencia } from "@/components/forms/FormFrequencia";

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

export default async function FrequenciaAdminPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const turmas = await prisma.turma.findMany({
    include: {
      curso: true,
      modulos: {
        orderBy: { numero: "desc" },
        take: 1,
        include: { aulas: { orderBy: { numero: "asc" } } },
      },
      matriculas: {
        where: { status: "ATIVA" },
        include: { aluno: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <DashboardShell titulo="Frequência" corAccent={ADMIN_COR} userName={session.user.nome} papel="ADMIN" navItems={nav}>
      <div className="space-y-6">
        {turmas.map((t) => {
          const modulo = t.modulos[0];
          const alunos = t.matriculas.map((m) => m.aluno);
          return (
            <Card key={t.id} title={`${t.nome} — ${t.curso.nome}`}>
              {!modulo ? (
                <p className="text-sm text-gray-500">Sem módulo ativo.</p>
              ) : (
                modulo.aulas.map((aula) => (
                  <div key={aula.id} className="mb-4">
                    <p className="text-sm font-medium mb-2">
                      Aula {aula.numero} — {new Date(aula.data).toLocaleDateString("pt-BR")}
                    </p>
                    <FormFrequencia
                      aulaId={aula.id}
                      alunos={alunos}
                      cursoRedacao={t.curso.nome === "REDACAO"}
                    />
                  </div>
                ))
              )}
            </Card>
          );
        })}
      </div>
    </DashboardShell>
  );
}

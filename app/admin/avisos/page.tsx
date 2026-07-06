import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, Badge, EmptyState } from "@/components/DashboardShell";
import { FormAviso } from "@/components/forms/FormAviso";

const LABEL_ALVO: Record<string, string> = {
  TODOS: "Todos",
  CURSO: "Curso",
  TURMA: "Turma",
  ALUNO: "Aluno",
};

export default async function AvisosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const [avisos, cursos, turmas, alunos] = await Promise.all([
    prisma.aviso.findMany({ orderBy: { criadoEm: "desc" }, take: 20 }),
    prisma.curso.findMany({ orderBy: { nome: "asc" } }),
    prisma.turma.findMany({
      where: { ativa: true },
      include: { curso: true },
      orderBy: { nome: "asc" },
    }),
    prisma.aluno.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <DashboardShell titulo="Avisos" userName={session.user.nome} papel="ADMIN">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Novo aviso"
          descricao="Direcione para todos, um curso, uma turma ou um aluno"
        >
          <FormAviso cursos={cursos} turmas={turmas} alunos={alunos} />
        </Card>
        <Card title="Publicados" descricao="Últimos 20 avisos">
          {avisos.length === 0 ? (
            <EmptyState icone="bell" titulo="Nenhum aviso publicado ainda" />
          ) : (
            <ul className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {avisos.map((a) => (
                <li key={a.id} className="rounded-xl border border-gray-100 px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900">{a.titulo}</p>
                    <Badge tom={a.publicoAlvo === "TODOS" ? "blue" : "amber"}>
                      {LABEL_ALVO[a.publicoAlvo] ?? a.publicoAlvo}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{a.mensagem}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(a.criadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

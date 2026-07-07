import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { FormUploadFoto } from "@/components/forms/FormUploadFoto";
import { FormControleAcessos } from "@/components/forms/FormControleAcessos";

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const [logs, alunos, professores] = await Promise.all([
    prisma.logAuditoria.findMany({
      orderBy: { timestamp: "desc" },
      take: 50,
    }),
    prisma.aluno.findMany({
      orderBy: { nome: "asc" },
      include: {
        matriculas: {
          where: { status: "ATIVA" },
          include: { turma: { include: { curso: true } } },
        },
      },
    }),
    prisma.professor.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <DashboardShell titulo="Configurações" userName={session.user.nome} papel="ADMIN">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Foto de perfil" descricao="Enviada para o Google Drive da escola">
          <FormUploadFoto tipo="admin" userId={session.user.id} />
        </Card>

        <Card
          title="Controle de acessos"
          descricao="Ative ou inative o login de alunos e professores"
          className="lg:col-span-2"
        >
          <FormControleAcessos
            alunos={alunos.map((a) => ({
              id: a.id,
              nome: a.nome,
              identificador: a.codigo,
              ativo: a.ativo,
              extra: a.matriculas.map((m) => m.turma.curso.nome).join(", ") || undefined,
            }))}
            professores={professores.map((p) => ({
              id: p.id,
              nome: p.nome,
              identificador: p.email,
              ativo: p.ativo,
            }))}
          />
        </Card>

        <Card
          title="Auditoria"
          descricao="Últimas 50 ações (espelho do Google Sheets)"
          className="lg:col-span-2"
        >
          {logs.length === 0 ? (
            <EmptyState icone="cog" titulo="Nenhum log registrado ainda" />
          ) : (
            <div className="max-h-96 space-y-1.5 overflow-y-auto pr-1 text-xs">
              {logs.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-wrap items-center gap-x-2 border-b border-gray-50 pb-1.5 text-gray-600"
                >
                  <span className="text-gray-400">
                    {l.timestamp.toLocaleString("pt-BR")}
                  </span>
                  <span className="font-semibold text-gray-800">{l.acao}</span>
                  <span>· {l.entidade}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

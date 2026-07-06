import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { FormUploadFoto } from "@/components/forms/FormUploadFoto";

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const logs = await prisma.logAuditoria.findMany({
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  return (
    <DashboardShell titulo="Configurações" userName={session.user.nome} papel="ADMIN">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Foto de perfil" descricao="Enviada para o Google Drive da escola">
          <FormUploadFoto tipo="admin" userId={session.user.id} />
        </Card>
        <Card title="Auditoria" descricao="Últimas 50 ações (espelho do Google Sheets)">
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

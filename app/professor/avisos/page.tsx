import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { avisosParaProfessor } from "@/lib/services/avisos";

export default async function ProfessorAvisosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "PROFESSOR") redirect("/login");

  const avisos = await avisosParaProfessor(session.user.id);

  return (
    <DashboardShell titulo="Avisos" userName={session.user.nome} papel="PROFESSOR">
      {avisos.length === 0 ? (
        <Card>
          <EmptyState
            icone="bell"
            titulo="Nenhum aviso por enquanto"
            descricao="Os comunicados gerais e os das suas turmas aparecem aqui."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {avisos.map((a) => (
            <Card key={a.id} title={a.titulo}>
              <p className="text-sm text-gray-700">{a.mensagem}</p>
              <p className="mt-2 text-xs text-gray-400">
                {new Date(a.criadoEm).toLocaleDateString("pt-BR")}
              </p>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

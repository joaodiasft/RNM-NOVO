import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { avisosParaAluno } from "@/lib/services/avisos";

export default async function AlunoAvisosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const avisos = await avisosParaAluno(session.user.id);

  return (
    <DashboardShell titulo="Avisos" userName={session.user.nome} papel="ALUNO">
      {avisos.length === 0 ? (
        <Card>
          <EmptyState
            icone="bell"
            titulo="Nenhum aviso por enquanto"
            descricao="Os comunicados da escola (gerais, do seu curso e da sua turma) aparecem aqui."
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

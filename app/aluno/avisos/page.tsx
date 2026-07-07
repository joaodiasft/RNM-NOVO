import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { ListaAvisos } from "@/components/ListaAvisos";
import { avisosParaAluno } from "@/lib/services/avisos";

export default async function AlunoAvisosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const avisos = await avisosParaAluno(session.user.id, 50);

  return (
    <DashboardShell titulo="Avisos" userName={session.user.nome} papel="ALUNO">
      <Card
        title="Mural de avisos"
        descricao="Marque como lido ao ler. Após 2 dias sem resposta, fica como não lido."
      >
        {avisos.length === 0 ? (
          <EmptyState
            icone="bell"
            titulo="Nenhum aviso por enquanto"
            descricao="Comunicados gerais, do curso e da turma aparecem aqui."
          />
        ) : (
          <ListaAvisos
            avisos={avisos}
            usuarioId={session.user.id}
            papel="ALUNO"
          />
        )}
      </Card>
    </DashboardShell>
  );
}

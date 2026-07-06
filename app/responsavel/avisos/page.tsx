import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { alunoDoResponsavel } from "@/lib/api-helpers";
import { avisosParaAluno } from "@/lib/services/avisos";

export default async function ResponsavelAvisosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "RESPONSAVEL") redirect("/login");

  const alunoId = await alunoDoResponsavel(
    session.user.id,
    session.user.alunoSelecionadoId
  );
  const avisos = alunoId ? await avisosParaAluno(alunoId) : [];

  return (
    <DashboardShell titulo="Avisos" userName={session.user.nome} papel="RESPONSAVEL">
      {avisos.length === 0 ? (
        <Card>
          <EmptyState
            icone="bell"
            titulo="Nenhum aviso por enquanto"
            descricao="Os comunicados da escola sobre o seu filho aparecem aqui."
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

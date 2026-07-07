import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { FormAcessoExterno } from "@/components/forms/FormAcessoExterno";
import { ListaAcessosAdmin } from "@/components/ListaAcessosAdmin";

export default async function AcessosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ADMIN") redirect("/login");

  const [alunos, acessos] = await Promise.all([
    prisma.aluno.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.acessoExterno.findMany({
      include: { aluno: true },
      orderBy: { plataforma: "asc" },
    }),
  ]);

  return (
    <DashboardShell titulo="Acessos Externos" userName={session.user.nome} papel="ADMIN">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Cadastrar credenciais"
          descricao="A senha é criptografada e exibida apenas para o aluno"
        >
          <FormAcessoExterno alunos={alunos} />
        </Card>
        <Card
          title={`Acessos cadastrados (${acessos.length})`}
          descricao="Busque e remova credenciais quando necessário"
        >
          {acessos.length === 0 ? (
            <EmptyState
              icone="key"
              titulo="Nenhum acesso cadastrado"
              descricao="Cadastre as credenciais de plataformas externas (SOFIA, Coredação...)."
            />
          ) : (
            <ListaAcessosAdmin
              acessos={acessos.map((a) => ({
                id: a.id,
                plataforma: a.plataforma,
                email: a.email,
                urlAcesso: a.urlAcesso,
                aluno: { nome: a.aluno.nome, codigo: a.aluno.codigo },
              }))}
            />
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

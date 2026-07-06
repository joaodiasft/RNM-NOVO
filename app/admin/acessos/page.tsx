import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { FormAcessoExterno } from "@/components/forms/FormAcessoExterno";

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
        <Card title={`Acessos cadastrados (${acessos.length})`}>
          {acessos.length === 0 ? (
            <EmptyState
              icone="key"
              titulo="Nenhum acesso cadastrado"
              descricao="Cadastre as credenciais de plataformas externas (SOFIA, Coredação...)."
            />
          ) : (
            <ul className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {acessos.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-gray-100 px-3.5 py-2.5 text-sm"
                >
                  <p className="font-medium text-gray-900">
                    {a.plataforma}{" "}
                    <span className="font-normal text-gray-500">— {a.aluno.nome}</span>
                  </p>
                  <p className="truncate text-xs text-gray-500">{a.email}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

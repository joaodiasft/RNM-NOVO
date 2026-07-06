import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card, EmptyState } from "@/components/DashboardShell";
import { CORES_CURSO } from "@/lib/utils/index";
import { descriptografar } from "@/lib/crypto";
import { Icon } from "@/components/ui/Icons";

export default async function AlunoAcessosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const [acessos, aluno, mat] = await Promise.all([
    prisma.acessoExterno.findMany({ where: { alunoId: session.user.id } }),
    prisma.aluno.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.matriculaCurso.findFirst({
      where: { alunoId: session.user.id, status: "ATIVA" },
      include: { turma: { include: { curso: true } } },
    }),
  ]);

  const cor = mat ? CORES_CURSO[mat.turma.curso.nome]?.primaria : undefined;

  return (
    <DashboardShell
      titulo="Acessos Externos"
      corAccent={cor}
      userName={aluno.nome}
      papel="ALUNO"
    >
      {acessos.length === 0 ? (
        <Card>
          <EmptyState
            icone="key"
            titulo="Nenhum acesso cadastrado ainda"
            descricao="Quando a escola cadastrar suas credenciais de plataformas externas, elas aparecem aqui."
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {acessos.map((a) => (
            <Card key={a.id} title={a.plataforma}>
              <div className="space-y-2 text-sm">
                <a
                  href={a.urlAcesso}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-blue-600 underline underline-offset-2"
                >
                  <Icon name="key" className="h-4 w-4" />
                  Abrir plataforma
                </a>
                <p className="text-gray-700">
                  <span className="text-gray-400">E-mail:</span> {a.email}
                </p>
                <p className="text-gray-700">
                  <span className="text-gray-400">Senha:</span>{" "}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
                    {descriptografar(a.senha)}
                  </code>
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

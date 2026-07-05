import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";
import { CORES_CURSO } from "@/lib/utils/index";
import { descriptografar } from "@/lib/crypto";

export default async function AlunoAcessosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const acessos = await prisma.acessoExterno.findMany({
    where: { alunoId: session.user.id },
  });

  const aluno = await prisma.aluno.findUniqueOrThrow({ where: { id: session.user.id } });
  const mat = await prisma.matriculaCurso.findFirst({
    where: { alunoId: session.user.id, status: "ATIVA" },
    include: { turma: { include: { curso: true } } },
  });
  const cor = mat ? CORES_CURSO[mat.turma.curso.nome]?.primaria : "#D6336C";

  return (
    <DashboardShell titulo="Acessos Externos" corAccent={cor} userName={aluno.nome} papel="ALUNO" navItems={[
      { href: "/aluno", label: "Dashboard" },
      { href: "/aluno/acessos", label: "Acessos Externos" },
    ]}>
      {acessos.length === 0 ? (
        <Card><p className="text-sm text-gray-500">Nenhum acesso cadastrado ainda.</p></Card>
      ) : (
        acessos.map((a) => (
          <Card key={a.id} title={a.plataforma} className="mb-4">
            <p className="text-sm"><a href={a.urlAcesso} target="_blank" rel="noreferrer" className="underline">{a.urlAcesso}</a></p>
            <p className="text-sm">E-mail: {a.email}</p>
            <p className="text-sm">Senha: {descriptografar(a.senha)}</p>
          </Card>
        ))
      )}
    </DashboardShell>
  );
}

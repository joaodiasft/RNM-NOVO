export const runtime = "edge";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";

export default async function AlunoAvisosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "ALUNO") redirect("/login");

  const avisos = await prisma.aviso.findMany({
    where: { OR: [{ publicoAlvo: "TODOS" }, { alunoId: session.user.id }] },
    orderBy: { criadoEm: "desc" },
    take: 20,
  });

  return (
    <DashboardShell titulo="Avisos" corAccent="#D6336C" userName={session.user.nome} papel="ALUNO" navItems={[
      { href: "/aluno", label: "Dashboard" },
      { href: "/aluno/avisos", label: "Avisos" },
    ]}>
      {avisos.map((a) => (
        <Card key={a.id} title={a.titulo} className="mb-4">
          <p className="text-sm">{a.mensagem}</p>
          <p className="text-xs text-gray-400 mt-2">{new Date(a.criadoEm).toLocaleDateString("pt-BR")}</p>
        </Card>
      ))}
    </DashboardShell>
  );
}

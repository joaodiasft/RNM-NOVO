import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell, Card } from "@/components/DashboardShell";

export default async function ResponsavelAvisosPage() {
  const session = await auth();
  if (!session || session.user.papel !== "RESPONSAVEL") redirect("/login");

  const avisos = await prisma.aviso.findMany({
    where: { publicoAlvo: "TODOS" },
    orderBy: { criadoEm: "desc" },
    take: 20,
  });

  return (
    <DashboardShell titulo="Avisos" corAccent="#212529" userName={session.user.nome} papel="RESPONSAVEL" navItems={[
      { href: "/responsavel", label: "Dashboard" },
      { href: "/responsavel/avisos", label: "Avisos" },
    ]}>
      {avisos.map((a) => (
        <Card key={a.id} title={a.titulo} className="mb-4">
          <p className="text-sm">{a.mensagem}</p>
        </Card>
      ))}
    </DashboardShell>
  );
}

export const runtime = "edge";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rotas: Record<string, string> = {
    ADMIN: "/admin",
    PROFESSOR: "/professor",
    ALUNO: "/aluno",
    RESPONSAVEL: "/responsavel",
  };

  redirect(rotas[session.user.papel] || "/login");
}

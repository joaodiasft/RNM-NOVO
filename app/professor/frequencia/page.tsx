import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Professor não faz chamada — frequência é exclusiva do admin. */
export default async function ProfessorFrequenciaPage() {
  const session = await auth();
  if (!session || session.user.papel !== "PROFESSOR") redirect("/login");
  redirect("/professor");
}

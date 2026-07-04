import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { PapelUsuario } from "@prisma/client";
import { registrarLog } from "@/lib/logging/sheets";

export async function requireApiAuth(papeis?: PapelUsuario[]) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ erro: "Não autorizado" }, { status: 401 }) };
  }
  if (papeis && !papeis.includes(session.user.papel)) {
    registrarLog({
      nivel: "WARN",
      categoria: "AUTH",
      acao: "ACESSO_NEGADO",
      usuarioId: session.user.id,
      papel: session.user.papel,
    });
    return { error: NextResponse.json({ erro: "Sem permissão" }, { status: 403 }) };
  }
  return { session };
}

export function handleApiError(err: unknown) {
  const message = err instanceof Error ? err.message : "Erro interno";
  console.error(err);
  return NextResponse.json({ erro: message }, { status: 400 });
}

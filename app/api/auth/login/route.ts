import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { loginSchema, validar } from "@/lib/validacao";

const rotas: Record<string, string> = {
  ADMIN: "/admin",
  PROFESSOR: "/professor",
  ALUNO: "/aluno",
  RESPONSAVEL: "/responsavel",
};

function mensagemErro(result: unknown): string | null {
  if (typeof result !== "string") return null;
  if (result.includes("error=CredentialsSignin")) return "Credenciais inválidas";
  if (result.includes("error=")) return "Não foi possível entrar. Tente novamente.";
  return null;
}

export async function POST(request: Request) {
  try {
    const bruto = await request.json().catch(() => null);
    // O ADMIN envia `ticket` (JWT de 2 min) no lugar da senha
    const body = validar(loginSchema, {
      perfil: bruto?.perfil,
      identificador: bruto?.identificador,
      senha: bruto?.ticket || bruto?.senha,
    });
    if (body.erro !== null) {
      return NextResponse.json({ erro: body.erro }, { status: 400 });
    }
    const { perfil, identificador, senha } = body.data;

    const destino = rotas[perfil] || "/";

    const result = await signIn("credentials", {
      perfil,
      identificador,
      senha,
      redirect: false,
      redirectTo: destino,
    });

    const erro = mensagemErro(result);
    if (erro) {
      return NextResponse.json({ erro }, { status: 401 });
    }

    return NextResponse.json({ ok: true, redirect: destino });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ erro: "Credenciais inválidas" }, { status: 401 });
    }
    console.error("[auth/login]", error);
    return NextResponse.json(
      { erro: "Erro ao entrar. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}

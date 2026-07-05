import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

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
    const body = await request.json();
    const perfil = body.perfil as string;
    const identificador = body.identificador as string;
    const senha = (body.ticket as string) || (body.senha as string);

    if (!perfil || !identificador || !senha) {
      return NextResponse.json({ erro: "Dados incompletos" }, { status: 400 });
    }

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

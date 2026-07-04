import { NextResponse } from "next/server";
import { iniciarLoginAdmin } from "@/lib/auth/admin-token";

export async function POST(request: Request) {
  const { email, senha } = await request.json();
  if (!email || !senha) {
    return NextResponse.json({ erro: "Dados incompletos" }, { status: 400 });
  }
  const result = await iniciarLoginAdmin(email, senha);
  if (!result.ok) {
    return NextResponse.json({ erro: result.erro }, { status: 401 });
  }
  return NextResponse.json({
    pendingToken: result.pendingToken,
    email: result.email,
  });
}

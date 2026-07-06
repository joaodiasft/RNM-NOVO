import { NextResponse } from "next/server";
import { iniciarLoginAdmin } from "@/lib/auth/admin-token";
import { adminLoginSchema, validar } from "@/lib/validacao";

export async function POST(request: Request) {
  const bruto = await request.json().catch(() => null);
  const body = validar(adminLoginSchema, bruto);
  if (body.erro !== null) {
    return NextResponse.json({ erro: body.erro }, { status: 400 });
  }
  const result = await iniciarLoginAdmin(body.data.email, body.data.senha);
  if (!result.ok) {
    return NextResponse.json({ erro: result.erro }, { status: 401 });
  }
  return NextResponse.json({
    pendingToken: result.pendingToken,
    email: result.email,
  });
}

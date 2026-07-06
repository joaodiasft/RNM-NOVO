import { NextResponse } from "next/server";
import { validarTokenAdmin } from "@/lib/auth/admin-token";
import { adminVerifySchema, validar } from "@/lib/validacao";

export async function POST(request: Request) {
  const bruto = await request.json().catch(() => null);
  const body = validar(adminVerifySchema, bruto);
  if (body.erro !== null) {
    return NextResponse.json({ erro: body.erro }, { status: 400 });
  }
  const result = await validarTokenAdmin(body.data.pendingToken, body.data.codigo);
  if (!result.ok) {
    return NextResponse.json({ erro: result.erro }, { status: 401 });
  }
  return NextResponse.json({
    email: result.admin.email,
    ticket: result.ticket,
  });
}

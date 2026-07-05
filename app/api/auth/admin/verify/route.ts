import { NextResponse } from "next/server";
import { validarTokenAdmin } from "@/lib/auth/admin-token";

export async function POST(request: Request) {
  const { pendingToken, codigo } = await request.json();
  if (!pendingToken || !codigo) {
    return NextResponse.json({ erro: "Dados incompletos" }, { status: 400 });
  }
  const result = await validarTokenAdmin(pendingToken, codigo);
  if (!result.ok) {
    return NextResponse.json({ erro: result.erro }, { status: 401 });
  }
  return NextResponse.json({
    email: result.admin.email,
    ticket: result.ticket,
  });
}

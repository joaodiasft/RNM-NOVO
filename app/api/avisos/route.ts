import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { marcarAvisoLidoSchema, validar } from "@/lib/validacao";

/** Marca um aviso como lido pelo usuário logado. */
export async function POST(request: Request) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  try {
    const bruto = await request.json().catch(() => null);
    const body = validar(marcarAvisoLidoSchema, bruto);
    if (body.erro !== null) {
      return NextResponse.json({ erro: body.erro }, { status: 400 });
    }

    const aviso = await prisma.aviso.findUnique({
      where: { id: body.data.avisoId },
      select: { id: true },
    });
    if (!aviso) {
      return NextResponse.json({ erro: "Aviso não encontrado" }, { status: 404 });
    }

    const leitura = await prisma.avisoLeitura.upsert({
      where: {
        avisoId_usuarioId: {
          avisoId: body.data.avisoId,
          usuarioId: session!.user.id,
        },
      },
      update: {},
      create: {
        avisoId: body.data.avisoId,
        usuarioId: session!.user.id,
        papel: session!.user.papel,
      },
    });

    return NextResponse.json({ ok: true, lidoEm: leitura.lidoEm });
  } catch (err) {
    return handleApiError(err);
  }
}

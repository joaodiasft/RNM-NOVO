export const runtime = "edge";

import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import { uploadFotoPerfil } from "@/lib/storage/drive";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/logging/sheets";

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth([
    "ADMIN",
    "ALUNO",
    "PROFESSOR",
    "RESPONSAVEL",
  ]);
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tipo = (formData.get("tipo") as string) || "aluno";
    const userId = (formData.get("userId") as string) || session!.user.id;

    if (!file) {
      return NextResponse.json({ erro: "Arquivo obrigatório" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFotoPerfil(
      buffer,
      file.type || "image/jpeg",
      tipo,
      userId
    );

    if (!result) {
      return NextResponse.json(
        { erro: "Drive não configurado ou falha no upload" },
        { status: 503 }
      );
    }

    const updateData = { fotoUrl: result.url };
    switch (tipo) {
      case "aluno":
        await prisma.aluno.update({ where: { id: userId }, data: updateData });
        break;
      case "professor":
        await prisma.professor.update({ where: { id: userId }, data: updateData });
        break;
      case "responsavel":
        await prisma.responsavel.update({ where: { id: userId }, data: updateData });
        break;
      case "admin":
        await prisma.admin.update({ where: { id: userId }, data: updateData });
        break;
    }

    registrarLog({
      nivel: "INFO",
      categoria: "STORAGE",
      acao: "FOTO_UPLOAD",
      usuarioId: session!.user.id,
      papel: session!.user.papel,
      detalhes: { tipo, userId, fileId: result.fileId },
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

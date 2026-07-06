import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError, respostaProibida } from "@/lib/api-helpers";
import { uploadFotoPerfil } from "@/lib/storage/drive";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/logging/sheets";

const TIPOS_VALIDOS = ["aluno", "professor", "responsavel", "admin"] as const;
const MIMES_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAX = 4 * 1024 * 1024; // 4 MB

const TIPO_POR_PAPEL: Record<string, (typeof TIPOS_VALIDOS)[number]> = {
  ALUNO: "aluno",
  PROFESSOR: "professor",
  RESPONSAVEL: "responsavel",
  ADMIN: "admin",
};

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
    const papel = session!.user.papel;

    // Segurança: só o ADMIN pode enviar foto para outro usuário.
    // Os demais têm tipo e id forçados para o próprio cadastro.
    let tipo: string;
    let userId: string;
    if (papel === "ADMIN") {
      tipo = (formData.get("tipo") as string) || "admin";
      userId = (formData.get("userId") as string) || session!.user.id;
      if (!TIPOS_VALIDOS.includes(tipo as (typeof TIPOS_VALIDOS)[number])) {
        return NextResponse.json({ erro: "Tipo inválido" }, { status: 400 });
      }
    } else {
      tipo = TIPO_POR_PAPEL[papel];
      userId = session!.user.id;
      const tipoEnviado = formData.get("tipo");
      const idEnviado = formData.get("userId");
      if (
        (tipoEnviado && tipoEnviado !== tipo) ||
        (idEnviado && idEnviado !== userId)
      ) {
        return respostaProibida("Você só pode alterar a própria foto");
      }
    }

    if (!file) {
      return NextResponse.json({ erro: "Arquivo obrigatório" }, { status: 400 });
    }
    if (!MIMES_PERMITIDOS.includes(file.type)) {
      return NextResponse.json(
        { erro: "Formato inválido — envie JPG, PNG ou WebP" },
        { status: 400 }
      );
    }
    if (file.size > TAMANHO_MAX) {
      return NextResponse.json(
        { erro: "Arquivo muito grande (máximo 4 MB)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFotoPerfil(buffer, file.type, tipo, userId);

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
      papel,
      detalhes: { tipo, userId, fileId: result.fileId },
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

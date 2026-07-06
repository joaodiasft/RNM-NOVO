import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { hashSenha, verificarSenha } from "@/lib/crypto";
import { registrarLog } from "@/lib/logging/sheets";
import { trocarSenhaSchema, validar } from "@/lib/validacao";

/**
 * Troca de senha do próprio usuário (qualquer perfil).
 * Exige a senha atual — validação 100% no backend.
 */
export async function POST(request: Request) {
  const { session, error } = await requireApiAuth();
  if (error) return error;

  try {
    const bruto = await request.json().catch(() => null);
    const body = validar(trocarSenhaSchema, bruto);
    if (body.erro !== null) {
      return NextResponse.json({ erro: body.erro }, { status: 400 });
    }
    const { senhaAtual, novaSenha } = body.data;
    const { id, papel } = session!.user;

    let senhaHashAtual: string | null = null;
    switch (papel) {
      case "ALUNO":
        senhaHashAtual =
          (await prisma.aluno.findUnique({ where: { id } }))?.senhaHash ?? null;
        break;
      case "PROFESSOR":
        senhaHashAtual =
          (await prisma.professor.findUnique({ where: { id } }))?.senhaHash ?? null;
        break;
      case "RESPONSAVEL":
        senhaHashAtual =
          (await prisma.responsavel.findUnique({ where: { id } }))?.senhaHash ?? null;
        break;
      case "ADMIN":
        senhaHashAtual =
          (await prisma.admin.findUnique({ where: { id } }))?.senhaHash ?? null;
        break;
    }

    if (!senhaHashAtual || !(await verificarSenha(senhaAtual, senhaHashAtual))) {
      registrarLog({
        nivel: "WARN",
        categoria: "AUTH",
        acao: "TROCA_SENHA_FALHA",
        usuarioId: id,
        papel,
      });
      return NextResponse.json({ erro: "Senha atual incorreta" }, { status: 401 });
    }

    const novoHash = await hashSenha(novaSenha);
    switch (papel) {
      case "ALUNO":
        await prisma.aluno.update({ where: { id }, data: { senhaHash: novoHash } });
        break;
      case "PROFESSOR":
        await prisma.professor.update({
          where: { id },
          data: { senhaHash: novoHash },
        });
        break;
      case "RESPONSAVEL":
        await prisma.responsavel.update({
          where: { id },
          data: { senhaHash: novoHash },
        });
        break;
      case "ADMIN":
        await prisma.admin.update({ where: { id }, data: { senhaHash: novoHash } });
        break;
    }

    registrarLog({
      nivel: "INFO",
      categoria: "AUTH",
      acao: "SENHA_ALTERADA",
      usuarioId: id,
      papel,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { registrarLog } from "@/lib/logging/sheets";
import { alterarStatusUsuarioSchema, validar } from "@/lib/validacao";

/**
 * Controle de acessos — somente ADMIN.
 * Ativa/inativa alunos e professores (bloqueia o login imediatamente,
 * pois o authorize checa o campo `ativo`).
 */
export async function PATCH(request: Request) {
  const { session, error } = await requireApiAuth(["ADMIN"]);
  if (error) return error;

  try {
    const bruto = await request.json().catch(() => null);
    const body = validar(alterarStatusUsuarioSchema, bruto);
    if (body.erro !== null) {
      return NextResponse.json({ erro: body.erro }, { status: 400 });
    }
    const { tipo, id, ativo } = body.data;

    const usuario =
      tipo === "aluno"
        ? await prisma.aluno.update({ where: { id }, data: { ativo } })
        : await prisma.professor.update({ where: { id }, data: { ativo } });

    registrarLog({
      nivel: "WARN",
      categoria: "USUARIO",
      acao: ativo ? "ACESSO_ATIVADO" : "ACESSO_INATIVADO",
      usuarioId: session!.user.id,
      papel: session!.user.papel,
      entidade: tipo === "aluno" ? "Aluno" : "Professor",
      entidadeId: id,
    });

    return NextResponse.json(usuario);
  } catch (err) {
    return handleApiError(err);
  }
}

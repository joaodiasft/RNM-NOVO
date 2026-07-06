import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import {
  criarTurma,
  criarProfessor,
  gerarProximoModulo,
} from "@/lib/services/academico";
import {
  novaTurmaSchema,
  novoProfessorSchema,
  gerarModuloSchema,
  validar,
} from "@/lib/validacao";

export async function POST(request: Request) {
  const { session, error } = await requireApiAuth(["ADMIN"]);
  if (error) return error;

  try {
    const bruto = (await request.json().catch(() => null)) as {
      acao?: string;
    } | null;
    if (!bruto?.acao) {
      return NextResponse.json({ erro: "Ação inválida" }, { status: 400 });
    }

    switch (bruto.acao) {
      case "criar_turma": {
        const body = validar(novaTurmaSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });
        return NextResponse.json(
          await criarTurma({
            ...body.data,
            usuarioId: session!.user.id,
            papel: session!.user.papel,
          })
        );
      }

      case "criar_professor": {
        const body = validar(novoProfessorSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });
        return NextResponse.json(
          await criarProfessor({
            nome: body.data.nome,
            email: body.data.email,
            senha: body.data.senha,
            turmaId: body.data.turmaId || undefined,
            usuarioId: session!.user.id,
            papel: session!.user.papel,
          })
        );
      }

      case "gerar_modulo": {
        const body = validar(gerarModuloSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });
        return NextResponse.json(
          await gerarProximoModulo({
            turmaId: body.data.turmaId,
            mesReferencia: body.data.mesReferencia,
            usuarioId: session!.user.id,
            papel: session!.user.papel,
          })
        );
      }

      default:
        return NextResponse.json({ erro: "Ação inválida" }, { status: 400 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}

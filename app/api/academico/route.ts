import { NextResponse } from "next/server";
import { requireApiAuth, handleApiError } from "@/lib/api-helpers";
import {
  criarTurma,
  criarProfessor,
  gerarProximoModulo,
  atualizarAula,
} from "@/lib/services/academico";
import { prisma } from "@/lib/prisma";
import {
  novaTurmaSchema,
  novoProfessorSchema,
  gerarModuloSchema,
  aulaTemaSchema,
  promocaoSchema,
  alternarPromocaoSchema,
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

      // Admin define tema e material (PDF) de cada aula
      case "atualizar_aula": {
        const body = validar(aulaTemaSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });
        return NextResponse.json(
          await atualizarAula({
            aulaId: body.data.aulaId,
            conteudo: body.data.conteudo || undefined,
            materialUrl: body.data.materialUrl ?? undefined,
            usuarioId: session!.user.id,
            papel: session!.user.papel,
          })
        );
      }

      case "criar_promocao": {
        const body = validar(promocaoSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });
        const promocao = await prisma.promocao.create({
          data: {
            titulo: body.data.titulo,
            descricao: body.data.descricao || null,
            cursoId: body.data.cursoId || null,
            percentualDesconto: body.data.percentualDesconto ?? 0,
            dataInicio: new Date(body.data.dataInicio + "T00:00:00"),
            dataFim: new Date(body.data.dataFim + "T23:59:59"),
          },
        });
        return NextResponse.json(promocao);
      }

      case "alternar_promocao": {
        const body = validar(alternarPromocaoSchema, bruto);
        if (body.erro !== null) return NextResponse.json({ erro: body.erro }, { status: 400 });
        const promocao = await prisma.promocao.update({
          where: { id: body.data.promocaoId },
          data: { ativo: body.data.ativo },
        });
        return NextResponse.json(promocao);
      }

      default:
        return NextResponse.json({ erro: "Ação inválida" }, { status: 400 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}

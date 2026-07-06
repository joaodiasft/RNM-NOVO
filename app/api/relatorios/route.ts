import { NextResponse } from "next/server";
import {
  requireApiAuth,
  respostaProibida,
  professorLecionaTurma,
} from "@/lib/api-helpers";
import {
  relatorioTurmaProfessor,
  relatorioAdminFinanceiro,
  exportarRelatorioTurmaXlsx,
} from "@/lib/services/relatorios";

export async function GET(request: Request) {
  const { session, error } = await requireApiAuth(["ADMIN", "PROFESSOR"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const turmaId = searchParams.get("turmaId");
  const formato = searchParams.get("formato");

  if (tipo === "turma" && turmaId) {
    // Professor só exporta relatórios das próprias turmas
    if (session!.user.papel === "PROFESSOR") {
      const leciona = await professorLecionaTurma(session!.user.id, turmaId);
      if (!leciona) return respostaProibida("Você não leciona nesta turma");
    }

    if (formato === "xlsx") {
      const buffer = await exportarRelatorioTurmaXlsx(turmaId);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=relatorio-${turmaId}.xlsx`,
        },
      });
    }
    return NextResponse.json(await relatorioTurmaProfessor(turmaId));
  }

  if (tipo === "financeiro") {
    if (session!.user.papel !== "ADMIN") return respostaProibida();
    return NextResponse.json(await relatorioAdminFinanceiro());
  }

  return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 });
}

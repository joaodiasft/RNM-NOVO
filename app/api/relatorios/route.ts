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
import { gerarPdfPrimeiroAcesso } from "@/lib/services/pdf-primeiro-acesso";
import { gerarPdfRelatorioAluno } from "@/lib/services/pdf-relatorio-aluno";
import { alunoPertenceAoResponsavel } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { session, error } = await requireApiAuth([
    "ADMIN",
    "PROFESSOR",
    "RESPONSAVEL",
  ]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const turmaId = searchParams.get("turmaId");
  const formato = searchParams.get("formato");

  if (tipo === "turma" && turmaId) {
    // Somente admin e professor (das próprias turmas)
    if (session!.user.papel === "RESPONSAVEL") return respostaProibida();
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

  const alunoId = searchParams.get("alunoId");

  // Relatório individual completo — para entregar ao pai/responsável.
  // ADMIN: qualquer aluno. RESPONSÁVEL: somente filho vinculado (checado no banco).
  if (tipo === "aluno" && alunoId) {
    const papel = session!.user.papel;
    if (papel === "RESPONSAVEL") {
      const vinculado = await alunoPertenceAoResponsavel(session!.user.id, alunoId);
      if (!vinculado) return respostaProibida("Aluno não vinculado a você");
    } else if (papel !== "ADMIN") {
      return respostaProibida();
    }
    const bytes = await gerarPdfRelatorioAluno(alunoId);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=relatorio-aluno-${alunoId}.pdf`,
      },
    });
  }

  if (tipo === "primeiro-acesso" && alunoId) {
    if (session!.user.papel !== "ADMIN") return respostaProibida();
    if (formato === "pdf") {
      const bytes = await gerarPdfPrimeiroAcesso(alunoId);
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=primeiro-acesso-${alunoId}.pdf`,
        },
      });
    }
    return NextResponse.json({ erro: "Use formato=pdf" }, { status: 400 });
  }

  return NextResponse.json({ erro: "Parâmetros inválidos" }, { status: 400 });
}

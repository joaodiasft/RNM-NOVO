import { NomeCurso } from "@prisma/client";
import { CORES_CURSO as CORES } from "@/lib/constants/cores";

export const CORES_CURSO: Record<
  NomeCurso,
  { primaria: string; clara: string; escura: string; label: string }
> = CORES;

export const ADMIN_COR = "#212529";

export const DIAS_SEMANA: Record<string, number> = {
  DOMINGO: 0,
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
};

export const STATUS_FREQUENCIA_REDACAO = [
  "FALTA",
  "FALTA_JUSTIFICADA",
  "PRESENTE",
  "REPOSICAO_DATA",
  "REPOSICAO_TURMA_DATA",
] as const;

export const STATUS_FREQUENCIA_SIMPLES = [
  "FALTA",
  "FALTA_JUSTIFICADA",
  "PRESENTE",
] as const;

export const FREQUENCIA_ALERTA_PERCENTUAL = 75;

export function statusContaPresenca(status: string): boolean {
  return ["PRESENTE", "REPOSICAO_DATA", "REPOSICAO_TURMA_DATA"].includes(
    status
  );
}

export function calcularPercentualFrequencia(
  registros: { status: string }[]
): number {
  if (registros.length === 0) return 100;
  const presentes = registros.filter((r) =>
    statusContaPresenca(r.status)
  ).length;
  return Math.round((presentes / registros.length) * 100);
}

export function proximaDataDiaSemana(
  diaSemana: string,
  aPartirDe: Date,
  offsetSemanas = 0
): Date {
  const alvo = DIAS_SEMANA[diaSemana] ?? 1;
  const data = new Date(aPartirDe);
  data.setHours(12, 0, 0, 0);
  const atual = data.getDay();
  let diff = alvo - atual;
  if (diff < 0) diff += 7;
  diff += offsetSemanas * 7;
  data.setDate(data.getDate() + diff);
  return data;
}

export async function gerarCodigoAluno(ano: number): Promise<string> {
  const { prisma } = await import("@/lib/prisma");
  const seq = await prisma.sequenciaCodigo.upsert({
    where: { id: "aluno" },
    create: { id: "aluno", ano, valor: 1 },
    update: {},
  });

  let valor = seq.valor;
  if (seq.ano !== ano) {
    await prisma.sequenciaCodigo.update({
      where: { id: "aluno" },
      data: { ano, valor: 1 },
    });
    valor = 1;
  } else {
    await prisma.sequenciaCodigo.update({
      where: { id: "aluno" },
      data: { valor: { increment: 1 } },
    });
    valor = seq.valor + 1;
  }

  return `RNM${ano}-${String(valor).padStart(4, "0")}`;
}

export async function gerarModuloAulas(
  turmaId: string,
  diaSemana: string,
  numeroModulo: number,
  mesReferencia: Date
): Promise<{ data: Date; numero: number }[]> {
  const aulas: { data: Date; numero: number }[] = [];
  const inicio = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1);
  for (let i = 0; i < 4; i++) {
    aulas.push({
      data: proximaDataDiaSemana(diaSemana, inicio, i),
      numero: i + 1,
    });
  }
  return aulas;
}

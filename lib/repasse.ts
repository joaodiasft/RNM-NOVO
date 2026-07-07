import type { NomeCurso } from "@prisma/client";

/** Percentual da escola (administrativo) por curso — resto vai ao professor. */
export function percentuaisRepasse(curso: NomeCurso): {
  escola: number;
  professor: number;
} {
  switch (curso) {
    case "EXATAS":
      return { escola: 30, professor: 70 };
    case "MATEMATICA":
      return { escola: 20, professor: 80 };
    case "REDACAO":
    default:
      return { escola: 100, professor: 0 };
  }
}

export function calcularRepasse(valor: number, curso: NomeCurso) {
  const pct = percentuaisRepasse(curso);
  const valorEscola = Math.round(valor * (pct.escola / 100) * 100) / 100;
  const valorProfessor = Math.round((valor - valorEscola) * 100) / 100;
  return {
    valorEscola,
    valorProfessor,
    percentualEscola: pct.escola,
    percentualProfessor: pct.professor,
  };
}

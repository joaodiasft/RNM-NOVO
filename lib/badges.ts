/**
 * Badges automáticos do aluno — calculados no servidor a partir dos
 * dados reais (frequência, redações aprovadas, notas, financeiro).
 * Nada é gravado: se o desempenho muda, o badge aparece/some sozinho.
 */

export interface BadgeAluno {
  id: string;
  titulo: string;
  descricao: string;
  emoji: string;
  cor: string; // cor do chip
}

export interface DadosBadges {
  pctFrequencia: number;
  totalRegistrosFrequencia: number;
  totalRedacoesAprovadas: number;
  melhorNota: number | null; // maior nota (professora) 0-1000
  semAtrasados: boolean;
  temPagamentos: boolean;
  cursosAtivos: number;
}

export function calcularBadges(d: DadosBadges): BadgeAluno[] {
  const badges: BadgeAluno[] = [];

  if (d.totalRegistrosFrequencia >= 4 && d.pctFrequencia === 100) {
    badges.push({
      id: "presenca-ouro",
      titulo: "Presença de Ouro",
      descricao: "100% de frequência",
      emoji: "🏆",
      cor: "#f59e0b",
    });
  } else if (d.totalRegistrosFrequencia >= 4 && d.pctFrequencia >= 90) {
    badges.push({
      id: "assiduo",
      titulo: "Assíduo",
      descricao: "Frequência acima de 90%",
      emoji: "🎯",
      cor: "#16a34a",
    });
  }

  if (d.totalRedacoesAprovadas >= 15) {
    badges.push({
      id: "maratonista",
      titulo: "Maratonista da Escrita",
      descricao: "15+ redações aprovadas",
      emoji: "📚",
      cor: "#7c3aed",
    });
  } else if (d.totalRedacoesAprovadas >= 5) {
    badges.push({
      id: "escritor-dedicado",
      titulo: "Escritor Dedicado",
      descricao: "5+ redações aprovadas",
      emoji: "✍️",
      cor: "#d6336c",
    });
  } else if (d.totalRedacoesAprovadas >= 1) {
    badges.push({
      id: "primeira-redacao",
      titulo: "Primeira Redação",
      descricao: "Primeira entrega aprovada",
      emoji: "🌱",
      cor: "#0d9488",
    });
  }

  if (d.melhorNota !== null && d.melhorNota >= 1000) {
    badges.push({
      id: "nota-mil",
      titulo: "NOTA MIL!",
      descricao: "Alcançou a nota máxima",
      emoji: "💎",
      cor: "#d6336c",
    });
  } else if (d.melhorNota !== null && d.melhorNota >= 900) {
    badges.push({
      id: "rumo-a-mil",
      titulo: "Rumo à Nota Mil",
      descricao: "Nota 900+ em redação",
      emoji: "🚀",
      cor: "#4f46e5",
    });
  }

  if (d.temPagamentos && d.semAtrasados) {
    badges.push({
      id: "em-dia",
      titulo: "Financeiro em Dia",
      descricao: "Nenhum pagamento atrasado",
      emoji: "💚",
      cor: "#16a34a",
    });
  }

  if (d.cursosAtivos >= 2) {
    badges.push({
      id: "duplo-curso",
      titulo: "Dupla Jornada",
      descricao: "Matriculado em 2 cursos",
      emoji: "🎓",
      cor: "#1971c2",
    });
  }

  return badges;
}

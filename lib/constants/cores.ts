/** Constantes visuais — seguro para componentes client (sem Prisma). */
export const CORES_CURSO = {
  REDACAO: {
    primaria: "#D6336C",
    clara: "#FDE8F0",
    escura: "#A61E4D",
    label: "Redação",
  },
  EXATAS: {
    primaria: "#2F9E44",
    clara: "#E6F7EA",
    escura: "#1B6E2E",
    label: "Exatas",
  },
  MATEMATICA: {
    primaria: "#1971C2",
    clara: "#E7F3FF",
    escura: "#144C82",
    label: "Matemática",
  },
} as const;

export type NomeCursoChave = keyof typeof CORES_CURSO;

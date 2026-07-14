import type { PapelUsuario } from "@prisma/client";
import type { IconName } from "@/components/ui/Icons";

export interface NavEntry {
  href: string;
  label: string;
  /** Rótulo curto para a barra inferior no celular */
  curto?: string;
  icone: IconName;
  /** true = só destaca com rota exata (dashboards raiz) */
  exato?: boolean;
}

export const NAV_POR_PAPEL: Record<PapelUsuario, NavEntry[]> = {
  ADMIN: [
    { href: "/admin", label: "Dashboard", icone: "home", exato: true },
    { href: "/admin/usuarios", label: "Usuários", icone: "users" },
    { href: "/admin/academico", label: "Acadêmico", icone: "book" },
    { href: "/admin/matriculas", label: "Matrículas", curto: "Matríc.", icone: "clipboard" },
    { href: "/admin/frequencia", label: "Frequência", curto: "Freq.", icone: "check-circle" },
    { href: "/admin/redacao", label: "Redação", icone: "pencil" },
    { href: "/admin/financeiro", label: "Financeiro", curto: "Financ.", icone: "currency" },
    { href: "/admin/acessos", label: "Acessos Externos", curto: "Acessos", icone: "key" },
    { href: "/admin/avisos", label: "Avisos", icone: "bell" },
    { href: "/admin/relatorios", label: "Relatórios", curto: "Relat.", icone: "chart" },
    { href: "/admin/configuracoes", label: "Configurações", curto: "Config.", icone: "cog" },
  ],
  PROFESSOR: [
    { href: "/professor", label: "Dashboard", icone: "home", exato: true },
    { href: "/professor/turmas", label: "Turmas", icone: "users" },
    { href: "/professor/redacao", label: "Redação", icone: "pencil" },
    { href: "/professor/avisos", label: "Avisos", icone: "bell" },
    { href: "/professor/relatorios", label: "Relatórios", curto: "Relat.", icone: "chart" },
  ],
  ALUNO: [
    { href: "/aluno", label: "Dashboard", icone: "home", exato: true },
    { href: "/aluno/cursos", label: "Cursos", icone: "book" },
    { href: "/aluno/calendario", label: "Calendário", curto: "Agenda", icone: "calendar" },
    { href: "/aluno/redacao", label: "Redação", icone: "pencil" },
    { href: "/aluno/acessos", label: "Acessos Externos", curto: "Acessos", icone: "key" },
    { href: "/aluno/avisos", label: "Avisos", icone: "bell" },
    { href: "/aluno/rematricula", label: "Rematrícula", curto: "Rematr.", icone: "refresh" },
  ],
  RESPONSAVEL: [
    { href: "/responsavel", label: "Dashboard", icone: "home", exato: true },
    { href: "/responsavel/frequencia", label: "Frequência", curto: "Freq.", icone: "check-circle" },
    { href: "/responsavel/financeiro", label: "Financeiro", curto: "Financ.", icone: "currency" },
    { href: "/responsavel/avisos", label: "Avisos", icone: "bell" },
    { href: "/responsavel/rematricula", label: "Rematrícula", curto: "Rematr.", icone: "refresh" },
  ],
};

export const ACCENT_POR_PAPEL: Record<PapelUsuario, string> = {
  ADMIN: "#4f46e5",
  PROFESSOR: "#0d9488",
  ALUNO: "#d6336c",
  RESPONSAVEL: "#b45309",
};

export const LABEL_PAPEL: Record<PapelUsuario, string> = {
  ADMIN: "Administração",
  PROFESSOR: "Professor",
  ALUNO: "Aluno",
  RESPONSAVEL: "Responsável",
};

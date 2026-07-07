"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { CSSProperties } from "react";
import type { PapelUsuario } from "@prisma/client";
import { NAV_POR_PAPEL, ACCENT_POR_PAPEL, LABEL_PAPEL } from "@/lib/nav";
import { Icon, type IconName } from "@/components/ui/Icons";

interface NavItem {
  href: string;
  label: string;
}

interface DashboardShellProps {
  titulo: string;
  corAccent?: string;
  /** Mantido por compatibilidade — a navegação agora é derivada do papel. */
  navItems?: NavItem[];
  userName: string;
  papel: PapelUsuario;
  children: React.ReactNode;
  extra?: React.ReactNode;
}

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardShell({
  titulo,
  corAccent,
  userName,
  papel,
  children,
  extra,
}: DashboardShellProps) {
  const pathname = usePathname();
  const nav = NAV_POR_PAPEL[papel] ?? [];
  const accent = corAccent || ACCENT_POR_PAPEL[papel];

  const ativo = (href: string, exato?: boolean) =>
    exato ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const sair = async () => {
    // redirect:false + navegação manual — o redirect automático usa a URL
    // absoluta do AUTH_URL e quebra fora do domínio de produção
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  return (
    <div
      className="min-h-screen bg-[#f5f6fa] lg:pl-72"
      style={{ "--rnm-accent": accent } as CSSProperties}
    >
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-slate-950 text-white lg:flex">
        <div className="flex items-center gap-3 px-6 pb-5 pt-7">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-bold text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
          >
            R
          </div>
          <div className="min-w-0">
            <p className="font-display text-[15px] font-bold leading-tight">
              Redação Nota Mil
            </p>
            <p className="truncate text-xs text-slate-400">{LABEL_PAPEL[papel]}</p>
          </div>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {nav.map((item) => {
            const isAtivo = ativo(item.href, item.exato);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isAtivo
                    ? "text-white shadow-md"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
                style={
                  isAtivo
                    ? {
                        backgroundImage: `linear-gradient(135deg, ${accent}, ${accent}b3)`,
                      }
                    : undefined
                }
              >
                <Icon
                  name={item.icone}
                  className={`h-5 w-5 shrink-0 ${
                    isAtivo ? "" : "opacity-70 group-hover:opacity-100"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/perfil"
              title="Meu perfil"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 transition hover:bg-white/5"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white/20"
                style={{ backgroundColor: accent }}
              >
                {iniciais(userName)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{userName}</span>
                <span className="block text-xs text-slate-400">
                  {LABEL_PAPEL[papel]}
                </span>
              </span>
            </Link>
            <button
              onClick={sair}
              title="Sair"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Header (mobile) ===== */}
      <header
        className="sticky top-0 z-40 text-white shadow-md lg:hidden"
        style={{
          background: `linear-gradient(120deg, #0f172a 0%, ${accent} 130%)`,
        }}
      >
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold shadow"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}
            >
              R
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-white/60">
                {LABEL_PAPEL[papel]}
              </p>
              <h1 className="truncate font-display text-base font-bold leading-tight">
                {titulo}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {extra}
            <Link
              href="/perfil"
              title="Meu perfil"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xs font-bold ring-1 ring-white/25 transition hover:bg-white/25"
            >
              {iniciais(userName)}
            </Link>
            <button
              onClick={sair}
              title="Sair"
              className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
            >
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== Header (desktop) ===== */}
      <div className="hidden items-center justify-between gap-4 px-8 pt-8 lg:flex">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            {LABEL_PAPEL[papel]}
          </p>
          <h1 className="font-display text-2xl font-bold text-gray-900">{titulo}</h1>
        </div>
        <div className="flex items-center gap-3">{extra}</div>
      </div>

      {/* ===== Conteúdo ===== */}
      <main className="animate-fade-up mx-auto w-full max-w-6xl px-3 py-4 pb-28 sm:px-6 sm:py-5 lg:px-8 lg:pb-12">
        {children}
      </main>

      {/* ===== Navegação inferior (mobile) ===== */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto px-0.5">
          {nav.map((item) => {
            const isAtivo = ativo(item.href, item.exato);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-[68px] max-w-[88px] flex-1 snap-start flex-col items-center gap-0.5 px-1.5 pb-2 pt-2"
                style={{ color: isAtivo ? accent : "#6b7280" }}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                    isAtivo ? "shadow-sm" : ""
                  }`}
                  style={isAtivo ? { backgroundColor: `${accent}1a` } : undefined}
                >
                  <Icon name={item.icone} className="h-[22px] w-[22px]" strokeWidth={isAtivo ? 2 : 1.7} />
                </span>
                <span className={`text-[10px] leading-tight ${isAtivo ? "font-semibold" : "font-medium"}`}>
                  {item.curto ?? item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* ============================================================ */

export function Card({
  title,
  children,
  className = "",
  acao,
  descricao,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  acao?: React.ReactNode;
  descricao?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(16,24,40,0.08)] sm:p-6 ${className}`}
    >
      {(title || acao) && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-base font-semibold text-gray-900 sm:text-lg">
                {title}
              </h2>
            )}
            {descricao && <p className="mt-0.5 text-sm text-gray-500">{descricao}</p>}
          </div>
          {acao}
        </div>
      )}
      {children}
    </div>
  );
}

export function AlertBanner({
  tipo = "warn",
  children,
}: {
  tipo?: "warn" | "error" | "info";
  children: React.ReactNode;
}) {
  const estilos = {
    warn: "bg-amber-50 border-amber-200 text-amber-800",
    error: "bg-red-50 border-red-200 text-red-700",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };
  const icones: Record<string, IconName> = {
    warn: "alert",
    error: "alert",
    info: "info",
  };
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${estilos[tipo]}`}
    >
      <Icon name={icones[tipo]} className="mt-0.5 h-4.5 w-4.5 shrink-0" strokeWidth={2} />
      <div>{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  cor,
  icone,
  hint,
}: {
  label: string;
  value: string | number;
  cor?: string;
  icone?: IconName;
  hint?: string;
}) {
  const corFinal = cor || "var(--rnm-accent)";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.06)] sm:p-5">
      <span
        className="absolute inset-y-0 left-0 w-1 rounded-r"
        style={{ backgroundColor: corFinal }}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-gray-500">{label}</p>
          <p
            className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-[28px]"
            style={{ color: cor || "#111827" }}
          >
            {value}
          </p>
          {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
        </div>
        {icone && (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${cor || "#6b7280"}14`, color: corFinal }}
          >
            <Icon name={icone} className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tom = "gray",
}: {
  children: React.ReactNode;
  tom?: "gray" | "green" | "red" | "amber" | "blue" | "pink";
}) {
  const tons = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    pink: "bg-pink-50 text-pink-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tons[tom]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icone = "info",
  titulo,
  descricao,
}: {
  icone?: IconName;
  titulo: string;
  descricao?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <Icon name={icone} className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold text-gray-700">{titulo}</p>
      {descricao && <p className="mt-1 max-w-sm text-sm text-gray-500">{descricao}</p>}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { PapelUsuario } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
}

interface DashboardShellProps {
  titulo: string;
  corAccent?: string;
  navItems: NavItem[];
  userName: string;
  papel: PapelUsuario;
  children: React.ReactNode;
  extra?: React.ReactNode;
}

export function DashboardShell({
  titulo,
  corAccent = "#212529",
  navItems,
  userName,
  papel,
  children,
  extra,
}: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="text-white px-4 py-4"
        style={{ backgroundColor: corAccent }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs opacity-80 uppercase tracking-wide">{papel}</p>
            <h1 className="font-display text-xl font-bold">{titulo}</h1>
          </div>
          <div className="flex items-center gap-3">
            {extra}
            <span className="text-sm opacity-90">{userName}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex gap-1 px-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              style={
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? { backgroundColor: corAccent }
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm ${className}`}
    >
      {title && (
        <h2 className="font-display font-semibold text-lg mb-4">{title}</h2>
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
  const cores = {
    warn: "bg-amber-50 border-amber-200 text-amber-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${cores[tipo]}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  cor,
}: {
  label: string;
  value: string | number;
  cor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className="text-2xl font-bold mt-1"
        style={{ color: cor || "#212529" }}
      >
        {value}
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AvisoItem {
  id: string;
  titulo: string;
  mensagem: string;
  criadoEm: string | Date;
  lido?: boolean;
  expirado?: boolean;
}

export function ListaAvisos({
  avisos,
}: {
  avisos: AvisoItem[];
  usuarioId?: string;
  papel?: string;
}) {
  const router = useRouter();
  const [marcando, setMarcando] = useState<string | null>(null);

  async function marcarLido(avisoId: string) {
    setMarcando(avisoId);
    try {
      await fetch("/api/avisos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avisoId }),
      });
      router.refresh();
    } finally {
      setMarcando(null);
    }
  }

  if (avisos.length === 0) {
    return (
      <p className="text-sm text-gray-500">Nenhum aviso no momento.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {avisos.map((a) => {
        const lido = a.lido;
        const expirado = a.expirado;
        const statusLabel = lido
          ? "Lido"
          : expirado
            ? "Não lido"
            : "Novo";
        const statusClass = lido
          ? "bg-emerald-50 text-emerald-700"
          : expirado
            ? "bg-red-50 text-red-700"
            : "bg-blue-50 text-blue-700";

        return (
          <li
            key={a.id}
            className={`rounded-xl border p-4 transition ${
              lido
                ? "border-gray-100 bg-gray-50/50 opacity-90"
                : "border-blue-100 bg-white shadow-sm"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{a.titulo}</p>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                  {a.mensagem}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(a.criadoEm).toLocaleString("pt-BR")}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClass}`}
              >
                {statusLabel}
              </span>
            </div>
            {!lido && (
              <button
                type="button"
                disabled={marcando === a.id}
                onClick={() => marcarLido(a.id)}
                className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
              >
                {marcando === a.id ? "Marcando..." : "Marcar como lido"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Cadastro completo do módulo: escolhe o mês de referência antes de gerar. */
export function FormGerarModulo({ turmaId }: { turmaId: string }) {
  const router = useRouter();
  const mesAtual = new Date().toISOString().slice(0, 7);
  const [mes, setMes] = useState(mesAtual);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  async function gerar() {
    setLoading(true);
    setMsg("");
    setErro("");
    try {
      const res = await fetch("/api/academico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "gerar_modulo", turmaId, mesReferencia: mes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao gerar módulo");
        return;
      }
      setMsg(`Módulo ${data.numero} gerado com 4 aulas!`);
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500">
            Mês de referência
          </label>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={gerar}
          disabled={loading}
          className="btn-secondary px-3 py-2 text-xs"
        >
          {loading ? "Gerando..." : "Gerar módulo (4 aulas)"}
        </button>
      </div>
      {msg && <p className="text-xs font-medium text-emerald-700">{msg}</p>}
      {erro && <p className="text-xs font-medium text-red-600">{erro}</p>}
    </div>
  );
}

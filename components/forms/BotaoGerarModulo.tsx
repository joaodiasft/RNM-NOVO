"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BotaoGerarModulo({ turmaId }: { turmaId: string }) {
  const router = useRouter();
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
        body: JSON.stringify({ acao: "gerar_modulo", turmaId }),
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
      <button
        type="button"
        onClick={gerar}
        disabled={loading}
        className="btn-secondary w-full px-3 py-2 text-xs sm:w-auto"
      >
        {loading ? "Gerando..." : "Gerar módulo do mês (4 aulas)"}
      </button>
      {msg && <p className="text-xs font-medium text-emerald-700">{msg}</p>}
      {erro && <p className="text-xs font-medium text-red-600">{erro}</p>}
    </div>
  );
}

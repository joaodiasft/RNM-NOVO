"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Gera cobranças pendentes do mês para matrículas ativas sem pagamento. */
export function FormGerarCobrancas({ competenciaAtual }: { competenciaAtual: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  async function gerar() {
    setLoading(true);
    setMsg("");
    setErro("");
    try {
      const res = await fetch("/api/operacional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "gerar_cobrancas",
          competencia: competenciaAtual,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao gerar cobranças");
        return;
      }
      if (data.criados === 0) {
        setMsg(`Todas as ${data.totalMatriculas} matrícula(s) já têm cobrança em ${data.competencia}.`);
      } else {
        setMsg(
          `${data.criados} cobrança(s) criada(s) para ${data.competencia}. Confirme abaixo.`
        );
      }
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Competência atual: <strong>{competenciaAtual}</strong>. Use se alunos matriculados
        ainda não aparecem para confirmar pagamento.
      </p>
      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button
        type="button"
        onClick={gerar}
        disabled={loading}
        className="btn-secondary w-full min-h-[44px] sm:w-auto"
      >
        {loading ? "Gerando..." : "Gerar cobranças do mês"}
      </button>
    </div>
  );
}

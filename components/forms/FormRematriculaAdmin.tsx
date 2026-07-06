"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Solicitacao {
  id: string;
  aluno: { nome: string; codigo: string };
}

export function FormRematriculaAdmin({ solicitacoes }: { solicitacoes: Solicitacao[] }) {
  const router = useRouter();
  const [processando, setProcessando] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  async function responder(id: string, status: "APROVADA" | "RECUSADA") {
    setErro("");
    setProcessando(id);
    try {
      const res = await fetch("/api/operacional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "responder_rematricula", solicitacaoId: id, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao responder solicitação");
        return;
      }
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setProcessando(null);
    }
  }

  if (solicitacoes.length === 0) {
    return <p className="text-sm text-gray-500">Nenhuma solicitação pendente.</p>;
  }

  return (
    <div className="space-y-3">
      {erro && <p className="msg-erro">{erro}</p>}
      {solicitacoes.map((s) => (
        <div
          key={s.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">{s.aluno.nome}</p>
            <p className="text-xs text-gray-400">{s.aluno.codigo}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => responder(s.id, "APROVADA")}
              disabled={processando !== null}
              className="btn-success px-3 py-1.5 text-xs"
            >
              {processando === s.id ? "..." : "Aprovar"}
            </button>
            <button
              onClick={() => responder(s.id, "RECUSADA")}
              disabled={processando !== null}
              className="btn-danger px-3 py-1.5 text-xs"
            >
              Recusar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

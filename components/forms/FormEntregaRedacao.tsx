"use client";

import { useState } from "react";

export function FormEntregaRedacao({ aulaId }: { aulaId: string }) {
  const [qtd, setQtd] = useState(1);
  const [nota, setNota] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErro("");
    try {
      const res = await fetch("/api/redacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aulaId,
          quantidadeEntregue: qtd,
          correcoes: nota ? [{ numero: 1, nota: parseFloat(nota), comentario: "" }] : [],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.erro || "Erro ao enviar entrega");
        return;
      }
      setMsg("Enviado! Aguardando aprovação do administrador.");
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-gray-500">
        Lance quantas redações você entregou nesta aula (aguarda aprovação do admin).
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="field-label">Quantidade</label>
          <select
            value={qtd}
            onChange={(e) => setQtd(Number(e.target.value))}
            className="input w-auto"
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n} redação(ões)
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="field-label">Nota (opcional)</label>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            inputMode="decimal"
            placeholder="Ex.: 920"
            className="input"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </div>
      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
    </form>
  );
}

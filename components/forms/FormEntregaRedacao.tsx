"use client";

import { useState } from "react";

export function FormEntregaRedacao({ aulaId }: { aulaId: string }) {
  const [qtd, setQtd] = useState(1);
  const [nota, setNota] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/redacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aulaId,
        quantidadeEntregue: qtd,
        correcoes: nota ? [{ numero: 1, nota: parseFloat(nota), comentario: "" }] : [],
      }),
    });
    setMsg(res.ok ? "Enviado para aprovação!" : "Erro ao enviar");
  }

  return (
    <form onSubmit={submit} className="space-y-2 border-t pt-3 mt-3">
      <p className="text-xs text-gray-500">Lançar entrega (aguarda aprovação do admin)</p>
      <select value={qtd} onChange={(e) => setQtd(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
        {[0, 1, 2, 3].map((n) => (
          <option key={n} value={n}>{n} redação(ões)</option>
        ))}
      </select>
      <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" className="border rounded px-2 py-1 text-sm w-full" />
      <button type="submit" className="bg-rnm-redacao text-white text-sm px-3 py-1 rounded">Enviar</button>
      {msg && <p className="text-xs text-green-600">{msg}</p>}
    </form>
  );
}

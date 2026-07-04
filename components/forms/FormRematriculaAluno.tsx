"use client";

import { useState } from "react";

export function FormRematriculaAluno({
  alunoId,
  turmas,
  planos,
}: {
  alunoId: string;
  turmas: { id: string; nome: string }[];
  planos: { id: string; nome: string }[];
}) {
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/operacional", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "solicitar_rematricula",
        alunoId,
        turmaId: fd.get("turmaId"),
        planoId: fd.get("planoId"),
      }),
    });
    setMsg(res.ok ? "Solicitação enviada!" : "Erro ao solicitar");
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-w-md">
      <select name="turmaId" required className="w-full border rounded-lg px-3 py-2 text-sm">
        {turmas.map((t) => (
          <option key={t.id} value={t.id}>{t.nome}</option>
        ))}
      </select>
      <select name="planoId" required className="w-full border rounded-lg px-3 py-2 text-sm">
        {planos.map((p) => (
          <option key={p.id} value={p.id}>{p.nome}</option>
        ))}
      </select>
      <button type="submit" className="bg-rnm-redacao text-white rounded-lg px-4 py-2 text-sm">Solicitar</button>
      {msg && <p className="text-sm text-green-600">{msg}</p>}
    </form>
  );
}

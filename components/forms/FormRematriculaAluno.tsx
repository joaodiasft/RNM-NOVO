"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FormRematriculaAluno({
  alunoId,
  turmas,
  planos,
}: {
  alunoId: string;
  turmas: { id: string; nome: string }[];
  planos: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErro("");
    const fd = new FormData(e.currentTarget);
    try {
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
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao enviar solicitação");
        return;
      }
      setMsg("Solicitação enviada! A secretaria vai analisar e confirmar.");
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-3">
      <div>
        <label className="field-label">Turma desejada *</label>
        <select name="turmaId" required className="input">
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Plano *</label>
        <select name="planoId" required className="input">
          {planos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>
      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? "Enviando..." : "Solicitar rematrícula"}
      </button>
    </form>
  );
}

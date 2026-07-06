"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Pagamento {
  id: string;
  competencia: string;
  valor: unknown;
  status: string;
  matriculaCurso: {
    aluno: { nome: string };
    turma: { nome: string };
  };
}

export function FormConfirmarPagamento({ pagamentos }: { pagamentos: Pagamento[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  async function confirmar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErro("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await fetch("/api/operacional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "confirmar_pagamento",
          pagamentoId: fd.get("pagamentoId"),
          formaPagamento: fd.get("formaPagamento"),
          observacao: fd.get("observacao"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao confirmar pagamento");
        return;
      }
      setMsg("Pagamento confirmado!");
      form.reset();
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (pagamentos.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum pagamento pendente ou atrasado. 🎉</p>;
  }

  return (
    <form onSubmit={confirmar} className="space-y-3">
      <div>
        <label className="field-label">Pagamento *</label>
        <select name="pagamentoId" required className="input">
          <option value="">Selecione o pagamento</option>
          {pagamentos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.matriculaCurso.aluno.nome} — {p.competencia} — R${" "}
              {Number(p.valor).toFixed(2)} ({p.status})
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Forma de pagamento *</label>
          <select name="formaPagamento" required className="input">
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="CARTAO">Cartão</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
        <div>
          <label className="field-label">Observação</label>
          <input name="observacao" placeholder="Opcional" className="input" />
        </div>
      </div>
      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button type="submit" disabled={loading} className="btn-success w-full">
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}
        {loading ? "Confirmando..." : "Confirmar pagamento"}
      </button>
    </form>
  );
}

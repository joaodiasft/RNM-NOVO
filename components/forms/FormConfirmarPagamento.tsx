"use client";

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
  async function confirmar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/operacional", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "confirmar_pagamento",
        pagamentoId: fd.get("pagamentoId"),
        formaPagamento: fd.get("formaPagamento"),
        observacao: fd.get("observacao"),
      }),
    });
    window.location.reload();
  }

  return (
    <form onSubmit={confirmar} className="space-y-3">
      <select name="pagamentoId" required className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Selecione pagamento</option>
        {pagamentos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.matriculaCurso.aluno.nome} — {p.competencia} — R$ {Number(p.valor).toFixed(2)} ({p.status})
          </option>
        ))}
      </select>
      <select name="formaPagamento" required className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="PIX">PIX</option>
        <option value="DINHEIRO">Dinheiro</option>
        <option value="OUTRO">Outro</option>
      </select>
      <input name="observacao" placeholder="Observação" className="w-full border rounded-lg px-3 py-2 text-sm" />
      <button type="submit" className="w-full bg-green-600 text-white rounded-lg py-2 text-sm">Confirmar</button>
    </form>
  );
}

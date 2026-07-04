"use client";

interface Solicitacao {
  id: string;
  aluno: { nome: string; codigo: string };
}

export function FormRematriculaAdmin({ solicitacoes }: { solicitacoes: Solicitacao[] }) {
  async function responder(id: string, status: "APROVADA" | "RECUSADA") {
    await fetch("/api/operacional", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "responder_rematricula", solicitacaoId: id, status }),
    });
    window.location.reload();
  }

  if (solicitacoes.length === 0) {
    return <p className="text-sm text-gray-500">Nenhuma solicitação pendente.</p>;
  }

  return (
    <div className="space-y-3">
      {solicitacoes.map((s) => (
        <div key={s.id} className="flex items-center justify-between border-b pb-2">
          <span className="text-sm">{s.aluno.nome} ({s.aluno.codigo})</span>
          <div className="flex gap-2">
            <button onClick={() => responder(s.id, "APROVADA")} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Aprovar</button>
            <button onClick={() => responder(s.id, "RECUSADA")} className="text-xs bg-red-600 text-white px-2 py-1 rounded">Recusar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

interface Entrega {
  id: string;
  quantidadeEntregue: number;
  aluno: { nome: string; codigo: string };
  correcoes: { numero: number; nota: unknown; comentario: string | null }[];
}

export function FormAprovarRedacao({ entregas }: { entregas: Entrega[] }) {
  async function aprovar(id: string) {
    await fetch("/api/redacao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entregaId: id }),
    });
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      {entregas.map((e) => (
        <div key={e.id} className="border border-gray-100 rounded-lg p-4">
          <p className="font-medium">{e.aluno.nome} ({e.aluno.codigo})</p>
          <p className="text-sm text-gray-500">Entregues: {e.quantidadeEntregue}</p>
          {e.correcoes.map((c) => (
            <p key={c.numero} className="text-xs text-gray-600">
              Redação {c.numero}: nota {String(c.nota)} — {c.comentario}
            </p>
          ))}
          <button
            onClick={() => aprovar(e.id)}
            className="mt-2 text-sm bg-rnm-redacao text-white px-3 py-1 rounded-lg"
          >
            Aprovar
          </button>
        </div>
      ))}
    </div>
  );
}

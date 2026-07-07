"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Correcao {
  numero: number;
  nota: unknown;
  notaSofia: unknown;
  competencias: string | null;
  feedback: string | null;
}

interface Entrega {
  id: string;
  quantidadeEntregue: number;
  status: string;
  aluno: { nome: string; codigo: string };
  correcoes: Correcao[];
}

export function FormAprovarRedacao({ entregas }: { entregas: Entrega[] }) {
  const router = useRouter();
  const [processando, setProcessando] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");

  async function aprovar(e: Entrega) {
    setErro("");
    setProcessando(e.id);
    try {
      const res = await fetch("/api/redacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "aprovar",
          entregaId: e.id,
          feedback: feedback[e.id] || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.erro || "Erro ao aprovar entrega");
        return;
      }
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setProcessando(null);
    }
  }

  if (entregas.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nenhuma entrega aguardando aprovação.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {erro && <p className="msg-erro">{erro}</p>}
      {entregas.map((e) => (
        <div
          key={e.id}
          className="rounded-xl border border-amber-100 bg-amber-50/40 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">{e.aluno.nome}</p>
              <p className="text-xs text-gray-500">{e.aluno.codigo}</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {e.quantidadeEntregue} redação(ões) · {e.status.replace(/_/g, " ")}
            </span>
          </div>

          {e.correcoes.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[320px] text-xs">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-1 pr-2">#</th>
                    <th className="pb-1 pr-2">Professora</th>
                    <th className="pb-1 pr-2">Sofia</th>
                    <th className="pb-1">Competências</th>
                  </tr>
                </thead>
                <tbody>
                  {e.correcoes.map((c) => (
                    <tr key={c.numero} className="border-t border-amber-100/80">
                      <td className="py-1.5 pr-2 font-medium">{c.numero}</td>
                      <td className="py-1.5 pr-2">{c.nota != null ? String(c.nota) : "—"}</td>
                      <td className="py-1.5 pr-2">{c.notaSofia != null ? String(c.notaSofia) : "—"}</td>
                      <td className="py-1.5 text-gray-600">
                        {c.competencias
                          ? JSON.parse(c.competencias).join(" · ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3">
            <label className="field-label">Feedback final para o aluno</label>
            <textarea
              rows={2}
              value={feedback[e.id] ?? ""}
              onChange={(ev) =>
                setFeedback((s) => ({ ...s, [e.id]: ev.target.value }))
              }
              className="input text-sm"
              placeholder="Comentário geral sobre o desempenho..."
            />
          </div>

          <button
            type="button"
            onClick={() => aprovar(e)}
            disabled={processando !== null}
            className="btn-primary mt-3 px-4 py-2 text-sm"
          >
            {processando === e.id ? "Aprovando..." : "Aprovar e liberar para o aluno"}
          </button>
        </div>
      ))}
    </div>
  );
}

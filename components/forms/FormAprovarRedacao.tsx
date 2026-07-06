"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Entrega {
  id: string;
  quantidadeEntregue: number;
  aluno: { nome: string; codigo: string };
  correcoes: { numero: number; nota: unknown; comentario: string | null }[];
}

export function FormAprovarRedacao({ entregas }: { entregas: Entrega[] }) {
  const router = useRouter();
  const [processando, setProcessando] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  // notas[entregaId][numero] = valor digitado
  const [notas, setNotas] = useState<Record<string, Record<number, string>>>({});

  function notaInicial(e: Entrega, numero: number): string {
    const c = e.correcoes.find((c) => c.numero === numero);
    return c?.nota != null ? String(c.nota) : "";
  }

  async function aprovar(e: Entrega) {
    setErro("");
    setProcessando(e.id);
    try {
      const qtd = Math.max(1, e.quantidadeEntregue);
      const correcoes = Array.from({ length: qtd }, (_, i) => {
        const numero = i + 1;
        const digitado = notas[e.id]?.[numero] ?? notaInicial(e, numero);
        const nota = digitado === "" ? undefined : parseFloat(digitado);
        return {
          numero,
          nota: nota !== undefined && !Number.isNaN(nota) ? nota : undefined,
          comentario: e.correcoes.find((c) => c.numero === numero)?.comentario ?? "",
        };
      }).filter((c) => c.nota !== undefined || c.comentario);

      const res = await fetch("/api/redacao", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entregaId: e.id,
          correcoes: correcoes.length > 0 ? correcoes : undefined,
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

  return (
    <div className="space-y-3">
      {erro && <p className="msg-erro">{erro}</p>}
      {entregas.map((e) => (
        <div
          key={e.id}
          className="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-gray-900">{e.aluno.nome}</p>
              <p className="text-xs text-gray-400">{e.aluno.codigo}</p>
            </div>
            <p className="text-sm text-gray-600">
              <strong>{e.quantidadeEntregue}</strong> redação(ões)
            </p>
          </div>

          {e.quantidadeEntregue > 0 && (
            <div className="mt-3 flex flex-wrap items-end gap-2">
              {Array.from({ length: e.quantidadeEntregue }, (_, i) => i + 1).map(
                (numero) => (
                  <div key={numero}>
                    <label className="mb-1 block text-[11px] font-medium text-gray-500">
                      Nota {numero}ª redação
                    </label>
                    <input
                      inputMode="decimal"
                      placeholder="0–1000"
                      value={notas[e.id]?.[numero] ?? notaInicial(e, numero)}
                      onChange={(ev) =>
                        setNotas((s) => ({
                          ...s,
                          [e.id]: { ...s[e.id], [numero]: ev.target.value },
                        }))
                      }
                      className="w-24 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm"
                    />
                  </div>
                )
              )}
              <button
                onClick={() => aprovar(e)}
                disabled={processando !== null}
                className="btn-primary px-4 py-2 text-xs"
              >
                {processando === e.id ? "Aprovando..." : "Aprovar"}
              </button>
            </div>
          )}
          {e.quantidadeEntregue === 0 && (
            <div className="mt-3">
              <button
                onClick={() => aprovar(e)}
                disabled={processando !== null}
                className="btn-primary px-4 py-2 text-xs"
              >
                {processando === e.id ? "Aprovando..." : "Aprovar (0 entregas)"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

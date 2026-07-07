"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Aluno {
  id: string;
  nome: string;
  codigo: string;
}

interface EntregaExistente {
  id: string;
  alunoId: string;
  quantidadeEntregue: number;
  status: string;
  aluno?: { nome: string; codigo: string };
  correcoes: {
    numero: number;
    nota: unknown;
    notaSofia: unknown;
    competencias: string | null;
  }[];
}

export function FormRedacaoProfessor({
  entregas,
}: {
  aulaId: string;
  alunos: Aluno[];
  entregas: EntregaExistente[];
}) {
  const router = useRouter();
  const [notas, setNotas] = useState<
    Record<string, Record<number, { prof: string; sofia: string; comp: string[] }>>
  >(() => {
    const init: Record<
      string,
      Record<number, { prof: string; sofia: string; comp: string[] }>
    > = {};
    for (const e of entregas) {
      init[e.alunoId] = {};
      for (let n = 1; n <= e.quantidadeEntregue; n++) {
        const c = e.correcoes.find((x) => x.numero === n);
        init[e.alunoId][n] = {
          prof: c?.nota != null ? String(c.nota) : "",
          sofia: c?.notaSofia != null ? String(c.notaSofia) : "",
          comp: c?.competencias
            ? (JSON.parse(c.competencias) as number[]).map(String)
            : ["", "", "", "", ""],
        };
      }
    }
    return init;
  });
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  async function salvarNotas(entrega: EntregaExistente) {
    setErro("");
    setSalvando(entrega.id);
    try {
      const linhas = notas[entrega.alunoId] || {};
      const correcoes = Object.entries(linhas).map(([num, v]) => {
        const competencias = v.comp
          .map((x) => (x === "" ? NaN : parseInt(x, 10)))
          .filter((x) => !Number.isNaN(x));
        return {
          numero: parseInt(num, 10),
          nota: v.prof === "" ? null : parseFloat(v.prof),
          notaSofia: v.sofia === "" ? null : parseFloat(v.sofia),
          competencias: competencias.length === 5 ? competencias : null,
        };
      });

      const res = await fetch("/api/redacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "notas",
          entregaId: entrega.id,
          correcoes,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.erro || "Erro ao lançar notas");
        return;
      }
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setSalvando(null);
    }
  }

  const lista = entregas.filter((e) => e.quantidadeEntregue > 0);

  if (lista.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nenhuma entrega registrada pelo admin nesta aula. Aguarde o lançamento da
        quantidade entregue.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {erro && <p className="msg-erro">{erro}</p>}
      {lista.map((e) => (
        <div
          key={e.id}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {e.aluno?.nome || e.alunoId}
              </p>
              {e.aluno?.codigo && (
                <p className="text-xs text-gray-500">{e.aluno.codigo}</p>
              )}
              <p className="text-xs text-gray-500">
                {e.quantidadeEntregue} redação(ões) · {e.status.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {Array.from({ length: e.quantidadeEntregue }, (_, i) => i + 1).map(
            (num) => (
              <div
                key={num}
                className="mb-3 rounded-lg border border-gray-50 bg-gray-50/60 p-3"
              >
                <p className="mb-2 text-xs font-semibold text-gray-600">
                  Redação {num}
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    placeholder="Nota professora"
                    inputMode="decimal"
                    value={notas[e.alunoId]?.[num]?.prof ?? ""}
                    onChange={(ev) =>
                      setNotas((s) => ({
                        ...s,
                        [e.alunoId]: {
                          ...s[e.alunoId],
                          [num]: {
                            ...(s[e.alunoId]?.[num] || {
                              prof: "",
                              sofia: "",
                              comp: ["", "", "", "", ""],
                            }),
                            prof: ev.target.value,
                          },
                        },
                      }))
                    }
                    className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                  />
                  <input
                    placeholder="Nota Sofia"
                    inputMode="decimal"
                    value={notas[e.alunoId]?.[num]?.sofia ?? ""}
                    onChange={(ev) =>
                      setNotas((s) => ({
                        ...s,
                        [e.alunoId]: {
                          ...s[e.alunoId],
                          [num]: {
                            ...(s[e.alunoId]?.[num] || {
                              prof: "",
                              sofia: "",
                              comp: ["", "", "", "", ""],
                            }),
                            sofia: ev.target.value,
                          },
                        },
                      }))
                    }
                    className="w-28 rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                  />
                </div>
                <p className="mt-2 text-[10px] font-medium uppercase text-gray-400">
                  Competências ENEM (0–200)
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 5].map((c, idx) => (
                    <input
                      key={c}
                      placeholder={`C${c}`}
                      inputMode="numeric"
                      value={notas[e.alunoId]?.[num]?.comp?.[idx] ?? ""}
                      onChange={(ev) => {
                        const comp = [
                          ...(notas[e.alunoId]?.[num]?.comp || [
                            "",
                            "",
                            "",
                            "",
                            "",
                          ]),
                        ];
                        comp[idx] = ev.target.value;
                        setNotas((s) => ({
                          ...s,
                          [e.alunoId]: {
                            ...s[e.alunoId],
                            [num]: {
                              ...(s[e.alunoId]?.[num] || {
                                prof: "",
                                sofia: "",
                                comp: ["", "", "", "", ""],
                              }),
                              comp,
                            },
                          },
                        }));
                      }}
                      className="w-14 rounded border border-gray-200 px-1 py-1 text-center text-xs"
                    />
                  ))}
                </div>
              </div>
            )
          )}

          {e.status !== "APROVADA" && (
            <button
              type="button"
              disabled={salvando !== null}
              onClick={() => salvarNotas(e)}
              className="btn-primary text-xs"
            >
              {salvando === e.id ? "Salvando..." : "Salvar notas"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Aluno {
  id: string;
  nome: string;
  codigo: string;
}

interface EntregaExistente {
  alunoId: string;
  quantidadeEntregue: number;
  status: string;
}

export function FormRedacaoProfessor({
  aulaId,
  alunos,
  entregas,
}: {
  aulaId: string;
  alunos: Aluno[];
  entregas: EntregaExistente[];
}) {
  const router = useRouter();
  const existentes = new Map(entregas.map((e) => [e.alunoId, e]));
  const [qtd, setQtd] = useState<Record<string, number>>(
    Object.fromEntries(entregas.map((e) => [e.alunoId, e.quantidadeEntregue]))
  );
  const [nota, setNota] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [salvos, setSalvos] = useState<Record<string, boolean>>({});
  const [erro, setErro] = useState("");

  async function salvar(alunoId: string) {
    setErro("");
    setSalvando(alunoId);
    try {
      const quantidade = qtd[alunoId] ?? 0;
      const notaNum = nota[alunoId] ? parseFloat(nota[alunoId]) : undefined;
      const res = await fetch("/api/redacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aulaId,
          alunoId,
          quantidadeEntregue: quantidade,
          correcoes:
            notaNum !== undefined && !Number.isNaN(notaNum)
              ? [{ numero: 1, nota: notaNum, comentario: "" }]
              : [],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.erro || "Erro ao lançar entrega");
        return;
      }
      setSalvos((s) => ({ ...s, [alunoId]: true }));
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setSalvando(null);
    }
  }

  if (alunos.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum aluno matriculado nesta turma.</p>;
  }

  return (
    <div className="space-y-2">
      {erro && <p className="msg-erro">{erro}</p>}
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
        {alunos.map((a) => {
          const existente = existentes.get(a.id);
          return (
            <div key={a.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              <div className="min-w-[130px] flex-1">
                <p className="text-sm font-medium text-gray-800">{a.nome}</p>
                <p className="text-xs text-gray-400">
                  {a.codigo}
                  {existente &&
                    ` · ${
                      existente.status === "APROVADA"
                        ? "aprovada"
                        : "aguardando aprovação"
                    }`}
                </p>
              </div>
              <select
                value={qtd[a.id] ?? 0}
                onChange={(e) =>
                  setQtd((s) => ({ ...s, [a.id]: Number(e.target.value) }))
                }
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold"
                title="Redações entregues"
              >
                {[0, 1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n} red.
                  </option>
                ))}
              </select>
              <input
                value={nota[a.id] ?? ""}
                onChange={(e) => setNota((s) => ({ ...s, [a.id]: e.target.value }))}
                inputMode="decimal"
                placeholder="Nota"
                className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                title="Nota (0 a 1000, opcional)"
              />
              <button
                type="button"
                disabled={salvando !== null}
                onClick={() => salvar(a.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                  salvos[a.id]
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                }`}
              >
                {salvando === a.id ? "..." : salvos[a.id] ? "Salvo ✓" : "Lançar"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400">
        Os lançamentos aguardam a aprovação do administrador para contar no histórico.
      </p>
    </div>
  );
}

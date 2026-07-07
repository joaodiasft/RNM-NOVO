"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AlunoOpt {
  id: string;
  nome: string;
  codigo: string;
}

export function FormRegistrarEntregaRedacao({
  aulaId,
  alunos,
}: {
  aulaId: string;
  alunos: AlunoOpt[];
}) {
  const router = useRouter();
  const [qtd, setQtd] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  async function registrar(alunoId: string) {
    setErro("");
    setSalvando(alunoId);
    try {
      const res = await fetch("/api/redacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "registrar",
          aulaId,
          alunoId,
          quantidadeEntregue: qtd[alunoId] ?? 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.erro || "Erro ao registrar");
        return;
      }
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div className="space-y-2">
      {erro && <p className="msg-erro">{erro}</p>}
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
        {alunos.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center gap-2 px-3 py-2.5"
          >
            <div className="min-w-[140px] flex-1">
              <p className="text-sm font-medium">{a.nome}</p>
              <p className="text-xs text-gray-400">{a.codigo}</p>
            </div>
            <select
              value={qtd[a.id] ?? 0}
              onChange={(e) =>
                setQtd((s) => ({ ...s, [a.id]: Number(e.target.value) }))
              }
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n} entregue(s)
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={salvando !== null}
              onClick={() => registrar(a.id)}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              {salvando === a.id ? "..." : "Registrar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

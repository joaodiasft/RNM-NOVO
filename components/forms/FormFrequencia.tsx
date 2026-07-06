"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_REDACAO = [
  "PRESENTE",
  "FALTA",
  "FALTA_JUSTIFICADA",
  "REPOSICAO_DATA",
  "REPOSICAO_TURMA_DATA",
];

const STATUS_SIMPLES = ["PRESENTE", "FALTA", "FALTA_JUSTIFICADA"];

const COR_STATUS: Record<string, string> = {
  PRESENTE: "text-emerald-700 bg-emerald-50 border-emerald-200",
  FALTA: "text-red-700 bg-red-50 border-red-200",
  FALTA_JUSTIFICADA: "text-amber-700 bg-amber-50 border-amber-200",
  REPOSICAO_DATA: "text-blue-700 bg-blue-50 border-blue-200",
  REPOSICAO_TURMA_DATA: "text-blue-700 bg-blue-50 border-blue-200",
};

interface Aluno {
  id: string;
  nome: string;
  codigo: string;
}

interface Props {
  aulaId: string;
  alunos: Aluno[];
  cursoRedacao?: boolean;
  /** Status já lançados (alunoId -> status) para pré-preencher */
  iniciais?: Record<string, string>;
}

export function FormFrequencia({ aulaId, alunos, cursoRedacao, iniciais = {} }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Record<string, string>>(iniciais);
  const [salvando, setSalvando] = useState<Record<string, boolean>>({});
  const [salvos, setSalvos] = useState<Record<string, boolean>>({});
  const [salvandoTodos, setSalvandoTodos] = useState(false);
  const [erro, setErro] = useState("");

  const opcoes = cursoRedacao ? STATUS_REDACAO : STATUS_SIMPLES;

  async function salvarUm(alunoId: string): Promise<boolean> {
    const st = status[alunoId] || iniciais[alunoId] || "PRESENTE";
    const res = await fetch("/api/frequencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aulaId, alunoId, status: st }),
    });
    return res.ok;
  }

  async function salvar(alunoId: string) {
    setErro("");
    setSalvando((s) => ({ ...s, [alunoId]: true }));
    try {
      const ok = await salvarUm(alunoId);
      if (ok) {
        setSalvos((s) => ({ ...s, [alunoId]: true }));
      } else {
        setErro("Erro ao salvar frequência. Tente novamente.");
      }
    } catch {
      setErro("Falha de conexão ao salvar.");
    } finally {
      setSalvando((s) => ({ ...s, [alunoId]: false }));
    }
  }

  async function salvarTodos() {
    setErro("");
    setSalvandoTodos(true);
    let falhas = 0;
    for (const a of alunos) {
      try {
        const ok = await salvarUm(a.id);
        if (ok) setSalvos((s) => ({ ...s, [a.id]: true }));
        else falhas++;
      } catch {
        falhas++;
      }
    }
    setSalvandoTodos(false);
    if (falhas > 0) setErro(`${falhas} lançamento(s) falharam. Tente novamente.`);
    else router.refresh();
  }

  if (alunos.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum aluno matriculado nesta turma.</p>;
  }

  return (
    <div className="space-y-2">
      {erro && <p className="msg-erro">{erro}</p>}
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
        {alunos.map((a) => {
          const atual = status[a.id] || iniciais[a.id] || "PRESENTE";
          return (
            <div key={a.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              <div className="min-w-[130px] flex-1">
                <p className="text-sm font-medium text-gray-800">{a.nome}</p>
                <p className="text-xs text-gray-400">{a.codigo}</p>
              </div>
              <select
                value={atual}
                onChange={(e) => {
                  setStatus((s) => ({ ...s, [a.id]: e.target.value }));
                  setSalvos((s) => ({ ...s, [a.id]: false }));
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:outline-none ${COR_STATUS[atual] || "border-gray-200"}`}
              >
                {opcoes.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={salvando[a.id] || salvandoTodos}
                onClick={() => salvar(a.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                  salvos[a.id]
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                }`}
              >
                {salvando[a.id] ? "..." : salvos[a.id] ? "Salvo ✓" : "Salvar"}
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={salvarTodos}
        disabled={salvandoTodos}
        className="btn-secondary w-full sm:w-auto"
      >
        {salvandoTodos && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        )}
        {salvandoTodos ? "Salvando todos..." : "Salvar todos"}
      </button>
    </div>
  );
}

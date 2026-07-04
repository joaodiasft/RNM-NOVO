"use client";

import { useState } from "react";

const STATUS_REDACAO = [
  "FALTA",
  "FALTA_JUSTIFICADA",
  "PRESENTE",
  "REPOSICAO_DATA",
  "REPOSICAO_TURMA_DATA",
];

const STATUS_SIMPLES = ["FALTA", "FALTA_JUSTIFICADA", "PRESENTE"];

interface Aluno {
  id: string;
  nome: string;
  codigo: string;
}

interface Props {
  aulaId: string;
  alunos: Aluno[];
  cursoRedacao?: boolean;
}

export function FormFrequencia({ aulaId, alunos, cursoRedacao }: Props) {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const opcoes = cursoRedacao ? STATUS_REDACAO : STATUS_SIMPLES;

  async function salvar(alunoId: string) {
    const st = status[alunoId] || "PRESENTE";
    const res = await fetch("/api/frequencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aulaId, alunoId, status: st }),
    });
    if (res.ok) setMsg("Frequência salva!");
    else setMsg("Erro ao salvar");
  }

  return (
    <div className="space-y-2">
      {msg && <p className="text-sm text-green-600">{msg}</p>}
      {alunos.map((a) => (
        <div key={a.id} className="flex flex-wrap items-center gap-2 border-b border-gray-50 pb-2">
          <span className="text-sm flex-1 min-w-[120px]">{a.nome}</span>
          <select
            value={status[a.id] || "PRESENTE"}
            onChange={(e) => setStatus({ ...status, [a.id]: e.target.value })}
            className="border rounded px-2 py-1 text-sm"
          >
            {opcoes.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => salvar(a.id)}
            className="text-xs bg-gray-800 text-white px-2 py-1 rounded"
          >
            Salvar
          </button>
        </div>
      ))}
    </div>
  );
}

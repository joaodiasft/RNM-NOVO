"use client";

import { useState } from "react";
import { Badge } from "@/components/DashboardShell";
import { CursoBadge } from "@/components/ui/CursoBadge";
import type { NomeCurso } from "@prisma/client";

interface AlunoItem {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  telefone: string | null;
  serie: string | null;
  cursos: NomeCurso[];
  responsaveis: string[];
}

export function ListaAlunosBusca({ alunos }: { alunos: AlunoItem[] }) {
  const [busca, setBusca] = useState("");
  const [soAtivos, setSoAtivos] = useState(false);

  const termo = busca.trim().toLowerCase();
  const filtrados = alunos.filter((a) => {
    if (soAtivos && !a.ativo) return false;
    if (!termo) return true;
    return (
      a.nome.toLowerCase().includes(termo) ||
      a.codigo.toLowerCase().includes(termo) ||
      (a.telefone ?? "").toLowerCase().includes(termo) ||
      a.responsaveis.some((r) => r.toLowerCase().includes(termo))
    );
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, matrícula, telefone ou responsável..."
          className="input"
        />
        <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-600">
          <input
            type="checkbox"
            checked={soAtivos}
            onChange={(e) => setSoAtivos(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Só ativos
        </label>
      </div>
      <p className="text-xs text-gray-400">
        {filtrados.length} de {alunos.length} aluno(s)
      </p>
      <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
        {filtrados.map((a) => (
          <div key={a.id} className="rounded-xl border border-gray-100 px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-gray-900">{a.nome}</p>
              <Badge tom={a.ativo ? "green" : "red"}>
                {a.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              {a.codigo}
              {a.telefone ? ` · ${a.telefone}` : ""}
              {a.serie ? ` · ${a.serie}` : ""}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {a.cursos.map((c, i) => (
                <CursoBadge key={i} curso={c} tamanho="sm" />
              ))}
              {a.cursos.length === 0 && (
                <span className="text-xs text-gray-400">Sem matrícula ativa</span>
              )}
            </div>
            {a.responsaveis.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                Resp.: {a.responsaveis.join(", ")}
              </p>
            )}
          </div>
        ))}
        {filtrados.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-500">
            Nenhum aluno encontrado para “{busca}”.
          </p>
        )}
      </div>
    </div>
  );
}

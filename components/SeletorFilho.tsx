"use client";

import { useSession } from "next-auth/react";

interface Aluno {
  id: string;
  nome: string;
  codigo: string;
}

export function SeletorFilho({ filhos }: { filhos: Aluno[] }) {
  const { data: session, update } = useSession();

  return (
    <select
      className="text-sm bg-white/20 rounded px-2 py-1"
      value={session?.user?.alunoSelecionadoId || filhos[0]?.id}
      onChange={(e) => update({ alunoSelecionadoId: e.target.value })}
    >
      {filhos.map((f) => (
        <option key={f.id} value={f.id}>{f.nome}</option>
      ))}
    </select>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Aluno {
  id: string;
  nome: string;
  codigo: string;
}

export function SeletorFilho({ filhos }: { filhos: Aluno[] }) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [trocando, setTrocando] = useState(false);

  async function trocar(alunoId: string) {
    setTrocando(true);
    try {
      await update({ alunoSelecionadoId: alunoId });
      router.refresh();
    } finally {
      setTrocando(false);
    }
  }

  return (
    <select
      className="max-w-[140px] truncate rounded-lg border border-white/25 bg-white/15 px-2 py-1.5 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-60 lg:border-gray-200 lg:bg-white lg:text-gray-800"
      value={session?.user?.alunoSelecionadoId || filhos[0]?.id}
      disabled={trocando}
      onChange={(e) => trocar(e.target.value)}
      title="Selecionar filho"
    >
      {filhos.map((f) => (
        <option key={f.id} value={f.id} className="text-gray-900">
          {f.nome}
        </option>
      ))}
    </select>
  );
}

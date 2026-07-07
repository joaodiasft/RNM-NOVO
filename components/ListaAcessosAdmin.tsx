"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icons";

interface Acesso {
  id: string;
  plataforma: string;
  email: string;
  urlAcesso: string;
  aluno: { nome: string; codigo: string };
}

export function ListaAcessosAdmin({ acessos }: { acessos: Acesso[] }) {
  const router = useRouter();
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");

  async function remover(id: string) {
    setErro("");
    setRemovendo(id);
    try {
      const res = await fetch("/api/operacional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "remover_acesso", acessoId: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.erro || "Erro ao remover acesso");
        return;
      }
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setRemovendo(null);
      setConfirmar(null);
    }
  }

  const filtrados = busca
    ? acessos.filter(
        (a) =>
          a.aluno.nome.toLowerCase().includes(busca.toLowerCase()) ||
          a.plataforma.toLowerCase().includes(busca.toLowerCase()) ||
          a.aluno.codigo.toLowerCase().includes(busca.toLowerCase())
      )
    : acessos;

  return (
    <div className="space-y-2">
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por aluno, matrícula ou plataforma..."
        className="input"
      />
      {erro && <p className="msg-erro">{erro}</p>}
      {filtrados.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">
          Nenhum acesso encontrado.
        </p>
      ) : (
        <ul className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
          {filtrados.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3.5 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900">
                  {a.plataforma}{" "}
                  <span className="font-normal text-gray-500">— {a.aluno.nome}</span>
                </p>
                <p className="truncate text-xs text-gray-500">
                  {a.aluno.codigo} · {a.email}
                </p>
              </div>
              {confirmar === a.id ? (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => remover(a.id)}
                    disabled={removendo !== null}
                    className="btn-danger px-2.5 py-1 text-xs"
                  >
                    {removendo === a.id ? "..." : "Confirmar"}
                  </button>
                  <button
                    onClick={() => setConfirmar(null)}
                    className="btn-secondary px-2.5 py-1 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmar(a.id)}
                  title="Remover acesso"
                  className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Icon name="alert" className="h-4.5 w-4.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

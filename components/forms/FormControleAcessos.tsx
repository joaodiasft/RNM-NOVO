"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UsuarioItem {
  id: string;
  nome: string;
  identificador: string;
  ativo: boolean;
  extra?: string;
}

interface Props {
  alunos: UsuarioItem[];
  professores: UsuarioItem[];
}

export function FormControleAcessos({ alunos, professores }: Props) {
  const router = useRouter();
  const [filtro, setFiltro] = useState("");
  const [aba, setAba] = useState<"aluno" | "professor">("aluno");
  const [salvando, setSalvando] = useState<string | null>(null);
  const [estados, setEstados] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const a of alunos) map[`aluno-${a.id}`] = a.ativo;
    for (const p of professores) map[`professor-${p.id}`] = p.ativo;
    return map;
  });
  const [msg, setMsg] = useState("");

  const lista = (aba === "aluno" ? alunos : professores).filter((u) => {
    const q = filtro.toLowerCase();
    return (
      u.nome.toLowerCase().includes(q) ||
      u.identificador.toLowerCase().includes(q) ||
      (u.extra?.toLowerCase().includes(q) ?? false)
    );
  });

  async function alternar(tipo: "aluno" | "professor", id: string) {
    const chave = `${tipo}-${id}`;
    const novoAtivo = !estados[chave];
    setSalvando(chave);
    setMsg("");
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, id, ativo: novoAtivo }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j.erro || "Erro ao alterar acesso.");
        return;
      }
      setEstados((s) => ({ ...s, [chave]: novoAtivo }));
      setMsg(novoAtivo ? "Acesso reativado." : "Acesso bloqueado — login impedido.");
      router.refresh();
    } catch {
      setMsg("Falha de conexao.");
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAba("aluno")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            aba === "aluno"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Alunos ({alunos.length})
        </button>
        <button
          type="button"
          onClick={() => setAba("professor")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            aba === "professor"
              ? "bg-teal-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Professores ({professores.length})
        </button>
      </div>

      <input
        type="search"
        placeholder="Buscar por nome ou matricula/e-mail..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />

      {msg && (
        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">{msg}</p>
      )}

      {lista.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum usuario encontrado.</p>
      ) : (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {lista.map((u) => {
            const tipo = aba;
            const chave = `${tipo}-${u.id}`;
            const ativo = estados[chave];
            return (
              <div
                key={chave}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                  ativo ? "border-gray-100 bg-white" : "border-red-100 bg-red-50/50"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{u.nome}</p>
                  <p className="text-xs text-gray-500">
                    {u.identificador}
                    {u.extra ? ` · ${u.extra}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      ativo
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {ativo ? "Ativo" : "Inativo"}
                  </span>
                  <button
                    type="button"
                    disabled={salvando === chave}
                    onClick={() => alternar(tipo, u.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                      ativo
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {salvando === chave ? "..." : ativo ? "Inativar" : "Reativar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Usuarios inativos nao conseguem fazer login. A acao e registrada na auditoria.
      </p>
    </div>
  );
}

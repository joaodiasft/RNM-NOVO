"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ICONES = ["🏅", "🏆", "⭐", "💎", "🥇", "📚", "✍️", "🚀"];

interface PremiacaoItem {
  id: string;
  titulo: string;
  icone: string | null;
  alunoNome: string;
  criadoEm: string;
}

export function FormPremiarAluno({
  alunos,
  premiacoes,
}: {
  alunos: { id: string; nome: string; codigo: string }[];
  premiacoes: PremiacaoItem[];
}) {
  const router = useRouter();
  const [icone, setIcone] = useState("🏅");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErro("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await fetch("/api/premiacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "premiar",
          alunoId: fd.get("alunoId"),
          titulo: fd.get("titulo"),
          descricao: fd.get("descricao"),
          icone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao premiar");
        return;
      }
      setMsg("Premiação concedida! O aluno já vê no painel dele. 🎉");
      form.reset();
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function remover(premiacaoId: string) {
    await fetch("/api/premiacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "remover", premiacaoId }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="field-label">Aluno *</label>
          <select name="alunoId" required className="input">
            <option value="">Selecione o aluno</option>
            {alunos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} ({a.codigo})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Título *</label>
          <input
            name="titulo"
            required
            maxLength={80}
            className="input"
            placeholder="Ex.: Destaque do mês, Melhor evolução..."
          />
        </div>
        <div>
          <label className="field-label">Descrição</label>
          <input
            name="descricao"
            maxLength={300}
            className="input"
            placeholder="Opcional — por que o aluno mereceu"
          />
        </div>
        <div>
          <label className="field-label">Ícone</label>
          <div className="flex flex-wrap gap-1.5">
            {ICONES.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcone(i)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition ${
                  icone === i
                    ? "border-indigo-400 bg-indigo-50 shadow-sm"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
        {msg && <p className="msg-ok">{msg}</p>}
        {erro && <p className="msg-erro">{erro}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Premiando..." : "Conceder premiação"}
        </button>
      </form>

      {premiacoes.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            Últimas premiações
          </p>
          <ul className="space-y-1.5">
            {premiacoes.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  {p.icone} <strong>{p.titulo}</strong>{" "}
                  <span className="text-gray-500">— {p.alunoNome}</span>
                </span>
                <button
                  onClick={() => remover(p.id)}
                  className="shrink-0 text-xs font-medium text-gray-400 hover:text-red-600"
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

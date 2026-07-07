"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Promocao {
  id: string;
  titulo: string;
  ativo: boolean;
  dataInicio: string;
  dataFim: string;
}

export function FormPromocao({
  cursos,
  promocoes,
}: {
  cursos: { id: string; nome: string }[];
  promocoes: Promocao[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  const LABEL: Record<string, string> = {
    REDACAO: "Redação",
    EXATAS: "Exatas",
    MATEMATICA: "Matemática",
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErro("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await fetch("/api/academico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "criar_promocao",
          titulo: fd.get("titulo"),
          descricao: fd.get("descricao"),
          cursoId: fd.get("cursoId") || undefined,
          percentualDesconto: fd.get("percentualDesconto") || 0,
          dataInicio: fd.get("dataInicio"),
          dataFim: fd.get("dataFim"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao criar promoção");
        return;
      }
      setMsg("Promoção publicada — os alunos já veem em Cursos!");
      form.reset();
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function alternar(promocaoId: string, ativo: boolean) {
    await fetch("/api/academico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "alternar_promocao", promocaoId, ativo }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="field-label">Título *</label>
          <input name="titulo" required className="input" placeholder="Ex.: Matrícula com 20% off" />
        </div>
        <div>
          <label className="field-label">Descrição</label>
          <textarea name="descricao" rows={2} className="input resize-y" placeholder="Detalhes da promoção" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Curso</label>
            <select name="cursoId" className="input">
              <option value="">Todos os cursos</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {LABEL[c.nome] ?? c.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Desconto (%)</label>
            <input name="percentualDesconto" type="number" min={0} max={100} defaultValue={0} className="input" />
          </div>
          <div>
            <label className="field-label">Início *</label>
            <input name="dataInicio" type="date" required className="input" />
          </div>
          <div>
            <label className="field-label">Fim *</label>
            <input name="dataFim" type="date" required className="input" />
          </div>
        </div>
        {msg && <p className="msg-ok">{msg}</p>}
        {erro && <p className="msg-erro">{erro}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Publicando..." : "Publicar promoção"}
        </button>
      </form>

      {promocoes.length > 0 && (
        <ul className="space-y-2">
          {promocoes.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-800">{p.titulo}</p>
                <p className="text-xs text-gray-400">
                  {new Date(p.dataInicio).toLocaleDateString("pt-BR")} —{" "}
                  {new Date(p.dataFim).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <button
                onClick={() => alternar(p.id, !p.ativo)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  p.ativo ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {p.ativo ? "Ativa" : "Inativa"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

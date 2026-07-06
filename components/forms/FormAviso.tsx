"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  cursos: { id: string; nome: string }[];
  turmas: { id: string; nome: string; curso: { nome: string } }[];
  alunos: { id: string; nome: string; codigo: string }[];
}

const LABEL_CURSO: Record<string, string> = {
  REDACAO: "Redação",
  EXATAS: "Exatas",
  MATEMATICA: "Matemática",
};

export function FormAviso({ cursos, turmas, alunos }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("TODOS");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErro("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await fetch("/api/operacional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "criar_aviso",
          titulo: fd.get("titulo"),
          mensagem: fd.get("mensagem"),
          publicoAlvo,
          cursoId: fd.get("cursoId") || undefined,
          turmaId: fd.get("turmaId") || undefined,
          alunoId: fd.get("alunoId") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao publicar aviso");
        return;
      }
      setMsg("Aviso publicado!");
      form.reset();
      setPublicoAlvo("TODOS");
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="field-label">Título *</label>
        <input name="titulo" placeholder="Título do aviso" required maxLength={120} className="input" />
      </div>
      <div>
        <label className="field-label">Mensagem *</label>
        <textarea
          name="mensagem"
          placeholder="Escreva a mensagem..."
          required
          maxLength={2000}
          rows={4}
          className="input resize-y"
        />
      </div>
      <div>
        <label className="field-label">Público-alvo</label>
        <select
          value={publicoAlvo}
          onChange={(e) => setPublicoAlvo(e.target.value)}
          className="input"
        >
          <option value="TODOS">Todos</option>
          <option value="CURSO">Um curso</option>
          <option value="TURMA">Uma turma</option>
          <option value="ALUNO">Um aluno</option>
        </select>
      </div>

      {publicoAlvo === "CURSO" && (
        <div className="animate-fade-in">
          <label className="field-label">Curso *</label>
          <select name="cursoId" required className="input">
            <option value="">Selecione o curso</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {LABEL_CURSO[c.nome] ?? c.nome}
              </option>
            ))}
          </select>
        </div>
      )}
      {publicoAlvo === "TURMA" && (
        <div className="animate-fade-in">
          <label className="field-label">Turma *</label>
          <select name="turmaId" required className="input">
            <option value="">Selecione a turma</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} — {LABEL_CURSO[t.curso.nome] ?? t.curso.nome}
              </option>
            ))}
          </select>
        </div>
      )}
      {publicoAlvo === "ALUNO" && (
        <div className="animate-fade-in">
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
      )}

      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? "Publicando..." : "Publicar aviso"}
      </button>
    </form>
  );
}

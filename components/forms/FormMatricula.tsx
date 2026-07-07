"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Turma {
  id: string;
  nome: string;
  curso: { nome: string };
}

const LABEL_CURSO: Record<string, string> = {
  REDACAO: "Redação",
  EXATAS: "Exatas",
  MATEMATICA: "Matemática",
};

/** Admin matricula um aluno já cadastrado em um curso/turma/plano. */
export function FormMatricula({
  alunos,
  turmas,
  planos,
}: {
  alunos: { id: string; nome: string; codigo: string }[];
  turmas: Turma[];
  planos: { id: string; nome: string }[];
}) {
  const router = useRouter();
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
      const res = await fetch("/api/operacional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "criar_matricula",
          alunoId: fd.get("alunoId"),
          turmaId: fd.get("turmaId"),
          planoId: fd.get("planoId"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao matricular");
        return;
      }
      setMsg("Matrícula criada! O 1º pagamento já foi gerado como pendente.");
      form.reset();
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Curso / Turma *</label>
          <select name="turmaId" required className="input">
            <option value="">Selecione</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {LABEL_CURSO[t.curso.nome] ?? t.curso.nome} — Turma {t.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Plano *</label>
          <select name="planoId" required className="input">
            <option value="">Selecione</option>
            {planos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Regras aplicadas pelo servidor: máx. 2 cursos por aluno, 1 turma por curso,
        respeitando vagas e planos do curso.
      </p>
      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Matriculando..." : "Criar matrícula"}
      </button>
    </form>
  );
}

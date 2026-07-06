"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DIAS = [
  ["SEGUNDA", "Segunda-feira"],
  ["TERCA", "Terça-feira"],
  ["QUARTA", "Quarta-feira"],
  ["QUINTA", "Quinta-feira"],
  ["SEXTA", "Sexta-feira"],
  ["SABADO", "Sábado"],
  ["DOMINGO", "Domingo"],
];

export function FormNovaTurma() {
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
      const res = await fetch("/api/academico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "criar_turma",
          nome: fd.get("nome"),
          cursoNome: fd.get("cursoNome"),
          diaSemana: fd.get("diaSemana"),
          horaInicio: fd.get("horaInicio"),
          horaFim: fd.get("horaFim"),
          capacidade: fd.get("capacidade"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao criar turma");
        return;
      }
      setMsg(`Turma "${data.nome}" criada!`);
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Nome da turma *</label>
          <input name="nome" placeholder="Ex.: A, B, Noite..." required className="input" />
        </div>
        <div>
          <label className="field-label">Curso *</label>
          <select name="cursoNome" required className="input">
            <option value="REDACAO">Redação</option>
            <option value="EXATAS">Exatas</option>
            <option value="MATEMATICA">Matemática</option>
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Dia da semana *</label>
          <select name="diaSemana" required className="input">
            {DIAS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Capacidade</label>
          <input
            name="capacidade"
            type="number"
            min={1}
            max={200}
            defaultValue={30}
            className="input"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Início *</label>
          <input name="horaInicio" type="time" required defaultValue="14:00" className="input" />
        </div>
        <div>
          <label className="field-label">Fim *</label>
          <input name="horaFim" type="time" required defaultValue="16:00" className="input" />
        </div>
      </div>
      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Criando..." : "Criar turma"}
      </button>
    </form>
  );
}

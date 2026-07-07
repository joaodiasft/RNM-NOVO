"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Turma {
  id: string;
  nome: string;
  cursoId: string;
  curso: { nome: string };
}

interface CursoPlano {
  cursoId: string;
  planoId: string;
  valor: number;
}

const LABEL_CURSO: Record<string, string> = {
  REDACAO: "Redação",
  EXATAS: "Exatas",
  MATEMATICA: "Matemática",
};

function labelTurma(t: Turma) {
  return `${LABEL_CURSO[t.curso.nome] ?? t.curso.nome} — Turma ${t.nome}`;
}

/** Admin matricula aluno em 1 ou 2 cursos com valor por curso. */
export function FormMatricula({
  alunos,
  turmas,
  planos,
  cursoPlanos,
}: {
  alunos: { id: string; nome: string; codigo: string }[];
  turmas: Turma[];
  planos: { id: string; nome: string }[];
  cursoPlanos: CursoPlano[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [temCurso2, setTemCurso2] = useState(false);
  const [turma1Id, setTurma1Id] = useState("");
  const [plano1Id, setPlano1Id] = useState("");
  const [turma2Id, setTurma2Id] = useState("");
  const [plano2Id, setPlano2Id] = useState("");
  const [valor1, setValor1] = useState("");
  const [valor2, setValor2] = useState("");

  const turma1 = turmas.find((t) => t.id === turma1Id);
  const turma2 = turmas.find((t) => t.id === turma2Id);

  const precoSugerido1 = useMemo(() => {
    if (!turma1 || !plano1Id) return null;
    const cp = cursoPlanos.find(
      (c) => c.cursoId === turma1.cursoId && c.planoId === plano1Id
    );
    return cp ? cp.valor : null;
  }, [turma1, plano1Id, cursoPlanos]);

  const precoSugerido2 = useMemo(() => {
    if (!turma2 || !plano2Id) return null;
    const cp = cursoPlanos.find(
      (c) => c.cursoId === turma2.cursoId && c.planoId === plano2Id
    );
    return cp ? cp.valor : null;
  }, [turma2, plano2Id, cursoPlanos]);

  const turmasCurso2 = turmas.filter(
    (t) => !turma1 || t.cursoId !== turma1.cursoId
  );

  useEffect(() => {
    if (precoSugerido1 != null) setValor1(String(precoSugerido1));
  }, [precoSugerido1]);

  useEffect(() => {
    if (precoSugerido2 != null) setValor2(String(precoSugerido2));
  }, [precoSugerido2]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErro("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const payload: Record<string, unknown> = {
        acao: "criar_matricula",
        alunoId: fd.get("alunoId"),
        turmaId: turma1Id,
        planoId: plano1Id,
      };
      if (valor1) payload.valor = Number(valor1.replace(",", "."));
      if (temCurso2 && turma2Id) {
        payload.turma2Id = turma2Id;
        payload.plano2Id = plano2Id || plano1Id;
        if (valor2) payload.valor2 = Number(valor2.replace(",", "."));
      }
      const res = await fetch("/api/operacional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao matricular");
        return;
      }
      const qtd = data.matriculas?.length ?? 1;
      setMsg(
        qtd > 1
          ? "2 matrículas criadas! Pagamentos pendentes gerados para cada curso."
          : "Matrícula criada! Pagamento pendente gerado no financeiro."
      );
      form.reset();
      setTurma1Id("");
      setPlano1Id("");
      setTurma2Id("");
      setPlano2Id("");
      setValor1("");
      setValor2("");
      setTemCurso2(false);
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
          Curso 1 (obrigatório)
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Turma *</label>
            <select
              name="turmaId"
              required
              className="input"
              value={turma1Id}
              onChange={(e) => {
                setTurma1Id(e.target.value);
                setValor1("");
              }}
            >
              <option value="">Selecione</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {labelTurma(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Plano *</label>
            <select
              name="planoId"
              required
              className="input"
              value={plano1Id}
              onChange={(e) => {
                setPlano1Id(e.target.value);
                setValor1("");
              }}
            >
              <option value="">Selecione</option>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="field-label">
            Valor do pagamento (R$) *
            {precoSugerido1 != null && (
              <span className="ml-1 font-normal text-gray-400">
                — sugerido: R$ {precoSugerido1.toFixed(2)}
              </span>
            )}
          </label>
          <input
            name="valor1"
            type="number"
            step="0.01"
            min="0"
            required
            className="input"
            placeholder={precoSugerido1 != null ? precoSugerido1.toFixed(2) : "0,00"}
            value={valor1}
            onChange={(e) => setValor1(e.target.value)}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={temCurso2}
          onChange={(e) => setTemCurso2(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        Matricular também em um 2º curso
      </label>

      {temCurso2 && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            Curso 2 (opcional)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Turma</label>
              <select
                className="input"
                value={turma2Id}
                onChange={(e) => {
                  setTurma2Id(e.target.value);
                  setValor2("");
                }}
              >
                <option value="">Selecione outro curso</option>
                {turmasCurso2.map((t) => (
                  <option key={t.id} value={t.id}>
                    {labelTurma(t)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Plano</label>
              <select
                className="input"
                value={plano2Id}
                onChange={(e) => {
                  setPlano2Id(e.target.value);
                  setValor2("");
                }}
              >
                <option value="">Mesmo plano ou escolha</option>
                {planos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {turma2Id && (
            <div>
              <label className="field-label">
                Valor curso 2 (R$)
                {precoSugerido2 != null && (
                  <span className="ml-1 font-normal text-gray-400">
                    — sugerido: R$ {precoSugerido2.toFixed(2)}
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder={precoSugerido2 != null ? precoSugerido2.toFixed(2) : "0,00"}
                value={valor2}
                onChange={(e) => setValor2(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Cada curso gera um pagamento pendente no Financeiro. Máx. 2 cursos por aluno.
      </p>
      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full min-h-[44px]">
        {loading ? "Matriculando..." : "Criar matrícula"}
      </button>
    </form>
  );
}

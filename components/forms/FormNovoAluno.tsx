"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  turmas: { id: string; nome: string; curso: { nome: string } }[];
  planos: { id: string; nome: string }[];
}

export function FormNovoAluno({ turmas, planos }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [senhaResp, setSenhaResp] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErro("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = {
      nome: fd.get("nome"),
      senha: fd.get("senha") || undefined,
      dataNascimento: fd.get("dataNascimento") || undefined,
      turmaId: fd.get("turmaId") || undefined,
      planoId: fd.get("planoId") || undefined,
      responsavel: fd.get("respNome")
        ? {
            nome: fd.get("respNome"),
            telefone: fd.get("respTelefone"),
            parentesco: fd.get("parentesco"),
          }
        : undefined,
    };

    try {
      const res = await fetch("/api/admin/alunos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.erro || "Erro ao cadastrar");
        return;
      }

      setMsg(`Aluno ${data.aluno.codigo} cadastrado com sucesso!`);
      if (data.senhaResponsavel) setSenhaResp(data.senhaResponsavel);
      form.reset();
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="field-label">Nome do aluno *</label>
        <input name="nome" placeholder="Nome completo" required className="input" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Senha</label>
          <input name="senha" type="password" placeholder="Padrão: Aluno@2026" className="input" />
        </div>
        <div>
          <label className="field-label">Data de nascimento</label>
          <input name="dataNascimento" type="date" className="input" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Turma</label>
          <select name="turmaId" className="input">
            <option value="">Sem turma (opcional)</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} — {t.curso.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Plano</label>
          <select name="planoId" className="input">
            <option value="">Sem plano (opcional)</option>
            {planos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-3.5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Responsável (opcional)
        </p>
        <div className="space-y-3">
          <input name="respNome" placeholder="Nome do responsável" className="input" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="respTelefone" placeholder="Telefone" className="input" />
            <input name="parentesco" placeholder="Parentesco (mãe, pai...)" className="input" />
          </div>
        </div>
      </div>

      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      {senhaResp && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
          Senha gerada para o responsável: <strong>{senhaResp}</strong> — anote e repasse com segurança.
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}
        {loading ? "Salvando..." : "Cadastrar aluno"}
      </button>
    </form>
  );
}

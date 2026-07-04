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
  const [senhaResp, setSenhaResp] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
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

    const res = await fetch("/api/admin/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMsg(data.erro || "Erro ao cadastrar");
      return;
    }

    setMsg(`Aluno ${data.aluno.codigo} cadastrado!`);
    if (data.senhaResponsavel) setSenhaResp(data.senhaResponsavel);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input name="nome" placeholder="Nome do aluno" required className="w-full border rounded-lg px-3 py-2 text-sm" />
      <input name="senha" type="password" placeholder="Senha (padrão: Aluno@2026)" className="w-full border rounded-lg px-3 py-2 text-sm" />
      <input name="dataNascimento" type="date" className="w-full border rounded-lg px-3 py-2 text-sm" />
      <select name="turmaId" className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Turma (opcional)</option>
        {turmas.map((t) => (
          <option key={t.id} value={t.id}>{t.nome} — {t.curso.nome}</option>
        ))}
      </select>
      <select name="planoId" className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Plano (opcional)</option>
        {planos.map((p) => (
          <option key={p.id} value={p.id}>{p.nome}</option>
        ))}
      </select>
      <hr className="border-gray-100" />
      <p className="text-xs text-gray-500 font-medium">Responsável (opcional)</p>
      <input name="respNome" placeholder="Nome do responsável" className="w-full border rounded-lg px-3 py-2 text-sm" />
      <input name="respTelefone" placeholder="Telefone" className="w-full border rounded-lg px-3 py-2 text-sm" />
      <input name="parentesco" placeholder="Parentesco" className="w-full border rounded-lg px-3 py-2 text-sm" />
      {msg && <p className="text-sm text-green-700 bg-green-50 rounded px-2 py-1">{msg}</p>}
      {senhaResp && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded px-2 py-1">
          Senha do responsável: <strong>{senhaResp}</strong>
        </p>
      )}
      <button type="submit" disabled={loading} className="w-full bg-rnm-admin text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
        {loading ? "Salvando..." : "Cadastrar aluno"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Turma {
  id: string;
  nome: string;
  curso: { nome: string };
}

interface Props {
  turmas: Turma[];
  planos: { id: string; nome: string }[];
  responsaveis: { id: string; nome: string; telefone: string | null }[];
}

const LABEL_CURSO: Record<string, string> = {
  REDACAO: "Redação",
  EXATAS: "Exatas",
  MATEMATICA: "Matemática",
};

function labelTurma(t: Turma) {
  return `${LABEL_CURSO[t.curso.nome] ?? t.curso.nome} — Turma ${t.nome}`;
}

export function FormNovoAluno({ turmas, planos, responsaveis }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [senhaResp, setSenhaResp] = useState("");
  const [temCurso2, setTemCurso2] = useState(false);
  const [temResponsavel, setTemResponsavel] = useState(true);
  const [modoResp, setModoResp] = useState<"novo" | "existente">("novo");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErro("");
    setSenhaResp("");
    const form = e.currentTarget;
    const fd = new FormData(form);

    const responsavel = !temResponsavel
      ? undefined
      : modoResp === "novo"
        ? {
            modo: "novo" as const,
            nome: fd.get("respNome"),
            telefone: fd.get("respTelefone"),
            parentesco: fd.get("parentesco"),
            senha: fd.get("respSenha") || undefined,
          }
        : {
            modo: "existente" as const,
            responsavelId: fd.get("responsavelId"),
            parentesco: fd.get("parentesco"),
          };

    const body = {
      nome: fd.get("nome"),
      telefone: fd.get("telefone"),
      escola: fd.get("escola"),
      serie: fd.get("serie"),
      dataNascimento: fd.get("dataNascimento"),
      turmaId: fd.get("turmaId"),
      planoId: fd.get("planoId"),
      email: fd.get("email") || undefined,
      senha: fd.get("senha") || undefined,
      whatsapp: fd.get("whatsapp") || undefined,
      instagram: fd.get("instagram") || undefined,
      cpf: fd.get("cpf") || undefined,
      rg: fd.get("rg") || undefined,
      endereco: fd.get("endereco") || undefined,
      turma2Id: temCurso2 ? fd.get("turma2Id") || undefined : undefined,
      plano2Id: temCurso2 ? fd.get("plano2Id") || undefined : undefined,
      responsavel,
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
      setMsg(`Aluno ${data.aluno.codigo} cadastrado e matriculado!`);
      if (data.senhaResponsavel) setSenhaResp(data.senhaResponsavel);
      form.reset();
      setTemCurso2(false);
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ===== Dados do aluno ===== */}
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
        Dados do aluno
      </p>
      <div>
        <label className="field-label">Nome completo *</label>
        <input name="nome" required className="input" placeholder="Nome do aluno" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Telefone *</label>
          <input name="telefone" required className="input" placeholder="(62) 9 0000-0000" />
        </div>
        <div>
          <label className="field-label">Data de nascimento *</label>
          <input name="dataNascimento" type="date" required className="input" />
        </div>
        <div>
          <label className="field-label">Onde estuda *</label>
          <input name="escola" required className="input" placeholder="Nome da escola" />
        </div>
        <div>
          <label className="field-label">Série atual *</label>
          <input name="serie" required className="input" placeholder="Ex.: 3º ano EM" />
        </div>
        <div>
          <label className="field-label">E-mail (para recuperar senha)</label>
          <input name="email" type="email" className="input" placeholder="aluno@email.com" />
        </div>
        <div>
          <label className="field-label">Senha de acesso</label>
          <input name="senha" type="password" className="input" placeholder="Padrão: Aluno@2026" />
        </div>
        <div>
          <label className="field-label">WhatsApp</label>
          <input name="whatsapp" className="input" placeholder="Se diferente do telefone" />
        </div>
        <div>
          <label className="field-label">Instagram</label>
          <input name="instagram" className="input" placeholder="@usuario" />
        </div>
        <div>
          <label className="field-label">CPF</label>
          <input name="cpf" className="input" placeholder="Opcional" />
        </div>
        <div>
          <label className="field-label">RG</label>
          <input name="rg" className="input" placeholder="Opcional" />
        </div>
      </div>
      <div>
        <label className="field-label">Endereço</label>
        <input name="endereco" className="input" placeholder="Opcional" />
      </div>

      {/* ===== Matrícula ===== */}
      <p className="pt-1 text-xs font-bold uppercase tracking-wide text-gray-400">
        Matrícula — Curso 1
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Curso / Turma *</label>
          <select name="turmaId" required className="input">
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

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={temCurso2}
          onChange={(e) => setTemCurso2(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        Matricular em um 2º curso
      </label>

      {temCurso2 && (
        <div className="animate-fade-in grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Curso / Turma 2 *</label>
            <select name="turma2Id" required={temCurso2} className="input">
              <option value="">Selecione</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {labelTurma(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Plano do curso 2</label>
            <select name="plano2Id" className="input">
              <option value="">Mesmo plano do curso 1</option>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ===== Responsável ===== */}
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-3.5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Responsável
          </p>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <input
              type="checkbox"
              checked={temResponsavel}
              onChange={(e) => setTemResponsavel(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Cadastrar responsável
          </label>
        </div>

        {temResponsavel && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModoResp("novo")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  modoResp === "novo"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                Cadastrar novo
              </button>
              <button
                type="button"
                onClick={() => setModoResp("existente")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  modoResp === "existente"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                Puxar do sistema (irmãos)
              </button>
            </div>

            {modoResp === "novo" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label">Nome do responsável *</label>
                  <input name="respNome" required={temResponsavel} className="input" />
                </div>
                <div>
                  <label className="field-label">Telefone *</label>
                  <input name="respTelefone" required={temResponsavel} className="input" />
                </div>
                <div>
                  <label className="field-label">Parentesco</label>
                  <input name="parentesco" className="input" placeholder="mãe, pai..." />
                </div>
                <div>
                  <label className="field-label">Senha de acesso</label>
                  <input
                    name="respSenha"
                    className="input"
                    placeholder="Vazio = gera do nome"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label">Responsável existente *</label>
                  <select name="responsavelId" required={temResponsavel} className="input">
                    <option value="">Selecione</option>
                    {responsaveis.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nome}
                        {r.telefone ? ` — ${r.telefone}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Parentesco</label>
                  <input name="parentesco" className="input" placeholder="mãe, pai..." />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      {senhaResp && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
          Senha do responsável: <strong>{senhaResp}</strong> — anote agora, ela não
          será exibida de novo.
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}
        {loading ? "Cadastrando..." : "Cadastrar aluno + matrícula"}
      </button>
    </form>
  );
}

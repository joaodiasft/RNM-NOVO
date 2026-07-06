"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FormNovoProfessor({
  turmas,
}: {
  turmas: { id: string; nome: string; curso: { nome: string } }[];
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
      const res = await fetch("/api/academico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "criar_professor",
          nome: fd.get("nome"),
          email: fd.get("email"),
          senha: fd.get("senha"),
          turmaId: fd.get("turmaId"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao cadastrar professor");
        return;
      }
      setMsg(`Professor ${data.nome} cadastrado!`);
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
        <label className="field-label">Nome *</label>
        <input name="nome" placeholder="Nome completo" required className="input" />
      </div>
      <div>
        <label className="field-label">E-mail *</label>
        <input
          name="email"
          type="email"
          placeholder="professor@redacaonota1000.com.br"
          required
          className="input"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Senha</label>
          <input name="senha" type="password" placeholder="Padrão: Prof@2026" className="input" />
        </div>
        <div>
          <label className="field-label">Vincular à turma</label>
          <select name="turmaId" className="input">
            <option value="">Nenhuma (opcional)</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} — {t.curso.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Salvando..." : "Cadastrar professor"}
      </button>
    </form>
  );
}

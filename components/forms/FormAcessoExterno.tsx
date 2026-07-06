"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FormAcessoExterno({
  alunos,
}: {
  alunos: { id: string; nome: string; codigo: string }[];
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
          acao: "cadastrar_acesso",
          alunoId: fd.get("alunoId"),
          plataforma: fd.get("plataforma"),
          urlAcesso: fd.get("urlAcesso"),
          email: fd.get("email"),
          senha: fd.get("senha"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao cadastrar acesso");
        return;
      }
      setMsg("Acesso cadastrado com sucesso!");
      form.reset();
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-3">
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
        <label className="field-label">Plataforma *</label>
        <input name="plataforma" placeholder="SOFIA, COREDAÇÃO..." required className="input" />
      </div>
      <div>
        <label className="field-label">URL de acesso *</label>
        <input name="urlAcesso" type="url" placeholder="https://..." required className="input" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">E-mail de login *</label>
          <input name="email" placeholder="login@plataforma.com" required className="input" />
        </div>
        <div>
          <label className="field-label">Senha *</label>
          <input name="senha" placeholder="Senha da plataforma" required className="input" />
        </div>
      </div>
      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? "Salvando..." : "Salvar acesso"}
      </button>
    </form>
  );
}

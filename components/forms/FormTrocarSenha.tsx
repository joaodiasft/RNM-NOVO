"use client";

import { useState } from "react";

export function FormTrocarSenha() {
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
    const nova = fd.get("novaSenha") as string;
    const confirma = fd.get("confirmaSenha") as string;

    if (nova !== confirma) {
      setErro("A confirmação não confere com a nova senha.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/perfil/senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senhaAtual: fd.get("senhaAtual"),
          novaSenha: nova,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao trocar a senha");
        return;
      }
      setMsg("Senha alterada com sucesso!");
      form.reset();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-sm space-y-3">
      <div>
        <label className="field-label">Senha atual *</label>
        <input
          name="senhaAtual"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      <div>
        <label className="field-label">Nova senha *</label>
        <input
          name="novaSenha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="input"
        />
        <p className="mt-1 text-xs text-gray-400">
          Mínimo de 8 caracteres, com pelo menos uma letra e um número.
        </p>
      </div>
      <div>
        <label className="field-label">Confirmar nova senha *</label>
        <input
          name="confirmaSenha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="input"
        />
      </div>
      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? "Alterando..." : "Alterar senha"}
      </button>
    </form>
  );
}

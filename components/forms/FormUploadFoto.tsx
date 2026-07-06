"use client";

import { useState } from "react";

export function FormUploadFoto({ tipo, userId }: { tipo: string; userId: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setErro("");
    const fd = new FormData(e.currentTarget);
    fd.set("tipo", tipo);
    fd.set("userId", userId);
    try {
      const res = await fetch("/api/upload/foto", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro no upload");
        return;
      }
      setMsg("Foto enviada com sucesso!");
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        name="file"
        type="file"
        accept="image/*"
        required
        className="block w-full text-sm text-gray-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-gray-700"
      />
      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? "Enviando..." : "Enviar foto"}
      </button>
    </form>
  );
}

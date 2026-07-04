"use client";

export function FormAviso() {
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/operacional", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "criar_aviso",
        titulo: fd.get("titulo"),
        mensagem: fd.get("mensagem"),
        publicoAlvo: fd.get("publicoAlvo"),
      }),
    });
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input name="titulo" placeholder="Título" required className="w-full border rounded-lg px-3 py-2 text-sm" />
      <textarea name="mensagem" placeholder="Mensagem" required rows={4} className="w-full border rounded-lg px-3 py-2 text-sm" />
      <select name="publicoAlvo" className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="TODOS">Todos</option>
        <option value="CURSO">Curso</option>
        <option value="TURMA">Turma</option>
        <option value="ALUNO">Aluno</option>
      </select>
      <button type="submit" className="bg-rnm-admin text-white rounded-lg px-4 py-2 text-sm">Publicar</button>
    </form>
  );
}

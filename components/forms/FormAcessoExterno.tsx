"use client";

export function FormAcessoExterno({ alunos }: { alunos: { id: string; nome: string; codigo: string }[] }) {
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/operacional", {
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
    alert("Acesso cadastrado!");
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-w-md">
      <select name="alunoId" required className="w-full border rounded-lg px-3 py-2 text-sm">
        <option value="">Aluno</option>
        {alunos.map((a) => (
          <option key={a.id} value={a.id}>{a.nome} ({a.codigo})</option>
        ))}
      </select>
      <input name="plataforma" placeholder="Plataforma (SOFIA, COREDACAO...)" required className="w-full border rounded-lg px-3 py-2 text-sm" />
      <input name="urlAcesso" placeholder="URL" required className="w-full border rounded-lg px-3 py-2 text-sm" />
      <input name="email" placeholder="E-mail de login" required className="w-full border rounded-lg px-3 py-2 text-sm" />
      <input name="senha" placeholder="Senha" required className="w-full border rounded-lg px-3 py-2 text-sm" />
      <button type="submit" className="bg-rnm-admin text-white rounded-lg px-4 py-2 text-sm">Salvar</button>
    </form>
  );
}

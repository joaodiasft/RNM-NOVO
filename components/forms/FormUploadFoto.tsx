"use client";

export function FormUploadFoto({ tipo, userId }: { tipo: string; userId: string }) {
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("tipo", tipo);
    fd.set("userId", userId);
    const res = await fetch("/api/upload/foto", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) alert(`Upload OK: ${data.url}`);
    else alert(data.erro || "Erro no upload");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input name="file" type="file" accept="image/*" required className="text-sm" />
      <button type="submit" className="bg-rnm-admin text-white rounded-lg px-4 py-2 text-sm">Enviar foto</button>
    </form>
  );
}

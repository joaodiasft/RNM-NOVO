"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Admin cadastra o tema e o material (PDF) de cada aula. */
export function FormTemaAula({
  aulaId,
  temaInicial,
  materialInicial,
}: {
  aulaId: string;
  temaInicial?: string | null;
  materialInicial?: string | null;
}) {
  const router = useRouter();
  const [tema, setTema] = useState(temaInicial ?? "");
  const [material, setMaterial] = useState(materialInicial ?? "");
  const [loading, setLoading] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    setLoading(true);
    setErro("");
    setSalvo(false);
    try {
      const res = await fetch("/api/academico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "atualizar_aula",
          aulaId,
          conteudo: tema,
          materialUrl: material,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.erro || "Erro ao salvar");
        return;
      }
      setSalvo(true);
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={tema}
        onChange={(e) => {
          setTema(e.target.value);
          setSalvo(false);
        }}
        placeholder="Tema da aula"
        maxLength={300}
        className="min-w-[140px] flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
      />
      <input
        value={material}
        onChange={(e) => {
          setMaterial(e.target.value);
          setSalvo(false);
        }}
        placeholder="Link do PDF (para quem faltou)"
        maxLength={500}
        className="min-w-[140px] flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
      />
      <button
        type="button"
        onClick={salvar}
        disabled={loading}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
          salvo ? "bg-emerald-50 text-emerald-700" : "bg-gray-900 text-white hover:bg-gray-700"
        }`}
      >
        {loading ? "..." : salvo ? "Salvo ✓" : "Salvar"}
      </button>
      {erro && <p className="w-full text-xs text-red-600">{erro}</p>}
    </div>
  );
}

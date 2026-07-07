"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Aluno avalia o curso com 1–5 estrelas + comentário. */
export function FormFeedbackCurso({
  cursoId,
  cursoLabel,
  notaInicial,
  comentarioInicial,
}: {
  cursoId: string;
  cursoLabel: string;
  notaInicial?: number | null;
  comentarioInicial?: string | null;
}) {
  const router = useRouter();
  const [nota, setNota] = useState(notaInicial ?? 0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState(comentarioInicial ?? "");
  const [aberto, setAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  async function enviar() {
    if (nota < 1) {
      setErro("Escolha de 1 a 5 estrelas.");
      return;
    }
    setLoading(true);
    setMsg("");
    setErro("");
    try {
      const res = await fetch("/api/feedback-curso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cursoId, nota, comentario }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao enviar avaliação");
        return;
      }
      setMsg("Avaliação enviada — obrigado! 💜");
      setAberto(false);
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500">
            {notaInicial ? "Sua avaliação:" : `Avalie ${cursoLabel}:`}
          </span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setNota(n);
                  setAberto(true);
                }}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="px-0.5 text-xl transition-transform hover:scale-125"
                title={`${n} estrela(s)`}
              >
                <span
                  className={
                    (hover || nota) >= n ? "grayscale-0" : "opacity-30 grayscale"
                  }
                >
                  ⭐
                </span>
              </button>
            ))}
          </div>
        </div>
        {notaInicial && !aberto && (
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            Editar avaliação
          </button>
        )}
      </div>

      {aberto && (
        <div className="animate-fade-in mt-2 space-y-2">
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={600}
            rows={2}
            placeholder="Conte o que está achando do curso (opcional)"
            className="input resize-y text-sm"
          />
          <button
            type="button"
            onClick={enviar}
            disabled={loading}
            className="btn-primary px-4 py-2 text-xs"
          >
            {loading ? "Enviando..." : "Enviar avaliação"}
          </button>
        </div>
      )}
      {msg && <p className="msg-ok mt-2">{msg}</p>}
      {erro && <p className="msg-erro mt-2">{erro}</p>}
    </div>
  );
}

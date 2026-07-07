"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Correcao {
  numero: number;
  nota: unknown;
  notaSofia: unknown;
  competencias: string | null;
}

/**
 * Aluno preenche as notas das redações já corrigidas (professora + Sofia
 * + competências ENEM). Fica pendente até o admin aprovar.
 */
export function FormNotasAluno({
  entregaId,
  quantidade,
  correcoes,
}: {
  entregaId: string;
  quantidade: number;
  correcoes: Correcao[];
}) {
  const router = useRouter();
  const [linhas, setLinhas] = useState<
    Record<number, { prof: string; sofia: string; comp: string[] }>
  >(() => {
    const init: Record<number, { prof: string; sofia: string; comp: string[] }> = {};
    for (let n = 1; n <= quantidade; n++) {
      const c = correcoes.find((x) => x.numero === n);
      init[n] = {
        prof: c?.nota != null ? String(c.nota) : "",
        sofia: c?.notaSofia != null ? String(c.notaSofia) : "",
        comp: c?.competencias
          ? (JSON.parse(c.competencias) as number[]).map(String)
          : ["", "", "", "", ""],
      };
    }
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  async function enviar() {
    setLoading(true);
    setMsg("");
    setErro("");
    try {
      const payload = Object.entries(linhas).map(([num, v]) => {
        const competencias = v.comp
          .map((x) => (x === "" ? NaN : parseInt(x, 10)))
          .filter((x) => !Number.isNaN(x));
        return {
          numero: parseInt(num, 10),
          nota: v.prof === "" ? null : parseFloat(v.prof),
          notaSofia: v.sofia === "" ? null : parseFloat(v.sofia),
          competencias: competencias.length === 5 ? competencias : null,
        };
      });
      const res = await fetch("/api/redacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "notas", entregaId, correcoes: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao enviar notas");
        return;
      }
      setMsg("Notas enviadas! Aguardando aprovação da secretaria.");
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function setCampo(n: number, campo: "prof" | "sofia", valor: string) {
    setLinhas((s) => ({ ...s, [n]: { ...s[n], [campo]: valor } }));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Preencha as notas das suas redações já corrigidas. A secretaria confere e
        aprova antes de contar no seu histórico.
      </p>
      {Array.from({ length: quantidade }, (_, i) => i + 1).map((n) => (
        <div key={n} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-600">Redação {n}</p>
          <div className="flex flex-wrap gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">
                Nota professora
              </label>
              <input
                inputMode="decimal"
                placeholder="0–1000"
                value={linhas[n]?.prof ?? ""}
                onChange={(e) => setCampo(n, "prof", e.target.value)}
                className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase text-gray-400">
                Nota Sofia
              </label>
              <input
                inputMode="decimal"
                placeholder="0–1000"
                value={linhas[n]?.sofia ?? ""}
                onChange={(e) => setCampo(n, "sofia", e.target.value)}
                className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
              />
            </div>
          </div>
          <p className="mt-2 text-[10px] font-medium uppercase text-gray-400">
            Competências ENEM (0–200 cada)
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {[0, 1, 2, 3, 4].map((idx) => (
              <input
                key={idx}
                inputMode="numeric"
                placeholder={`C${idx + 1}`}
                value={linhas[n]?.comp[idx] ?? ""}
                onChange={(e) => {
                  const comp = [...(linhas[n]?.comp ?? ["", "", "", "", ""])];
                  comp[idx] = e.target.value;
                  setLinhas((s) => ({ ...s, [n]: { ...s[n], comp } }));
                }}
                className="w-14 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-xs"
              />
            ))}
          </div>
        </div>
      ))}
      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button onClick={enviar} disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? "Enviando..." : "Enviar notas para aprovação"}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FormRematriculaAluno({
  alunoId,
  alunoNome,
  alunoTelefone,
  alunoWhatsapp,
  alunoInstagram,
  responsavelNome,
  responsavelTelefone,
  turmas,
  turmas2,
  planos,
  bloqueado,
}: {
  alunoId: string;
  alunoNome: string;
  alunoTelefone?: string | null;
  alunoWhatsapp?: string | null;
  alunoInstagram?: string | null;
  responsavelNome?: string | null;
  responsavelTelefone?: string | null;
  turmas: { id: string; nome: string; curso: string }[];
  turmas2: { id: string; nome: string; curso: string }[];
  planos: { id: string; nome: string }[];
  bloqueado: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const temCurso2 = turmas2.length > 0;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (bloqueado) return;
    setLoading(true);
    setMsg("");
    setErro("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/operacional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "solicitar_rematricula",
          alunoId,
          nome: fd.get("nome"),
          telefone: fd.get("telefone"),
          whatsapp: fd.get("whatsapp") || "",
          instagram: fd.get("instagram") || "",
          responsavelNome: fd.get("responsavelNome") || "",
          responsavelTelefone: fd.get("responsavelTelefone") || "",
          turmaId: fd.get("turmaId"),
          turma2Id: fd.get("turma2Id") || "",
          planoId: fd.get("planoId"),
          formaPagamento: fd.get("formaPagamento"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Erro ao enviar solicitação");
        return;
      }
      setMsg(
        "Solicitação enviada! Aguarde a análise da secretaria. Você não poderá enviar outra até ser respondida."
      );
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (bloqueado) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Você já tem uma solicitação de rematrícula aguardando análise. Assim que o
        admin responder, poderá enviar uma nova.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <p className="text-sm text-gray-600">
        Confirme seus dados e escolha turma e plano para o próximo módulo.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">Nome completo *</label>
          <input
            name="nome"
            required
            defaultValue={alunoNome}
            className="input"
          />
        </div>
        <div>
          <label className="field-label">Telefone *</label>
          <input
            name="telefone"
            required
            defaultValue={alunoTelefone || ""}
            className="input"
          />
        </div>
        <div>
          <label className="field-label">WhatsApp</label>
          <input name="whatsapp" defaultValue={alunoWhatsapp || ""} className="input" />
        </div>
        <div>
          <label className="field-label">Instagram</label>
          <input name="instagram" defaultValue={alunoInstagram || ""} className="input" />
        </div>
        <div>
          <label className="field-label">Nome do responsável</label>
          <input
            name="responsavelNome"
            defaultValue={responsavelNome || ""}
            className="input"
          />
        </div>
        <div>
          <label className="field-label">Telefone responsável</label>
          <input
            name="responsavelTelefone"
            defaultValue={responsavelTelefone || ""}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="field-label">Turma — Curso 1 *</label>
        <select name="turmaId" required className="input">
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome} ({t.curso})
            </option>
          ))}
        </select>
      </div>

      {temCurso2 && (
        <div>
          <label className="field-label">Turma — Curso 2 (opcional)</label>
          <select name="turma2Id" className="input">
            <option value="">Não desejo segundo curso</option>
            {turmas2.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.curso})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">Plano *</label>
          <select name="planoId" required className="input">
            {planos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Forma de pagamento *</label>
          <select name="formaPagamento" required className="input">
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="CARTAO">Cartão</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
      </div>

      {msg && <p className="msg-ok">{msg}</p>}
      {erro && <p className="msg-erro">{erro}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? "Enviando..." : "Solicitar rematrícula"}
      </button>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CORES_CURSO } from "@/lib/constants/cores";
import type { NomeCursoChave } from "@/lib/constants/cores";

interface AulaItem {
  id: string;
  numero: number;
  data: string;
  conteudo?: string | null;
  statusFreq?: string;
  turmaNome: string;
  curso: NomeCursoChave;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
}

interface MatriculaCal {
  turmaNome: string;
  curso: NomeCursoChave;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  moduloNum?: number;
  aulas: AulaItem[];
}

interface Props {
  matriculas: MatriculaCal[];
}

const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function corFreq(status?: string) {
  if (!status) return "border-gray-200 bg-gray-50 text-gray-500";
  if (status === "PRESENTE") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (status.startsWith("REPOSICAO")) return "border-amber-300 bg-amber-50 text-amber-900";
  return "border-red-200 bg-red-50 text-red-700";
}

function labelFreq(status?: string) {
  if (!status) return "Sem chamada";
  return status.replace(/_/g, " ");
}

export function CalendarioAlunoVisual({ matriculas }: Props) {
  const todasAulas = useMemo(
    () =>
      matriculas.flatMap((m) =>
        m.aulas.map((a) => ({ ...a, turmaNome: m.turmaNome, curso: m.curso }))
      ),
    [matriculas]
  );

  const mesInicial = useMemo(() => {
    const futura = todasAulas.find((a) => new Date(a.data) >= new Date());
    const ref = futura ? new Date(futura.data) : new Date();
    return { ano: ref.getFullYear(), mes: ref.getMonth() };
  }, [todasAulas]);

  const [ano, setAno] = useState(mesInicial.ano);
  const [mes, setMes] = useState(mesInicial.mes);

  const diasGrade = useMemo(() => {
    const primeiro = new Date(ano, mes, 1);
    const ultimo = new Date(ano, mes + 1, 0);
    const inicioSemana = primeiro.getDay();
    const cells: (number | null)[] = [];
    for (let i = 0; i < inicioSemana; i++) cells.push(null);
    for (let d = 1; d <= ultimo.getDate(); d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [ano, mes]);

  const aulasPorDia = useMemo(() => {
    const map = new Map<string, AulaItem[]>();
    for (const a of todasAulas) {
      const d = new Date(a.data);
      if (d.getFullYear() !== ano || d.getMonth() !== mes) continue;
      const chave = `${ano}-${mes}-${d.getDate()}`;
      const arr = map.get(chave) ?? [];
      arr.push(a);
      map.set(chave, arr);
    }
    return map;
  }, [todasAulas, ano, mes]);

  const proximas = useMemo(
    () =>
      todasAulas
        .filter((a) => new Date(a.data) >= new Date(new Date().setHours(0, 0, 0, 0)))
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
        .slice(0, 4),
    [todasAulas]
  );

  function mudarMes(delta: number) {
    let m = mes + delta;
    let a = ano;
    if (m < 0) { m = 11; a--; }
    if (m > 11) { m = 0; a++; }
    setMes(m);
    setAno(a);
  }

  const hoje = new Date();
  const ehHoje = (dia: number) =>
    hoje.getFullYear() === ano && hoje.getMonth() === mes && hoje.getDate() === dia;

  return (
    <div className="space-y-5">
      {proximas.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {proximas.map((a) => {
            const cores = CORES_CURSO[a.curso];
            return (
              <div
                key={a.id}
                className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: cores.primaria }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Proxima aula
                </p>
                <p className="mt-1 font-display text-lg font-bold text-gray-900">
                  {new Date(a.data).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  Turma {a.turmaNome} · Aula {a.numero}
                </p>
                {a.conteudo && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">{a.conteudo}</p>
                )}
                <span
                  className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                  style={{ background: cores.clara, color: cores.escura }}
                >
                  {cores.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 text-white">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
          >
            ←
          </button>
          <p className="font-display text-base font-bold">
            {MESES[mes]} {ano}
          </p>
          <button
            type="button"
            onClick={() => mudarMes(1)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-50 bg-gray-50/80">
          {DIAS_CURTO.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-bold uppercase text-gray-400">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {diasGrade.map((dia, i) => {
            const chave = dia ? `${ano}-${mes}-${dia}` : "";
            const aulasDia = dia ? aulasPorDia.get(chave) ?? [] : [];
            return (
              <div
                key={i}
                className={`min-h-[72px] border-b border-r border-gray-50 p-1.5 sm:min-h-[88px] ${
                  dia ? "bg-white" : "bg-gray-50/40"
                }`}
              >
                {dia && (
                  <>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        ehHoje(dia)
                          ? "bg-indigo-600 text-white"
                          : "text-gray-600"
                      }`}
                    >
                      {dia}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {aulasDia.map((a) => {
                        const c = CORES_CURSO[a.curso];
                        return (
                          <div
                            key={a.id}
                            title={`Turma ${a.turmaNome} - Aula ${a.numero}`}
                            className="truncate rounded px-1 py-0.5 text-[9px] font-semibold sm:text-[10px]"
                            style={{ background: c.clara, color: c.escura }}
                          >
                            {a.turmaNome} · {a.numero}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {matriculas.map((m) => {
        const cores = CORES_CURSO[m.curso];
        return (
          <div
            key={m.turmaNome + m.curso}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-bold text-gray-900">
                Turma {m.turmaNome}
              </h3>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ background: cores.clara, color: cores.escura }}
              >
                {cores.label}
              </span>
              {m.moduloNum && (
                <span className="text-xs text-gray-400">Modulo {m.moduloNum}</span>
              )}
            </div>
            <p className="mb-3 text-xs text-gray-500">
              {m.diaSemana} · {m.horaInicio}–{m.horaFim}
            </p>
            <div className="space-y-2">
              {m.aulas.map((a) => {
                const passada = new Date(a.data) < new Date();
                return (
                  <div
                    key={a.id}
                    className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                      passada ? "opacity-80" : "border-indigo-100 bg-indigo-50/30"
                    }`}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-white"
                      style={{ background: cores.primaria }}
                    >
                      <span className="text-[10px] font-bold leading-none">
                        {new Date(a.data).toLocaleDateString("pt-BR", { day: "2-digit" })}
                      </span>
                      <span className="text-[9px] uppercase opacity-90">
                        {new Date(a.data).toLocaleDateString("pt-BR", { month: "short" })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800">Aula {a.numero}</p>
                      {a.conteudo && (
                        <p className="truncate text-xs text-gray-500">{a.conteudo}</p>
                      )}
                    </div>
                    <span
                      className={`rounded-lg border px-2 py-1 text-[10px] font-bold uppercase ${corFreq(
                        passada ? a.statusFreq : undefined
                      )}`}
                    >
                      {passada ? labelFreq(a.statusFreq) : "Agendada"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

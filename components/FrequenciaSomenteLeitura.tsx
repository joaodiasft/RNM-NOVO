const COR_STATUS: Record<string, string> = {
  PRESENTE: "text-emerald-700 bg-emerald-50 border-emerald-200",
  FALTA: "text-red-700 bg-red-50 border-red-200",
  FALTA_JUSTIFICADA: "text-amber-700 bg-amber-50 border-amber-200",
  REPOSICAO_DATA: "text-blue-700 bg-blue-50 border-blue-200",
  REPOSICAO_TURMA_DATA: "text-blue-700 bg-blue-50 border-blue-200",
};

interface Aluno {
  id: string;
  nome: string;
  codigo: string;
}

interface Props {
  alunos: Aluno[];
  frequencias: Record<string, string>;
}

export function FrequenciaSomenteLeitura({ alunos, frequencias }: Props) {
  if (alunos.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum aluno matriculado nesta turma.</p>;
  }

  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
      {alunos.map((a) => {
        const status = frequencias[a.id];
        const cls = status
          ? COR_STATUS[status] || "border-gray-200 bg-gray-50 text-gray-600"
          : "border-gray-200 bg-gray-50 text-gray-400";
        return (
          <div key={a.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
            <div className="min-w-[130px] flex-1">
              <p className="text-sm font-medium text-gray-800">{a.nome}</p>
              <p className="text-xs text-gray-400">{a.codigo}</p>
            </div>
            <span
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${cls}`}
            >
              {status ? status.replace(/_/g, " ") : "Sem lancamento"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

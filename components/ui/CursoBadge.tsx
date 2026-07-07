import type { NomeCurso } from "@prisma/client";
import { CORES_CURSO } from "@/lib/constants/cores";

/**
 * Identidade visual dos cursos — sempre com a cor oficial:
 * Redação = rosa · Exatas = verde · Matemática = azul
 */
export function CursoBadge({
  curso,
  tamanho = "md",
}: {
  curso: NomeCurso;
  tamanho?: "sm" | "md";
}) {
  const info = CORES_CURSO[curso];
  if (!info) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${
        tamanho === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
      style={{ backgroundColor: info.clara, color: info.escura }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: info.primaria }}
      />
      {info.label}
    </span>
  );
}

/** Barra/faixa superior com a cor do curso, para topo de cards. */
export function CursoFaixa({ curso }: { curso: NomeCurso }) {
  const info = CORES_CURSO[curso];
  return (
    <span
      className="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl"
      style={{
        background: info
          ? `linear-gradient(90deg, ${info.primaria}, ${info.escura})`
          : "#e5e7eb",
      }}
      aria-hidden
    />
  );
}

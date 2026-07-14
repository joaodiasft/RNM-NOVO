import type { PapelUsuario } from "@prisma/client";
import { getGoogleAccessToken } from "@/lib/google-auth";

export type NivelLog = "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  nivel: NivelLog;
  categoria: string;
  acao: string;
  usuarioId?: string;
  papel?: PapelUsuario | string;
  entidade?: string;
  entidadeId?: string;
  detalhes?: Record<string, unknown>;
}

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

async function appendRowsToSheet(rows: string[][]) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_LOG_SHEET || "Logs";
  if (!spreadsheetId) return false;

  const token = await getGoogleAccessToken(SCOPES);
  if (!token) return false;

  const range = encodeURIComponent(`${sheetName}!A:I`);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}` +
    `/values/${range}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: rows }),
  });

  return res.ok;
}

async function persistLog(entry: LogEntry) {
  if (entry.usuarioId && entry.papel) {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.logAuditoria.create({
        data: {
          usuarioId: entry.usuarioId,
          papel: entry.papel as PapelUsuario,
          acao: entry.acao,
          entidade: entry.entidade || entry.categoria,
          entidadeId: entry.entidadeId,
          detalhes: entry.detalhes ? JSON.stringify(entry.detalhes) : null,
        },
      });
    } catch {
      // auditoria nunca derruba a request
    }
  }

  const row = [
    new Date().toISOString(),
    entry.nivel,
    entry.categoria,
    entry.acao,
    entry.usuarioId || "",
    entry.papel || "",
    entry.entidade || "",
    entry.entidadeId || "",
    entry.detalhes ? JSON.stringify(entry.detalhes) : "",
  ];

  try {
    await appendRowsToSheet([row]);
  } catch (err) {
    console.error("[Sheets Log] Falha ao gravar:", err);
  }
}

function agendar(work: Promise<unknown>) {
  try {
    // Import estático quebraria `next dev` se o context não existir —
    // usamos require sob demanda e waitUntil para não vazar I/O.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare") as {
      getCloudflareContext: () => { ctx: { waitUntil: (p: Promise<unknown>) => void } };
    };
    getCloudflareContext().ctx.waitUntil(work);
  } catch {
    void work.catch(() => {});
  }
}

/**
 * Best-effort: grava auditoria + Sheets sem setTimeout global
 * (que reutiliza I/O entre requests no Cloudflare Workers → Error 1101).
 */
export function registrarLog(entry: LogEntry): void {
  agendar(persistLog(entry));
}

export async function registrarLogSync(entry: LogEntry): Promise<void> {
  await persistLog(entry);
}

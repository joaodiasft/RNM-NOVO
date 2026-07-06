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

const logQueue: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

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

async function flushLogs() {
  if (logQueue.length === 0) return;

  const batch = logQueue.splice(0, logQueue.length);
  const rows = batch.map((entry) => [
    new Date().toISOString(),
    entry.nivel,
    entry.categoria,
    entry.acao,
    entry.usuarioId || "",
    entry.papel || "",
    entry.entidade || "",
    entry.entidadeId || "",
    entry.detalhes ? JSON.stringify(entry.detalhes) : "",
  ]);

  try {
    const ok = await appendRowsToSheet(rows);
    if (!ok) throw new Error("Sheets append failed");
  } catch (err) {
    console.error("[Sheets Log] Falha ao gravar:", err);
    try {
      await appendRowsToSheet(rows);
    } catch {
      console.error("[Sheets Log] Retry falhou");
    }
  }
}

export function registrarLog(entry: LogEntry): void {
  if (entry.usuarioId && entry.papel) {
    import("@/lib/prisma")
      .then(({ prisma }) =>
        prisma.logAuditoria.create({
          data: {
            usuarioId: entry.usuarioId!,
            papel: entry.papel as PapelUsuario,
            acao: entry.acao,
            entidade: entry.entidade || entry.categoria,
            entidadeId: entry.entidadeId,
            detalhes: entry.detalhes ? JSON.stringify(entry.detalhes) : null,
          },
        })
      )
      .catch(() => {});
  }

  logQueue.push(entry);
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushLogs().catch(console.error);
    }, 2000);
  }
}

export async function registrarLogSync(entry: LogEntry): Promise<void> {
  logQueue.push(entry);
  await flushLogs();
}

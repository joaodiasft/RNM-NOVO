import { google } from "googleapis";
import type { PapelUsuario } from "@prisma/client";

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

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

function getGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) return null;

  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
}

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  const auth = getGoogleAuth();
  if (!auth) return null;
  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

const logQueue: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushLogs() {
  if (logQueue.length === 0) return;

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_LOG_SHEET || "Logs";
  const sheets = getSheetsClient();

  if (!spreadsheetId || !sheets) {
    logQueue.length = 0;
    return;
  }

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
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:I`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });
  } catch (err) {
    console.error("[Sheets Log] Falha ao gravar:", err);
    // Retry once
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:I`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows },
      });
    } catch {
      console.error("[Sheets Log] Retry falhou");
    }
  }
}

export function registrarLog(entry: LogEntry): void {
  // Also persist to Postgres cache (fire-and-forget)
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

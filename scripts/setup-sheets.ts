import { google } from "googleapis";

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const key = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

const auth = new google.auth.JWT({
  email,
  key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function main() {
  const sheets = google.sheets({ version: "v4", auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const firstSheet = meta.data.sheets?.[0];
  const sheetId = firstSheet?.properties?.sheetId;
  const title = firstSheet?.properties?.title;

  if (title !== "Logs" && sheetId != null) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: { sheetId, title: "Logs" },
              fields: "title",
            },
          },
        ],
      },
    });
    console.log("✅ Aba renomeada para 'Logs'");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Logs!A1:I1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          "timestamp",
          "nivel",
          "categoria",
          "acao",
          "usuarioId",
          "papel",
          "entidade",
          "entidadeId",
          "detalhes_json",
        ],
      ],
    },
  });
  console.log("✅ Cabeçalhos adicionados na aba Logs");

  const hasResumo = meta.data.sheets?.some((s) => s.properties?.title === "ResumoDiario");
  if (!hasResumo) {
    const res = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: "ResumoDiario" } } }],
      },
    });
    const resumoId = res.data.replies?.[0]?.addSheet?.properties?.sheetId;
    if (resumoId != null) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "ResumoDiario!A1:D1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["data", "total_eventos", "erros", "logins"]],
        },
      });
      console.log("✅ Aba ResumoDiario criada");
    }
  }
}

main().catch(console.error);

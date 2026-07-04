/**
 * Teste rápido das integrações Google — rode: npx tsx scripts/test-google.ts
 */
import "dotenv/config";
import { google } from "googleapis";
import { registrarLogSync } from "../lib/logging/sheets";

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const key = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  console.log("1. Testando Google Sheets...");
  await registrarLogSync({
    nivel: "INFO",
    categoria: "TESTE",
    acao: "GOOGLE_SHEETS_OK",
    detalhes: { origem: "script-test-google" },
  });
  console.log("   ✅ Log gravado na planilha");

  console.log("2. Testando acesso à pasta Drive...");
  const folder = await drive.files.get({
    fileId: process.env.GOOGLE_DRIVE_FOLDER_ID!,
    fields: "id,name",
    supportsAllDrives: true,
  });
  console.log(`   ✅ Pasta encontrada: ${folder.data.name}`);

  console.log("\n✅ Google Drive + Sheets configurados corretamente!");
}

main().catch((err) => {
  console.error("\n❌ Erro:", err.message);
  if (err.message?.includes("403") || err.message?.includes("404")) {
    console.error(
      "\nDica: compartilhe a pasta e a planilha com:\n",
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      "\ncomo Editor."
    );
  }
  process.exit(1);
});

import { google } from "googleapis";

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
const key = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");

const auth = new google.auth.JWT({
  email,
  key,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ],
});

async function main() {
  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  try {
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    });
    console.log(
      "Abas:",
      meta.data.sheets?.map((s) => s.properties?.title).join(", ")
    );
  } catch (e) {
    console.log("Sheets erro:", (e as Error).message);
  }

  try {
    const f = await drive.files.get({
      fileId: process.env.GOOGLE_DRIVE_FOLDER_ID!,
      fields: "id,name",
      supportsAllDrives: true,
    });
    console.log("Drive OK:", f.data.name);
  } catch (e) {
    console.log("Drive erro:", (e as Error).message);
  }
}

main();

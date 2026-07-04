import { google } from "googleapis";
import { Readable } from "stream";

function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) return null;

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  return google.drive({ version: "v3", auth });
}

export interface UploadResult {
  fileId: string;
  url: string;
}

export async function uploadFotoPerfil(
  buffer: Buffer,
  mimeType: string,
  tipoUsuario: string,
  userId: string
): Promise<UploadResult | null> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const drive = getDriveClient();
  if (!folderId || !drive) {
    console.warn("[Drive] Configuração ausente — upload ignorado");
    return null;
  }

  const ext = mimeType.includes("png") ? "png" : "jpg";
  const fileName = `${tipoUsuario}-${userId}-${Date.now()}.${ext}`;

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
      mimeType,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id, webViewLink, webContentLink",
  });

  const fileId = response.data.id;
  if (!fileId) return null;

  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId,
    url:
      response.data.webViewLink ||
      `https://drive.google.com/uc?id=${fileId}`,
  };
}

export async function deletarArquivoDrive(fileId: string): Promise<void> {
  const drive = getDriveClient();
  if (!drive || !fileId) return;
  try {
    await drive.files.delete({ fileId });
  } catch {
    // ignore
  }
}

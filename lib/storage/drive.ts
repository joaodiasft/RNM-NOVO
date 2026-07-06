import { getGoogleAccessToken } from "@/lib/google-auth";

const DRIVE_SCOPE = ["https://www.googleapis.com/auth/drive.file"];

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
  if (!folderId) {
    console.warn("[Drive] Configuração ausente — upload ignorado");
    return null;
  }

  const token = await getGoogleAccessToken(DRIVE_SCOPE);
  if (!token) {
    console.warn("[Drive] Token Google indisponível — upload ignorado");
    return null;
  }

  const ext = mimeType.includes("png") ? "png" : "jpg";
  const fileName = `${tipoUsuario}-${userId}-${Date.now()}.${ext}`;

  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId],
    mimeType,
  });

  const boundary = `-------rnm${Date.now()}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const createRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!createRes.ok) {
    console.error("[Drive] Upload falhou:", await createRes.text());
    return null;
  }

  const file = (await createRes.json()) as {
    id?: string;
    webViewLink?: string;
    webContentLink?: string;
  };

  const fileId = file.id;
  if (!fileId) return null;

  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  return {
    fileId,
    url: file.webViewLink || `https://drive.google.com/uc?id=${fileId}`,
  };
}

export async function deletarArquivoDrive(fileId: string): Promise<void> {
  if (!fileId) return;
  const token = await getGoogleAccessToken(DRIVE_SCOPE);
  if (!token) return;

  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // ignore
  }
}

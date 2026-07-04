import { uploadFotoPerfil } from "../lib/storage/drive";

async function main() {
  const buffer = Buffer.from("fake-image-test");
  const result = await uploadFotoPerfil(
    buffer,
    "image/jpeg",
    "teste",
    "setup-" + Date.now()
  );
  if (result) {
    console.log("✅ Upload Drive OK:", result.url);
  } else {
    console.log("❌ Upload falhou — verifique compartilhamento da pasta");
  }
}

main().catch((e) => console.error("❌", e.message));

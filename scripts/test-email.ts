import { gerarEEnviarToken } from "../lib/email/token-admin";

async function main() {
  const destino = process.env.ADMIN_EMAIL || "jcsolucoes3d@gmail.com";
  console.log(`Enviando token de teste para ${destino}...`);
  const result = await gerarEEnviarToken(destino);
  console.log("Enviado:", result.enviado);
  console.log("Método:", result.metodo);
  console.log("Código (teste local):", result.codigo);
  console.log("Expira em:", result.expiraEm.toISOString());
}

main().catch((e) => console.error("Erro:", e.message));

import bcrypt from "bcryptjs";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const SALT_ROUNDS = 12;

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, SALT_ROUNDS);
}

export async function verificarSenha(
  senha: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY não configurada");
  return Buffer.from(key.slice(0, 64), "hex");
}

export function criptografar(texto: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(texto, "utf8"),
    cipher.final(),
  ]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function descriptografar(payload: string): string {
  const [ivHex, dataHex] = payload.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", getEncryptionKey(), iv);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8"
  );
}

export function normalizarNomeSenha(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join("");
}

export function gerarSenhaResponsavel(
  nome: string,
  telefone?: string | null,
  colisao = false
): string {
  const base = normalizarNomeSenha(nome);
  if (colisao && telefone) {
    const digits = telefone.replace(/\D/g, "");
    return base + digits.slice(-2);
  }
  return base;
}

import { PrismaClient } from "@prisma/client";
import { hashSenha } from "../lib/crypto";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL!;
  const senha = process.env.ADMIN_SENHA_INICIAL || "Admin@2026";
  const admin = await prisma.admin.findFirst();
  if (!admin) {
    await prisma.admin.create({
      data: { nome: "Administrador", email, senhaHash: await hashSenha(senha) },
    });
  } else {
    await prisma.admin.update({
      where: { id: admin.id },
      data: { email, senhaHash: await hashSenha(senha) },
    });
  }
  console.log("✅ Admin configurado:", email);
}

main()
  .finally(() => prisma.$disconnect());

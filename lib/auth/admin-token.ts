import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import {
  gerarEEnviarToken,
  tokenEValido,
  TOKEN_MAX_TENTATIVAS,
  TOKEN_REENVIO_SEGUNDOS,
} from "@/lib/email/token-admin";
import { verificarSenha } from "@/lib/crypto";
import { registrarLog } from "@/lib/logging/sheets";

const ADMIN_SESSION_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret"
);

export async function iniciarLoginAdmin(email: string, senha: string) {
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  if (!admin || !(await verificarSenha(senha, admin.senhaHash))) {
    registrarLog({
      nivel: "WARN",
      categoria: "AUTH",
      acao: "LOGIN_ADMIN_FALHA",
      detalhes: { email },
    });
    return { ok: false as const, erro: "E-mail ou senha inválidos" };
  }

  const ultimoToken = await prisma.tokenAdmin.findFirst({
    where: { adminId: admin.id, usado: false },
    orderBy: { criadoEm: "desc" },
  });

  if (ultimoToken) {
    const segundos =
      (Date.now() - ultimoToken.criadoEm.getTime()) / 1000;
    if (segundos < TOKEN_REENVIO_SEGUNDOS) {
      return {
        ok: false as const,
        erro: `Aguarde ${Math.ceil(TOKEN_REENVIO_SEGUNDOS - segundos)}s para reenviar`,
      };
    }
  }

  const resultado = await gerarEEnviarToken(admin.email);
  if (!resultado.enviado) {
    registrarLog({
      nivel: "ERROR",
      categoria: "AUTH",
      acao: "TOKEN_EMAIL_FALHA",
      usuarioId: admin.id,
      papel: "ADMIN",
      detalhes: { email: admin.email },
    });
    return { ok: false as const, erro: "Não foi possível enviar o código por e-mail" };
  }

  await prisma.tokenAdmin.create({
    data: {
      adminId: admin.id,
      codigo: resultado.codigo,
      expiraEm: resultado.expiraEm,
    },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "AUTH",
    acao: "TOKEN_GERADO",
    usuarioId: admin.id,
    papel: "ADMIN",
    detalhes: { metodo: resultado.metodo },
  });

  const pendingToken = await new SignJWT({ adminId: admin.id, step: "token" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(ADMIN_SESSION_SECRET);

  return { ok: true as const, pendingToken, email: admin.email };
}

export async function validarTokenAdmin(pendingToken: string, codigo: string) {
  const { jwtVerify } = await import("jose");
  let adminId: string;
  try {
    const { payload } = await jwtVerify(pendingToken, ADMIN_SESSION_SECRET);
    adminId = payload.adminId as string;
  } catch {
    return { ok: false as const, erro: "Sessão expirada. Faça login novamente." };
  }

  const token = await prisma.tokenAdmin.findFirst({
    where: { adminId, usado: false },
    orderBy: { criadoEm: "desc" },
    include: { admin: true },
  });

  if (!token) {
    return { ok: false as const, erro: "Nenhum código pendente. Solicite novamente." };
  }

  if (token.tentativas >= TOKEN_MAX_TENTATIVAS) {
    await prisma.tokenAdmin.update({
      where: { id: token.id },
      data: { usado: true },
    });
    return { ok: false as const, erro: "Código invalidado. Solicite um novo." };
  }

  if (!tokenEValido(codigo, token.codigo, token.expiraEm)) {
    await prisma.tokenAdmin.update({
      where: { id: token.id },
      data: { tentativas: { increment: 1 } },
    });
    registrarLog({
      nivel: "WARN",
      categoria: "AUTH",
      acao: "TOKEN_INVALIDO",
      usuarioId: adminId,
      papel: "ADMIN",
    });
    return { ok: false as const, erro: "Código inválido ou expirado" };
  }

  await prisma.tokenAdmin.update({
    where: { id: token.id },
    data: { usado: true },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "AUTH",
    acao: "LOGIN_ADMIN_SUCESSO",
    usuarioId: adminId,
    papel: "ADMIN",
  });

  return {
    ok: true as const,
    admin: {
      id: token.admin.id,
      nome: token.admin.nome,
      email: token.admin.email,
      papel: "ADMIN" as const,
    },
    ticket: (await import("@/lib/auth/admin-ticket")).criarTicketAdmin(
      token.admin.id
    ),
  };
}

import { prisma } from "@/lib/prisma";

/**
 * Proteção anti-força-bruta do login, 100% no servidor.
 * Após MAX_TENTATIVAS falhas em JANELA_MINUTOS para o mesmo identificador,
 * qualquer tentativa é recusada até a janela expirar — mesmo com a senha certa.
 */

const MAX_TENTATIVAS = 5;
const JANELA_MINUTOS = 15;

function chave(identificador: string) {
  return `login:${identificador.toLowerCase().slice(0, 80)}`;
}

export async function loginBloqueado(identificador: string): Promise<boolean> {
  const desde = new Date(Date.now() - JANELA_MINUTOS * 60_000);
  const falhas = await prisma.logAuditoria.count({
    where: {
      usuarioId: chave(identificador),
      acao: "LOGIN_FALHA",
      timestamp: { gte: desde },
    },
  });
  return falhas >= MAX_TENTATIVAS;
}

export async function registrarFalhaLogin(
  identificador: string,
  perfil: string
): Promise<void> {
  try {
    await prisma.logAuditoria.create({
      data: {
        usuarioId: chave(identificador),
        papel: (["ADMIN", "PROFESSOR", "ALUNO", "RESPONSAVEL"].includes(perfil)
          ? perfil
          : "ALUNO") as "ADMIN" | "PROFESSOR" | "ALUNO" | "RESPONSAVEL",
        acao: "LOGIN_FALHA",
        entidade: "Auth",
      },
    });
  } catch {
    // registro de falha nunca pode derrubar o login
  }
}

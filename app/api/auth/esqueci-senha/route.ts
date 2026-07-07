import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/crypto";
import { enviarEmail, emailNovaSenha } from "@/lib/email/enviar-email";
import { registrarLog } from "@/lib/logging/sheets";
import { esqueciSenhaSchema, validar } from "@/lib/validacao";

/**
 * Reset de senha do ALUNO por matrícula.
 * Gera uma senha nova misturada com o código de matrícula e envia
 * para o e-mail cadastrado. Resposta é sempre genérica para não
 * revelar se a matrícula existe.
 */

const RESPOSTA_GENERICA = {
  ok: true,
  mensagem:
    "Se a matrícula existir e tiver e-mail cadastrado, a nova senha foi enviada para ele.",
};

function gerarSenhaComMatricula(codigo: string): string {
  // Mistura com a matrícula: RNM2026-0007 → RNM@0007 + 2 dígitos aleatórios
  const sequencial = codigo.split("-")[1] || codigo.replace(/\D/g, "").slice(-4) || "0000";
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  const sufixo = Array.from(bytes, (b) => (b % 10).toString()).join("");
  return `RNM@${sequencial}${sufixo}`;
}

export async function POST(request: Request) {
  const bruto = await request.json().catch(() => null);
  const body = validar(esqueciSenhaSchema, bruto);
  if (body.erro !== null) {
    return NextResponse.json({ erro: body.erro }, { status: 400 });
  }

  const aluno = await prisma.aluno.findUnique({
    where: { codigo: body.data.codigo },
  });

  // Sempre resposta genérica — não confirma existência da matrícula
  if (!aluno || !aluno.ativo || !aluno.email) {
    registrarLog({
      nivel: "WARN",
      categoria: "AUTH",
      acao: "RESET_SENHA_IGNORADO",
      detalhes: { codigo: body.data.codigo },
    });
    return NextResponse.json(RESPOSTA_GENERICA);
  }

  // Proteção anti-abuso: no máximo 1 reset a cada 10 minutos por aluno
  const dezMinutosAtras = new Date(Date.now() - 10 * 60_000);
  const resetRecente = await prisma.logAuditoria.findFirst({
    where: {
      usuarioId: aluno.id,
      acao: "RESET_SENHA_ALUNO",
      timestamp: { gte: dezMinutosAtras },
    },
  });
  if (resetRecente) {
    return NextResponse.json(RESPOSTA_GENERICA);
  }

  const novaSenha = gerarSenhaComMatricula(aluno.codigo);
  const msg = emailNovaSenha(aluno.nome, aluno.codigo, novaSenha);
  const enviado = await enviarEmail({
    para: aluno.email,
    assunto: msg.assunto,
    html: msg.html,
    texto: msg.texto,
  });

  if (!enviado) {
    // Não troca a senha se o e-mail falhou — o aluno ficaria trancado
    return NextResponse.json(
      { erro: "Não foi possível enviar o e-mail agora. Tente mais tarde ou procure a secretaria." },
      { status: 502 }
    );
  }

  await prisma.aluno.update({
    where: { id: aluno.id },
    data: { senhaHash: await hashSenha(novaSenha) },
  });

  registrarLog({
    nivel: "INFO",
    categoria: "AUTH",
    acao: "RESET_SENHA_ALUNO",
    usuarioId: aluno.id,
    papel: "ALUNO",
  });

  return NextResponse.json(RESPOSTA_GENERICA);
}

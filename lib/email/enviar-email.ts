/**
 * Envio genérico de e-mail: Resend primeiro, fallback SMTP (Gmail).
 * Mesma infraestrutura do token do admin.
 */

interface Mensagem {
  para: string;
  assunto: string;
  html: string;
  texto: string;
}

async function viaResend(msg: Mensagem): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada");
  const remetente = process.env.RESEND_REMETENTE || "onboarding@resend.dev";

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: remetente,
      to: [msg.para],
      subject: msg.assunto,
      html: msg.html,
      text: msg.texto,
    }),
  });
  return resposta.ok;
}

async function viaSmtp(msg: Mensagem): Promise<boolean> {
  const nodemailer = await import("nodemailer");
  const usuario = process.env.SMTP_USUARIO;
  const senha = process.env.SMTP_SENHA_APP;
  if (!usuario || !senha) {
    throw new Error("SMTP_USUARIO / SMTP_SENHA_APP não configurados");
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: true,
    auth: { user: usuario, pass: senha.replace(/\s/g, "") },
  });
  await transport.sendMail({
    from: usuario,
    to: msg.para,
    subject: msg.assunto,
    text: msg.texto,
    html: msg.html,
  });
  return true;
}

export async function enviarEmail(msg: Mensagem): Promise<boolean> {
  try {
    return await viaResend(msg);
  } catch {
    try {
      return await viaSmtp(msg);
    } catch {
      return false;
    }
  }
}

export function emailNovaSenha(nome: string, codigo: string, novaSenha: string) {
  const assunto = "Sua nova senha — Redação Nota Mil";
  const texto = `Olá, ${nome}!\n\nUma nova senha foi gerada para a matrícula ${codigo}:\n\n${novaSenha}\n\nEntre no sistema e troque a senha em "Meu Perfil".\nSe você não pediu esta troca, avise a secretaria.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#D6336C;">Redação Nota Mil</h2>
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>Uma nova senha foi gerada para a matrícula <strong>${codigo}</strong>:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;
                background:#FDE8F0; padding: 14px; text-align:center;
                border-radius:8px; color:#A61E4D;">
        ${novaSenha}
      </p>
      <p>Entre no sistema e troque a senha em <strong>Meu Perfil</strong>.</p>
      <p style="color:#868e96; font-size: 12px;">
        Se você não pediu esta troca, avise a secretaria da escola.
      </p>
    </div>
  `;
  return { assunto, html, texto };
}

/**
 * Port TypeScript de enviar_token_admin.py
 * Gera e envia token de 6 dígitos para login admin (Resend + fallback SMTP).
 */

const MINUTOS_EXPIRACAO = parseInt(
  process.env.TOKEN_MINUTOS_EXPIRACAO || "5",
  10
);

export function gerarCodigo(tamanho = 6): string {
  return Array.from({ length: tamanho }, () =>
    Math.floor(Math.random() * 10).toString()
  ).join("");
}

function montarCorpoEmail(codigo: string) {
  const assunto = "Seu código de acesso — Redação Nota Mil";
  const textoPlano = `Seu código de verificação é: ${codigo}\n\nEle expira em ${MINUTOS_EXPIRACAO} minutos e não deve ser compartilhado com ninguém.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#D6336C;">Redação Nota Mil</h2>
      <p>Use o código abaixo para concluir seu login administrativo:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;
                background:#FDE8F0; padding: 16px; text-align:center;
                border-radius:8px; color:#A61E4D;">
        ${codigo}
      </p>
      <p>Esse código expira em <strong>${MINUTOS_EXPIRACAO} minutos</strong>.</p>
      <p style="color:#868e96; font-size: 12px;">
        Se você não solicitou este acesso, apenas ignore este e-mail.
      </p>
    </div>
  `;
  return { assunto, html, textoPlano };
}

async function enviarViaResend(
  emailDestino: string,
  codigo: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada");

  const remetente =
    process.env.RESEND_REMETENTE || "onboarding@resend.dev";
  const { assunto, html, textoPlano } = montarCorpoEmail(codigo);

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: remetente,
      to: [emailDestino],
      subject: assunto,
      html,
      text: textoPlano,
    }),
  });

  return resposta.ok;
}

async function enviarViaSmtp(
  emailDestino: string,
  codigo: string
): Promise<boolean> {
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

  const { assunto, html, textoPlano } = montarCorpoEmail(codigo);
  await transport.sendMail({
    from: usuario,
    to: emailDestino,
    subject: assunto,
    text: textoPlano,
    html,
  });
  return true;
}

export interface TokenGerado {
  codigo: string;
  criadoEm: Date;
  expiraEm: Date;
  enviado: boolean;
  metodo?: "RESEND" | "SMTP";
}

export async function gerarEEnviarToken(
  emailAdmin: string
): Promise<TokenGerado> {
  const codigo = gerarCodigo();
  const criadoEm = new Date();
  const expiraEm = new Date(criadoEm.getTime() + MINUTOS_EXPIRACAO * 60_000);

  const metodoPreferido = (
    process.env.METODO_ENVIO_EMAIL || "RESEND"
  )
    .trim()
    .toUpperCase();

  let enviado = false;
  let metodo: "RESEND" | "SMTP" | undefined;

  if (metodoPreferido === "SMTP") {
    try {
      enviado = await enviarViaSmtp(emailAdmin, codigo);
      metodo = "SMTP";
    } catch {
      try {
        enviado = await enviarViaResend(emailAdmin, codigo);
        metodo = "RESEND";
      } catch {
        enviado = false;
      }
    }
  } else {
    try {
      enviado = await enviarViaResend(emailAdmin, codigo);
      metodo = "RESEND";
    } catch {
      try {
        enviado = await enviarViaSmtp(emailAdmin, codigo);
        metodo = "SMTP";
      } catch {
        enviado = false;
      }
    }
  }

  return { codigo, criadoEm, expiraEm, enviado, metodo };
}

export function tokenEValido(
  codigoInformado: string,
  codigoSalvo: string,
  expiraEm: Date
): boolean {
  const agora = new Date();
  return codigoInformado.trim() === codigoSalvo && agora < expiraEm;
}

export const TOKEN_REENVIO_SEGUNDOS = 60;
export const TOKEN_MAX_TENTATIVAS = 5;

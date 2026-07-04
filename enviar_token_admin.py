"""
Script de geração e envio do token (código de verificação) usado no login
do Administrador do sistema "Redação Nota Mil".

Fluxo esperado no sistema:
  1. Admin digita e-mail + senha.
  2. Backend confirma que e-mail/senha estão corretos.
  3. Backend chama `gerar_e_enviar_token(email_admin)`.
  4. Backend salva {codigo, criado_em, expira_em} na tabela TokenAdmin.
  5. Admin recebe o e-mail, digita o código na tela.
  6. Backend valida com `token_e_valido(...)`.

Duas formas de envio, escolhidas pela variável de ambiente METODO_ENVIO_EMAIL:
  - "RESEND" (recomendado): usa a API da Resend (resend.com).
        Free tier: 3.000 e-mails/mês, 100/dia, 1 domínio verificado.
        Mais que suficiente para um único admin fazendo login.
  - "SMTP": usa o Gmail (ou outro provedor SMTP) com "Senha de app".
        Bom como alternativa caso não queira criar conta na Resend.

Nenhuma chave/senha deve ficar escrita no código: tudo vem de variáveis
de ambiente (arquivo .env em desenvolvimento; "Environment Variables"
no painel da Vercel em produção).
"""

import os
import random
import smtplib
import ssl
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

try:
    import requests  # necessário apenas para o modo RESEND
except ImportError:
    requests = None


# ------------------------------------------------------------------
# Configurações (variáveis de ambiente)
# ------------------------------------------------------------------
METODO_ENVIO = os.getenv("METODO_ENVIO_EMAIL", "RESEND")  # "RESEND" ou "SMTP"

# --- Resend ---
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_REMETENTE = os.getenv(
    "RESEND_REMETENTE", "Redação Nota Mil <login@redacaonota1000.com.br>"
)

# --- SMTP (ex.: Gmail) ---
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USUARIO = os.getenv("SMTP_USUARIO", "")
SMTP_SENHA_APP = os.getenv("SMTP_SENHA_APP", "")  # "Senha de app" do Google, não a senha normal

MINUTOS_EXPIRACAO = int(os.getenv("TOKEN_MINUTOS_EXPIRACAO", "5"))


def gerar_codigo(tamanho: int = 6) -> str:
    """Gera um código numérico aleatório, ex: '048213'."""
    return "".join(str(random.randint(0, 9)) for _ in range(tamanho))


def montar_corpo_email(codigo: str):
    """Monta assunto, versão HTML e versão texto simples do e-mail."""
    assunto = "Seu código de acesso — Redação Nota Mil"

    texto_plano = (
        f"Seu código de verificação é: {codigo}\n\n"
        f"Ele expira em {MINUTOS_EXPIRACAO} minutos e não deve ser "
        f"compartilhado com ninguém."
    )

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#D6336C;">Redação Nota Mil</h2>
      <p>Use o código abaixo para concluir seu login administrativo:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;
                background:#FDE8F0; padding: 16px; text-align:center;
                border-radius:8px; color:#A61E4D;">
        {codigo}
      </p>
      <p>Esse código expira em <strong>{MINUTOS_EXPIRACAO} minutos</strong>.</p>
      <p style="color:#868e96; font-size: 12px;">
        Se você não solicitou este acesso, apenas ignore este e-mail.
      </p>
    </div>
    """
    return assunto, html, texto_plano


def enviar_via_resend(email_destino: str, codigo: str) -> bool:
    if requests is None:
        raise RuntimeError(
            "A biblioteca 'requests' não está instalada. Rode: pip install requests"
        )
    if not RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY não configurada nas variáveis de ambiente.")

    assunto, html, texto_plano = montar_corpo_email(codigo)

    resposta = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "from": RESEND_REMETENTE,
            "to": [email_destino],
            "subject": assunto,
            "html": html,
            "text": texto_plano,
        },
        timeout=10,
    )
    return resposta.status_code in (200, 201)


def enviar_via_smtp(email_destino: str, codigo: str) -> bool:
    if not SMTP_USUARIO or not SMTP_SENHA_APP:
        raise RuntimeError("SMTP_USUARIO / SMTP_SENHA_APP não configurados.")

    assunto, html, texto_plano = montar_corpo_email(codigo)

    mensagem = MIMEMultipart("alternative")
    mensagem["Subject"] = assunto
    mensagem["From"] = SMTP_USUARIO
    mensagem["To"] = email_destino
    mensagem.attach(MIMEText(texto_plano, "plain"))
    mensagem.attach(MIMEText(html, "html"))

    contexto = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=contexto) as servidor:
        servidor.login(SMTP_USUARIO, SMTP_SENHA_APP)
        servidor.sendmail(SMTP_USUARIO, email_destino, mensagem.as_string())
    return True


def gerar_e_enviar_token(email_admin: str) -> dict:
    """
    Gera um código de verificação, envia por e-mail e devolve os dados
    que devem ser salvos no banco (tabela TokenAdmin) para validação
    posterior.
    """
    codigo = gerar_codigo()
    criado_em = datetime.now(timezone.utc)
    expira_em = criado_em + timedelta(minutes=MINUTOS_EXPIRACAO)

    if METODO_ENVIO.upper() == "SMTP":
        enviado = enviar_via_smtp(email_admin, codigo)
    else:
        enviado = enviar_via_resend(email_admin, codigo)

    return {
        "codigo": codigo,
        "criado_em": criado_em,
        "expira_em": expira_em,
        "enviado": enviado,
    }


def token_e_valido(codigo_informado: str, codigo_salvo: str, expira_em: datetime) -> bool:
    """Valida o código digitado pelo admin no momento do login."""
    agora = datetime.now(timezone.utc)
    return codigo_informado.strip() == codigo_salvo and agora < expira_em


if __name__ == "__main__":
    # Teste manual: configure as variáveis de ambiente antes de rodar.
    # Exemplo (Resend):
    #   export METODO_ENVIO_EMAIL=RESEND
    #   export RESEND_API_KEY=re_xxx...
    #   export EMAIL_TESTE=seuemail@exemplo.com
    #   python enviar_token_admin.py
    destino_teste = os.getenv("EMAIL_TESTE", "seuemail@exemplo.com")
    resultado = gerar_e_enviar_token(destino_teste)
    print("Código gerado:", resultado["codigo"])
    print("Expira em:", resultado["expira_em"])
    print("Enviado com sucesso?", resultado["enviado"])

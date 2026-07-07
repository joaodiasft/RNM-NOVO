"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icons";

type Perfil = "ALUNO" | "RESPONSAVEL" | "PROFESSOR" | "ADMIN";

const perfis: { id: Perfil; label: string; hint: string; icone: IconName }[] = [
  { id: "ALUNO", label: "Aluno", hint: "Entre com seu código de matrícula e senha.", icone: "user" },
  {
    id: "RESPONSAVEL",
    label: "Responsável",
    hint: "Entre com a matrícula do seu filho e a sua senha de responsável.",
    icone: "users",
  },
  { id: "PROFESSOR", label: "Professor", hint: "Entre com seu e-mail institucional e senha.", icone: "book" },
  {
    id: "ADMIN",
    label: "Administrador",
    hint: "E-mail e senha + código de verificação enviado por e-mail.",
    icone: "shield",
  },
];

const destaques: { icone: IconName; texto: string }[] = [
  { icone: "check-circle", texto: "Frequência e reposições em tempo real" },
  { icone: "pencil", texto: "Acompanhamento de redações e notas" },
  { icone: "currency", texto: "Financeiro e rematrículas sem papelada" },
  { icone: "bell", texto: "Avisos direto para alunos e responsáveis" },
];

function LoadingOverlay({ mensagem }: { mensagem: string }) {
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
      <div className="mx-4 flex max-w-xs flex-col items-center gap-4 rounded-2xl bg-white px-8 py-7 shadow-2xl">
        <div
          className="h-11 w-11 animate-spin rounded-full border-4 border-rnm-redacao/20 border-t-rnm-redacao"
          aria-hidden
        />
        <div className="text-center">
          <p className="font-semibold text-gray-900">Aguarde</p>
          <p className="mt-1 text-sm text-gray-500">{mensagem}</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [perfil, setPerfil] = useState<Perfil>("ALUNO");
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Entrando...");
  const [adminStep, setAdminStep] = useState<"senha" | "token">("senha");
  const [pendingToken, setPendingToken] = useState("");
  const [codigo, setCodigo] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [esqueciSenha, setEsqueciSenha] = useState(false);
  const [msgEsqueci, setMsgEsqueci] = useState("");

  const perfilAtual = perfis.find((p) => p.id === perfil)!;
  const usaEmail = perfil === "PROFESSOR" || perfil === "ADMIN";

  async function criarSessao(payload: Record<string, string>) {
    setLoadingMsg("Validando credenciais...");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.erro || "Falha ao entrar");
    }
    setLoadingMsg("Redirecionando...");
    window.location.href = data.redirect || "/";
  }

  async function handleEsqueciSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setMsgEsqueci("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: identificador }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Falha ao enviar");
      setMsgEsqueci(data.mensagem || "Se houver e-mail cadastrado, enviamos a nova senha.");
      setEsqueciSenha(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      if (perfil === "ADMIN") {
        if (adminStep === "senha") {
          setLoadingMsg("Verificando senha...");
          const res = await fetch("/api/auth/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: identificador, senha }),
          });
          const data = await res.json();
          if (!res.ok) {
            setErro(data.erro || "Falha no login");
            return;
          }
          setPendingToken(data.pendingToken);
          setAdminEmail(data.email);
          setCodigo("");
          setAdminStep("token");
          return;
        }

        setLoadingMsg("Verificando código...");
        const verifyRes = await fetch("/api/auth/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pendingToken, codigo }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          setErro(verifyData.erro || "Código inválido");
          return;
        }

        await criarSessao({
          perfil: "ADMIN",
          identificador: verifyData.email,
          ticket: verifyData.ticket,
        });
        return;
      }

      await criarSessao({ perfil, identificador, senha });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  const botaoLabel = loading
    ? "Aguarde..."
    : perfil === "ADMIN" && adminStep === "token"
      ? "Verificar código"
      : perfil === "ADMIN"
        ? "Enviar código"
        : "Entrar";

  return (
    <>
      {loading && <LoadingOverlay mensagem={loadingMsg} />}

      <div className="relative flex min-h-screen items-stretch overflow-hidden bg-slate-950">
        {/* fundo decorativo */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(42rem 42rem at -5% -10%, rgba(214,51,108,0.35), transparent 60%), radial-gradient(48rem 48rem at 105% 110%, rgba(79,70,229,0.32), transparent 60%), radial-gradient(30rem 30rem at 55% 40%, rgba(217,70,239,0.16), transparent 60%)",
          }}
        />

        {/* painel de marca (desktop) */}
        <div className="relative z-10 hidden w-1/2 flex-col justify-between p-12 text-white lg:flex xl:p-16">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rnm-redacao to-fuchsia-600 font-display text-xl font-bold shadow-lg">
              R
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-tight">Redação Nota Mil</p>
              <p className="text-sm text-white/50">Gestão acadêmica</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="font-display text-4xl font-bold leading-tight xl:text-5xl">
              Sua escola,{" "}
              <span className="bg-gradient-to-r from-pink-400 to-fuchsia-300 bg-clip-text text-transparent">
                organizada
              </span>{" "}
              do primeiro rascunho à nota mil.
            </h2>
            <ul className="mt-8 space-y-3.5">
              {destaques.map((d) => (
                <li key={d.texto} className="flex items-center gap-3 text-[15px] text-white/80">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon name={d.icone} className="h-4.5 w-4.5" />
                  </span>
                  {d.texto}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                { label: "Redação", cor: "#d6336c" },
                { label: "Exatas", cor: "#2f9e44" },
                { label: "Matemática", cor: "#1971c2" },
              ].map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: c.cor, boxShadow: `0 0 10px ${c.cor}` }}
                  />
                  {c.label}
                </span>
              ))}
            </div>
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} Redação Nota Mil — Goiânia (GO)
            </p>
          </div>
        </div>

        {/* cartão de login */}
        <div className="relative z-10 flex w-full items-center justify-center px-4 py-10 sm:px-6 lg:w-1/2">
          <div className="w-full max-w-md">
            {/* marca (mobile) */}
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rnm-redacao to-fuchsia-600 font-display text-2xl font-bold text-white shadow-lg">
                R
              </div>
              <h1 className="font-display text-2xl font-bold text-white">Redação Nota Mil</h1>
              <p className="mt-1 text-sm text-white/50">Gestão acadêmica</p>
              <div className="mt-3 flex justify-center gap-2">
                {[
                  { label: "Redação", cor: "#d6336c" },
                  { label: "Exatas", cor: "#2f9e44" },
                  { label: "Matemática", cor: "#1971c2" },
                ].map((c) => (
                  <span
                    key={c.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/85"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: c.cor }}
                    />
                    {c.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
              <div className="mb-6 hidden lg:block">
                <h1 className="font-display text-xl font-bold text-gray-900">Bem-vindo de volta</h1>
                <p className="mt-1 text-sm text-gray-500">Escolha seu perfil para entrar.</p>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-2">
                {perfis.map((p) => {
                  const selecionado = perfil === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setPerfil(p.id);
                        setAdminStep("senha");
                        setErro("");
                      }}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                        selecionado
                          ? "border-rnm-redacao bg-rnm-redacao/5 text-rnm-redacao shadow-sm"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      <Icon name={p.icone} className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
                      <span className="truncate">{p.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="mb-5 flex items-start gap-2 rounded-xl bg-gray-50 px-3.5 py-2.5 text-xs text-gray-500">
                <Icon name="info" className="mt-px h-4 w-4 shrink-0" />
                {perfilAtual.hint}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {adminStep === "senha" && (
                  <>
                    <div>
                      <label className="field-label">
                        {usaEmail ? "E-mail" : "Código de matrícula"}
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
                          <Icon name={usaEmail ? "mail" : "user"} className="h-4.5 w-4.5" />
                        </span>
                        <input
                          type={usaEmail ? "email" : "text"}
                          value={identificador}
                          onChange={(e) => setIdentificador(e.target.value)}
                          disabled={loading}
                          autoComplete="username"
                          placeholder={usaEmail ? "voce@exemplo.com" : "RNM2026-0001"}
                          className="input pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="field-label">Senha</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
                          <Icon name="lock" className="h-4.5 w-4.5" />
                        </span>
                        <input
                          type={verSenha ? "text" : "password"}
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          disabled={loading}
                          autoComplete="current-password"
                          placeholder="Sua senha"
                          className="input pl-10 pr-11"
                          required
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setVerSenha(!verSenha)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-400 transition hover:text-gray-600"
                          title={verSenha ? "Ocultar senha" : "Mostrar senha"}
                        >
                          <Icon name={verSenha ? "eye-off" : "eye"} className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {perfil === "ADMIN" && adminStep === "token" && (
                  <div className="animate-fade-up">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setAdminStep("senha");
                        setErro("");
                      }}
                      className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-800"
                    >
                      <Icon name="arrow-left" className="h-4 w-4" />
                      Voltar
                    </button>
                    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-sm text-blue-800">
                      <Icon name="mail" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                      <span>
                        Enviamos um código de 6 dígitos para <strong>{adminEmail}</strong>
                      </span>
                    </div>
                    <label className="field-label">Código de verificação</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                      disabled={loading}
                      placeholder="••••••"
                      className="input py-3 text-center font-display text-2xl font-bold tracking-[0.5em]"
                      autoFocus
                      required
                    />
                  </div>
                )}

                {erro && (
                  <p className="msg-erro animate-fade-in">
                    <Icon name="alert" className="mt-0.5 h-4.5 w-4.5 shrink-0" strokeWidth={2} />
                    {erro}
                  </p>
                )}

                {perfil === "ALUNO" && adminStep === "senha" && !esqueciSenha && (
                  <button
                    type="button"
                    onClick={() => {
                      setEsqueciSenha(true);
                      setErro("");
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                )}

                {esqueciSenha && perfil === "ALUNO" && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <p className="mb-2 text-xs text-gray-600">
                      Informe sua matrícula. Enviaremos uma senha nova para o e-mail
                      cadastrado (mistura com seu código).
                    </p>
                    <button
                      type="button"
                      onClick={() => setEsqueciSenha(false)}
                      className="mb-2 text-xs text-gray-500 hover:underline"
                    >
                      ← Voltar ao login
                    </button>
                  </div>
                )}

                {msgEsqueci && (
                  <p className="msg-ok text-sm">{msgEsqueci}</p>
                )}

                <button
                  type={esqueciSenha && perfil === "ALUNO" ? "button" : "submit"}
                  onClick={
                    esqueciSenha && perfil === "ALUNO"
                      ? (ev) => handleEsqueciSenha(ev as unknown as React.FormEvent)
                      : undefined
                  }
                  disabled={loading}
                  className="btn w-full bg-gradient-to-r from-rnm-redacao to-fuchsia-600 py-3 text-white shadow-lg shadow-rnm-redacao/25 hover:brightness-110"
                >
                  {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {esqueciSenha && perfil === "ALUNO"
                    ? "Enviar nova senha por e-mail"
                    : botaoLabel}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-white/40">
              Problemas para entrar? Fale com a secretaria da escola.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

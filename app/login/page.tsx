"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Perfil = "ALUNO" | "RESPONSAVEL" | "PROFESSOR" | "ADMIN";

const perfis: { id: Perfil; label: string; hint: string }[] = [
  { id: "ALUNO", label: "Aluno", hint: "Código de matrícula + senha" },
  { id: "RESPONSAVEL", label: "Responsável", hint: "Matrícula do filho + seu nome (senha)" },
  { id: "PROFESSOR", label: "Professor", hint: "E-mail + senha" },
  { id: "ADMIN", label: "Administrador", hint: "E-mail + senha + código por e-mail" },
];

function LoadingOverlay({ mensagem }: { mensagem: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-xl px-8 py-7 flex flex-col items-center gap-4 max-w-xs mx-4">
        <div
          className="h-11 w-11 rounded-full border-4 border-rnm-redacao/20 border-t-rnm-redacao animate-spin"
          aria-hidden
        />
        <div className="text-center">
          <p className="font-medium text-gray-900">Aguarde</p>
          <p className="text-sm text-gray-500 mt-1">{mensagem}</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil>("ALUNO");
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Entrando...");
  const [adminStep, setAdminStep] = useState<"senha" | "token">("senha");
  const [pendingToken, setPendingToken] = useState("");
  const [codigo, setCodigo] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  async function criarSessao(payload: Record<string, string>) {
    setLoadingMsg("Validando credenciais...");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.erro || "Falha ao entrar");
    }
    setLoadingMsg("Redirecionando...");
    router.push(data.redirect || "/");
    router.refresh();
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

  const botaoLabel =
    loading
      ? "Aguarde..."
      : perfil === "ADMIN" && adminStep === "token"
        ? "Verificar código"
        : perfil === "ADMIN"
          ? "Enviar código"
          : "Entrar";

  return (
    <>
      {loading && <LoadingOverlay mensagem={loadingMsg} />}

      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-rnm-redacao">
              Redação Nota Mil
            </h1>
            <p className="text-gray-500 mt-2">Gestão acadêmica</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-2 gap-2 mb-6">
              {perfis.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setPerfil(p.id);
                    setAdminStep("senha");
                    setErro("");
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                    perfil === p.id
                      ? "bg-rnm-admin text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-500 mb-4">
              {perfis.find((p) => p.id === perfil)?.hint}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {adminStep === "senha" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {perfil === "ALUNO" || perfil === "RESPONSAVEL"
                        ? "Código de matrícula"
                        : "E-mail"}
                    </label>
                    <input
                      type="text"
                      value={identificador}
                      onChange={(e) => setIdentificador(e.target.value)}
                      disabled={loading}
                      autoComplete="username"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rnm-redacao disabled:bg-gray-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Senha</label>
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      disabled={loading}
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rnm-redacao disabled:bg-gray-50"
                      required
                    />
                  </div>
                </>
              )}

              {perfil === "ADMIN" && adminStep === "token" && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Código enviado para <strong>{adminEmail}</strong>
                  </p>
                  <label className="block text-sm font-medium mb-1">
                    Código de 6 dígitos
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-rnm-redacao disabled:bg-gray-50"
                    required
                  />
                </div>
              )}

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-rnm-redacao text-white py-2.5 font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                {botaoLabel}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

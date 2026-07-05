"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Perfil = "ALUNO" | "RESPONSAVEL" | "PROFESSOR" | "ADMIN";

const perfis: { id: Perfil; label: string; hint: string }[] = [
  { id: "ALUNO", label: "Aluno", hint: "Código de matrícula + senha" },
  { id: "RESPONSAVEL", label: "Responsável", hint: "Matrícula do filho + seu nome (senha)" },
  { id: "PROFESSOR", label: "Professor", hint: "E-mail + senha" },
  { id: "ADMIN", label: "Administrador", hint: "E-mail + senha + código por e-mail" },
];

export default function LoginPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil>("ALUNO");
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminStep, setAdminStep] = useState<"senha" | "token">("senha");
  const [pendingToken, setPendingToken] = useState("");
  const [codigo, setCodigo] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      if (perfil === "ADMIN") {
        if (adminStep === "senha") {
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

        const result = await signIn("credentials", {
          perfil: "ADMIN",
          identificador: verifyData.email,
          senha: verifyData.ticket,
          redirect: false,
        });
        if (result?.error) {
          setErro("Falha ao criar sessão");
          return;
        }
        router.push("/admin");
        router.refresh();
        return;
      }

      const result = await signIn("credentials", {
        perfil,
        identificador,
        senha,
        redirect: false,
      });

      if (result?.error) {
        setErro("Credenciais inválidas");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
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
                onClick={() => {
                  setPerfil(p.id);
                  setAdminStep("senha");
                  setErro("");
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rnm-redacao"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Senha</label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rnm-redacao"
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
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-rnm-redacao"
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
              className="w-full rounded-lg bg-rnm-redacao text-white py-2.5 font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? "Entrando..."
                : perfil === "ADMIN" && adminStep === "token"
                  ? "Verificar código"
                  : perfil === "ADMIN"
                    ? "Enviar código"
                    : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

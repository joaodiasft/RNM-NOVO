import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verificarSenha } from "@/lib/crypto";
import type { PapelUsuario } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nome: string;
      email?: string | null;
      codigo?: string;
      papel: PapelUsuario;
      alunoSelecionadoId?: string;
    };
  }

  interface User {
    id: string;
    nome: string;
    email?: string;
    codigo?: string;
    papel: PapelUsuario;
    alunoSelecionadoId?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    nome: string;
    email?: string;
    codigo?: string;
    papel: PapelUsuario;
    alunoSelecionadoId?: string;
  }
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Credentials({
      id: "credentials",
      name: "RNM Login",
      credentials: {
        perfil: { label: "Perfil", type: "text" },
        identificador: { label: "Identificador", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const perfil = credentials?.perfil as PapelUsuario;
        const identificador = (credentials?.identificador as string)?.trim();
        const senha = credentials?.senha as string;

        if (!perfil || !identificador || !senha) return null;

        switch (perfil) {
          case "ALUNO": {
            const aluno = await prisma.aluno.findUnique({
              where: { codigo: identificador.toUpperCase() },
            });
            if (!aluno || !aluno.ativo) return null;
            if (!(await verificarSenha(senha, aluno.senhaHash))) return null;
            return {
              id: aluno.id,
              nome: aluno.nome,
              codigo: aluno.codigo,
              papel: "ALUNO" as PapelUsuario,
            };
          }
          case "RESPONSAVEL": {
            const aluno = await prisma.aluno.findUnique({
              where: { codigo: identificador.toUpperCase() },
              include: { responsaveis: { include: { responsavel: true } } },
            });
            if (!aluno) return null;
            for (const r of aluno.responsaveis) {
              if (await verificarSenha(senha, r.responsavel.senhaHash)) {
                return {
                  id: r.responsavel.id,
                  nome: r.responsavel.nome,
                  papel: "RESPONSAVEL" as PapelUsuario,
                  alunoSelecionadoId: aluno.id,
                };
              }
            }
            return null;
          }
          case "PROFESSOR": {
            const professor = await prisma.professor.findUnique({
              where: { email: identificador.toLowerCase() },
            });
            if (!professor || !professor.ativo) return null;
            if (!(await verificarSenha(senha, professor.senhaHash))) return null;
            return {
              id: professor.id,
              nome: professor.nome,
              email: professor.email,
              papel: "PROFESSOR" as PapelUsuario,
            };
          }
          case "ADMIN": {
            const { verificarTicketAdmin } = await import("@/lib/auth/admin-ticket");
            const admin = await verificarTicketAdmin(identificador, senha);
            if (!admin) return null;
            return {
              id: admin.id,
              nome: admin.nome,
              email: admin.email,
              papel: "ADMIN" as PapelUsuario,
            };
          }
          default:
            return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.nome = user.nome;
        token.email = user.email;
        token.codigo = user.codigo;
        token.papel = user.papel;
        token.alunoSelecionadoId = user.alunoSelecionadoId;
        import("@/lib/logging/sheets").then(({ registrarLog }) =>
          registrarLog({
            nivel: "INFO",
            categoria: "AUTH",
            acao: "LOGIN_SUCESSO",
            usuarioId: user.id,
            papel: user.papel,
          })
        );
      }
      if (trigger === "update" && session?.alunoSelecionadoId) {
        // Segurança: só aceita a troca se o aluno realmente for filho
        // deste responsável — nunca confie no valor vindo do cliente.
        if (token.papel === "RESPONSAVEL") {
          const vinculo = await prisma.alunoResponsavel.findFirst({
            where: {
              responsavelId: token.id as string,
              alunoId: session.alunoSelecionadoId as string,
            },
            select: { id: true },
          });
          if (vinculo) {
            token.alunoSelecionadoId = session.alunoSelecionadoId;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.id as string,
          nome: token.nome as string,
          email: (token.email as string | undefined) ?? null,
          codigo: token.codigo as string | undefined,
          papel: token.papel as PapelUsuario,
          alunoSelecionadoId: token.alunoSelecionadoId as string | undefined,
        },
      };
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
};

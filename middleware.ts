import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/login", "/api/auth"];

// A Auth.js usa "__Secure-" quando a URL configurada é https (produção).
// Detecta qual cookie realmente existe em vez de adivinhar pelo protocolo.
const COOKIE_SEGURO = "__Secure-authjs.session-token";
const COOKIE_PADRAO = "authjs.session-token";

/** Headers de segurança aplicados a todas as respostas dinâmicas. */
function comSeguranca(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  // Força HTTPS por 1 ano (ignorado em http local)
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Canonical: www → apex (mesmo Worker, evita cookie/session em dois hosts)
  if (host === "www.redacaonotamil.site") {
    const dest = request.nextUrl.clone();
    dest.host = "redacaonotamil.site";
    dest.protocol = "https:";
    return comSeguranca(NextResponse.redirect(dest, 308));
  }

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return comSeguranca(NextResponse.next());
  }

  const cookieName = request.cookies.has(COOKIE_SEGURO) ? COOKIE_SEGURO : COOKIE_PADRAO;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName,
    secureCookie: cookieName === COOKIE_SEGURO,
  });

  if (!token) {
    // APIs devolvem 401 JSON; páginas redirecionam para o login
    if (pathname.startsWith("/api")) {
      return comSeguranca(
        NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
      );
    }
    return comSeguranca(NextResponse.redirect(new URL("/login", request.url)));
  }

  const papel = token.papel as string;
  const home: Record<string, string> = {
    ADMIN: "/admin",
    PROFESSOR: "/professor",
    ALUNO: "/aluno",
    RESPONSAVEL: "/responsavel",
  };
  const prefixos: [string, string][] = [
    ["/admin", "ADMIN"],
    ["/professor", "PROFESSOR"],
    ["/aluno", "ALUNO"],
    ["/responsavel", "RESPONSAVEL"],
  ];

  for (const [prefixo, papelEsperado] of prefixos) {
    if (pathname.startsWith(prefixo) && papel !== papelEsperado) {
      // Manda cada um para a própria área em vez de loop no "/"
      return comSeguranca(
        NextResponse.redirect(new URL(home[papel] || "/login", request.url))
      );
    }
  }

  return comSeguranca(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};

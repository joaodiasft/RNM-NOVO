import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/login", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const papel = token.papel as string;
  if (pathname.startsWith("/admin") && papel !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/professor") && papel !== "PROFESSOR") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/aluno") && papel !== "ALUNO") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/responsavel") && papel !== "RESPONSAVEL") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { NextResponse } from "next/server";

/** Redireciona para o PDF estático do tutorial (compatível com Cloudflare Workers). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/docs/tutorial-aluno.pdf", url.origin));
}

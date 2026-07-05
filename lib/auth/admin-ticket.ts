import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

function ticketSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "dev");
}

export async function criarTicketAdmin(adminId: string): Promise<string> {
  return new SignJWT({ adminId, purpose: "admin-login-ticket" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2m")
    .sign(ticketSecret());
}

export async function verificarTicketAdmin(email: string, ticket: string) {
  let adminId: string;
  try {
    const { payload } = await jwtVerify(ticket, ticketSecret());
    if (payload.purpose !== "admin-login-ticket") return null;
    adminId = payload.adminId as string;
  } catch {
    return null;
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });
  if (!admin || admin.email.toLowerCase() !== email.toLowerCase()) return null;

  return admin;
}

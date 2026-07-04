import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const tickets = new Map<string, { adminId: string; expira: number }>();

export function criarTicketAdmin(adminId: string): string {
  const ticket = createHmac("sha256", process.env.AUTH_SECRET || "dev")
    .update(`${adminId}:${Date.now()}:${Math.random()}`)
    .digest("hex");
  tickets.set(ticket, { adminId, expira: Date.now() + 60_000 });
  return ticket;
}

export async function verificarTicketAdmin(email: string, ticket: string) {
  const entry = tickets.get(ticket);
  if (!entry || entry.expira < Date.now()) {
    tickets.delete(ticket);
    return null;
  }

  const admin = await prisma.admin.findUnique({
    where: { id: entry.adminId },
  });
  if (!admin || admin.email.toLowerCase() !== email.toLowerCase()) return null;

  tickets.delete(ticket);
  return admin;
}

export function compararSeguro(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

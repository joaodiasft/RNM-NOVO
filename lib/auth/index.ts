import NextAuth from "next-auth";
import { authConfig } from "./config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
});

export async function getSession() {
  return auth();
}

export async function requireSession(papeis?: string[]) {
  const session = await auth();
  if (!session?.user) return null;
  if (papeis && !papeis.includes(session.user.papel)) return null;
  return session;
}

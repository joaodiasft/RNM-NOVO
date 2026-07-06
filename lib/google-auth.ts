import { SignJWT, importPKCS8 } from "jose";

let cachedToken: { token: string; exp: number } | null = null;

export async function getGoogleAccessToken(
  scopes: string[]
): Promise<string | null> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp > now + 60) {
    return cachedToken.token;
  }

  const key = await importPKCS8(privateKey, "RS256");
  const jwt = await new SignJWT({ scope: scopes.join(" ") })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(email)
    .setSubject(email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = { token: data.access_token, exp: now + data.expires_in };
  return data.access_token;
}

import fs from "fs";

const workerUrl = process.argv[2];
if (!workerUrl) {
  console.error("Usage: node scripts/prepare-cf-secrets.mjs <BASE_URL>");
  process.exit(1);
}

const content = fs.readFileSync(".env", "utf8");
const secrets = {};

for (const line of content.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx);
  let value = trimmed.slice(idx + 1);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  value = value.replace(/\\n/g, "\n");
  secrets[key] = value;
}

secrets.NEXTAUTH_URL = workerUrl;
secrets.AUTH_URL = workerUrl;
fs.writeFileSync(".cf-secrets.json", JSON.stringify(secrets));
console.log(`Prepared ${Object.keys(secrets).length} secrets`);

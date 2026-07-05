import { existsSync, rmSync } from "node:fs";

const cacheDir = ".next/cache";
if (existsSync(cacheDir)) {
  rmSync(cacheDir, { recursive: true, force: true });
  console.log(`Removed ${cacheDir}`);
}

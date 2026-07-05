const fs = require("fs");
const path = require("path");

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (name === "page.tsx" || name === "route.ts") files.push(p);
  }
  return files;
}

const line = 'export const runtime = "edge";\n\n';
let count = 0;

for (const file of walk(path.join(__dirname, "../app"))) {
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes("export const runtime")) {
    fs.writeFileSync(file, line + content);
    count++;
  }
}

console.log(`Updated ${count} files`);

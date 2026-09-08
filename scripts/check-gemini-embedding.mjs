import { readFileSync } from "node:fs";

for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const line = raw.replace(/\r$/, "");
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
}

const { embedGemini } = await import("../src/lib/gemini-embedding.js");
try {
  const v = await embedGemini("Pedro Páramo. Juan Rulfo. Comala.");
  console.log("DIMS:", v.length, "NORM:", Math.hypot(...v).toFixed(4));
} catch (e) {
  console.log("ERR:", String(e.message ?? e).slice(0, 200));
}

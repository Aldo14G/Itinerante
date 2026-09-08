import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function loadLocalEnv(path = ".env.local") {
  let text;
  try {
    text = await readFile(resolve(path), "utf8");
  } catch {
    return;
  }
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

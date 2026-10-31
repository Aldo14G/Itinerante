// Copia la superficie estatica (fuente de verdad en la raiz) a public/: es la lista de permitidos
// que publican Cloudflare (wrangler.jsonc), Firebase Hosting (predeploy) y Vercel (legado).
import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });
await cp(join(root, "index.html"), join(publicDir, "index.html"));
for (const dir of ["assets", "images"]) {
  await cp(join(root, dir), join(publicDir, dir), { recursive: true });
}
for (const file of ["Logo.png", "Logo.webp"]) {
  try {
    await cp(join(root, file), join(publicDir, file));
  } catch {
    // Marca opcional; el HTML ya referencia Logo.webp con fallback.
  }
}
await cp(join(root, "worker", "_headers"), join(publicDir, "_headers"));
console.log("public/ listo");

// Cloudflare Pages (proyecto «libreriaitinerante», https://libreriaitinerante.pages.dev, desde el 2026-11-27).
// El sitio se publica 100 % estático: scripts/prepare-pages.mjs llama a este worker al construir para generar el
// index.html, robots.txt y sitemap.xml con el origen público fijo. No se despliega como función.
import sitio from "./nuevo";

export const ORIGEN_PAGES = "https://libreriaitinerante.pages.dev";

export default {
  fetch(request: Request): Promise<Response> {
    return sitio.fetch(request, { PUBLIC_SITE_ORIGIN: ORIGEN_PAGES });
  },
};

// Entrada de Cloudflare Pages (proyecto «libreriaitinerante», https://libreriaitinerante.pages.dev, desde el 2026-11-27).
// Pages solo invoca este worker en las rutas de _routes.json (las mismas que run_worker_first en wrangler.jsonc); el
// resto lo sirve Pages como estático con _headers y 404.html. Aquí solo se fija el origen público.
import sitio from "./nuevo";

export const ORIGEN_PAGES = "https://libreriaitinerante.pages.dev";

export default {
  fetch(request: Request, env: { PUBLIC_SITE_ORIGIN?: string }): Promise<Response> {
    return sitio.fetch(request, { PUBLIC_SITE_ORIGIN: env.PUBLIC_SITE_ORIGIN || ORIGEN_PAGES });
  },
};

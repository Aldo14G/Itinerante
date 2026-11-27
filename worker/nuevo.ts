import { GET as documentoNuevo } from "../src/app/nuevo/route";
import { CSP } from "../src/app/nuevo/documento.generado";

const SEGURIDAD = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};
const NO_STORE = { ...SEGURIDAD, "Cache-Control": "no-store" };
const LEGADO = /^\/(?:(?:nuevo|index(?:\.html)?)\/?|(?:prototypes|_archive)(?:\/.*)?)$/;

export default {
  async fetch(request: Request, env: { PUBLIC_SITE_ORIGIN?: string }): Promise<Response> {
    const url = new URL(request.url);
    const esRobots = url.pathname === "/robots.txt";
    const esSitemap = url.pathname === "/sitemap.xml";
    if (url.pathname !== "/" && !esRobots && !esSitemap && !LEGADO.test(url.pathname)) {
      return new Response(null, { status: 404, headers: NO_STORE });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, { status: 405, headers: { ...NO_STORE, Allow: "GET, HEAD" } });
    }
    if (url.search.length > 4096) return new Response(null, { status: 414, headers: NO_STORE });

    const esPublico = env.PUBLIC_SITE_ORIGIN === url.origin && url.protocol === "https:";
    if (esRobots || esSitemap) {
      if (esSitemap && !esPublico) {
        return new Response(null, { status: 404, headers: { ...NO_STORE, "X-Robots-Tag": "noindex" } });
      }
      const body = esRobots
        ? `User-agent: *\nDisallow: /api/\n${esPublico ? `Sitemap: ${url.origin}/sitemap.xml\n` : ""}`
        : `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url.origin}/</loc></url></urlset>\n`;
      return new Response(request.method === "HEAD" ? null : body, {
        headers: {
          ...SEGURIDAD,
          "Content-Type": esRobots ? "text/plain; charset=utf-8" : "application/xml; charset=utf-8",
          "Cache-Control": esPublico ? "public, max-age=3600" : "no-store",
        },
      });
    }
    if (url.pathname !== "/") {
      return new Response(null, { status: 308, headers: { ...NO_STORE, Location: `/${url.search}` } });
    }

    const respuesta = documentoNuevo(request);
    const headers = new Headers(respuesta.headers);
    Object.entries(SEGURIDAD).forEach(([nombre, valor]) => headers.set(nombre, valor));
    headers.set("Content-Security-Policy", CSP);
    if (url.search) headers.set("Cache-Control", "private, no-store");
    if (!esPublico) headers.set("X-Robots-Tag", "noindex");
    if (request.method === "HEAD") return new Response(null, { headers });
    let html = (await respuesta.text()).replace(/(\s(?:href|action)=")\/nuevo(?=[?#"])/g, "$1/");
    if (esPublico) {
      // URL de Cloudflare ya normalizada, ligada al único origen público configurado.
      html = html
        .replaceAll('https://itinerante.vercel.app/"', `${url.origin}/"`)
        .replaceAll("https://itinerante.vercel.app/assets/", `${url.origin}/assets/`)
        .replace('<meta name="robots" content="noindex"/>', "");
    }
    return new Response(html, { headers });
  },
};

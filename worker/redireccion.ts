// Redirección de las direcciones anteriores de la landing. Desde el 2026-11-27 la landing vive en Cloudflare Pages
// (https://libreriaitinerante.pages.dev). Este worker se despliega con los nombres que tuvo en workers.dev
// («libreria», «libreria-itinerante» y «libreriaitinerante») y solo redirige, conservando ruta y consulta:
//   npx wrangler deploy -c wrangler.redireccion.jsonc --name <nombre>
const DESTINO = "https://libreriaitinerante.pages.dev";

export default {
  fetch(request: Request): Response {
    const { pathname, search } = new URL(request.url);
    return new Response(null, {
      status: 301,
      headers: {
        Location: `${DESTINO}${pathname}${search}`,
        "Cache-Control": "public, max-age=86400",
        "X-Robots-Tag": "noindex",
      },
    });
  },
};

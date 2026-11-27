// Worker «libreria-itinerante»: el nombre anterior de la landing. Desde el 2026-11-27 la landing vive en el Worker
// «libreria» (https://libreria.itinerante.workers.dev); este solo redirige ahí conservando ruta y consulta.
// Se despliega con: npx wrangler deploy -c wrangler.redireccion.jsonc
const DESTINO = "https://libreria.itinerante.workers.dev";

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

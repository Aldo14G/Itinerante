# Project Context

## Domain Terms

- **B.4 «Función de la casa»**: el sitio público vigente, en la raíz del repositorio. La librería se presenta como una función de cine: se entra a la casa con el propio scroll. Sistema de diseño en `DESIGN.md` y `design/tokens.json`.
- **Tono de sección** (`data-tone="light|mist|deep"`): redefine los mismos tokens dentro de una sección y pinta su fondo. El hero, el manifiesto y el catálogo van en `light` (blanco), La casa y Libros en `mist` (bruma, blanco teñido de turquesa), la cita y el pie en `deep` (turquesa casi negro). Cartelera y el llamado pintan el campo turquesa del logo.
- **Recorrido de la entrada**: 145 fotogramas en canvas sincronizados al scroll, solo en escritorio y con movimiento. En móvil, con movimiento reducido o con ahorro de datos, el hero es un póster fijo.
- **Cartelera**: propuestas de actividades sin fecha, cupo ni costo; el CTA es consulta por WhatsApp, no reserva.
- **Catálogo de muestra**: `#catalogo`, 500 registros de prueba en `assets/data/catalog.json` con búsqueda y filtros locales. Desde 2026-11-10 la página lo llama «catálogo» y no lleva sellos de muestra (plantilla real, decisión de Aldo); los datos siguen siendo de prueba hasta que llegue el listado de la librería. No consulta `/api/catalog`.
- **Iti IA**: API en el Worker (`/api/ai/iti-ia`) que responde con base en el catálogo recuperado. **No está conectada a la interfaz del sitio B.4.**
- **Procedencia**: el origen de cada imagen está en `assets/provenance.json` y en `data-kind` (`ai` | `real`) del marcado. Desde 2026-11-10 es un dato interno: la página no imprime rótulos «Foto real» ni «Recreación IA».

## Architecture Decisions In Force

- **2026-11-01 · B.4 sustituye al sitio raíz anterior (decisión de Aldo).** `index.html` en la raíz es el prototipo B.4; es la única superficie pública y la única home. El sitio anterior (Higgsfield `d599d36a`) quedó archivado en `_archive/models/higgsfield-d599d36a/` (`index.html`, `assets/`, `images/`, `DESIGN.md`, `tests/site.test.mjs`). Esa carpeta está ignorada por git; la historia de git conserva el sitio anterior y es la forma de recuperarlo. No recibe trabajo nuevo.
- Se movieron a la raíz `index.html`, `style.css`, `mobile.css`, `tokens.css`, `app.js`, `catalog.js`, `motion.js`, `scenes-desktop.js`, `assets/{data,fonts,img,js/boot.js,seq,seq-m,provenance.json}` y `DESIGN.md`. La prueba del prototipo pasó a `tests/site.test.mjs`, el servidor local a `tools/preview-site.mjs`, y el brief, el README y las capturas a `docs/B4-BRIEF.md`, `docs/B4-README.md` y `docs/evidence/`. `prototypes/` ya no existe.
- Cloudflare es el destino de deploy (Workers Static Assets + Worker solo para `/api/*`). Vercel, Firebase Hosting y las rutas Next son legado hasta validar Cloudflare.
- No se añade una página pública alternativa ni una UI en Next.js.
- `src/app/api`, `src/ai`, `src/lib`, `src/config`, `worker`, `dataconnect` y `generated` son código de servicio y datos; no son dueños de la presentación.
- Los tokens salen de `design/tokens.json` (`npm run tokens` genera `tokens.css`). Las duraciones de JS se leen de esos tokens vía `motion.js`.
- El sitio sigue siendo HTML estático, CSS local y JavaScript nativo. Sin Tailwind CDN, sin SDKs de Higgsfield, sin dependencias externas en runtime.
- `design-system/libreria-itinerante-y-mas/MASTER.md` y `pages/home.md` describen el canon anterior y son referencia histórica.

## Pendiente tras la sustitución (auditoría del 2026-11-01)

Nada de esto está resuelto por la promoción a la raíz:

- **Contrato de datos del catálogo**: B.4 lee un JSON de muestra estático; `/api/catalog` usa una taxonomía controlada distinta. Hay que decidir y unificar.
- **Iti IA** existe como API en el Worker pero no está integrada en la UI.
- **Límites de ritmo del Worker** (`IA_PER_IP`, `IA_GLOBAL`): sin validar en preview y sin try/catch alrededor de `limit()`.
- **La API de catálogo expone** calificación, reseñas y precio de referencia de Amazon, contra la regla de no publicar datos sin fuente verificable.
- Los filtros `category`/`subgenre` de la API no son coherentes con las facetas; `condition` está fijo en `nuevo`.
- Sin inventario real, sin Data Connect conectado al Worker y sin Go.
- Restos de Supabase en el repositorio (legado).
- Dominio de producción sin confirmar: `canonical`, `og:url`, sitemap y el `noindex,nofollow` actual de `index.html` dependen de ello.
- El sitio B.4 no está desplegado.

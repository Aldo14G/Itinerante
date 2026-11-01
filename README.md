# Libreria Itinerante y Mas

El sitio público es [`index.html`](index.html) en la raíz: el prototipo B.4
«Función de la casa», promovido a sitio canónico el 2026-11-01. Presenta la
librería como una función de cine: se entra a la casa con el propio scroll
(recorrido de fotogramas en escritorio, póster fijo en móvil), se recorre
La casa, la Cartelera, los temas de Libros, un catálogo de muestra y la Visita.
Es HTML estático, CSS local y JavaScript nativo, sin SDKs externos. No hay una
segunda home: el sitio anterior (Higgsfield `d599d36a`) está archivado en
`_archive/models/higgsfield-d599d36a/` (ignorado por git; recuperable en la
historia de git).

## Qué hay y qué no

- **Catálogo**: 500 registros de prueba en `assets/data/catalog.json`, con
  búsqueda y filtros locales en el navegador. Está rotulado «Datos de muestra ·
  no es inventario»; no hay precios ni existencias.
- **Iti IA**: existe como API en el Worker (`/api/ai/iti-ia`), pero **no está
  conectada a la interfaz del sitio**. La UI no la llama.
- **Cartelera**: propuestas sin fecha, cupo ni costo. El contacto es por
  WhatsApp.
- **Estado**: no está desplegado. Cloudflare es el destino; Vercel, Firebase y
  Next son legado.

## Comandos

- `npm test`: regresión del repositorio, incluida la prueba del sitio
  (`tests/site.test.mjs`).
- `node tools/preview-site.mjs`: sirve el sitio en `http://127.0.0.1:8094/`
  (variable `PORT` para cambiarlo), con la CSP de producción. No sirve la API.
- `npm run preview` / `npm run dev`: emulador Data Connect, backend Next y vista
  previa en `http://127.0.0.1:8080/` (flujo anterior con API local). Espera el
  mensaje **Vista local lista**.
- `npm run cf:dev`: arma `public/` y sirve sitio y API con `wrangler dev`.
- `npm run cf:deploy`: arma `public/` y publica con `wrangler deploy`. Solo
  cuando Aldo lo pida.
- `npm run tokens` / `npm run tokens:check`: genera o verifica `tokens.css`
  desde `design/tokens.json`.
- `npm run critique`: revisión de diseño contra los tokens.
- `npm run backend:dev` / `npm run backend:build`: rutas Next internas (legado).
- `npm run books:validate -- ruta/catalogo.json`: valida datos sin escribir.
- `npm run books:import -- ruta/catalogo.json`: importación administrativa.
- `npm run amazon:etl` / `npm run amazon:etl:check`: transforma o perfila el CSV
  Amazon como catálogo local de prueba.
- `npm run reference:check`: veinte consultas bibliográficas locales y
  aislamiento de candidatas; incluido en `npm test`. Detalles en
  [`docs/CATALOG_DATASET_AND_MODEL.md`](docs/CATALOG_DATASET_AND_MODEL.md#implementación-local--2026-09-05).
- `npm run rag:test`: recuperación local tras importar en el emulador.
- `npm run dataconnect:generate` / `npm run dataconnect:verify`: SDK de Data
  Connect y su manifiesto.
- `npm run genkit:ui`: interfaz local de Genkit.
- `firebase emulators:start`: emuladores Firebase/Data Connect.

## Dónde leer

- Decisiones y pendientes: [`CONTEXT.md`](CONTEXT.md) y
  [`docs/CONTINUITY.md`](docs/CONTINUITY.md).
- Producto y límites de verdad: [`PRODUCT.md`](PRODUCT.md).
- Sistema de diseño vigente: [`DESIGN.md`](DESIGN.md) y `design/tokens.json`.
- Origen del prototipo: [`docs/B4-BRIEF.md`](docs/B4-BRIEF.md) y
  [`docs/B4-README.md`](docs/B4-README.md).
- Contrato de datos y verificación:
  [`docs/BOOK_DATA_AND_RAG.md`](docs/BOOK_DATA_AND_RAG.md).

Data Connect, Genkit, el Worker y las rutas bajo `src/app/api` son un servicio
interno en preparación; no son otra versión del sitio. El backend Supabase
anterior permanece solo como legado.

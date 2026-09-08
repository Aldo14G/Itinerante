# Project Context

## Domain Terms

- **Claude Cinematic Model**: composición editorial de `Itinerante Home cinematico.dc.html`; es la autoridad visual.
- **Higgsfield Media Layer**: video, posters y mecánica de referencia de `d599d36a`, sin layout, copy, SDKs ni dependencias privadas.
- **Scroll Scrub**: recorrido compartido por Entrada, Experiencia, Comunidad y Agenda; el tiempo del video responde al scroll nativo y siete fotogramas locales cubren carga, ahorro de datos y movimiento reducido.
- **Agenda Cultural**: lista editorial anclada en `#eventos`, sin fechas o cupos no verificados.
- **Catalog Discovery**: búsqueda conectada y taxonomía controlada ancladas en `#catalogo`.
- **Iti IA**: diálogo contextual que usa el catálogo recuperado; no es otra interfaz pública.

## Architecture Decisions In Force

- `index.html` is the only official public web surface and the only home page.
- Its canonical composition is the Claude Design cinematic model. The previous
  monolith is archived in `_archive/models/` and must not receive new UI.
- Do not add an alternate public HTML page or a Next.js UI.
- `src/app/api`, `src/ai`, `src/lib`, `src/config`, `dataconnect`, and
  `generated` are service/data code only; they do not own public presentation.
- The numbered Claude chapter bar is the single section-navigation owner.
- Catalog category chips mirror `data/taxonomy.controlled.json`.
- The site remains static HTML, CSS tokens, local CSS, and vanilla JavaScript until real data needs justify a deeper migration. Tailwind CDN is intentionally not part of the runtime.

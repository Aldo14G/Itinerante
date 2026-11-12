# Repository Guidelines

## Project Structure & Module Organization

Este repositorio es el sitio estático de Librería Itinerante y Más más una API pequeña. **El sitio canónico es el prototipo B.4 «Función de la casa», promovido a la raíz el 2026-11-01** (decisión de Aldo; ver `CONTEXT.md`). Sustituye al sitio anterior (Higgsfield `d599d36a`), que quedó archivado y no recibe trabajo nuevo. No hay segunda home.

**Cloudflare es el destino de deploy**: `wrangler.jsonc` sirve `public/` como Workers Static Assets y ejecuta `worker/index.ts` solo para `/api/*` (`/api/catalog`, `/api/ai/iti-ia`). Vercel (`vercel.json`, `src/app/api/*`) y Firebase Hosting (`firebase.json`) son legado y se conservan hasta validar Cloudflare en producción; las rutas Next duplican el Worker y se borrarán después. Hoy el sitio **no está desplegado** con B.4.

Archivos del sitio, todos en la raíz:

- `index.html`: la única página pública. Un solo documento, copy en español.
- `tokens.css`: **generado** desde `design/tokens.json` por `scripts/build-tokens.mjs`. No se edita a mano.
- `style.css` (escritorio y base) y `mobile.css` (`media="(max-width: 760px)"`): estilos locales.
- `app.js`: escenas de scroll, menú, Libros, mensajes de WhatsApp y estado de apertura en hora de Monterrey. `scenes-desktop.js`: cortinilla de escritorio y el recorrido por fotogramas del inicio, hoy dormido (solo corre si `#inicio` declara `data-seq`; desde 2026-11-10 el inicio es una foto real fija); `app.js` lo carga con `import()` solo con movimiento y pantalla de escritorio. `catalog.js`: catálogo de muestra, se carga al acercarse a `#catalogo`; también guarda la presentación en español de los géneros (`GENRE_ES`: el dato sigue en inglés). `sample.js`: carga única de la muestra. `saved.js`: «Mi lista para la visita» (libros guardados en `localStorage`, sin cuenta; hoja, aviso, mensaje de WhatsApp y chip con conteo en la cabecera). `rail.js`: carrusel de libros (capa 1 de Libros), se carga al acercarse; lee `assets/data/collections.json` (filtros sobre la muestra o listas curadas en `ids`) y pide la ficha al catálogo con el evento `iti:open-book`; una colección con `tema` se marca al elegir ese tema en «Pregúntanos» (evento `iti:topic`, lo emite `app.js`). `motion.js`: lee las duraciones y curvas de los tokens CSS.
- `feed.js`: sensación de red social en móvil sin burbujas de historias (los destacados y el visor se retiraron el 2026-11-11): publicaciones de Cartelera (encabezado «Itinerante · propuesta», foto, «Me interesa» y «Compartir» debajo de la foto, locales y sin contadores; cada «Compartir» lleva el título en su nombre accesible); `app.js` lo carga con `import()` al primer toque o en reposo.
- `tag.js`: procedencia de las imágenes como dato interno (`KINDS`, `validKind`): `ai` o `real`, registrada en `data-kind` del marcado, en los temas de `app.js` y en `assets/provenance.json`. No se imprime ningún rótulo (decisión del 2026-11-10); una foto sin procedencia registrada no entra a las historias.
- `news.js`: Novedades, capítulo propio (`#novedades`, después de Eventos). Lee `novedades.entradas` de `assets/data/collections.json`: una lista de `{ "id": "…", "llegada": "AAAA-MM-DD" }` (el id de un libro de `catalog.json`). **Para actualizarla se añaden renglones a ese JSON; no se toca HTML ni JS** (`npm test` comprueba que cada id exista y cada fecha sea real). Hoy son 12 datos de ejemplo del catálogo de prueba. Ordena de lo más reciente a lo más antiguo, muestra hasta 12 con la tarjeta del carrusel y marca «Nuevo» lo que llegó después de la última vez que la persona vio la sección (`localStorage`, `iti-news-visto`; en la primera visita, lo de los últimos 14 días). La fecha no se imprime. Con llegadas sin ver pone un punto en la casilla Novedades de la barra y el control «N novedades…» del inicio. Sin entradas válidas no existen la sección, su casilla, sus enlaces ni el control; nunca se presenta como ranking. Es un módulo ligero: `app.js` lo pide pronto para el conteo (`initNewsCount`, solo `collections.json`) y al acercarse a la sección pinta la tira (`initNews`, que importa `rail.js` y `catalog.js`). `assets/js/boot.js` reserva antes del primer render la sección (`has-news`) y el renglón del control (`news-hint`) con lo que dejó la visita anterior (`iti-news-estado`), para que el conteo llegue sin mover nada. Lógica pura probada con fechas: `validDay`, `isNew`, `newsEntries`, `newsPlan`, `statusLine`, `hintLine`.
- Navegación: el orden de la página es Inicio (`#inicio`, manifiesto y La casa `#casa`) → Catálogo (`#libros`, con `#catalogo` dentro) → Eventos y talleres (`#cartelera`) → Novedades (`#novedades`) → cita y llamado → Visita (`#visita`) → pie. Los `id` son los de siempre; cambiaron los nombres visibles. Cabecera de escritorio y menú compacto (761–1100 px): Catálogo, Eventos, Novedades, Visita. Móvil: barra inferior acoplada (`.tabbar`, cinco casillas con nombre: Inicio, Catálogo, Eventos, Novedades y Más) y la hoja «Más» (`#sheet-menu`: Mi lista, Buscar en el catálogo, La casa, Visita con su horario, redes; sin acordeones). La casilla activa la marca `headerScene` en `app.js` (zonas por destino; en Visita y el pie ninguna).
- `sheets.js`: hojas modales (menú lateral, Mi lista, ficha, Explorar): bloqueo de scroll por contador, botón «atrás» que cierra la hoja de arriba, `openDialog(dlg, { defer })` (el contenido de la hoja espera un fotograma) y `closeDialog()` (la hoja sale, se omite su contenido y un fotograma después corre el cierre real) para que cada tarea quede bajo 200 ms con CPU 4× (ver DESIGN.md, «Hojas en tareas cortas»). No se tapa el fondo mientras hay una hoja abierta: se probó y se descartó.
- `assets/`: `data/catalog.json` (500 registros de prueba), `fonts/`, `img/` (solo fotografías reales de la casa; las recreaciones y la secuencia de fotogramas `seq/` y `seq-m/` se retiraron el 2026-11-10), `js/boot.js` (estado previo al primer render) y `provenance.json` (origen de cada imagen).
- `DESIGN.md` y `design/tokens.json`: sistema de diseño vigente. `PRODUCT.md`: producto y límites de verdad. `CONTEXT.md`: términos y decisiones.
- `docs/`: documentación y continuidad (`docs/B4-BRIEF.md`, `docs/B4-README.md`, `docs/evidence/`). `design-system/`: canon anterior, solo referencia histórica. `tests/`: pruebas. `tools/`: servidores locales y el arnés de verificación en Chromium (`tools/qa/`).
- API y datos (servicio, sin presentación): `worker/`, `src/lib`, `src/ai`, `src/config`, `src/app/api` (legado), `dataconnect/`, `generated/`.
- Archivo: `_archive/models/higgsfield-d599d36a/` guarda el sitio anterior (`index.html`, `assets/`, `images/`, `DESIGN.md`, `tests/site.test.mjs`). Está ignorado por git; la historia de git es la copia recuperable. `Logo.png` y `Logo.webp` siguen en la raíz.

Evita salida de build en la raíz. No retomes trabajo de UI en `_archive/`.

## Build, Test, and Development Commands

- `npm test`: regresión del repositorio, incluida la prueba del sitio B.4 (`tests/site.test.mjs`), pruebas del Worker, API, taxonomía y diseño.
- `node tools/preview-site.mjs`: sirve solo el sitio (index, CSS, JS y `assets/`, con la CSP de producción y gzip) en `http://127.0.0.1:8094/` (variable `PORT` para cambiarlo). No sirve la API ni `docs/`.
- `npm run preview` / `npm run dev`: arrancan Data Connect, el backend Next y una vista previa en `http://127.0.0.1:8080/` (flujo anterior con API local). `npm run preview:static` sirve la raíz sin allow-list en el puerto 8080 y reenvía `/api/*` a un backend aparte.
- `npm run cf:dev`: arma `public/` con `scripts/prepare-public.mjs` y sirve sitio y API con `wrangler dev`.
- `npm run cf:deploy`: arma `public/` y ejecuta `wrangler deploy`. Secreto opcional: `npx wrangler secret put GEMINI_API_KEY` (sin él Iti IA responde con el ranking local). **No ejecutes un deploy sin que Aldo lo pida.**
- `npm run tokens`: regenera `tokens.css` desde `design/tokens.json`. `npm run tokens:check` falla si el CSS generado está desactualizado.
- `npm run critique` y `npm run critique:static`: revisión de diseño contra los tokens.
- `npm run test:browser`: arnés de Chromium (`tools/qa/run.mjs`: explorer, saved, rail, skeleton, contrast, ficha). El resto del arnés (`motion`, `spacing`, `e2e`, `feed`, `hero`, `inp`, `responsive`, `strip`) se corre a mano contra una vista previa; ver `tools/qa/README.md`.
- Legado: `firebase deploy --only hosting` publica `public/` sin API; `firebase emulators:start --only hosting` lo sirve local.
- Protección de Iti IA (Worker): comprobación de Origin y tamaño de cuerpo desde `src/lib/api-guard.ts` (`ITI_IA_ALLOWED_ORIGINS`, `ITI_IA_MAX_BODY_BYTES`) y bindings de Rate Limiting `IA_PER_IP` (10/min) y `IA_GLOBAL` (120/min), aplicados por ubicación de Cloudflare, no como tope global estricto. Pendiente: validarlos en preview y envolver `limit()` en try/catch. La ruta Next conserva su limitador en memoria.

El sitio no tiene paso de build: los archivos de la raíz se sirven tal cual. Lo único generado es `tokens.css` y la carpeta `public/`.

## Coding Style & Naming Conventions

Usa 2 espacios en HTML, CSS y JavaScript. Copy en español salvo secciones bilingües intencionales. Secciones semánticas con `id` descriptivo (`#inicio`, `#casa`, `#libros`, `#cartelera`, `#novedades`, `#visita`; `#catalogo` es la capa «Explora el catálogo» dentro de `#libros`). Los `id` no siguen a los nombres visibles: `#libros` se llama «Catálogo» y `#cartelera` «Eventos y talleres» («Eventos» en la navegación).

Las variables de color, tipografía, espaciado y movimiento salen de `design/tokens.json`; edita ahí y corre `npm run tokens`. No escribas milisegundos a mano en JS: usa `motion.js`. Reutiliza los tonos (`data-tone="light|mist|deep"`) antes de añadir colores. Estilos críticos de layout, tipografía y estado van en CSS local; no reintroduzcas Tailwind CDN, SDKs de Higgsfield ni dependencias externas en runtime.

Antes de cambiar la UI, lee `DESIGN.md` y `PRODUCT.md`. `design-system/libreria-itinerante-y-mas/MASTER.md` describe el canon anterior (Claude Design/Higgsfield) y es solo referencia histórica.

## Testing Guidelines

El runner nativo de Node ejecuta las comprobaciones en `tests/`. La prueba del sitio es `tests/site.test.mjs`. Antes de un deploy corre `npm test` y verifica a mano:

- Escritorio y móvil se ven bien (con y sin movimiento; pausa en el pie).
- Las anclas llevan a la sección correcta.
- Las imágenes cargan desde rutas locales permitidas por la CSP.
- La consola del navegador no tiene errores.
- Los encabezados y la CSP de Cloudflare (`worker/_headers`) no bloquean recursos necesarios.

Usa Lighthouse o revisiones de accesibilidad del navegador para cambios visuales grandes.

## Commit & Pull Request Guidelines

Usa commits imperativos y claros, como `Update contact section` o `Tighten Cloudflare headers`. Las PR llevan descripción breve, capturas para cambios visuales, notas de prueba y el impacto en la configuración de Cloudflare o Firebase. No hagas commit, push ni deploy sin que se pida.

## Security & Configuration Tips

No expongas credenciales de cuenta de servicio en el hosting público. `firebase.json` ya ignora `*.json` en el deploy legado; mantén credenciales fuera de capturas, issues y código del cliente. Los secretos del Worker se cargan con `wrangler secret put`, nunca en el repositorio.

## UX/UI

Las reglas operativas de UX/UI (con la herramienta que mide cada una) están en la tabla «cómo evitarlo» de `docs/agentes/00-contexto-compartido.md`; el catálogo de fuentes con citas y licencias es `docs/ux/FUENTES.md`. Consúltalos antes de crear o mejorar cualquier interfaz.

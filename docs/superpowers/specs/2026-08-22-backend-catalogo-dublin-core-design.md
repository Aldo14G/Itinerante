# Backend + Catálogo Dublin Core — Design Spec

**Status:** ARCHIVADO — sustituido por `CONTEXT.md` y
`docs/ARCHITECTURE_AND_CONTEXT.md`; no implementar ni restaurar sus superficies
alternas sin una nueva decision explicita de migracion.
**Fecha inicio:** 2026-08-22
**Última sesión:** 2026-08-23 (cerradas las 6 secciones; brainstorm terminal).
**Owner:** Aldo
**Contexto:** Librería Itinerante y Más (Monterrey). Amigo Roberto.

> Documento historico. `catalogo.html` y las variantes de frontend descritas
> abajo no pertenecen a la superficie oficial vigente.

---

## 0. Contexto previo (auditoría cerrada)

- El sitio LIVE es V1 estático: `index.html` monolítico (3666 líneas, 139 KB) servido por Firebase Hosting con `"public": "."`.
- `src/`, `vite.config.js`, `dist/`, `tools/copy-assets.mjs`, `package-lock.json` son experimentos React/Vite **no commiteados, no desplegados, no conectados a `package.json`**. Pendiente decisión aparte: borrarlos como parte de la unificación V1.
- `AGENTS.md` y `CONTEXT.md` declaran canónico: "static HTML, CSS tokens, local CSS, vanilla JavaScript … no build step … Tailwind CDN intentionally not part of the runtime."

**Constraint canónico relevante para Sección 4 (`CONTEXT.md:15`):**
> Real book images in `#galeria` must include the Book Image Overlay.

El overlay lleva "genre, availability, mood, tags, and WhatsApp consultation" (`CONTEXT.md:9`). El diseño del catálogo debe honrar esta regla cuando hidrate `#galeria` desde Supabase.

**Aclaración acordada en Sección 4A.2:** la regla del Book Image Overlay aplica a `#galeria` y a superficies de *showcase* (vitrina destacada, curada, con contexto). NO aplica al grid transaccional de `catalogo.html`, que usa un overlay compacto (chip disponibilidad + título/autor/precio). Actualizar `CONTEXT.md:15` como parte del spec final para dejar esta distinción explícita.

---

## 1. Decisiones cerradas (locked)

| # | Dimensión | Decisión |
|---|---|---|
| 1 | Base del sitio | V1 estático (Firebase Hosting sirve raíz) |
| 2 | Alcance transaccional | Vitrina + CTA WhatsApp. Schema future-proof para "aparta sin pago" (fase 2) y checkout (fase 3) |
| 3 | Admin del catálogo | Solo Roberto + Aldo, login único. Sin portal multi-tenant para editoriales (fase 3 si aplica) |
| 4 | Reviews / social | Solo notas curatoriales de Roberto. Sin cuentas públicas, sin reviews de usuario. Schema `book.curator_note` alcanza; fase 2 puede añadir tabla `review` sin migrar. |
| 5 | Discovery | Estanterías curatoriales + búsqueda potente (título/autor/descripción, facetas por editorial/género/disponibilidad/rango de precio) |
| 6 | Stack backend | **Supabase (Postgres 15+)**. Descartado Firestore por: FTS pobre, mal fit con Dublin Core relacional, migración dolorosa después. |
| 7 | Metadata governance | **Dublin Core (DCMES + DCMI Terms).** Columnas `dc_*` / `dcterms_*` = metadata bibliográfica. Todo lo demás = operativo. |
| 8 | Integración frontend | Approach 1 — Full-client JS render, cero build step. Vanilla ES modules + `@supabase/supabase-js` desde CDN. Nuevas páginas: `catalogo.html`, `libro.html?slug=...`, `admin.html`. |
| 9 | SEO | No prioridad MVP (tráfico viene de Instagram/prensa/mapa). Reconsiderar en fase 2 si se necesita — migración a SSG (Approach 2) es delta manejable, no cambia schema ni render JS. |

---

## 2. Diseño — secciones presentadas

### Sección 1/6 — Data model gobernado por Dublin Core ✅ APROBADA

**Principio de gobernanza:** prefijos `dc_*` / `dcterms_*` mapean 1:1 a Dublin Core; operativo va en columnas o tablas explícitamente NO-DC.

**Subset DC aplicado:** `title`, `creator`, `contributor`, `publisher`, `subject`, `description`, `abstract`, `identifier`, `language`, `date`/`issued`, `type`, `format`, `medium`, `extent`, `rights`.

**Tablas Postgres:**

| Tabla | Propósito | Relación DC |
|---|---|---|
| `editorial` | Editoriales afiliadas | `dc:publisher` |
| `person` | Autores, traductores, ilustradores, editores | Fuente de `dc:creator` / `dc:contributor` |
| `book` | Recurso bibliográfico | Columnas `dc_title`, `dc_description`, `dcterms_abstract`, `dc_language`, `dc_type`, `dcterms_issued`, `dcterms_extent`, `dc_format`, `dcterms_medium`, `dc_rights` |
| `book_identifier` | ISBN-13/ISBN-10/LCCN | `dc:identifier` con `scheme` explícito |
| `book_creator` | M-N con `role` (author/translator/illustrator/editor/foreword) y `order` | Unifica `dc:creator` + `dc:contributor` con rol tipado |
| `subject` | Vocabulario controlado (soporta BISAC codes) | `dc:subject` |
| `book_subject` | M-N | — |
| `shelf` | Estanterías curatoriales | **NO-DC** (operativo) |
| `book_shelf` | M-N con `order` | — |
| `stock` | Cantidad, precio MXN, condición, ubicación física | **NO-DC** (operativo) |
| `whatsapp_click` | Analytics de CTAs | **NO-DC** |
| Supabase Auth `auth.users` + `profile` | Roberto y Aldo con `role = 'admin'` | — |

**Decisiones clave:**
- `book.dc_type` fijado a `"Text"` (DCMI-Type Vocabulary para libros).
- `book.dc_language` usa ISO 639-1 (`"es"`, `"en"`).
- `book.search_vector` (generated `tsvector`) sobre `dc_title + dc_description + creators + subjects`, con `pg_trgm` para tolerancia a typos.
- Precio y stock **separados** del bloque DC porque cambian con frecuencia distinta al metadata bibliográfico.
- `book.curator_note` = una nota por libro; fase 2 puede añadir tabla `review` sin migrar.

### Sección 2/6 — Arquitectura de sistemas ✅ APROBADA

**Qué corre dónde:**

```
Firebase Hosting (root — sirve estáticos)
  /index.html         home V1 + #galeria hidratada por JS
  /catalogo.html      menú digital (search, filtros)
  /libro.html?slug=…  ficha larga estilo Substack
  /admin.html         panel Roberto (Supabase Auth)
  /assets/js/*.js     módulos vanilla ES por sección
  /assets/css/*.css   estilos por sección
  /Logo.*, /images/** assets propios
        │
        │ HTTPS — @supabase/supabase-js vía CDN ESM
        ▼
Supabase (un proyecto)
  Postgres 15+       tablas DC + operativas + RLS
  PostgREST API      REST auto-generado
  Storage bucket     "book-covers/" (público read; admin write)
  Auth               email+password para admins; anon para público
  Edge Functions     opcional fase 2 (sitemap, webhooks)
```

**Piezas concretas:**
1. Frontend runtime: vanilla JS ES modules. Único dep externo desde CDN (`https://esm.sh/@supabase/supabase-js@2`).
2. Cliente Supabase con dos identidades: `anon` key (embebida, RLS `select`) + JWT admin (tras login, RLS `insert/update/delete` gated por `profile.role='admin'`).
3. Firebase Hosting sigue como ingreso. Actualizar CSP con subdominio exacto `<project-ref>.supabase.co` (detalle final en 5.2 c2 — decidido subdominio exacto, no wildcard).
4. Migraciones SQL versionadas en `supabase/migrations/*.sql`, aplicadas con `supabase db push`.

**Fuera de scope MVP (YAGNI):** framework frontend, bundler, CDN propio de imágenes, Algolia/Typesense, Redis, gateway de pagos, migración de hosting.

### Sección 3/6 — Admin panel ✅ APROBADA

**Página única `/admin.html`** — vanilla JS + Supabase JS SDK, sin framework. Sin sesión → formulario login. Con sesión → dashboard con tabs.

**Login:** Supabase Auth email+password. Cuentas creadas manualmente en Supabase dashboard o vía `supabase/seed/admins.sql`. Trigger sobre `auth.users` inserta perfil solo si email está en allowlist. Sesión en `localStorage`.

**Tabs:** Libros, Editoriales, Personas, Estanterías, Temas, Analytics.

**Editor de libro** — formulario dividido en fieldsets tipados por origen DC. Tooltips muestran el nombre canónico (`dc:title`, `dcterms:issued`) para pedagogía. Fieldsets:
- Metadata Dublin Core (todos los `dc_*` / `dcterms_*`)
- Autoría (sub-form `book_creator` con role + order, autocomplete `person` + crear inline)
- Identificadores (múltiples ISBN/LCCN con `scheme`, checksum ISBN-13 en cliente)
- Clasificación (multi-select `subject` con autocomplete + crear inline)
- Estanterías (checkboxes)
- Nota curatorial (textarea markdown básico para `curator_note`)
- Portada (drag-drop, redimensiona en cliente → WebP ≤1200px, sube a Storage)
- **Operativo (NO Dublin Core)** — separado visualmente. Precio, stock, condición, ubicación.

**Import CSV:** placeholder documentado, se implementa cuando llegue el primer volumen real (YAGNI hasta entonces).

**Validaciones:** cliente + servidor (constraints Postgres: `NOT NULL`, `CHECK (dc_language ~ '^[a-z]{2}$')`, unique `book.slug`, `stock.price_mxn >= 0`).

**Audit mínimo:** `created_at`, `updated_at`, `updated_by` por tabla via trigger. Sin `audit_log` completa (YAGNI).

### Sección 4A/6 — `catalogo.html` (menú digital) ✅ APROBADA

**4A.1 — Esqueleto** *(Opción B: "Estanterías primero")*
- Search bar sticky arriba, ancho completo, siempre disponible.
- Debajo, **carruseles horizontales de estanterías curatoriales** (título del shelf + curator_note corto por shelf). Es la vista por defecto.
- Separador editorial: `─── o explora el catálogo completo ───`.
- Debajo, **facetas horizontales + grid completo** (comportamiento pasivo hasta que el usuario interactúe).
- **Comportamiento reactivo al search:** cuando el input tiene contenido (>0 chars tras debounce), las estanterías colapsan a una tira delgada y las facetas materializan como sidebar/bottom-sheet activo (ver 4A.4). El grid muestra resultados filtrados.

**4A.2 — Book card + Book Image Overlay** *(Opción B: overlay compacto en catálogo, completo solo en home)*
- La regla `CONTEXT.md:15` del Book Image Overlay aplica a `#galeria` y superficies de showcase. NO aplica al grid transaccional del catálogo.
- Card del catálogo:
  ```
  ┌─────────────────────┐
  │    [ portada 2:3 ]  │
  │         ● disp.     │  ← chip esquina sup-der: verde disponible / gris agotado
  ├─────────────────────┤
  │ Título (1–2 líneas) │
  │ Autor · Editorial   │
  │ $180 MXN            │
  └─────────────────────┘
  ```
- Hover desktop: elevate + border accent. Tap mobile: navega a `libro.html?slug=…`.
- Sin CTA WhatsApp en la card; vive en la ficha.
- **Acción para spec final:** actualizar `CONTEXT.md:15` para clarificar showcase-vs-transactional.

**4A.3 — Search behavior + URL state** *(Opción A: instant search + URL sincronizada)*
- Debounce ~250ms sobre `input`.
- Cada refetch actualiza URL con `history.replaceState` — patrón: `/catalogo.html?q=bolaño&editorial=sextopiso&disp=disponible&offset=48`.
- URLs shareable (Roberto puede mandar links con filtros pre-aplicados por WhatsApp/DM).
- Back/forward del browser restaura estado desde URL en el load.
- **Campos y pesos del search (Postgres FTS en `book.search_vector`):**
  - `dc_title` — peso A
  - `dc_creator` / `dc_contributor` (via `person.full_name`) — peso A
  - `dc_description` + `dcterms_abstract` — peso B
  - `subject.name` — peso B
  - `editorial.name` — peso C
- `pg_trgm` como fallback para typos.

**4A.4 — Facetas: set MVP e interacción** *(Interacción Opción A: sidebar/bottom-sheet + refetch inmediato)*
- **Set MVP** (multi-select, AND entre facetas, OR dentro):
  | Faceta | Fuente | UI |
  |---|---|---|
  | Disponibilidad | `stock.available` | Chips exclusivos: Todo · Disponible · Agotado |
  | Editorial | `editorial.name` | Checkbox list con count por editorial |
  | Género/Tema | `subject.name` (BISAC) | Checkbox list con count, colapsable después de 8 |
  | Idioma | `book.dc_language` | Chips: ES · EN · `+` |
  | Rango de precio | `stock.price_mxn` | **P1** — Slider dual min/max real del dataset, con marcas |
- **Fuera de MVP (fase 2):** faceta de Autor (autocomplete), faceta de Año de publicación.
- **UI:**
  - Desktop: sidebar izquierdo colapsable.
  - Mobile: bottom sheet que se invoca con botón "Filtrar (N)".
  - Cada click refetch inmediato.
  - Header del grid muestra count actualizado ("142 libros").
  - Chips de facetas activas arriba del grid con `×` para quitar rápido, más botón "Limpiar filtros".

**4A.5 — Paginación / carga del grid** *(Opción A: infinite scroll + URL offset)*
- `IntersectionObserver` al final del grid dispara siguiente batch.
- Batch inicial: 24 libros. Cada batch: 24 más.
- Skeleton loader al final mientras carga.
- **Mitigación de flacos del infinite scroll:**
  - URL sincronizada con `?offset=48` cada nuevo batch (`replaceState`); permite restore de posición al volver desde `libro.html` re-hidratando hasta ese offset.
  - Botón flotante "Volver arriba" aparece después del scroll #2 para no atrapar al usuario.

### Sección 4B/6 — `libro.html?slug=…` (ficha larga) ✅ APROBADA

**4B.1 — Layout de la ficha** *(Opción A: "Substack largo" — una columna, hero centrado)* ✅
- URL: `/libro.html?slug=2666-roberto-bolano` — slug humano fetched por `slug` a Supabase.
- Estructura vertical:
  ```
  Breadcrumb: Catálogo › Libro
  Portada centrada (max-w 320px)
  Título (h1 grande) · Autor · Editorial · Año
  CTA WhatsApp + precio + disponibilidad
  ─────────────────────────────
  Nota curatorial (blockquote serif, spacing generoso)
  ─────────────────────────────
  Sinopsis (dc_description, ancho ~65ch)
  ─────────────────────────────
  Ficha bibliográfica (dl con DC: título, autor(es), traductor,
    editorial, año, idioma, ISBN, páginas, formato)
  ─────────────────────────────
  Estanterías donde vive · Tags/temas
  ─────────────────────────────
  "También te podría interesar" — carrusel horizontal 6–8 relacionados
  ```
- Sticky CTA WhatsApp en mobile.
- **Contrato de futuro-proofing (para permitir migración a layout B "Goodreads dividido" en dos columnas sin refactor de markup):**
  - Bloques de la ficha (portada, encabezado, CTA, curator_note, sinopsis, ficha DC, tags/estanterías, relacionados) implementados como componentes DOM independientes.
  - Layout gobernado por CSS grid template en un único contenedor padre.
  - Cambio a dos columnas = cambio de `grid-template-areas`, no de estructura.

**4B.2 — CTA WhatsApp: payload, deep-link y tracking** *(a2 + b3 + c2)* ✅

- **a) Destino — a2:** WhatsApp Business con perfil de la librería.
  - Técnicamente `wa.me/<numero>?text=<encoded>` — idéntico a un número personal; la diferencia es operativa (separa negocio/personal, habilita catálogo WA, respuestas rápidas, horarios).
  - **Fallback operativo mientras Roberto no cree la cuenta Business:** número personal (a1) como constante en JS (`const WHATSAPP_NUMBER = '52818XXXXXXX'`). Flippeo posterior = cambiar la constante, sin refactor.
- **b) Plantilla — b3:** estructurada con `Ref: LIB-<id>` embebido para trazabilidad.
  ```
  Hola, consulta desde el sitio:
  • Libro: {dc_title} — {creator}
  • Editorial: {editorial} · ${price_mxn} MXN
  • Ref: LIB-{book.id_short}

  ¿Está disponible?
  ```
  - `id_short` = slug corto o hash estable del libro; correlaciona conversación WA con `book` concreto en `whatsapp_click` incluso sin analytics activo.
  - Encoding: `encodeURIComponent` sobre el mensaje completo antes de concatenar al `?text=`.
- **c) Tracking — c2:** `navigator.sendBeacon` con fallback `fetch(..., { keepalive: true })`.
  - Patrón: onclick del CTA dispara `sendBeacon(<endpoint>, payload)` **antes** de que el navegador siga el `href`; el beacon garantiza envío incluso si el usuario abandona la pestaña.
  - Payload: `{ book_id, price_shown, occurred_at, session_ref }`. Sin PII.
  - Si `navigator.sendBeacon` no existe (viejos WebViews), fallback a `fetch(..., { keepalive: true, method: 'POST' })`.
  - Endpoint: PostgREST insert directo sobre la tabla `whatsapp_click` (URL Supabase con `Prefer: return=minimal`), gated por RLS de 5.1 c1 (`insert using (true)` para `anon` + `select using (auth.jwt() ->> 'role' = 'admin')`). Migración a RPC dedicada (`log_whatsapp_click_rl` con rate limit servidor) documentada en 5.1 futuro-proofing.

**Contrato de futuro-proofing 4B.2:**
- Función pura `buildWhatsappHref(book) → string` — aisla concatenación del deep-link, testeable.
- Función `trackWhatsappClick(book) → void` — encapsula `sendBeacon` + fallback.
- Cambiar de a1 → a2 = cambio de constante.
- Cambiar plantilla b3 → otra = cambio en `buildWhatsappHref`, sin tocar el CTA.

**4B.3 — Jerarquía DC visible en la ficha** *(a3 + b2 + c locked)* ✅

- **a3 — Header adaptativo:** solo aparecen campos con valor no-default. Reglas de visibilidad:
  - Título, autor principal, editorial, año → siempre.
  - `dc_language` → solo si ≠ `'es'`.
  - Traductor → solo si existe al menos un `book_creator` con `role='translator'`.
  - Páginas / formato / medium → nunca en header (ver c).
  - Encapsulado en helper `shouldShowInHeader(field, value, book) → boolean`.
- **b2 — Autor principal en header + resto de contribuidores en `<dl>` con rol como `<dt>`:**
  ```
  Header: Roberto Bolaño

  <dl>:
    Autor: Roberto Bolaño         ← también aquí (redundancia intencional para completitud de ficha)
    Traducción: Chris Andrews
    Ilustración: Juan García
    Prólogo: Ignacio Echevarría
  ```
  - Pluralización automática: `count > 1 ⇒ Traductores/Ilustradores/...`.
  - Mapa de roles → labels: `{ author: 'Autor', translator: 'Traducción', illustrator: 'Ilustración', foreword: 'Prólogo', editor: 'Edición' }`.
- **c — Campos SIEMPRE en `<dl>` (locked):**
  - `book_identifier.*` (ISBN-10, ISBN-13, LCCN con `scheme` como sufijo `(ISBN-13)`).
  - `dc_format`, `dcterms_medium`, `dc_rights`, `dcterms_extent` (páginas).
  - Nunca duplicados en header.

**Contrato de futuro-proofing 4B.3:**
- `shouldShowInHeader(field, value, book)` — helper puro, tabla de reglas. Cambiar la regla no toca la plantilla.
- `renderBibliographicDL(book)` — función pura que recibe `book` con creators/identifiers hidratados, devuelve el `<dl>`. Agregar campo DC nuevo = editar una función pura.
- Mapa `ROLE_LABELS` extensible sin tocar plantilla.

**4B.4 — Estrategia de "relacionados"** *(a4 + b1 + c1)* ✅

- **a4 — Score combinado ponderado:**
  `score = 3·count(subjects_compartidos) + 2·count(shelves_compartidos) + 1·(misma_editorial ? 1 : 0)`
  - Excluye el libro actual.
  - `ORDER BY score DESC, updated_at DESC` (tie-break).
  - `LIMIT 8`.
- **b1 — Fallback con novedades:**
  Si `related.length < 6`, rellena con `SELECT * FROM book WHERE id NOT IN (related_ids ∪ current) ORDER BY created_at DESC LIMIT 6 - N`.
  - Cliente renderiza cada resultado con `source: 'related' | 'fallback'` para diferenciar visualmente si se quiere.
- **c1 — Cómputo en cada request:**
  - RPC `get_related_books(book_id uuid, limit_n int)` en Supabase encapsula el score.
  - `EXPLAIN ANALYZE` esperado < 20ms sobre índices normales para catálogo < 500 libros.
  - Migración a view materializada (c2) = cambiar implementación del RPC, sin tocar cliente.

**Contrato de futuro-proofing 4B.4:**
- RPC `get_related_books` encapsula el score — cambio de estrategia (agregar señal, rebalanceo de pesos) = editar SQL del RPC.
- Cliente recibe `[{ book_id, score, source }]` — permite diferenciación visual entre "relacionados por afinidad" y "novedades" cuando se quiera activar.

**4B.5 — Fallbacks (slug 404 + breadcrumb sin origen)** *(a3 + b2)* ✅

- **a3 — Página híbrida en `slug` inexistente:**
  - `renderLibroPage(book | null)` — el mismo renderer maneja ambos estados. Si `book === null`:
    - Header cambia a `<h1>No encontramos este libro</h1>` + subtítulo `"Este link puede estar desactualizado. Aquí hay algunas opciones."`
    - Se skippean bloques sin data (curator_note, sinopsis, ficha DC, tags/estanterías).
    - Bloque "relacionados" se rehidrata con:
      1. Resultados del search del slug (`slug → q = slug.split('-').join(' ')`) — top 4 si existen.
      2. Fallback (4B.4 b1): novedades hasta completar 8.
    - URL se mantiene (`/libro.html?slug=<original>`) — el usuario puede compartir el link si quiere avisar del enlace muerto.
- **b2 — Breadcrumb contextual con `sessionStorage.catalogRefUrl`:**
  - En `catalogo.html`, el handler del click sobre una card ejecuta:
    ```js
    sessionStorage.setItem('catalogRefUrl', location.href);
    ```
    antes de navegar. `location.href` ya lleva las facetas + offset por 4A.3/4A.5.
  - En `libro.html`, helper `getBreadcrumbTarget()`:
    ```
    const ref = sessionStorage.getItem('catalogRefUrl');
    if (ref) return { label: '← Volver a resultados', href: ref };
    return { label: '← Explorar catálogo', href: '/catalogo.html' };
    ```
  - No dependemos de `document.referrer` — Instagram y WhatsApp lo destruyen.

**Contrato de futuro-proofing 4B.5:**
- `renderLibroPage(book | null)` — el `null` branch es 4 líneas de guard clauses, no una plantilla paralela.
- `getBreadcrumbTarget()` — helper puro, cambiar estrategia de crumb (agregar 3er case, cambiar labels) = editar función.
- Escritura de `sessionStorage.catalogRefUrl` en `catalogo.html`, lectura en `libro.html` — separación limpia.

**Sección 4B completa.** ✅

### Sección 4C/6 — Home `#galeria` hidratada ✅ APROBADA

**4C.1 — Fuente de contenido, comportamiento de chips/search y fallback** *(a3 + b3 + c1)* ✅

Contexto: `#galeria` ya existe en `index.html:2509` con header, discovery console (search `#bookSearch` + 7 chips: Poesía · Narrativa · Ensayo · Historia · Arte · Infantil), `#bookGrid` con `.book-image-overlay` (obligatorio por `CONTEXT.md:15` en showcase), empty state y CTA Instagram. Hoy se hidrata desde array JS estático `BOOKS`.

- **a3 — Destacados + fallback a novedades:**
  - Roberto marca en admin qué shelf es la vitrina (`shelf.slug = 'home_featured'`).
  - Query: `select * from book where id in (select book_id from book_shelf where shelf_id = <home_featured_id>) order by book_shelf.order limit 12`.
  - Si `count < 12`, rellena con `select * from book order by created_at desc limit (12 - N)` excluyendo duplicados.
  - MVP: mezcla natural sin separador visual. Futura separación (header divisorio, `data-source` en card) = cambio local.
- **b3 — Chips filtran local, search redirige:**
  - Los 7 chips existentes (categorías canónicas del showcase) filtran los 12 libros cargados in-place; interacción instantánea, cero refetch.
  - Si un chip da `count === 0` local, cae progresivamente a `location.assign('/catalogo.html?subject=<slug>')` con feedback ("No hay en la vitrina — llevándote al catálogo completo").
  - El input `#bookSearch` NO filtra local — al `Enter` o al debounce redirige a `/catalogo.html?q=<text>` (respeta separación showcase/transactional de 4A).
- **c1 — Fallback silencioso a novedades:**
  - Si la query del shelf falla o retorna 0, swap invisible a `ORDER BY created_at DESC LIMIT 12`. Log a `console.warn` para diagnóstico.
  - Empty state visible (`c2`) o hide-and-collapse (`c3`) se reservan para el caso patológico "Supabase caído completo" — no para esta sección.

**Contrato de futuro-proofing 4C.1:**
- `loadGaleriaBooks() → Promise<Book[]>` encapsula fetch shelf + fallback novedades. Cambiar a mezcla explícita o rotación (a4) = editar función, no plantilla.
- `hydrateBookCard(book, { showOverlay: true })` con flag explícito para Book Image Overlay completo (`true` en `#galeria`, `false` en `catalogo.html` que usa overlay compacto). Un solo renderer, dos comportamientos.
- Handlers `handleGaleriaFilter(chip)` y `handleGaleriaSearch(text)` separados — cambiar cualquier estrategia b1/b2/b3 = editar handler.

**Migración:** al hidratar `#galeria` desde Supabase, el markup hardcoded del grid + array `BOOKS` se preservan tras el flag `BACKEND_FLAGS.galeria` (definido en 6.2 b1); se eliminan en commit post-verificación (paso 10 del orden de commits en 6.2). El flag es kill-switch de rollback, no capa persistente.

**4C.2 — Book Image Overlay + click behavior** *(a2 + b3 + c1)* ✅

- **a2 — Mapeo DC → slots del overlay usando `curator_note` como mood:**
  ```
  .book-genre       ← primer subject.name (fallback dc_type si no hay subjects)
  .book-availability← stock.available ? "Disponible" : "Agotado" (+ condición si aplica)
  .book-mood        ← curator_note truncado con CSS -webkit-line-clamp: 2
  .book-tags        ← subject.name[1..3] (después del primero que va al genre)
  .book-card-cta    ← buildWhatsappHref(book) [4B.2]
  ```
  - Un solo campo curatorial (`curator_note`) sirve overlay + ficha. Roberto no llena dos veces.
  - Si más adelante quiere versión específica para overlay, se agrega columna `curator_hook` sin migrar nada.
- **b3 — Lightbox como preview + CTA "Ver ficha completa":**
  - Click en card ejecuta `openLightbox(book.id)` — misma UX de hoy.
  - Lightbox se rehace internamente para consumir `renderLibroPage(book, { mode: 'compact' })`.
    - Modo `compact` skippea: relacionados (4B.4), ficha DC completa (4B.3 `<dl>` técnica), breadcrumb (4B.5).
    - Modo `compact` mantiene: portada, header adaptativo (4B.3 a3), curator_note completo, sinopsis truncada (~2 párrafos), CTA WhatsApp, botón "Ver ficha completa" → `libro.html?slug=<slug>`.
  - Modo `full` es `libro.html`. Un renderer, dos modos.
- **c1 — CTA WhatsApp en overlay como hoy:**
  - Bottom del overlay, `event.stopPropagation()` para no disparar el lightbox al hacer click.
  - `CONTEXT.md:9` lo tiene explícito en el contrato del overlay showcase.

**Contrato de futuro-proofing 4C.2:**
- `renderLibroPage(book, { mode: 'full' | 'compact' })` — modo `compact` es el lightbox in-page, modo `full` es `libro.html`. Divergencia entre lightbox y ficha = imposible por construcción.
- `hydrateBookCard(book, { showOverlay: true, overlaySource: 'curator_note' | 'curator_hook' })` — flag `overlaySource` deja abierta la migración futura al campo dedicado `curator_hook` (mencionado en 4C.2 a2) si Roberto lo pide.
- Truncado del `curator_note` en overlay: CSS `-webkit-line-clamp: 2` + `overflow: hidden` — sin lógica JS.

**Sección 4C completa.** ✅ **Sección 4/6 completa** (4A + 4B + 4C). ✅

### Sección 5/6 — Auth, seguridad y RLS policies ✅ APROBADA

**5.1 — RLS policies del schema** *(a2 + b1 + c1)* ✅

Supabase expone Postgres vía PostgREST. La `anon key` va embebida en el JS del cliente — la seguridad real vive en las policies. RLS habilitado en TODAS las tablas de la migración inicial (`alter table X enable row level security`); sin esto, PostgREST expone todo.

- **a2 — Lectura pública restringida:**
  - `select using (true)` para `anon` en: `book`, `editorial`, `person`, `subject`, `stock`.
  - Tablas de join (`book_creator`, `book_subject`, `book_shelf`, `book_identifier`) también con `select using (true)` para `anon` — necesarias para foreign key resolution en `select book, book_creator(*), person(*)` desde el cliente. La restricción real es que no exponen datos privados; son solo M-N sobre tablas ya públicas.
  - `shelf` con `select using (true)` (Roberto los quiere visibles como discovery).
  - Denegadas para `anon`: `whatsapp_click` (write-only vía c1), `profile`, `auth.users`.
- **b1 — Admin gate por JWT claim `role`:**
  - `profile(user_id, email, role)` — `role` es enum `'admin' | 'editorial' | 'reader'`.
  - Trigger `on_auth_user_created` (sobre `auth.users`) inserta perfil si email está en `admin_allowlist` (tabla o constante SQL) con `role='admin'`; caso contrario, sin insert (usuario no autenticable como admin).
  - `access_token_claims` copia `profile.role` al JWT como claim `role`.
  - Policies de escritura: `using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin')` en `book`, `editorial`, `person`, `subject`, `shelf`, `stock`, todas las join tables.
  - Fase 2 puede añadir `role='editorial'` con `role in ('admin', 'editorial')` sin cambiar patrón.
- **c1 — `whatsapp_click` write-only para anon:**
  - `insert using (true) with check (…)` para `anon` (el `with check` valida shape del payload: `book_id`, `occurred_at`, sin campos raros).
  - `select using (auth.jwt() ->> 'role' = 'admin')` — solo admin ve los logs.
  - Rate limiting: Supabase edge built-in (per-IP). Tabla propia (c2) queda como YAGNI hasta ver abuso real.

**Contrato de futuro-proofing 5.1:**
- Cada tabla tiene bloque `-- rls` explícito en `supabase/migrations/0001_schema.sql`. Cambiar postura = migración incremental.
- `admin_allowlist` como tabla en vez de constante SQL — agregar admin = insert row, sin migración.
- JWT claim `role` extensible; nuevas roles = editar policies con `role in (…)` sin cambiar cliente.

**Test de seguridad obligatorio:** `tests/rls.test.mjs` valida:
1. Cliente `anon` NO puede insertar en `book`.
2. Cliente `anon` NO puede leer `whatsapp_click`.
3. Cliente `anon` NO puede leer `profile` ni `auth.users`.
4. Cliente logueado como admin (Roberto) SÍ puede escribir en `book`.
5. Cliente `anon` SÍ puede insertar en `whatsapp_click` con payload válido, NO con payload malformado.

**5.2 — Storage bucket (`book-covers/`) + CSP + placeholders** *(a1 + b1 + c2)* ✅

- **a1 — Storage bucket público:**
  - Bucket `book-covers/` con `public = true`. URL predecible: `https://<project-ref>.supabase.co/storage/v1/object/public/book-covers/<book_id>.webp`.
  - RLS del bucket: `select using (true)` para todos; `insert/update/delete using (auth.jwt() ->> 'role' = 'admin')`.
  - Admin sube desde `admin.html` vía `supabase.storage.from('book-covers').upload(...)`. Cliente público lee URL directa (cero llamadas a Storage API en render).
  - Formato canónico: WebP redimensionado a ≤1200px en cliente antes del upload (helper del admin ya definido en Sección 3).
- **b1 — SVG placeholder local con iniciales:**
  - Reusa patrón `.book-placeholder` de `index.html:1726` (ya existente para el catálogo hardcoded).
  - `renderPlaceholder(book)` devuelve `HTMLElement` con iniciales del título sobre fondo brand — reusable en `#galeria`, `catalogo.html` y `libro.html` (modo compact del lightbox también).
  - Sin bloqueo de publicación: contador en admin ("N libros sin portada") como recordatorio social.
- **c2 — CSP con subdominio exacto:**
  ```
  connect-src https://firestore.googleapis.com https://<project-ref>.supabase.co;
  img-src    'self' data: blob: https://<project-ref>.supabase.co;
  ```
  - Firestore se mantiene por el boletín (`5f12f36`).
  - `<project-ref>` documentado en `CONTEXT.md` como parte del setup del proyecto.

**Contrato de futuro-proofing 5.2:**
- `getCoverUrl(book) → string` — encapsula resolución. Maneja tres casos: (1) `storage_key` → URL de Supabase; (2) `local_asset_path` → legacy `/images/**`; (3) ninguno → devuelve `null` (renderer decide placeholder). Migrar de Supabase a CDN propio = editar función.
- `renderPlaceholder(book)` como componente único — cambiar estética o agregar CTA (b2) = editar función.
- CSP en un solo `<meta>`; cuando aparezcan preview branches (Sección 6), promover a c3 con env-based build.

**Migración de imágenes actuales:** las de `/images/**` no se migran ahora. `getCoverUrl` sirve legacy vs Supabase transparente. Backfill (subir portadas actuales al bucket, poblar `storage_key`, borrar `local_asset_path`) = tarea explícita de Sección 6.

**5.3 — Sesión admin + rotación de anon key + rate limiting** *(a1 + b2 + c3)* ✅

- **a1 — `localStorage` con `persistSession: true`:**
  - `createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage } })`.
  - Roberto no re-loguea mientras no cierre sesión explícitamente; auto-refresh transparente del `access_token`.
  - Vector XSS mitigado por CSP hardening incluido en este mismo commit (ver más abajo).
- **b2 — Constante en JS + runbook en `CONTEXT.md`:**
  - `const SUPABASE_ANON_KEY = 'eyJ…';` en `assets/js/supabase-client.js`; git history documenta rotaciones.
  - Runbook en `CONTEXT.md` sección "Operations / Rotate Supabase anon key":
    1. Supabase dashboard → Project Settings → API → Reset anon key.
    2. Copiar nueva key.
    3. Editar `assets/js/supabase-client.js` con la nueva key.
    4. Commit con mensaje `chore(security): rotate Supabase anon key`.
    5. Deploy Firebase Hosting (`firebase deploy --only hosting`).
    6. Verificar `/catalogo.html` carga libros; `/admin.html` login funciona.
- **c3 — Throttling client-side + built-in Supabase:**
  - Search catálogo: debounce 250ms ya definido en 4A.3.
  - WhatsApp CTA: `throttleWhatsappClick(book)` — helper que gate el `sendBeacon` de 4B.2 c2 a max 1 request por `book.id` por 60s (usa `Map<book_id, timestamp>` en memoria).
  - Login attempts: Supabase edge built-in cubre el caso.

**Hardening que va con este commit:**
- CSP: eliminar `'unsafe-inline'` de `script-src`; migrar handlers `onclick=` inline a `addEventListener` (refactor incremental — impacto mínimo si algunos handlers inline persisten temporalmente, pero cerrar el vector es prioridad).
- CSP: agregar `frame-ancestors 'none'` (anti-clickjacking, especialmente para `admin.html`).
- Admin: logout button visible en el header; `supabase.auth.signOut()` limpia `localStorage` y redirige a login.

**Contrato de futuro-proofing 5.3:**
- Cambiar a `sessionStorage` = editar una línea del `createClient`.
- Migración a HttpOnly cookies requiere backend proxy (fase 2+); arquitectura lista para el swap.
- Rate limit servidor (c2) = agregar RPC `log_whatsapp_click_rl` + adaptar `throttleWhatsappClick` para awaitear el RPC en vez de gate local.
- Rotación de anon key documentada = onboarding de un tercer dev es un `git blame` al runbook.

**Sección 5 completa.** ✅

### Sección 6/6 — Testing, deploy, migración desde el estado actual ✅ APROBADA

**6.1 — Testing: Harness expansion + RLS suite + seed inicial** *(a2 + b1 + c1)* ✅

- **a2 — Un file por página + helpers compartidos:**
  - `tests/site.test.mjs` — sigue cubriendo `index.html`.
  - `tests/catalogo.test.mjs`, `tests/libro.test.mjs`, `tests/admin.test.mjs` — cada uno para su superficie.
  - `tests/helpers.mjs` — helpers reusables: `normalize(text)`, `readHtml(name)`, `cssRuleBlock(selector, html)`, `assertMotionBudget(selector, maxMs, html)`, `localAssetValues(html)`.
- **b1 — `tests/rls.test.mjs` contra Supabase local:**
  - Requiere `supabase start` (Docker + supabase-cli).
  - Cubre 8 asserts en total:
    - Los 5 de 5.1: `anon` no puede insertar en `book`, no puede leer `whatsapp_click`, no puede leer `profile`/`auth.users`; admin sí escribe en `book`; `anon` sí inserta en `whatsapp_click` con payload válido pero no con malformado.
    - 3 de 5.2: `anon` no puede escribir en `book-covers/`; admin sí; público sí puede leer objetos del bucket.
  - Test suite hace `test.skip` con warning si Supabase local no está corriendo — no rompe dev que olvida levantarlo.
- **c1 — SQL seed `supabase/seed/001_bootstrap.sql`:**
  - Insert de admins en `admin_allowlist` (Roberto + Aldo).
  - ~10 libros representativos con editoriales/personas/subjects/identifiers/stock/curator_note.
  - Un shelf `home_featured` con los primeros 6 libros (`book_shelf` con `order`).
  - Un shelf secundario "Recomendados" con 4 libros solapando con `home_featured`.
  - Portadas placeholder (`storage_key` NULL → placeholder de b1 de 5.2).
  - Aplicado por `supabase db reset`; reproducible.

**Contrato de futuro-proofing 6.1:**
- `tests/helpers.mjs` es el único lugar de utilidades del harness — cada suite importa desde ahí.
- Fase 2 puede agregar `002_realdata.sql` cuando Roberto tenga inventario real, sin tocar 001.
- Cuando aparezca CSV import (Roberto pide bulk load), se crea `tools/import-csv.mjs` como herramienta separada — NO se contamina el seed.
- Si más adelante se agrega CI real (GitHub Actions), reusa el mismo `supabase start` en un step.

**Requisito operativo:** `README.md` documenta:
1. `brew install supabase/tap/supabase` (o binarios equivalentes por plataforma).
2. `supabase start` — bootstrap local (Docker debe estar corriendo).
3. `supabase db reset` — aplica migraciones + seed.
4. `npm test` corre todo el harness.

**6.2 — Rollout + limpieza de V2 experimental** *(a1 + b1 + c3)* ✅

- **a1 — Limpieza primero (commit único), backend después:**
  - Tanda 1: `chore(cleanup): borrar experimento V2 (src/, dist/, vite.config.js, tools/copy-assets.mjs, package-lock.json, tests/setup.js)`. Deploy sin cambio funcional.
  - Tanda 2: commits del backend Supabase (secuencia abajo).
  - Aisla dos cambios conceptualmente distintos; `git blame` limpio.
- **b1 — `BACKEND_FLAGS` por página en `assets/js/config.js`:**
  ```js
  export const BACKEND_FLAGS = {
    galeria:  'supabase',  // 'supabase' | 'static'
    catalogo: 'supabase',
    libro:    'supabase',
    admin:    'supabase',
  };
  ```
  - Rollback granular en 30s: edit constante + `firebase deploy --only hosting`.
  - `catalogo.html`, `libro.html`, `admin.html` no tienen fallback `'static'` real (son páginas nuevas) — el flag `'static'` para esas páginas significa "renderizar mensaje de mantenimiento con CTA WhatsApp" (fallback c3 aplicado).
  - Array `BOOKS` legacy + markup hardcoded del `#galeria` se mantienen hasta commit post-verificación (2 semanas).
- **c3 — Híbrido de manejo de fallo runtime:**
  - **Lecturas públicas** (`galeria`, `catalogo`, `libro`): fail silencioso — cae a fallbacks UX ya diseñados en el spec (empty state en `#galeria` y `catalogo.html`; 4B.5 a3 en `libro.html`). Log a `console.warn`.
  - **Escrituras** (`admin.html` guardando libro, `sendBeacon` de `whatsapp_click`): fail visible — toast de error con botón "Reintentar". Para `sendBeacon` el fallo es silente por diseño del API; el toast solo aplica al save del admin.

**Contrato de futuro-proofing 6.2:**
- `BACKEND_FLAGS` centralizado; agregar consumidor nuevo = agregar entrada.
- Wrapper `supabaseCall(operation, { silentFail = false, fallback = null })` centraliza error handling — cambio de política = editar wrapper.
- Runbook de rollback en `CONTEXT.md` sección "Operations / Rollback backend consumer": edit `BACKEND_FLAGS.<page> = 'static'` → `firebase deploy --only hosting` → verificar degradación.

**Orden concreto de commits (plan de implementación):**

1. `chore(cleanup): borrar experimento V2 no committeado`.
2. `feat(backend): schema Dublin Core + migraciones + RLS + seed`.
3. `feat(backend): supabase client + BACKEND_FLAGS + supabaseCall wrapper`.
4. `feat(admin): admin.html con auth + editor de libro + storage upload`.
5. `feat(catalogo): catalogo.html con search + facetas + infinite scroll`.
6. `feat(libro): libro.html con ficha DC + CTA + relacionados`.
7. `feat(galeria): hidratación desde Supabase con flag`.
8. `feat(security): CSP hardening (unsafe-inline out, frame-ancestors, project-ref)`.
9. `docs: CONTEXT.md — Dublin Core note + runbooks (rotación key, rollback)`.
10. Post-verificación 2 semanas: `chore(cleanup): eliminar array BOOKS legacy + markup hardcoded del galeria`.

**Sección 6 completa.** ✅ **Sección 6/6 completa** — brainstorming terminal. ✅

---

## 3. Brainstorming completo — próximos pasos

**Estado del checklist:**
- ✅ Sección 4/6 completa (4A catálogo + 4B ficha + 4C galería).
- ✅ Sección 5/6 completa (5.1 RLS + 5.2 Storage/CSP + 5.3 sesión/anon/rate + hardening CSP).
- ✅ Sección 6/6 completa (6.1 testing + 6.2 rollout/limpieza).

**Todas las decisiones cerradas.** El body del spec (Sección 2) tiene cada decisión aprobada con su contrato de futuro-proofing. El orden de commits del plan de implementación vive en 6.2.

**Próximos pasos operativos:**
1. **Spec self-review** — releer el spec buscando inconsistencias entre secciones (nombres de funciones, referencias cruzadas, decisiones que se contradicen entre sí). Renombrar el archivo removiendo el sufijo `(WIP)`.
2. **User review** — Aldo lee y aprueba/rechaza cambios finales.
3. **Transition** — invocar `superpowers:writing-plans` para el plan de implementación paso-a-paso basado en la secuencia de 10 commits documentada en 6.2.

## 4. Estado del checklist del skill brainstorming

- [x] 1. Explore project context
- [x] 2. Offer visual companion (aceptado)
- [x] 3. Ask clarifying questions (4 preguntas cerradas — alcance, admin, social, discovery)
- [x] 4. Propose 2-3 approaches (elegido Approach 1)
- [x] 5. Present design — Secciones 1–6 completas y aprobadas.
- [x] 6. Write design doc final (nombre limpio sin WIP; body como fuente única).
- [x] 7. Spec self-review (2026-08-23 — 7 inconsistencias corregidas: headers 5/6 y 6/6 marcados APROBADA; CSP en Sección 2 alineado con 5.2 c2; `GALERIA_SOURCE` reemplazado por `BACKEND_FLAGS.galeria`; `mood_text` reemplazado por `curator_hook`; endpoint de `sendBeacon` clarificado como PostgREST directo; separador duplicado removido).
- [ ] 8. User reviews written spec
- [ ] 9. Transition to writing-plans

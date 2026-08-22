# Backend + Catálogo Dublin Core — Design Spec (WIP)

**Status:** WORK IN PROGRESS — brainstorming pausado dentro de Sección 4B (ficha larga).
**Fecha inicio:** 2026-08-22
**Última sesión:** 2026-08-22 (cerrado 4A completo + 4B.1; pendiente desde 4B.2).
**Owner:** Aldo
**Contexto:** Librería Itinerante y Más (Monterrey). Amigo Roberto.

> Este spec está incompleto. Al retomar, arrancar en **"Pregunta 4B.2 — CTA WhatsApp"** (ver marcador `RESUME AQUÍ` más abajo).

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
3. Firebase Hosting sigue como ingreso. Actualizar CSP: `connect-src https://*.supabase.co`, `img-src https://*.supabase.co`.
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

### Sección 4B/6 — `libro.html?slug=…` (ficha larga) 🔄 EN CURSO

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

**4B.2 — CTA WhatsApp: payload, deep-link y tracking** ⏳ PENDIENTE (RESUME AQUÍ)

Ver "RESUME AQUÍ" abajo para el detalle de la pregunta y las tres piezas propuestas (a — destino, b — plantilla, c — tracking).

**4B.3+ — Pendientes tras 4B.2:**
- Jerarquía DC metadata visible en la ficha (qué campos van en el header vs en la dl bibliográfica; cómo se muestran traductores/ilustradores sin ruido).
- Estrategia de "relacionados" (¿por `subject` compartido? ¿por `editorial`? ¿por `shelf`? ¿combinación con score?).
- Fallback si el `slug` no existe (404 vs redirect a catálogo con search preloaded).
- Comportamiento del breadcrumb cuando el usuario llegó por link directo (sin origen `catalogo.html`).

---

## 3. RESUME AQUÍ — Punto exacto donde retomar

**Estado del checklist:**
- ✅ Sección 4A/6 completa (esqueleto B, card compacta B, search instant A, facetas sidebar A + set MVP + P1 slider, infinite scroll A con URL offset).
- 🔄 Sección 4B/6 en curso — cerrado 4B.1 (layout Opción A con contrato de migración a B).
- ⏳ **Siguiente pregunta a responder: 4B.2 — CTA WhatsApp**.

### Pregunta 4B.2 — CTA WhatsApp: payload, deep-link y tracking

**a) Destino del deep-link**
- **a1** — Número personal de Roberto (`wa.me/52818XXXXXXX`)
- **a2** — WhatsApp Business con perfil de la librería (separa negocio/personal, habilita catálogo WA, respuestas rápidas, horarios)
- **a3** — Ambos con toggle por libro en admin (YAGNI, MVP)

**b) Plantilla del mensaje pre-cargado (`?text=`)**
- **b1 — Conciso operativo:** `Hola, me interesa "2666" de Roberto Bolaño (Anagrama, $180). ¿Está disponible?`
- **b2 — Curatorial cálido:** `Hola Roberto, vi "2666" en la librería. ¿Me cuentas más?`
- **b3 — Estructurado con book_id embebido (trazabilidad):**
  ```
  Hola, consulta desde el sitio:
  • Libro: 2666 — Roberto Bolaño
  • Editorial: Anagrama · $180 MXN
  • Ref: LIB-2666-BOL

  ¿Está disponible?
  ```

**c) Tracking a la tabla `whatsapp_click`**
- **c1 — Fire-and-forget antes de abrir el link** (riesgo: pérdida en navegación cancelada).
- **c2 — `navigator.sendBeacon`** (patrón exacto para este caso; fallback fetch keepalive).
- **c3 — Sin tracking en MVP** (tabla existe en schema, no se pobla hasta fase 2).

**Recomendación combinada:** **a2 + b3 + c2**.
- `a2` porque separa negocio/personal y habilita features WA Business (link técnico idéntico a `wa.me/<numero>?text=...`, la diferencia es operativa).
- `b3` porque el `Ref: LIB-<id>` embebido correlaciona la conversación con el libro concreto sin ambigüedad.
- `c2` porque `sendBeacon` es el API diseñado exactamente para "trackea antes de que el usuario se vaya"; ~3 líneas más y elimina un modo de fallo.

Si Roberto todavía no tiene WhatsApp Business, arrancamos con `a1` en config y flippeamos a `a2` cuando lo cree — es una constante en JS, no un cambio de arquitectura.

---

### Secciones aún pendientes tras cerrar 4B completa

- [ ] **Sección 4C/6 — Home `#galeria` hidratada**
  Cómo el `#galeria` actual del `index.html` consume Supabase respetando el Book Image Overlay obligatorio (que sí aplica aquí por ser showcase). Preview de estanterías destacadas vs new arrivals vs random. Fallback si hay 0 libros en el shelf destacado.

- [ ] **Sección 5/6 — Auth, seguridad y RLS policies**
  Políticas RLS por tabla (`anon` select público donde aplique, admin escritura). CSP updates. Rotación de anon key. Rate limiting (Supabase built-in). Manejo de sesión admin. Storage bucket policies para book-covers.

- [ ] **Sección 6/6 — Testing, deploy, migración desde el estado actual**
  Tests Harness (`tests/site.test.mjs`) actualizados para las nuevas páginas. Cómo poblamos data inicial (seed script con ~10 libros de muestra de las editoriales actuales). Estrategia de migración incremental: página por página, con feature flag simple (constante en JS) para colgar/descolgar cada consumidor de Supabase durante rollout. Cómo se maneja el borrado de `src/`, `dist/`, `vite.config.js` de V2 (unificación V1) — commit separado antes o después del backend.

**Terminal state del brainstorming:** invocar `superpowers:writing-plans` para plan de implementación detallado, únicamente después de que el usuario apruebe el spec completo.

---

## 4. Estado del checklist del skill brainstorming

- [x] 1. Explore project context
- [x] 2. Offer visual companion (aceptado)
- [x] 3. Ask clarifying questions (4 preguntas cerradas — alcance, admin, social, discovery)
- [x] 4. Propose 2-3 approaches (elegido Approach 1)
- [~] 5. Present design — Secciones 1, 2, 3, 4A aprobadas; 4B en curso; 4C, 5, 6 pendientes
- [ ] 6. Write design doc final (este archivo es WIP; renombrar/consolidar cuando esté completo)
- [ ] 7. Spec self-review
- [ ] 8. User reviews written spec
- [ ] 9. Transition to writing-plans

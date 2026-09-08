# Taxonomía controlada v1 — lenguaje canónico de consultas

Fuente máquina: `data/taxonomy.controlled.json`. Las colecciones `categories` y
`subgenres` contienen campos importables a Data Connect. Los metadatos raíz
`sourceMappings` son alias locales de normalización y no se envían a la BD.
Test: `tests/taxonomy.test.mjs` (`npm run taxonomy:check`).

## Categorías canónicas (slugs = chips del index = `?category=` del API)

| slug | nombre | pista LCC |
|---|---|---|
| fiction | Literatura y Ficción | PQ/PN |
| essay | Ensayo y Filosofía | B |
| history | Historia y Crónica | F/D |
| psychology | Psicología y Hábitos | BF |
| children | Infantil y Juvenil | PZ |
| arts | Arte y Fotografía | N |
| science | Ciencia y Cocina | Q/TX |

21 subgéneros iniciales (3 por categoría), ids en español sin acentos.

Actualización 2026-09-05: once alias propuestos para Goodreads bajo
`sourceMappings.kaggle-goodreads-best-books`, versión 1. Conservan etiqueta
original y apuntan a términos existentes; no agregan categorías ni promueven
clasificaciones editoriales. `scripts/etl-goodreads.py` valida que cada destino
exista y guarda la correspondencia reversible en cada ficha candidata.

## Reglas

1. Iti IA y `/api/catalog` solo aceptan estos slugs. Lo demás se rechaza o se mapea explícitamente.
2. Nuevas categorías/subgéneros se agregan aquí primero, con test en verde, antes de importar.
3. El dataset de prueba Amazon (`fiction`/`non-fiction` en inglés) vive solo en el emulador; nunca se importa a producción porque comparte el namespace de slugs.
4. Todo libro de inventario (`datasetKey: "inventory"`) apunta a un subgénero de esta lista.

## Aplicación en fase 2 (`src/config/taxonomy.js` + `/api/catalog`)

- `parseCatalogFilters` rechaza slugs fuera de vocabulario con **400** y códigos: `unknown-category`, `unknown-subgenre`, `category-subgenre-mismatch`. Cada error incluye `vocabulary` para que el cliente se autocorrija.
- Toda respuesta exitosa incluye `vocabulary: { version, categories, subgenres }` — Iti IA lo usa como único vocabulario de filtros (`SearchBooks`/`FilterBooks` solo reciben estos slugs).
- `format` y precios siguen libres; el control vive en categoría/subgénero.

## Comprensión de consulta (`src/ai/query-filters.ts`, `npm run filters:test`)

- `extractControlledFilters` mapea español→slugs sin LLM: minúsculas, sin acentos, singularización (`cuentos`→`cuento`), alias (`autoayuda`→`psychology`).
- Reglas: el subgénero manda y deriva su categoría; desempate por cobertura (1/1 vence a 1/2: `novela` sobre `biografia-memoria` ante "memoria" suelta), luego conteo, luego especificidad.
- Iti IA lo aplica antes de recuperar: `searchInventoryBooks[ByVector](query, 8, controlled)` y `recommendTestBooks(query, dataset, 8, controlled)`. Sin mención taxonómica, vector puro.
- `npm run rag:inventory` (gate vivo): `novela mexicana pueblo memoria` → Pedro Páramo con `sourceUrl`, `verifiedAt`, `isTestData:false` y `whatsappPrefill`. Verificado 2026-09-04 con selección LLM real (Gemini) + retrieval Gemini gratuito.

## Siembra fase 3 (`scripts/seed-taxonomy.mjs` + `verify-taxonomy.mjs`)

- `npm run taxonomy:seed` valida sin tocar DB; `--commit` exige emulador.
- Subgéneros se importan con `categoryId` (probado contra emulador: el upsert lo acepta).
- Verificado en emulador 2026-09-03: 8 categorías, 69 subgéneros (7+21 canónicos más el dataset Amazon-test preexistente; el slug `fiction` se fusiona entre ambos — efecto documentado de la regla 3, solo dev).
- `npm run taxonomy:local`: stack determinista (PGLite 5434 + hijo dataconnect 9399 + configure) porque el CLI pierde una carrera interna de configure en este sandbox. Requiere `GOOGLE_APPLICATION_CREDENTIALS` y `FIREBASE_PROJECT_ID`.
- `LOCAL_STACK_KEEP=1` deja el stack vivo para gates (`npm run rag:test` con `DATA_CONNECT_EMULATOR_HOST`).

## Embeddings sin facturación (resuelto 2026-09-04)

Vertex AI exige billing (`403 ... requires billing to be enabled`) y el emulador se cuelga en vez de reportarlo. Vía libre: **Gemini Developer API, capa gratuita** (`src/lib/gemini-embedding.js`, `gemini-embedding-001`, 768 dims, probado en vivo con la key de `.env.local`).
- Import: `EMBEDDINGS=gemini node scripts/import-books.mjs --commit` o `INVENTORY_PATH=... npm run taxonomy:local` → vectores inline `embedding: [...]` (válido; el ETL de prueba ya usa esa forma).
- Retrieval inventario: `searchInventoryBooksByVector` (vector explícito + COSINE, filtros client-side) vs `searchInventoryBooks` (Vertex). Iti IA elige con `INVENTORY_EMBEDDINGS=gemini|vertex` (default vertex = prod con billing).
- Regla de espacio: no mezclar modelos en un dataset (qué modelo embedió el catálogo = qué modelo embedde la consulta).
- `npm run embeddings:check`: gate manual (requiere `GEMINI_API_KEY`, fuera del harness).

El JSON local `itinerante-e428c-...` pertenece al proyecto anterior y responde `invalid_grant: Invalid JWT Signature` (reloj OK, revocada en IAM). El proyecto canónico es **`libreria-itineranteymas`** (todo el repo ya apunta ahí: `.firebaserc`, `firebaseConfig.ts`, `firebase-admin.ts`, scripts). Efecto: todo lo local funciona (seed taxonomía, lecturas, RAG de prueba con embeddings locales), pero `embedding_embed` (Vertex AI) se cuelga — imposible importar inventario con embeddings reales hasta tener clave del proyecto canónico. Acción del humano en consola (proyecto `libreria-itineranteymas`): IAM → Service Accounts → `firebase-adminsdk` → Keys → Add key → JSON → reemplazar el archivo local (gitignored, nunca commitear; puede llamarse distinto, solo ajusta `GOOGLE_APPLICATION_CREDENTIALS`). Verificado: `data/books.inventory-001.json` (Pedro Páramo, ficha piloto honesta) ya valida (`books:validate`) y construye sus 6 mutaciones con `searchText` correcto; solo falta el import vivo.

# Libreria Itinerante y Mas

La única superficie pública oficial es [`index.html`](index.html): el lenguaje
editorial del prototipo cinematográfico de Claude Design, implementado como
sitio estático mantenible. Higgsfield aporta únicamente los medios y el
scroll-scrub local que acompaña Entrada, Experiencia, Comunidad y Agenda; los
siete fotogramas aprobados sostienen la ruta cuando el video no carga o el
usuario reduce movimiento. No hay SDKs externos. El monolito anterior quedó preservado en
`_archive/models/` y no es una segunda home.

Data Connect, Genkit y las rutas bajo `src/app/api` forman un servicio interno
en preparacion. No son otra version del sitio y no deben presentarse como una
experiencia desplegada hasta completar sus gates con datos autorizados.

## Comandos

- `npm run dev` o `npm run preview`: inicia emulador Data Connect, backend e
  interfaz en `http://127.0.0.1:8080/`. Espera el mensaje **Vista local lista**:
  comprueba catálogo e Iti IA antes de anunciar disponibilidad. La demo usa los
  datos de prueba ya presentes en el emulador, no inventario real.
- `npm run preview:static`: sólo HTML, estilos y medios; necesita un backend
  separado para consultar catálogo e Iti IA.
- `npm test`: regresion del sitio y contratos Data Connect/RAG.
- `npm run backend:dev`: rutas internas Next.js en `http://localhost:3000/`.
- `npm run backend:build`: valida la compilacion del servicio interno.
- `npm run books:validate -- ruta/catalogo.json`: valida datos sin escribir.
- `npm run books:import -- ruta/catalogo.json`: importacion administrativa.
- `npm run amazon:etl`: transforma el CSV Amazon en un catalogo local de prueba.
- `npm run amazon:etl:check`: perfila y valida el CSV sin escribir artefactos.
- `npm run reference:check`: comprueba veinte consultas bibliográficas locales
  y el aislamiento de las candidatas; incluido en `npm test`. Normalización y
  pruebas Python: [`docs/CATALOG_DATASET_AND_MODEL.md`](docs/CATALOG_DATASET_AND_MODEL.md#implementación-local--2026-09-05).
- `npm run rag:test`: valida recuperacion local despues de importar en el emulador.
- `npm run dataconnect:generate`: genera el SDK de Data Connect.
- `npm run dataconnect:verify`: comprueba el SDK y el manifiesto de herramientas.
- `npm run backend:dev:emulator`: alias del arranque local completo.
- `npm run genkit:ui`: interfaz local de Genkit.
- `firebase emulators:start`: emuladores Firebase/Data Connect.

La decision de superficie canonica esta en [`CONTEXT.md`](CONTEXT.md). El
contrato, la plantilla y el procedimiento de verificacion de datos estan en
[`docs/BOOK_DATA_AND_RAG.md`](docs/BOOK_DATA_AND_RAG.md). El backend Supabase
anterior permanece en el repositorio solo como legado; no es la arquitectura
activa para este vertical.

# Arquitectura y contexto

## Estado comprobado al 29 de agosto de 2026

`index.html` sigue siendo la única superficie pública de Librería Itinerante y
Más. El runtime Next.js existe únicamente para `/api/catalog` y
`/api/ai/iti-ia`; no contiene otra home ni un catálogo visual paralelo.

El backend ya tiene un recorrido local verificable, pero todavía no contiene
inventario comercial autorizado. El CSV de Amazon sólo es un fixture aislado:
`catalogKind=test`, `status=test`, `stockQty=0` y `priceMxnCents=null`.

## Fuente de verdad y flujo

Firebase Data Connect sobre PostgreSQL/pgvector es la única fuente de verdad
del catálogo. Firestore, Supabase y un segundo vector store no participan en
este vertical.

```text
JSON validado (schemaVersion 2)
  -> importador administrativo e idempotente
  -> Category -> Subgenre -> Book <- BookAuthor -> Author
  -> Data Connect / PostgreSQL / pgvector
  -> recuperación determinista y filtros del backend
  -> selección estructurada de 1 a 3 slugs con Gemini
  -> validación de slugs contra los candidatos recuperados
  -> respuesta con procedencia y fecha de verificación
```

La búsqueda pública acepta texto, categoría, subgénero, formato y precio máximo.
Devuelve `total`, facetas con conteos y fichas compatibles con la interfaz
existente. Los errores de Data Connect se reportan como indisponibilidad; nunca
se convierten silenciosamente en “cero resultados”.

## Modelo de catálogo v2

La taxonomía adopta el patrón de ECRMNL: términos preferidos con IDs/slugs
estables y relaciones explícitas, conservando además los valores crudos de la
fuente para auditoría.

- `Category`: categoría canónica (`fiction`, `non-fiction`, etc.).
- `Subgenre`: término preferido dentro de una categoría.
- `Book`: edición vendible; apunta obligatoriamente a un subgénero.
- `Author` y `Editorial`: entidades reutilizables.
- `BookAuthor`: relación N:M con rol y orden.
- `sourceCategory` y `sourceSubGenre`: etiquetas originales, no facetas
  canónicas.
- `sourceUrl`, `sourceLabel`, `sourceRecordId` y `verifiedAt`: procedencia.

Un libro sólo es vendible cuando pertenece a `datasetKey=inventory`, tiene
`status=active`, `stockQty>0`, precio MXN, condición y procedencia autorizada.

## Decisión sobre Graph

El manual `Graph-Engineering-Athropic-Playbook.pdf` se tomó como criterio de
diseño, no como instrucciones ejecutables. Su recomendación de usar Graph para
estado compartido, evidencia multi-documento o preguntas de varios saltos no
justifica agregar una base de grafos al catálogo actual: buscar y recomendar un
libro es una consulta de un salto sobre relaciones ya modeladas en PostgreSQL.

Sí se incorporan sus prácticas útiles: `schemaVersion`, IDs estables, mapa de
términos preferidos, procedencia, actualización incremental e integración con
un gold set. Una capa Graph se evaluará sólo si aparecen casos reales de varios
saltos, por ejemplo autor → evento → sede → comunidad → conversación histórica.

## Iti IA

Iti IA dejó de usar un agente con `toolChoice=required`, hasta seis turnos y
reintentos anidados. Ese bucle amplificaba las fallas transitorias del proveedor.
El flujo actual es acotado:

1. Recupera hasta ocho candidatos desde Data Connect.
2. Envía esos candidatos a un único Dotprompt con salida estructurada.
3. Gemini sólo puede devolver entre uno y tres slugs.
4. El backend descarta cualquier slug no recuperado.
5. Si Gemini no está disponible, devuelve el ranking grounded con un aviso
   transparente; si Data Connect falla, informa que el catálogo no está
   disponible.

El proveedor es Google AI (`@genkit-ai/google-genai`) con `GEMINI_API_KEY` sólo
en el servidor. `ITI_IA_MODEL` usa `gemini-3.6-flash` por defecto y
`ITI_IA_FALLBACK_MODEL` usa `gemini-3.5-flash`. Cada intento se limita con
`ITI_IA_MODEL_TIMEOUT_MS` (15 s por defecto, rango 3–30 s). El proxy local tiene
un límite independiente de 90 s.

Genkit y sus integraciones están fijados en 1.41.0. No se usa
`@genkit-ai/firebase` ni el plugin Vertex: una API key de Gemini corresponde a
Google AI Studio/Gemini API; Vertex AI requeriría configuración IAM distinta.

## Comandos de verificación

```powershell
npm test
npm run amazon:etl:check
npm run dataconnect:generate
npm run dataconnect:verify
npm run demo:dev

$env:DATA_CONNECT_EMULATOR_HOST = "127.0.0.1:9399"
npm run books:import -- data/books.amazon-test.json
npm run rag:test
npm run backend:build
```

La CLI genera `generated/data`. Firebase CLI 15.28.1 valida el conector
`llmTools` pero no reescribe `generated/tools.json`; por eso ese manifiesto se
mantiene versionado y `dataconnect:verify` comprueba tanto identidad como
parámetros de categoría/subgénero.

## Gates antes de producción

1. Recibir una exportación autorizada con precio MXN, stock, condición y
   procedencia; no promover el fixture de Amazon.
2. Validar catálogo e importar primero un lote pequeño en un entorno no
   productivo.
3. Ejecutar el gold set, pruebas de filtros, cero resultados, indisponibilidad
   de Data Connect y caída de Gemini.
4. Revisar autenticación administrativa, facturación, IAM y secretos.
5. Ejecutar tests, build y validación manual del sitio en escritorio/móvil.
6. Desplegar sólo con autorización explícita del propietario.

Detalle del contrato de datos: `docs/BOOK_DATA_AND_RAG.md`.

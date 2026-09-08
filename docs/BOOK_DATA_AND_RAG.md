# Catálogo real, búsqueda e Iti IA

## Contrato importable

Todo archivo de catálogo usa `schemaVersion: 2` y contiene estas colecciones:

```text
categories -> subgenres -> books <- bookAuthors -> authors
                           |
                           -> editorials
```

Reglas principales:

- IDs y slugs son estables e idempotentes.
- Cada `Subgenre.categoryId` debe existir y cada `Book.subgenreId` debe apuntar
  a un subgénero válido.
- `sourceCategory` y `sourceSubGenre` conservan el vocabulario original.
- `priceMxnCents` es un entero; `34900` representa $349.00 MXN.
- Una ficha `active` exige precio, stock positivo, condición conocida y fuente
  HTTPS autorizada.
- `searchText` se deriva de datos validados y permite regenerar el vector.
- No existen mutaciones públicas de inventario.

La plantilla está en `data/books.template.json`. Para preparar inventario real:

```powershell
npm run books:validate -- data/books.real.json
npm run books:import -- data/books.real.json
```

La escritura utiliza Admin SDK/Application Default Credentials y nunca se
ejecuta desde el navegador. Validar el archivo no aprovisiona servicios ni
autoriza un despliegue.

## Búsqueda y facetas

`GET /api/catalog` admite:

- `q`: texto libre;
- `category`: slug canónico;
- `subgenre`: slug canónico;
- `format`: formato exacto;
- `maxPriceMxnCents`: presupuesto máximo;
- `limit`: 1–60.

La respuesta incluye `mode`, `datasetKey`, `total`, `facets` y `books`. En modo
de prueba se combina el vector lexical determinista con ranking de metadatos.
En inventario se usa `text-embedding-005` en Data Connect. El backend aplica los
filtros sobre el mismo conjunto recuperado y mantiene una salida compatible con
la UI (`genre` se deriva de la categoría, no se almacena como campo plano).

## Iti IA

`POST /api/ai/iti-ia` recibe mensajes Genkit. La lógica se divide en dos fases:

1. Recuperación: Data Connect produce candidatos verificables.
2. Selección: Gemini devuelve únicamente slugs con un esquema JSON.

La respuesta se construye en el servidor a partir de las filas recuperadas. El
modelo no redacta títulos, autores, precios, disponibilidad ni procedencia. Los
slugs desconocidos se descartan y, ante fallo del modelo, se usa el ranking
grounded con un aviso explícito. Un fixture nunca genera texto de apartado por
WhatsApp porque `stockQty=0` no demuestra inventario.

Configuración local:

```dotenv
GEMINI_API_KEY=...
ITI_IA_MODEL=gemini-3.6-flash
ITI_IA_FALLBACK_MODEL=gemini-3.5-flash
ITI_IA_MODEL_TIMEOUT_MS=15000
```

La clave es sólo de servidor: no debe entrar en `index.html`, Git ni variables
`NEXT_PUBLIC_*`.

## Dataset Amazon de prueba

`Amazon_BestSelling_Books_500.csv` es un sujeto de pruebas, no inventario. El
ETL conserva el original y genera:

- `data/books.amazon-test.json`;
- `data/books.amazon-test.quality.json`.

Perfil actual: 500 libros, 2 categorías, 48 subgéneros, 168 autores y 56
editoriales. Sólo 41 ISBN pasan el dígito de control; los 459 restantes quedan
exclusivamente en `sourceRecordId`. La columna `Amazon URL` no contiene enlaces
utilizables, por lo que las URLs guardadas son búsquedas derivadas. Los precios
son referencias USD de la fuente (`referencePriceUsdCents`), nunca precios MXN
de Librería Itinerante.

```powershell
npm run amazon:etl:check
npm run amazon:etl
npm run demo:dev

$env:DATA_CONNECT_EMULATOR_HOST = "127.0.0.1:9399"
npm run books:import -- data/books.amazon-test.json
npm run rag:test
```

La importación de un catálogo `test` se rechaza si no detecta el emulador. Sus
vectores locales de 768 dimensiones son deterministas y no hacen llamadas
facturables de embedding.

## Evaluación y migraciones

`data/iti-ia.eval.json` contiene cinco consultas de regresión. El gate exige
recall en ciencia ficción, productividad, thriller, lectura infantil y
memorias, además de aislamiento del dataset y recuperación exacta por slug.

El cambio v1 → v2 agrega relaciones obligatorias de taxonomía. Una base con
filas v1 no puede recibir la columna `subgenre_id NOT NULL` sin backfill. Para
producción se requiere una migración controlada: crear términos canónicos,
mapear cada fila, verificar conteos y sólo después aplicar la restricción. En el
emulador de fixtures se puede iniciar una base limpia después de preservar el
estado anterior.

## Límites de lo ya verificado

El recorrido local demuestra esquema, importación, pgvector, filtros, facetas y
selección Gemini grounded. No demuestra que exista inventario real ni autoriza
Cloud SQL, Data Connect, Vertex AI, facturación o despliegue en producción.

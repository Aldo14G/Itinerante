# Iti IA: Arquitectura RAG, Contratos de Herramientas y Resiliencia — Technical Spec

**Status:** PROPUESTA / APROBACIÓN TÉCNICA  
**Fecha:** 2026-08-28  
**Autor:** Antigravity (Pair Programming con Aldo)  
**Contexto:** Librería Itinerante y Más (Monterrey, NL)  
**Documentos de referencia:**  
- [`CONTEXT.md`](../../../CONTEXT.md)  
- [`docs/ARCHITECTURE_AND_CONTEXT.md`](../ARCHITECTURE_AND_CONTEXT.md)  
- [`docs/BOOK_DATA_AND_RAG.md`](../BOOK_DATA_AND_RAG.md)  
- [`docs/ITI_IA_AUDIT_AWESOME_LLM_APPS.md`](../ITI_IA_AUDIT_AWESOME_LLM_APPS.md)  

---

## 0. Resumen Ejecutivo y Diagnóstico

### 0.1 Propósito
Iti IA es la asistente conversacional de descubrimiento y curaduría de libros de Librería Itinerante y Más. Su objetivo es asesorar a los lectores con un tono cálido, humano y librero, recomendando títulos estrictamente verificables del catálogo y facilitando la consulta o apartado físico vía WhatsApp.

### 0.2 Diagnóstico del Estado Actual
El sistema presentaba fallos e interrupciones en la búsqueda de libros debido a cuatro causas técnicas identificadas:
1. **Desalineación del stack local de 3 procesos**: La llamada a `/api/ai/iti-ia` requería simultáneamente el emulador Data Connect (`:9399`), el runtime Next.js (`:3000`) y el preview estático (`:8080`). Si el emulador no tenía datos o estaba caído, la herramienta de catálogo arrojaba un error no capturado que culminaba en HTTP 500.
2. **Barrera de idioma en el dataset de prueba**: El fixture local (`books.amazon-test.json`) contiene registros en inglés, mientras que las consultas del usuario son en español. Si el modelo no adaptaba los términos de búsqueda antes de llamar a la herramienta léxica/vectorial, la consulta devolvía 0 candidatos.
3. **Rigidez en `toolChoice: "required"` y validación de contrato**: Obligar al modelo a ejecutar herramientas en cada turno sin un canal fluido para clarificación (`askQuestion`) provocaba que, ante cero resultados o respuestas intermedias, el validador de seguridad `validateItiIaMessages` abortara el flujo.
4. **Restricción de cuota en proveedor LLM (429 / 503)**: El uso de `gemini-3.7-flash` en tiers gratuitos sin manejo de contingencia transparente para el usuario causaba bloqueos silenciosos.

---

## 1. Sección 1: Flujo de Herramientas y Prompt Engineering

### 1.1 Ciclo de Ejecución Adaptativo (Tool Calling Loop)
El flujo de Genkit (`itiIaFlow`) pasa de un esquema forzado rígido a un esquema de **ejecución guiada con soporte de clarificación**:

```
[Usuario envía mensaje]
       │
       ▼
[Turno 1: Gemini 3.7 Flash]
       ├─► ¿Búsqueda necesaria? ──► Llama a SearchBooks / searchTestBooks
       ├─► ¿Filtro explícito?   ──► Llama a FilterBooks / filterTestBooks
       └─► ¿Consulta ambigua?   ──► Llama a askQuestion (Clarificación directa)
       │
       ▼
[Ejecución de Herramienta] ──► Devuelve candidatos / 0 resultados
       │
       ▼
[Turno 2: Gemini 3.7 Flash]
       ├─► Candidatos válidos   ──► Llama a recommendBooks (1 a 3 libros) + texto cálido
       └─► 0 candidatos         ──► Llama a askQuestion con alternativas sugeridas
       │
       ▼
[Validación de Grounding] ──► Verifica slugs y campos contra toolResponses del turno
       │
       ▼
[Sanitización Pública] ──► publicItiIaMessages entrega solo UI-events y texto
```

### 1.2 Contratos de Herramientas Tipadas (Zod Schemas)

#### A. Herramientas de Descubrimiento de Catálogo
* **`SearchBooks` / `searchTestBooks`**:
  ```ts
  inputSchema: z.object({
    query: z.string().describe("Término de búsqueda semántica. En modo test, traducido al inglés."),
    genre: z.string().optional().describe("Género canónico para acotar la búsqueda."),
    datasetKey: z.string().describe("Identificador de dataset ('inventory' o 'amazon-bestsellers-500')."),
    limit: z.number().int().min(1).max(20).default(8),
  })
  ```
* **`FilterBooks` / `filterTestBooks`**:
  ```ts
  inputSchema: z.object({
    datasetKey: z.string(),
    genres: z.array(z.string()).optional(),
    moods: z.array(z.string()).optional(),
    minPriceMxnCents: z.number().int().nonnegative().optional(),
    maxPriceMxnCents: z.number().int().nonnegative().optional(),
    limit: z.number().int().min(1).max(30).default(15),
  })
  ```
* **`GetBookBySlug` / `getTestBookBySlug`**:
  ```ts
  inputSchema: z.object({
    slug: z.string().describe("Slug exacto del libro."),
    datasetKey: z.string(),
  })
  ```

#### B. Herramientas de Interacción y Salida (User-Facing Tools)
* **`recommendBooks`**:
  ```ts
  inputSchema: z.object({
    recommendedBooks: z.array(z.object({
      slug: z.string(),
      title: z.string(),
      author: z.string().optional(),
      genre: z.string().optional(),
      coverUrl: z.string().url().optional(),
      coverAlt: z.string().optional(),
      reason: z.string().describe("Motivo de recomendación basado exclusivamente en los metadatos recuperados."),
      sourceUrl: z.string().url(),
      verifiedAt: z.string(),
      datasetKey: z.string(),
      sourceLabel: z.string(),
      isTestData: z.boolean(),
      priceMxnCents: z.number().int().optional(),
      whatsappPrefill: z.string().optional(),
    })).min(1).max(3),
  })
  ```
* **`askQuestion`**:
  ```ts
  inputSchema: z.object({
    question: z.string().describe("Pregunta de clarificación en español."),
    type: z.enum(["MULTIPLE_CHOICE", "FREEFORM"]),
    choices: z.array(z.string()).optional().describe("Opciones sugeridas cuando aplique."),
    suggestedGenres: z.array(z.string()).optional(),
  })
  ```

### 1.3 Ingeniería de Prompt e Instrucciones de Grounding (`iti-ia.prompt`)
1. **Personalidad y Rol**: Voz de Roberto / librero de barrio en Monterrey; culto, empático, conciso y apasionado por la literatura.
2. **Regla de Oro de Evidencia**: El modelo tiene prohibido inventar libros, autores, precios, existencias o tramas. Todo título recomendado debe provenir de los resultados de `SearchBooks`, `FilterBooks` o `searchTestBooks` obtenidos en la interacción actual.
3. **Manejo Bilingüe / Modo Test**: Cuando `catalogMode == 'test'`, el prompt instruye explícitamente a traducir la intención y palabras clave al inglés antes de invocar `searchTestBooks`.
4. **Manejo de Cero Resultados**: Si la consulta no produce libros con `stockQty > 0` o coincidencias semánticas suficientes, no inventar recomendaciones; invocar `askQuestion` explicando con amabilidad la falta de coincidencias y ofreciendo 2–3 vertientes o autores destacados.

### 1.4 Guardrails de Validación (`validateItiIaMessages`)
* Se valida que todo libro en `recommendBooks` tenga su `slug` presente en el mapa de registros recuperados por las herramientas de catálogo.
* Se tolera y preserva la salida cuando el modelo genera `askQuestion` o mensajes de texto aclaratorios, evitando que una búsqueda sin resultados rompa la API con un error no controlado.

---

## 2. Sección 2: Robustez de la Recuperación RAG (Contrato Híbrido)

### 2.1 Arquitectura del Motor Dual

```
                      ┌──────────────────────────────────────────────┐
                      │              Iti IA Query                    │
                      └──────────────────────┬───────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [Modo INVENTORY]                               [Modo TEST]
        (Producción / Inventario Real)                 (Fixture / Amazon 500)
                       │                                           │
         ┌─────────────┴─────────────┐               ┌─────────────┴─────────────┐
         ▼                           ▼               ▼                           ▼
   pgvector COSINE             Filtros SQL      Búsqueda Léxica          Filtros JSON/PGLite
  (text-embedding-005)      (Stock, Precio,      (rankTestBooks          (Rating, Género,
   768 dimensiones             Editorial)        768-dim lexical)         Precio USD Ref)
```

### 2.2 Estrategia de Recuperación en Cascada (Multi-Stage Retrieval)
1. **Etapa 1: Recuperación Semántica Primaria**:
   * Ejecuta similitud vectorial sobre `searchText` (vector 768d).
   * Filtro duro obligatorio: `status = "active"` y `stockQty > 0` (en inventario real).
2. **Etapa 2: Recuperación Estructurada / Facetada**:
   * Si la consulta menciona explícitamente autor, género o rango de precio, se complementa con `FilterBooks`.
3. **Etapa 3: Búsqueda Léxica y Re-ranking Local (en Test/Local)**:
   * `rankTestBooks` en [`src/lib/local-test-search.js`](file:///C:/Proyectos/Itinerante/src/lib/local-test-search.js) combina similitud de tokens, pesos de campos (Título: 3x, Autor: 2x, Tags: 1.5x) y posición en ranking de prueba para asegurar que los mejores candidatos lleguen al contexto.
4. **Etapa 4: Ensamble de Evidencia Contextual**:
   * Cada candidato recuperado se proyecta con campos normalizados: `id`, `slug`, `title`, `author`, `editorial`, `description`, `priceMxnCents`, `coverUrl`, `verifiedAt`.

---

## 3. Sección 3: Manejo de Estados, Resiliencia y Experiencia de Usuario

### 3.1 Manejo de Proveedor y Fallbacks de Cuota (Gemini API)
* **Cadena de Modelos**:
  1. Modelo Primario: `gemini-3.7-flash` (con `thinkingLevel: "LOW"`).
  2. Fallback de Modelo: `gemini-3.6-flash` si ocurre error de código `429` (cuota agotada) o `503` (indisponibilidad temporal).
  3. Reintento automático: `retry({ maxRetries: 1, statuses: ["UNAVAILABLE", "RESOURCE_EXHAUSTED"], initialDelayMs: 250 })`.
* **Respuesta de Contingencia Amigable**:
  * Si ambos modelos fallan o la cuota total del proyecto está agotada, el backend devuelve un error estructurado `{ error: { code: "RATE_LIMITED", message: "Iti IA tiene alta demanda en este momento..." } }` con código HTTP 429, el cual la UI captura sin romper la sesión.

### 3.2 Protocolo de Transporte y Timeouts
* **Proxy Timeout en `static-server.mjs`**: Se fija un timeout mínimo de 90 segundos (`DEFAULT_PROXY_TIMEOUT_MS = 90_000`) para llamadas `/api/ai/*`, permitiendo que el LLM ejecute tool turns y pensamiento ligero sin abortar prematuramente.
* **CORS y CSP**: `index.html` realiza peticiones del mismo origen hacia `/api/*`, evitando problemas de preflight y respetando la política de seguridad de Firebase Hosting.

### 3.3 Experiencia de Usuario en el Frontend (`index.html`)

#### A. Estados de la Interfaz
1. **Estado Inicial / Listo**: Diálogo abierto con foco en `#itiIaInput`, mensaje de estado *"Lista para conversar sobre libros."*.
2. **Estado Buscando / Pensando**: Input y botón deshabilitados, spinner/indicador *"Consultando el catálogo de la librería..."*, atributo `aria-busy="true"`.
3. **Estado con Recomendaciones**:
   * Mensaje conversacional de Iti IA.
   * Contenedor `.iti-ia-recommendations` con tarjetas `.iti-ia-recommendation`:
     * Portada (o placeholder de iniciales si no hay imagen).
     * Título y Autor.
     * Motivo breve de recomendación.
     * Insignia distintiva:
       * *Inventario real*: Precio en MXN y botón *"Apartar por WhatsApp"*.
       * *Modo test*: Badge *"Datos de prueba · no es inventario"*.
4. **Estado de Pregunta / Clarificación (`askQuestion`)**:
   * Si Iti IA necesita clarificación, muestra la pregunta con botones/chips de respuesta rápida para que el usuario pueda hacer clic sin escribir.
5. **Estado de Error / Degradación**:
   * Mensaje claro con botón de reintento o enlace directo de contacto general a WhatsApp.

#### B. Accesibilidad (a11y) y Rendimiento
* Diálogo nativo `<dialog id="itiIaDialog">` con soporte de `showModal()`, tecla `Escape` y retorno de foco al elemento disparador.
* Regiones `aria-live="polite"` para notificaciones de estado y mensajes entrantes.
* Sin dependencias externas de CSS/JS en el cliente; renderizado ligero con manipulación DOM nativa segura (`textContent` y `createElement`).

---

## 4. Matriz de Verificación y Testing

| Capa | Test Suite | Casos Validados |
|---|---|---|
| **Léxica & Ranking** | `tests/iti-ia.test.mjs` | Búsqueda bilingüe, proyección `searchText`, URLs seguras de portada. |
| **Contrato de Herramientas** | `tests/iti-ia.test.mjs` | Tool calling de Genkit, `googleAI()`, límites de tokens, grounding estricto. |
| **Runtime & Proxy** | `tests/runtime.test.mjs` | Proxying de `/api/catalog` y `/api/ai/iti-ia`, manejo de timeouts, inicialización de stack dev. |
| **Evaluación RAG** | `data/iti-ia.eval.json` + `npm run rag:test` | 5 consultas de regresión fija verificando `stockQty: 0`, aislamiento de test y coincidencia exacta de slugs. |
| **Integración HTML** | `tests/site.test.mjs` | Existencia y a11y del modal `#itiIaDialog`, formularios, botones de apertura y contratos de UI. |

---

## 5. Plan de Ejecución Ordenado (Roadmap de Implementación)

Una vez aprobada esta especificación, la implementación se ejecutará en 3 fases secuenciales:

1. **Fase 1: Motor de Herramientas y Prompts (Backend/Genkit)**
   * Actualizar `iti-ia.prompt` con instrucciones bilingües y manejo de clarificación.
   * Ajustar `src/ai/iti-ia.ts` y `src/ai/genkit.ts` para soportar `askQuestion` y flujo no bloqueante ante cero resultados.
   * Robustecer `validateItiIaMessages`.
2. **Fase 2: Robustez de Recuperación y Búsqueda Local (Data Connect / Lib)**
   * Afinar `recommendTestBooks` y `searchInventoryBooks` en `src/lib/test-catalog.ts`.
   * Verificar compatibilidad con emulador Data Connect y fixture Amazon 500.
3. **Fase 3: Refinamiento de UI e Interacción en `index.html`**
   * Mejorar el renderizado de tarjetas de recomendación y chips de `askQuestion`.
   * Enlazar el flujo completo con `npm run demo:dev` y ejecutar la suite de pruebas `npm test`.

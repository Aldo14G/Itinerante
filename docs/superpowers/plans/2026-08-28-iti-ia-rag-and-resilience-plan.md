# Plan de Implementación: Arquitectura RAG, Herramientas y Resiliencia para Iti IA

> **Referencia de Spec:** [`docs/superpowers/specs/2026-08-28-iti-ia-rag-architecture-and-resilience-spec.md`](../specs/2026-08-28-iti-ia-rag-architecture-and-resilience-spec.md)  
> **Objetivo:** Implementar el pipeline de RAG adaptativo, contratos de herramientas tipadas, gestión de cuotas/resiliencia y el renderizado interactivo en `index.html`.

---

## Estructura de Archivos

### A modificar:
1. `src/ai/prompts/iti-ia.prompt` — Instrucciones del sistema, traducción de intenciones y reglas de grounding/clarificación.
2. `src/ai/iti-ia.ts` — Flujo `itiIaFlow`, configuración de turnos, reintentos y tolerancia a fallos.
3. `src/ai/genkit.ts` — Esquemas de herramientas (`recommendBooks`, `askQuestion`), validación `validateItiIaMessages` y proyección `publicItiIaMessages`.
4. `src/lib/local-test-search.js` — Búsqueda léxica bilingüe y ranking ponderado.
5. `src/lib/test-catalog.ts` — Adaptadores de catálogo local y Data Connect.
6. `index.html` — Lógica del cliente JS en `initItiIa()`, renderizado de recomendaciones con tarjetas completas y chips de clarificación.
7. `tests/iti-ia.test.mjs` — Suite de pruebas de regresión unitaria y de integración.

---

## Fases de Implementación

### Tarea 1: Refinamiento de Prompts y Flujo en Genkit

- [ ] **Paso 1.1: Actualizar `src/ai/prompts/iti-ia.prompt`**
  - Añadir soporte explícito para traducción previa de intenciones temáticas en modo test.
  - Definir la estrategia ante cero resultados: invocar `askQuestion` ofreciendo alternativas de exploración.
  - Reforzar el tono de librero cálido y cercano.

- [ ] **Paso 1.2: Ajustar `src/ai/iti-ia.ts`**
  - Permitir que el modelo use herramientas de forma natural sin bloqueos por `toolChoice: "required"`.
  - Capturar errores de cuota (`429` / `503`) y devolver respuestas estructuradas o delegar al fallback de modelo.

- [ ] **Paso 1.3: Ajustar esquemas y validación en `src/ai/genkit.ts`**
  - Actualizar `askQuestion` y `recommendBooks` para asegurar compatibilidad de contratos.
  - Asegurar que `validateItiIaMessages` no lance excepción ante mensajes de clarificación (`askQuestion` o texto explicativo).
  - Mantener la regla estricta: todo libro recomendado en `recommendBooks` debe existir en los registros del catálogo recuperados en ese turno.

- [ ] **Paso 1.4: Ejecutar tests unitarios de IA**
  - `node --test tests/iti-ia.test.mjs`

---

### Tarea 2: Robustecer la Recuperación RAG y Búsqueda Local

- [ ] **Paso 2.1: Mejorar `src/lib/local-test-search.js`**
  - Ampliar el mapeo de sinónimos y términos bilingües para géneros comunes (ej. "novela histórica" -> "historical fiction", "desarrollo personal" -> "self-help").
  - Refinar el algoritmo de scoring ponderado para dar relevancia a coincidencias parciales de autor y título.

- [ ] **Paso 2.2: Ajustar `src/lib/test-catalog.ts`**
  - Proteger `recommendTestBooks` y `searchInventoryBooks` contra caídas de conexión, devolviendo arrays vacíos limpios en lugar de excepciones no controladas.
  - Garantizar que la proyección `toBookView` formatee correctamente autores y precios en centavos a formato legible.

- [ ] **Paso 2.3: Validar con prueba de RAG local**
  - `npm run rag:test` (o script de verificación local).

---

### Tarea 3: Experiencia de Usuario y Manejo de Estados en `index.html`

- [ ] **Paso 3.1: Actualizar el renderizado de mensajes en `index.html` (`initItiIa`)**
  - Renderizar tarjetas completas para `recommendBooks`:
    * Portada (con placeholder estilizado si no existe URL).
    * Título, Autor y Género.
    * Motivo breve de recomendación.
    * Botón de WhatsApp para consulta/apartado (en modo inventario) o badge de datos de prueba (en modo test).
  - Renderizar chips interactivos para `askQuestion`:
    * Permitir al usuario hacer clic en una sugerencia para enviar automáticamente la respuesta al chat.

- [ ] **Paso 3.2: Gestión de estados y feedback visual**
  - Mostrar estado "Buscando en el catálogo..." con animación sutil.
  - Manejar amigablemente los errores de cuota o de red sin borrar la conversación previa.
  - Incluir botón o enlace directo a WhatsApp en caso de error o cuando el usuario prefiera atención humana directa.

- [ ] **Paso 3.3: Verificar accesibilidad y navegación por teclado**
  - Foco automático en el input al abrir el modal.
  - Tecla `Escape` cierra el diálogo y devuelve el foco al botón de apertura.
  - Regiones `aria-live` para lectura de pantalla.

---

### Tarea 4: Validación Integral y Pruebas de Regresión

- [ ] **Paso 4.1: Ejecutar toda la suite de pruebas del Harness**
  - `npm test`

- [ ] **Paso 4.2: Prueba funcional end-to-end con el stack de desarrollo**
  - Iniciar stack con `npm run demo:dev`.
  - Probar consultas reales en el diálogo de Iti IA:
    1. Búsqueda temática: *"Recomiéndame algo de ciencia ficción"*
    2. Búsqueda por autor o hábitos: *"Busco algo sobre hábitos y productividad"*
    3. Consulta sin coincidencias: *"Busco un manual de mecánica cuántica para submarinos"* $\rightarrow$ Verificar que se activa `askQuestion` sin inventar libros.
    4. Consulta ambigua: *"Recomiéndame un buen libro"* $\rightarrow$ Verificar que pide preferencias de lectura.

- [ ] **Paso 4.3: Revisión final de consola y documentación**
  - Verificar que no hay advertencias o errores en la consola del navegador.
  - Actualizar `docs/BOOK_DATA_AND_RAG.md` si hubo cambios en contratos.

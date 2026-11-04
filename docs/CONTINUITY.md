# Continuidad de Itinerante — 2026-11-04 (ronda 5, sesión en la nube)

- **CR4-01 cerrado:** Visita cierra en móvil con `--sec-sm` (48 + 48 del pie = 96, el tope de CR-14); la cruz de registro queda a 24 px del ladrillo y a 11 del rótulo (medido a 360, 390 y 414). Regla de ritmo actualizada en DESIGN.md.
- **CR4-02 cerrado:** desde 1600 px la columna derecha de Visita se fija en 560 px; a 1920 la izquierda termina 119 px antes que la derecha (antes 203), con la foto al ancho exacto de la tabla de horario.
- Verificación: `npm test`, `test:design`, crítica en baseline, tokens; `e2e.mjs` 97/97.
- Crítico (ronda 5, acotado a Visita): CR4-01 y CR4-02 cerrados; ritmo y espaciado 5, jerarquía y composición 4 (a 1920 el aire entre titular y horario sube a ~570 px: convención del sitio sin contenedor máximo; si se limita, que sea global). Sin defectos nuevos.

# Continuidad de Itinerante — 2026-11-04 (ronda 4, sesión en la nube)

- **CR3-05 cerrado:** la foto de llegada de Visita pasa a la columna derecha, bajo el horario y la nota de festivos (`index.html`; `.visit-arrival` con margen superior `--space-6`). Medido a 1280, 1440 y 1920: las dos columnas terminan a la misma altura y ya no quedan ~800 px vacíos junto a la foto; a 390 el capítulo cierra con la foto. Nota en DESIGN.md («Visita (escritorio)»).
- **`e2e.mjs` sin falsos positivos:** la comprobación de desborde ignora lo que recorta un antepasado con `overflow: hidden/clip` que cabe en la ventana (la IMG escalada 1.22 al revelarse). 97/97. Actualizados `tools/qa/README.md` y `docs/agentes/06-qa.md`.
- Verificación: `npm test` 132 + 18 + 4, `test:design` 72, crítica en baseline, tokens al día. Crítico (ronda 4, acotado a Visita): CR3-05 cerrado, jerarquía y composición 5, ritmo 4; capturas en `.tmp-audit/agentes/ronda-4/` de esta sesión.
- Abierto (baja, decisión de Aldo): **CR4-01** cruz de registro inferior de Visita en móvil a 8 px del ladrillo (cerrar con `--sec-sm` cambia la regla de ritmo documentada); **CR4-02** a 1920 la izquierda termina 203 px antes que la derecha (propuesta: `max-width` ~560 px en la foto desde 1600 px).

# Continuidad de Itinerante — 2026-11-04 (ronda 3 del bucle de maqueta, sesión en la nube)

Rama: `claude/cool-turing-37uiqt`, sobre `claude/maqueta-bucle-ronda3` (0f7e2b4). Seis commits: 41d1655, 55a0004, 3f0465d, ece8a79 y los dos siguientes. El estado efímero de los agentes (`.tmp-audit/agentes/`) no viaja entre máquinas: esta entrada lo resume.

## Cerrado con medición

- **QA1-04** · Tab en el carrusel: la tarjeta asomada recibía el foco sin desplazarse y quedaba recortada (390, 360 y 1280). `rail.js` la alinea al inicio con un oyente `focusin`; `tools/qa/rail.mjs` recorre las 24 paradas con Tab real (49/49).
- **CR-17** · Enlaces de capítulo de la cabecera de escritorio: de 30 a 44 px de alto (y ≥ 45 de ancho) con el texto centrado; el `hdr` sigue en 68 px.
- **CR3-01** · La pista (`data-hint`) pisaba al vecino («Temas y muestra» sobre Visita, «81 8087 5940» sobre Correo): etiqueta y pista comparten una celda de retícula y el enlace mide la más ancha. La pista de Libros pasa a «6 temas» (DESIGN.md ya la definía así).
- **QA3-01** · Regresión del anterior: el filete sobraba bajo «Visita». Ahora se pinta como fondo de la palabra visible y mide lo que mide el texto; con colores forzados es subrayado real.
- **CR3-02** · Explorar abre al toque con esqueletos y «Cargando la muestra…»; el catálogo se pide después. Con `catalog.json` retenido 2.5 s: hoja en 96 ms, tarjetas a los 4.3 s.
- **CR3-03** · Menú lateral: el acordeón abierto se lleva a la vista y el pie de la lista se funde (`data-more`) mientras haya más abajo (Visita y Mi lista en 360×740).
- **CR3-06** · Lista de pistas de DESIGN.md al día. **QA3-04** · `e2e.mjs` ya no marca `.sk-chip` como desborde. **CR3-07** · Dirección del perfil parte limpia en 360 px con el pin en la primera línea.

Verificación final: `npm test` 132 + 18 + 4, `test:design` 72, `critique.mjs` en baseline (sigue el aviso heredado de interlineado 1.03), tokens al día, `npm run test:browser` completo en verde (Chromium como root necesita `CHROME_PATH` con `--no-sandbox`), `e2e.mjs` 97 comprobaciones con solo los 4 falsos positivos documentados (IMG en `.frame-clip`).

## Abierto (decisión o ronda siguiente)

- **CR3-05 (baja, ux-movil-feed):** Visita en escritorio deja ~800 px vacíos junto a la foto de llegada (`.tmp-audit` de esta sesión: `d1280-05b-visita-2.png`). Propuesta del crítico: foto bajo el horario o a ancho completo.
- **CR3-04 (baja, paleta):** cabecera móvil con alfa 0.92 sin desenfoque; el documento la describe opaca. Decidir si se vuelve opaca o se documenta.
- **QA3-02 (baja):** con puntero fino quedan objetivos < 44 px: CTA de cabecera 134×40, Instagram en Cartelera 105×26, «Ver los 48 géneros» 144×30, filas de filtro 262×36, marca 222×36.
- **QA3-05 (baja):** a 320×640 la página mide 11.5 pantallas (el umbral ≤ 11 se mide a 390, donde da 8.7).
- **Miller:** el submenú Libros tiene 7 filas; reducir a ≤ 5 es decisión editorial.
- **CR-16** (registros de prueba A-Z) y el azul de portadas frías (tono 240) siguen siendo decisiones de Aldo.
- QA3-03 no aplica: el `AGENTS.md` de la rama ya describe B.4; `docs/AVANCES-Y-RAZONAMIENTO.md` es bitácora histórica.

# Continuidad de Itinerante — 2026-11-01

## Último avance: B.4 «Función de la casa» sustituye al sitio raíz

**Decisión de Aldo (2026-11-01):** el prototipo B.4 sustituye al sitio raíz anterior (Higgsfield `d599d36a`). Hay una sola home.

Qué se movió:

- A la raíz: `index.html`, `style.css`, `mobile.css`, `tokens.css` (generado), `app.js`, `catalog.js`, `motion.js`, `scenes-desktop.js`, `assets/{data,fonts,img,js/boot.js,seq,seq-m,provenance.json}` y `DESIGN.md` (el de B.4).
- `prototypes/itinerante-b4/check.mjs` pasó a `tests/site.test.mjs`; `preview.mjs` a `tools/preview-site.mjs`; `BRIEF.md` y `README.md` a `docs/B4-BRIEF.md` y `docs/B4-README.md`; `evidence/` a `docs/evidence/`. El directorio `prototypes/` ya no existe.
- El sitio anterior quedó en `_archive/models/higgsfield-d599d36a/` (`index.html`, `assets/`, `images/`, `DESIGN.md`, `tests/site.test.mjs`). Esa carpeta está ignorada por git; la historia de git es la copia recuperable (el último estado del sitio anterior está en los commits previos a esta promoción).

Documentación ajustada en esta pasada: `AGENTS.md`, `CONTEXT.md`, `PRODUCT.md`, `README.md`, `DESIGN.md`, `docs/B4-BRIEF.md`, `docs/B4-README.md`, `docs/ARCHITECTURE_AND_CONTEXT.md`, `docs/premium-site-architecture.md` (marcada como histórica) y, con nota de estado, `design-system/libreria-itinerante-y-mas/MASTER.md` y `pages/home.md`. La documentación de las secciones de abajo (septiembre) describe el sitio anterior y el catálogo con Iti IA en la interfaz; ya no corresponde a la UI publicada.

Estado real del sitio B.4: el catálogo es un JSON de muestra estático (500 registros de prueba) con búsqueda local; Iti IA existe como API en el Worker pero no está conectada a la interfaz. No se hizo commit, push ni deploy.

### Sigue pendiente (auditoría del 2026-11-01)

- **Contrato de datos del catálogo**: JSON de muestra estático de B.4 frente a `/api/catalog` con taxonomía controlada. Falta decidir y unificar.
- **Iti IA** no está integrada en la UI.
- **Límites de ritmo del Worker** (`IA_PER_IP`, `IA_GLOBAL`): sin validar en preview; `limit()` sin try/catch.
- **La API expone** calificación, reseñas y precio de referencia de Amazon, contra la regla de no publicar datos sin fuente.
- Los filtros `category`/`subgenre` de la API son incoherentes con las facetas; `condition` está fijo en `nuevo`.
- Sin inventario real, sin Data Connect conectado al Worker y sin Go.
- Restos de Supabase en el repositorio.
- Dominio de producción sin confirmar para `canonical`, `og:url` y sitemap; `index.html` conserva `noindex,nofollow` y `theme-color #100d0a` (hero ahora claro).
- Sin desplegar. Cloudflare es el destino; Vercel, Firebase y Next son legado.

---

# Continuidad de Itinerante — 2026-09-07

## Último avance: patrón Liquid Glass unificado

Se unificaron los CTA “Consultar y apartar” y “Descubrir con Iti IA” mediante
un componente de vidrio compartido con variantes primaria y secundaria. El
mismo vocabulario de transparencia, borde luminoso, desenfoque, profundidad y
estados se extendió a la acción del encabezado, navegación de capítulos,
categorías, selector de vista, paginación, buscadores y controles de Iti IA.
En móvil se corrigieron el recorte del CTA principal y la superposición entre
el acceso flotante a Iti IA y la navegación.

La revisión visual detectó además que el rescate por prefijo aplicaba las
traducciones añadidas por expansión semántica: `verse` podía emparejarse con
Verity o Veronica al consultar “Poesía”. El rescate ahora opera sólo sobre las
palabras escritas por la persona; las expansiones continúan disponibles para
coincidencias exactas verificables.

Validación: `npm.cmd test` 73/73 y `tests/browser-local.mjs` aprobado a
1440×900, 390×844, 820×700, 844×390 y 320×568. Capturas actuales en
`.tmp-audit/local-fix/*-glass-*.png`.

## Último avance: biblioteca digital e Iti IA

Se reconstruyó `#catalogo` tomando como referencia de interacción el proyecto
ECRMNL: búsqueda dominante, categorías visibles, contador, orden, vista de
cuadrícula/lista, carga progresiva y ficha detallada en diálogo. La navegación
de capítulos queda fija durante el recorrido y los controles se adaptan hasta
320 px. Se mantuvieron la identidad, los tokens y la arquitectura Vanilla de
Itinerante; no se copiaron marca ni datos de ECRMNL.

Iti IA ahora presenta una introducción breve y una lista de opciones con título,
autor, género/formato y procedencia. Se eliminó de la respuesta visible el texto
técnico de contingencia. Las expansiones en español cubren poesía, psicología y
fantasía, y el ranking ya no expande las etiquetas del documento como si fueran
la consulta. Si un filtro controlado no encuentra resultados, la recuperación
reintenta sobre el catálogo completo antes de declarar que no hay coincidencias.

Validación del 7 de septiembre:

- `npm.cmd test`: 73/73 (69 contratos principales y 4 de filtros).
- Compilación del backend Next: aprobada.
- `tests/browser-local.mjs`: aprobado a 1440×900, 390×844, 820×700,
  844×390 y 320×568; navegación, catálogo, diálogo, cuadrícula/lista, Iti IA,
  movimiento reducido y batería baja, sin errores de página.
- Consultas verificadas desde la UI: Literatura, Psicología, Fantasía y Poesía.
  Psicología y Fantasía devuelven opciones pertinentes. Poesía conserva una
  respuesta vacía clara porque el dataset de prueba actual no contiene una
  coincidencia verificable.
- La portada local y `/api/catalog` responden HTTP 200. Evidencia visual en
  `.tmp-audit/local-fix/` y análisis de referencia en
  `web-intel/ecrmnl/2026-09-06/`.

El catálogo visible sigue siendo el dataset de prueba Amazon de 500 registros y
cada ficha lo identifica como “Datos de prueba · no es inventario”. No hubo
importación a inventario, commit, push ni despliegue.

# Continuidad anterior — 2026-09-06

## Último avance: cierre del pendiente de Seguimiento

Se retomó el archivo raíz `Seguimiento`, interrumpido al detectar overflow a
320 px. La causa era el mínimo automático del panel de catálogo dentro de CSS
Grid: su formulario ensanchaba la columna a 336.64 px. Se añadió `min-width: 0`
a `.catalog-panel`; el documento y el panel ahora miden 320 px, con buscador y
filtros dentro del ancho disponible. No se oculta el desbordamiento global.

Validación del 6 de septiembre:

- `npm.cmd test`: 61/61 (57 contratos y 4 pruebas de filtros).
- `tests/browser-local.mjs`: aprobado a 1440×900, 390×844, 820×700,
  844×390 y 320×568; video hacia delante/atrás, seis secciones sin overflow,
  catálogo cargado, filtro Literatura, diálogo móvil, cambio de orientación,
  movimiento reducido y batería baja. Sin errores JavaScript `pageerror`.
- Se revisaron capturas de inicio en escritorio/320 px, catálogo a 320 px
  y diálogo móvil. Evidencias locales: `.tmp-audit/local-fix/`.
- El equipo tenía 17 % de batería y la página activó correctamente los
  fotogramas estáticos. La prueba ahora fija batería en carga para el video
  y verifica por separado la salida con batería baja.
- La primera consulta real usó ranking de contingencia por `fetch failed`
  dentro del sandbox. Tras autorizar el arranque fuera del sandbox, la consulta
  «Literatura.» desde la UI devolvió HTTP 200 en 10.0 s: el principal alcanzó
  el timeout y `gemini-3.1-flash-lite` completó la selección. Evidencia:
  `.tmp-audit/local-fix/ai-live.json` y `mobile-iti-ia-live.png`.

El pendiente concreto de `Seguimiento` queda cerrado. La selección utiliza
el dataset de prueba existente y muestra «Datos de prueba · no es inventario»;
esto no acredita inventario comercial ni publicación del backend. No hubo
cambios de modelos, importación de libros, commit, push o despliegue.

Siguiente paso de frontend: revisión táctil en dispositivo físico y los
escenarios de foco/red lenta/fallo/vacío del gate ampliado descrito abajo;
la prueba de escritorio automatizada no los sustituye. Los pendientes de
datos y conexión pública conservan sus propios límites de autorización.

## Último avance: segunda pasada bibliográfica

Se añadieron siete fichas al registro de evidencia y se amplió el contraste
de El fin del poder y Arte poética. Informe y fuentes:
[segunda pasada](research/goodreads-editorial-review-round2-2026-09-05.md).

- Dos coautorías corregidas: Silvia Salinas y Bruce R. Powers.
- Tinísima pasa de idioma desconocido a español, con respaldo bibliográfico.
- Y Matarazo no llamó… y Harakiri reciben síntesis editoriales breves con
  procedencia; las descripciones vacías originales se conservan en el crudo.
- Se proponen materias Novela para Garro y Tinísima usando el término existente.
- El ETL valida evidencia, longitud y taxonomía para esos nuevos campos.
- Se conservan las dos cuarentenas: confirmar a qué edición pertenece el ISBN
  no demuestra cuál pretendía representar el ID Goodreads.

Estado actual: 84 fichas, 82 candidatas, 2 en cuarentena, cero admitidas;
13 con contraste externo parcial y 71 sin él. Lenguas: 77 `es`, 5 `en`,
2 `mul`. Quedan dos descripciones ausentes y tres fichas con roles pendientes.
La cola de incidencias específicas tiene 33 fichas.

Validación nueva: `npm.cmd test` 60/60, Python unittest 7/7 y ETL `--check`
idéntico byte por byte. Sin cambios en frontend/API, importación a BD o despliegue.
El gate visual no se repitió; permanece pendiente por el navegador ausente
documentado en la primera pasada.

Siguiente paso: representar las variantes Horatius/Horácio sin duplicar autor;
verificar créditos de la antología y Fontamara; completar descripciones de
Arte poética y Poesía de Girondo; seguir con formas y materias. Las cuarentenas
requieren evidencia sobre la edición pretendida, no sustituir ISBN automáticamente.
Ninguna corrección parcial admite una ficha como `reviewed`.

## Avance anterior: primer lote de revisión editorial

Se contrastaron seis fichas con fuentes externas y se aplicaron decisiones
por campo, trazadas en `imports/kaggle-goodreads/editorial-review.json`.
Detalle y fuentes: [revisión editorial](research/goodreads-editorial-review-2026-09-05.md).

- `Arte poética` pasa de `es` a `mul` por su edición bilingüe.
- Josephs y Caballero quedan como editores en `Poema del Cante Jondo`;
  David Naimon como autor en `Conversaciones sobre la escritura`.
- `La noche de San Juan` y `El fin del poder` quedan en cuarentena por
  discrepancias entre ISBN y edición. No se reasignan sus ISBN.
- Se registran diferencias de paginación y materias aún pendientes.
- El ETL valida hash y valor anterior, conserva el crudo e impide promover
  fichas a `reviewed`. La búsqueda existente excluye las cuarentenas.

Estado actual: 84 fichas; 82 candidatas, 2 en cuarentena y 0 admitidas.
Seis tienen evidencia externa parcial; las otras 78 aún no. La cola de
incidencias específicas contiene 37 fichas. Las lenguas son 76 `es`, 5 `en`,
2 `mul` y 1 `und`, incluyendo las cuarentenas.

Validación nueva: `npm.cmd test` 59/59, Python unittest 6/6 y ETL `--check`
reproducible byte por byte. No se repitió build del backend porque no se
modificó backend/API. Los originales y el catálogo comercial siguen intactos.
No se importó a BD ni se desplegó.

Se intentó el gate visual: Computer Use no encontró navegadores y la apertura
de la URL local devolvió `No browser is available`. Continúa pendiente.

Siguiente paso: resolver las dos identidades en cuarentena y seguir con roles,
descripciones y materias; exigir contraste del resto antes de admitir fichas.
No tratar una corrección parcial como validación editorial completa.

## Avance anterior: normalización y recuperación bibliográfica local

Se retomó el pendiente explícito de `Seguimiento`: normalizar las 84 candidatas
y evaluar su recuperación antes de ampliar la importación. La etapa local está
implementada en `scripts/etl-goodreads.py` y `src/lib/reference-search.js`.
Instrucciones y contrato: [CATALOG_DATASET_AND_MODEL.md](CATALOG_DATASET_AND_MODEL.md#implementación-local--2026-09-05).

- CSV original contrastado por SHA-256 y por cada campo de las fichas candidatas.
- 84 identidades estables de Goodreads; 80 ISBN-13 válidos por dígito de control.
- 77 fichas `es`, 5 `en`, una `mul` y una `und`; cuatro sin descripción.
- Roles explícitos separados de la autoría provisional; siete fichas con roles
  por resolver y una con lista de colaboradores truncada.
- Materias múltiples propuestas mediante alias versionados en la taxonomía
  existente. Etiquetas sin correspondencia conservadas; no se infiere nacionalidad.
- 36 fichas con incidencias específicas en `normalization-quality.json`.
  Las 84 siguen `candidate`; las otras 48 tampoco equivalen a revisión editorial.
- Búsqueda local por título, ISBN, autor, colaborador, materia y descripción;
  filtros antes del límite. No se generan embeddings ni se modifica el RAG actual.
- `reference` es por ahora un contrato de preparación local. No se añadió al
  importador de inventario ni a las APIs; buscar candidatas requiere opt-in explícito.

Validación actual: `npm.cmd test` 58/58 (incluye veinte consultas fijas dentro
del test de recuperación), Python unittest 5/5, `etl-goodreads.py --check`
idéntico byte por byte y `npm.cmd run dataconnect:verify` aprobado.
`npm.cmd run backend:build` aprobado, incluidos compilación y chequeo de tipos.
El catálogo anterior, inventario y originales permanecen intactos. Sin importación
de BD, migración ni despliegue. No hay validación nueva en navegador.

Siguiente paso de datos: resolver la cola editorial, verificar correspondencia
de edición/idioma/ISBN y roles, y definir qué fichas pueden pasar a `reviewed`.
Después aplicar el modelo aditivo en un entorno local aislado y unificar la
recuperación con procedencia de embeddings antes de conectar API/Iti IA. El gate
visual del frontend descrito abajo sigue pendiente; la búsqueda lexical local
no acredita recuperación semántica ni operación pública de extremo a extremo.

## Antecedentes del 4 de septiembre

## Actualización posterior: nueva fuente bibliográfica

Aldo pidió conservar por ahora el catálogo actual y buscar en Kaggle literatura
mexicana, poesía, psicología y filosofía, tomando ECRMNL como referencia de
estructura. Se descargaron y perfilaron dos fuentes. GoodReads Best Books es
la candidata elegida; se prepararon 84 fichas bibliográficas preliminares.
La comparación, cobertura, límites y modelo propuesto están en
[CATALOG_DATASET_AND_MODEL.md](CATALOG_DATASET_AND_MODEL.md). El siguiente paso
de datos al cierre del día 4 era normalizar esas candidatas y diseñar el modo bibliográfico
`reference`, sin convertirlas en inventario ni reemplazar el catálogo actual.
No se aplicaron migraciones, importaciones de BD ni despliegues.

## Punto recuperado

Aldo confirmó que el trabajo de la sesión anterior era mejorar primero la UX/UI
con Impeccable. La siguiente fase es conectar la búsqueda del catálogo y el RAG
real. No se recuperó el mensaje de cierre de aquella sesión; este checkpoint
se apoya en la aclaración de Aldo y en el código actual.

`index.html` sigue siendo la única home. `PRODUCT.md`, `DESIGN.md`, `CONTEXT.md`
y `design-system/libreria-itinerante-y-mas/MASTER.md` fijan la composición de
Claude Design y el uso de Higgsfield exclusivamente para medios y movimiento.
`AGENTS.md` conserva una descripción anterior del modelo y de Git; esa
discrepancia está identificada, sin modificar instrucciones como efecto lateral.

## Avance de frontend en esta continuación

- Estado y recuperación del catálogo trasladados de la fotografía al panel de
  búsqueda, después de los filtros, para mantenerlos cerca de la acción en móvil.
- Peticiones de catálogo e Iti IA acotadas a 90 segundos mediante AbortSignal.
- Protección contra consultas superpuestas del catálogo.
- Pregunta fallida de Iti IA recuperada en el campo si no hay un borrador nuevo;
  reintento sin duplicar el turno fallido en el historial enviado al servidor.
- Conservadas composición, medios, navegación y separación entre datos de prueba
  e inventario. No se modificó el backend ni se desplegó.

Validación: `npm.cmd test`, 54 pruebas aprobadas. La nueva comprobación ejecuta
el runtime con una respuesta de red fallida y posterior reintento; cubre tanto
campo vacío como borrador nuevo. No reemplaza una prueba en navegador.

Impeccable: contexto cargado para `index.html` y detector ejecutado una vez sobre
HTML, CSS y JS. Reportó 3 warnings y 20 avisos tipográficos. Inter está fijada
por el diseño; el escenario audiovisual a sangre explica el aviso de padding.
Se ajustó el tamaño del estado modificado a la escala de DESIGN.md. Los demás
avisos de tamaños existentes quedan para la revisión visual; no se declara el
detector limpio ni se cambió el diseño para silenciarlos.

## Gate pendiente de frontend

No hubo navegador disponible mediante Computer Use. Las capturas heredadas de
`.tmp-audit/cdp-*.png` sirven como evidencia anterior, no verifican estos cambios.
Al recuperar navegador: una pasada conjunta a 390, 768 y 1440 px de inicio,
scroll descendente/ascendente, catálogo y diálogo. Comprobar foco, teclado,
movimiento reducido, red lenta, fallo, ausencia de coincidencias y resultados.
En móvil, confirmar que el estado y la recuperación se leen junto a los filtros.

## RAG: código existente y brechas verificadas

Hay una base previa en `src/app/api/catalog/route.ts`, `src/ai/iti-ia.ts`,
`src/lib/test-catalog.ts`, `scripts/import-books.mjs` y `dataconnect/`.
La presencia de esos archivos y las pruebas actuales no acredita operación
real de extremo a extremo ni despliegue.

1. **Fuente de datos pendiente.** `data/books.amazon-test.json` es un dataset de
   prueba. `data/books.inventory-001.json` contiene una ficha piloto de Pedro
   Páramo que dice explícitamente «No publicar» y declara precio/existencias
   pendientes, aunque guarda `status: active` y `stockQty: 1`. No usar esa ficha
   como evidencia de inventario comercial. Quedó preguntado a Aldo dónde está
   el catálogo autorizado. No se importó ni se alteró la ficha en esta sesión.
2. **Recuperación inconsistente.** La ruta de catálogo llama directamente a
   `searchInventoryBooks` (Vertex `text-embedding-005`), mientras Iti IA puede
   elegir `searchInventoryBooksByVector` con Gemini según
   `INVENTORY_EMBEDDINGS`. La importación usa otra variable, `EMBEDDINGS`.
   Unificar la elección y registrar/verificar la procedencia del vector antes
   de conectar un inventario. No mezclar espacios vectoriales.
3. **Filtros y relevancia.** La ruta de catálogo filtra después de recuperar;
   la variante Gemini también filtra después de limitar resultados. Aplicar
   filtros antes del límite y comprobar título/autor exactos además de tema e
   intención. Una búsqueda de catálogo necesita recuperación; la generación
   de recomendaciones fundamentadas pertenece a Iti IA.
4. **Conexión pública ausente en configuración.** `tools/static-server.mjs`
   ofrece proxy local, pero `firebase.json` no contiene rewrites para `/api`.
   Resolver dónde se ejecuta el backend antes de publicar; el proxy local no
   demuestra que Firebase Hosting sirva las rutas.
5. **Gate de datos insuficiente.** `scripts/check-inventory-rag.mjs` exige el
   slug de la ficha piloto. Sustituir esa expectativa por casos sobre el catálogo
   autorizado: título, autor, consulta temática en español, categoría, ausencia
   de resultados, fuente verificable y fallo del proveedor.

## Siguiente ejecución

Cerrar primero el gate visual del frontend. Para el backend, confirmar la fuente
autorizada y distinguir catálogo bibliográfico de existencias verificadas;
reutilizar el importador y la recuperación existentes. Unificar proveedor de
embeddings, filtros y contratos de búsqueda/IA; comprobar importación y consulta
en un entorno local aislado. Ejecutar pruebas, compilación de backend y el gate
de recuperación sobre datos autorizados. Sólo declarar RAG real cuando una
consulta desde la UI devuelva fichas trazables del catálogo elegido.

No inferir autorización para importar a producción, aprovisionar servicios o
desplegar a partir de este checkpoint.

# Avances y razonamiento — sesión 2026-09-07
**Proyecto:** Librería Itinerante y Más (`C:\Proyectos\Itinerante`)
**Estado al cierre:** `npm test` → 72 pass, 0 fail · `tsc --noEmit` limpio
**Servidor:** `http://127.0.0.1:8080/` (sirve disco directo, sin build)

> Mañana continuamos con detalles. Este documento registra QUÉ cambió, POR QUÉ
> (cadena de razonamiento) y QUÉ FALTA, para retomar sin reconstruir contexto.

---
## 1. Jerarquía tipográfica y respiro (saturación del landing)

**Síntoma:** todo gritaba al mismo volumen; ventana saturada.
**Diagnóstico:** todos los `h2` usaban escala display (`clamp(2.45rem, 5vw, 4.8rem)`)
y la cita del puente llegaba a 5.4rem. Nada destacaba porque todo destacaba
(Prägnanz + Von Restorff rotos).
**Cambios** (`assets/css/higgsfield-site.css` + `DESIGN.md`):
- `h2` global → `clamp(1.9rem, 1.2vw + 1.6rem, 2.9rem)`; el Display queda
  reservado al hero.
- Cita del puente 5.4→2.9rem máx; `chapter-next`, diálogos y fichas reducidos
  en proporción.
- Filas de Experiencia compactas, galería con más aire (`gap` 14→16px),
  filtros del catálogo en `.85rem` manteniendo 44px táctiles (Fitts intacto).

## 2. Sala verde: fin del blanco sólido

**Síntoma:** bloque blanco entre dos oscuros; fatiga visual; rompía la lógica
del recorrido oscuro.
**Decisión (usuario, opción A):** galería + catálogo a verde sala/tinta.
**Cambios:** ambas secciones en gradientes oscuros con borde de región
definido; papel reservado a islas (tarjetas, buscador, modales — Von Restorff);
textos secundarios a papel tenue; error sobre oscuro aclarado (`--status-error-light`).
Se agregaron tokens `--status-error` / `--status-error-light` a `:root`
(antes eran hex hardcodeados = deriva del sistema).

## 3. Reestructura de Experiencia + anclaje del nav

**Síntoma:** barra de capítulos "suelta", sección separada sin armonía.
**Diagnóstico profundo:** el nav nacía tras un hero de 100dvh y antes de un
vacío de 90vh sin borde compartido (Conexión Uniforme rota); Experiencia eran
dos cajas de vidrio separadas hasta 110px (Proximidad rota); 6 voces display
apiladas; `scroll-margin` de 24px escondía los anchors bajo la barra fija.
**Cambios (solo CSS):**
- Nav solapado 64px al pie del hero (nace como su cierre, luego persiste fija).
- Experiencia a una región: cabecera editorial sin caja (título + descripción
  en fila) + mosaico 2×2 con divisores; "Siguiente capítulo" como pie de
  sección (Goal-Gradient).
- `scroll-margin-top` 24→84px: los capítulos aterrizan visibles.
- Responsive: todo colapsa a una columna ≤980px.

## 4. Súper-auditoría (motor `impeccable audit + critique`, 14/20 → ~17/20)

**P0 — Catálogo que explotaba la página:** el backend no pagina
(`slice(0, limit)` hasta 60 tarjetas de 360px) y el grid se reemplazaba entero
por filtro. Fix: **paginador 9/pág** (Anterior/Siguiente + "Mostrando X–Y de Z"),
sin vaciar la retícula antes de tener datos, `content-visibility` en tarjetas.
**P1:**
- 7 acciones en el primer viewport → hero con 1 primario ("Descubrir" degradado
  a enlace textual; Cowan ≤4).
- Coral `#e8a020` sobre tarjetas claras ≈2.2:1 (falla AA) → género y enlaces a
  verde sala; coral solo sobre oscuro.
- Doble numeración capítulos 01–04 vs galería 01–05 → números de galería
  eliminados (Recuerdo/Nielsen 6).
- Muro de 11 controles → filtros en fila horizontal con scroll (una sola eje,
  Serial Position).
- Ámbar en 6+ lugares → solo señales (Signal Amber Rule enmendada en DESIGN).

## 5. Puente reescrito (cálido/directo, pedido explícito)

> **Ven a conocer la casa.**
> Estamos en el centro de Monterrey. Hay libros, café y actividades culturales.
> Escríbenos y te contamos qué hay estos días.

Una sola mención de lo que hay (antes repetía el hero), sin testimonios
inventados ni fechas. Nota: se buscó `.exe` visible en el sitio — no existe;
solo coincidencias internas de código (`executeGraphql`, `exec_module`).
Pendiente que el usuario indique dónde los ve.

## 6. Buscador afinado (fallas internas reales)

**P0 — Búsqueda rota con filtros:** `searchInventoryBooks` inyectaba
`subgenre.slug = undefined` en el `where` de GraphQL → toda búsqueda de
inventario con texto fallaba y todo Iti IA con filtro de solo-categoría erraba
y caía al reintento sin filtros. Fix: `where` condicional
(`src/lib/test-catalog.ts`).
**P1 — Recall ciego:** 11 expansiones ES→EN (terror, distopía, clásicos,
manga/cómic, novela negra, cuentos, teatro, espiritualidad, feminismo,
true crime, ciencia) + stopwords ("busco", "dame", "recomiéndame"...).
**P1 — Dedazos:** rescate por prefijo que solo puntúa score-0 (no reordena
ganadores; verificado contra goldens).
**Enriquecimiento:** `enrich-google-books.mjs` ahora rescata
`averageRating/ratingsCount` al manifiesto. **No hay scraping de Amazon**
(bloqueo anti-bot + Términos + sin API pública): teardown funcional en
`docs/BOOK_FUNCTIONS_AMAZON.md` con mapeo hecho/pendiente; datos por
Google Books API + Open Library (oficiales, con fuente conservada).
**Bug propio detectado y corregido:** `mode` sin declarar en
`renderCatalogPage` (retícula permanentemente rota) → `catalogModeIsTest`.

## 7. Funciones Amazon construidas

1. Sugerencias al escribir (`datalist` con títulos/autores, cero llamadas).
2. Facetas con conteo ("Literatura · 18").
3. Orden: relevancia, A–Z, **Novedades**, **Mejor valorados**.
4. Rating en tarjeta (`★ 4.7 (1,234) · Fuente`, solo dato real).
5. Relacionados en ficha (3 del mismo subgénero).

## 8. Iti IA persistente + salto directo a obra

- Píldora fija abajo-derecha (avatar `Logo.webp` + "Iti IA", 56px) que abre el
  mismo diálogo modal; auto-hide al bajar / show al subir (respeta
  `reduced-motion`); elevada sobre safe-area.
- "Ver ficha del libro" **siempre aterriza en la ficha**: directo si está en
  caché, o busca y abre el mejor resultado (vale para todos, no solo la
  primera).
- **MASTER.md enmendado:** acceso persistente por píldora; diálogo siempre
  modal/contextual.
- Diálogo rediseñado: cabecera con avatar + propósito, **predicciones estilo
  NotebookLM** (3 iniciales + hasta 4 vivas del catálogo al escribir),
  recomendados como tarjetas con portada + acciones en fila.
- Plan `impeccable layout` ejecutado: scrollbars fantasma eliminadas
  (no-scrollbar + fade; `scrollbar-gutter: stable`), ritmo tipográfico en las
  4 zonas, etiquetas TÚ/ITI IA solo en cambio de turno.

## Archivos tocados

`index.html` · `assets/css/higgsfield-site.css` · `assets/js/higgsfield-site.js` ·
`src/lib/test-catalog.ts` · `src/lib/local-test-search.js` ·
`scripts/enrich-google-books.mjs` · `DESIGN.md` ·
`design-system/libreria-itinerante-y-mas/MASTER.md` ·
`docs/BOOK_FUNCTIONS_AMAZON.md` (nuevo) ·
`tests/search-quality.test.mjs` + `tests/catalog-ui.test.mjs` (nuevos) ·
`package.json` (harness).

## Cadena de pensamiento (cómo se llegó aquí)

1. **Observar antes de tocar:** cada síntoma se midió en fuente (clamps,
   queries GraphQL, registros de datos) antes de proponer.
2. **Leyes como diagnóstico, no decoración:** cada fix cita la ley que lo
   justifica (Prägnanz, Hick, Fitts, Región Común, Proximidad, Von Restorff,
   Cowan, Nielsen 6).
3. **Contratos mandan:** MASTER/DESIGN/PRODUCT/taxonomía/tests acotan cada
   cambio; cuando el usuario pidió algo contra el contrato (píldora), se
   implementó avisando la tensión y se enmendó el contrato.
4. **Sin datos inventados:** ratings/fichas solo con fuente; tests solo
   estructurales + puros (sin emulador); lo no verificable visualmente se
   declaró (squint test pendiente del usuario).
5. **Un escritor, cambios mínimos:** CSS-first; JS solo donde CSS no alcanza;
   backend solo el `where` roto; `DESIGN.md` sincronizado en cada pase.

## Pendiente para mañana (detalles)

- [ ] Squint test visual por el usuario (orden: cabecera → predicciones →
      mensajes → formulario).
- [ ] Pintar ratings del manifiesto en tarjetas (dato ya rescatado).
- [ ] "También compraron" → ya existe como relacionados; evaluar "Look Inside"
      con `accessInfo` de Google Books.
- [ ] Estante "destacados" + página de autor (requieren decisión editorial).
- [ ] Indicar dónde aparecen los `.exe` que preocupan.
- [ ] `rag:test` contra emulador (requiere `DATA_CONNECT_EMULATOR_HOST`) para
      validar goldens con las nuevas expansiones.

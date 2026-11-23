# Segunda crítica de diseño · «La camioneta» (antes de código) · 22 nov 2026, 16:10 (hora de Monterrey)

Fuentes: `itinerante-design-2026-11-22/DESIGN-DIRECTION.md` (§9 autocrítica 27/32 y 15/20), `prototipo/` servido en local y `video/movimiento-1440.mp4`.
Mi medición: Playwright + axe a 1440 y 390, normal y `reduce`, sin JS, teclado real, swipe táctil por CDP y rueda sobre la vitrina. Datos en `/workspace/itinerante-critique/camioneta/audit.json`; capturas y fotogramas del video en la misma carpeta.
No toqué el repo ni archivos de la revisión de diseño o de la crítica de diseño.

## Veredicto: va, con 2 P1 propios además de los de la crítica de diseño

La dirección tiene identidad y el riesgo de slop es bajo. Coincido con la crítica de diseño en el veredicto y en el P0 «Próximamente».
Lo que la crítica de diseño no vio y yo sí:
- la vitrina, que es el momento de autor, no tiene foco visible;
- el filtro FLIP pinta libros encima de Visita;
- el estante abre con portadas placeholder.

## Coincidencias con la crítica de diseño (sin repetir)
- Coincido con la crítica de diseño P0-1 («Próximamente» contradice a Aldo).
- Coincido con la crítica de diseño P1-1 (sin JS, página vacía). Mido lo mismo: 345–362 caracteres, 0 `.libro`; las secciones eventos y tienda tienen 7 y 6 caracteres.
- Coincido con la crítica de diseño P1-2 (estante de 8,810 px a 390; documento de 14,534 px).
- Coincido con la crítica de diseño P1-3 («41» frente a «5 de 32»).
- **Coincido con la crítica de diseño P1-4 y aporto evidencia:**
  - Rueda sobre la vitrina: la página avanza 600 px de 600, así que no hay scroll-jacking.
  - Swipe vertical sobre la vitrina: la página baja (y 1433 → 1729).
  - Un swipe horizontal de 180 px avanza **3 libros** (5 → 8 de 32). El criterio que propone la crítica de diseño («un lanzamiento corto avanza 1 libro») hoy **falla**, incluso en headless. Hay que limitar la inercia a ±1 por gesto corto.
- **Discrepo de la crítica de diseño** en «foco de 3 px en todo»: ver P1-A.
- Coincido con la crítica de diseño en los P2 1–8. Sobre el P2-7, la causa es concreta: con movimiento se descargan 943 KB de imágenes y con `reduce` solo 344–377 KB. La vitrina pide las 32 portadas al cargar. **Fix:** `loading=lazy` o cargar solo ±3 alrededor del centro.

## P1 nuevos

**P1-A. La vitrina no muestra foco.**
- `.vitrina{outline:none}` va después de `:focus-visible` y lo anula. Medido con Tab real: outline `none`, box-shadow `none`, border `none`. Captura: `1440-vitrina-foco.png`.
- Es la única parada de Tab de 32 libros y el momento de autor. Quien navega con teclado no sabe que está dentro, ni que las flechas funcionan.
- La autocrítica de la revisión de diseño no lo detecta, y la crítica de diseño afirma lo contrario.
- **Fix:** `.vitrina:focus-visible{outline:3px solid var(--ambar);outline-offset:6px}`, o el anillo sobre la portada central. Añadir además una pista visible «← → para hojear» mientras tiene el foco.
- **Done:** con Tab real, al llegar a la vitrina el indicador tiene contraste ≥ 3:1 contra la noche (WCAG 2.4.11/1.4.11), con captura a 1440 y a 390.

**P1-B. El filtro FLIP pinta libros fuera del estante y mueve la página.**
- En el video, fotogramas f21–f23 (`frames/sheet3.jpg`): al filtrar «Poesía» o «Capítulo Siete», las portadas en vuelo se dibujan **encima del H2 «Visita»** y de la foto.
- Al quedar 3 resultados, el estante colapsa y Visita sube justo debajo de los filtros fijos. Al volver a «Todos», el usuario queda en otro punto de la página.
- La autocrítica dice que no hay CLS (`CLS 0` a 390). Es cierto solo porque el layout-shift API no cuenta los transforms; para la vista es un salto.
- **Fix:**
  - `#libros{overflow:clip}` durante el FLIP;
  - fijar `min-height` del grid al alto previo mientras dura la animación y soltarlo después;
  - tras filtrar, si el borde superior del estante quedó fuera de la vista, llevar el scroll a ese borde menos la altura de los filtros;
  - con `reduce`, sin FLIP.
- **Done:** en una grabación filtrando Todos → Poesía → Todos, ninguna portada aparece fuera de la caja de `#libros`, y la parte superior del estante queda en la misma posición en la vista (±8 px).

**P1-C. El estante abre con placeholders.**
- El estante sigue el orden de la hoja: 3 de los 5 primeros a 1440 (Hipercódex, Pongo esta fruta, Tres tristes) y 2 de 4 a 390 son la tapa genérica con el título repetido (`390-estante-arriba.png`).
- La primera impresión de la tienda es «faltan portadas», justo después de una vitrina que solo muestra portadas reales. Eso es el olor a plantilla que el documento quiere evitar.
- **Fix:** orden por omisión «con portada primero, luego por editorial y título». No es inventar un criterio: es un orden de presentación, no una curaduría.
  - En la tapa genérica, quitar el título repetido del pie, o el de la tapa: hoy sale dos veces seguidas.
  - Cuando Roberto mande portadas, el orden se corrige solo.
- **Done:** la primera fila a 1440 y los 4 primeros a 390 tienen portada real; la tapa genérica no duplica el título.

## P2 nuevos
1. **El estante no tiene encabezado.** `#libros` no tiene H2: la jerarquía medida es H2 Tienda → H3 Rito… → H2 Visita, y los 41 libros quedan sin título navegable con lector de pantalla. **Fix:** H2 visible «Todos los libros» o H2 `sr-only`. **Done:** el lector lista el H2 del estante.
2. **El foco del buscador es casi invisible.** `.buscar input:focus{outline:none;box-shadow:0 0 0 3px rgba(6,26,24,.15)}` deja un halo de ≈1.3:1 sobre el papel; solo cambia el color del borde. **Fix:** usar `:focus-visible` global, o un borde de 2 px en noche. **Done:** el indicador tiene ≥ 3:1.
3. **Libro sin precio (Las ruinas de la caza).** ~~Fix «Precio en tienda»~~ retirado tras la objeción de la crítica de diseño: es texto sustituto de precio, prohibido por §8.13 y la spec v2 (sin precio no se imprime nada). Queda como pendiente de negocio: Roberto da el precio y, hasta entonces, la tarjeta va sin línea de precio. **Done:** el precio de Roberto está en los datos, o la tarjeta sigue sin precio y sin texto sustituto.
4. **Pesos de fuente.** Se cargan 6 caras (134 KB), entre ellas Barlow Condensed 500, que §5 no usa. **Fix:** subconjunto latino, woff2 local y solo las caras usadas (va junto con la crítica de diseño P2-6). **Done:** ≤ 4 caras y ≤ 80 KB.
5. **CLS de 0.032 a 1440,** a los 284 ms, por `envoltura` y `NAV` (cambio de fuente desde el CDN). Está bajo el umbral, pero con `size-adjust` en la fuente de respaldo baja a ~0. **Done:** CLS < 0.01.

## Lo que verifiqué y pasa (sin repetir lo de la crítica de diseño)
- No hay texto sobre imagen ni fallas de contraste calculado en las 4 combinaciones.
- `overflowX` 0 y ningún control < 44 px fuera del enlace en línea (la crítica de diseño P2-4).
- `Consultar disponibilidad por WhatsApp` está en la ficha (app.js:255), con el mensaje correcto y sin precio cuando falta.
- La portada de «Las ruinas de la caza» tiene procedencia en `assets_provenance.json`.
- Con `reduce`, 0 elementos ocultos al inicio. Con movimiento, 4 portadas de la camioneta empiezan en `opacity:0` y entran animadas, lo cual está bien porque es mejora sobre contenido ya presente.

## Rango frente a la autocrítica de la revisión de diseño
El 27/32 es razonable para la dirección. En cambio, el 15/20 de audit está alto: P1-A (foco) y P1-B (FLIP) caen en accesibilidad y robustez, y la autocrítica no los menciona. Yo le daría **13/20** hasta cerrarlos.

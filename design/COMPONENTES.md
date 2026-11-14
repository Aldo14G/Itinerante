<!-- GENERADO por scripts/build-componentes.mjs desde design/componentes.json y design/tokens.json. No editar a mano: `npm run componentes`. -->

# Componentes del sitio · «Itinerante Líquido»

Catálogo de 25 componentes (versión 2026-11-14). La fuente es `design/componentes.json` (formato plano inspirado en `registry-item.json` de shadcn/ui, MIT; origen en `docs/ux/FUENTES.md`). `tests/componentes.test.mjs` comprueba que existe todo lo que nombra (archivos, selectores, funciones, tokens y herramientas), que cada estado declarado está en el CSS o el JS con su condición (hover solo dentro de `@media (hover: hover)`, foco con `:focus-visible`, movimiento solo bajo `.motion` o neutralizado con `prefers-reduced-motion`…) y el contraste de cada par en claro y oscuro.

Regla de atributos: **clase = parte o variante, `aria-*` = estado, `data-*` = gancho de JavaScript** (DESIGN.md).

## Tabla de estados por control

«sí» = el estado existe y la prueba lo encuentra; «—» = no aplica (la razón va en el detalle); en blanco = el componente no lo declara.

| Componente | Hover (puntero fino) | Foco visible | Presionado | Deshabilitado | Seleccionado | Actual | Expandido | Ocupado | Vacío | Error | Mov. reducido |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Boton | sí | sí | sí | sí | sí |  |  |  |  |  | sí |
| BotonGuardar | — | sí | sí |  | sí |  |  |  |  |  | sí |
| Chip | sí | sí | sí |  | sí |  | sí | sí |  |  | sí |
| Recorrido | — | — |  |  | sí |  |  |  |  |  | sí |
| BarraNavegacion | sí | sí |  | — |  | sí |  |  |  |  |  |
| MenuHamburguesa | sí | sí | sí |  |  | sí | sí |  |  |  | sí |
| BarraInferior | — | sí | sí |  |  | sí |  |  |  |  |  |
| Carrusel3D | — | sí | sí | sí |  | sí |  |  |  |  | sí |
| CarruselPortadas (variante de Carrusel3D) |  |  |  |  |  | sí |  | sí |  | sí |  |
| CarruselEventos (variante de Carrusel3D) |  | sí |  |  |  | sí |  |  | — |  |  |
| CarruselCarta (variante de Carrusel3D) |  |  |  |  | sí |  |  | sí | sí |  |  |
| TarjetaLibro | sí | sí | sí |  |  |  |  | sí |  |  | sí |
| FichaLibro | sí | sí | sí |  |  |  |  |  |  |  | sí |
| MiLista | — | sí |  |  |  |  |  |  | sí | sí | sí |
| CampoBusqueda | sí | sí |  |  | sí |  | sí |  |  |  |  |
| Explorar | sí | sí | sí |  | sí |  | sí | sí | sí | sí | sí |
| Aviso | — | sí |  |  |  |  |  |  |  |  |  |
| EncabezadoSeccion | — | — |  |  |  |  |  |  |  |  | sí |
| TiraCasa |  | sí |  |  |  |  |  |  |  |  | sí |
| MapaLlegada | — | sí |  |  |  |  |  |  |  |  | sí |
| InterruptorMovimiento | sí | sí | — | sí | sí |  |  |  |  |  | sí |
| ContactoPie | sí | sí | — |  |  |  |  |  |  |  |  |
| Insignia | — | — |  |  |  |  |  |  |  |  |  |
| Esqueletos |  |  |  |  |  |  |  | sí |  |  | — |
| CarruselNovedades | sí | sí | sí | sí |  |  | sí | sí | sí |  | sí |

Estados propios de algún componente, fuera de la tabla: `oculto`, `tactil`, `plano`, `abriendo`, `abierto`, `colores_forzados`, `cerrado` (ver el detalle).

## Pares de contraste

Calculados desde `design/tokens.json`. Texto ≥ 4.5:1 (WCAG 1.4.3); borde de control, icono y foco ≥ 3:1 (WCAG 1.4.11). `vidrio@peor`: el vidrio compuesto sobre negro (claro) o blanco (oscuro). `mezcla:a+b@p`: `color-mix(in oklab, a, b p%)`, el hover de chips y botones.

| Frente | Fondo | Tipo | Mínimo | Claro | Oscuro | Dónde |
|---|---|---|--:|--:|--:|---|
| `en-primario` | `primario` | texto | 4.5 | 6.33 | 7.71 | Boton primario, chip elegido, guardado, Insignia de conteo, «Nuevo» |
| `en-primario` | `primario-presionado` | texto | 4.5 | 9.05 | 10.25 | Boton primario presionado y con el cursor |
| `en-menta` | `menta` | texto | 4.5 | 7.69 | 6.54 | Boton secundario, actual de la barra y del menú, pastilla de la barra inferior, Insignia de tipo, acción del Aviso, selección de texto |
| `en-menta` | `mezcla:menta+en-menta@10` | texto | 4.5 | 6.51 | 5.31 | Boton secundario con el cursor |
| `turquesa-texto` | `fondo` | texto | 4.5 | 6.33 | 11.44 | Boton plano, Recorrido («N de 3 paradas hojeadas»), enlaces |
| `turquesa-texto` | `fondo-2` | texto | 4.5 | 5.92 | 10.32 | Boton plano sobre banda, «Limpiar todo» en la hoja |
| `turquesa-texto` | `fondo-3` | texto | 4.5 | 5.37 | 7.78 | Boton plano con el cursor |
| `turquesa-texto` | `superficie` | texto | 4.5 | 6.33 | 8.81 | «Ver todos los resultados» de las sugerencias |
| `tinta` | `fondo` | texto | 4.5 | 16.84 | 16.40 | Texto de lectura, TarjetaLibro, campo con foco |
| `tinta-2` | `fondo` | texto | 4.5 | 6.88 | 10.92 | Entradilla, autor y precio de la tarjeta, nota del interruptor |
| `tinta` | `fondo-2` | texto | 4.5 | 15.73 | 14.80 | Bandas, ContactoPie |
| `tinta-2` | `fondo-2` | texto | 4.5 | 6.43 | 9.85 | Bandas, rótulos de filtros |
| `tinta` | `fondo-3` | texto | 4.5 | 14.27 | 11.15 | Chip en reposo, CampoBusqueda, «Quitar» de Mi lista |
| `tinta-2` | `fondo-3` | texto | 4.5 | 5.84 | 7.42 | Boton deshabilitado, Insignia callada, marcador del campo, «Buscar en el catálogo» |
| `tinta` | `mezcla:fondo-3+tinta@6` | texto | 4.5 | 12.51 | 9.54 | Chip y «Buscar en el catálogo» con el cursor |
| `tinta-2` | `mezcla:fondo-3+tinta@6` | texto | 4.5 | 5.11 | 6.35 | «Buscar en el catálogo» con el cursor |
| `tinta` | `superficie` | texto | 4.5 | 16.84 | 12.63 | CarruselEventos y CarruselCarta (tarjeta), sugerencias |
| `tinta-2` | `superficie` | texto | 4.5 | 6.88 | 8.41 | Descripción de la carta, clave de la sugerencia |
| `tinta` | `vidrio@peor` | texto | 4.5 | 11.58 | 8.33 | BarraNavegacion, BarraInferior, Boton vidrio, Guardar sobre la portada |
| `tinta` | `vidrio-hoja@peor` | texto | 4.5 | 13.49 | 11.04 | MenuHamburguesa, FichaLibro, MiLista, Aviso |
| `tinta-2` | `vidrio-hoja@peor` | texto | 4.5 | 5.51 | 7.35 | Semana del menú, autor de la ficha, nota de la ficha |
| `tinta` | `mapa-calle` | texto | 4.5 | 16.84 | 9.31 | MapaLlegada: nombres de calle con halo |
| `tinta-2` | `mapa-calle` | texto | 4.5 | 6.88 | 6.20 | MapaLlegada: nombres menores con halo |
| `foco` | `fondo` | foco | 3 | 6.33 | 11.44 | anillo-foco: 2 px de fondo y 2 de foco (todo control) |
| `foco` | `fondo-2` | foco | 3 | 5.92 | 10.32 | Anillo en una banda |
| `foco` | `fondo-3` | foco | 3 | 5.37 | 7.78 | Filete interior de las casillas con el cursor |
| `foco` | `superficie` | foco | 3 | 6.33 | 8.81 | Anillo junto a una tarjeta |
| `foco` | `menta` | foco | 3 | 5.38 | 6.54 | Filete interior en la fila actual del menú y la pastilla de la barra inferior |
| `foco` | `vidrio@peor` | foco | 3 | 4.36 | 5.81 | Filete interior de la barra inferior |
| `foco` | `vidrio-hoja@peor` | foco | 3 | 5.07 | 7.70 | Filete interior de las filas del menú |
| `linea-fuerte` | `fondo` | borde | 3 | 4.80 | 6.72 | Casilla de filtro (interior), campo con foco, pista del interruptor apagada |
| `linea-fuerte` | `fondo-2` | borde | 3 | 4.49 | 6.06 | Casilla de filtro sobre su grupo, pista del interruptor con Novedades |
| `linea-fuerte` | `fondo-3` | borde | 3 | 4.07 | 4.57 | Pista del interruptor apagada (filete interior) |
| `primario` | `fondo` | borde | 3 | 6.33 | 8.61 | Pista del interruptor encendida, conector hecho del Recorrido |
| `primario` | `fondo-2` | borde | 3 | 5.92 | 7.77 | Casilla marcada sobre su grupo |
| `primario` | `fondo-3` | borde | 3 | 5.37 | 5.86 | Borde de la parada hojeada y su palomita (Recorrido) |
| `en-primario` | `primario` | borde | 3 | 6.33 | 7.71 | Palomita de la casilla marcada, centro del pin del mapa |
| `superficie` | `primario` | borde | 3 | 6.33 | 6.63 | Pulgar del interruptor encendido |
| `primario` | `mapa-calle` | borde | 3 | 6.33 | 4.89 | Ruta del MapaLlegada sobre la calle |
| `primario` | `mapa-tierra` | borde | 3 | 5.37 | 8.61 | Pin del MapaLlegada sobre la manzana |
| `turquesa-texto` | `fondo-2` | icono | 3 | 5.92 | 10.32 | Iconos de ContactoPie |
| `tinta-2` | `vidrio-hoja@peor` | icono | 3 | 5.51 | 7.35 | Chevrón de las filas del menú |
| `abierto` | `fondo` | icono | 3 | 4.26 | 5.73 | Punto «Abierto ahora» (Inicio) |
| `abierto` | `fondo-2` | icono | 3 | 3.98 | 5.17 | Punto «Abierto ahora» (Visita) |
| `abierto` | `vidrio-hoja@peor` | icono | 3 | 3.41 | 3.86 | Punto «Abierto ahora» (menú) |
| `cerrado` | `fondo` | icono | 3 | 4.34 | 6.05 | Aro «Cerrado» (Inicio) |
| `cerrado` | `fondo-2` | icono | 3 | 4.05 | 5.46 | Aro «Cerrado» (Visita) |
| `cerrado` | `vidrio-hoja@peor` | icono | 3 | 3.48 | 4.07 | Aro «Cerrado» (menú) |

## Detalle

### Boton

Píldora con rótulo Headline. Alto 48 por omisión, 44 (--sm) solo en línea y en las barras, 56 (--lg) en las acciones principales y el pie de las hojas. Una sola primaria por vista.

- **Tipo:** control · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Botón) y «Escala de controles».
- **Variantes:** `.btn--primario` primario (La acción primaria de la vista («Cómo llegar»; en la ficha, «Preguntar por WhatsApp»).); `.btn--secundario` secundario (Secundaria «tinted» en menta; alternado con aria-pressed toma el primario.); `.btn--plano` plano (Texto en turquesa-texto, sin relleno (Mi lista de la barra, redes del menú, «Ver todo»).); `.btn--vidrio` vidrio (Solo lo que flota: cerrar una hoja, flechas del Carrusel3D.); `.btn--icono` icono (Cuadrado del alto del botón, nombre en aria-label.); `.btn--sm` chico (44 px.); `.btn--lg` grande (56 px.); `.btn--ancho` ancho (A todo el ancho.)
- **style.css:** `.btn` `.btn--primario` `.btn--secundario` `.btn--plano` `.btn--vidrio` `.btn--icono` `.btn--sm` `.btn--lg` `.btn--ancho`
- **index.html:** `.btn` `.btn--primario` `.btn--secundario` `.btn--plano` `.btn--vidrio` `.btn--icono` `.btn--sm` `.btn--lg`
- **motion.js:** exporta `pickPop` `afterPaint` `confirmThen`
- **Tokens:** `alto-sm` `alto-md` `alto-lg` `radio-pildora` `t-boton` `ls-boton` `t-boton-chico` `ls-boton-chico` `space-2` `space-4` `space-5` `space-6` `primario` `en-primario` `primario-presionado` `menta` `en-menta` `turquesa-texto` `fondo-3` `tinta` `tinta-2` `vidrio` `vidrio-hoja` `filtro-vidrio` `luz-vidrio` `sombra-flotante` `anillo-foco` `dur-instantanea` `dur-rapida` `curva-salida` `curva-resorte`
- **Estado hover:** `.btn--primario:hover`, `.btn--secundario:hover`, `.btn--vidrio:hover`, `.btn--plano:hover`
- **Estado foco:** `.btn:focus-visible`, `.btn--vidrio:focus-visible`
- **Estado presionado:** `.btn:active`, `.btn--primario:active`
- **Estado deshabilitado:** `.btn:disabled`, `.btn[aria-disabled="true"]`
- **Estado seleccionado:** `.btn--secundario[aria-pressed="true"]`
- **Estado movimiento_reducido:** `.btn:active` — En prefers-reduced-motion la escala al presionar se quita; el color sigue respondiendo.
- **ARIA:** Button (https://www.w3.org/WAI/ARIA/apg/patterns/button/) · `aria-pressed` `aria-disabled` `aria-label` · **Teclado:** Enter y Espacio (nativo de <button>); los enlaces con cara de botón, Enter.
- **QA:** `tools/qa/controles.mjs` `tools/qa/contrast.mjs` `tools/qa/axe.mjs` `tests/critique.test.mjs`

### BotonGuardar

«Guardar en Mi lista»: vidrio de 44 sobre la portada (.save), secundario ancho (.save--wide) o icono de 56 en la ficha (.save--icono). Guardado = primario con el marcador relleno y su palomita.

- **Tipo:** control · **desde** 2026-11-13 · DESIGN.md, «Ronda de animaciones» (palomita de Guardar, 2026-11-14).
- **Variantes:** `.save` sobre-portada (Vidrio de 44 en la esquina de la portada (rejilla y carrusel; en el carrusel solo la central).); `.save--wide` ancho (Botón menta con rótulo.); `.save--icono` icono (Icono de 56 en las acciones de la ficha; el rótulo es su nombre accesible.)
- **style.css:** `.save` `.save--wide` `.save--icono` `.save-chk`
- **index.html:** `[data-d-save]` `.save--icono`
- **saved.js:** exporta `saveButton` `bindSaveButton` `toggleSaved` `isSaved` `savedIds` `MAX_SAVED`
- **motion.js:** exporta `pickPop`
- **Tokens:** `alto-sm` `alto-md` `alto-lg` `vidrio` `filtro-vidrio` `luz-vidrio` `sombra-flotante` `primario` `en-primario` `menta` `en-menta` `tinta` `fondo` `foco` `anillo-foco` `dur-instantanea` `dur-rapida` `dur-base` `curva-salida`
- **Estado foco:** `:is(.chip, .cat-filters-btn, .cat-chip, .save, .explore-open, .rel, .card):focus-visible`, `:is(.rail-item, .card-item) .save:not(.save--wide):focus-visible`
- **Estado presionado:** `.save:active`
- **Estado seleccionado:** `.save[aria-pressed="true"]:not(.save--wide)`, `.save[aria-pressed="true"] .ic`, `.save[aria-pressed="true"] .save-chk`, `.save--wide[aria-pressed="true"]`, saved.js `btn.setAttribute('aria-pressed', String(on))`
- **Estado movimiento_reducido:** `.motion .save.is-pop .save-chk`, `.save:active`
- **hover: no aplica.** Sin cambio al pasar el cursor: el vidrio sobre la portada ya se lee como botón; el cursor cambia (cursor: pointer).
- **ARIA:** Button (alternado) (https://www.w3.org/WAI/ARIA/apg/patterns/button/) · `aria-pressed` `aria-label` · **Teclado:** Enter y Espacio alternan; el nombre dice el libro y la acción («Guardar «…» en mi lista» / «Quitar…»).
- **QA:** `tools/qa/saved.mjs` `tools/qa/ficha.mjs` `tools/qa/inp.mjs` `tools/qa/controles.mjs`

### Chip

Píldora de 48 en fondo-3; elegido = primario con la palomita (trazo SVG que se dibuja al elegir). En fila es un radiogroup (colecciones del Catálogo, Café · Té); en Explorar, el filtro activo (.cat-chip) y el botón «Filtros».

- **Tipo:** control · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Chip) y «Ronda de animaciones» (palomita que se dibuja).
- **Variantes:** `.chip` radio (role=radio dentro de role=radiogroup (rail.js chipNode, cafe.js).); `.cat-chip` filtro-activo (Filtro aplicado en Explorar, con su × para quitarlo.); `.cat-filters-btn` filtros (Abre los filtros hasta 1100 px (aria-expanded).)
- **style.css:** `.chip` `.chip-chk` `.cat-chip` `.cat-filters-btn` `.rail-chips`
- **index.html:** `[data-rail-chips]` `[data-cafe-chips]` `[data-cat-filters-btn]` `.rail-chips`
- **carousel3d.js:** exporta `wireRadioChips` `checkMark` `checkChip`
- **rail.js:** exporta `chipNode`
- **motion.js:** exporta `drawCheck`
- **Tokens:** `alto-md` `radio-pildora` `space-2` `space-4` `fondo-3` `tinta` `primario` `en-primario` `t-chip` `ls-chip` `anillo-foco` `dur-instantanea` `dur-rapida` `curva-salida`
- **Estado hover:** `:is(.chip:not([aria-checked="true"]), .cat-filters-btn:not([aria-expanded="true"])):hover`
- **Estado foco:** `:is(.chip, .cat-filters-btn, .cat-chip, .save, .explore-open, .rel, .card):focus-visible`
- **Estado presionado:** `.chip:active`, `.cat-filters-btn:active`, `.cat-chip:active`
- **Estado seleccionado:** `.chip[aria-checked="true"]`, `.chip[aria-checked="true"] > .chip-chk`, carousel3d.js `c.setAttribute('aria-checked', String(on))`
- **Estado expandido:** `.cat-filters-btn[aria-expanded="true"]`
- **Estado ocupado:** `.sk-chip`, HTML `.sk-chip`
- **Estado movimiento_reducido:** `.motion .is-dibuja > .chip-chk path`, `.chip:active`
- **ARIA:** Radio Group (https://www.w3.org/WAI/ARIA/apg/patterns/radio/) · `role=radiogroup` `role=radio` `aria-checked` `aria-label` · **Teclado:** Un solo punto de tabulación (el elegido); ← → ↑ ↓ mueven el foco y eligen (wireRadioChips).
- **QA:** `tools/qa/rail.mjs` `tools/qa/controles.mjs` `tools/qa/inp.mjs` `tools/qa/feed.mjs`

### Recorrido

Recorrido ligero sobre los chips del Catálogo (A4): conector de 2 px entre paradas (primario entre dos hojeadas, que crece una vez), palomita y borde primario en las hojeadas y «N de 3 paradas hojeadas» en región viva. Se guarda en localStorage (iti-recorrido-v2).

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Carrusel3D, Eventos, Café y té, recorrido y profundidad» y «Recorrido que se llena» (2026-11-14).
- **style.css:** `.rail-conector` `.rail-conector::after` `.rail-conector.is-hecho::after` `.rail-progreso` `.rail-nota-fila` `.rail-note`
- **index.html:** `[data-rail-progreso]` `[data-rail-note]`
- **rail.js:** exporta `conector` `readTrail` `writeTrail` `trailState` `trailLine` `TRAIL_KEY` · internas `fillLink` `paintTrail` · ganchos `iti-recorrido-v2`
- **Tokens:** `linea-fuerte` `primario` `turquesa-texto` `tinta-2` `space-2` `space-6` `radio-pildora` `t-nota-pie` `t-subtitulo` `dur-base` `curva-salida`
- **Estado seleccionado:** `.rail-chip.is-hojeada:not([aria-checked="true"])`, `.rail-chip.is-hojeada > .chip-chk` — Hojeada = estado solo visual (clase); el conteo en la región viva lo anuncia.
- **Estado movimiento_reducido:** `.motion .rail-conector.is-llena::after`
- **hover: no aplica.** No es un control: los chips llevan su propio hover.
- **foco: no aplica.** No es enfocable; el foco es el de los chips.
- **ARIA:** Región viva (status) (https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) · `aria-live=polite` · **Teclado:** El de los chips (radiogroup).
- **QA:** `tools/qa/rail.mjs` `tools/qa/motion.mjs` `tests/site.test.mjs`

### BarraNavegacion

Barra pegada arriba, de vidrio, de 44 px más el área segura (64 desde 761): marca y ☰ en el teléfono; Mi lista y «Cómo llegar» desde 761; las secciones con la pastilla menta en la actual desde 1101. Al desplazar flota; «Cómo llegar» cede su sitio si otra primaria está a la vista.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Barra de navegación) y «Barra de navegación desde 1101 px».
- **style.css:** `.hdr` `.hdr.is-solid` `.hdr-brand` `.hdr-nav` `.hdr-nav a` `.hdr-end` `.hdr-list` `.hdr-cta` `.hdr.has-primary .hdr-cta`
- **index.html:** `.hdr` `[data-hdr]` `.hdr-brand` `.hdr-nav` `.hdr-cta` `.hdr-list` `[data-open-mylist]`
- **app.js:** internas `spy` `updateStatus` · ganchos `navLinks.forEach(a =>`
- **Tokens:** `alto-barra-nav` `alto-sm` `vidrio` `filtro-vidrio` `luz-vidrio` `sombra-flotante` `menta` `en-menta` `fondo-3` `tinta` `radio-pildora` `radio-sm` `t-titular` `t-boton-chico` `anillo-foco` `dur-rapida` `curva-salida` `space-16`
- **Estado hover:** `.hdr-nav a:not([aria-current="true"]):hover`
- **Estado foco:** `.hdr-brand:focus-visible`, `.hdr-nav a:focus-visible`
- **Estado actual:** `.hdr-nav a[aria-current="true"]`, app.js `a.setAttribute('aria-current', 'true')`
- **deshabilitado: no aplica.** Nada se deshabilita en la barra.
- **ARIA:** Landmark navigation + aria-current (https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html) · `aria-label=Secciones` `aria-current` · **Teclado:** Tab entre enlaces; Enter sigue el enlace.
- **QA:** `tools/qa/e2e.mjs` `tools/qa/responsive.mjs` `tools/qa/controles.mjs` `tools/qa/axe.mjs`

### MenuHamburguesa

☰ de 44 cuyas líneas se cruzan en ×, y el diálogo modal con la hoja de vidrio: secciones en filas de 56 (la actual en menta), Mi lista, el horario de hoy, «Cómo llegar», WhatsApp e Instagram/Facebook. Detrás, el velo.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Menú ☰).
- **style.css:** `.menu-btn` `.menu-lines` `.menu` `.menu::backdrop` `.menu-hoja` `.menu-row` `.menu-close` `.menu-pie` `.menu-acciones` `.menu-redes`
- **index.html:** `#menu` `[data-menu-open]` `[data-menu-close]` `.menu-row` `.menu-hoja`
- **sheets.js:** exporta `openDialog` `closeDialog` `pushSheet` `navigateFromSheet`
- **app.js:** ganchos `opener.setAttribute('aria-expanded', 'true')`
- **Tokens:** `alto-sm` `alto-lg` `vidrio` `vidrio-hoja` `filtro-vidrio` `filtro-vidrio-hoja` `luz-vidrio` `sombra-hoja` `sombra-flotante` `velo` `menta` `en-menta` `fondo-3` `tinta` `tinta-2` `linea` `foco` `anillo-foco` `radio-lg` `radio-sm` `t-titulo-2` `dur-instantanea` `dur-rapida` `dur-base` `escalon-linea` `curva-salida` `curva-resorte`
- **Estado hover:** `.menu-btn:hover`, `.menu-row:not([aria-current="true"]):hover`
- **Estado foco:** `.menu-btn:focus-visible`, `.menu-row:focus-visible`, `.menu-close:focus-visible`
- **Estado presionado:** `.menu-btn:active`, `.menu-row:active`
- **Estado actual:** `.menu-row[aria-current="true"]`
- **Estado expandido:** `[aria-expanded="true"] > .menu-lines span:nth-child(1)`, HTML `[aria-expanded="false"]`
- **Estado movimiento_reducido:** `.motion .menu.is-closing .menu-hoja`, `.menu-btn:active`
- **ARIA:** Dialog (Modal) + Disclosure (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) · `aria-expanded` `aria-controls` `aria-labelledby` `aria-current` · **Teclado:** Enter/Espacio abre; foco a la primera sección; Tab atrapado (showModal); Escape, el velo y «atrás» cierran; elegir una sección lleva el foco a su titular.
- **QA:** `tools/qa/e2e.mjs` `tools/qa/axe.mjs` `tools/qa/inp.mjs` `tools/qa/motion.mjs` `tools/qa/contrast.mjs`

### BarraInferior

Solo ≤ 760 px: cápsula de vidrio de 49 × 228 con Inicio, Catálogo y Mi lista (botón con el conteo). La pastilla menta se desliza a la casilla con aria-current; con una hoja abierta baja y se oculta.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Barra inferior).
- **mobile.css:** `.tabbar` `.tabbar-pastilla` `.tabbar a` `.tab-list` `.tab-ic` `.tab-lb` `.tab-ic-box`
- **index.html:** `.tabbar` `.tabbar-pastilla` `.tab-list` `.tab-lb`
- **app.js:** ganchos `a.setAttribute('aria-current', 'location')`
- **Tokens:** `alto-barra-inferior` `vidrio` `filtro-vidrio` `luz-vidrio` `sombra-flotante` `menta` `en-menta` `tinta` `foco` `radio-pildora` `t-pestana` `space-1` `space-2` `dur-instantanea` `dur-rapida` `dur-base` `curva-salida` `curva-resorte`
- **Estado foco:** `.tabbar a:focus-visible`, `.tab-list:focus-visible`
- **Estado presionado:** `.tabbar a:active`, `.tab-list:active`
- **Estado actual:** `.tabbar a[aria-current]`, `.tabbar a[aria-current] .tab-ic`
- **Estado oculto:** `html.sheet-open .tabbar` — Con una hoja abierta (estado de la página, no del control).
- **hover: no aplica.** Solo existe en el teléfono (mobile.css, ≤ 760 px).
- **ARIA:** Landmark navigation + aria-current (https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html) · `aria-label=Accesos` `aria-current=location` · **Teclado:** Tab entre las tres casillas; Mi lista es un botón (Enter/Espacio).
- **QA:** `tools/qa/feed.mjs` `tools/qa/controles.mjs` `tools/qa/responsive.mjs`

### Carrusel3D

Un solo motor para los tres carruseles: desplazamiento nativo con imán al centro y una pose por fotograma según la distancia al centro (giro hasta 44°, hueco ≥ 12 px con la vecina). Solo la central con sombra-portada; flechas de vidrio de 48 solo con puntero fino; plano y con la imagen de las vecinas atenuada sin movimiento.

- **Tipo:** control · **desde** 2026-11-13 · DESIGN.md, «Carrusel3D, Eventos, Café y té…» y «Norma del Carrusel3D afinada»; skill ux-apple §3.
- **Variantes:** `.c3d--portada` portada (Catálogo (rail.js): CarruselPortadas.); `.c3d--evento` evento (Eventos y talleres (feed.js).); `.c3d--carta` carta (Café y té (cafe.js).)
- **style.css:** `.c3d` `.c3d-viewport` `.c3d-track` `.cf-pose` `.c3d-flecha` `.c3d-flecha--prev` `.c3d-flecha--next` `.c3d-card` `.c3d--portada` `.c3d--evento` `.c3d--carta`
- **index.html:** `.c3d` `.c3d-viewport` `.c3d-track` `.c3d-flecha` `[data-rail-c3d]` `[data-bill-c3d]` `[data-cafe-c3d]`
- **carousel3d.js:** exporta `createCarousel3D` `coverflowPose` `nearestIndex` `keyTarget` `CF_GIRO` `POSE` `ATENUADA` `initDepth` `tiltPose` `tiltTransform`
- **Tokens:** `giro-carrusel` `perspectiva-carrusel-piezas` `inclinacion-max` `adelanto-profundidad` `perspectiva-inclinacion` `sombra-portada` `sombra-flotante` `alto-md` `space-2` `space-3` `space-4` `space-6` `space-12` `margen-movil` `anillo-foco` `dur-instantanea` `dur-rapida` `dur-base` `curva-salida` `curva-resorte`
- **Estado foco:** `.c3d-card:focus-visible`, `.btn:focus-visible` — Una sola parada de tabulador: la pieza central (o su botón).
- **Estado deshabilitado:** `.c3d-flecha:disabled`
- **Estado actual:** `.c3d-item.is-centro :is(.bill-card, .cafe-card)`, `.rail-item.is-centro .cover` — La central: estado solo visual; la región viva anuncia la pieza que llega.
- **Estado presionado:** `.motion :is(.c3d-item.is-centro [data-inclina], .card-item[data-inclina]):active`
- **Estado tactil ((hover: none) and (pointer: coarse)):** `.c3d-flecha` — Con toque no hay flechas: deslizar o tocar la vecina (WCAG 2.5.7).
- **Estado plano:** `.c3d-item.is-atenuada img` — Sin movimiento (reducir movimiento o «Pausar el movimiento») el motor pinta la misma geometría sin giro y atenúa la imagen de las vecinas al 60 % (ATENUADA); el texto conserva su contraste.
- **Estado movimiento_reducido:** `[data-inclina]:active`, carousel3d.js `const flat = !isMotion();`
- **hover: no aplica.** La pieza central se inclina hacia el cursor (initDepth, solo con pointer: fine y hover: hover, en JS); las flechas usan el hover de .btn--vidrio.
- **ARIA:** Carousel (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) · `role=region` `aria-roledescription=carrusel` `aria-label` `aria-live=polite (región viva)` `aria-busy` · **Teclado:** Una parada de tabulador (la central); ← → Inicio Fin mueven (keyTarget); Enter abre la central; sin autoplay.
- **QA:** `tools/qa/carrusel.mjs` `tools/qa/rail.mjs` `tools/qa/feed.mjs` `tools/qa/motion.mjs` `tools/qa/inp.mjs` `tests/site.test.mjs`

### CarruselPortadas

Variante portada (capa 1 del Catálogo): empieza por el libro del medio; bajo él, título y «autor · precio» enteros con la reserva del pie más alto (--cf-reserva); tocar la central abre la ficha.

- **Tipo:** bloque · variante de Carrusel3D · **desde** 2026-11-13 · DESIGN.md, «Catálogo y Novedades» (Carrusel de portadas en 3D).
- **style.css:** `.c3d--portada` `.rail` `.rail-head` `.rail-item` `.cf-pie` `.cf-texto` `.cf-titulo` `.cf-meta` `.rail-status` `.rail-error`
- **index.html:** `[data-rail]` `[data-rail-track]` `[data-rail-caption]` `[data-rail-live]` `[data-rail-error]` `[data-rail-retry]` `[data-rail-prev]` `[data-rail-next]`
- **rail.js:** exporta `initRail` `measureCaptions` `pickBooks` `bookCard` `wireBookOpen` `captionOf` `RAIL_SIZE`
- **Tokens:** `sombra-portada` `t-titulo-3` `t-subtitulo` `tinta` `tinta-2` `space-3` `space-4`
- **Estado ocupado:** HTML `[data-rail-track][aria-busy="true"]`, rail.js `track.setAttribute('aria-busy', 'true')`
- **Estado error:** `.rail[data-state="error"] :is(.rail-chips, .rail-nota-fila, .c3d, .cf-pie)`, `.rail-error`, HTML `[data-rail-error]`
- **Estado actual:** `.rail-item.is-centro .cover`, `.rail-item:not(.is-centro) .save`
- **ARIA:** Carousel (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) · `aria-label=Libros de la colección …` `aria-haspopup=dialog` · **Teclado:** El del Carrusel3D; Enter en la central abre la ficha.
- **QA:** `tools/qa/rail.mjs` `tools/qa/carrusel.mjs` `tools/qa/skeleton.mjs`

### CarruselEventos

Variante evento: tarjetas en superficie con radio 20, foto real 4:3 (16:9 en ventanas de hasta 700 px de alto), insignias de tipo y estado («Propuesta · sin fecha» o la fecha de data-fecha) con «Compartir» (icono menta de 44, solo en la central) al final de su fila, y el título; debajo, la descripción de la central (región viva con su reserva).

- **Tipo:** bloque · variante de Carrusel3D · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Tarjeta de evento) y «Posiciones de iPhone y contenedor de 1152» (2026-11-14: «Compartir» en la fila de insignias).
- **style.css:** `.c3d--evento` `.bill-card` `.bill-card-img` `.bill-badges` `.bill-title` `.bill-pie` `.bill-desc` `.bill-share`
- **index.html:** `[data-bill-track]` `[data-bill-desc]` `[data-bill-pie]` `.bill-item` `.bill-card` `.bill-share`
- **feed.js:** exporta `initEventos` `initFeed` `eventBadge` `eventOf` `measureDescs` `shareItem` `NO_DATE`
- **Tokens:** `superficie` `fondo-2` `tinta` `radio-md` `t-titulo-3` `t-cuerpo` `sombra-portada` `space-3` `space-4` `space-6`
- **Estado actual:** `.c3d-item.is-centro :is(.bill-card, .cafe-card)`
- **Estado foco:** `.c3d-card:focus-visible`
- **Estado oculto:** `.c3d-item:not(.is-centro) .bill-share` — «Compartir» solo se ve y se toca en la tarjeta del centro (y sin JavaScript no se ofrece).
- **vacio: no aplica.** Las propuestas están en el HTML; sin JavaScript cada tarjeta muestra su descripción.
- **ARIA:** Carousel (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) · `aria-labelledby (cada article)` `aria-live=polite (descripción)` `aria-label «Compartir «título»» (cada «Compartir»)` · **Teclado:** El del Carrusel3D.
- **QA:** `tools/qa/feed.mjs` `tools/qa/carrusel.mjs` `tools/qa/iphone.mjs`

### CarruselCarta

Variante carta (Café y té): chips Café · Té y tarjetas tipográficas en superficie con un icono en disco menta, nombre, descripción y, solo si la librería lo da, el precio. Datos en assets/data/menu.json.

- **Tipo:** bloque · variante de Carrusel3D · **desde** 2026-11-13 · DESIGN.md, «Carrusel3D, Eventos, Café y té…» (carta).
- **style.css:** `.c3d--carta` `.cafe-carta` `.cafe-chips` `.cafe-card` `.cafe-ic` `.cafe-nombre` `.cafe-desc` `.cafe-precio`
- **index.html:** `[data-cafe]` `[data-cafe-chips]` `[data-cafe-track]` `[data-cafe-status]` `[data-cafe-live]`
- **cafe.js:** exporta `initCafe` `validMenu` `precioCarta` `cartaCard` `MENU_URL`
- **assets/data/menu.json:** datos
- **Tokens:** `superficie` `menta` `en-menta` `tinta` `tinta-2` `linea` `radio-md` `alto-md` `t-titulo-2` `t-subtitulo` `t-titular` `space-2` `space-5`
- **Estado seleccionado:** `.chip[aria-checked="true"]`
- **Estado ocupado:** `.cafe-item.card--sk .cafe-card`, HTML `[data-cafe-track][aria-busy="true"]`
- **Estado vacio:** `.cafe-carta[data-state="vacio"] :is(.cafe-chips, .c3d--carta)`
- **ARIA:** Carousel + Radio Group (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) · `role=group` `aria-roledescription=bebida` `aria-checked` · **Teclado:** Chips con flechas; carrusel con ← → Inicio Fin.
- **QA:** `tools/qa/feed.mjs` `tools/qa/carrusel.mjs`

### TarjetaLibro

Un solo botón con la portada 2:3 (real o tipográfica), el título (Subheadline semibold, dos renglones) y «autor · $250 MXN» (Footnote, el precio de la hoja no se parte). «Guardar» flota sobre la portada. En escritorio se inclina al cursor con brillo de lámina.

- **Tipo:** control · **desde** 2026-11-13 · DESIGN.md, «Catálogo y Novedades» (Tarjeta de la rejilla) y «Brillo de lámina» (2026-11-14).
- **Variantes:** `.cover--img` portada-real (Imagen sin alt (el nombre va en el botón).); `.cover--blank` portada-tipografica (Sin imagen o si falla: campo de color con título y autor.)
- **style.css:** `.card` `.cover` `.cover--img` `.cover--blank` `.card-item` `.card-t` `.card-m` `.card-pr` `.cover-title` `.cover-author`
- **catalog.js:** exporta `imageCover` `coverFallback` `coverTone` `priceLabel` `splitTitle` `titleSize` `COVER_LAYOUTS` · internas `card` `cover` `blankCover`
- **rail.js:** exporta `bookCard` `wireBookOpen`
- **carousel3d.js:** exporta `initDepth` `tiltPose` `tiltTransform`
- **Tokens:** `radio-portada` `fondo-3` `linea` `sombra-portada` `sombra-flotante` `brillo-lamina` `t-subtitulo` `t-nota-pie` `t-titular` `t-titulo-3` `t-leyenda-1` `tinta` `tinta-2` `space-1` `space-2` `anillo-foco` `inclinacion-max` `adelanto-profundidad` `dur-instantanea` `dur-rapida` `curva-salida`
- **Estado hover:** `.card:hover .cover` — Con puntero fino, además, inclinación y brillo de lámina (initDepth, solo con movimiento).
- **Estado foco:** `:is(.chip, .cat-filters-btn, .cat-chip, .save, .explore-open, .rel, .card):focus-visible`
- **Estado presionado:** `.card:active .cover`, `.card[data-opening] .cover`
- **Estado ocupado:** `.card--sk`, `.card--sk :is(.card-t, .card-m)`, HTML `.card--sk`
- **Estado movimiento_reducido:** `.card:active .cover`, `.motion :is(.card, .card-item)[data-inclina].is-inclinada .cover::after`
- **ARIA:** Button (abre un diálogo) (https://www.w3.org/WAI/ARIA/apg/patterns/button/) · `aria-haspopup=dialog` · **Teclado:** Enter y Espacio abren la ficha; el foco vuelve a la tarjeta al cerrar.
- **QA:** `tools/qa/explorer.mjs` `tools/qa/skeleton.mjs` `tools/qa/contrast.mjs` `tools/qa/inp.mjs`

### FichaLibro

Hoja única del libro (diálogo de 680 en escritorio; sube desde abajo en el teléfono): portada, título, autor, ficha técnica, sinopsis, «Tu mensaje por WhatsApp», relacionados y, fijas al pie, «Preguntar por WhatsApp» (primaria a todo el ancho), Guardar, Compartir y «Cómo llegar».

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Hojas, FichaLibro).
- **style.css:** `.drawer` `.drawer::backdrop` `.drawer-body` `.drawer-close` `.drawer-head` `.drawer-facts` `.drawer-synopsis` `.drawer-foot` `.drawer-actions` `.drawer-note` `.rel`
- **mobile.css:** `.drawer`
- **index.html:** `#cat-drawer` `[data-d-close]` `[data-d-cta]` `[data-d-save]` `[data-d-share]` `[data-d-visit]` `[data-d-scroll]`
- **catalog.js:** exporta `shareBook` `bookShareData` `bookMessage` `bookWaUrl` `relatedBooks` · internas `openBook`
- **sheets.js:** exporta `openDialog` `closeDialog`
- **Tokens:** `vidrio-hoja` `filtro-vidrio-hoja` `luz-vidrio` `sombra-hoja` `sombra-portada` `velo` `radio-lg` `tinta` `tinta-2` `linea` `alto-lg` `t-titulo-2` `t-cuerpo` `t-subtitulo` `t-nota-pie` `dur-base` `dur-rapida` `curva-salida` `curva-resorte` `curva-entrada-salida`
- **Estado foco:** `.btn:focus-visible`, `.btn--vidrio:focus-visible`
- **Estado presionado:** `.rel:active .cover`
- **Estado hover:** `.rel:hover span`
- **Estado abriendo:** `.is-filling > *` — El contenido espera un fotograma (openDialog con defer).
- **Estado movimiento_reducido:** `.motion .drawer.is-closing`, `.rel:active .cover`
- **ARIA:** Dialog (Modal) (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) · `aria-labelledby=d-title` · **Teclado:** <dialog> con showModal: Tab atrapado, Escape y «atrás» cierran; el foco vuelve a quien la abrió.
- **QA:** `tools/qa/ficha.mjs` `tools/qa/axe.mjs` `tools/qa/inp.mjs` `tools/qa/contrast.mjs`

### MiLista

«Mi lista para la visita»: libros guardados en localStorage, sin cuenta. Hoja con la lista, «Quitar» por renglón y, fijas al pie, «Cómo llegar» y «Enviar mi lista por WhatsApp». Conteo en la barra inferior, la cabecera y el menú.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Hojas) y AGENTS.md (saved.js).
- **style.css:** `.mylist` `.mylist::backdrop` `.ml-head` `.ml-body` `.ml-items` `.ml-item` `.ml-remove` `.ml-empty` `.ml-error` `.ml-actions` `.count-badge`
- **mobile.css:** `.mylist`
- **index.html:** `#mylist` `[data-ml-close]` `[data-ml-items]` `[data-ml-empty]` `[data-ml-error]` `[data-ml-retry]` `[data-ml-status]` `[data-ml-wa]` `[data-saved-dot]`
- **saved.js:** exporta `initSaved` `listMessage` `listWaUrl` `clearSaved` `savedIds` `MAX_SAVED`
- **Tokens:** `vidrio-hoja` `filtro-vidrio-hoja` `luz-vidrio` `sombra-hoja` `velo` `radio-lg` `fondo-3` `tinta` `tinta-2` `linea` `primario` `en-primario` `alto-md` `alto-lg` `anillo-foco` `t-titulo-2` `t-titular` `t-subtitulo` `t-nota-pie`
- **Estado foco:** `.ml-remove:focus-visible`
- **Estado vacio:** `.ml-empty`, HTML `[data-ml-empty]`
- **Estado error:** `.ml-error`, HTML `[data-ml-error]`, HTML `[data-ml-retry]`
- **Estado movimiento_reducido:** `.motion .mylist.is-closing`
- **hover: no aplica.** Las filas no son enlaces; «Quitar» y las acciones del pie llevan el estado de su botón.
- **ARIA:** Dialog (Modal) (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) · `aria-labelledby=mylist-title` `role=status (data-ml-status)` · **Teclado:** Igual que la ficha; «Quitar «…» de mi lista» con su título en el nombre.
- **QA:** `tools/qa/saved.mjs` `tools/qa/axe.mjs` `tools/qa/inp.mjs`

### CampoBusqueda

Píldora de 48 en fondo-3 con letra de 17 (iOS no acerca la página); con foco, fondo de página, borde linea-fuerte y anillo. Su × propia de 48 borra (la nativa se oculta). Sugerencias en lista (combobox).

- **Tipo:** control · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Campo de búsqueda).
- **style.css:** `.cat-bar input[type="search"]` `.cat-clear` `.cat-suggest` `.cat-suggest li` `.cat-combo` `.sg-k`
- **index.html:** `#cat-q` `[data-cat-q]` `[data-cat-clear]` `[data-cat-suggest]` `#cat-suggest`
- **catalog.js:** exporta `suggest` `score` `norm` · internas `renderSuggest` `closeSuggest` `pick`
- **Tokens:** `alto-md` `radio-pildora` `radio-md` `radio-sm` `fondo-3` `fondo` `superficie` `tinta` `tinta-2` `linea` `linea-fuerte` `primario` `menta` `en-menta` `turquesa-texto` `anillo-foco` `sombra-flotante` `t-campo` `t-subtitulo` `t-rotulo` `dur-rapida` `curva-salida`
- **Estado hover:** `.cat-clear:hover`, `.cat-suggest li:hover`
- **Estado foco:** `.cat-bar input[type="search"]:focus-visible`, `.cat-clear:focus-visible`
- **Estado seleccionado:** `.cat-suggest li[aria-selected="true"]`
- **Estado expandido:** HTML `[aria-expanded="false"][data-cat-q]`, catalog.js `input.setAttribute('aria-expanded', 'false')`
- **ARIA:** Combobox (lista) (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) · `role=combobox` `aria-expanded` `aria-controls` `aria-autocomplete=list` `aria-activedescendant` `role=listbox` `aria-selected` · **Teclado:** ↓ ↑ recorren las sugerencias; Enter elige; Escape cierra la lista.
- **QA:** `tools/qa/explorer.mjs` `tools/qa/axe.mjs` `tools/qa/controles.mjs`

### Explorar

«Explora el catálogo»: los 41 títulos en una página con búsqueda y filtros (Género, Editorial; casillas de 24 con palomita; un grupo se pliega desde 8 opciones). Hoja a pantalla completa en el teléfono; en línea desde 761, donde sin búsqueda ni filtros la rejilla se pliega a dos filas con «Ver los 41 títulos» / «Ver menos». Filtros activos como chips y «Limpiar todo».

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Rejilla en línea plegada» y AGENTS.md (catalog.js).
- **style.css:** `.explore-open` `.explorer` `.cat` `.cat-bar` `.cat-filters` `.cat-group` `.cat-opt` `.cat-more-facets` `.cat-status` `.cat-chips` `.cat-clear-all` `.cat-grid` `.cat-fold` `.cat-empty` `.cat-error`
- **mobile.css:** `.explorer`
- **index.html:** `#catalogo` `#explorer` `[data-ex-open]` `[data-ex-close]` `[data-cat-form]` `[data-cat-filters]` `[data-cat-status]` `[data-cat-chips]` `[data-cat-grid]` `[data-cat-fold]` `[data-cat-empty]` `[data-cat-reset]`
- **catalog.js:** exporta `initCatalog` `filterBooks` `sortBooks` `facetCounts` `foldView` `facetView` `FOLD_ROWS` `FACET_FOLD_AT` `FACET_LIMIT` `PAGE_SIZE` `GENRE_ES` `genreLabel` · internas `renderFilters` `renderChips` `renderGrid` `applyFold` `staggerIn` `clearAll` · ganchos `data-clear` `cat-clear-all`
- **Tokens:** `alto-sm` `alto-md` `fondo-3` `fondo-2` `fondo` `tinta` `tinta-2` `linea` `linea-fuerte` `primario` `en-primario` `turquesa-texto` `foco` `anillo-foco` `radio-md` `radio-sm` `radio-portada` `radio-pildora` `t-campo` `t-subtitulo` `t-rotulo` `t-boton-chico` `t-titulo-3` `space-8` `dur-rapida` `dur-lenta` `escalon-linea` `curva-salida`
- **Estado hover:** `.explore-open:hover`, `.cat-opt label:hover`
- **Estado foco:** `.cat-opt input:focus-visible + label`, `.cat-clear-all:focus-visible`, `:is(.chip, .cat-filters-btn, .cat-chip, .save, .explore-open, .rel, .card):focus-visible`
- **Estado presionado:** `.explore-open:active`, `.explore-open[data-opening]`
- **Estado seleccionado:** `.cat-opt input:checked + label::before`, `.cat-opt input:checked + label::after`
- **Estado expandido:** HTML `[data-cat-fold][aria-expanded="false"]`, catalog.js `foldBtn.setAttribute('aria-expanded', String(!v.folded))`
- **Estado ocupado:** `.cat-grid[aria-busy="true"]`, `.cat-grid[aria-busy="true"] .card--sk .cover`, HTML `[data-cat-grid][aria-busy="true"]`
- **Estado vacio:** `.cat-empty`, HTML `[data-cat-empty]`, HTML `[data-cat-reset]`
- **Estado error:** `.cat-error`
- **Estado movimiento_reducido:** catalog.js `if (!isMotion() \|\| !items.length) return;`
- **ARIA:** Dialog (teléfono) + Checkbox + Disclosure (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) · `role=region` `role=search` `role=group` `role=status` `aria-busy` `aria-expanded` `aria-controls` · **Teclado:** Casillas nativas (Espacio); «Ver los 41 títulos» despliega en su sitio y el foco se queda en el botón; Escape cierra la hoja del teléfono.
- **QA:** `tools/qa/explorer.mjs` `tools/qa/skeleton.mjs` `tools/qa/axe.mjs` `tools/qa/inp.mjs`

### Aviso

Cápsula de vidrio (popover manual, por encima de las hojas) con el mensaje («Guardado en Mi lista.») y una acción menta; en la ficha flota justo encima de las acciones del pie.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Hojas: aviso).
- **style.css:** `.toast` `.toast:popover-open` `.toast-action`
- **saved.js:** exporta `notify` · internas `toast` `hideToast` · ganchos `toastEl.setAttribute('role', 'status')` `toastEl.popover = 'manual'`
- **Tokens:** `vidrio-hoja` `filtro-vidrio-hoja` `luz-vidrio` `sombra-flotante` `radio-md` `radio-pildora` `tinta` `menta` `en-menta` `alto-md` `t-subtitulo` `t-boton-chico` `anillo-foco`
- **Estado foco:** `.toast-action:focus-visible`
- **Estado abierto:** `.toast:popover-open`
- **hover: no aplica.** La acción es menta fija; el aviso dura poco y no invita a explorar con el cursor.
- **ARIA:** Status message (WCAG 4.1.3) (https://www.w3.org/TR/WCAG22/#status-messages) · `role=status` `popover=manual` · **Teclado:** La acción es un botón (Enter/Espacio).
- **QA:** `tools/qa/saved.mjs` `tools/qa/ficha.mjs`

### EncabezadoSeccion

Titular .h2 (Title 1, crece hasta 40 desde 761) con el patrón «Nombre *frase*» (el em en tinta-2, en su renglón) y la entradilla; sin antetítulo. Entra por líneas con su máscara una sola vez.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Encabezado de sección).
- **style.css:** `.sec-head` `.h2` `.sec-texto` `.linea` `.linea-in`
- **index.html:** `.sec-head` `.sec-texto` `[data-revelar]`
- **app.js:** internas `splitHeading` `prepareReveals` `revealAll`
- **Tokens:** `t-titulo-1` `ls-titulo-1` `t-cuerpo` `tinta` `tinta-2` `turquesa-texto` `dur-lenta` `dur-instantanea` `escalon-linea` `curva-salida`
- **Estado movimiento_reducido:** `.motion [data-revelar="listo"] .linea-in`, `.motion [data-revelar="listo"] .sec-texto`
- **hover: no aplica.** No es un control.
- **foco: no aplica.** No es un control (los enlaces de su entradilla llevan el foco global).
- **ARIA:** Encabezado de sección (h2 + aria-labelledby) (https://www.w3.org/WAI/ARIA/apg/practices/headings/) · `aria-labelledby (en la sección)` · **Teclado:** —
- **QA:** `tools/qa/piso.mjs` `tools/qa/motion.mjs` `tests/site.test.mjs`

### TiraCasa

La casa: seis fotos reales en una tira que se pasa con el dedo; la que se ve entera queda plena y la que asoma se atenúa hasta 0.6 (CSS con animation-timeline: view()).

- **Tipo:** bloque · **desde** 2026-11-14 · DESIGN.md, «Enfoque en La casa» (2026-11-14).
- **style.css:** `.house` `.house-track` `.still` `.still-img`
- **mobile.css:** `.still`
- **index.html:** `#casa` `.still-img`
- **Tokens:** `fondo-2` `fondo-3` `radio-lg` `t-titular` `space-3` `space-4`
- **Estado foco:** `.house-track:focus-visible`
- **Estado movimiento_reducido:** `.motion .still-img`
- **ARIA:** Lista desplazable con foco (https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) · `aria-labelledby` · **Teclado:** La tira recibe foco y se desplaza con las flechas (nativo).
- **QA:** `tools/qa/responsive.mjs` `tools/qa/motion.mjs`

### MapaLlegada

SVG propio en línea con las calles reales de OpenStreetMap (ODbL), la cuadra de Matamoros, el pin aproximado y la ruta en primario, que se dibuja una vez al verse el 60 % del mapa. Todo el mapa enlaza a «Cómo llegar».

- **Tipo:** bloque · **desde** 2026-11-14 · DESIGN.md, «Mapa de llegada en Visita» (2026-11-14).
- **style.css:** `.visit-map` `.visit-map-link` `.mapa` `.mapa-tierra` `.mapa-via` `.mapa-ruta` `.mapa-nombre` `.mapa-pin path`
- **index.html:** `.visit-map` `.visit-map-link` `.mapa` `.mapa-ruta`
- **app.js:** ganchos `mapIo`
- **Tokens:** `mapa-tierra` `mapa-calle` `linea` `primario` `en-primario` `tinta` `tinta-2` `radio-lg` `anillo-foco` `t-subtitulo` `t-nota-pie` `dur-lenta` `dur-rapida` `curva-salida`
- **Estado foco:** `.visit-map-link:focus-visible`
- **Estado movimiento_reducido:** `.motion .visit-map[data-revelar="listo"] .mapa-ruta`, `.motion .visit-map[data-revelar="listo"].is-visible .mapa-ruta`
- **Estado colores_forzados ((forced-colors: active)):** `.mapa-ruta`
- **hover: no aplica.** Es un enlace grande; el cursor cambia (enlace nativo).
- **ARIA:** Imagen con nombre dentro de un enlace (https://www.w3.org/WAI/tutorials/images/functional/) · `role=img` `aria-labelledby=mapa-t` · **Teclado:** Enter sigue el enlace.
- **QA:** `tools/qa/responsive.mjs` `tools/qa/motion.mjs` `tools/qa/axe.mjs`

### InterruptorMovimiento

«Pausar el movimiento» del pie: <button role="switch" aria-checked> con su rótulo visible y la pista de 51 × 31 (geometría de iOS) en un objetivo de 44. Encendido = pausado (pista primario, pulgar a la derecha). Con «reducir movimiento» o ahorro de datos: encendido, aria-disabled y la nota dice por qué.

- **Tipo:** control · **desde** 2026-11-14 · DESIGN.md, «Interruptor «Pausar el movimiento»» (2026-11-14).
- **style.css:** `.interruptor` `.interruptor-pista` `.interruptor-pulgar` `.interruptor-nota` `.ftr-row`
- **index.html:** `[data-motion-toggle]` `[data-motion-nota]` `#motion-nota` `.interruptor`
- **app.js:** internas `syncToggle` `applyMode` · ganchos `iti-b4-motion`
- **assets/js/boot.js:** ganchos `r.classList.add('motion')`
- **Tokens:** `interruptor-ancho` `interruptor-alto` `interruptor-pulgar` `alto-sm` `fondo-3` `linea-fuerte` `primario` `primario-presionado` `superficie` `sombra-pulgar` `tinta` `tinta-2` `anillo-foco` `radio-pildora` `t-subtitulo` `t-nota-pie` `dur-rapida` `curva-salida` `curva-resorte`
- **Estado hover:** `.interruptor:not([aria-disabled="true"]):hover .interruptor-pista`, `.interruptor[aria-checked="true"]:not([aria-disabled="true"]):hover .interruptor-pista`
- **Estado foco:** `.interruptor:focus-visible`
- **Estado seleccionado:** `.interruptor[aria-checked="true"] .interruptor-pista`, `.interruptor[aria-checked="true"] .interruptor-pulgar`
- **Estado deshabilitado:** `.interruptor[aria-disabled="true"]`, `.interruptor[aria-disabled="true"] .interruptor-pista`
- **Estado movimiento_reducido:** `.motion .interruptor-pulgar`
- **Estado colores_forzados ((forced-colors: active)):** `.interruptor-pista`, `.interruptor[aria-checked="true"] .interruptor-pista`
- **presionado: no aplica.** El cambio de estado es la respuesta (el pulgar se desliza); sin escala.
- **ARIA:** Switch (https://www.w3.org/WAI/ARIA/apg/patterns/switch/) · `role=switch` `aria-checked` `aria-disabled` `aria-describedby=motion-nota` · **Teclado:** Espacio y Enter alternan; el foco se queda en el interruptor.
- **QA:** `tools/qa/motion.mjs` `tools/qa/controles.mjs` `tools/qa/axe.mjs` `tools/qa/inp.mjs`

### ContactoPie

El pie es el único lugar con el contacto: titular «Contacto», para qué escribir y WhatsApp · Instagram · Facebook · Correo en una lista agrupada de filas de 56 con su icono; debajo, «Pausar el movimiento».

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Contacto en un solo lugar» (2026-11-13).
- **style.css:** `.ftr` `.ftr-contacto` `.ftr-title` `.ftr-lede` `.ftr-links` `.ftr-link` `.ftr-ne`
- **mobile.css:** `.ftr`
- **index.html:** `.ftr` `.ftr-links` `.ftr-link` `#ftr-title`
- **Tokens:** `fondo` `fondo-2` `tinta` `tinta-2` `turquesa-texto` `linea` `radio-md` `radio-sm` `alto-md` `t-titulo-2` `t-subtitulo` `t-cuerpo` `anillo-foco` `space-1` `space-3` `space-4` `space-6` `space-8`
- **Estado hover:** `.ftr-link:hover span`
- **Estado foco:** `.ftr-link:focus-visible`
- **presionado: no aplica.** Enlaces de una lista agrupada: responde el subrayado y el foco (convención de lista de iOS).
- **ARIA:** Landmark contentinfo + lista de enlaces (https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/contentinfo.html) · `aria-labelledby=ftr-title` · **Teclado:** Tab entre enlaces.
- **QA:** `tests/site.test.mjs` `tools/qa/controles.mjs` `tools/qa/contrast.mjs`

### Insignia

Píldora de 24 en Caption 1: tipo de propuesta (menta), estado callado (fondo-3), «Hoy», «Nuevo»; disco de conteo de Mi lista (primario); punto de Abierto/Cerrado (cerrado es un aro hueco: forma además de color).

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Tokens» (abierto, cerrado) y «Accesibilidad» (estados con forma además del color).
- **Variantes:** `.badge` tipo (Menta con en-menta.); `.badge--quiet` callada (fondo-3 con tinta-2.); `.count-badge` conteo (Disco primario; el número también en texto.); `.status-dot` estado (Abierto / Cerrado, siempre con la palabra.)
- **style.css:** `.badge` `.badge--quiet` `.badge-new` `.count-badge` `.status-dot` `.news-dot`
- **index.html:** `.count-badge` `.status-dot` `[data-status]`
- **app.js:** exporta `openingStatus` `monterreyNow`
- **feed.js:** exporta `eventBadge`
- **Tokens:** `menta` `en-menta` `fondo-3` `tinta-2` `primario` `en-primario` `abierto` `cerrado` `radio-pildora` `space-1` `space-2` `font-texto`
- **Estado abierto:** `[data-open="true"] .status-dot`
- **Estado cerrado:** `[data-open="false"] .status-dot`
- **Estado oculto:** `.count-badge[hidden]`
- **hover: no aplica.** No es un control.
- **foco: no aplica.** No es un control.
- **ARIA:** Texto (sin rol) (https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) · `aria-hidden en el disco (el número va en .sr-only)` · **Teclado:** —
- **QA:** `tools/qa/contrast.mjs` `tests/site.test.mjs`

### Esqueletos

Esqueletos quietos del tamaño final (sin animación de pulso): tarjetas de la rejilla y del carrusel, chips de colección, grupos de filtros, tarjetas de la carta y la tira de Novedades. Reservan el alto exacto: al llegar el contenido nada se mueve.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Esqueletos».
- **style.css:** `.sk-line` `.sk-line--s` `.sk-group` `.card--sk` `.sk-chip`
- **index.html:** `.card--sk` `.sk-chip` `.sk-group` `.sk-line`
- **Tokens:** `fondo-3` `radio-portada` `radio-pildora` `alto-md` `space-3` `space-4` `space-6` `space-20`
- **Estado ocupado:** `.cat-grid[aria-busy="true"]`, `.card--sk`, `.card--sk .card`, HTML `[aria-busy="true"]`
- **movimiento_reducido: no aplica.** No se mueven nunca (quietos por diseño).
- **ARIA:** aria-busy en la región que carga (https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) · `aria-busy` `aria-hidden (cada esqueleto)` · **Teclado:** No enfocables (pointer-events: none).
- **QA:** `tools/qa/skeleton.mjs` `tools/qa/e2e.mjs`

### CarruselNovedades

Solo existe con llegadas registradas en assets/data/collections.json (hoy la lista está vacía: no hay sección, enlace ni control). Tira de portadas de 120 (152 desde 768) que «Ver todo» / «Ver menos» despliega en rejilla; «Nuevo» marca lo no visto.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Catálogo y Novedades» (Novedades).
- **style.css:** `.news` `.news-head` `.news-toggle` `.news-list` `.news-item` `.news-book` `.badge-new` `.news-status`
- **index.html:** `#novedades` `[data-news]` `[data-news-toggle]` `[data-news-track]` `[data-news-status]` `[data-news-link]`
- **news.js:** exporta `initNews` `initNewsCount` `newsPlan` `newsEntries` `isNew` `validDay` `statusLine` `hintLine` `wireToggle` `NEWS_SIZE` `NEW_DAYS`
- **assets/js/boot.js:** ganchos `iti-news-estado` `has-news` `news-hint`
- **Tokens:** `fondo` `fondo-2` `fondo-3` `primario` `en-primario` `tinta` `tinta-2` `radio-portada` `sombra-portada` `anillo-foco` `t-subtitulo` `t-nota-pie` `space-2` `space-3` `space-5` `dur-instantanea` `dur-base` `curva-resorte`
- **Estado hover:** `.news-book:hover .cover`
- **Estado foco:** `.news-book:focus-visible .cover`
- **Estado presionado:** `.news-book:active`, `.news-book[data-opening]`
- **Estado deshabilitado:** `.news-toggle:disabled`
- **Estado expandido:** `.news.is-open .news-list`, news.js `toggle.setAttribute('aria-expanded', String(open))`
- **Estado ocupado:** `.news-item.card--sk .cover`, HTML `[data-news-track][aria-busy="true"]`
- **Estado vacio:** `html:not(.has-news) :is(.news, [data-news-link])` — Sin llegadas la sección no existe (por diseño).
- **Estado movimiento_reducido:** `.motion .news.is-in .badge-new`
- **ARIA:** Disclosure (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) · `aria-expanded` `aria-controls=news-list` `aria-haspopup=dialog` · **Teclado:** «Ver todo» con Enter/Espacio; el foco se queda en el botón.
- **QA:** `tests/site.test.mjs` `tools/qa/skeleton.mjs`

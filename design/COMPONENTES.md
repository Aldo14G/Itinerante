<!-- GENERADO por scripts/build-componentes.mjs desde design/componentes.json y design/tokens.json. No editar a mano: `npm run componentes`. -->

# Componentes del sitio · «Itinerante Líquido»

Catálogo de 38 componentes (versión 2026-11-16). La fuente es `design/componentes.json` (formato plano inspirado en `registry-item.json` de shadcn/ui, MIT; origen en `docs/ux/FUENTES.md`). `tests/componentes.test.mjs` comprueba que existe todo lo que nombra (archivos, selectores, funciones, tokens y herramientas), que cada estado declarado está en el CSS o el JS con su condición (hover solo dentro de `@media (hover: hover)`, foco con `:focus-visible`, movimiento solo bajo `.motion` o neutralizado con `prefers-reduced-motion`…) y el contraste de cada par en claro y oscuro.

Regla de atributos: **clase = parte o variante, `aria-*` = estado, `data-*` = gancho de JavaScript** (DESIGN.md).

## Tabla de estados por control

«sí» = el estado existe y la prueba lo encuentra; «—» = no aplica (la razón va en el detalle); en blanco = el componente no lo declara.

| Componente | Hover (puntero fino) | Foco visible | Presionado | Deshabilitado | Seleccionado | Actual | Expandido | Ocupado | Vacío | Error | Mov. reducido |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Boton | sí | sí | sí | sí | sí |  |  |  |  |  | sí |
| BotonGuardar | — | sí | sí |  | sí |  |  |  |  |  | sí |
| Chip | sí | sí | sí |  | sí |  | sí | sí |  |  | sí |
| Recorrido | — | — |  |  | sí |  |  |  |  |  | sí |
| BarraNavegacion | sí | sí | sí | — |  | sí |  |  |  |  |  |
| MenuHamburguesa | sí | sí | sí |  |  | sí | sí |  |  |  | sí |
| BarraInferior | — | sí | sí |  |  | sí |  |  |  |  |  |
| Carrusel3D | — | sí | sí | sí |  | sí |  |  |  |  | sí |
| CarruselPortadas (variante de Carrusel3D) |  |  |  |  |  | sí |  | sí |  | sí |  |
| EventoDestacado | — | sí |  |  |  |  |  |  | sí | sí | sí |
| ListaEventos | — | sí |  |  |  |  |  |  | sí | sí | sí |
| BloqueFecha | — | — |  |  |  |  |  |  |  |  |  |
| EventosAnteriores | sí | sí | sí |  |  |  | sí |  | sí |  | sí |
| FilaEventoAnterior | — | — |  |  |  |  |  |  |  | sí |  |
| AvisoEvento | sí | sí |  |  |  |  |  |  |  |  |  |
| GaleriaCarta (variante de Carrusel3D) |  | sí | sí | sí |  | sí |  |  | sí | sí | sí |
| BarraCategorias | sí | sí | sí |  |  | sí |  | — |  |  | sí |
| FilaProducto | — | — | — |  |  |  |  | — | sí | sí |  |
| TarjetaLibro | sí | sí | sí |  |  |  |  | sí |  |  | sí |
| FichaLibro | sí | sí | sí |  |  |  |  |  |  |  | sí |
| MiLista | — | sí |  |  |  |  |  |  | sí | sí | sí |
| AsaHoja | — | — | sí | — |  |  |  |  |  |  | sí |
| CampoBusqueda | sí | sí |  |  | sí |  | sí |  |  |  |  |
| Explorar | sí | sí | sí |  | sí |  | sí | sí | sí | sí | sí |
| Aviso | — | sí | sí |  |  |  |  |  |  |  |  |
| EncabezadoSeccion | — | — |  |  |  |  |  |  |  |  | sí |
| TiraCasa |  | sí |  | sí |  |  |  |  |  |  | sí |
| MapaLlegada | — | sí |  |  |  |  |  |  |  |  | sí |
| InterruptorMovimiento | sí | sí | sí | sí | sí |  |  |  |  |  | sí |
| ContactoPie | sí | sí | sí |  |  |  |  |  |  |  |  |
| Insignia | — | — |  |  |  |  |  |  |  |  |  |
| Esqueletos |  |  |  |  |  |  |  | sí |  |  | — |
| CarruselNovedades | sí | sí | sí | sí |  |  | sí | sí | sí |  | sí |
| IntroMarca | — | — |  |  |  | sí |  |  |  |  | sí |
| PreguntasFrecuentes | sí | sí | sí |  |  |  | sí |  |  |  | sí |
| Editoriales | sí | sí | sí |  |  |  | sí |  | sí |  |  |
| FranjaEditoriales | sí | sí | sí |  |  |  |  |  | sí |  | sí |
| TarjetaMerch | sí | sí | sí |  |  |  |  |  | sí | sí | sí |

Estados propios de algún componente, fuera de la tabla: `oculto`, `tactil`, `plano`, `abriendo`, `abierto`, `colores_forzados`, `cerrado` (ver el detalle).

## Pares de contraste

Calculados desde `design/tokens.json`. Texto ≥ 4.5:1 (WCAG 1.4.3); borde de control, icono y foco ≥ 3:1 (WCAG 1.4.11). `vidrio@peor`: el vidrio compuesto sobre negro (claro) o blanco (oscuro). `mezcla:a+b@p`: `color-mix(in oklab, a, b p%)`, el hover de chips y botones.

| Frente | Fondo | Tipo | Mínimo | Claro | Oscuro | Dónde |
|---|---|---|--:|--:|--:|---|
| `en-primario` | `primario` | texto | 4.5 | 6.33 | 7.71 | Boton primario, chip elegido, guardado, Insignia de conteo, «Nuevo» |
| `en-primario` | `primario-presionado` | texto | 4.5 | 9.05 | 10.25 | Boton primario con el cursor |
| `en-primario` | `primario-pulsado` | texto | 4.5 | 12.13 | 11.74 | Boton primario, chip elegido, guardado e interruptor encendido mientras se presionan (:active) |
| `en-menta` | `menta-presionado` | texto | 4.5 | 5.69 | 4.72 | Boton secundario, fila actual del menú, casilla actual de la barra inferior y acción del Aviso mientras se presionan |
| `tinta` | `fondo-3-presionado` | texto | 4.5 | 11.21 | 7.74 | Chip, contorno, ☰, fila del menú, casilla de la barra inferior y botón de vidrio presionados |
| `tinta-2` | `fondo-3-presionado` | texto | 4.5 | 4.58 | 5.15 | «Buscar en el catálogo» presionado |
| `primario-presionado` | `fondo-3-presionado` | texto | 4.5 | 6.03 | 5.40 | Boton plano presionado (su texto pasa a primario-presionado) |
| `en-menta` | `menta` | texto | 4.5 | 7.69 | 6.54 | Boton secundario, actual de la barra y del menú, pastilla de la barra inferior, Insignia de tipo, acción del Aviso, selección de texto |
| `en-menta` | `mezcla:menta+en-menta@10` | texto | 4.5 | 6.51 | 5.31 | Boton secundario con el cursor |
| `turquesa-texto` | `fondo` | texto | 4.5 | 6.33 | 11.44 | Boton plano, Recorrido («Llevas N de 3 paradas»), enlaces |
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
| `linea-fuerte` | `fondo-2` | borde | 3 | 4.49 | 6.06 | Casilla de filtro sobre su grupo, pista del interruptor con Novedades, Boton de contorno y línea de la fecha en la lista de Eventos |
| `linea-fuerte` | `fondo-3` | borde | 3 | 4.07 | 4.57 | Pista del interruptor apagada (filete interior) |
| `linea-fuerte` | `superficie` | borde | 3 | 4.80 | 5.17 | Borde de Boton de contorno y línea que separa la fecha del título, sobre el panel del destacado |
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
| `tinta` | `intro-resalte` | texto | 4.5 | 11.64 | 6.83 | Entrada de marca: «Itinerante y Más» sobre el trazo de marcatextos |

## Detalle

### Boton

Píldora con rótulo Headline. Alto 48 por omisión, 44 (--sm) solo en línea y en las barras, 56 (--lg) en las acciones principales y el pie de las hojas. Una sola primaria por vista.

- **Tipo:** control · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Botón) y «Escala de controles».
- **Variantes:** `.btn--primario` primario (La acción primaria de la vista («Cómo llegar»; en la ficha, «Consultar disponibilidad», 2026-11-19). Una por vista.); `.btn--secundario` secundario (Secundaria «tinted» en menta; alternado con aria-pressed toma el primario. También la salida principal de un estado vacío («Quitar filtros»; sin filtros, «Preguntar por WhatsApp»; 2026-11-19).); `.btn--plano` plano (Texto en turquesa-texto, sin relleno (Mi lista de la barra, redes del menú, «Ver todo»).); `.btn--contorno` contorno (Sin relleno, borde de 1 px en linea-fuerte y texto en tinta (Eventos, 2026-11-16: «Registrarme» y «Añadir al calendario» de la lista y los iconos del destacado, para lo que no debe competir con la primaria). Mismas alturas (44) y estados que las demás. Desde el 2026-11-19 también la salida secundaria del estado vacío de Explorar y los controles de la tira de La casa (44, icono).); `.btn--vidrio` vidrio (Solo lo que flota: cerrar una hoja, flechas del Carrusel3D.); `.btn--icono` icono (Cuadrado del alto del botón, nombre en aria-label.); `.btn--sm` chico (44 px.); `.btn--lg` grande (56 px.); `.btn--ancho` ancho (A todo el ancho.)
- **style.css:** `.btn` `.btn--primario` `.btn--secundario` `.btn--plano` `.btn--contorno` `.btn--vidrio` `.btn--icono` `.btn--sm` `.btn--lg` `.btn--ancho`
- **index.html:** `.btn` `.btn--primario` `.btn--secundario` `.btn--plano` `.btn--vidrio` `.btn--icono` `.btn--sm` `.btn--lg`
- **motion.js:** exporta `pickPop` `afterPaint` `confirmThen`
- **Tokens:** `alto-sm` `alto-md` `alto-lg` `linea-fuerte` `radio-pildora` `t-boton` `ls-boton` `t-boton-chico` `ls-boton-chico` `space-2` `space-4` `space-5` `space-6` `primario` `en-primario` `primario-presionado` `menta` `en-menta` `turquesa-texto` `fondo-3` `tinta` `tinta-2` `vidrio` `vidrio-hoja` `filtro-vidrio` `luz-vidrio` `sombra-flotante` `anillo-foco` `dur-instantanea` `dur-rapida` `curva-salida` `curva-resorte` `primario-pulsado` `menta-presionado` `fondo-3-presionado` `deshabilitado`
- **Estado hover:** `.btn--primario:hover`, `.btn--secundario:hover`, `.btn--vidrio:hover`, `.btn--plano:hover`, `.btn--contorno:hover`
- **Estado foco:** `.btn:focus-visible`, `.btn--vidrio:focus-visible`
- **Estado presionado:** `.btn:active`, `.btn--primario:active`, `.btn--secundario:not([aria-pressed="true"]):active`, `.btn--plano:active`, `.btn--contorno:active`, `.btn--vidrio:active` — Un tono por familia (2026-11-16): primario-pulsado, menta-presionado y fondo-3-presionado, un paso más allá del hover. Responde también con movimiento reducido y con la pausa; la escala 0.97 solo con movimiento.
- **Estado deshabilitado:** `.btn:disabled`, `.btn[aria-disabled="true"]`
- **Estado seleccionado:** `.btn--secundario[aria-pressed="true"]`
- **Estado movimiento_reducido:** `.btn:active` — En prefers-reduced-motion y con la pausa la escala al presionar se quita; el color de :active (tono propio de la familia, distinto del hover) sigue respondiendo.
- **ARIA:** Button (https://www.w3.org/WAI/ARIA/apg/patterns/button/) · `aria-pressed` `aria-disabled` `aria-label` · **Teclado:** Enter y Espacio (nativo de <button>); los enlaces con cara de botón, Enter.
- **QA:** `tools/qa/controles.mjs` `tools/qa/contrast.mjs` `tools/qa/axe.mjs` `tests/critique.test.mjs` `tools/qa/guias.mjs`

### BotonGuardar

«Guardar en Mi lista»: vidrio de 44 sobre la portada (.save), secundario ancho (.save--wide) o icono de 56 en la ficha (.save--icono). Guardado = primario con el marcador relleno y su palomita.

- **Tipo:** control · **desde** 2026-11-13 · DESIGN.md, «Ronda de animaciones» (palomita de Guardar, 2026-11-14).
- **Variantes:** `.save` sobre-portada (Vidrio de 44 en la esquina de la portada (rejilla y carrusel; en el carrusel solo la central).); `.save--wide` ancho (Botón menta con rótulo.); `.save--icono` icono (Icono de 56 en las acciones de la ficha; el rótulo es su nombre accesible.)
- **style.css:** `.save` `.save--wide` `.save--icono` `.save-chk`
- **index.html:** `[data-d-save]` `.save--icono`
- **saved.js:** exporta `saveButton` `bindSaveButton` `toggleSaved` `isSaved` `savedIds` `MAX_SAVED`
- **motion.js:** exporta `pickPop`
- **Tokens:** `alto-sm` `alto-md` `alto-lg` `vidrio` `filtro-vidrio` `luz-vidrio` `sombra-flotante` `primario` `en-primario` `menta` `en-menta` `tinta` `fondo` `foco` `anillo-foco` `dur-instantanea` `dur-rapida` `dur-base` `curva-salida` `primario-pulsado` `fondo-3-presionado`
- **Estado foco:** `:is(.chip, .cat-filters-btn, .cat-chip, .save, .explore-open, .rel, .card):focus-visible`, `:is(.rail-item, .card-item) .save:not(.save--wide):focus-visible`
- **Estado presionado:** `.save:active`, `.save[aria-pressed="true"]:not(.save--wide):active`, `.save:not([aria-pressed="true"]):not(.save--wide):active` — Escala 0.94 con movimiento y, siempre, el color: guardado a primario-pulsado, sin guardar a fondo-3-presionado (también en los respaldos opacos del vidrio).
- **Estado seleccionado:** `.save[aria-pressed="true"]:not(.save--wide)`, `.save[aria-pressed="true"] .ic`, `.save[aria-pressed="true"] .save-chk`, `.save--wide[aria-pressed="true"]`, saved.js `btn.setAttribute('aria-pressed', String(on))`
- **Estado movimiento_reducido:** `.motion .save.is-pop .save-chk`, `.save:active`
- **hover: no aplica.** Sin cambio al pasar el cursor: el vidrio sobre la portada ya se lee como botón; el cursor cambia (cursor: pointer).
- **ARIA:** Button (alternado) (https://www.w3.org/WAI/ARIA/apg/patterns/button/) · `aria-pressed` `aria-label` · **Teclado:** Enter y Espacio alternan; el nombre dice el libro y la acción («Guardar «…» en mi lista» / «Quitar…»).
- **QA:** `tools/qa/saved.mjs` `tools/qa/ficha.mjs` `tools/qa/inp.mjs` `tools/qa/controles.mjs`

### Chip

Píldora de 48 en fondo-3; elegido = primario con la palomita (trazo SVG que se dibuja al elegir). En fila es un radiogroup (colecciones del Catálogo, Café · Té); en Explorar, el filtro activo (.cat-chip) y el botón «Filtros».

- **Tipo:** control · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Chip) y «Ronda de animaciones» (palomita que se dibuja).
- **Variantes:** `.chip` radio (role=radio dentro de role=radiogroup (rail.js chipNode). La barra de categorías de la carta ya no usa chips (2026-11-17: enlaces .ct-tab de BarraCategorias).); `.cat-chip` filtro-activo (Filtro aplicado en Explorar, con su × para quitarlo.); `.cat-filters-btn` filtros (Abre los filtros hasta 1100 px (aria-expanded).)
- **style.css:** `.chip` `.chip-chk` `.cat-chip` `.cat-filters-btn` `.rail-chips`
- **index.html:** `[data-rail-chips]` `[data-cat-filters-btn]` `.rail-chips`
- **carousel3d.js:** exporta `wireRadioChips` `checkMark` `checkChip`
- **rail.js:** exporta `chipNode`
- **motion.js:** exporta `drawCheck`
- **Tokens:** `alto-md` `radio-pildora` `space-2` `space-4` `fondo-3` `tinta` `primario` `en-primario` `t-chip` `ls-chip` `anillo-foco` `dur-instantanea` `dur-rapida` `curva-salida` `primario-pulsado` `fondo-3-presionado`
- **Estado hover:** `:is(.chip:not([aria-checked="true"]), .cat-filters-btn:not([aria-expanded="true"])):hover`
- **Estado foco:** `:is(.chip, .cat-filters-btn, .cat-chip, .save, .explore-open, .rel, .card):focus-visible`
- **Estado presionado:** `.chip:active`, `.cat-filters-btn:active`, `.cat-chip:active`, `.chip[aria-checked="true"]:active` — Sin elegir, fondo-3-presionado; elegido, primario-pulsado; la escala 0.96 solo con movimiento.
- **Estado seleccionado:** `.chip[aria-checked="true"]`, `.chip[aria-checked="true"] > .chip-chk`, carousel3d.js `c.setAttribute('aria-checked', String(on))`
- **Estado expandido:** `.cat-filters-btn[aria-expanded="true"]`
- **Estado ocupado:** `.sk-chip`, HTML `.sk-chip`
- **Estado movimiento_reducido:** `.motion .is-dibuja > .chip-chk path`, `.chip:active`
- **ARIA:** Radio Group (https://www.w3.org/WAI/ARIA/apg/patterns/radio/) · `role=radiogroup` `role=radio` `aria-checked` `aria-label` · **Teclado:** Un solo punto de tabulación (el elegido); ← → ↑ ↓ mueven el foco y eligen (wireRadioChips).
- **QA:** `tools/qa/rail.mjs` `tools/qa/controles.mjs` `tools/qa/inp.mjs` `tools/qa/feed.mjs` `tools/qa/guias.mjs`

### Recorrido

Recorrido ligero sobre los chips del Catálogo (A4): conector de 2 px entre paradas (primario entre dos hojeadas, que crece una vez), palomita y borde primario en las hojeadas y el estado del recorrido («3 paradas por recorrer» → «Llevas N de 3 paradas» → «Recorriste las 3 paradas», 2026-11-18) en región viva, junto a la nota de la colección y en el eje izquierdo (2026-11-15: 16 px después en su renglón desde 761 px; debajo a 8 en el teléfono). Se guarda en localStorage (iti-recorrido-v2).

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
- **QA:** `tools/qa/rail.mjs` `tools/qa/motion.mjs` `tests/site.test.mjs` `tools/qa/guias.mjs`

### BarraNavegacion

Barra pegada arriba, de vidrio, de 44 px más el área segura (64 desde 761): marca y ☰ en el teléfono; Mi lista y «Cómo llegar» desde 761; las secciones con la pastilla menta en la actual desde 1101. Al desplazar flota; «Cómo llegar» cede su sitio si otra primaria está a la vista.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Barra de navegación) y «Barra de navegación desde 1101 px».
- **style.css:** `.hdr` `.hdr.is-solid` `.hdr-brand` `.hdr-nav` `.hdr-nav a` `.hdr-end` `.hdr-list` `.hdr-cta` `.hdr.has-primary .hdr-cta`
- **index.html:** `.hdr` `[data-hdr]` `.hdr-brand` `.hdr-nav` `.hdr-cta` `.hdr-list` `[data-open-mylist]`
- **app.js:** internas `spy` `updateStatus` · ganchos `navLinks.forEach(a =>`
- **Tokens:** `alto-barra-nav` `alto-sm` `vidrio` `filtro-vidrio` `luz-vidrio` `sombra-flotante` `menta` `en-menta` `fondo-3` `tinta` `radio-pildora` `radio-sm` `t-titular` `t-boton-chico` `anillo-foco` `dur-rapida` `curva-salida` `space-16` `fondo-3-presionado` `menta-presionado`
- **Estado hover:** `.hdr-nav a:not([aria-current="true"]):hover`
- **Estado foco:** `.hdr-brand:focus-visible`, `.hdr-nav a:focus-visible`
- **Estado actual:** `.hdr-nav a[aria-current="true"]`, app.js `a.setAttribute('aria-current', 'true')`
- **Estado presionado:** `.hdr-nav a:not([aria-current="true"]):active`, `.hdr-nav a[aria-current="true"]:active`
- **deshabilitado: no aplica.** Nada se deshabilita en la barra.
- **ARIA:** Landmark navigation + aria-current (https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html) · `aria-label=Secciones` `aria-current` · **Teclado:** Tab entre enlaces; Enter sigue el enlace.
- **QA:** `tools/qa/e2e.mjs` `tools/qa/responsive.mjs` `tools/qa/controles.mjs` `tools/qa/axe.mjs` `tools/qa/guias.mjs`

### MenuHamburguesa

☰ de 44 cuyas líneas se cruzan en ×, y el diálogo modal con la hoja de vidrio: secciones en filas de 56 (la actual en menta), el horario de hoy, «Cómo llegar», WhatsApp e Instagram/Facebook. Detrás, el velo. Sin la fila «Mi lista» desde el 2026-11-19: vive en la barra inferior (teléfono) y en la cabecera (761–1100). La barra inferior lleva lo frecuente; el ☰, todas las secciones, el horario, el contacto y la pausa.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Menú ☰).
- **style.css:** `.menu-btn` `.menu-lines` `.menu` `.menu::backdrop` `.menu-hoja` `.menu-row` `.menu-close` `.menu-pie` `.menu-acciones` `.menu-redes`
- **index.html:** `#menu` `[data-menu-open]` `[data-menu-close]` `.menu-row` `.menu-hoja`
- **sheets.js:** exporta `openDialog` `closeDialog` `pushSheet` `navigateFromSheet`
- **app.js:** ganchos `opener.setAttribute('aria-expanded', 'true')`
- **Tokens:** `alto-sm` `alto-lg` `vidrio` `vidrio-hoja` `filtro-vidrio` `filtro-vidrio-hoja` `luz-vidrio` `sombra-hoja` `sombra-flotante` `velo` `menta` `en-menta` `fondo-3` `tinta` `tinta-2` `linea` `foco` `anillo-foco` `radio-lg` `radio-sm` `t-titulo-2` `dur-instantanea` `dur-rapida` `dur-base` `escalon-linea` `curva-salida` `curva-resorte` `fondo-3-presionado` `menta-presionado` `curva-aceleracion`
- **Estado hover:** `.menu-btn:hover`, `.menu-row:not([aria-current="true"]):hover`
- **Estado foco:** `.menu-btn:focus-visible`, `.menu-row:focus-visible`, `.menu-close:focus-visible`
- **Estado presionado:** `.menu-btn:active`, `.menu-row:active`, `.menu-row[aria-current="true"]:active`, `.menu-close:active`
- **Estado actual:** `.menu-row[aria-current="true"]`
- **Estado expandido:** `[aria-expanded="true"] > .menu-lines span:nth-child(1)`, HTML `[aria-expanded="false"]`
- **Estado movimiento_reducido:** `.motion .menu.is-closing .menu-hoja`, `.menu-btn:active`
- **ARIA:** Dialog (Modal) + Disclosure (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) · `aria-expanded` `aria-controls` `aria-labelledby` `aria-current` · **Teclado:** Enter/Espacio abre; foco a la primera sección; Tab atrapado (showModal); Escape, el velo y «atrás» cierran; elegir una sección lleva el foco a su titular.
- **QA:** `tools/qa/e2e.mjs` `tools/qa/axe.mjs` `tools/qa/inp.mjs` `tools/qa/motion.mjs` `tools/qa/contrast.mjs` `tools/qa/guias.mjs`

### BarraInferior

Solo ≤ 760 px: cápsula de vidrio de 49 × 228 que flota 8 px sobre el área segura, centrada, con Inicio, Catálogo y Mi lista (botón con el conteo); tres casillas de 76 × 49 sin huecos entre objetivos. La pastilla menta se desliza a la casilla con aria-current; con una hoja abierta baja y se oculta. 2026-11-19: la barra anclada de la iteración de lectura se retiró por decisión de Aldo («volver a la cápsula flotante»). Mitigación que no cambia su forma: el documento le deja su sitio (html: scroll-padding-bottom de 49 + área + 24, el foco por teclado queda 16 px sobre su borde; .ftr: padding-bottom de 49 + área + 32, el último control del pie queda 24 px sobre ella; el inicio descuenta su alto, su aire al borde y 16 de respiro). Lo que sigue pasando por debajo de ella mientras se desplaza es inherente a un elemento flotante (DESIGN.md, «Vuelta a la cápsula»). Catálogo lleva a #libros, el mismo sitio que el menú ☰ y la barra de escritorio; Inicio abarca también La casa (data-zona).

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Barra inferior).
- **mobile.css:** `.tabbar` `.tabbar-pastilla` `.tabbar a` `.tab-list` `.tab-ic` `.tab-lb` `.tab-ic-box`
- **index.html:** `.tabbar` `.tabbar-pastilla` `.tab-list` `.tab-lb`
- **app.js:** ganchos `a.setAttribute('aria-current', 'location')`
- **Tokens:** `alto-barra-inferior` `vidrio` `filtro-vidrio` `luz-vidrio` `sombra-flotante` `menta` `en-menta` `tinta` `foco` `radio-pildora` `t-pestana` `space-1` `space-2` `space-6` `space-8` `dur-instantanea` `dur-rapida` `dur-base` `curva-salida` `curva-resorte` `fondo-3-presionado` `menta-presionado`
- **Estado foco:** `.tabbar a:focus-visible`, `.tab-list:focus-visible`
- **Estado presionado:** `.tabbar a:active`, `.tab-list:active`, `.tabbar a[aria-current]:active` — Escala 0.94 y color (fondo-3-presionado; la casilla actual, menta-presionado): con movimiento reducido el color es la respuesta.
- **Estado actual:** `.tabbar a[aria-current]`, `.tabbar a[aria-current] .tab-ic`
- **Estado oculto:** `html.sheet-open .tabbar` — Con una hoja abierta (estado de la página, no del control).
- **hover: no aplica.** Solo existe en el teléfono (mobile.css, ≤ 760 px).
- **ARIA:** Landmark navigation + aria-current (https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html) · `aria-label=Accesos` `aria-current=location` · **Teclado:** Tab entre las tres casillas; Mi lista es un botón (Enter/Espacio).
- **QA:** `tools/qa/feed.mjs` `tools/qa/controles.mjs` `tools/qa/responsive.mjs`

### Carrusel3D

El motor del carrusel de portadas del Catálogo (los de Eventos y de la carta se retiraron el 2026-11-16: ahora son una lista y una parrilla): desplazamiento nativo con imán al centro y una pose por fotograma según la distancia al centro (giro hasta 44°, hueco ≥ 12 px con la vecina). Solo la central con sombra-portada; flechas de vidrio de 48 solo con puntero fino; plano y con la imagen de las vecinas atenuada sin movimiento.

- **Tipo:** control · **desde** 2026-11-13 · DESIGN.md, «Carrusel3D, Eventos, Café y té…» y «Norma del Carrusel3D afinada»; skill ux-apple §3.
- **Variantes:** `.c3d--portada` portada (Catálogo (rail.js): CarruselPortadas.)
- **style.css:** `.c3d` `.c3d-viewport` `.c3d-track` `.cf-pose` `.c3d-flecha` `.c3d-flecha--prev` `.c3d-flecha--next` `.c3d--portada`
- **index.html:** `.c3d` `.c3d-viewport` `.c3d-track` `.c3d-flecha` `[data-rail-c3d]`
- **carousel3d.js:** exporta `createCarousel3D` `coverflowPose` `nearestIndex` `keyTarget` `CF_GIRO` `POSE` `ATENUADA` `initDepth` `tiltPose` `tiltTransform`
- **Tokens:** `giro-carrusel` `perspectiva-carrusel-piezas` `inclinacion-max` `adelanto-profundidad` `perspectiva-inclinacion` `sombra-portada` `sombra-flotante` `alto-md` `space-2` `space-3` `space-4` `space-6` `space-12` `margen-movil` `anillo-foco` `dur-instantanea` `dur-rapida` `dur-base` `curva-salida` `curva-resorte`
- **Estado foco:** `.rail-item .card:focus-visible .cover`, `.btn:focus-visible` — Una sola parada de tabulador: la portada central (su anillo se dibuja en la portada).
- **Estado deshabilitado:** `.c3d-flecha:disabled`
- **Estado actual:** `.rail-item.is-centro .cover` — La central: estado solo visual; la región viva anuncia la pieza que llega.
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

### EventoDestacado

El próximo evento con fecha (feed.js, datos en assets/data/eventos.json): panel en superficie con borde de 1 px (linea) y sin sombra, foto 16:9 a sangre o cartel entero y cuadrado como objeto sobre fondo-3 (encuadre), BloqueFecha (fecha tipográfica) separado del título por una línea fina, «Próximo» (u «Hoy», la única insignia con relleno), tipo y ciclo como texto, título (Title 1), descripción, los datos como lista de definición entre líneas finas (Hora · Con · Invita · Colabora · Costo, solo los que el evento trae; el costo con sus renglones tal como los da la librería) y acciones: la reserva del evento como primaria de 56 («Registrarme», enlace a Luma en otra pestaña, o «Reservar por WhatsApp» con el mensaje escrito; sin reserva, «Añadir al calendario») y los iconos de contorno de 44 «Añadir al calendario» y «Compartir». Desde 1024 px, cuerpo en las columnas 1–6 y foto en 7–12. Solo existe con un evento con fecha vigente.

- **Tipo:** bloque · **desde** 2026-11-16 · DESIGN.md, «Eventos: destacado y lista por fecha; carta en parrilla» (2026-11-16).
- **Variantes:** `.ev-prox` foto (Fotografía 16:9 (teléfono) o a todo el alto de la mitad 7–12 (escritorio), recortada (cover).); `.ev-prox--cartel` cartel (Cartel cuadrado con texto: entero, 1:1, nunca recortado ni a sangre; sobre fondo-3 con relleno interior de la escala, radio-md, sombra-portada y un anillo de 1 px.); `.ev-prox--sin-foto` sin foto (Evento de la hoja sin cartel (imagen: null) o con una imagen que no carga: sin figura; el cuerpo ocupa 8 columnas en escritorio y todo el ancho en el teléfono.)
- **style.css:** `.ev-prox` `.ev-prox--cartel` `.ev-prox-fig` `.ev-prox-img` `.ev-prox-cuerpo` `.ev-prox-enc` `.ev-prox-id` `.ev-prox-tit` `.ev-prox-desc` `.ev-datos` `.ev-dato` `.ev-dato--costo` `.ev-costo` `.ev-acc` `.ev-rot` `.ev-tipo`
- **index.html:** `[data-ev]` `[data-ev-lede]`
- **feed.js:** exporta `initEventos` `destacadoNode` `eventosNodes` `eventosPlan` `validEventos` `eventosProblems` `validReserva` `validRegistro` `validTelefono` `reservaUrl` `reservaMessage` `quienLine` `icsOf` `downloadIcs` `shareEvento` `shareData` `onAct` `registroName` `reservaName` `calName` `shareName` `EVENTOS_URL` `LUGAR` · internas `reservaLink` `calButton` `shareButton` `costoNode` `datosNode` `enterOnView` · ganchos `dataset.fuente = 'anuncio'` `a.rel = 'noopener noreferrer'` `new CustomEvent('iti:primarias')`
- **assets/data/eventos.json:** datos
- **Tokens:** `superficie` `fondo-3` `tinta` `tinta-2` `linea` `linea-fuerte` `radio-lg` `radio-md` `sombra-portada` `t-titulo-1` `t-subtitulo` `t-cuerpo` `t-nota-pie` `t-lectura` `canal-rejilla` `space-1` `space-2` `space-3` `space-4` `space-5` `space-6` `space-8` `space-20` `dur-rapida` `dur-lenta` `escalon-linea`
- **Estado foco:** `.btn:focus-visible` — El panel no es un control: el foco va a sus tres acciones.
- **Estado vacio:** feed.js `if (plan.destacado) out.push(destacadoNode(plan.destacado, now));` — Sin un evento con fecha vigente no hay destacado (por diseño): queda la lista de propuestas.
- **Estado error:** feed.js `img.addEventListener('error', () => { fig.remove(); sinFoto(); })` — Si la imagen no carga (o el evento de la hoja no trae cartel), el destacado queda sin figura y el cuerpo toma el ancho; si eventos.json no llega, queda lo que trae index.html.
- **Estado movimiento_reducido:** `.motion .ev-espera`, feed.js `if (!isMotion() \|\| !('IntersectionObserver' in window)) return;` — La entrada (8 px y opacidad, dur-rapida) solo corre con movimiento y solo en lo que aún no se ve; sin movimiento todo está colocado.
- **hover: no aplica.** La tarjeta no es un control; sus botones usan el hover de Boton.
- **ARIA:** Article + Link + Button (https://www.w3.org/WAI/ARIA/apg/patterns/link/) · `aria-labelledby (el article toma el título)` `aria-label «Registrarme en «título» (abre Luma en otra pestaña)»` `aria-label «Reservar por WhatsApp para «título»»` `aria-label «Añadir «título» al calendario»` `aria-label «Compartir «título»»` `aria-hidden en la fecha tipográfica (la fecha completa va en texto sr-only junto al título)` `dl/dt/dd en los datos` `target=_blank + rel=noopener noreferrer` · **Teclado:** Tab recorre la reserva, el calendario y «Compartir»; Enter o Espacio los activan.
- **QA:** `tools/qa/feed.mjs` `tools/qa/guias.mjs` `tools/qa/hojas.mjs` `tools/qa/inp.mjs` `tests/site.test.mjs`

### ListaEventos

Lista estática de Eventos (estructura tomada de Luma como referencia): «Después» con un día por grupo (en el teléfono, un rótulo en versalitas «SÁB · 28 NOV» con una línea fina; desde 761 px, una columna de 96 a la izquierda con el día y el mes arriba y el número ligero debajo) y, al final, «Propuestas, aún sin fecha». Cada fila (TarjetaEvento) va entre líneas finas, sin relleno: hora y tipo como texto («17:00 · Juego»; una propuesta, su tipo como texto y el rótulo de estado «Propuesta · sin fecha» como píldora de contorno —2026-11-19: antes texto del mismo renglón—), título (Title 3), quién, el primer renglón del costo y la portada cuadrada de 88 / 120 con radio-sm y anillo fino a la derecha; con fecha lleva la reserva de contorno (44) y el calendario plano (44); una propuesta lleva su descripción y ninguna acción. Desde 1024 px la lista va en las columnas 1–8 y la nota lateral («¿Cómo me registro?», fija al desplazar) en 9–12; solo con propuestas, tres por fila con la portada arriba. Sin JavaScript, index.html trae las propuestas.

- **Tipo:** bloque · **desde** 2026-11-16 · DESIGN.md, «Eventos: destacado y lista por fecha; carta en parrilla» (2026-11-16).
- **style.css:** `.ev` `.ev-despues` `.ev-lista` `.ev-sub` `.ev-dias` `.ev-dia` `.ev-dia-tit` `.ev-dia-vis` `.ev-dia-num` `.ev-filas` `.ev-card` `.ev-card-txt` `.ev-card-img` `.ev-card-tit` `.ev-card-meta` `.ev-card-desc` `.ev-card-acc` `.ev-hora` `.ev-estado` `.ev-lado` `.ev-lado-tit` `.ev-lado-txt` `.ev-espera`
- **index.html:** `#cartelera` `.ev-lista` `.ev-propuestas` `.ev-filas` `.ev-fila` `.ev-card` `.ev-card-img` `.ev-card-desc` `[data-ev-when]`
- **feed.js:** exporta `cardNode` `eventosNodes` `notaCopy` `fechaBloque` `horario` `eventBadge` `NO_DATE` · internas `listNode` `notaNode` `staticSignature` `planSignature`
- **Tokens:** `fondo-2` `tinta` `tinta-2` `turquesa-texto` `linea` `linea-fuerte` `radio-sm` `portada-evento` `portada-evento-amplia` `t-titulo-3` `t-titular` `t-versalitas` `t-fecha-lista` `t-subtitulo` `t-lectura` `anillo-foco` `canal-rejilla` `space-1` `space-2` `space-3` `space-4` `space-5` `space-6` `space-8` `space-12`
- **Estado foco:** `.ev-lado-txt a:focus-visible`, `.btn:focus-visible` — La fila no es un control: el foco va a sus acciones y al enlace de la nota.
- **Estado vacio:** feed.js `if (!plan.conFecha && staticSignature(root) === planSignature(plan)) {` — Sin eventos con fecha queda la lista de propuestas de index.html (y la entradilla «Ideas de la casa que todavía buscan fecha…»), sin repintarla; una propuesta no lleva acciones. Los eventos pasados de los últimos 24 meses van aparte, en EventosAnteriores.
- **Estado error:** feed.js `catch { delete root.dataset.ready; return; }` — Si eventos.json no llega, queda lo que trae index.html; una portada que falla se retira y el texto ocupa su sitio.
- **Estado movimiento_reducido:** `.motion .ev-espera`
- **hover: no aplica.** Las filas no son controles (no abren nada): sin cursor de mano ni estados de control; sus botones usan los de Boton.
- **ARIA:** List + Article (https://www.w3.org/WAI/ARIA/apg/practices/structural-roles/) · `ul / li` `aria-labelledby (cada article y cada día)` `aria-label «Propuestas» (grupo sin rótulo visible)` `aria-label de cada acción con el título del evento` · **Teclado:** Tab recorre las acciones de cada tarjeta en el orden de lectura; nada que deslizar.
- **QA:** `tools/qa/feed.mjs` `tools/qa/guias.mjs` `tools/qa/iphone.mjs` `tools/qa/e2e.mjs` `tests/site.test.mjs`

### BloqueFecha

Fecha tipográfica del evento destacado, sin caja: arriba el día de la semana y el mes en versalitas (13, interletra abierta, turquesa-texto) y debajo el número grande y ligero (52, peso 300, cifras tabulares); una línea fina (linea-fuerte) la separa del título, vertical desde 761 px y horizontal en el teléfono. Es decorativa (aria-hidden): la fecha completa va en texto (sr-only) junto al título. En la lista, el rótulo de cada día usa el mismo bloque (número de 32).

- **Tipo:** bloque · **desde** 2026-11-16 · DESIGN.md, «Eventos: destacado y lista por fecha; carta en parrilla» (2026-11-16).
- **style.css:** `.ev-fecha` `.ev-fecha-rot` `.ev-fecha-num`
- **feed.js:** exporta `fechaBloque` `fechaLarga` · internas `fechaNode`
- **Tokens:** `turquesa-texto` `tinta` `linea-fuerte` `space-1` `space-4` `space-6` `t-versalitas` `ls-versalitas` `t-fecha-grande` `ls-fecha-grande`
- **Estado oculto:** feed.js `box.setAttribute('aria-hidden', 'true');` — Oculto para lectores de pantalla: la fecha se lee en el texto sr-only «Sábado 21 de noviembre» junto al título.
- **hover: no aplica.** No es un control.
- **foco: no aplica.** No es un control.
- **ARIA:** Texto decorativo (sin rol) (https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) · `aria-hidden=true` · **Teclado:** —
- **QA:** `tools/qa/feed.mjs` `tests/site.test.mjs`

### EventosAnteriores

Apartado «Eventos anteriores» (2026-11-16) al final de la lista de Eventos, en su misma columna (1–8 desde 1024 px; ancho completo en el teléfono y la tableta): los eventos con fecha anterior a hoy (día de Monterrey) y de los últimos 24 meses pasan solos aquí, del más reciente al más antiguo; lo más viejo no se pinta aunque siga en eventos.json y las propuestas sin fecha nunca entran. Muestra los 6 más recientes y, si hay más, un botón de contorno «Ver los N anteriores» / «Ver menos» (aria-expanded y aria-controls; el foco se queda en el botón; al plegar la página sube lo que encogió para que el botón no se mueva bajo el cursor; las filas que se suman entran escalonadas solo con movimiento). El resto de las filas se arma en el primer despliegue. Sin ningún evento pasado válido el apartado no existe: ni encabezado, ni hueco, ni cambio de alto. Sin JavaScript no aparece (index.html no lo trae).

- **Tipo:** bloque · **desde** 2026-11-16 · DESIGN.md, «Eventos anteriores y ventana de novedades» (2026-11-16).
- **style.css:** `.ev-anteriores` `.ev-pasados` `.ev-fold` `.ev-pasado[hidden]`
- **feed.js:** exporta `foldAnteriores` `shiftMonths` `ANTERIORES_MESES` `ANTERIORES_VISIBLES` `PROXIMOS_MESES` `eventosPlan` · internas `anterioresNode` `wireFold` `staggerIn` `reveal` `timing` · ganchos `btn.setAttribute('aria-expanded', String(expanded))` `btn.setAttribute('aria-controls', ul.id)`
- **Tokens:** `linea` `tinta` `space-4` `space-6` `space-8` `dur-rapida` `dur-lenta` `escalon-linea`
- **Estado hover:** `.btn--contorno:hover` — El botón es un Boton de contorno (44 o 48 según el contexto): sus estados son los de Boton.
- **Estado foco:** `.btn:focus-visible` — El foco se queda en el botón al desplegar y al plegar.
- **Estado presionado:** `.btn--contorno:active`
- **Estado expandido:** feed.js `btn.setAttribute('aria-expanded', String(expanded));` — «Ver los N anteriores» → «Ver menos»: además del texto, aria-expanded.
- **Estado oculto:** `.ev-pasado[hidden]` — Las filas más allá de la sexta se ocultan con hidden mientras el apartado está plegado.
- **Estado vacio:** feed.js `if (plan.anteriores.length) lista.append(anterioresNode(plan, now));` — Sin eventos pasados de los últimos 24 meses no se crea el apartado (hoy, la lista real no tiene ninguno).
- **Estado movimiento_reducido:** `.motion .ev-espera` — Con «reducir movimiento» o la pausa, las filas que se suman aparecen colocadas.
- **ARIA:** Disclosure + List (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) · `section aria-labelledby (el h3 «Eventos anteriores»)` `ul / li` `button aria-expanded y aria-controls (la lista)` `las filas ocultas con hidden` · **Teclado:** Tab llega al botón; Enter o Espacio despliega o pliega; el foco no se mueve.
- **QA:** `tools/qa/feed.mjs` `tools/qa/guias.mjs` `tools/qa/iphone.mjs` `tests/site.test.mjs`

### FilaEventoAnterior

Fila compacta de un evento ya ocurrido dentro de «Eventos anteriores»: entre líneas finas de 1 px y sin relleno, la fecha tipográfica pequeña en versalitas («SÁB · 21 NOV», con el año si no es el año en curso; la fecha completa va en texto sr-only), el título en Headline, «tipo · Con …» en Subheadline (tinta-2) y la portada cuadrada de 64 (88 desde 761 px) con radio-sm y anillo fino; un cartel se recorta a cuadrado en la miniatura. No es un control: sin enlace, sin reserva, sin calendario, sin «Compartir», sin costo ni «Próximo». La miniatura es decorativa (alt vacío) y si no carga se retira: la fila queda sin foto, nunca un recuadro roto.

- **Tipo:** bloque · **desde** 2026-11-16 · DESIGN.md, «Eventos anteriores y ventana de novedades» (2026-11-16).
- **style.css:** `.ev-pasado` `.ev-pas-txt` `.ev-pas-fecha` `.ev-pas-tit` `.ev-pas-meta` `.ev-pas-img`
- **feed.js:** exporta `pasadoNode` `fechaPasada` · ganchos `img.addEventListener('error', () => img.remove())`
- **Tokens:** `tinta` `tinta-2` `linea` `radio-sm` `portada-evento` `t-versalitas` `t-titular` `t-subtitulo` `space-1` `space-4` `space-16`
- **Estado error:** feed.js `img.addEventListener('error', () => img.remove())` — Una portada que falla se retira y el texto ocupa su sitio.
- **Estado oculto:** `.ev-pasado[hidden]` — Plegado, solo se ven las 6 más recientes.
- **hover: no aplica.** No es un control: sin cursor de mano ni estados de control.
- **foco: no aplica.** No es un control: nada que enfocar.
- **ARIA:** List item (sin rol propio) (https://www.w3.org/WAI/ARIA/apg/practices/structural-roles/) · `li con h4 (el título)` `fecha visible aria-hidden y fecha completa en .sr-only` `miniatura con alt vacío` · **Teclado:** —
- **QA:** `tools/qa/feed.mjs` `tools/qa/guias.mjs` `tests/site.test.mjs`

### AvisoEvento

Renglón del inicio «Próximo: Sáb 21 nov · título» (el día del evento, «Hoy · 18:57 · título») que lleva a Eventos, y el punto de «Eventos» en la barra de escritorio y en el menú ☰. Solo con un evento con fecha vigente. Mismo mecanismo que el control de Novedades: boot.js reserva el renglón antes del primer render (ev-hint) si la visita anterior dejó un evento vigente; si no coincide, se corrige con el inicio fuera de la vista. En el teléfono la foto cede sus 28 px y las posiciones fijas no cambian.

- **Tipo:** control · **desde** 2026-11-16 · DESIGN.md, «Eventos: destacado y lista por fecha; carta en parrilla» (2026-11-16).
- **style.css:** `.entry-ev` `.entry-ev-txt` `.ev-dot`
- **mobile.css:** `.ev-hint .entry-media` `.ev-hint.news-hint .entry-news`
- **index.html:** `[data-ev-cta]` `[data-ev-cta-text]` `[data-ev-dot]` `[data-ev-sr]`
- **feed.js:** exporta `initEventosAviso` `avisoLine` · internas `applyAviso` `settleHint` · ganchos `iti-ev-hasta`
- **assets/js/boot.js:** ganchos `iti-ev-hasta` `ev-hint`
- **Tokens:** `turquesa-texto` `primario` `alto-sm` `radio-sm` `t-subtitulo` `anillo-foco` `space-2` `space-3`
- **Estado hover:** `.entry-ev:hover .entry-ev-txt`
- **Estado foco:** `.entry-ev:focus-visible`
- **Estado oculto:** `.ev-hint .entry-ev`, `.ev-dot[hidden]`, HTML `[data-ev-cta][hidden]` — Sin evento con fecha no existe: ni el renglón ni el punto.
- **ARIA:** Link (https://www.w3.org/WAI/ARIA/apg/patterns/link/) · `href=#cartelera` `el punto es aria-hidden: «, próximo: Sáb 21 nov · título» va en .sr-only` · **Teclado:** Enlace: Enter.
- **QA:** `tools/qa/feed.mjs` `tools/qa/iphone.mjs` `tools/qa/guias.mjs` `tests/site.test.mjs`

### GaleriaCarta

Galería de la carta de Café y té (2026-11-17, decisión de Aldo: fotos arriba para abrir el antojo y la lista abajo para leer y comparar precios, como las apps de comida). Solo existe con fotos de producto: desde GALERIA_MIN (5) productos con foto y hasta GALERIA_MAX (12), en el orden de la carta o en el de «galeria» de menu.json; con menos no se pinta nada (ni hueco ni encabezado). La pinta scripts/build-carta.mjs entre la cabecera y la barra de categorías (sin JavaScript, una fila que se desliza con imán y el nombre bajo cada pieza) y cafe.js le pone el motor del Carrusel3D (variante galería): piezas cuadradas del ancho de las portadas del Catálogo, radio 12, solo la central con sombra-portada; bajo ella, nombre (Headline) y precio («$NN MXN», data-fuente=carta; sin precio, nada) en tinta, con el alto reservado. Tocar una vecina la trae al centro; tocar la central lleva a la fila de su producto (título del grupo bajo la barra si cabe; si no, la fila), deja el foco en su nombre y, con movimiento, la fila se realza un momento (menta en dur-lenta). Con galería, la foto de la cabecera no se pinta.

- **Tipo:** bloque · variante de Carrusel3D · **desde** 2026-11-17 · DESIGN.md, «Galería de la carta» (2026-11-17).
- **style.css:** `.c3d--galeria` `.ct-gal` `.ct-gal-pieza` `.ct-gal-foto` `.ct-gal-pie` `.ct-gal-nom` `.ct-gal-precio` `.ct-gal-txt` `.ct-prod.is-realce`
- **cafe.js:** exporta `galeriaItems` `filaId` `GALERIA_MIN` `GALERIA_MAX` `menuProblems` · ganchos `await import('./carousel3d.js')` `focusSel: '.ct-gal-pieza'` `fila.classList.add('is-realce')`
- **scripts/build-carta.mjs:** exporta `cartaHtml` `withCarta` `problemasDisco` `srcsetDisco` · ganchos `aria-roledescription="carrusel" aria-label="Fotos de la carta"` `data-ct-gal-live`
- **Tokens:** `sombra-portada` `sombra-flotante` `radio-sm` `radio-portada` `fondo-3` `menta` `tinta` `tinta-2` `t-titular` `t-subtitulo` `anillo-foco` `dur-rapida` `dur-lenta` `curva-salida` `curva-entrada-salida` `space-2` `space-4` `space-5` `space-6` `space-12`
- **Estado foco:** `.ct-gal-pieza:focus-visible`, `.ct-nom:focus-visible` — Una parada de tabulador: la pieza central; al abrirla, el foco pasa al nombre del producto en su fila.
- **Estado actual:** `.ct-gal-item.is-centro .ct-gal-foto` — La central: sombra-portada; la región viva anuncia el producto que llega por una flecha o el teclado.
- **Estado presionado:** `.ct-gal-item.is-centro .ct-gal-pieza:active .ct-gal-foto` — La sombra baja a sombra-flotante (y la escala 0.97 de [data-inclina] con movimiento).
- **Estado deshabilitado:** `.c3d-flecha:disabled`
- **Estado vacio:** cafe.js `return lista.length >= GALERIA_MIN ? lista : [];` — Con menos de 5 fotos no existe: ni hueco ni encabezado; la cabecera vuelve a llevar su foto.
- **Estado error:** cafe.js `img.addEventListener('error', quitar, { once: true })` — Una foto que falla se quita y queda el icono de su categoría en el mismo recuadro.
- **Estado movimiento_reducido:** `.motion .ct-prod.is-realce::before`, cafe.js `if (!suave) return;` — Sin movimiento: el carrusel plano (motor), el salto a la fila inmediato y sin realce.
- **Estado tactil ((hover: none) and (pointer: coarse)):** `.c3d-flecha` — Con toque no hay flechas: deslizar o tocar la vecina.
- **ARIA:** Carousel (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) · `role=region` `aria-roledescription=carrusel` `aria-label=Fotos de la carta` `aria-live=polite (región viva)` `href=#producto-<id> (cada pieza)` `aria-hidden en el pie común (lo dice el enlace de la pieza)` · **Teclado:** El del Carrusel3D: una parada (la central), ← → Inicio Fin; Enter lleva a la fila del producto.
- **QA:** `tools/qa/feed.mjs` `tools/qa/carrusel.mjs` `tools/qa/guias.mjs` `tests/site.test.mjs`

### BarraCategorias

Barra de categorías de la carta (Café y té; recomposición del 2026-11-17, sustituye a las píldoras de 48 apiladas en las columnas 1–3 con la activa en el verde de la primaria): una fila de enlaces de sección encima de la carta, uno por categoría de assets/data/menu.json, con el nombre corto si lo trae (campo chip: «Sin café») y entonces el nombre completo como aria-label («Bebidas sin café»). Pintada en index.html con la carta (scripts/build-carta.mjs). Se ven como texto (Subheadline 600 en tinta-2) con objetivo de 44 (8 de relleno a cada lado y 8 entre vecinos; la barra los descuenta para que la tinta del primero caiga en el margen, el mismo eje que el titular y el primer producto). El actual: subrayado de 2 px y tinta, con aria-current (dos canales; sin el verde intenso, que queda para «Cómo llegar»). Fija bajo la cabecera mientras se recorre la carta (sticky, fondo opaco de la banda y un filete: no es vidrio); si los enlaces no caben en un renglón (texto ampliado, Zoom de pantalla) pasan a un segundo renglón —nunca se desliza en horizontal— y la barra deja de ser fija (data-envuelta, que mide cafe.js). Scroll-spy con IntersectionObserver sobre una línea bajo la barra y otro sobre la ventana que recalcula cuando la carta entra a la vista. Tocar un enlace lleva a su grupo (suave solo con movimiento), cuyo título queda 24 px bajo la barra y recibe el foco. Sin JavaScript son anclas normales.

- **Tipo:** control · **desde** 2026-11-16 · DESIGN.md, «Café: una cuadrícula» (2026-11-17), que sustituye a la barra de chips de «Eventos: destacado y lista por fecha; carta en parrilla» (2026-11-16).
- **style.css:** `.ct-nav` `.ct-tab` `.ct` `.ct-grupo` `.ct-grupo-tit`
- **index.html:** `[data-cafe]` `[data-ct-nav]` `.ct-nav` `.ct-tab`
- **cafe.js:** exporta `initCafe` `currentGroup` `groupId` · ganchos `tab.setAttribute('aria-current', 'true')` `new IntersectionObserver(` `behavior: isMotion() ? 'smooth' : 'auto'` `nav.toggleAttribute('data-envuelta', envuelta)`
- **scripts/build-carta.mjs:** exporta `cartaHtml` `withCarta` · ganchos `aria-label="${esc(c.nombre)}"`
- **Tokens:** `tinta` `tinta-2` `fondo` `fondo-2` `fondo-3-presionado` `linea` `alto-sm` `radio-sm` `radio-portada` `t-boton-chico` `anillo-foco` `space-1` `space-2` `space-3` `space-4` `space-6`
- **Estado hover:** `.ct-tab:hover` — Con puntero fino, la tinta (el subrayado es solo del actual).
- **Estado foco:** `.ct-tab:focus-visible`, `.ct-grupo-tit:focus-visible` — El anillo del sitio; al llegar por su enlace, el foco pasa al título del grupo.
- **Estado presionado:** `.ct-tab:active` — Tono fondo-3-presionado (familia de los controles sin relleno), también con movimiento reducido y con la pausa.
- **Estado actual:** `.ct-tab[aria-current="true"]`, cafe.js `tab.setAttribute('aria-current', 'true')` — El grupo a la vista: subrayado y tinta además de aria-current (dos canales).
- **Estado movimiento_reducido:** cafe.js `behavior: isMotion() ? 'smooth' : 'auto'` — Sin movimiento el salto al grupo es inmediato.
- **ocupado: no aplica.** La carta llega pintada en index.html: no hay esqueleto (2026-11-17).
- **ARIA:** Navigation (enlaces dentro de la página) (https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/) · `nav con aria-label «Categorías de la carta»` `aria-current=true en el enlace del grupo a la vista` `href=#carta-<id>` `aria-label con el nombre completo cuando el enlace lleva el corto (contiene el visible: WCAG 2.5.3)` · **Teclado:** Tab recorre los enlaces en el orden visual; Enter lleva al grupo y deja el foco en su título.
- **QA:** `tools/qa/feed.mjs` `tools/qa/guias.mjs` `tools/qa/iphone.mjs` `tools/qa/inp.mjs` `tools/qa/controles.mjs` `tests/site.test.mjs`

### FilaProducto

Producto de la carta como fila, al modo de las apps de comida (Uber Eats, DiDi Food; 2026-11-17). Pintada en index.html desde assets/data/menu.json (scripts/build-carta.mjs, npm run carta; carta:check y npm test fallan si no coinciden): llega en el primer render, sin esqueleto, también sin JavaScript. Una columna en el teléfono y dos desde 761 (canal 32; en escritorio a todo el ancho del contenedor de Café, 1120), en el orden del marcado (izquierda a derecha, renglón por renglón), entre líneas finas de 1 px (linea) y con 12 de aire arriba y abajo, sin caja. El nombre en Headline (h4), el precio a 4 px (Subheadline en tinta, de peso normal desde el 2026-11-19 —un solo renglón fuerte por fila, el nombre—; antes 600 —antes turquesa-texto, el mismo valor que primario: competía con la acción principal—, «$NN MXN», con la unidad si la trae, data-fuente="carta"; con precio null no se imprime nada, ni «$0» ni «por confirmar») y luego la descripción (Subheadline en tinta-2, sin cortar con «…»). Sin foto (.ct-prod--solo, todas hoy) el texto ocupa la fila entera. Con foto: cuadrada a la derecha, 96 en el teléfono y 120 desde 761, con el icono de su categoría debajo; si la foto falla, cafe.js la quita y queda el icono. Entre categorías hay más aire que entre filas (32 / 48 frente a 24). No es un control.

- **Tipo:** bloque · **desde** 2026-11-17 · DESIGN.md, «Café: una cuadrícula» (2026-11-17), sobre «Carta al modo de las apps de comida» (2026-11-17).
- **style.css:** `.ct-lista` `.ct-rejilla` `.ct-prod` `.ct-foto` `.ct-ic` `.ct-txt` `.ct-nom` `.ct-desc` `.ct-precio` `.ct-prod--solo` `.ct-grupo-nota` `.ct-cierre` `.cafe-foto`
- **index.html:** `[data-ct-lista]` `.ct-rejilla` `.ct-prod` `.ct-precio` `.ct-cierre` `.cafe-foto`
- **cafe.js:** exporta `validMenu` `menuProblems` `validFoto` `precioCarta` `MENU_URL` · ganchos `img.addEventListener('error', quitar, { once: true })`
- **scripts/build-carta.mjs:** exporta `cartaHtml` `withCarta` · internas `productHtml` `groupHtml` · ganchos `<p class="ct-precio" data-fuente="carta">`
- **assets/data/menu.json:** datos
- **Tokens:** `fondo` `linea` `fondo-3` `tinta` `tinta-2` `radio-sm` `radio-portada` `icono-producto` `t-titulo-3` `t-titular` `t-subtitulo` `t-cuerpo` `space-1` `space-2` `space-3` `space-4` `space-6` `space-8` `space-12` `space-24` `canal-rejilla`
- **Estado vacio:** `.ct-cierre[hidden]` — Sin carta válida, build-carta no pinta nada entre las marcas: quedan la foto y el cierre.
- **Estado error:** cafe.js `img.addEventListener('error', quitar, { once: true })` — Si la foto de un producto falla, queda el icono de su categoría.
- **hover: no aplica.** No es un control: no abre nada.
- **foco: no aplica.** No es un control.
- **presionado: no aplica.** No es un control.
- **ocupado: no aplica.** Llega pintada en index.html: sin esqueleto.
- **ARIA:** List (grupos con su título) (https://www.w3.org/WAI/ARIA/apg/practices/structural-roles/) · `section con aria-labelledby (el título del grupo)` `ul / li` `h4 por producto` `alt en la foto del producto; el icono es aria-hidden` · **Teclado:** —
- **QA:** `tools/qa/feed.mjs` `tools/qa/guias.mjs` `tools/qa/iphone.mjs` `tools/qa/responsive.mjs` `tests/site.test.mjs`

### TarjetaLibro

Un solo botón con la portada 2:3 (real o tipográfica), el título (Subheadline semibold, dos renglones) y «autor · $250 MXN» (Footnote, el precio de la hoja no se parte). «Guardar» flota sobre la portada. En escritorio se inclina al cursor con brillo de lámina.

- **Tipo:** control · **desde** 2026-11-13 · DESIGN.md, «Catálogo y Novedades» (Tarjeta de la rejilla) y «Brillo de lámina» (2026-11-14).
- **Variantes:** `.cover--img` portada-real (Imagen sin alt (el nombre va en el botón).); `.cover--blank` portada-tipografica (Sin imagen o si falla: campo de color con título y autor.)
- **style.css:** `.card` `.cover` `.cover--img` `.cover--blank` `.card-item` `.card-t` `.card-au` `.card-m` `.card-pr` `.cover-title` `.cover-author`
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

Hoja única del libro (diálogo de 680 en escritorio; sube desde abajo en el teléfono): portada, título, autor, ficha técnica, sinopsis, «Tu mensaje por WhatsApp», relacionados y, fijas al pie, «Consultar disponibilidad» (primaria a todo el ancho, al WhatsApp de la librería con título, autor e ISBN ya escritos; 2026-11-19, antes «Preguntar por WhatsApp» con la nota «Antes de venir, te confirmamos si lo tenemos.», que se retiró), Guardar, Compartir y «Cómo llegar» (secundaria). Ningún texto dice «disponible» ni «en existencia»: estar en el catálogo no es tener ejemplar.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Hojas, FichaLibro).
- **style.css:** `.drawer` `.drawer::backdrop` `.drawer-body` `.drawer-close` `.drawer-head` `.drawer-facts` `.drawer-synopsis` `.drawer-foot` `.drawer-actions` `.rel`
- **mobile.css:** `.drawer`
- **index.html:** `#cat-drawer` `[data-d-close]` `[data-d-cta]` `[data-d-save]` `[data-d-share]` `[data-d-visit]` `[data-d-scroll]`
- **catalog.js:** exporta `shareBook` `bookShareData` `bookMessage` `bookWaUrl` `relatedBooks` · internas `openBook`
- **sheets.js:** exporta `openDialog` `closeDialog`
- **Tokens:** `vidrio-hoja` `filtro-vidrio-hoja` `luz-vidrio` `sombra-hoja` `sombra-portada` `velo` `radio-lg` `tinta` `tinta-2` `linea` `alto-lg` `t-titulo-2` `t-cuerpo` `t-subtitulo` `t-nota-pie` `dur-base` `dur-rapida` `curva-salida` `curva-resorte` `curva-entrada-salida` `curva-aceleracion`
- **Estado foco:** `.btn:focus-visible`, `.btn--vidrio:focus-visible`
- **Estado presionado:** `.rel:active .cover`
- **Estado hover:** `.rel:hover span`
- **Estado abriendo:** `.is-filling > *` — El contenido espera un fotograma (openDialog con defer).
- **Estado movimiento_reducido:** `.motion .drawer.is-closing`, `.rel:active .cover`
- **ARIA:** Dialog (Modal) (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) · `aria-labelledby=d-title` · **Teclado:** <dialog> con showModal: Tab atrapado, Escape y «atrás» cierran; el foco vuelve a quien la abrió.
- **QA:** `tools/qa/ficha.mjs` `tools/qa/axe.mjs` `tools/qa/inp.mjs` `tools/qa/contrast.mjs`

### MiLista

«Mi lista para la visita»: libros guardados en localStorage, sin cuenta. Hoja con la lista, «Quitar» por renglón y, fijas al pie, «Cómo llegar» y «Enviar mi lista por WhatsApp». Conteo en la barra inferior, la cabecera y el menú. En escritorio (diálogo de 520) su margen interior es de 32 (2026-11-15: redefine --margen; el de la página crece con la ventana).

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Hojas) y AGENTS.md (saved.js).
- **style.css:** `.mylist` `.mylist::backdrop` `.ml-head` `.ml-body` `.ml-items` `.ml-item` `.ml-remove` `.ml-empty` `.ml-error` `.ml-actions` `.count-badge`
- **mobile.css:** `.mylist`
- **index.html:** `#mylist` `[data-ml-close]` `[data-ml-items]` `[data-ml-empty]` `[data-ml-error]` `[data-ml-retry]` `[data-ml-status]` `[data-ml-wa]` `[data-saved-dot]`
- **saved.js:** exporta `initSaved` `listMessage` `listWaUrl` `clearSaved` `savedIds` `MAX_SAVED`
- **Tokens:** `vidrio-hoja` `filtro-vidrio-hoja` `luz-vidrio` `sombra-hoja` `velo` `radio-lg` `fondo-3` `tinta` `tinta-2` `linea` `primario` `en-primario` `alto-md` `alto-lg` `anillo-foco` `t-titulo-2` `t-titular` `t-subtitulo` `t-nota-pie` `curva-aceleracion`
- **Estado foco:** `.ml-remove:focus-visible`
- **Estado vacio:** `.ml-empty`, HTML `[data-ml-empty]`
- **Estado error:** `.ml-error`, HTML `[data-ml-error]`, HTML `[data-ml-retry]`
- **Estado movimiento_reducido:** `.motion .mylist.is-closing`
- **hover: no aplica.** Las filas no son enlaces; «Quitar» y las acciones del pie llevan el estado de su botón.
- **ARIA:** Dialog (Modal) (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) · `aria-labelledby=mylist-title` `role=status (data-ml-status)` · **Teclado:** Igual que la ficha; «Quitar «…» de mi lista» con su título en el nombre.
- **QA:** `tools/qa/saved.mjs` `tools/qa/axe.mjs` `tools/qa/inp.mjs` `tools/qa/guias.mjs`

### AsaHoja

Deslizar para cerrar las hojas inferiores del teléfono (ficha, Mi lista y Explorar; 2026-11-18, Apple, Sheets): la píldora de 36 × 5 a 8 px del borde (en Explorar, a 4 bajo el área segura) dentro de una franja táctil de 64 × 24. El gesto empieza en el asa, en la cabecera de la hoja (Mi lista, la barra de Explorar) o, con el contenido arriba, en sus primeros 72 px; un enlace o un botón no lo empiezan. Con movimiento la hoja sigue al dedo; al soltar pasados 120 px o a más de 0.7 px/ms sale por closeDialog desde donde quedó y, si no, vuelve a su sitio en dur-rapida. Con «reducir movimiento» o la pausa no sigue al dedo, pero el gesto cierra igual. Para el lector de pantalla es decorativa: el × y Escape siguen cerrando.

- **Tipo:** bloque · **desde** 2026-11-18 · DESIGN.md, «Plan premium (2026-11-18)»: deslizar para cerrar en las tres hojas inferiores.
- **mobile.css:** `.sheet-grab` `.sheet-grab::before` `.explorer:modal .sheet-grab` `.ml-head`
- **style.css:** `.sheet-grab`
- **index.html:** `[data-sheet-grab]`
- **sheets.js:** exporta `swipeToClose` `SWIPE_CLOSE`
- **Tokens:** `linea-fuerte` `radio-pildora` `space-2` `space-6` `dur-rapida` `curva-salida` `curva-aceleracion`
- **Estado presionado:** sheets.js `if (follow) dlg.style.translate = '0 ${dy}px';`
- **Estado movimiento_reducido:** sheets.js `follow = isMotion();`
- **hover: no aplica.** Solo existe en el teléfono (hoja inferior) y no es un control de puntero.
- **foco: no aplica.** No recibe el foco: es un atajo táctil; el × de la hoja y Escape cierran con teclado.
- **deshabilitado: no aplica.** Nunca se deshabilita.
- **ARIA:** Decorativo (aria-hidden) dentro de un diálogo modal con su botón de cerrar (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) · `aria-hidden=true` · **Teclado:** Sin teclado propio: Escape y el × cierran la hoja (WCAG 2.5.7: el arrastre tiene alternativa de un toque).
- **QA:** `tools/qa/hojas.mjs` `tools/qa/e2e.mjs`

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

«Explora el catálogo»: los 41 títulos en una página con búsqueda y filtros (Género, Editorial; casillas de 24 con palomita; un grupo se pliega desde 8 opciones). Hoja a pantalla completa en el teléfono; en línea desde 761, donde sin búsqueda ni filtros la rejilla se pliega a dos filas con «Ver los 41 títulos» / «Ver menos». Filtros activos como chips y «Limpiar todo». Sin resultados (2026-11-19, emptyPlan): solo con búsqueda, «No encontramos coincidencias para «…».» y «Preguntar por WhatsApp» (principal, menta) con lo buscado ya escrito; con filtros, «Ningún título cumple todos los filtros.», «Quitar filtros» (principal; conserva lo buscado y dice cuántos quedarían) y WhatsApp de contorno si hay texto. El mensaje va a 24 del filete del buscador; la búsqueda sola ya no se repite como chip (el campo trae su ×). Con el teclado del teléfono abierto (visualViewport), keepEmptyInView sube la hoja lo justo para que la primera salida quede sobre el teclado sin esconder el campo.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Rejilla en línea plegada» y AGENTS.md (catalog.js).
- **style.css:** `.explore-open` `.explorer` `.cat` `.cat-bar` `.cat-filters` `.cat-group` `.cat-opt` `.cat-more-facets` `.cat-status` `.cat-chips` `.cat-clear-all` `.cat-grid` `.cat-fold` `.cat-empty` `.cat-error` `.cat-empty-tit` `.cat-empty-txt` `.cat-empty-acc`
- **mobile.css:** `.explorer`
- **index.html:** `#catalogo` `#explorer` `[data-ex-open]` `[data-ex-close]` `[data-cat-form]` `[data-cat-filters]` `[data-cat-status]` `[data-cat-chips]` `[data-cat-grid]` `[data-cat-fold]` `[data-cat-empty]` `[data-cat-unfilter]` `[data-cat-empty-wa]` `[data-cat-empty-tit]` `[data-cat-empty-txt]`
- **catalog.js:** exporta `initCatalog` `filterBooks` `sortBooks` `facetCounts` `foldView` `facetView` `FOLD_ROWS` `FACET_FOLD_AT` `FACET_LIMIT` `PAGE_SIZE` `GENRE_ES` `genreLabel` `emptyPlan` `searchMessage` `searchWaUrl` · internas `renderFilters` `renderChips` `renderGrid` `applyFold` `staggerIn` `clearAll` `renderEmpty` `keepEmptyInView` · ganchos `data-clear` `cat-clear-all`
- **Tokens:** `alto-sm` `alto-md` `fondo-3` `fondo-2` `fondo` `tinta` `tinta-2` `linea` `linea-fuerte` `primario` `en-primario` `turquesa-texto` `foco` `anillo-foco` `radio-md` `radio-sm` `radio-portada` `radio-pildora` `t-campo` `t-subtitulo` `t-rotulo` `t-boton-chico` `t-titulo-3` `space-8` `dur-rapida` `dur-lenta` `escalon-linea` `curva-salida` `fondo-3-presionado` `curva-aceleracion` `t-cuerpo` `space-2` `space-3` `space-6` `space-12` `ls-titulo-3` `t-titular` `ls-titular`
- **Estado hover:** `.explore-open:hover`, `.cat-opt label:hover`
- **Estado foco:** `.cat-opt input:focus-visible + label`, `.cat-clear-all:focus-visible`, `:is(.chip, .cat-filters-btn, .cat-chip, .save, .explore-open, .rel, .card):focus-visible`
- **Estado presionado:** `.explore-open:active`, `.explore-open[data-opening]`
- **Estado seleccionado:** `.cat-opt input:checked + label::before`, `.cat-opt input:checked + label::after`
- **Estado expandido:** HTML `[data-cat-fold][aria-expanded="false"]`, catalog.js `foldBtn.setAttribute('aria-expanded', String(!v.folded))`
- **Estado ocupado:** `.cat-grid[aria-busy="true"]`, `.cat-grid[aria-busy="true"] .card--sk .cover`, HTML `[data-cat-grid][aria-busy="true"]`
- **Estado vacio:** `.cat-empty`, `.cat-empty-acc .btn[hidden]`, HTML `[data-cat-empty]`, HTML `[data-cat-unfilter]`, HTML `[data-cat-empty-wa]` — Dos casos (emptyPlan): sin coincidencias para lo buscado (WhatsApp principal) o filtros demasiado restrictivos («Quitar filtros» principal, WhatsApp de contorno).
- **Estado error:** `.cat-error`
- **Estado movimiento_reducido:** catalog.js `if (!isMotion() \|\| !items.length) return;`
- **ARIA:** Dialog (teléfono) + Checkbox + Disclosure (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) · `role=region` `role=search` `role=group` `role=status` `aria-busy` `aria-expanded` `aria-controls` · **Teclado:** Casillas nativas (Espacio); «Ver los 41 títulos» despliega en su sitio y el foco se queda en el botón; Escape cierra la hoja del teléfono.
- **QA:** `tools/qa/explorer.mjs` `tools/qa/skeleton.mjs` `tools/qa/axe.mjs` `tools/qa/inp.mjs` `tools/qa/guias.mjs`

### Aviso

Cápsula de vidrio (popover manual, por encima de las hojas) con el mensaje («Guardado en Mi lista.»; también «Ese libro ya no está en el catálogo.», sin acción, al llegar por un enlace compartido a un libro que ya no está) y, si hace falta, una acción menta; en la ficha flota justo encima de las acciones del pie.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Hojas: aviso).
- **style.css:** `.toast` `.toast:popover-open` `.toast-action`
- **saved.js:** exporta `notify` · internas `toast` `hideToast` · ganchos `toastEl.setAttribute('role', 'status')` `toastEl.popover = 'manual'`
- **Tokens:** `vidrio-hoja` `filtro-vidrio-hoja` `luz-vidrio` `sombra-flotante` `radio-md` `radio-pildora` `tinta` `menta` `en-menta` `alto-md` `t-subtitulo` `t-boton-chico` `anillo-foco` `menta-presionado`
- **Estado foco:** `.toast-action:focus-visible`
- **Estado presionado:** `.toast-action:active`
- **Estado abierto:** `.toast:popover-open`
- **hover: no aplica.** La acción es menta fija; el aviso dura poco y no invita a explorar con el cursor.
- **ARIA:** Status message (WCAG 4.1.3) (https://www.w3.org/TR/WCAG22/#status-messages) · `role=status` `popover=manual` · **Teclado:** La acción es un botón (Enter/Espacio).
- **QA:** `tools/qa/saved.mjs` `tools/qa/ficha.mjs`

### EncabezadoSeccion

Titular .h2 (Title 1, crece hasta 40 desde 761) con el patrón «Nombre *frase*» (el em en tinta-2, en su renglón) y la entradilla; sin antetítulo. Entra por líneas con su máscara una sola vez. Una forma por nivel (Sistema de guías, 2026-11-15): «Contacto» (.ftr-title, .ftr-lede) comparte la regla; titular → entradilla 12, cabecera → contenido 24; desde 1024 px, en las columnas 1–6 de la rejilla.

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Componentes» (Encabezado de sección).
- **style.css:** `.sec-head` `.h2` `.sec-texto` `.linea` `.linea-in`
- **index.html:** `.sec-head` `.sec-texto` `[data-revelar]`
- **app.js:** internas `splitHeading` `prepareReveals` `revealAll`
- **Tokens:** `t-titulo-1` `ls-titulo-1` `t-cuerpo` `tinta` `tinta-2` `turquesa-texto` `dur-lenta` `dur-instantanea` `escalon-linea` `curva-salida`
- **Estado movimiento_reducido:** `.motion [data-revelar="listo"] .linea-in`, `.motion [data-revelar="listo"] .sec-texto`
- **hover: no aplica.** No es un control.
- **foco: no aplica.** No es un control (los enlaces de su entradilla llevan el foco global).
- **ARIA:** Encabezado de sección (h2 + aria-labelledby) (https://www.w3.org/WAI/ARIA/apg/practices/headings/) · `aria-labelledby (en la sección)` · **Teclado:** —
- **QA:** `tools/qa/piso.mjs` `tools/qa/motion.mjs` `tests/site.test.mjs` `tools/qa/guias.mjs`

### TiraCasa

La casa: seis fotos reales en una tira que se pasa con el dedo; la que se ve entera queda plena y la que asoma se atenúa hasta 0.6 (CSS con animation-timeline: view()). Desde el 2026-11-19 (iteración de lectura): filas compartidas con subgrid (la foto y el pie de todas las tarjetas en las mismas dos filas; el pie más alto da la altura, sin alturas fijas) y, bajo la tira, «Foto anterior» y «Foto siguiente» (contorno, 44, icono) en el margen izquierdo, aria-disabled en los extremos, sin avance automático (APG, carrusel). Ajusta: el pie a su texto. Estira: la fila del pie al pie más alto. Límites: tarjeta 78vw en el teléfono, 300–560 desde 761.

- **Tipo:** bloque · **desde** 2026-11-14 · DESIGN.md, «Enfoque en La casa» (2026-11-14).
- **style.css:** `.house` `.house-track` `.still` `.still-img` `.house-nav` `.still figure`
- **mobile.css:** `.still`
- **index.html:** `#casa` `.still-img` `[data-house-nav]` `[data-house-prev]` `[data-house-next]` `#casa-fotos`
- **app.js:** ganchos `data-house-prev` `data-house-next` `data-house-nav`
- **Tokens:** `fondo-2` `fondo-3` `radio-lg` `t-titular` `space-3` `space-4` `space-2` `alto-sm` `linea-fuerte` `fondo-3-presionado`
- **Estado foco:** `.house-track:focus-visible`, `.btn:focus-visible`, `.btn[aria-disabled="true"]:focus-visible` — Un control en aria-disabled conserva el foco y su anillo (2026-11-19).
- **Estado movimiento_reducido:** `.motion .still-img`
- **Estado deshabilitado:** `.btn[aria-disabled="true"]`, app.js `prev.setAttribute('aria-disabled', String(track.scrollLeft <= 1));` — En los extremos de la tira: aria-disabled (no disabled), así el foco se queda en el botón.
- **ARIA:** Carrusel (APG): lista desplazable con controles anterior/siguiente con nombre (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) · `aria-label (tira)` `aria-controls=casa-fotos` `aria-label=Foto anterior / Foto siguiente` `aria-disabled` · **Teclado:** La tira recibe foco y se desplaza con las flechas (nativo); los dos botones con Tab, Enter o Espacio. Sin avance automático.
- **QA:** `tools/qa/responsive.mjs` `tools/qa/motion.mjs`

### MapaLlegada

El mapa de Visita, con dos estados y un solo mapa visible en cualquiera. (1) SVG propio en línea con las calles reales de OpenStreetMap (ODbL), la cuadra de Matamoros, el pin aproximado y la ruta en primario, que se dibuja una vez al verse el 60 % del mapa; todo el mapa enlaza a «Cómo llegar». Es la verdad sin JavaScript y el mapa mientras assets/data/sitio.json → mapa.clave esté vacía (hoy). (2) Con una clave de la Maps Embed API de Google (la crea Aldo; docs/MAPA-GOOGLE.md), app.js monta al acercarse (IntersectionObserver a 700 px + whenIdle) un iframe en modo place (.visit-map-embed, título «Mapa de Google: …», loading lazy, referrerpolicy strict-origin-when-cross-origin) con la misma caja que el SVG (240 / 260 / 2:1); mientras carga el SVG sigue siendo el mapa, al cargar el SVG se oculta y el pie dice «Mapa de Google Maps» (sin salto: CLS 0). CSP: solo se añade frame-src https://www.google.com. Límite conocido: si Google está bloqueado el navegador también dispara load para su página de error y no se puede distinguir; queda «Cómo llegar».

- **Tipo:** bloque · **desde** 2026-11-14 · DESIGN.md, «Mapa de llegada en Visita» (2026-11-14) y «Vuelta a la cápsula, Catálogo único y mapa de Google» (2026-11-19).
- **style.css:** `.visit-map` `.visit-map-link` `.mapa` `.mapa-tierra` `.mapa-via` `.mapa-ruta` `.mapa-nombre` `.mapa-pin path` `.visit-map-embed` `.visit-map.has-google`
- **index.html:** `.visit-map` `.visit-map-link` `.mapa` `.mapa-ruta`
- **app.js:** exporta `mapaUrl` `MAPA_CLAVE` · ganchos `mapIo` `visit-map-embed`
- **Tokens:** `mapa-tierra` `mapa-calle` `linea` `primario` `en-primario` `tinta` `tinta-2` `radio-lg` `anillo-foco` `t-subtitulo` `t-nota-pie` `dur-lenta` `dur-rapida` `curva-salida`
- **Estado foco:** `.visit-map-link:focus-visible`
- **Estado movimiento_reducido:** `.motion .visit-map[data-revelar="listo"] .mapa-ruta`, `.motion .visit-map[data-revelar="listo"].is-visible .mapa-ruta`
- **Estado colores_forzados ((forced-colors: active)):** `.mapa-ruta`
- **hover: no aplica.** Es un enlace grande; el cursor cambia (enlace nativo).
- **ARIA:** Imagen con nombre dentro de un enlace (https://www.w3.org/WAI/tutorials/images/functional/) · `role=img` `aria-labelledby=mapa-t` · **Teclado:** Enter sigue el enlace.
- **QA:** `tools/qa/responsive.mjs` `tools/qa/motion.mjs` `tools/qa/axe.mjs` `tools/qa/guias.mjs` `tools/qa/mapa.mjs`

### InterruptorMovimiento

«Pausar el movimiento» en dos sitios con la misma lógica (2026-11-16): al pie de la página y al pie del menú ☰ (una fila con filete, rótulo a la izquierda y la pista a la derecha). Uno controla al otro: los dos salen de un mismo estado (`app.js`, `syncToggle`) y de un mismo `localStorage`. <button role="switch" aria-checked> con su rótulo visible y la pista de 51 × 31 (geometría de iOS) en un objetivo de 44. Encendido = pausado (pista primario, pulgar a la derecha). Con «reducir movimiento» o ahorro de datos: encendido, aria-disabled y la nota dice por qué.

- **Tipo:** control · **desde** 2026-11-14 · DESIGN.md, «Interruptor «Pausar el movimiento»» (2026-11-14) y «Cambios de la auditoría de calidad» (2026-11-16: también en el menú ☰).
- **style.css:** `.interruptor` `.interruptor-pista` `.interruptor-pulgar` `.interruptor-nota` `.ftr-row` `.menu-movimiento`
- **index.html:** `[data-motion-toggle]` `[data-motion-nota]` `#motion-nota` `#menu-motion-nota` `.menu-movimiento` `.interruptor`
- **app.js:** internas `syncToggle` `applyMode` · ganchos `iti-b4-motion`
- **assets/js/boot.js:** ganchos `r.classList.add('motion')`
- **Tokens:** `interruptor-ancho` `interruptor-alto` `interruptor-pulgar` `alto-sm` `fondo-3` `linea-fuerte` `primario` `primario-presionado` `superficie` `sombra-pulgar` `tinta` `tinta-2` `anillo-foco` `radio-pildora` `t-subtitulo` `t-nota-pie` `dur-rapida` `curva-salida` `curva-resorte` `primario-pulsado` `fondo-3-presionado` `deshabilitado`
- **Estado hover:** `.interruptor:not([aria-disabled="true"]):hover .interruptor-pista`, `.interruptor[aria-checked="true"]:not([aria-disabled="true"]):hover .interruptor-pista`
- **Estado foco:** `.interruptor:focus-visible`
- **Estado presionado:** `.interruptor:not([aria-disabled="true"]):active .interruptor-pista`, `.interruptor[aria-checked="true"]:not([aria-disabled="true"]):active .interruptor-pista` — Apagado, fondo-3-presionado; encendido, primario-pulsado. Con «reducir movimiento» está deshabilitado y no responde, por diseño.
- **Estado seleccionado:** `.interruptor[aria-checked="true"] .interruptor-pista`, `.interruptor[aria-checked="true"] .interruptor-pulgar`
- **Estado deshabilitado:** `.interruptor[aria-disabled="true"]`, `.interruptor[aria-disabled="true"] .interruptor-pista`
- **Estado movimiento_reducido:** `.motion .interruptor-pulgar`
- **Estado colores_forzados ((forced-colors: active)):** `.interruptor-pista`, `.interruptor[aria-checked="true"] .interruptor-pista`
- **ARIA:** Switch (https://www.w3.org/WAI/ARIA/apg/patterns/switch/) · `role=switch` `aria-checked` `aria-disabled` `aria-describedby=motion-nota (el del menú: menu-motion-nota)` · **Teclado:** Espacio y Enter alternan; el foco se queda en el interruptor.
- **QA:** `tools/qa/motion.mjs` `tools/qa/controles.mjs` `tools/qa/axe.mjs` `tools/qa/inp.mjs`

### ContactoPie

El pie es el único lugar con el contacto: titular «Contacto» (titular de sección, Title 1, desde el 2026-11-15), para qué escribir (entradilla en Body) y WhatsApp · Instagram · Facebook · Correo en una lista agrupada de filas de 56 con su icono (desde 1024 px, texto en las columnas 1–6 y lista en 7–12, alineados arriba); debajo, «Pausar el movimiento».

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Contacto en un solo lugar» (2026-11-13) y «Sistema de guías» (2026-11-15: titular y entradilla de sección, 1–6 | 7–12).
- **style.css:** `.ftr` `.ftr-contacto` `.ftr-texto` `.ftr-title` `.ftr-lede` `.ftr-links` `.ftr-link` `.ftr-ne`
- **mobile.css:** `.ftr`
- **index.html:** `.ftr` `.ftr-links` `.ftr-link` `#ftr-title`
- **Tokens:** `fondo` `fondo-2` `tinta` `tinta-2` `turquesa-texto` `linea` `radio-md` `radio-sm` `alto-md` `t-titulo-1` `t-cuerpo` `anillo-foco` `canal-rejilla` `space-1` `space-2` `space-3` `space-4` `space-6` `space-8` `space-12` `fondo-3-presionado` `dur-rapida` `curva-salida`
- **Estado hover:** `.ftr-link:hover span`
- **Estado foco:** `.ftr-link:focus-visible`
- **Estado presionado:** `.ftr-link:active` — La fila se tiñe de fondo-3-presionado (2026-11-17, segunda auditoría de los 20 principios): también con movimiento reducido y con la pausa; sin escala.
- **ARIA:** Landmark contentinfo + lista de enlaces (https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/contentinfo.html) · `aria-labelledby=ftr-title` · **Teclado:** Tab entre enlaces.
- **QA:** `tests/site.test.mjs` `tools/qa/controles.mjs` `tools/qa/contrast.mjs` `tools/qa/guias.mjs`

### Insignia

Píldora de 24 en Caption 1: «Próximo» u «Hoy» en el destacado de Eventos (menta; el tipo y el ciclo son texto; el estado de una propuesta, «Propuesta · sin fecha», es una píldora de contorno sin relleno desde el 2026-11-19: .ev-rot > .ev-estado), «Nuevo»; disco de conteo de Mi lista (primario); punto de Abierto/Cerrado (cerrado es un aro hueco: forma además de color).

- **Tipo:** bloque · **desde** 2026-11-13 · DESIGN.md, «Tokens» (abierto, cerrado) y «Accesibilidad» (estados con forma además del color).
- **Variantes:** `.badge` relleno suave (Menta con en-menta («Próximo», «Hoy»).); `.count-badge` conteo (Disco primario; el número también en texto.); `.status-dot` estado (Abierto / Cerrado, siempre con la palabra.)
- **style.css:** `.badge` `.badge-new` `.count-badge` `.status-dot` `.news-dot`
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
- **Tokens:** `fondo` `fondo-2` `fondo-3` `primario` `en-primario` `tinta` `tinta-2` `radio-portada` `sombra-portada` `anillo-foco` `t-subtitulo` `t-nota-pie` `space-2` `space-3` `space-5` `dur-instantanea` `dur-base` `curva-resorte` `deshabilitado`
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

### IntroMarca

Entrada de marca al abrir el sitio (2026-11-18, encargo de Aldo: «movimiento de texto al iniciar, un resaltado y luego se despliega el contenido»). Un telón del color de la página (.intro-telon, aria-hidden, sin toques) tapa todo menos la barra; la marca de la barra (.hdr-brand, el elemento compartido) empieza en el centro óptico intro-escala veces más grande: el logo aparece, el nombre sube por su máscara y lo recorre un trazo de marcatextos (intro-resalte); desde intro-asentar (600 ms) vuelve en arco a su sitio en dur-base mientras el telón sube con la misma curva, la foto del inicio se abre (recorte del 6 % y 1.06 → 1) y el titular sube por líneas (app.js, introTitular). Telón fuera a los 1000 ms, todo quieto a los 1300. Solo con movimiento, sin #ancla, sin volver con «atrás» y solo en la primera visita (localStorage iti-intro; decisión de Aldo del 2026-11-19, antes una vez por sesión); se salta con cualquier toque, tecla, rueda o scroll.

- **Tipo:** bloque · **desde** 2026-11-18 · DESIGN.md, «Entrada de marca (IntroMarca)».
- **style.css:** `.intro-telon` `.hdr-brand` `.hdr-brand-nombre` `.entry-media` `.entry-poster`
- **index.html:** `[data-intro]` `.intro-telon` `.hdr-brand-nombre`
- **app.js:** internas `introTitular` `endIntro` `splitHeading` · ganchos `iti:intro-fin` `intro-marca`
- **assets/js/boot.js:** ganchos `r.classList.add('intro-marca')` `iti-intro` `INTRO_TOPE` `iti:intro-fin`
- **motion.js:** ganchos `'intro-asentar'`
- **Tokens:** `intro-asentar` `intro-escala-chica` `intro-escala` `intro-escala-tableta` `intro-escala-amplia` `intro-centro` `intro-resalte` `fondo` `tinta` `dur-instantanea` `dur-rapida` `dur-base` `dur-lenta` `escalon-linea` `curva-salida` `curva-entrada-salida` `radio-lg` `alto-sm` `space-3`
- **Estado movimiento_reducido:** assets/js/boot.js `if (off \|\| saveData \|\| matchMedia('(prefers-reduced-motion: reduce)').matches) return;` — Con «reducir movimiento», la pausa del pie o ahorro de datos boot.js no pone intro-marca: no hay telón y la página aparece como siempre. Las reglas viven además dentro de @media (prefers-reduced-motion: no-preference).
- **Estado actual:** assets/js/boot.js `localStorage.setItem('iti-intro', '1')` — Solo la primera visita: se anota solo cuando se muestra; si el almacenamiento lanza, no se muestra.
- **hover: no aplica.** No es un control.
- **foco: no aplica.** No recibe foco: el telón es aria-hidden y vacío; el primer Tab va a «Saltar al contenido» y termina la entrada.
- **ARIA:** Decoración (aria-hidden); la marca sigue siendo el enlace de la barra (https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) · `aria-hidden="true" (telón)` · **Teclado:** Cualquier tecla la termina; Tab sigue a lo de siempre.
- **QA:** `tools/qa/intro.mjs` `tests/site.test.mjs`

### PreguntasFrecuentes

Preguntas frecuentes de Visita (2026-11-19): una lista agrupada (fondo, radio-md) de details/summary nativos, sin JavaScript. Cada pregunta es un summary de 56 (en una fila de 64: 9 px entre vecinas) con su chevron; la respuesta (lectura 17/24 en tinta-2, con enlaces solo a anclas de la propia página) se abre debajo. Pintada en index.html desde assets/data/faq.json (scripts/build-faq.mjs, npm run faq; faq:check y npm test fallan si no coinciden): llega en el primer render. Solo respuestas confirmadas por Aldo; lo que falta está en docs/PENDIENTES-NEGOCIO.md. El chevron gira y la respuesta entra con un fundido corto solo con movimiento; cerrar es inmediato. Va tras el mapa y la foto: titular (Title 3) en 1–6 y preguntas en 7–12 desde 1024 px; en el teléfono, a 32 de la foto.

- **Tipo:** control · **desde** 2026-11-19 · DESIGN.md, «Preguntas frecuentes, Editoriales, Merch y marca para el dominio» (2026-11-19).
- **style.css:** `.faq` `.faq-tit` `.faq-lista` `.faq-item` `.faq-preg` `.faq-chev` `.faq-resp` `.visit-faq`
- **index.html:** `.faq` `.faq-item` `.faq-preg` `[data-faq]` `#faq-title` `#horario` `#contacto`
- **scripts/build-faq.mjs:** exporta `faqHtml` `withFaq` `faqProblems` `respuestaHtml`
- **assets/data/faq.json:** datos
- **Tokens:** `fondo` `linea` `tinta` `tinta-2` `turquesa-texto` `radio-md` `radio-sm` `alto-lg` `t-titular` `t-lectura` `anillo-foco` `fondo-3-presionado` `primario-presionado` `dur-rapida` `curva-salida` `space-2` `space-3` `space-4` `space-6` `canal-rejilla`
- **Estado hover:** `.faq-preg:hover > span`
- **Estado foco:** `.faq-preg:focus-visible`
- **Estado presionado:** `.faq-preg:active` — La fila se tiñe de fondo-3-presionado, también con movimiento reducido; sin escala.
- **Estado expandido:** `.faq-item[open] > .faq-preg .faq-chev` — details[open] es el estado: el navegador lo expone a los lectores de pantalla; el chevron gira 180°.
- **Estado movimiento_reducido:** `.motion .faq-item[open] > .faq-resp` — El fundido de la respuesta y el giro del chevron viven bajo .motion; sin movimiento, el cambio es inmediato.
- **ARIA:** Disclosure (details y summary nativos) (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) · `details/summary nativos (el navegador expone abierto y cerrado)` `role=group con aria-labelledby (el titular «Preguntas frecuentes»)` `el chevron es aria-hidden` · **Teclado:** Tab entre preguntas; Enter o Espacio abre y cierra.
- **QA:** `tests/contenido.test.mjs` `tools/qa/guias.mjs` `tools/qa/controles.mjs`

### Editoriales

Bloque «Editoriales» del Catálogo (2026-11-19), después de Explorar y antes del cierre; sin entrada propia en la barra, el menú ni la barra inferior. Pintado en index.html desde assets/data/catalog.json (scripts/build-editoriales.mjs, npm run editoriales; editoriales:check y npm test fallan si no coinciden): subtitular Title 3, nota con los hechos reales («4 editoriales · 40 de los 41 títulos») y una lista agrupada de filas (enlace de 56 en una fila de 64: 9 px entre vecinas; nombre, número de títulos, chevron), de más a menos títulos y luego alfabético. Cada fila abre Explorar con el filtro Editorial de esa editorial ya aplicado (teléfono: la hoja, y al cerrarla el foco vuelve a la fila; tableta y escritorio: baja a la rejilla en línea y el foco va al estado de resultados); sin JavaScript es un enlace a #catalogo. Con menos de 3 editoriales no se pinta nada; con más de 7, las primeras 7 y «Ver las N editoriales» (details nativo). Desde 1024 px, subtitular en 1–6 y lista en 7–12.

- **Tipo:** control · **desde** 2026-11-19 · DESIGN.md, «Preguntas frecuentes, Editoriales, Merch y marca para el dominio» (2026-11-19).
- **style.css:** `.edit` `.edit-head` `.edit-tit` `.edit-nota` `.edit-lista` `.edit-fila` `.edit-nom` `.edit-n` `.edit-ir` `.edit-resto` `.edit-resto-btn`
- **index.html:** `#editoriales` `[data-editoriales]` `.edit-fila` `[data-editorial]`
- **catalog.js:** exporta `editorialesDe` `editorialesPlan` `editorialesNota` `editorialKey` `titulosLabel` `EDITORIALES_MIN` · ganchos `iti:filtrar-editorial`
- **app.js:** ganchos `iti:filtrar-editorial` `editorialOrigin`
- **scripts/build-editoriales.mjs:** exporta `editorialesHtml` `withEditoriales`
- **Tokens:** `fondo-2` `linea` `tinta` `tinta-2` `turquesa-texto` `radio-md` `radio-sm` `alto-md` `alto-lg` `t-titulo-3` `ls-titulo-3` `t-titular` `t-subtitulo` `t-boton` `anillo-foco` `fondo-3-presionado` `space-1` `space-2` `space-3` `space-4` `space-6` `space-8` `space-12` `canal-rejilla`
- **Estado hover:** `.edit-fila:hover .edit-nom`
- **Estado foco:** `.edit-fila:focus-visible`, `.edit-resto-btn:focus-visible`
- **Estado presionado:** `.edit-fila:active`, `.edit-resto-btn:active` — La fila se tiñe de fondo-3-presionado, también con movimiento reducido; sin escala.
- **Estado vacio:** scripts/build-editoriales.mjs `if (!plan.mostrar)` — Con menos de 3 editoriales el generador no pinta nada: ni hueco ni encabezado (como Novedades sin llegadas).
- **Estado expandido:** `.edit-resto[open] .edit-resto-cerrar` — Solo con más de 7 editoriales: details[open] muestra el resto.
- **ARIA:** Lista de enlaces (https://www.w3.org/WAI/ARIA/apg/patterns/link/) · `ul con aria-labelledby (el subtitular)` `cada fila es un enlace a #catalogo; su nombre es «editorial, N títulos» (coma en sr-only)` `el chevron es aria-hidden` · **Teclado:** Tab entre filas; Enter abre Explorar con el filtro; al cerrar la hoja el foco vuelve a la fila.
- **QA:** `tests/contenido.test.mjs` `tools/qa/guias.mjs` `tools/qa/contenido.mjs`

### FranjaEditoriales

Franja de editoriales del Inicio (2026-11-19, encargo de Aldo; al modo de la franja de marcas de Vercel): una capa bajo la foto, dentro de #inicio, con las editoriales del catálogo (assets/data/catalog.json, menos las que assets/data/editoriales.json excluye; hoy «Libro Objeto») escritas con su nombre en tipografía, en tinta suave y sin cajas, que corren en bucle lento con los bordes desvanecidos. Pintada en index.html por scripts/build-editoriales.mjs (marcas franja:inicio y franja:fin; editoriales:check y npm test fallan si no coincide); con menos de 3 editoriales no se pinta nada. Rótulo «Editoriales en el catálogo» con el botón de pausa de 44, la franja (lista con rótulo; los elementos no son enlaces) y un enlace estático «Ver los libros por editorial» a #editoriales. El bucle es CSS (transform −50 % de dos grupos idénticos; franja-velocidad px/s; franja.js mide el grupo y fija la duración) y solo existe con movimiento activo; se detiene con el cursor, el foco dentro, al presionar, fuera de la vista y con su botón (WCAG 2.2.2). Sin movimiento: quieta, centrada, cada nombre una vez, en renglones. Con logos autorizados (scripts/logo-editorial.py, docs/EDITORIALES-LOGOS.md) cada logo se pinta como silueta monocroma con mask-image. Capa → capa 80 (96 en escritorio).

- **Tipo:** bloque · **desde** 2026-11-19 · DESIGN.md, «Franja de editoriales» (2026-11-19).
- **style.css:** `.franja` `.franja-cab` `.franja-rotulo` `.franja-ctl` `.franja-escena` `.franja-ventana` `.franja-carril` `.franja-lista` `.franja-item` `.franja-nombre` `.franja-logo` `.franja-ver`
- **mobile.css:** `.franja`
- **index.html:** `[data-franja]` `[data-franja-ctl]` `[data-franja-escena]` `.franja-ver` `#franja-rotulo`
- **franja.js:** exporta `initFranja`
- **app.js:** ganchos `franja.js` `initFranja`
- **assets/js/boot.js:** ganchos `iti-franja` `franja-quieta`
- **motion.js:** exporta `num`
- **scripts/franja-datos.mjs:** exporta `franjaPlan` `franjaHtml` `withFranja` `leerConfig` `editorialesLogosProblems` `logosCss`
- **scripts/build-editoriales.mjs:** exporta `leerEditorialesJson` `problemasLogosDisco`
- **Tokens:** `franja-velocidad` `franja-desvanece` `franja-logo-alto` `tinta` `tinta-2` `turquesa-texto` `alto-sm` `alto-lg` `space-2` `space-3` `space-6` `space-8` `space-12` `space-16` `space-24` `t-titulo-3` `t-subtitulo` `dur-rapida` `curva-salida` `anillo-foco`
- **Estado hover:** `.franja-escena:hover .franja-item` — Con puntero que flota, el cursor sobre la franja la detiene y los nombres pasan de tinta-2 a tinta (las copias del bucle son inertes: la franja entera reacciona, no cada nombre).
- **Estado foco:** `.btn:focus-visible` — El foco vive en el botón de pausa y en el enlace estático (anillo-foco); con el foco dentro, la franja se detiene (.franja:focus-within) y los nombres pasan a tinta.
- **Estado presionado:** `html.motion:not(.franja-quieta) .franja-escena:active .franja-carril` — Al presionar la franja se detiene (con toque, mientras el dedo está encima).
- **Estado vacio:** scripts/franja-datos.mjs `if (!plan.mostrar)` — Con menos de 3 editoriales (o con editoriales.json vacío, ausente o torcido) no se pinta nada: ni hueco ni encabezado.
- **Estado movimiento_reducido:** franja.js `root.classList.contains('motion') && !root.classList.contains('franja-quieta')` — Sin html.motion (reducir movimiento, ahorro de datos, «Pausar el movimiento» del sitio) o con html.franja-quieta (la pausa de la propia franja, recordada en localStorage iti-franja y por boot.js desde el primer render) la franja es la base CSS: quieta, centrada, cada nombre una vez, sin copias ni bordes desvanecidos, y el botón de pausa no se muestra (si la pausa es la de la franja, queda para reanudar).
- **ARIA:** Lista con rótulo y control de pausa (WCAG 2.2.2) (https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) · `section con aria-labelledby (el rótulo)` `ul aria-labelledby con los elementos reales; el grupo duplicado y las copias de relleno, aria-hidden e inert` `los elementos no son enlaces ni se enfocan (un objetivo en movimiento es inaccesible)` `el botón de pausa cambia su nombre: «Pausar el movimiento de las editoriales» / «Reanudar …»` `el logo, cuando exista, es role=img con aria-label (el alt de editoriales.json)` · **Teclado:** Tab llega al botón de pausa (la franja se detiene con el foco dentro); Enter o Espacio pausan y reanudan; Tab sigue al enlace «Ver los libros por editorial».
- **QA:** `tests/franja.test.mjs` `tools/qa/franja.mjs` `tools/qa/guias.mjs`

### TarjetaMerch

Tarjeta de un artículo de Merch (2026-11-19), la TarjetaLibro adaptada: un enlace a WhatsApp, «Consultar disponibilidad», con el producto y su precio ya escritos (el sitio nunca afirma existencias; sin carrito ni pagos). Foto cuadrada (radio-portada; si no hay foto o falla, el icono de la tarjeta), tipo (con «Por encargo» solo si la librería lo dice), nombre (Subheadline 600, dos renglones), descripción (dos renglones), precio en su renglón (solo si lo hay) y la acción al pie, alineada entre las tarjetas de una fila. 2 columnas en el teléfono, 3 desde 761 y 4 desde 1024 (3 de las 12 columnas). La sección NO existe (ni en el DOM, ni en la barra, el ☰ o el destino actual) mientras assets/data/merch.json no tenga productos válidos: merch.js la monta entre Café y Visita con el primero y pone .has-merch, que invierte la banda de Visita y el pie como con Novedades. Datos: scripts/foto-merch.py y docs/MERCH.md.

- **Tipo:** control · **desde** 2026-11-19 · DESIGN.md, «Preguntas frecuentes, Editoriales, Merch y marca para el dominio» (2026-11-19).
- **style.css:** `.merch` `.merch-grid` `.merch-item` `.merch-card` `.merch-foto` `.merch-ic` `.merch-tipo` `.merch-nom` `.merch-desc` `.merch-precio` `.merch-accion`
- **merch.js:** exporta `validMerch` `merchProblems` `merchMessage` `merchWaUrl` `merchCard` `merchSection` `initMerch` `precioMerch` `validFotoMerch` · ganchos `iti:merch` `has-merch`
- **app.js:** ganchos `iti:merch` `import('./merch.js')`
- **scripts/check-merch.mjs:** exporta `problemasDisco`
- **assets/data/merch.json:** datos
- **Tokens:** `fondo` `fondo-2` `fondo-3` `linea` `tinta` `tinta-2` `turquesa-texto` `primario-presionado` `radio-portada` `icono-producto` `alto-sm` `t-subtitulo` `t-boton-chico` `anillo-foco` `dur-instantanea` `curva-salida` `space-2` `space-4` `space-6` `space-8` `canal-rejilla`
- **Estado hover:** `.merch-card:hover .merch-accion span`
- **Estado foco:** `.merch-card:focus-visible`
- **Estado presionado:** `.merch-card:active .merch-accion` — La acción toma primario-presionado, también con movimiento reducido; la foto se escala 0.98 solo con movimiento.
- **Estado vacio:** merch.js `if (!productos.length \|\| !visita) return false;` — Sin productos válidos (hoy) no se monta nada: ni sección, ni enlaces, ni clase.
- **Estado error:** merch.js `img.addEventListener('error', () => img.remove(), { once: true })` — Si la foto falla, se retira y queda el icono de la tarjeta.
- **Estado movimiento_reducido:** `.motion .merch-card:active .merch-foto`
- **ARIA:** Link (https://www.w3.org/WAI/ARIA/apg/patterns/link/) · `la tarjeta es un enlace (target=_blank con rel=noopener noreferrer); su nombre es el texto de la tarjeta` `ul con aria-label «Artículos de la librería»` `alt en la foto; el icono es aria-hidden` · **Teclado:** Tab entre tarjetas; Enter abre WhatsApp en otra pestaña.
- **QA:** `tests/contenido.test.mjs` `tools/qa/contenido.mjs` `tools/qa/guias.mjs`

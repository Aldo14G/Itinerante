---
name: "Itinerante B.4 · Función de la casa"
description: "La librería presentada como una función de cine: se entra a la casa con el propio scroll."
colors:
  night: "#100d0a"
  night-2: "#17120e"
  stone: "#241e18"
  bone: "#f1e8d8"
  bone-dim: "#b8aa95"
  tungsten: "#e3bd8a"
  tungsten-hi: "#f7cc86"
  turq: "#79b1a9"
  turq-ink: "#062824"
  turq-light: "#8fe0d5"
  terra: "#c45a3c"
  terra-deep: "#9e3f25"
  terra-ink: "#7a2c16"
  paper: "#efe6d5"
  paper-ink: "#1a1510"
  paper-dim: "#5e5245"
  tone-light-bg: "#fbf8f2"
  tone-light-ink: "#2a1d14"
  tone-light-accent: "#954b34"
  tone-light-turq: "#176b62"
  tone-sand-bg: "#efe3cc"
  tone-sand-ink: "#2a1d14"
  tone-sand-accent: "#9a3b24"
  tone-sand-turq: "#14625a"
  tone-brick-bg: "#693926"
  tone-brick-ink: "#f7f0e4"
typography:
  wordmark:
    fontFamily: "Archivo"
    fontWeight: 840
    fontStretch: "62%"
    textTransform: "uppercase"
    fontSize: "ajustado al ancho del contenedor (JS)"
    lineHeight: 0.8
  headline:
    fontFamily: "Archivo"
    fontWeight: 780
    fontStretch: "70%"
    textTransform: "uppercase"
    fontSize: "clamp(2.6rem, 6vw, 6rem)"
    lineHeight: 0.9
    letterSpacing: "-0.015em"
  voice:
    fontFamily: "Bodoni Moda"
    fontStyle: "italic"
    fontWeight: 500
    use: "solo dos lugares: la frase «sin prisa,» del manifiesto y el nombre del tema activo en Libros"
  body:
    fontFamily: "Archivo"
    fontWeight: 480
    fontStretch: "100%"
    fontSize: "1.0625rem"
    lineHeight: 1.5
  label:
    fontFamily: "Archivo"
    fontWeight: 700
    fontSize: "0.75rem"
    letterSpacing: "0.07em"
    textTransform: "uppercase"
rounded:
  still: "2px"
  tag: "4px"
  logo: "8px"
  pill: "999px"
spacing:
  gutter: "clamp(16px, 3.2vw, 48px)"
  section: "clamp(96px, 14vh, 190px)"
  header: "68px (60px en móvil)"
motion:
  ease-out: "cubic-bezier(0.16, 1, 0.3, 1)"
  ease-io: "cubic-bezier(0.65, 0, 0.35, 1)"
  scroll-damping: "exponencial, k 7–9"
---

# Itinerante B.4 · Función de la casa

> **Estado: sistema vigente del sitio publicado en la raíz** (`index.html`), promovido desde el prototipo B.4 el 2026-11-01. Este archivo y `design/tokens.json` son la fuente de verdad visual. Los valores salen de `design/tokens.json` → `tokens.css` (generado con `npm run tokens`). El canon anterior (Claude Design/Higgsfield) vive en `design-system/libreria-itinerante-y-mas/MASTER.md` solo como referencia histórica. El sitio todavía no está desplegado.

## Mundo

La casa a media tarde, con la luz de la calle en la pared. **El sitio es claro de punta a punta**, incluido el hero: la entrada se lee sobre cal clara (tono `light`: fondo `#fbf8f2`, texto café tabaco `#2a1d14`) y la foto del pasillo se funde hacia ese fondo con un velo en la base. Siguen la arena (tono `sand`, `#efe3cc`) en La casa, la cortinilla y Libros, de nuevo cal (`light`) en el manifiesto y el catálogo, y el ladrillo apagado (tono `brick`, `#693926`, texto `#f7f0e4`) en la cita y el pie. Los acentos sobre tonos claros son terracota (`#954b34` en `light`, `#8c4732` en `sand`) y el turquesa de los libreros oscurecido (`#176b62` y `#14625a`) para texto. Las secciones sin tono usan los colores base de `:root`: el turquesa apagado (`#79b1a9`) ocupa un capítulo entero (Cartelera) y el ocre (`#e3bd8a`) una banda (llamado final) y la Visita va en papel (`#efe6d5`). **Criterio de saturación (medido el 2026-11-01):** las paredes de las fotos del local tienen croma OKLCH de 0.02 a 0.085 (piedra gris cálida, yeso rosado, ladrillo ocre y madera). Los campos de color a ancho completo no pasan de 0.085 (crema 0.01, arena 0.03, turquesa 0.06, ocre 0.08, ladrillo 0.075); solo los acentos pequeños (botones, enlaces, barra de progreso) llegan a 0.105. Quien llega buscando la dirección encuentra un sitio luminoso y con contraste alto, no una cueva.

**La paleta nocturna** (`night #100d0a`, `bone #f1e8d8`, `stone`…) ya no pinta ninguna sección. Sigue definida en `:root` como base de los tokens que cada tono redefine (el nombre `night` significa «fondo»), y como historia de la dirección original B.4 («solo la entrada es de noche»). Queda un resto: `index.html` aún declara `theme-color #100d0a`, que no coincide con el hero claro.

**Tonos por sección.** `data-tone="light|sand|brick"` redefine los mismos tokens (`night`, `bone`, `line`, `tungsten`, `turq`…) dentro de la sección y pinta su fondo; ningún componente cambia. Se generan desde `design/tokens.json` (`themes.b4.tones`). Las portadas tipográficas y el crédito del hero usan tinta propia (`cover-ink`, chip con fondo) para no invertirse con el tono; las portadas claras (tonos 6 a 9) traen la suya (`cover-N-ink`, `cover-N-ink-dim`). La barra de desplazamiento de la página usa pista y pulgar de la paleta clara (`--paper`, `--paper-dim`), no la noche del hero: casi todo el recorrido es cal, arena y papel. En un tono claro, `night` significa «fondo» y `bone` «tinta»: los pares garantizan ≥ 4.5:1 y lo comprueba `tests/site.test.mjs`.

El único motivo gráfico es el piso ajedrezado de la sala. Aparece como cortinilla entre La casa y la Cartelera, y como cuadro separador en la marquesina.

## Tipografía

Archivo variable (eje de anchura 62–125) pone dos voces en una sola familia. Condensada en mayúsculas funciona como cartón de título. Al 100 % es texto de lectura. Bodoni Moda itálica es la voz literaria y se usa solo en dos lugares: «sin prisa,» en el manifiesto y el nombre del tema activo en Libros. La segunda línea de cada titular se resuelve en Archivo ancho y ligero (anchura 125 %, peso 380, tamaño 0.5em) en el color de acento de la sección: el contraste es de anchura, no de familia. No hay rótulos sobre los titulares; los únicos textos en mayúsculas pequeñas son metadatos (etiquetas, horario, estado).

La anchura es también movimiento: el tema activo de Libros pasa de 62 % a 80 % de anchura.

## Componentes

- **Botones:** cápsulas con barrido de relleno de abajo arriba (--dur-base, 400 ms) y flecha que avanza 2 px. Variantes: tungsteno (la única primaria: siempre «Cómo llegar», terracota `--terra-deep` con tinta clara sobre cualquier fondo, la misma clase en cabecera, hero, Cartelera, Libros, ficha, Mi lista, historias y Visita; en escritorio la de la cabecera se retira mientras otra está a la vista), fantasma y línea (secundarias: WhatsApp siempre va aquí y nunca más alto que la primaria). En dispositivos con puntero fino son magnéticos (±12 px).
- **Etiquetas de procedencia:** «Foto real» (turquesa claro) y «Recreación IA» (tungsteno), en todas las imágenes, sin excepción. Lo que viene de la muestra lleva «Datos de muestra · no es inventario»: línea fija bajo los chips del carrusel, sello terracota en la capa «Explora la muestra», sello en la cabecera de la hoja Explorar y rótulo de Recién llegados.
- **Fotogramas:** esquinas de 2 px y sin sombra. Las fotos entran con un revelado por máscara (clip-path de abajo arriba y escala 1.22 → 1).
- **Cartelera:** acordeón exclusivo con `<details name>` en escritorio (en móvil son publicaciones, ver abajo). Cada fila lleva un título (el tipo de actividad) y una línea; la procedencia «propuesta, sin fecha» la dice el encabezado una vez. Al detenerse 320 ms el detalle se abre solo; el título se desplaza 14 px. El escenario fijo cambia de imagen con una cortina vertical de 700 ms.
- **Nota del mensaje:** tira de papel ligeramente girada (−0.8°) que muestra el texto exacto que abrirá WhatsApp.
- **Estado:** punto verde con tres pulsos al cargar (abierto; `--dur-scene` por pulso, sin `calc` ni multiplicador, y se queda quieto: una animación infinita en reposo cuesta batería y no orienta más que tres) o terracota (cerrado). El texto se calcula con la hora de Monterrey.

## Coreografía

| Tramo | Mecánica | Fallback |
|---|---|---|
| Entrada (260vh con movimiento en escritorio; en móvil `mobile.css` le da altura automática) | Solo escritorio con movimiento: 145 fotogramas en canvas sincronizados al scroll (`scenes-desktop.js`), carga progresiva (claves cada 12 fotogramas; ventana de ±10 y como máximo 36 fotogramas intermedios en memoria). El nombre se abre desde el centro como una puerta. Un solo rótulo de escena | Póster fijo; texto y acciones visibles. En móvil siempre es póster: `assets/seq-m/` tiene 73 fotogramas verticales en disco, pero solo se pide `m001` (póster); `app.js` no carga `scenes-desktop.js` con ≤ 760 px |
| Intro | El escenario se abre de un recorte (inset) a pantalla completa. Las letras suben escalonadas cada 40 ms | Sin intro |
| Manifiesto | Palabra a palabra, de 17 % a 100 % de opacidad. Las fotos se desplazan en paralaje vertical (±60 px) | Texto completo |
| La casa | Tira horizontal fijada (vh + distancia / 1.6). Enfoque por distancia al centro: escala .91–1, velo de hasta 58 % y paralaje interno de ±6 % | Scroll lateral nativo con snap |
| Cortinilla (100svh) | Cuadrícula de 12×N (6×N en móvil). Cada cuadro crece con un retraso por fila, columna y paridad ajedrezada | Oculta |
| Libros | Al pasar el cursor y quedarse (250 ms) el tema se activa y se queda. Cortina lateral de 700 ms; el nombre rueda letra a letra (salida 260 ms, entrada 520 ms) y el CTA cambia su texto con un desplazamiento vertical | Cambio inmediato |
| Llamado | Una marquesina cuya velocidad se acelera con el scroll y cuyo sentido sigue su dirección, y el titular que da paso a la Visita. Sin acciones: las trae la Visita justo debajo. En móvil no hay marquesina (repetía la dirección y era decoración): queda la banda con el titular, y `app.js` no la anima | Estática |

## Accesibilidad y control

- `prefers-reduced-motion`, ahorro de datos y el botón «Pausar el movimiento» del pie (persistente) desactivan todas las escenas. La página pasa a un flujo estático completo.
- El `h1` es «Librería Itinerante y Más» en texto accesible; en escritorio el nombre gigante es decorativo (`aria-hidden`) y en móvil el propio `h1` es el nombre visible del perfil.
- El menú móvil vuelve inertes `main` y el pie, enfoca el primer enlace y se cierra con Escape devolviendo el foco.
- Cada cambio de tema en Libros se anuncia en una región `aria-live` aparte.

## Catálogo de muestra

**Carrusel de libros (capa 1 de Libros, `rail.js`):** lista horizontal con `scroll-snap-type: x mandatory`, sin autoplay; 2.3 tarjetas por vista en móvil (se asoma la siguiente) y 5 en escritorio; barra de progreso, flechas ≥ 44 px solo con puntero fino, teclado (Tab y flechas; al tabular, la tarjeta asomada que recibe el foco se alinea al inicio del carrusel, porque el navegador no desplaza lo que ya asoma en parte), `role="region"` + `aria-roledescription="carrusel"`, chips de colección como `radiogroup`. Tarjeta = solo la portada tipográfica, que ya lleva el título y el autor una única vez (son el nombre accesible del botón); abre la ficha del catálogo. Colecciones en `assets/data/collections.json`: hoy filtros sobre la muestra (rotulada); con el listado real, `ids` curados. Ninguna colección se llama «más leídos» (no hay datos). Debajo de los chips van dos líneas con dueño distinto: la nota de la colección (cambia con el chip y reserva su línea para que el carrusel no salte) y el rótulo fijo «Datos de muestra · no es inventario.», que vive en el marcado y nunca se reescribe al cambiar de colección. Una colección puede traer `tema` (narrativa, cronica…): al elegir ese tema en «Pregúntanos» el carrusel marca la primera colección que lo trae (evento `iti:topic`); sin colección equivalente no cambia nada.

**Guardar y «Mi lista para la visita» (`saved.js`):** marcador de 44 px en la esquina inferior derecha de cada portada (carrusel, rejilla y ficha), en el dispositivo y sin cuenta (tope de 30). Un aviso (`popover`, en la capa superior para verse sobre las hojas) ofrece «Ver mi lista». La hoja lista lo guardado con «Cómo llegar» (primaria) y «Enviar mi lista por WhatsApp» (informativa; hasta 12 títulos). Entradas: menú lateral, aviso y un chip en la cabecera (escritorio y móvil) que existe solo con libros guardados: marcador y número, 44 px, vidrio igual al del menú, nombre accesible con el conteo («Mi lista, 3 libros»); en móvil la marca pasa a «Librería Itinerante» mientras el chip está a la vista. La cabecera móvil se esconde al bajar y vuelve al subir, y con ella el chip.

**Explorar la muestra (móvil):** el catálogo deja de alargar el capítulo; en ≤ 760 px el capítulo muestra un campo de búsqueda y la búsqueda, filtros y rejilla abren en una hoja a pantalla completa (`<dialog>` modal, `#explorar` en la URL para que «atrás» la cierre). La hoja abre al toque con sus esqueletos y «Cargando la muestra…» (la rejilla nace con `aria-busy`) y el catálogo, módulo y datos, se pide después y la rellena: con 4G lenta la respuesta llega en ~100 ms en vez de esperar 1-3 s sin cambio visible (ley de Doherty). En escritorio el mismo diálogo queda abierto en línea, sin enfocar el campo ni pedir `catalog.json` al cargar (el catálogo y el foco llegan al acercarse a `#catalogo` o al pulsar un enlace a él). La ficha vive fuera de la hoja y se abre encima. La cabecera fija de la hoja lleva el sello «Datos de muestra · no es inventario» bajo el título, en una sola línea hasta 320 px.

Capa 3 del capítulo Libros (`#catalogo`, región con `<h3>` dentro de `#libros`, tono `light` sobre el `sand` del capítulo; desde 2026-11-01 Libros y Catálogo son un solo capítulo: temas y consulta → muestra completa). Datos: `assets/data/catalog.json` (500 registros de prueba, sin precios ni existencias; JSON estático, no consulta `/api/catalog`), rotulados con un sello terracota «Datos de muestra · no es inventario».

- **Búsqueda:** combobox ARIA con sugerencias por autor, título, ISBN y editorial, sin acentos ni mayúsculas. El resultado se filtra mientras se escribe.
- **Filtros:** categoría, género (10 + ver todos), formato y editorial; casillas con conteo por faceta calculado sin la propia dimensión. Chips activos con «Limpiar todo». En móvil se abren con el botón «Filtros», que no lleva número hasta que haya filtros puestos (entonces, cuántos; nunca el total de la muestra). Los géneros salen en español desde un diccionario de presentación por id de subgénero (`GENRE_ES` en `catalog.js`): el dato (`catalog.json`) sigue en inglés, un género sin traducción cae a su nombre original y los títulos y autores no se traducen.
- **Rejilla:** 24 por página y «Ver más»; al cargar más, el foco pasa a la primera ficha nueva. Las portadas son una sola familia: tarjetas tipográficas propias. El tono sale del título dentro de una familia de cinco por categoría (ficción cálida: terracota, ámbar, cacao (madera oscura de las paredes), crema y yeso rosado; no ficción fría: turquesa oscuro, piedra, azul, arena y turquesa apagado; mezcla de portadas oscuras y claras); en el carrusel, en Novedades, en la rejilla y en los relacionados (`coverTones`) se reparte por lista: ninguna vecina repite tono, tampoco la anterior a la anterior mientras haya otra opción, y ninguno pasa de 4 de 12. Cada libro recorre su familia con un salto propio, así el reparto no cae en un ciclo fijo. Las portadas son campos de color: croma ≤ 0.09 como las paredes. La ficha repite el tono de la tarjeta pulsada (`data-cover-tone`). La composición de la portada (título arriba, a la izquierda, abajo o al centro) varía por título (`coverLayout`, `data-cover-layout`) y no cambia color ni contraste; no hay imágenes de portada ni SVG de terceros.
- **Ficha:** `<dialog>` modal que entra desde la derecha (papel, ink): ficha técnica, mensaje exacto de WhatsApp con el título, y tres relacionados. Escape o clic fuera la cierra y el foco vuelve a la tarjeta. En móvil va en dos columnas (ver «Ficha en dos columnas»).
- **Estados:** carga, error, sin resultados (limpiar o preguntar por WhatsApp) y sin JavaScript (se oculta y queda el enlace a WhatsApp).

## Texto que responde

Todo texto que se puede señalar cambia de estado con el cursor y con el foco de teclado; en táctil el contenido ya está visible o se abre con un toque.

- **Navegación y pie:** el texto sube y deja ver una pista del destino (La casa «6 vistas», Cartelera «3 ideas», Libros «6 temas», Visita «Cómo llegar»; pie: «Novedades», «Síguenos», «81 8087 5940», «Escribir»). Etiqueta y pista ocupan la misma celda de una retícula de una celda (`grid-area: 1 / 1`): el enlace mide la más ancha de las dos y una pista larga («Cómo llegar», «81 8087 5940») nunca pisa al enlace vecino. Los enlaces de capítulo de la cabecera de escritorio miden ≥ 44 px también con puntero fino: el relleno vertical se calcula desde `--target-coarse` y `--fs-1` (el texto queda centrado) y 4 px por lado (`--space-1`) que un margen negativo devuelve, así el texto y la pista no se mueven y la separación entre cajas sigue en 32 px (entre Libros y Visita se ven 42 porque la caja de Libros mide lo de su pista «6 temas», 10 px más que la palabra). El filete se pinta bajo la palabra visible, etiqueta o pista, como fondo del propio texto (crece de izquierda a derecha, igual que en los botones de línea), así mide exactamente lo que mide la palabra y no la celda; con colores forzados es un subrayado real. La pista sale por `content: attr(data-hint) / ""`, así no entra en el nombre accesible. Subrayado animado también con foco.
- **La casa:** en la tira fijada, solo el cuarto central (`.is-center`) o el que está bajo el cursor muestra su frase; la etiqueta de procedencia siempre visible.
- **Cartelera:** pasar el cursor abre el detalle (al detenerse 320 ms) y cambia el escenario.
- **Libros:** pasar el cursor activa el tema (al detenerse 250 ms, solo ratón, sin anunciar en la región viva); clic, flechas y toque siguen igual. Las seis fotos se precargan al primer gesto sobre la lista.
- **Tarjetas del catálogo:** al señalar o enfocar, la portada sube 8 px; el título y el autor ya están dentro de ella (no hay renglones aparte).

## Esqueletos

Cada región asíncrona reserva su forma antes de que llegue el contenido: 24 tarjetas (la primera página, `PAGE_SIZE` de `catalog.js`) y dos grupos de filtros en el catálogo (se sustituyen al pintar o se vacían si hay error), y el color de fondo de cada foto diferida (La casa, Cartelera, Libros, manifiesto, Visita), que la foto cubre al llegar. Al abrir el catálogo la altura de la página cambia 58 px (antes 1 903 px).

**Esqueletos quietos, una sola regla.** En móvil y en escritorio, con o sin movimiento, los esqueletos no se animan: la forma se reserva y el color sale de los tokens. La tarjeta de libro y su esqueleto comparten una sola regla de alto (`--card-h: 150cqw`, la portada 2:3 con el texto dentro): no depende del largo del título, de modo que no hay salto al cargar (CLS 0). Un destello sobre fotos diferidas que aún no cargan mantenía un recálculo de estilo por fotograma y, en escritorio, hacía que el mismo esqueleto se moviera donde en móvil estaba quieto.

## Movimiento desde tokens

Las duraciones y escalonados viven en `design/tokens.json` (`scales.duration`, `stagger`, `intent`) y salen como `--dur-*`, `--stagger-*` y `--intent-*` en `tokens.css`. `motion.js` los lee del CSS para el código de JS (`DUR`, `ms`), de modo que CSS y WAAPI comparten una sola fuente.

| Token | Valor |
|---|---|
| `--dur-instant` / `--dur-fast` / `--dur-base` / `--dur-slow` / `--dur-scene` | 120 / 240 / 400 / 700 / 1200 ms |
| `--stagger-char` / `--stagger-line` | 24 / 60 ms |
| `--intent-topic` / `--intent-disclosure` | 250 / 320 ms |
| `--ease-out` / `--ease-io` | `cubic-bezier(0.16, 1, 0.3, 1)` / `cubic-bezier(0.65, 0, 0.35, 1)` |

## Qué se retiró en la curaduría

Reloj, capítulos y barra del hero; crédito con nombre del proveedor; segunda frase de escena; horario repetido en el hero (queda el estado en vivo y la dirección); segunda foto del manifiesto y la «mesa de libros» de La casa (cada foto sale una vez); párrafo meta de La casa; etiqueta «Propuesta · sin fecha» por fila; segunda fila de marquesina y las acciones del Llamado (duplicaban la Visita); leyenda «Maqueta B.4» del pie. El catálogo y la Visita no se tocaron.

## Filetes (patrones de referencia, reescritos con nuestro código)

Inspirados en el análisis de una página de producción cinematográfica; no se copia código ni estilos, solo el patrón.

- **Filete capilar:** `--hair` es 1 px, y 0.5 px en pantallas de 2×. El horario de la Visita son dos filas técnicas (etiqueta pequeña en mayúsculas + valor: «Lunes a sábado 11:00–20:00» y «Domingo cerrado»; cada fila lleva `data-days` y `app.js` marca «Hoy» en la que contiene el día de Monterrey) cuyo filete se dibuja fila por fila, la etiqueta antes que el valor.
- **Cruces de registro:** `.rx` pone una cruz en dos esquinas opuestas (Visita y cita) que crece de 0 a 1.
- **Visita (escritorio):** dos columnas 7/5. Izquierda: titular, dirección, estado en vivo y las dos acciones («Cómo llegar» primaria, «Pedir informes» secundaria). Derecha: el horario, la nota de festivos y, debajo, la foto de llegada con su rótulo. Antes la foto iba bajo las acciones, a 7/12 de ancho, y dejaba ~800 px de arena vacía a su derecha en el último capítulo (Peak-End); ahora la columna derecha (horario, nota y foto, enmarcados por las cruces de registro como un solo bloque) marca la altura del capítulo y la izquierda termina en las acciones, 108 px antes a 1280 y 119 a 1600 y 1920: desde 1600 px la columna derecha se fija en 560 px (`minmax(0, 1fr) 560px`) en vez de crecer con la ventana. En móvil el orden es el del DOM: datos y acciones, horario, foto.
- **Botones de contorno** (`ghost`, `line`, `line-ink`): sin relleno al pasar el cursor; dos filetes (el de arriba entra de izquierda a derecha, el de abajo al revés) y una vibración de celuloide de 0.22 s, solo con puntero fino y sin reducción de movimiento. Los botones rellenos (tungsteno, noche, tinta) conservan el barrido.
- **Cita sobre ladrillo:** entre Libros y Catálogo, una cita en dominio público (Cervantes, Quijote II, 58) en tipografía sola, sin filetes por renglón (los cinco filetes cruzaban las letras y se quitaron); solo el texto aparece al entrar en vista y la cruz de registro en dos esquinas. El texto es provisional: debe ser una cita real y atribuida.


## Imágenes y carga

- **Tira de La casa:** cada foto tiene una variante de 800 px (`*-800.webp`, derivada con ffmpeg y registrada en `provenance.json`) y se sirve con `srcset` y `sizes="(max-width: 760px) 84vw, min(54vw, 880px)"`: el teléfono pide la de 800 px y las pantallas densas de escritorio la grande.
- **Póster del hero:** `<picture>` con el primer fotograma vertical en teléfono (`seq-m/m001`) y precarga con `media` para cada tamaño: el móvil ya no descarga el póster de escritorio.
- **Fotos diferidas:** entran con un fundido de `--dur-base` cuando llegan; hasta entonces el marco queda quieto con su color de fondo. Sin JS o con movimiento reducido las fotos se ven siempre.
- **Portadas del catálogo:** una sola familia (tarjeta tipográfica). El tono lo da la categoría (ficción cálida y no ficción fría, cinco tonos cada una, ver Rejilla) y dentro de ella el título. Se retiraron las 195 portadas SVG (~900 KB).
- **Confirmar primero, trabajar después (INP):** abrir una hoja modal vuelve inerte toda la página y cuesta cientos de ms con CPU 4×. Por eso el botón, la tarjeta o el chip confirman el toque en el mismo fotograma (`aria-expanded`, `data-opening`, `aria-checked`) y el trabajo caro corre con `afterPaint()` de `motion.js`. Las hojas se cierran con `closeDialog()` (`sheets.js`): la clase `is-closing` hace que salga ya y el cierre real corre después. Las tarjetas del carrusel se pintan por tandas (6 y el resto). Escape y «atrás» siguen cerrando de inmediato.
- **Fondo tras la hoja (móvil, INP):** no se oculta. Se probó `content-visibility: hidden` en los bloques que rodean al diálogo y, medido con CPU 4x en el teléfono emulado y alternando con y sin ocultarlo, no ayudó: menú 108 frente a 90 ms al abrir; ficha 196 frente a 184 ms al abrir y 194 frente a 171 ms al cerrar. El costo de abrir y cerrar una hoja se atiende confirmando primero (`confirmThen`, `closeDialog`) y dejando que las secciones fuera de pantalla se salten solas (`content-visibility: auto`).
- **Hojas en tareas cortas (móvil, INP):** causa raíz medida con CPU 4× (`tools/qa/inp.mjs`, `INP_DETAIL=1`): la tarea larga no es el clic sino el `showModal()`/`close()` que corre en `afterPaint` (`motion.js`). `showModal()` vuelve inerte toda la página y `close()` la reactiva, y ambos recalculan el estilo de todo lo vivo (~320-400 elementos con el carrusel a la vista; un cambio de estilo de todo el documento cuesta ~100-120 ms con CPU 4×, y `close()` ronda ese suelo); eso es nativo y no se evita sin ocultar el fondo, que se descartó (ver arriba). Lo que sí se puede repartir y recortar: (1) **abrir:** `openDialog(dlg, { defer: true })` (`sheets.js`) abre el diálogo con `.is-filling` (`content-visibility: hidden` en sus hijos) y lo muestra tras el siguiente fotograma, de modo que la rejilla de Explorar o la ficha no se maquetan en la misma tarea que el cambio de inercia (ficha y Explorar). (2) **cerrar:** `closeDialog` va en tres tiempos: la hoja sale (`is-closing`; Explorar se desvanece, el resto se desplaza), cuando ya salió se omite su contenido (`is-filling`) y un fotograma después corre `dlg.close()`. Con la rejilla de Explorar montada (~340 elementos) `close()` costaba 170-320 ms en una sola tarea porque además desmontaba ese diseño; con el contenido omitido, 58-126 ms (mismas condiciones, 5 repeticiones; la omisión en sí, medida alternando, bajó la mediana de 189 a 99 ms). Solo para diálogos modales (el explorador en línea de escritorio no se vacía). Si la hoja se cierra por otra vía (Escape, «atrás», fondo) mientras tanto, el evento `close` limpia las clases y los pasos pendientes no hacen nada; esas vías siguen cerrando de inmediato y conservan el costo anterior. (3) **menos elementos vivos:** en móvil `.rail-item` usa `content-visibility: auto` con `contain-intrinsic-size` exacto (`auto 42vw auto 63vw`: cada tarjeta es 2:3 de 42 vw; tamaños 164×246 y altura del documento idénticos antes y después, 8004 px), de modo que las tarjetas fuera de la vista no cuestan estilo (363 → 321 elementos vivos con el carrusel arriba; el contorno de foco pasa a `outline-offset: -3px` porque la contención de pintura recortaría uno externo). Medición, 3 corridas de `inp.mjs` con CPU 4× (tarea larga mayor de cada interacción; la primera corrida es la más cara por el arranque en frío): antes ficha cerrar 193 / 343 / 92 y Explorar cerrar 171-318; después ficha cerrar 141 / 136 / 56 (mediana 136), menú abrir 90 / 124 / 137, menú cerrar 88 / 99 / 66, ficha abrir 162 / 159 / 129 (una corrida con 220 por ruido de CPU ajena: la máquina estaba al 35-50 %), Explorar abrir 56-201 (la primera en frío) y cerrar 58 / 126 / 97 / 72, Mi lista abrir 50-72 y cerrar 39-125. El INP de evento queda en 24-96 ms. **Límite:** una abrir en frío con la máquina cargada puede rozar 200 ms (el suelo es el cambio de inercia de toda la página, ~100-130 ms); si hiciera falta más margen, la vía restante es recortar el perfil (`.entry`, 58 elementos vivos fuera de pantalla) o la Cartelera (88 cerca de Libros), no tapar el fondo.
- **Movimiento en JS:** `motion.js` lee `--dur-*`, `--stagger-*`, `--intent-*` y las curvas de los tokens; ya no hay milisegundos escritos a mano en `app.js` ni `catalog.js`.

## Móvil (≤ 760 px, `mobile.css`)

Hoja de estilos aparte, con `media="(max-width: 760px)"`: el escritorio no la aplica.

- **Vidrio ligero:** sólido por defecto (`--glass-solid`), translúcido bajo `@supports (backdrop-filter)` (`--glass-tint`, desenfoque de 18 px, saturación 1.6, borde de luz de 1 px y reflejo estático), de nuevo sólido con `prefers-reduced-transparency` y borde de 2 px con `prefers-contrast: more`. El desenfoque no se anima y solo hay dos superficies de vidrio (barra y icono de la cabecera). El tinte y el sólido son opacos (alfa 1 en `--glass-tint` y `--glass-solid`, sin transparencia): bajo las etiquetas de la barra el fondo no cambia con el contenido de la página (con 0.78 y 0.92 se leía «Cómo llegar» a través de la barra; con 0.97 y 0.98 todavía se medían 4.9/255 de diferencia de luminancia frente a la barra sobre fondo negro), y el texto crema mantiene ≥ 6.9:1 aun sobre blanco. El desenfoque queda: no cuesta INP porque solo se pinta la barra.
- **Barra inferior:** píldora flotante de 64 px, cuatro pestañas (La casa, Cartelera, Libros, Visita) con icono propio de 24 px (trazo de 1.75 px, esquinas redondeadas) y etiqueta de 12 px. La activa lleva un contenedor translúcido turquesa y el icono relleno. `<nav aria-label="Secciones">` con `aria-current="location"`; respeta el área segura inferior.
- **Cabecera:** marca más dos círculos translúcidos de 44 px (menú y WhatsApp); al inicio solo se ve el menú (el perfil ya dice quién es) y la marca y WhatsApp aparecen al bajar; se oculta al bajar y reaparece al subir. El menú de escritorio se retira en móvil.
- **Menú lateral (hamburguesa):** `<dialog>` modal que entra desde la izquierda (88 vw, máx. 360 px). Patrón de menú con categorías desplegables (el de Docusaurus/Infima, corregido): filas de 48 px con icono propio de 22 px en círculo de 40 px, chevron que gira 90°, un solo grupo abierto a la vez (acordeón exclusivo), subnivel que se anima con `grid-template-rows` 0fr→1fr y queda `inert` mientras está plegado; al terminar de desplegarse, la lista entera se lleva a la vista (`scrollIntoView` «nearest») y, mientras la lista pueda bajar más (por ejemplo Libros abierto en 360×740 deja Visita y Mi lista bajo el pie fijo), el pie de la lista se funde como pista (`data-more` en `.sm-nav`, máscara de 48 px). Cada botón lleva `aria-expanded` y `aria-controls`; el diálogo enfoca el cierre al abrir, se cierra con Escape, fondo o enlace, y devuelve el foco al botón. Con una hoja abierta, cruzar el punto de corte de 760 px (girar el teléfono) no pone el explorador en línea hasta que la hoja se cierre: si lo hiciera, su vigilante de cierre taparía el de la hoja y Escape dejaría de cerrarla. Orden igual al de la cabecera y la barra inferior: La casa · Cartelera (propuestas, sin fechas) · Libros (temas y «Buscar en la muestra») · Visita (estado en vivo, tabla de horarios, dirección y Cómo llegar); «Mi lista» va aparte, al final. Al elegir un destino el foco pasa al título de la sección, no al botón. Pie con «Cómo llegar» como única acción primaria, WhatsApp como secundaria, Instagram y Facebook. «Atrás» del teléfono cierra la hoja abierta: `sheets.js` empuja una entrada de historial por hoja (menú, Mi lista, ficha, Explorar) y lleva el bloqueo de scroll por contador, así que ninguna combinación deja el scroll bloqueado ni lo libera con otra hoja abierta.
- **Perfil (primera vista):** la parte alta es un perfil de red social. Avatar (el logotipo entero en un cuadrado redondeado de 56 px, `--radius-3`, como la marca de la cabecera: el logotipo es un cuadrado con el texto en el borde inferior y en un círculo se recortaba), nombre (el `h1`, en mayúsculas condensadas de 28 px, el escalón `--fs-5`: es lo mayor de la primera vista y supera al párrafo de 16-17 px; a 360-375 px parte «Librería Itinerante / y Más» en dos líneas con `text-wrap: balance`, sin color ni efecto propios), estado de hoy en vivo y dirección («421 · Centro» va junto con espacios duros; si la dirección parte en dos líneas a 360 px, el pin se queda en la primera, no flotando entre ambas); el párrafo de entrada hace de biografía; «Cómo llegar» (primaria, ancho completo; «Escribir» sale de la primera vista: la primera vista queda en 6 acciones, el menú, «Cómo llegar» y los 4 destacados, y WhatsApp sigue en la cabecera al desplazar, en Cartelera, en Libros y en Visita); debajo, los **destacados** (La casa, Cartelera, Libros, Visita): círculos de 68 px con aro, miniatura recortada de una foto existente y micro-rótulo «IA» o «Foto». Cada uno abre una **historia** (`feed.js`): diálogo modal inmersivo: la foto cubre toda la pantalla (`object-fit: cover`, sin bandas negras) y la barra segmentada (`.stories`), el perfil, el rótulo y los botones flotan encima, con un velo corto arriba y otro en la base donde van el rótulo y los botones; fotos del capítulo, toque a izquierda o derecha o flechas, sin avance automático, rótulo «Recreación IA» o «Foto real» en cada foto, «Cómo llegar» como única primaria y un enlace al capítulo en minúscula a mitad de frase («Ver la casa en la página»); Escape, el botón de cierre y «atrás» la cierran y el foco vuelve al destacado. Sin JavaScript, cada destacado es un enlace al capítulo. La barra inferior entra al salir de la primera vista (`html.at-top`) para no competir con los destacados. Ley de proximidad / región común: todo el perfil vive en un solo bloque, sobre un velo que crece con el texto (el párrafo mide ≥ 16:1 en 320 a 390 px de ancho; `tools/qa/hero.mjs`).
- **Hero:** póster fijo vertical (`seq-m/m001`, una sola petición) y sin cortinilla. Los otros 72 fotogramas de `assets/seq-m/` no se piden en móvil; `scenes-desktop.js` no se descarga.
- **Libros:** una sola puerta. Un solo titular grande (`h2`: «Elige por dónde empezar»), una sola fila de chips al inicio (las colecciones) y el carrusel como respuesta a esa elección; debajo, la capa «Pregúntanos por un tema o un título» (temas como chips deslizables con ajuste de scroll, y la consulta por WhatsApp, un botón de línea secundario; el tema activo usa la misma tinta rellena que la colección activa del carrusel: una sola regla de estado activo en Libros, y el terracota relleno queda para «Cómo llegar») y la capa «Explora la muestra». Las capas internas usan `.layer-title` (un escalón por debajo del `h2`), así el capítulo no tiene dos titulares grandes y los titulares van a la izquierda también en escritorio. El capítulo termina con un bloque corto: una frase y «Cómo llegar» (primaria); tras el buscador solo queda un escalón de ritmo (`--sec-sm`). **Recién llegados** (`news.js`): una tira con el molde del carrusel que lee la clave `novedades` (`ids`) de `assets/data/collections.json`; sin datos (hoy) la sección, su ancla `#novedades` y el enlace del menú quedan ocultos y no ocupan espacio; con datos lleva el rótulo «Datos de muestra · no es inventario» mientras `meta.kind` sea `sample`. No lleva insignias: una «Nuevo» exigiría una fecha de llegada real que hoy no existe. Al mostrarse suma ≈ 0.5 pantallas a Libros (presupuesto: Libros ≤ 3.5).
- **La casa:** barra segmentada tipo historias (un segmento por foto) y toque a izquierda o derecha para cambiar de foto; scroll nativo con `scroll-snap`.
- **Hojas inferiores:** la ficha sube desde abajo con resorte (`--spring`, `linear()`), tiene asa y se arrastra para cerrarla (umbral de 120 px o velocidad > 0.7 px/ms); el fondo se atenúa sin desenfoque.
- **Ficha en dos columnas (móvil):** la portada ocupa 40 % del ancho (`grid-template-columns: 40% 1fr` en `.drawer-body`) y a su lado van género, título (`--fs-5`), autor y «Guardar en mi lista» (`.drawer-head`, que en escritorio es `display: contents` y no cambia nada). Con la portada a todo lo ancho, «Cómo llegar» quedaba bajo el borde en 320-375 px de ancho; ahora su borde inferior queda a 549 px (360×740 y 375×667), 533 px (320×640) y 579 px (390×844) sin desplazar la hoja (`tools/qa/ficha.mjs`, clic real en la tarjeta 2 del carrusel). El orden de lectura y el foco inicial (Cerrar) no cambian. El pie lleva el sello literal «Datos de muestra · no es inventario.», con cada mitad en `white-space: nowrap` para que nunca parta «no es inventario».
- **Foco de las historias:** las zonas «anterior» (35 %) y «siguiente» (65 %) son botones invisibles de toque; con teclado el marco no se pinta sobre toda la zona (medido con Tab real: 254×844 px, 65 % de la foto) sino en un indicador de 44 px en su borde (disco `--night`, aro `--tungsten` de 2 px y flecha). El contorno de la zona es transparente (no `none`) para que el contraste forzado lo recupere. La zona de toque no cambia.
- **Sin JavaScript:** `button.hdr-more` («Abrir menú») se oculta (`html:not(.js)`, la clase que pone `boot.js`) porque no abre nada; los cuatro capítulos siguen en la franja de enlaces de la cabecera, con 44 px de alto.
- **Ritmo y titulares (móvil):** entre dos capítulos el aire es la suma del relleno inferior de uno y el superior del siguiente; con `--sec-md` a ambos lados eran 190-200 px de color liso, así que los capítulos usan `--sec-sm` (48 px) y entre bloques nunca queda más de 96 px (`.house-pin` sin `clamp(vh)`, Visita cierra con `--sec-sm`: 48 + 48 del pie = 96, justo el tope, para que su cruz de registro quede a 24 px del ladrillo y no en la costura). Titulares: un solo escalón por nivel, de la escala de tokens: capítulo (`.h2`: La casa, Cartelera, Elige, Pasa) `--fs-7` (48 px); el llamado y las capas internas (`.layer-title`) `--fs-6` (36 px). El nombre del perfil (`--fs-5`, 28 px) sigue siendo lo mayor de la primera vista. El subtítulo «Matamoros 421» del titular de Visita no se muestra en móvil: repetía la dirección que está debajo.
- **Cierre (pie móvil):** la dirección con un «Cómo llegar» de texto (subrayado, con flecha: no compite con la primaria de Visita), las redes y el correo en una sola fila y «Pausar el movimiento» como enlace de texto discreto (`--bone-dim`, subrayado, sin contorno); todos de 44 px de alto.
- **Carga (móvil):** todo lo que queda bajo el perfil usa `content-visibility: auto` con `contain-intrinsic-size: auto <altura del contenido>` (`.manifesto`, `.house`, `.bill`, `.books`, `.quote`, `.call`, `.visit`, `.ftr` en `mobile.css`; cifras medidas a 360-414 px, sin relleno). Antes el primer diseño de toda la página costaba ~1.8 s con CPU 4x y el LCP (la foto del perfil) llegaba a 3.5-4.2 s; ahora solo se maqueta el perfil y el LCP queda en ~2.0-2.5 s. El navegador recuerda la altura real al mostrar cada sección, y las estimaciones se mantienen a ±1 % del largo real (8014 px frente a 8060 a 390 px) para que las anclas no se desfasen. Las tarjetas del catálogo también lo usan en `style.css`. Si cambia la altura de una sección, actualiza su cifra.
- **Cartelera (publicaciones):** carrusel horizontal de publicaciones, en este orden (el del DOM y el de la pantalla): encabezado (avatar y «Itinerante · propuesta»), foto cuadrada con su rótulo de procedencia, la fila **«Me interesa»** y **«Compartir»** justo debajo de la foto, el pie (título y frase) y la descripción con la consulta por WhatsApp como botón de línea. El título y la frase están dos veces en el HTML (el acordeón de escritorio los pide dentro del resumen; el pie de la publicación los pide después de las acciones) y cada copia se oculta donde no corresponde. Cada «Compartir» lleva su título en el nombre accesible («Compartir «Círculo de lectura»», puesto por `feed.js`). «Me interesa» es un interruptor (`aria-pressed`) que se guarda solo en este dispositivo y no envía nada; «Compartir» usa Web Share y, si no existe, copia el enlace a `#cartelera`. Sin contadores ni reacciones de otras personas (no hay datos). Al pie, «Cómo llegar» (primaria). Formato anterior: carrusel horizontal de tarjetas (foto cuadrada con su rótulo de procedencia, título, descripción y acción), con `scroll-snap`, todas abiertas (sin acordeón exclusivo) y puntos que siguen el desplazamiento. En escritorio sigue el acordeón con escenario fijo.

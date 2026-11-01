---
name: "Itinerante B.4 · Función de la casa"
description: "La librería presentada como una función de cine: se entra a la casa con el propio scroll."
colors:
  night: "#100d0a"
  night-2: "#17120e"
  stone: "#241e18"
  bone: "#f1e8d8"
  bone-dim: "#b8aa95"
  tungsten: "#f0b357"
  tungsten-hi: "#f7cc86"
  turq: "#34b3a5"
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
  tone-light-accent: "#a8432a"
  tone-light-turq: "#176b62"
  tone-sand-bg: "#efe3cc"
  tone-sand-ink: "#2a1d14"
  tone-sand-accent: "#9a3b24"
  tone-sand-turq: "#14625a"
  tone-brick-bg: "#8a3720"
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

La casa a media tarde, con la luz de la calle en la pared. **El sitio es claro de punta a punta**, incluido el hero: la entrada se lee sobre cal clara (tono `light`: fondo `#fbf8f2`, texto café tabaco `#2a1d14`) y la foto del pasillo se funde hacia ese fondo con un velo en la base. Siguen la arena (tono `sand`, `#efe3cc`) en La casa, la cortinilla y Libros, de nuevo cal (`light`) en el manifiesto y el catálogo, y el ladrillo (tono `brick`, `#8a3720`, texto `#f7f0e4`) en la cita y el pie. Los acentos sobre tonos claros son ladrillo (`#a8432a` en `light`, `#9a3b24` en `sand`) y el turquesa de los libreros oscurecido (`#176b62` y `#14625a`) para texto. Las secciones sin tono usan los colores base de `:root`: el turquesa ocupa un capítulo entero (Cartelera), el tungsteno una banda (llamado final) y la Visita va en papel (`#efe6d5`). Quien llega buscando la dirección encuentra un sitio luminoso y con contraste alto, no una cueva.

**La paleta nocturna** (`night #100d0a`, `bone #f1e8d8`, `stone`…) ya no pinta ninguna sección. Sigue definida en `:root` como base de los tokens que cada tono redefine (el nombre `night` significa «fondo»), y como historia de la dirección original B.4 («solo la entrada es de noche»). Queda un resto: `index.html` aún declara `theme-color #100d0a`, que no coincide con el hero claro.

**Tonos por sección.** `data-tone="light|sand|brick"` redefine los mismos tokens (`night`, `bone`, `line`, `tungsten`, `turq`…) dentro de la sección y pinta su fondo; ningún componente cambia. Se generan desde `design/tokens.json` (`themes.b4.tones`). Las portadas tipográficas y el crédito del hero usan tinta propia (`cover-ink`, chip con fondo) para no invertirse con el tono. En un tono claro, `night` significa «fondo» y `bone` «tinta»: los pares garantizan ≥ 4.5:1 y lo comprueba `tests/site.test.mjs`.

El único motivo gráfico es el piso ajedrezado de la sala. Aparece como cortinilla entre La casa y la Cartelera, y como cuadro separador en la marquesina.

## Tipografía

Archivo variable (eje de anchura 62–125) pone dos voces en una sola familia. Condensada en mayúsculas funciona como cartón de título. Al 100 % es texto de lectura. Bodoni Moda itálica es la voz literaria y se usa solo en dos lugares: «sin prisa,» en el manifiesto y el nombre del tema activo en Libros. La segunda línea de cada titular se resuelve en Archivo ancho y ligero (anchura 125 %, peso 380, tamaño 0.5em) en el color de acento de la sección: el contraste es de anchura, no de familia. No hay rótulos sobre los titulares; los únicos textos en mayúsculas pequeñas son metadatos (etiquetas, horario, estado).

La anchura es también movimiento: el tema activo de Libros pasa de 62 % a 80 % de anchura.

## Componentes

- **Botones:** cápsulas con barrido de relleno de abajo arriba (--dur-base, 400 ms) y flecha que avanza 2 px. Variantes: tungsteno (primaria), fantasma, hueso, noche, línea, tinta turquesa. En dispositivos con puntero fino son magnéticos (±12 px).
- **Etiquetas de procedencia:** «Foto real» (turquesa claro) y «Recreación IA» (tungsteno), en todas las imágenes, sin excepción.
- **Fotogramas:** esquinas de 2 px y sin sombra. Las fotos entran con un revelado por máscara (clip-path de abajo arriba y escala 1.22 → 1).
- **Cartelera:** acordeón exclusivo con `<details name>`. Cada fila lleva un título (el tipo de actividad) y una línea; la procedencia «propuesta, sin fecha» la dice el encabezado una vez. Al detenerse 320 ms el detalle se abre solo; el título se desplaza 14 px. El escenario fijo cambia de imagen con una cortina vertical de 700 ms.
- **Nota del mensaje:** tira de papel ligeramente girada (−0.8°) que muestra el texto exacto que abrirá WhatsApp.
- **Estado:** punto verde con pulso (abierto) o terracota (cerrado). El texto se calcula con la hora de Monterrey.

## Coreografía

| Tramo | Mecánica | Fallback |
|---|---|---|
| Entrada (260vh con movimiento en escritorio; en móvil `mobile.css` le da altura automática) | Solo escritorio con movimiento: 145 fotogramas en canvas sincronizados al scroll (`scenes-desktop.js`), carga progresiva (claves cada 12 fotogramas; ventana de ±10 y como máximo 36 fotogramas intermedios en memoria). El nombre se abre desde el centro como una puerta. Un solo rótulo de escena | Póster fijo; texto y acciones visibles. En móvil siempre es póster: `assets/seq-m/` tiene 73 fotogramas verticales en disco, pero solo se pide `m001` (póster); `app.js` no carga `scenes-desktop.js` con ≤ 760 px |
| Intro | El escenario se abre de un recorte (inset) a pantalla completa. Las letras suben escalonadas cada 40 ms | Sin intro |
| Manifiesto | Palabra a palabra, de 17 % a 100 % de opacidad. Las fotos se desplazan en paralaje vertical (±60 px) | Texto completo |
| La casa | Tira horizontal fijada (vh + distancia / 1.6). Enfoque por distancia al centro: escala .91–1, velo de hasta 58 % y paralaje interno de ±6 % | Scroll lateral nativo con snap |
| Cortinilla (100svh) | Cuadrícula de 12×N (6×N en móvil). Cada cuadro crece con un retraso por fila, columna y paridad ajedrezada | Oculta |
| Libros | Al pasar el cursor y quedarse (250 ms) el tema se activa y se queda. Cortina lateral de 700 ms; el nombre rueda letra a letra (salida 260 ms, entrada 520 ms) y el CTA cambia su texto con un desplazamiento vertical | Cambio inmediato |
| Llamado | Una marquesina cuya velocidad se acelera con el scroll y cuyo sentido sigue su dirección, y el titular que da paso a la Visita. Sin acciones: las trae la Visita justo debajo | Estática |

## Accesibilidad y control

- `prefers-reduced-motion`, ahorro de datos y el botón «Pausar el movimiento» del pie (persistente) desactivan todas las escenas. La página pasa a un flujo estático completo.
- El `h1` es «Librería Itinerante y Más» en texto accesible; el nombre gigante es decorativo (`aria-hidden`).
- El menú móvil vuelve inertes `main` y el pie, enfoca el primer enlace y se cierra con Escape devolviendo el foco.
- Cada cambio de tema en Libros se anuncia en una región `aria-live` aparte.

## Catálogo de muestra

Capa 3 del capítulo Libros (`#catalogo`, región con `<h3>` dentro de `#libros`, tono `light` sobre el `sand` del capítulo; desde 2026-11-01 Libros y Catálogo son un solo capítulo: temas y consulta → muestra completa). Datos: `assets/data/catalog.json` (500 registros de prueba, sin precios ni existencias; JSON estático, no consulta `/api/catalog`), rotulados con un sello terracota «Datos de muestra · no es inventario».

- **Búsqueda:** combobox ARIA con sugerencias por autor, título, ISBN y editorial, sin acentos ni mayúsculas. El resultado se filtra mientras se escribe.
- **Filtros:** categoría, género (10 + ver todos), formato y editorial; casillas con conteo por faceta calculado sin la propia dimensión. Chips activos con «Limpiar todo». En móvil se abren con el botón Filtros.
- **Rejilla:** 24 por página y «Ver más»; al cargar más, el foco pasa a la primera ficha nueva. Las portadas son una sola familia: tarjetas tipográficas propias. El tono sale del género dentro de una familia por categoría (ficción cálida, no ficción fría); no hay imágenes de portada ni SVG de terceros.
- **Ficha:** `<dialog>` modal que entra desde la derecha (papel, ink): ficha técnica, mensaje exacto de WhatsApp con el título, y tres relacionados. Escape o clic fuera la cierra y el foco vuelve a la tarjeta.
- **Estados:** carga, error, sin resultados (limpiar o preguntar por WhatsApp) y sin JavaScript (se oculta y queda el enlace a WhatsApp).

## Texto que responde

Todo texto que se puede señalar cambia de estado con el cursor y con el foco de teclado; en táctil el contenido ya está visible o se abre con un toque.

- **Navegación y pie:** el texto sube y deja ver una pista del destino (La casa «6 vistas», Cartelera «3 ideas», Libros «6 temas», Catálogo «De muestra», Visita «Cómo llegar»; pie: «Novedades», «Síguenos», «81 8087 5940», «Escribir»). La pista sale por `content: attr(data-hint) / ""`, así no entra en el nombre accesible. Subrayado animado también con foco.
- **La casa:** en la tira fijada, solo el cuarto central (`.is-center`) o el que está bajo el cursor muestra su frase; la etiqueta de procedencia siempre visible.
- **Cartelera:** pasar el cursor abre el detalle (al detenerse 320 ms) y cambia el escenario.
- **Libros:** pasar el cursor activa el tema (al detenerse 250 ms, solo ratón, sin anunciar en la región viva); clic, flechas y toque siguen igual. Las seis fotos se precargan al primer gesto sobre la lista.
- **Tarjetas del catálogo:** al señalar, el renglón del autor cede su lugar a «Ver ficha».

## Esqueletos

Cada región asíncrona reserva su forma antes de que llegue el contenido: 12 tarjetas y dos grupos de filtros en el catálogo (se sustituyen al pintar o se vacían si hay error), y un barrido de luz sobre el fondo de cada foto diferida (La casa, Cartelera, Libros, manifiesto, Visita). El barrido corre 6 ciclos como máximo, solo con movimiento activo, y está bajo la foto, que lo cubre al llegar. Al abrir el catálogo la altura de la página cambia 58 px (antes 1 903 px).

**Sin destello en móvil.** `mobile.css` deja los esqueletos estáticos (la forma se reserva, el barrido no corre): un destello infinito sobre fotos diferidas que aún no cargan mantenía un recálculo de estilo por fotograma. Lo mismo ocurre con movimiento reducido y en gama media o baja (`html[data-glass="lite"]`, que `assets/js/boot.js` marca con ≤ 4 GB, ≤ 4 núcleos o ahorro de datos). En escritorio con movimiento el barrido sigue corriendo 6 ciclos como máximo.

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

- **Filete capilar:** `--hair` es 1 px, y 0.5 px en pantallas de 2×. El horario de la Visita son filas técnicas (etiqueta pequeña en mayúsculas + valor) cuyo filete se dibuja fila por fila, la etiqueta antes que el valor.
- **Cruces de registro:** `.rx` pone una cruz en dos esquinas opuestas (Visita y cita) que crece de 0 a 1.
- **Botones de contorno** (`ghost`, `line`, `line-ink`): sin relleno al pasar el cursor; dos filetes (el de arriba entra de izquierda a derecha, el de abajo al revés) y una vibración de celuloide de 0.22 s, solo con puntero fino y sin reducción de movimiento. Los botones rellenos (tungsteno, noche, tinta) conservan el barrido.
- **Cita sobre pentagrama:** entre Libros y Catálogo, una cita en dominio público (Cervantes, Quijote II, 58) con cinco filetes por renglón que se dibujan de arriba abajo y el texto que aparece después. El texto es provisional: debe ser una cita real y atribuida.


## Imágenes y carga

- **Tira de La casa:** cada foto tiene una variante de 800 px (`*-800.webp`, derivada con ffmpeg y registrada en `provenance.json`) y se sirve con `srcset` y `sizes="(max-width: 760px) 84vw, min(54vw, 880px)"`: el teléfono pide la de 800 px y las pantallas densas de escritorio la grande.
- **Póster del hero:** `<picture>` con el primer fotograma vertical en teléfono (`seq-m/m001`) y precarga con `media` para cada tamaño: el móvil ya no descarga el póster de escritorio.
- **Fotos diferidas:** entran con un fundido de `--dur-base` cuando llegan; hasta entonces el esqueleto se mueve (y se apaga en cuanto la foto está). Sin JS o con movimiento reducido las fotos se ven siempre.
- **Portadas del catálogo:** una sola familia (tarjeta tipográfica). El tono lo da la categoría (ficción cálida: terracota, ámbar, ciruela; no ficción fría: turquesa, piedra, azul) y dentro de ella el género, de modo que un género siempre se ve igual. Se retiraron las 195 portadas SVG (~900 KB).
- **Movimiento en JS:** `motion.js` lee `--dur-*`, `--stagger-*`, `--intent-*` y las curvas de los tokens; ya no hay milisegundos escritos a mano en `app.js` ni `catalog.js`.

## Móvil (≤ 760 px, `mobile.css`)

Hoja de estilos aparte, con `media="(max-width: 760px)"`: el escritorio no la aplica.

- **Vidrio ligero:** sólido por defecto (`--glass-solid`), translúcido bajo `@supports (backdrop-filter)` (`--glass-tint`, desenfoque de 18 px, saturación 1.6, borde de luz de 1 px y reflejo estático), de nuevo sólido con `prefers-reduced-transparency` y borde de 2 px con `prefers-contrast: more`. El desenfoque no se anima y solo hay dos superficies de vidrio (barra y icono de la cabecera). El tinte no baja de 0.74 para que el texto crema mantenga ≥ 4.5:1.
- **Barra inferior:** píldora flotante de 64 px, cuatro pestañas (La casa, Cartelera, Libros, Visita) con icono propio de 24 px (trazo de 1.75 px, esquinas redondeadas) y etiqueta de 12 px. La activa lleva un contenedor translúcido turquesa y el icono relleno. `<nav aria-label="Secciones">` con `aria-current="location"`; respeta el área segura inferior.
- **Cabecera:** marca más dos círculos translúcidos de 44 px (menú y WhatsApp); se oculta al bajar y reaparece al subir. El menú de escritorio se retira en móvil.
- **Menú lateral (hamburguesa):** `<dialog>` modal que entra desde la izquierda (88 vw, máx. 360 px). Patrón de menú con categorías desplegables (el de Docusaurus/Infima, corregido): filas de 48 px con icono propio de 22 px en círculo de 40 px, chevron que gira 90°, un solo grupo abierto a la vez (acordeón exclusivo), subnivel que se anima con `grid-template-rows` 0fr→1fr y queda `inert` mientras está plegado. Cada botón lleva `aria-expanded` y `aria-controls`; el diálogo enfoca el cierre al abrir, se cierra con Escape, fondo o enlace, y devuelve el foco al botón. Orden por intención de visita: Visita (dirección y Cómo llegar) · Horarios (estado en vivo como subtítulo y tabla) · La casa · Libros (temas) · Cartelera (propuestas, sin fechas) · Catálogo. Al elegir un destino el foco pasa al título de la sección, no al botón. Pie con WhatsApp, Instagram y Facebook.
- **Hero:** póster fijo vertical (`seq-m/m001`, una sola petición) y sin cortinilla. Los otros 72 fotogramas de `assets/seq-m/` no se piden en móvil; `scenes-desktop.js` no se descarga.
- **Libros:** los temas son chips deslizables con ajuste de scroll; el activo va en tungsteno.
- **La casa:** barra segmentada tipo historias (un segmento por foto) y toque a izquierda o derecha para cambiar de foto; scroll nativo con `scroll-snap`.
- **Hojas inferiores:** la ficha sube desde abajo con resorte (`--spring`, `linear()`), tiene asa y se arrastra para cerrarla (umbral de 120 px o velocidad > 0.7 px/ms); el fondo se atenúa sin desenfoque.
- **Carga:** `content-visibility: auto` solo en `.call` y `.visit` (al final de la página). Las secciones anteriores son destino de anclas y deben medir lo real; las tarjetas del catálogo también lo usan en `style.css`.
- **Cartelera:** carrusel horizontal de tarjetas (foto cuadrada con su rótulo de procedencia, título, descripción y acción), con `scroll-snap`, todas abiertas (sin acordeón exclusivo) y puntos que siguen el desplazamiento. En escritorio sigue el acordeón con escenario fijo.

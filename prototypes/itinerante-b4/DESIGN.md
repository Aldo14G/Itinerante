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

## Mundo

La casa de noche, iluminada con lámpara. El fondo es piedra en penumbra (`night`), el texto es hueso, y la luz cálida de tungsteno marca lo accionable. El turquesa de los libreros es el único color que ocupa un capítulo entero (Cartelera). La terracota del piso aparece como acento en el llamado final. El papel (`paper`) solo se usa para leer datos prácticos: la nota del mensaje y la Visita.

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
| Entrada (260vh, 200vh móvil) | 145 fotogramas en canvas sincronizados al scroll (73 en móvil), carga progresiva (claves cada 12 fotogramas, 6 en móvil; ventana de ±10 y como máximo 36 fotogramas intermedios en memoria). El nombre se abre desde el centro como una puerta. Un solo rótulo de escena | Póster fijo; texto y acciones visibles |
| Intro | El escenario se abre de un recorte (inset) a pantalla completa. Las letras suben escalonadas cada 40 ms | Sin intro |
| Manifiesto | Palabra a palabra, de 17 % a 100 % de opacidad. Las fotos se desplazan en paralaje vertical (±60 px) | Texto completo |
| La casa | Tira horizontal fijada (vh + distancia / 1.6). Enfoque por distancia al centro: escala .91–1, velo de hasta 58 % y paralaje interno de ±6 % | Scroll lateral nativo con snap |
| Cortinilla (100svh) | Cuadrícula de 12×N (6×N en móvil). Cada cuadro crece con un retraso por fila, columna y paridad ajedrezada | Oculta |
| Libros | Al pasar el cursor y quedarse (250 ms) el tema se activa y se queda. Cortina lateral de 700 ms; el nombre rueda letra a letra (salida 260 ms, entrada 520 ms) y el CTA cambia su texto con un desplazamiento vertical | Cambio inmediato |
| Llamado | Una marquesina cuya velocidad se acelera con el scroll y cuyo sentido sigue su dirección, y el titular que da paso a la Visita. Sin acciones: las trae la Visita justo debajo | Estática |

## Accesibilidad y control

- `prefers-reduced-motion`, ahorro de datos y el botón «Pausar movimiento» del pie (persistente) desactivan todas las escenas. La página pasa a un flujo estático completo.
- El `h1` es «Librería Itinerante y Más» en texto accesible; el nombre gigante es decorativo (`aria-hidden`).
- El menú móvil vuelve inertes `main` y el pie, enfoca el primer enlace y se cierra con Escape devolviendo el foco.
- Cada cambio de tema en Libros se anuncia en una región `aria-live` aparte.

## Catálogo de muestra

Sección `#catalogo` tras Libros. Datos: `assets/data/catalog.json` (500 registros de prueba, sin precios ni existencias), rotulados con un sello terracota «Datos de muestra · no es inventario».

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

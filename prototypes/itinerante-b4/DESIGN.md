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
    fontSize: "0.72rem"
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

- **Botones:** cápsulas con barrido de relleno de abajo arriba (500 ms) y flecha que avanza 2 px. Variantes: tungsteno (primaria), fantasma, hueso, noche, línea, tinta turquesa. En dispositivos con puntero fino son magnéticos (±12 px).
- **Etiquetas de procedencia:** «Foto real» (turquesa claro) y «Recreación IA» (tungsteno), en todas las imágenes, sin excepción.
- **Fotogramas:** esquinas de 2 px y sin sombra. Las fotos entran con un revelado por máscara (clip-path de abajo arriba y escala 1.22 → 1).
- **Cartelera:** acordeón exclusivo con `<details name>`. El título se desplaza 14 px al pasar el puntero o al abrirse. El escenario fijo cambia de imagen con una cortina vertical.
- **Nota del mensaje:** tira de papel ligeramente girada (−0.8°) que muestra el texto exacto que abrirá WhatsApp.
- **Estado:** punto verde con pulso (abierto) o terracota (cerrado). El texto se calcula con la hora de Monterrey.

## Coreografía

| Tramo | Mecánica | Fallback |
|---|---|---|
| Entrada (320vh, 240vh móvil) | 145 fotogramas en canvas sincronizados al scroll (73 en móvil), carga progresiva por saltos 24→1. El nombre se abre desde el centro como una puerta. Dos rótulos de escena y un código de tiempo 00:00–00:12 | Póster fijo; texto y acciones visibles |
| Intro | El escenario se abre de un recorte (inset) a pantalla completa. Las letras suben escalonadas cada 40 ms | Sin intro |
| Manifiesto | Palabra a palabra, de 17 % a 100 % de opacidad. Las fotos se desplazan en paralaje vertical (±60 px) | Texto completo |
| La casa | Tira horizontal fijada (vh + distancia / 1.6). Enfoque por distancia al centro: escala .91–1, velo de hasta 58 % y paralaje interno de ±6 % | Scroll lateral nativo con snap |
| Cortinilla | Cuadrícula de 12×N (6×N en móvil). Cada cuadro crece con un retraso por fila, columna y paridad ajedrezada | Oculta |
| Libros | Cortina lateral de 1 s. El nombre rueda letra a letra (salida 260 ms, entrada 760 ms) y el CTA cambia su texto con un desplazamiento vertical | Cambio inmediato |
| Llamado | Marquesina de doble fila, en sentidos opuestos. La velocidad se acelera con el scroll y el sentido sigue su dirección | Estática |

## Accesibilidad y control

- `prefers-reduced-motion`, ahorro de datos y el botón «Pausar movimiento» del pie (persistente) desactivan todas las escenas. La página pasa a un flujo estático completo.
- El `h1` es «Librería Itinerante y Más» en texto accesible; el nombre gigante es decorativo (`aria-hidden`).
- El menú móvil vuelve inertes `main` y el pie, enfoca el primer enlace y se cierra con Escape devolviendo el foco.
- Cada cambio de tema en Libros se anuncia en una región `aria-live` aparte.

## Catálogo de muestra

Sección `#catalogo` tras Libros. Datos: `assets/data/catalog.json` (500 registros de prueba, sin precios ni existencias), rotulados con un sello terracota «Datos de muestra · no es inventario».

- **Búsqueda:** combobox ARIA con sugerencias por autor, título, ISBN y editorial, sin acentos ni mayúsculas. El resultado se filtra mientras se escribe.
- **Filtros:** categoría, género (10 + ver todos), formato y editorial; casillas con conteo por faceta calculado sin la propia dimensión. Chips activos con «Limpiar todo». En móvil se abren con el botón Filtros.
- **Rejilla:** 24 por página y «Ver más»; al cargar más, el foco pasa a la primera ficha nueva. Las portadas son SVG locales o tarjetas tipográficas propias (tono por género); no se piden imágenes a terceros.
- **Ficha:** `<dialog>` modal que entra desde la derecha (papel, ink): ficha técnica, mensaje exacto de WhatsApp con el título, y tres relacionados. Escape o clic fuera la cierra y el foco vuelve a la tarjeta.
- **Estados:** carga, error, sin resultados (limpiar o preguntar por WhatsApp) y sin JavaScript (se oculta y queda el enlace a WhatsApp).

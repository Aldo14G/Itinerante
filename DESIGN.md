---
name: "Itinerante · La camioneta (v4.2) en /nuevo"
description: "La página es la ruta de la camioneta: campo menta, trazo blanco del logo y una vitrina oscura para las portadas. Barlow Condensed y Barlow. El movimiento se mejora; solo prefers-reduced-motion lo suaviza."
colors:
  menta: "#5dc4b4"
  tinta: "#061a18"
  sala: "#0d4a45"
  vitrina: "#082724"
  papel: "#f1f5f2"
  papel-2: "#e4ece8"
  linea: "#c9d8d2"
  ambar: "#e8a020"
  blanco: "#ffffff"
typography:
  display: "Barlow Condensed 700 / 600, OFL, woff2 local"
  text: "Barlow 400 / 600, OFL, woff2 local"
  fallback: "BC respaldo y B respaldo con size-adjust (Arial Narrow / Arial)"
spacing:
  scale: "4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128"
  content: "1320 px"
  margin: "clamp(20px, 4vw, 56px)"
motion:
  out: "cubic-bezier(.16, 1, .3, 1)"
  in: "cubic-bezier(.7, 0, .84, 0)"
---

# La camioneta

Sistema de `/nuevo` (dirección v4.2, 22 nov 2026). La raíz (`index.html`) sigue con su piel anterior hasta que esta dirección la reemplace. El catálogo de controles de esa raíz sigue en `design/componentes.json` y `design/COMPONENTES.md`. Regla de atributos: **clase = parte o variante, `aria-*` = estado, `data-*` = gancho de JavaScript**.

## Tesis

La página es la ruta de la camioneta. Llega cargada de libros reales, para en Eventos, abre la vitrina de Destacados, deja el catálogo completo y termina en la puerta (Visita). La tienda de productos es un esqueleto honesto hasta que haya mercancía real.

## Orden

Cabecera (sigue el suelo) → Portada (`#inicio`) → Eventos (`#eventos`) → Destacados (`#destacados`, solo si `src/frente/destacados.json` trae ids con portada) → Catálogo (`#libros`) → Tienda (`#tienda`, fuera de la navegación) → Visita (`#visita`) → pie en tinta.

La cabecera lleva Eventos · Libros (`#destacados`, o `#libros` si no hay destacados) · Visita. Destacados y Catálogo marcan «Libros».

## Color

La menta `#5dc4b4` ocupa la Portada y Visita. La vitrina `#082724` es el escenario de las portadas, no un modo oscuro. El papel `#f1f5f2` y `#e4ece8` son para leer. El ámbar `#e8a020` solo ilumina la vitrina, la selección y el foco sobre oscuro. Texto blanco sobre menta no se usa (no llega a contraste).

## Tipo

Cuatro caras locales en `assets/frente/fuentes/` (OFL, subconjunto latino, menos de 80 KB): Barlow Condensed 600 y 700, Barlow 400 y 600. Se precargan Condensed 700 y Barlow 400. Nada sale de un CDN. El titular de la portada es el único display grande; los H2 de sección son una palabra, salvo «Tienda», que va más chica porque es un anuncio.

## Portada

Retícula `1fr auto 1fr`. El centro de la camioneta coincide con el centro de la vista (tolerancia 4 px a 1440×900 y a 390×844). Cuatro portadas reales van dentro de la caja. Un solo llamado: «Ver eventos» si queda un evento con fecha; si no, «Ver libros».

## Destacados

Vitrina 3D. La pose sale de la distancia al centro (giro hasta 42°, profundidad, vecinas atenuadas). El arrastre es con Pointer Events: el dedo mueve 1:1 (paso 0.74 del ancho); al soltar, menos de 24 px vuelve, menos de 2 pasos avanza un libro, y uno más largo avanza lo recorrido. Sin inercia libre, sin rueda capturada, sin autoplay. Una parada de tabulador, flechas, Inicio, Fin y Enter. Con `prefers-reduced-motion` queda plana (misma planta, sin giro ni eje z) y el cambio de ficha es un fundido de 150 ms. Sin JavaScript la vitrina no se muestra: queda la lista de los mismos libros.

La lista de ids la escribe la librería en `src/frente/destacados.json`. La que hay hoy es provisional y mecánica (los ocho primeros con portada, en el orden del inventario). No es curaduría. Si el archivo queda vacío, la sección no se pinta.

## Catálogo

Estructura de un catálogo con buscador, filtros y resultados. Los filtros son solo datos reales: Género (colecciones de `collections.json`) y Editorial (`catalog.json`, también la de un solo título). Nada de año, materia ni formato. El estado vive en la URL (`q`, `genero`, `editorial`, `orden`, `vista`, `pagina`, `libro`) y el servidor lo resuelve, así que funciona sin JavaScript. El cliente lo vuelve instantáneo con FLIP contenido: mientras dura, `#resultados` recorta y la rejilla conserva su alto. Orden inicial: con portada primero, luego editorial y título. Precio nulo no se imprime. El placeholder de la portada no repite el título.

## Tienda

Esqueleto: «Tienda», sello «Próximamente», la línea «Merch y talleres: próximamente.» y tres huecos (Libros, Merch, Talleres) sin productos, precios ni fotos. Con dos o más productos reales de un tipo en `merch.json`, ese hueco pasa a tarjetas y la línea deja de nombrarlo. Sin brillo en bucle.

## Visita

Dirección, horario confirmado y un solo «Cómo llegar». Contacto (WhatsApp, teléfono, Instagram, Facebook, correo, renta del espacio) solo aquí. Carta «En la barra» desde `menu.json`: precio nulo no se imprime y no se escribe la nota de los tés. Foto solo con permiso registrado (el pasillo). Nada de Abierto/Cerrado en vivo.

## Movimiento

GSAP 3.13 (core y Flip) entra por npm, dentro del bundle. El arrastre no usa Draggable ni Inertia. Solo `transform`, `opacity` y `filter`. Nada en bucle. El contenido no empieza oculto desde CSS: sin JavaScript se lee entero.

## Verdad

No se inventan precios, eventos, productos ni fotos. «Las ruinas de la caza» no tiene precio hasta que lo dé Roberto. El taller Skribh no entra hasta su autorización. Los carteles de Instagram no se descargan sin permiso: la tarjeta del evento lleva el trazo neutro de la camioneta.

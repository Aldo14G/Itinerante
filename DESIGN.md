---
name: "Itinerante · La camioneta (v4.2) en /nuevo"
description: "La página es la ruta de la camioneta: portada menta con la camioneta blanca, seguida por superficies blancas y un marco para las portadas. Barlow Condensed y Barlow. El movimiento se mejora; solo prefers-reduced-motion lo suaviza."
colors:
  menta: "#5dc4b4"
  tinta: "#061a18"
  sala: "#0d4a45"
  vitrina: "#082724"
  papel: "#ffffff"
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

Sistema de `/nuevo` (dirección v4.2, 22 nov 2026), **única superficie oficial de trabajo por decisión de Aldo del 2026-11-24**: `http://localhost:3108/nuevo`. La raíz y las entradas de versiones anteriores redirigen a `/nuevo`; `index.html`, B.4 y su catálogo de controles (`design/componentes.json`, `design/COMPONENTES.md`) quedan como historia sin trabajo nuevo. Implementar en `src/frente/`. Regla de atributos: **clase = parte o variante, `aria-*` = estado, `data-*` = gancho de JavaScript**.

## Tesis

La página es la ruta de la camioneta. Llega cargada de libros reales, para en Eventos y talleres, abre la vitrina «Para empezar» como cabeza del catálogo completo, sirve el café en la sala y termina en la puerta (Visita). La tienda solo aparece cuando hay productos publicados. Orden decidido en la crítica UX del 2026-11-24: el libro es la tarea principal (el Catálogo pasó de 6.35 a 3.87 pantallas a 393 px) y Café queda junto a Visita, donde se decide ir.

## Orden

Cabecera (menta en portada, blanca en el resto, con indicador de sección) → Portada (`#inicio`) → Eventos y talleres (`#eventos` contiene la agenda; `#talleres` lleva al primer taller vigente) → Para empezar (`#destacados`, solo si `src/frente/destacados.json` trae ids con portada) → Catálogo (`#libros`, incluye `#recomendaciones` junto al buscador) → Tienda (`#tienda`, solo con productos; fuera de la navegación) → Café y comida (`#cafe`) → Visita (`#visita`) → Contacto y créditos en el pie (`#contacto`).

La cabecera lleva Agenda · Libros · Café · Visita, en el orden de la página. Agenda apunta a `#eventos` e identifica también el enlace directo a Talleres. Libros lleva a `#libros`, el buscador. Para empezar, Catálogo y Tu próxima lectura marcan «Libros». La portada y «Para empezar» comparten el fondo menta a toda anchura. Agenda, las demás secciones y el pie tienen fondo blanco.

## Color

La portada recupera el fondo menta `#5dc4b4` y el trazo blanco de la camioneta como marca gráfica. El papel blanco `#ffffff` une las secciones de lectura y el pie. La vitrina usa el mismo campo menta que la portada para destacar los libros. La tinta `#061a18` mantiene el contraste del texto en ambos fondos. La menta suave `#dcf1ec` indica selección y otros estados en superficies claras. El turquesa profundo `#082724` se limita a elementos contenidos, como la base provisional de una portada.

## Tipo

Cuatro caras locales en `assets/frente/fuentes/` (OFL, subconjunto latino, menos de 80 KB): Barlow Condensed 600 y 700, Barlow 400 y 600. Se precargan Condensed 700 y Barlow 400. Nada sale de un CDN. El titular de la portada es el único display grande. Escala única en `:root` de `src/frente/nuevo.css` (2026-11-24), con mínimos y máximos en rem para respetar el tamaño de letra de la persona: `--t-display` (solo el H1), `--t-h2` 40–64 (todos los H2 de sección, una sola regla `.h2`), `--t-h3-lg` 32–52 (evento destacado, ficha, «Contacto»), `--t-h3` 28–40 (títulos de tarjeta), `--t-h4` 20–24 (libro, carta, preguntas), `--t-cuerpo` 17, `--t-nota` 15, `--t-rotulo` 13 y `--t-micro` 13. El rol «rótulo» (`.versal`: Barlow 600 a 13, versalitas con tracking) rotula datos como «Próximo evento» y los encabezados de filtro. Los números grandes de la fecha del cartel son gráfico, no titular. Las cifras tabulares solo en precios, fechas, horario y conteos.

## Portada

Retícula `1fr auto 1fr`. El centro de la camioneta coincide con el centro de la vista (tolerancia 4 px a 1440×900 y a 390×844). Cuatro portadas reales van dentro de la caja. La acción principal «Explorar catálogo» lleva al buscador. «Ver agenda» es secundaria y conserva su destino cuando cambia la programación. Los dos botones aparecen juntos con una entrada breve y responden al foco, puntero y pulsación. Con movimiento reducido responden sin desplazarse.

## Eventos y talleres

Una banda con un H2, «Eventos y talleres» (solo «Eventos» si la agenda no incluye talleres). El carrusel ordena primero las actividades fechadas y después las recurrentes. Una tarjeta muestra el cartel o un arte de la casa, el tipo, el título, la fecha u horario, los datos disponibles y una acción. La tarjeta es vertical (cartel arriba, datos abajo) y opaca, sin vidrio. En una laptop se ven dos o tres a la vez (hasta 400 px cada una); en móvil asoma la siguiente y se puede deslizar. Avanza sola una tarjeta cada 5 s mientras está a la vista y vuelve al principio al llegar al final (decisión de Aldo del 2026-11-26, para no obligar a hacer clic). El cursor encima la pausa; arrastrarla con el ratón, deslizar en el trackpad, las flechas o el teclado la detienen del todo. No hay botón Pausar. Las flechas van a los lados de la pista (se ocultan en pantallas táctiles), la pista se arrastra con el ratón sin abrir el enlace de debajo y el ajuste es `proximity` para que un deslizamiento corto no rebote. Con movimiento reducido no avanza sola y la navegación es inmediata. Los carteles locales se muestran completos. Véase la [plantilla de anuncios](docs/TALLERES-NUEVO.md).

## Destacados

Titular «Para empezar» (no «Destacados»: hoy no hay curaduría). Debajo de las portadas, la ficha breve muestra la sinopsis en hasta tres renglones. «Anterior» y «Siguiente» acompañan la ficha en escritorio y quedan encima en móvil. «Ver ficha del libro» abre el libro central y «Ver catálogo completo» lleva al buscador. La pista con JavaScript dice: «Toca la portada del centro para ver su ficha.» con toque, «Haz clic…» con puntero fino. En el teléfono la portada central mide el 50 % del ancho (190–260 px) y la vitrina se ajusta a su alto. Vitrina 3D. La pose sale de la distancia al centro (giro hasta 42°, profundidad, vecinas atenuadas). El arrastre es con Pointer Events: el dedo mueve 1:1 (paso 0.74 del ancho); al soltar, menos de 24 px vuelve, menos de 2 pasos avanza un libro, y uno más largo avanza lo recorrido. Sin inercia libre, sin rueda capturada, sin autoplay. Una parada de tabulador, flechas, Inicio, Fin y Enter. Con `prefers-reduced-motion` queda plana (misma planta, sin giro ni eje z) y el cambio de ficha es inmediato. Sin JavaScript la vitrina no se muestra: queda la lista de los mismos libros.

La lista de ids la escribe la librería en `src/frente/destacados.json`. La que hay hoy es provisional y mecánica (los ocho primeros con portada, en el orden del inventario). No es curaduría. Si el archivo queda vacío, la sección no se pinta.

## Recomendaciones de lectura

El desplegable «Tu próxima lectura» vive junto al buscador. El enlace directo `#recomendaciones` lo abre. El género elegido delimita las sugerencias y el historial ajusta su orden. Al activar la exploración se puede incluir una sugerencia de otro género. Cada sugerencia explica su criterio. «Me interesa» ajusta afinidades y «Otra opción» retira el título de las sugerencias de la visita. El estado vive en memoria de la página y se puede restablecer.

## Catálogo

Estructura de un catálogo con buscador, filtros y resultados. Los filtros son solo datos reales: Género (colecciones de `collections.json`) y Editorial (`catalog.json`, también la de un solo título). Nada de año, materia ni formato. El estado vive en la URL (`q`, `genero`, `editorial`, `orden`, `vista`, `pagina`, `libro`) y el servidor lo resuelve, así que funciona sin JavaScript. Los resultados se leen desde que aparecen. Escribir en el buscador o mostrar más libros actualiza la lista sin animarla. Al cambiar un filtro, la vista o el orden, las tarjetas se recolocan con FLIP breve y la rejilla se recorta durante la transición. La ficha conserva la continuidad con la portada y el cierre interrumpe la apertura, devuelve el foco al disparador y mantiene el fondo fuera del recorrido de teclado mientras la ficha está abierta. Orden inicial: con portada primero, luego editorial y título. Precio nulo no se imprime. El placeholder de la portada no repite el título.

## Tienda

Sin productos publicados, la sección no existe; las tarjetas aparecen al existir productos. Provienen del catálogo real y solo se muestran para los tipos que cumplen el umbral de publicación.

## Visita

Dirección, horario confirmado y un solo «Cómo llegar». Foto solo con permiso registrado (el pasillo), entera en 16:9: con texto alternativo y sin pie visible. Nada de Abierto/Cerrado en vivo.

## Café y comida

La carta se consulta desde el título de Café. El selector muestra Cafés al entrar, conserva la categoría en la URL y ofrece «Toda la carta» junto a las categorías. Sin JavaScript se leen todas. La galería usa una entrada por producto de menu.json, con nombre, descripción e importe si están confirmados. Cada producto es una tarjeta con su lugar vertical 3:4 (el formato de un reel en la cuadrícula de Instagram): el video propio del plato si `menu.json` trae `video` ({ src, poster }, sin sonido, en bucle y solo mientras se ve; `media-src 'self'` en la CSP), si no la foto, y mientras no haya ninguno, el icono del plato (`c-*` en el sprite; el mapa vive en `src/frente/datos.ts`, ICONO_PRODUCTO, y lo que no esté toma el de su categoría). Nunca fotos de banco ni recreaciones. Sin precio confirmado no se imprime nada en su lugar. La rejilla se llena con columnas de al menos 200 px (cuatro o cinco en escritorio) y dos en el teléfono. Ya no hay carrusel de «Recomendaciones de la carta» (2026-11-26). «Planear la visita» lleva a Visita. Para incorporar una foto real, use scripts/foto-carta.py y ejecute npm run nuevo, que valida la procedencia y prepara la imagen pública.

## Movimiento

GSAP 3.13 (core y Flip) entra por npm, dentro del bundle. El arrastre no usa Draggable ni Inertia. Solo `transform`, `opacity` y `filter`. Nada en bucle. El contenido no empieza oculto desde CSS: sin JavaScript se lee entero.

Cinco tokens de duración en `:root` (2026-11-24; `D` los espeja en `cliente.js` para GSAP): `--d-presion` 120 ms (presionado), `--d-rapida` 180 ms (respuesta de control), `--d-media` 300 ms (cambio de estado), `--d-mover` 480 ms (mover piezas, FLIP) y `--d-salir` 360 ms. Todo control se hunde igual al presionarlo (`scale(.97)` en `--d-presion`; con movimiento reducido no hay escala) y los `:hover` solo aplican con `(hover:hover)`, para que nada quede pegado en táctil. Las portadas de la vitrina y la ficha entran con fundido y leve zoom al cargar (`opacity` + `scale` sobre fondo de su banda, marcadas `.cargada` por el cliente; con movimiento reducido solo fundido rápido). El catálogo muestra sus portadas al cargar la imagen. El puntero da una señal de sombra sin inclinar la tarjeta.

## Verdad

No se inventan precios, eventos, productos ni fotos. «Las ruinas de la caza» no tiene precio hasta que lo dé Roberto. El taller Skribh no entra hasta su autorización. Los carteles de Instagram no se descargan sin permiso: la tarjeta del evento lleva el trazo neutro de la camioneta.

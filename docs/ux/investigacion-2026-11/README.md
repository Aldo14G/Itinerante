# Investigación de librerías de UI (2026-11-14)

Pedido de Aldo: revisar la arquitectura, las animaciones, los frameworks y los estilos de siete recursos (Spline, mapcn, Uiverse, 21st.dev, shadcn/ui, Aceternity UI y Magic UI) para aplicar lo mejor al sitio.

Informes completos, con fuentes y lo que no se pudo verificar:

- [`spline-mapcn.md`](spline-mapcn.md): 3D y mapas.
- [`shadcn-21st-uiverse.md`](shadcn-21st-uiverse.md): arquitectura de componentes y microinteracciones.
- [`aceternity-magicui.md`](aceternity-magicui.md): animaciones para landings.

**Cómo se verificó:** la red de la sesión no alcanza los sitios de ninguno de los siete (ui.shadcn.com, 21st.dev, uiverse.io, ui.aceternity.com, magicui.design, spline.design, mapcn.dev). Se leyeron sus repositorios públicos (shadcn/ui, Uiverse, Magic UI, mapcn), sus paquetes de npm (Spline, MapLibre) y búsquedas web. El código de Aceternity no es público: su mecánica sale de Inspira UI (port MIT autorizado) y de extractos. Lo no verificado va marcado en cada informe.

## Conclusión

Los siete están hechos para React + Tailwind (y Motion, three.js o WebGL). El sitio es HTML, CSS y JavaScript nativo, sin dependencias y con CSP estricta (AGENTS.md), así que **ninguno se instala**. Lo que sirve se reescribe en nativo con nuestros tokens, respetando la licencia de cada fuente (registrada en `docs/ux/FUENTES.md` al portar).

| Recurso | Licencia | Veredicto |
|---|---|---|
| shadcn/ui | MIT | Ya tenemos casi toda su arquitectura (tokens fondo/texto, mismos nombres en claro y oscuro, estados por `aria-*`, `<dialog>`). Tomar: catálogo de componentes y tabla de estados. |
| 21st.dev | Por autor (algunos sin licencia reutilizable) | Solo inspiración. |
| Uiverse | MIT | Idea visual, no código: estilos en línea (CSP), 1 de 718 loaders respeta movimiento reducido, ~30 % de toggles inaccesibles por teclado. |
| Magic UI | MIT (verificado) | Reescribir ideas: Blur Fade (sin desenfoque), Animated Beam (sin bucle), Magic Card. No: Marquee, partículas, globo, bordes luminosos. |
| Aceternity UI | Gratis para uso comercial, sin licencia abierta verificable; Pro propietario | Solo inspiración: Focus Cards, Glare Card, Expandable Card. No: haces, lámparas, spotlight, Hero Parallax. |
| mapcn | MIT (código); datos OSM con atribución | No tal cual (React, CARTO, unpkg, OSRM). Idea: mapa de llegada propio. |
| Spline | Propietaria; plan gratis con marca de agua | No: 0.6–1 MB, WebAssembly (relaja la CSP), dominios externos fijos, sin movimiento reducido; una escena de la casa sería una recreación (PRODUCT.md). |

## Propuestas (por valor/costo)

| # | Propuesta | Dónde | Origen | Esfuerzo | Riesgo |
|---|---|---|---|---|---|
| 1 | Mapa de llegada en SVG (Matamoros entre Aldama y Rayón, pin en el 421, tokens claro/oscuro, «© OpenStreetMap») | Visita | mapcn | 0.5–1 día | Bajo |
| 2 | Ruta que se dibuja una vez sobre ese mapa (`stroke-dashoffset`) | Visita | mapcn `RouteProgress` | 0.5 día | Bajo |
| 3 | Enfoque en la tira de La casa: la foto centrada plena, las vecinas atenuadas (`animation-timeline: view(inline)`) | La casa | Focus Cards | 0.5 día | Casi nulo |
| 4 | El conector del recorrido se llena una vez al hojear una parada | Catálogo | Animated Beam (sin bucle) | 1–2 h | Bajo |
| 5 | Despliegue escalonado al pulsar «Ver los 41 títulos» (sin desenfoque) | Catálogo en línea | Blur Fade | 2–3 h | Bajo |
| 6 | Brillo de lámina sobre la portada que ya se inclina al cursor | Carrusel y rejilla (escritorio) | Glare Card / Magic Card | 0.5 día | Bajo |
| 7 | Palomita que se dibuja al elegir un chip o al guardar | Chips, Guardar | Uiverse / shadcn | 2–3 h | Bajo |
| 8 | La portada viaja hasta la ficha al abrirla (View Transitions) | Ficha | Expandable Card | 1–2 días | Medio (INP: medir antes) |
| 9 | Catálogo de componentes `design/componentes.json` (archivos, tokens, estados, ARIA, QA) + tabla de estados por control + prueba de contraste fondo/texto | Sistema | shadcn registry | 1–2 días | Bajo |
| 10 | Mapa interactivo propio (MapLibre + PMTiles alojados) | Visita | mapcn | 3–5 días, +460 KB | Medio |
| 11 | «Pausar el movimiento» como interruptor iOS (`role="switch"`) | Pie | Uiverse / HIG | 2–3 h | Bajo (cambia el control) |

**No conviene:** haces de luz, lámparas, focos, bordes luminosos, botones con brillo, marquesinas, palabras que rotan, texto que se «genera», partículas, globo, rejillas bento, marcos de iPhone o Safari, Hero Parallax, líneas de tiempo sin datos, listas que simulan actividad y contadores sin cifras reales. Son tropos de plantilla (Impeccable, `craft-floor`), se mueven sin parar o inventan datos que PRODUCT.md prohíbe.

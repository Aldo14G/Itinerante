# Investigación de librerías de UI (2026-11-14)

Pedido de Aldo: revisar la arquitectura, las animaciones, los frameworks y los estilos de siete recursos (Spline, mapcn, Uiverse, 21st.dev, shadcn/ui, Aceternity UI y Magic UI) para aplicar lo mejor al sitio.

Informes completos, con fuentes y lo que no se pudo verificar:

- [`spline-mapcn.md`](spline-mapcn.md): 3D y mapas.
- [`shadcn-21st-uiverse.md`](shadcn-21st-uiverse.md): arquitectura de componentes y microinteracciones.
- [`aceternity-magicui.md`](aceternity-magicui.md): animaciones para landings.

**Cómo se verificó:** la red de la sesión no alcanza los sitios de ninguno de los siete (ui.shadcn.com, 21st.dev, uiverse.io, ui.aceternity.com, magicui.design, spline.design, mapcn.dev). Se leyeron sus repositorios públicos (shadcn/ui, Uiverse, Magic UI, mapcn), sus paquetes de npm (Spline, MapLibre) y búsquedas web. El código de Aceternity no es público: su mecánica sale de Inspira UI (port MIT autorizado) y de extractos. Lo no verificado va marcado en cada informe.

**Actualización del mismo día (2026-11-14):** con la red ampliada se abrieron en vivo seis de los siete sitios (con `curl` y en Chromium con Playwright) y se corrigieron los informes en su lugar. Cada punto confirmado lleva «verificado en vivo (2026-11-14)» y su URL, y cada informe termina con su «Verificación en vivo». **mapcn** sigue sin verse: `mapcn.dev` redirige a `www.mapcn.dev` y la red rechaza ese host. Resumen al final de este archivo.

## Conclusión

Los siete están hechos para React + Tailwind (y Motion, three.js o WebGL). El sitio es HTML, CSS y JavaScript nativo, sin dependencias y con CSP estricta (AGENTS.md), así que **ninguno se instala**. Lo que sirve se reescribe en nativo con nuestros tokens, respetando la licencia de cada fuente (registrada en `docs/ux/FUENTES.md` al portar).

| Recurso | Licencia | Veredicto |
|---|---|---|
| shadcn/ui | MIT | Ya tenemos casi toda su arquitectura (tokens fondo/texto, mismos nombres en claro y oscuro, estados por `aria-*`, `<dialog>`). Tomar: catálogo de componentes y tabla de estados. |
| 21st.dev | Por autor (algunos sin licencia reutilizable), y encima los términos de la plataforma: sin redistribuir sin autorización, enlace de vuelta si se copia a otro sitio, demos y medios reservados (verificado en vivo) | Solo inspiración. |
| Uiverse | MIT (verificado en vivo en el sitio) | Idea visual, no código: estilos en línea (CSP), 1 de 718 loaders respeta movimiento reducido, ~30 % de toggles inaccesibles por teclado. |
| Magic UI | MIT (verificado) | Reescribir ideas: Blur Fade (sin desenfoque), Animated Beam (sin bucle), Magic Card. No: Marquee, partículas, globo, bordes luminosos. |
| Aceternity UI | Gratis para uso comercial, pero bajo la Aceternity License: prohíbe redistribuir las fuentes aunque se modifiquen; sin licencia abierta (verificado en vivo); Pro de pago único (169/199/1,590 USD) | Solo inspiración: Focus Cards, Glare Card, Expandable Card. No: haces, lámparas, spotlight, Hero Parallax. |
| mapcn | MIT (código); datos OSM con atribución | No tal cual (React, CARTO, unpkg, OSRM). Idea: mapa de llegada propio. |
| Spline | Propietaria; plan gratis con marca de agua; servirlo sin CDN solo con el plan Enterprise (verificado en vivo) | No: 0.6–1 MB, WebAssembly (relaja la CSP), dominios externos fijos, sin movimiento reducido; una escena de la casa sería una recreación (PRODUCT.md). |

*La tabla no cambia de veredicto tras la verificación en vivo; solo se precisan las licencias (ver al final).*

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

---

## Verificación en vivo (2026-11-14)

**Qué se abrió:** ui.shadcn.com, 21st.dev, uiverse.io, ui.aceternity.com, magicui.design, spline.design y docs.spline.design: precios, licencias y términos, `llms.txt`, el registro de componentes de Aceternity y las demos en Chromium (1440×900, `deviceScaleFactor` 1). Capturas en el scratchpad de la sesión, carpeta `investigacion-ui/vivo/`. **Límites:**
- **mapcn:** `mapcn.dev` redirige a `www.mapcn.dev`, que la red rechaza (reintentado a los 30 s).
- **Uiverse:** su Cloudflare bloqueó la sesión al tercer intento; no se forzó.
- **21st.dev:** sus términos prohíben la recolección automatizada; tras leerlos, no se abrieron más páginas.
- **Fuera de la red permitida:** pro.magicui.design, la galería y el visor de Spline (`community.`, `app.`, `my.`, `prod.spline.design`), carto.com e imágenes de demos (`assets.aceternity.com`).

**Correcciones importantes:**

1. **Aceternity, licencia:** los componentes gratis remiten a la Aceternity License, que prohíbe redistribuir el ítem «or its source files, regardless of modifications»; los términos del sitio reservan todos los derechos. Precios Pro confirmados (169, 199 y 1,590 USD, pago único). Pide React 18+ y Tailwind v3 o v4, no React 19.
2. **Aceternity, mecánica medida en sus demos:**
   - **Apple Cards Carousel:** el elemento compartido es opcional; la demo abre con fundido.
   - **Focus Cards:** desenfoca 8 px, no 4.
   - **Expandable Card:** su transición FLIP (≈ 470 ms) corre igual con movimiento reducido, y ni ella ni Apple Cards tienen diálogo accesible ni manejo del foco.
   - **Glare Card:** gira hasta ≈ ±5,7° / ±10° y suaviza la entrada con 300 ms de transición que luego quita.
   - **3D Card:** confirmado (÷ 25, perspectiva de 1000 px, solo ratón).
3. **21st.dev:** precios confirmados (6, 15 y 7,50 USD; 2 copias al día gratis; sin pago mensual). Los términos (20 jul 2026) exigen un enlace visible si se redistribuye un componente, prohíben el *scraping* y el entrenamiento de IA, y reservan demos y medios. Lo más guardado al frente del catálogo: héroes ligados al scroll, Spline Scene, Liquid Glass Button, Aurora, shaders, Text Rotate.
4. **Uiverse:** MIT confirmado en el sitio («100% Free for personal and commercial use»); 7,471 elementos según la portada (4,510 según el listado), no «más de 5,400»; exporta también a React. **La popularidad sigue sin verificar.**
5. **Spline:** servir una escena sin CDN (export «Self-Hosted») solo existe en **Enterprise**. Precios exactos: Hobby 12/15, Pro 25/30, Max 60/70 USD. El tipo de evento que sigue el scroll de la página es «Scroll» (no «Steps») y exige el Viewer. Secuencia de imágenes JPG/PNG a 15–60 fps confirmada; WebM y GIF no. Comunidad: CC BY 4.0 según la documentación, «Standard Commercial License» según los términos (contradicción). La documentación no menciona ni movimiento reducido ni accesibilidad.
6. **Magic UI:** la portada dice «150+» componentes y `llms.txt` enlaza 79. Pro sigue sin verificar.
7. **shadcn/ui:** confirmado; además, registros privados de GitHub (agosto de 2026).

**¿Cambia alguna recomendación?** **No cambia ningún veredicto ni el orden de las propuestas.** Tres ajustes de detalle:
- **Propuesta 6 (brillo de lámina):** añadir el truco de entrada de Glare Card si la portada salta al empezar a inclinarse. En el árbol de trabajo actual, `.is-inclinada` quita la transición de `transform` desde el primer cuadro: comprobarlo.
- **Propuesta 8 (portada → ficha):** el original no aporta ni diálogo accesible ni respeto del movimiento reducido. La propuesta ya los exigía; ahora está demostrado que hay que hacerlos a mano.
- **Propuesta 3 (enfoque en La casa):** atenuar en vez de desenfocar queda más justificado (el original desenfoca 8 px).

Las negativas (Spline, 21st, Aceternity como código) quedan **más firmes**, no más débiles.

**Estado al cerrar esta verificación (no es parte de la investigación):** el árbol de trabajo de la rama ya tiene, sin commit, cambios de otro agente que aplican varias propuestas: el mapa de Visita en SVG con su ruta (1 y 2), `casa-enfoque` con `animation-timeline: view(inline)` (3), el escalonado de la rejilla (5), el brillo en `initDepth` (6) y «Pausar el movimiento» como `role="switch"` (11). Las correcciones de arriba no los invalidan.

**Técnicas de las portadas que sirven a Itinerante, bajo sus reglas:**
- **Enseñar el objeto real.** shadcn/ui pone componentes que funcionan bajo el titular; Uiverse, su rejilla de elementos reales. Itinerante ya enseña portadas y fotos reales: no cambiarlas por ilustraciones.
- **Para lucir mapas o plantillas, imágenes, no WebGL** (Aceternity y mapcn). Respalda el mapa de Visita en SVG.
- **Medir el movimiento perpetuo.** Con movimiento reducido emulado, la portada de Spline apaga sus 15 animaciones infinitas; las de Magic UI (10) y Aceternity (7) siguen corriendo. Contar `document.getAnimations()` con `iterations === Infinity` bajo `reducedMotion: 'reduce'` es una prueba barata para `tools/qa/motion.mjs`.
- **Tracking:** las cuatro landings aprietan de −0,025 a −0,06 em en titulares de 48–72 px. Nuestros tokens ya llevan su tracking por tamaño (−0,025 em en `display`, en la línea de Apple). No apretar más.
- **Esquina superelíptica** (`corner-shape: superellipse()` en 21st.dev): mejora progresiva posible sobre `border-radius`, pero sin soporte verificado en Safari. No proponer sin medir.

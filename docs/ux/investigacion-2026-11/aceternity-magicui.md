# Aceternity UI y Magic UI: qué tomar para Librería Itinerante

Investigación del 2026-11-14. Solo lectura del repositorio; no se editó nada en `/home/user/Itinerante`.

## 0. Cómo se verificó (y qué no)

- **Desde esta sesión no se pudieron abrir** `ui.aceternity.com`, `magicui.design` ni `21st.dev`: la red de la sesión no los resuelve. Para abrirlos hay que permitir esos dominios en la configuración de red de la sesión.
- **Magic UI: verificado en su código.** Se clonó el repositorio público `github.com/magicuidesign/magicui` (commit `6f7b531`, 2026-11-13) y se leyeron `LICENSE.md`, `registry.json`, `apps/www/package.json`, `styles/globals.css` y el código de cada componente citado (`apps/www/registry/magicui/*.tsx`).
- **Aceternity UI: verificado a medias.** El código de los componentes gratis no está publicado en un repositorio abierto. La mecánica se tomó de dos fuentes:
  - **Inspira UI** (`github.com/unovue/inspira-ui`, MIT, versión del 2026-10-18), que porta a Vue muchos componentes de Aceternity y dice que lo hace con permiso de su autor.
  - Extractos del sitio oficial que devolvió el buscador.

  Lo que solo sale de extractos lleva la marca *(según búsqueda)*.
- Las cifras de precio y de tamaño del catálogo de los planes Pro **no están verificadas**: las fuentes no coinciden.
- **Actualización del mismo día (2026-11-14):** con la red ampliada se abrieron en vivo `ui.aceternity.com` (portada, `/pricing`, `/licence`, `/terms`, `/llms-full.txt`, `/api/components`, las páginas de los cinco componentes pedidos en Chromium y su código en el registro público `ui.aceternity.com/registry/<nombre>.json`, que es lo que instala el CLI de shadcn) y `magicui.design` (portada en Chromium, `/llms.txt`, `/docs`). En las demos de Aceternity se midió en Chromium (1440×900, `deviceScaleFactor` 1) lo que pasa al pasar el cursor, al abrir y con movimiento reducido emulado. Las imágenes de las demos vienen de `assets.aceternity.com`, que la red bloquea, así que las capturas salen sin fotos; la mecánica sí se ve. `pro.magicui.design` sigue bloqueado. Lo confirmado lleva «verificado en vivo (2026-11-14)»; el resumen está en «Verificación en vivo», al final. **Del código de Aceternity solo se anotan parámetros y comportamiento; no se copió nada.**

---

## 1. Arquitectura técnica

### Magic UI (verificado en código)

| Aspecto | Dato |
|---|---|
| Lema | «UI Library for Design Engineers» (README). Docs: «Create magical landing pages with components that you can copy and paste into your apps»; «heavily inspired by ui.shadcn.com» (`content/docs/index.mdx`) |
| Pila del sitio | Next 16.4.6, React 19.3.1, Tailwind CSS 4.3.5, `motion` 12.23.12 (antes framer-motion), shadcn 4.23.0 (`apps/www/package.json`). Hay docs aparte para Tailwind v3 en `v3.magicui.design` |
| Distribución | Un **registro de shadcn** (`registry.json`, tipo `registry:ui`). Se instala con `npx shadcn@latest add @magicui/globe`: el CLI copia el `.tsx` al proyecto, en `components/ui/`. «Exact same installation process as shadcn/ui» (`content/docs/installation/index.mdx`) |
| Catálogo | 80 componentes en `registry/magicui/`. **En vivo (2026-11-14):** [magicui.design/llms.txt](https://magicui.design/llms.txt) enlaza 79 páginas de componente, y la portada ([magicui.design](https://magicui.design/)) dice «150+ free and open-source animated components and effects». La cifra de la portada no coincide con el catálogo; la buena es la de 79–80 |
| Dependencias | `motion` en 31 piezas del registro; `cobe` en Globe (WebGL); `canvas-confetti`; `rough-notation` en Highlighter; `react-tweet`; `shiki`; `next-themes`; `@radix-ui/react-icons`; `lucide-react` |
| Estructura de un componente | Un solo `.tsx` con `"use client"`, utilidad `cn()` (clsx + tailwind-merge) y clases de Tailwind con valores arbitrarios y variables CSS (`[--duration:40s]`). Los `@keyframes` van en el `globals.css` del proyecto como `--animate-*` dentro de `@theme` (marquee, shine, ripple, shimmer-slide, spin-around…). El estado animado usa `useInView`, `useSpring`, `useScroll`, `useMotionTemplate` o `AnimatePresence` |
| Licencia (gratis) | **MIT**, «Copyright (c) Magic UI» (`LICENSE.md`). Se puede copiar, modificar y redistribuir conservando el aviso de copyright y de permiso |
| Pro y plantillas | El enlace «Templates» del sitio lleva a `pro.magicui.design` (`config/docs.ts`). *(Según búsqueda:)* compra única; uso comercial y licencia perpetua; «re-selling of code is NOT allowed»; los productos siguen siendo propiedad intelectual de Magic UI. Fuentes: [pricing](https://pro.magicui.design/pricing), [license](https://pro.magicui.design/license). Precio sin verificar. **Sigue sin verificar (2026-11-14):** `pro.magicui.design` no está en la red permitida; la portada de magicui.design solo anuncia «Magic UI Pro - 50+ blocks and templates» |
| Movimiento reducido | **Solo 7 de 80 componentes lo atienden**: dia-text-reveal, dither-field, floating-3d-particles, icon-cloud, retro-grid, scroll-based-velocity y shine-border. `globals.css` no tiene regla global. Marquee, Blur Fade, Text Animate, Number Ticker, Border Beam, Ripple, Word Rotate y Animated List se animan siempre (verificado con grep) |

### Aceternity UI

| Aspecto | Dato |
|---|---|
| Lema | «The React component library for beautiful landing pages» / «Animated sections built for landing pages» (capturas de Aldo). **Verificado en vivo (2026-11-14):** el `h1` de [ui.aceternity.com](https://ui.aceternity.com/) es «The React component library for beautiful landing pages.» |
| Pila | React 19, un framework de React y **Tailwind CSS v4** como requisitos; `motion` (se importa de `motion/react`) más `clsx` y `tailwind-merge` y una utilidad `cn` en `lib/utils.ts` *(según búsqueda: [installation](https://ui.aceternity.com/installation), [cli](https://ui.aceternity.com/components/cli))*. Hay piezas con three.js (GitHub Globe), simplex-noise (Vortex, Wavy Background) y canvas o shaders (Spotlight Shader, Dither Shader); así las etiqueta Inspira UI. **Corregido en vivo (2026-11-14):** [llms-full.txt](https://ui.aceternity.com/llms-full.txt) dice «React 18+, Next.js 14+, Tailwind CSS v3 and v4, TypeScript, Motion»; [api/components](https://ui.aceternity.com/api/components) dice React 18+, Next 13+, Tailwind v4 y Framer Motion. No exige React 19 ni solo Tailwind v4. Los componentes importan `motion/react` (confirmado en el código del registro) |
| Distribución | Copiar y pegar desde cada página, o con el CLI de shadcn: `npx shadcn@latest add @aceternity/<componente>`. Su changelog anuncia que admite el CLI 3.0 de shadcn *(según búsqueda)*. **Verificado en vivo (2026-11-14):** el CLI lee `https://ui.aceternity.com/registry/<nombre>.json` ([cli](https://ui.aceternity.com/components/cli)); algunos ítems piden token (el del Expandable Card respondió 401; su código está en `expandable-card-demo-standard.json`). El catálogo declara 114 componentes gratis ([api/components](https://ui.aceternity.com/api/components); la portada dice «118+», precios «100+») |
| Estructura | Igual que Magic UI: un `.tsx` `"use client"` en `components/ui/`, a veces con un hook auxiliar (Apple Cards Carousel trae `hooks/use-outside-click.ts`) *(según búsqueda)*. **Verificado en vivo (2026-11-14):** el registro de Apple Cards Carousel declara `use-outside-click` como dependencia, más `motion` y `@tabler/icons-react` |
| Licencia (gratis) | **No es MIT verificable.** El `llms-full.txt` oficial dice que los componentes son «free to use in unlimited personal and commercial projects» y no nombra ninguna licencia *(según búsqueda: [llms-full.txt](https://ui.aceternity.com/llms-full.txt))*. Algunos agregadores dicen «MIT» sin citar un archivo de licencia, y shadcn.io no registra ninguna. Inspira UI dice que **pidió permiso al autor** para portarlos, lo que apunta a que no es una licencia abierta. **Conclusión: tomar solo la idea, no el código.** **Verificado y precisado en vivo (2026-11-14):** el encabezado de [llms-full.txt](https://ui.aceternity.com/llms-full.txt) dice «Licence: components are free to use in unlimited personal and commercial projects. Reselling or redistributing the components as a competing library is not permitted. **Full terms: https://ui.aceternity.com/licence**». Es decir, los gratis también caen bajo la Aceternity License (fila siguiente), que cubre «each item available for purchase **or download**» y prohíbe redistribuir el ítem «or its source files, **regardless of modifications**». Además, los [términos del sitio](https://ui.aceternity.com/terms) (de «Aceternity Solutions Private Limited») reservan todos los derechos y prohíben «Reproduce, duplicate or copy material» del sitio. No hay licencia abierta: **se confirma «solo la idea»**. Si el repositorio de Itinerante es público, poner ahí código casi literal de Aceternity sería redistribuir sus fuentes |
| Pro | «Aceternity License» *(según búsqueda: [licence](https://ui.aceternity.com/licence))*: no exclusiva, mundial, uso comercial en productos finales ilimitados propios o de clientes; **prohíbe vender, revender o distribuir el ítem o derivados**; el contrato es con el autor del ítem; puede incluir piezas de terceros con otras licencias; © Aceternity Labs LLC. Precios según terceros, sin verificar: anual 169 US$, vitalicio 199 US$, equipo 1590 US$ ([toolradar](https://toolradar.com/tools/aceternity-ui/pricing)). Cifras de bloques y plantillas contradictorias. **Verificado en vivo (2026-11-14):** la [licencia](https://ui.aceternity.com/licence) dice exactamente eso (más: prohíbe crear temas o plantillas para vender; el sitio no es parte del contrato) y el pie dice «© Aceternity Labs LLC». [Precios](https://ui.aceternity.com/pricing), pago único: **1-Year License 169 USD** (precio tachado 249), **Lifetime 199 USD** (tachado 299), **Team 1,590 USD** para 10 personas (tachado 1,990); Free 0 USD con los componentes gratis y acceso MCP. Las cifras de terceros eran correctas. El catálogo de pago sigue sin cifra única: «200+ blocks, 15+ templates, 5 pages, 18 interactions» (precios), «17 templates, 182 blocks and 5 pages» (barra lateral) y «183 premium blocks and 17 full page templates» (`llms-full.txt`) |

**Consecuencia para nosotros:**
- **Magic UI (MIT):** se puede reescribir la mecánica e incluso trasladar fragmentos con su aviso. Como nada se instala (React, Tailwind y Motion no entran en runtime), lo sensato es reescribir la idea en CSS y JS nativos.
- **Aceternity:** solo inspiración.

Ninguno de los dos se puede usar tal cual: los dos dependen de React, Tailwind y Motion, y los valores se escriben en `style` desde React. Bajo nuestra CSP eso equivale a CSSOM y se permitiría, pero no hay React.

---

## 2. Catálogo de animaciones

Leyenda del veredicto:
- **Buena:** vale por sí misma y encaja con el sistema.
- **Adaptable:** la idea vale, pero no en su forma original.
- **Tropo:** delata una plantilla de IA o de SaaS.

El coste es aproximado: «bajo» si solo anima `transform` y `opacity` en el compositor; «medio» si repinta (`filter`, `mask`) o mide el layout; «alto» si corre un bucle continuo, usa canvas o WebGL o anima varios `backdrop-filter`.

### Aceternity UI

| Componente | Qué hace | Cómo funciona | Coste | Accesibilidad | Veredicto |
|---|---|---|---|---|---|
| **Apple Cards Carousel** | Tira horizontal de tarjetas altas con foto; al tocar una, se expande a una hoja a pantalla completa | `overflow-x: scroll` nativo con `scrollBy(±300, smooth)` y flechas; entrada escalonada (`opacity`/`y`, retraso 0.2 s × índice, 0.5 s); la expansión es una transición de elemento compartido (`layoutId` en tarjeta, categoría y título); fondo `bg-black/80 backdrop-blur-lg`; Esc o clic fuera cierran; `BlurImage` desenfoca la imagen mientras carga (verificado en el port de Inspira) | Medio. Las animaciones `layout` miden y el `backdrop-blur` del velo cuesta | El port no trae `role="dialog"` ni `aria-modal` ni trampa de foco (verificado en el port; en el original, sin verificar). **Verificado en el original en vivo (2026-11-14):** tampoco; el foco se queda en la tarjeta y el tabulador recorre las tarjetas de detrás del velo | **Adaptable.** Ya tenemos Carrusel3D y la ficha en `<dialog>`. La idea que vale es la **transición portada → ficha**. **Corrección en vivo:** en el original, el elemento compartido es **opcional** (prop `layout`); la demo oficial abre con un fundido. Ver «Mecánica observada en vivo» |
| **3D Card Effect** | La tarjeta gira hacia el cursor y sus capas se adelantan | `perspective: 1000px`, `rotateY/rotateX = (puntero − centro) / 25`, sin tope (en una tarjeta de 1000 px llega a ±20°); cada capa interior hace `translateZ` en hover | Bajo | Solo con ratón; no mira la reducción de movimiento (port). **Verificado en vivo (2026-11-14):** el original escucha `mouse*` (no `pointer*`) y no mira la reducción de movimiento; en una esquina de la tarjeta de la demo (494 px) el giro medido fue de unos 9,4° | **Ya lo tenemos** (inclinación ≤ 6°). Las capas con `translateZ` (insignia o «Guardar» que se adelantan) son opcionales |
| **Focus Cards** | Al pasar por una tarjeta, las demás se desenfocan y encogen | Las no activas reciben `blur-sm` y `scale-[0.98]` con una transición de 300 ms ease-out *(según búsqueda)*. **Verificado en vivo (2026-11-14):** con el cursor sobre una tarjeta, las otras cinco miden `filter: blur(8px)` (en Tailwind v4 `blur-sm` son 8 px, no 4) y se encogen al 98 %; transición de 0,3 s con `cubic-bezier(0, 0, 0.2, 1)`. El título de la tarjeta solo aparece sobre la enfocada, con un velo negro al 50 % | Medio. `filter: blur` en varias imágenes repinta | Solo con hover; el desenfoque estorba la lectura. **En vivo:** con toque no hay hover, así que el título nunca aparece | **Adaptable**, cambiando el disparador: enfocar **por posición en la tira** (con scroll), no por hover, y atenuar en lugar de desenfocar |
| **Parallax Scroll (Parallax Grid Scroll)** | Rejilla de fotos con columnas que se desplazan en sentidos opuestos | `useScroll` del contenedor y `translateY` contrario por columna *(según búsqueda)* | Medio | Movimiento ligado al scroll que no pidió la persona (vestibular) | **Tropo** de galería |
| **Hero Parallax** | Tres filas de miniaturas que se deslizan en horizontal mientras el bloque se inclina y endereza | `useScroll`; `rotateX` 15° → 0° en el primer 20 % con `useSpring`; `translateX` 0 → ±1000 px; también `rotateZ`, `translateY` y `opacity`; contenedor de unos 300 vh *(según búsqueda)* | Alto: decenas de imágenes, LCP y scroll largo | Marea; no se puede pausar | **Tropo** de SaaS. No |
| **Text Generate Effect** | El texto aparece palabra a palabra con desenfoque | Cada palabra pasa de `opacity` 0 con `blur(10px)` a 1, una cada 200 ms con `setTimeout`, transición de 0.7 s (port) | Medio: un `filter` por palabra | Bloquea la lectura; imita la salida de un chatbot | **Tropo de IA** de manual. No (ya tenemos titulares por línea) |
| **Lamp** | Fondo `slate-950` con dos haces cónicos cian que se abren y un resplandor | Dos `conic-gradient` que se ensanchan, máscaras lineales, `blur-2xl`, `backdrop-blur-md`, `@keyframes` de 0.8 s con 0.5 s de retraso (port) | Medio | Contraste bajo sobre negro | **Tropo** («lámpara» de landing oscura). No |
| **Spotlight** | Un cono de luz cruza el hero al cargar | Elipse SVG con `feGaussianBlur` que anima opacidad y traslación *(según búsqueda)* | Medio | Decorativo | **Tropo.** No |
| **Background Beams** | Haces que recorren trazos SVG sobre fondo oscuro | Muchos `<path>` con `linearGradient` animado (Motion), en bucle *(según búsqueda)* | Alto: bucle infinito | Movimiento perpetuo sin pausa (WCAG 2.2.2) | **Tropo.** No |
| **Sticky Scroll Reveal** | Columna de texto que pasa junto a un panel fijo que cambia de contenido y de fondo | `useScroll` del contenedor y `useMotionValueEvent`; corte por índice / n; elige la tarjeta más cercana y cambia `backgroundColor` y un `linear-gradient` *(según búsqueda)* | Medio | Hay que leer en un contenedor con scroll interno | **Adaptable con cautela.** No hace falta hoy |
| **Timeline** | Línea vertical que se «llena» al bajar, con títulos fijos por entrada | `useScroll` y `useTransform(scrollYProgress, [0,1], [0, alto])` sobre la altura de la línea, con degradado y máscara (port) | Medio: anima `height`, que es layout | Bien si es solo decoración | **Sin datos que la sostengan**: una historia o calendario inventados violan PRODUCT.md. No |
| **Expandable Card** | Lista de filas; al tocar, la fila se expande a una tarjeta superpuesta | `layoutId` compartido para imagen, título y descripción; velo con `AnimatePresence`; superposición fija; Esc o clic fuera *(según búsqueda)*. **Verificado en vivo (2026-11-14):** la fila crece hasta la tarjeta en unos 470 ms con escalas no uniformes (técnica FLIP); el velo es negro al 20 %, sin desenfoque | Medio | **En vivo:** las filas son `div` sin `role` ni `tabindex` (no se llega con teclado), la tarjeta abierta no tiene `role="dialog"` y **la transformación corre igual con movimiento reducido** (mismas medidas cuadro a cuadro) | **Buena idea** (la misma que Apple Cards): transición de elemento compartido, **con la accesibilidad que el original no tiene** |
| **Images Slider** | Pase de fotos a pantalla completa con texto encima | Intervalo de autoplay (`useIntervalFn`), flechas del teclado, deslizar y transiciones con perspectiva (port) | Medio | Autoplay sin pausa visible | **No**: autoplay (el sistema prohíbe autoplay en carruseles) |
| **Layout Grid** | Rejilla de fotos; al tocar una, crece a gran tamaño y las demás se atenúan | Prop `layout` y `layoutId` de Motion *(según búsqueda)* | Medio | Depende de la implementación | **Adaptable**: mismo patrón que la ficha |
| **Glare Card** | Tarjeta «holográfica» que gira y refleja la luz del cursor | `perspective: 600px`, giro con variables CSS; brillo `radial-gradient` en `--m-x/--m-y` con `mix-blend-mode: soft-light`; capas de arcoíris y diagonales con `color-dodge`; `clip-path` redondeado (port). **Verificado en vivo (2026-11-14):** igual en el original. En la esquina, `--r-x` −5,6° y `--r-y` −9,8° (tope de unos ±5,7° en horizontal y ±10° en vertical); el brillo sube a opacidad 0,6 en hover; la transición dura 300 ms al entrar y pasa a 0 s mientras el cursor sigue dentro | Medio-alto: varias capas de mezcla que repintan | Solo con ratón (`pointer*`, sin filtrar el tipo de puntero) | **El brillo suave, sí; el foil arcoíris, tropo.** El brillo combina con la inclinación que ya tenemos |
| **Wobble Card** | La tarjeta se mueve y escala con el ratón; el fondo se desplaza al revés | Traslación y escala por `mousemove` con Motion *(según búsqueda)* | Bajo-medio | Solo con ratón | **Tropo**; ya tenemos la inclinación |

#### Mecánica observada en vivo (2026-11-14)

Demos abiertas en Chromium en las páginas oficiales de cada componente; los valores salen de `getComputedStyle` y de las variables CSS que escribe cada demo. Solo parámetros y comportamiento: no se copió código.

- **Apple Cards Carousel** ([demo](https://ui.aceternity.com/components/apple-cards-carousel)):
  - Desplazamiento horizontal nativo (`overflow-x: scroll`, barra oculta); las flechas mueven 300 px con `scrollBy` suave y se desactivan en los extremos.
  - Entrada al montar: cada tarjeta sube 20 px y aparece en 0,5 s, con 0,2 s de retraso por índice. No usa `whileInView`: corre al cargar, se vea o no.
  - **Al abrir, la demo hace un fundido**, no un elemento compartido: `layoutId` solo se activa si se pasa la prop `layout`, y la demo no la pasa. Velo negro al 80 % con `backdrop-blur-lg`; `body` con `overflow: hidden`; cierran Esc, la ✕ y el clic o toque fuera.
  - Al cerrar, vuelve el carrusel a la tarjeta calculando la posición con anchos fijos (230 o 384 px y huecos de 4 u 8 px) que no coinciden con el hueco real de la fila (16 px), así que puede quedar desplazado.
  - Accesibilidad: sin `role="dialog"`, sin `aria-modal` y sin mover el foco; tras abrir, el tabulador sigue por las tarjetas de detrás.
  - La imagen se desenfoca (`blur-sm`) hasta que carga.
- **Focus Cards** ([demo](https://ui.aceternity.com/components/focus-cards)): desenfoque de 8 px y escala 0,98 en las no activas; 300 ms con curva de salida. Solo hover.
- **Glare Card** ([demo](https://ui.aceternity.com/components/glare-card)):
  - Perspectiva de 600 px; giro de hasta unos ±5,7° (eje vertical) y ±10° (horizontal).
  - Un brillo radial blanco (0,8 → 0) sigue al cursor en `soft-light`, y encima hay una lámina arcoíris con un patrón SVG en `color-dodge`.
  - **Truco que vale:** al entrar el cursor, la transición dura 300 ms y a los 300 ms pasa a 0 s. La tarjeta llega suave a su primera pose y luego sigue al cursor sin retraso; al salir, vuelve con transición.
  - El código publicado deja un `console.log` en cada `pointermove`.
- **Expandable Card** ([demo](https://ui.aceternity.com/components/expandable-card)): elemento compartido real (imagen, título, descripción y botón), unos 470 ms. **Con movimiento reducido emulado la animación es idéntica cuadro a cuadro**: Motion no respeta la preferencia salvo que el proyecto lo configure, y la demo no lo hace. Las filas no son botones (sin teclado), no hay `role="dialog"` y el foco se queda en `body`.
- **3D Card Effect** ([demo](https://ui.aceternity.com/components/3d-card-effect)):
  - Perspectiva de 1000 px; giro = distancia al centro ÷ 25 (unos 9,4° en la esquina de una tarjeta de 494 px); transición lineal de 200 ms.
  - Cada capa interior se adelanta con `translateZ` (20 a 60 px en la demo) mientras el ratón está dentro.
  - Solo eventos de ratón; nada para movimiento reducido.

**Lección para nuestras propuestas:** la idea del elemento compartido sigue valiendo, pero el original no es modelo de accesibilidad ni de movimiento. Nuestra versión (§ 4, punto 1) tiene que estar en un `<dialog>` de verdad, devolver el foco y no animar con movimiento reducido ni con «Pausar el movimiento»; las demos demuestran que nada de eso viene dado.

### Magic UI (todo verificado en código)

| Componente | Qué hace | Cómo funciona | Coste | Accesibilidad | Veredicto |
|---|---|---|---|---|---|
| **Marquee** | Cinta infinita de logos o reseñas | Repite el contenido `repeat=4` veces; `@keyframes marquee` = `translateX(calc(-100% - var(--gap)))`, lineal e infinito, `--duration: 40s`; pausa opcional en hover | Bajo (compositor), pero perpetuo | Las 4 copias **no llevan `aria-hidden`** (el lector lee 4 veces); sin reducción de movimiento; sin pausa (WCAG 2.2.2) | **No.** Ya se retiró la marquesina del sitio «por decoración» |
| **Blur Fade** | Bloque que entra con fundido, 6 px de desplazamiento y desenfoque | `useInView(once, margin -50px)`; de `opacity: 0`, `y: ±6`, `filter: blur(6px)` al estado final; 0.4 s easeOut; retraso de 0.04 s más `delay` | Medio por el `filter` | Sin reducción de movimiento | **Adaptable.** El escalonado vale como *respuesta* (al desplegar la rejilla); el desenfoque, mejor no |
| **Border Beam** | Un destello recorre el borde de una tarjeta | Un cuadrado con degradado viaja por `offset-path: rect(0 auto auto 0 round …)` animando `offset-distance` lineal infinito (6 s); máscara `mask-composite: intersect` para quedarse en el borde; colores por omisión `#ffaa40 → #9c40ff` | Bajo-medio, perpetuo | Sin reducción de movimiento | **Tropo** de plantilla. No |
| **Shine Border** | Borde con brillo que gira | `radial-gradient` con `background-size: 300%` animando `background-position` (14 s) y máscara `content-box` con `exclude`; `motion-safe:` | Medio: repinta fondo | Respeta la reducción | **Tropo.** No |
| **Magic Card** | Luz que sigue al cursor por el borde y el interior; modo «orbe» | Fondo `padding-box` / `border-box` con `radial-gradient(… at x y)` vía `useMotionTemplate`; orbe borroso (`blur 60px`) con `useSpring`; colores `#9E7AFF → #FE8BBB` | Medio | Solo con ratón | **El patrón de la luz al cursor es adaptable** (lo mismo que el brillo de Glare); neón y orbe, tropo |
| **Animated Beam** | Haz que viaja entre dos nodos (diagrama de «integraciones») | Mide los nodos con `getBoundingClientRect` y `ResizeObserver`, traza un `<path>` y anima `x1/x2` de un `linearGradient`, en bucle | Medio, perpetuo | Decorativo | **Tropo** como diagrama. La idea de **un conector que se llena una sola vez** sí sirve |
| **Text Animate** | Texto por palabra, letra o línea con variantes (fadeIn, blurIn, slideUp…) | Parte el texto, escalona (`staggerChildren`), `whileInView`; `accessible=true` pone el texto completo en `sr-only` y `aria-hidden` en cada pedazo | Bajo a medio | **Buen patrón**: texto completo para el lector | **Ya lo tenemos** (titulares por línea). Lección: confirmar que nuestras líneas siguen ese patrón |
| **Word Rotate** | Una palabra cambia cada 2.5 s («construimos rápido / seguro / …») | `setInterval` y `AnimatePresence` (`y: −50 → 0 → 50`) | Bajo, perpetuo | Sin pausa ni reducción | **Tropo.** No |
| **Number Ticker** | Un número sube de 0 a su valor al verse | `useSpring(damping 60, stiffness 100)`; escribe `textContent` con `Intl.NumberFormat("en-US")` fijo | Bajo | Sin reducción; formato en inglés | **No** sin una cifra real que lo merezca. «41 títulos» contando desde 0 es un gesto gratuito |
| **Dock** | Barra estilo macOS que agranda el icono bajo el cursor | `useTransform` de la distancia al puntero y `useSpring(mass .1, stiffness 150, damping 12)` sobre **`width/height`** | Medio-alto: anima layout | Inútil con toque | **No.** Nuestra barra inferior es al modo iOS |
| **Globe** | Globo WebGL que gira, con marcadores | `cobe` (`createGlobe`) en `<canvas>`; arrastrar con `useSpring` | Alto (WebGL, bucle) | Decorativo | **No**: es una sola casa en Monterrey |
| **Particles** | Puntos flotantes que reaccionan al ratón | Canvas 2D, `requestAnimationFrame` continuo y posiciones aleatorias | Alto | Decorativo, perpetuo | **No** |
| **Ripple** | Ondas concéntricas que laten | 8 círculos (+70 px cada uno), `@keyframes ripple` de escala infinita, máscara de desvanecido | Bajo-medio, perpetuo | Sin reducción | **Tropo.** No |
| **Shimmer Button** | Botón con brillo que gira alrededor | `conic-gradient` girando (`spin-around`) y un barrido (`shimmer-slide`), infinitos | Medio, perpetuo | Distrae del contenido | **Tropo de CTA.** No |
| **Animated List** | Notificaciones que aparecen una por segundo | `setTimeout` de 1 s; resorte de escala 0 → 1; lo nuevo arriba | Bajo | Simula actividad | **No: inventa actividad** (PRODUCT.md) |
| **Bento Grid** | Rejilla de tarjetas de distintos tamaños con icono, título y texto | `grid` con `col-span`; en hover sube el texto 10 px y aparece el CTA (oculto en táctil en `lg`) | Bajo | El CTA solo aparece con hover | **Tropo** (Impeccable: «same-size cards of icon + heading + text») |
| **Safari / iPhone** | Marcos de navegador o teléfono en SVG | SVG con `<mask>` que perfora la pantalla para meter la imagen | Bajo | — | **No aplica** (no hay app que mostrar) |
| **Lens** | Lupa que sigue al cursor | Copia del contenido escalada ×1.3 bajo `mask-image: radial-gradient(circle at x y)`; `tabIndex=0`, `role="region"`, Esc | Medio: duplica el contenido | Solo con ratón (con toque, el pellizco ya hace zoom) | **Adaptable, baja prioridad**: portada en la ficha de escritorio |
| **Progressive Blur** | Desenfoque que crece hacia un borde | **8 capas** con `backdrop-filter` de 0.5 a 64 px, cada una con una máscara lineal en franja | **Alto** en el teléfono (8 muestreos del fondo) | — | **Adaptable** en versión barata (2 capas, solo escritorio) |

Otros componentes de Magic UI que no se pidieron, revisados de pasada:
- **Scroll Progress:** `scaleX` por `useScroll`. Hoy sale en CSS puro con `animation-timeline: scroll()`, pero una landing no necesita barra de progreso.
- **Highlighter:** subrayado a mano con `rough-notation`; añade una dependencia.
- **Noise Texture:** granulado con `feTurbulence`. Sobre fotos reales es un tropo.
- **Text Reveal:** palabras que se encienden con el scroll en un bloque *sticky* de 200 vh. Es el «Manifiesto» que el sitio ya retiró.
- **Aurora Text, Animated Gradient Text, Sparkles, Meteors, Retro Grid, Warp, Light Rays:** tropos.

---

## 3. Estilos visuales recurrentes

Lo recurrente en los dos catálogos (lo verificado son los colores por omisión de Magic UI; lo demás sale de los ports y las descripciones):

- **Fondos oscuros** (`slate-950`, negro) con **haces, conos y resplandores** (Lamp, Spotlight, Beams, Light Rays, Meteors).
- **Degradados neón** violeta, rosa y naranja (`#9E7AFF → #FE8BBB`, `#ffaa40 → #9c40ff`), **texto en degradado** (Aurora, Animated Gradient, Colourful Text) y **bordes luminosos** (Border Beam, Shine Border, Magic Card, Neon Gradient Card, Glowing Effect).
- **Patrones de fondo:** puntos, cuadrícula, hexágonos, cuadrícula retro y ruido o granulado.
- **Tarjetas Bento** y **mockups** de dispositivos.
- **Movimiento perpetuo:** marquesinas, rotaciones y pulsos.
- **Tipografía:** sans geométrica, titulares enormes y apretados, «pill» de anuncio con brillo («Introducing … →»).

**Matiz verificado en vivo (2026-11-14): sus propias portadas no son oscuras ni neón.**
- [ui.aceternity.com](https://ui.aceternity.com/) es **clara**: fondo blanco, titular de 48 px con peso 600 y tracking −1,2 px (−0,025 em) a interlínea 1. La columna derecha es una **pared de capturas** de bloques y plantillas en columnas (el mismo recurso que la portada de mapcn) y debajo, «Trusted by 120,000+».
- [magicui.design](https://magicui.design/) también es clara: Geist de 72 px, peso 600, tracking −3,6 px (−0,05 em), centrado, pastilla «Introducing Dither Field» y un resplandor arcoíris animado bajo los dos botones.
- El neón vive en los componentes que venden, no en su escaparate. Conclusión: para presentar, los dos autores eligen la sobriedad.
- **Movimiento en sus portadas, medido** con `document.getAnimations()` en Chromium: Magic UI mantiene **10 animaciones infinitas** (marquesina de casos, resplandor arcoíris y un punto que late) **también con movimiento reducido emulado**; Aceternity mantiene **7** (puntos animados con Motion) igual. Ninguna de las dos portadas respeta la preferencia; la de shadcn/ui no tiene ninguna animación infinita y la de Spline apaga sus 15.

**Choque con «Itinerante Líquido»:** casi todo.
- El sistema toma claro u oscuro del sistema operativo. Usa los colores del logo, fotos reales y portadas reales.
- El vidrio va **solo en lo que flota**, siempre con respaldo opaco.
- El movimiento es «respuesta, no decoración», y nada queda en bucle sin que la persona lo pida.
- Impeccable (`craft-floor.md`) lista como hábitos por rechazar el texto en degradado, el vidrio y el desenfoque como decoración, el halo de color sin desplazamiento y las tarjetas iguales de icono, título y texto. Pide además «one authored moment, not scattered effects».

**Encaja lo que viene de Apple:**
- El carrusel de tarjetas altas (Aceternity lo describe «as seen on apple.com»).
- La transición de elemento compartido al abrir.
- El brillo sutil al inclinar.
- Los bordes desvanecidos con máscara (el Carrusel3D ya lo usa).
- El desenfoque progresivo en el borde del scroll (el «scroll edge effect» de iOS 26).
- Los resortes cortos.

---

## 4. Encaje con nuestro sitio

### Lo que conviene portar (prioridad por valor y costo)

Todo se escribe en CSS y JS nativos, con tokens (`--dur-*`, `--curva-*` desde `motion.js`), sin estilos en línea en el HTML (por CSSOM sí). Todo queda inerte con `prefers-reduced-motion` o con «Pausar el movimiento».

1. **Transición portada → ficha (elemento compartido)**
   - **Idea:** Aceternity Expandable Card y Apple Cards Carousel, solo como inspiración.
   - **Dónde:** Catálogo. Al tocar la portada central del CarruselPortadas o una TarjetaLibro de la rejilla o de Novedades, la portada viaja hasta su sitio en la ficha.
   - **Cómo:**
     - Con View Transitions del mismo documento: se pone `view-transition-name: portada` por CSSOM en la portada tocada y luego `document.startViewTransition(() => openDialog(ficha))`. Al pintar la ficha, el nombre pasa a su imagen.
     - Los `::view-transition-group(portada)` usan `--dur-base` y `--curva-salida`; el resto, un fundido corto.
     - Sin soporte, o con movimiento reducido, se llama a `openDialog` como hoy. Al cerrar, la vuelta inversa.
   - **Coste:** 1–2 días.
   - **Riesgo de INP:** medio. La captura de la instantánea entra en el primer fotograma y puede chocar con el `defer` de `sheets.js`. Hay que medir con `tools/qa/inp.mjs` a CPU 4× y descartarlo si pasa de 200 ms. Hay que verificar cómo se comporta con `<dialog>` en la capa superior (top layer) en Safari.
   - **Riesgo de LCP:** ninguno.
   - **Soporte:** Chrome 111+ y Safari 18+. Firefox, según lo que sé, desde la 144 (**sin verificar en esta sesión**; sigue sin verificar el 2026-11-14 porque MDN y caniuse no están en la red permitida).
   - **Matiz de la verificación en vivo:** en Apple Cards Carousel el elemento compartido es opcional (la demo abre con fundido) y en Expandable Card la transición corre igual con movimiento reducido. La propuesta ya pedía apagarla sin movimiento; las demos confirman que hay que hacerlo a mano.

2. **Enfoque por posición en la tira de La casa**
   - **Idea:** Focus Cards, con el hover cambiado por la posición; inspiración.
   - **Dónde:** `#casa`, `.house-track`.
   - **Cómo:**
     - CSS puro con `animation-timeline: view(inline)` en cada foto y `@keyframes` de `scale(.94) → 1 → .94` y `opacity(.72) → 1 → .72` (o `filter: saturate`), en un `animation-range` centrado.
     - Todo dentro de `@supports (animation-timeline: view())`, con `@media (prefers-reduced-motion: no-preference)` y sin `html[data-pausa]`. Sin soporte queda plano, como hoy.
   - **Coste:** medio día.
   - **Riesgo:** casi nulo; corre en el compositor y no toca el hilo principal.
   - **Soporte:** Chrome 115+, Safari 26.0 y Firefox 159 ([WebKit, Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/); [web.dev, octubre de 2026](https://web.dev/blog/web-platform-10-2026)).

3. **Brillo de lámina en la portada que se inclina**
   - **Idea:** el destello de Glare Card y la luz al cursor de Magic Card (MIT); sin foil ni neón.
   - **Dónde:** la pieza central del Carrusel3D y la TarjetaLibro en hover, solo con puntero fino.
   - **Cómo:**
     - Un `::after` sobre la portada con `radial-gradient(circle at var(--brillo-x) var(--brillo-y), rgb(255 255 255 / .14), transparent 60%)`.
     - Las variables se escriben por CSSOM en el mismo fotograma en que `initDepth()` y `tiltPose()` de `carousel3d.js` ya calculan el giro.
     - `@property --brillo-x` (tipo `<percentage>`) para que la luz vuelva con `--dur-rapida` al salir; `contain: paint`.
   - **Coste:** medio día.
   - **Riesgo de INP:** bajo; no añade escuchas.
   - **Movimiento reducido:** sin brillo (la inclinación ya se apaga).
   - **Afinado tras la verificación en vivo (Glare Card):** al entrar el cursor, el original transiciona 300 ms hacia la primera pose y después sigue al cursor sin transición; así no salta al entrar ni se retrasa al seguirlo. En `style.css`, `.motion [data-inclina].is-inclinada` quita la transición de `transform` desde el primer cuadro, así que conviene **comprobar si la portada salta al entrar**. Si salta, el arreglo es retirar la transición un instante después de entrar (con la duración de `motion.js`), no tenerla siempre. Su brillo pasa a opacidad 0,6 en hover; el blanco al 0,14 que propone este informe es más discreto, y encaja mejor con «la profundidad orienta, no adorna».

4. **Despliegue escalonado de la rejilla**
   - **Idea:** el escalonado de Blur Fade y Text Animate (MIT).
   - **Dónde:** Catálogo en línea, al pulsar «Ver los 41 títulos» (y en las Novedades con «Ver todo»).
   - **Cómo:**
     - Web Animations API solo en las tarjetas que se acaban de mostrar **y** caen en la vista: `opacity 0 → 1` y `translate 0 8px → 0`, con `--dur-rapida` y `--curva-salida`.
     - Escalón de 20–30 ms por tarjeta, con tope de unas 8 (el resto aparece colocado). **Sin `filter: blur`**: 41 portadas desenfocadas repintan demasiado.
     - El foco se queda en el botón, como hoy.
   - **Coste:** 2–3 horas.
   - **Riesgo de INP:** bajo si la animación arranca en el fotograma siguiente al cambio de estado.
   - **Movimiento reducido:** sin animación.

5. **El conector del recorrido se llena una sola vez**
   - **Idea:** Animated Beam (MIT), pero de un solo disparo y no en bucle.
   - **Dónde:** Catálogo, fila de chips. Cuando una parada pasa a «hojeada», el conector de 2 px hacia ella pasa de `linea-fuerte` a `primario` creciendo con `transform: scaleX(0 → 1)` (`transform-origin` del lado de la parada anterior).
   - **Cómo:** WAAPI con `--dur-base` y `--curva-salida`; enseguida, la palomita con el `pickPop()` que ya existe.
   - **Coste:** 1–2 horas.
   - **Riesgo:** nulo.
   - **Movimiento reducido:** el color cambia al instante.
   - **Verdad:** el progreso es real («N de 3 paradas hojeadas»), así que respeta PRODUCT.md.

6. **Desenfoque progresivo bajo la barra de navegación (versión barata)**
   - **Idea:** Progressive Blur (MIT) y el «scroll edge effect» de iOS.
   - **Dónde:** `.hdr`, solo desde 761 px.
   - **Cómo:**
     - Una franja de 16–24 px bajo la barra con **2 capas** (no 8): `backdrop-filter: blur(2px)` y `blur(6px)`, cada una con su `mask-image: linear-gradient(...)`.
     - Se omite con `data-glass="lite"`, sin `backdrop-filter`, con `prefers-reduced-transparency` o con `prefers-contrast: more`, como el resto del vidrio.
   - **Coste:** 2–3 horas.
   - **Riesgo:** desplazamiento en GPU modesta. Medir con `inp.mjs` y con el panel de rendimiento; descartar en el teléfono.
   - **Movimiento reducido:** no le afecta (es estático), pero obedece a la transparencia reducida.

7. **Lupa sobre la portada de la ficha (opcional)**
   - **Idea:** Lens (MIT).
   - **Dónde:** la ficha en escritorio, solo con puntero fino y hover.
   - **Cómo:**
     - Una copia `aria-hidden` de la misma `<img>` (las portadas miden hasta 600 px, así que ×1.3–1.5 se ve nítido a unos 300 px), con `mask-image: radial-gradient(circle 80px at var(--x) var(--y), #000 99%, transparent)`.
     - Las variables se escriben por CSSOM en `pointermove` con `requestAnimationFrame`.
   - **Coste:** medio día.
   - **Riesgo de INP:** bajo.
   - **Movimiento reducido:** la lupa aparece y desaparece sin escala.
   - **Valor:** discreto. Solo si Aldo quiere que se lea la portada.

8. **Cifra que cambia con su filtro (opcional, solo cifras reales)**
   - **Idea:** Number Ticker (MIT), sin contar desde 0.
   - **Dónde:** el estado «N títulos» del Catálogo cuando cambia un filtro de Género o Editorial (no al teclear).
   - **Cómo:** fundido y desplazamiento de 4 px del número viejo al nuevo con `--dur-instantanea`; formato `es-MX`, no el `en-US` fijo del original.
   - **Coste:** 1 hora.
   - **Riesgo:** nulo.
   - **Movimiento reducido:** el número cambia sin animación.

**Revisión que conviene hacer, sin animación nueva:** el patrón de Text Animate deja el texto completo en `sr-only` y pone `aria-hidden` en los pedazos animados. Hay que confirmar que las líneas de nuestros titulares (en `app.js`) dejan al lector el texto entero una sola vez. No se verificó en esta investigación.

### Lo que NO conviene (y por qué)

- **Hero Parallax, Parallax Scroll, Text Reveal y Sticky Scroll largos:** atan la lectura al scroll, añaden cientos de vh, pesan en imágenes (LCP) y son vestibulares. El sitio ya retiró la entrada en canvas y el Manifiesto por eso.
- **Lamp, Spotlight, Background Beams, Light Rays, Meteors, Ripple, Particles, Globe:** son la piel oscura y neón de las plantillas de SaaS. Contradicen las fotos reales y el claro u oscuro automático. Su bucle perpetuo choca con «nada en movimiento sin que la persona lo pida» (WCAG 2.2.2). Particles y Globe además consumen batería (canvas y WebGL).
- **Border Beam, Shine Border, Shimmer Button, Magic Card con neón, texto en degradado:** tropos que Impeccable rechaza (texto en degradado, halos y bordes luminosos decorativos). Además, «un solo primario por vista» no necesita brillo.
- **Marquee y Word Rotate:** movimiento infinito sin pausa. En Magic UI las copias del Marquee no llevan `aria-hidden`. El sitio ya retiró su marquesina «por decoración».
- **Text Generate Effect y Blur-in por palabra:** retrasan la lectura y evocan la salida de un chatbot; ya tenemos la entrada por línea.
- **Animated List y Number Ticker con cifras de adorno:** simulan actividad o métricas. PRODUCT.md prohíbe cifras, reseñas, contadores o rankings sin fuente.
- **Timeline:** no hay fechas ni historia verificada que la llenen; inventarlas viola PRODUCT.md. Puede volver si la librería da fechas reales de Eventos.
- **Images Slider con autoplay:** el sistema prohíbe el autoplay en carruseles.
- **Dock:** anima `width` y `height` (layout) y no sirve con toque; nuestra barra inferior es al modo iOS.
- **Bento Grid, mockups de Safari o iPhone, Wobble Card, Glare foil arcoíris:** andamiaje de landing de producto digital; aquí no hay app ni «features» que mostrar.
- **Instalar cualquiera de las dos librerías:** exigen React, Tailwind y Motion en runtime y estilos generados en build. Rompe «sin dependencias externas en runtime» y obliga a revisar la CSP. **El código de Aceternity no tiene licencia abierta verificable**: solo se toma la idea.

---

## Fuentes

- Repositorio de Magic UI (MIT; código leído localmente): https://github.com/magicuidesign/magicui. Archivos: `LICENSE.md`, `registry.json`, `apps/www/package.json`, `apps/www/styles/globals.css`, `apps/www/registry/magicui/*.tsx`, `apps/www/content/docs/{index,installation/index}.mdx`, `apps/www/config/docs.ts`
- Inspira UI (MIT, port a Vue con créditos a Aceternity): https://github.com/unovue/inspira-ui. Archivos: `app/components/inspira/ui/{apple-card-carousel,card-3d,glare-card,lamp-effect,text-generate-effect,timeline,images-slider}/*.vue` y `content/en/**`
- Aceternity, licencia de Pro: https://ui.aceternity.com/licence · https://marketplace.aceternity.com/licence
- Aceternity, `llms-full.txt` (uso gratis personal y comercial): https://ui.aceternity.com/llms-full.txt
- Aceternity, instalación y CLI: https://ui.aceternity.com/installation · https://ui.aceternity.com/components/cli
- Aceternity, páginas de componentes: https://ui.aceternity.com/components/apple-cards-carousel · /focus-cards · /hero-parallax · /background-beams · /spotlight · /sticky-scroll-reveal · /expandable-card · /layout-grid · /wobble-card · /timeline · /lamp-effect · /glare-card (todas con prefijo https://ui.aceternity.com/components/)
- Aceternity Pro: https://ui.aceternity.com/pro · https://pro.aceternity.com/changelog · precios según terceros: https://toolradar.com/tools/aceternity-ui/pricing
- Comparativas que discuten la licencia de Aceternity: https://webberui.com/guides/animated-react-component-libraries · https://ui.watermelon.sh/compare/aceternity-ui-vs-magic-ui · https://www.shadcn.io/awesome/item/aceternity-ui
- Magic UI Pro: https://pro.magicui.design/pricing · https://pro.magicui.design/license · Tailwind v3: https://v3.magicui.design/docs/tailwind-v4
- Soporte de las animaciones ligadas al scroll: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ · https://web.dev/blog/web-platform-10-2026
- Repositorio del sitio: `DESIGN.md` (Itinerante Líquido, Movimiento), `PRODUCT.md`, `.claude/skills/ux-apple/SKILL.md`, `.claude/skills/impeccable/reference/{craft-floor,polish}.md`, `tools/preview-site.mjs` (CSP: `style-src 'self'`, `script-src 'self'`)

## Resumen (de más a menos valor por costo)

1. **Enfoque por posición en la tira de La casa** con `animation-timeline: view(inline)`: CSS puro, medio día, riesgo casi nulo. Idea de Focus Cards.
2. **El conector del recorrido se llena una vez** al hojear una parada: WAAPI, 1–2 h, progreso real. Idea de Animated Beam (MIT).
3. **Despliegue escalonado** al pulsar «Ver los 41 títulos»: WAAPI, 2–3 h, sin blur. Idea de Blur Fade (MIT).
4. **Brillo de lámina** sobre la portada que ya se inclina: `::after`, `@property` y CSSOM, medio día. Idea de Glare y Magic Card.
5. **Transición portada → ficha** con View Transitions: el mayor valor de «oficio», pero 1–2 días y riesgo de INP medio; medir antes de aprobar. Idea de Expandable Card.
6. Opcionales: **desenfoque progresivo** de 2 capas bajo la barra (solo escritorio), **lupa** en la ficha y **cifra real** que cambia con el filtro.
7. **No:** haces, lámparas, spotlights, bordes luminosos, shimmer, marquee, rotación de palabras, texto que se «genera», partículas, globo, bento, mockups, Hero Parallax, Timeline sin datos, listas que simulan actividad.
8. **Licencias:** Magic UI es MIT (verificado), se puede reescribir. Aceternity no tiene licencia abierta verificable (gratis para uso, Pro sin redistribución): solo inspiración. Ninguno se instala, porque exigen React, Tailwind y Motion.
9. **Acceso:** `ui.aceternity.com`, `magicui.design` y `21st.dev` no resuelven en esta sesión. Aceternity se verificó por su port MIT (Inspira UI) y por extractos del buscador. *(Actualizado el 2026-11-14: ya se abrieron en vivo; ver abajo.)*

---

## Verificación en vivo (2026-11-14)

**Qué se abrió:** `ui.aceternity.com` (portada, precios, licencia, términos, `llms-full.txt`, `api/components`, los cinco componentes en Chromium y su código en el registro público) y `magicui.design` (portada en Chromium, `llms.txt`, `docs`). Capturas en el scratchpad de la sesión (`investigacion-ui/vivo/ace-*.png`, `magicui-home.png`). **No se pudo abrir:** `pro.magicui.design` (fuera de la red) ni las imágenes de las demos (`assets.aceternity.com`).

**Correcciones:**

1. **Licencia de Aceternity, ya precisa:** los componentes gratis se pueden usar en proyectos comerciales, pero su «licencia completa» es la Aceternity License, que prohíbe redistribuir el ítem o sus fuentes aunque se modifiquen, y los términos del sitio reservan todos los derechos. No hay licencia abierta. El veredicto «solo inspiración» queda **confirmado y más firme**.
2. **Precios de Aceternity: confirmados.** 169 USD (un año), 199 (de por vida) y 1,590 (equipo de 10), pago único. Los conteos del catálogo de pago siguen sin coincidir entre páginas del propio sitio.
3. **Pila de Aceternity:** pide React 18+ y Tailwind v3 o v4, no React 19 y solo v4.
4. **Apple Cards Carousel:** el elemento compartido es **opcional**; la demo abre con fundido. Sin diálogo accesible ni manejo del foco (ahora verificado en el original, no solo en el port).
5. **Focus Cards:** el desenfoque real es de **8 px** (Tailwind v4), el doble de lo que sugería `blur-sm`. Refuerza «atenuar, no desenfocar» (enfoque por posición, § 4, punto 2).
6. **Expandable Card:** transición FLIP de unos 470 ms que **ignora el movimiento reducido**; filas sin teclado y sin `role="dialog"`.
7. **Glare Card:** tope de giro medido (≈ ±5,7° / ±10°) y el truco de entrada (300 ms y luego 0 s). Se añade como afinado de la propuesta del brillo de lámina (§ 4, punto 3).
8. **Magic UI:** la portada dice «150+» componentes, pero `llms.txt` enlaza 79; la cifra útil es la del catálogo. Los precios de Pro siguen sin verificar.
9. **Las portadas de los dos sitios son claras y sobrias**, no oscuras y neón; pero sus animaciones infinitas (10 en Magic UI, 7 en Aceternity) **siguen corriendo con movimiento reducido**.

**Técnicas de estas portadas aplicables a Itinerante:**

- **Escaparate con imágenes, no con el componente vivo pesado.** Aceternity, como mapcn, enseña bloques y plantillas como capturas en columnas. Para nosotros confirma la propuesta del mapa de Visita en SVG o imagen, no en WebGL.
- **El truco de entrada de Glare Card** para la inclinación (§ 4, punto 3).
- **Una prueba de movimiento perpetuo.** Contar en Chromium las animaciones con `iterations === Infinity` bajo `reducedMotion: 'reduce'` atrapa justo lo que fallan estas dos portadas. Cabe en `tools/qa/motion.mjs`, que ya recorre `document.getAnimations()`.
- **No aplicable:** el resplandor arcoíris bajo los botones de Magic UI y los «Trusted by 120,000+» con estrellas. Son brillo decorativo y cifras de prueba social que PRODUCT.md no permite sin fuente.

**¿Cambia alguna recomendación?** No. El orden del resumen se mantiene. Dos ajustes de detalle: el brillo de lámina gana el truco de entrada, y la transición portada → ficha gana la advertencia de que ni el diálogo accesible ni el movimiento reducido vienen del original.

# REA de Jitter, Lottielab, Pryzm y Magic UI (2026-11-15)

Pedido de Aldo: «podemos mejorar nuestro sitio si hacemos REA de los componentes y documentación de esto: jitter.video · lottielab.com · pryzm.design · magicui.design».

Este informe desmonta los cuatro sitios con medidas reales y dice qué conviene llevar a Librería Itinerante y qué no. No se tocó el repositorio. No se copió código ni animaciones de nadie: se sacaron técnicas, medidas y patrones.

## 1. Veredicto

Ninguno de los cuatro se instala. Tres son herramientas para **fabricar** archivos (Jitter y Lottielab hacen animaciones; Pryzm hace fondos) y el cuarto es una biblioteca de React. Lo que sirve al sitio son técnicas que se reescriben en HTML, CSS y JavaScript nativos.

- **El formato Lottie no conviene hoy.** El reproductor más ligero que funciona con nuestra CSP pesa 46.5 KB gzip. Eso es entre 80 y 100 % de todo el JavaScript del sitio, para animar iconos que en SVG + CSS pesan 0.3 KB y ya respetan «Pausar el movimiento».
- **dotLottie queda descartado.** Necesita WebAssembly: 523 KB gzip y relajar la CSP con `'wasm-unsafe-eval'`. Lo comprobé en Chromium con la CSP del sitio.
- **Lo que sí conviene** son seis cosas baratas (sección 8): cuatro microanimaciones en SVG + CSS, un desvanecido de borde en las hojas con scroll, y mejorar la documentación de componentes al modo de Magic UI.
- **Jitter le sirve a Aldo fuera del sitio**: para piezas de Instagram (fechas de talleres, llegadas). Sus plantillas son de uso comercial sin atribución.
- **Pryzm no encaja**: fabrica fondos de degradado, vidrio y grano. El sitio usa fotos reales de la casa y fondos planos.

## 2. Cómo se hizo y qué faltó

**Método.** `curl` y Chromium con Playwright en iPhone 16 (393×659) y 1440×900, `deviceScaleFactor` 1. Tres mediciones de cada portada (escritorio, iPhone, iPhone con movimiento reducido), de dos a tres sondas más por sitio, y unas pocas páginas de precios, términos y documentación. Los reproductores de Lottie se bajaron de npm y se midieron (minificado y gzip −9). Luego se probaron en un servidor local con la CSP exacta de `tools/preview-site.mjs` y CPU 4×.

**Dominios que faltaron** (la red los rechazó; no se evadieron):

| Dominio | Qué impidió ver |
|---|---|
| `assets.jitter.video` | Los 20 videos de la portada de Jitter y las vistas previas de plantillas (se ven cajas grises) |
| `static.intercomassets.com`, `downloads.intercomcdn.com`, `intercom.help` | Estilos e imágenes del centro de ayuda de Jitter (se leyó el texto; no se pudo medir el diseño) |
| `static-2v.gitbook.com`, `*-files.gitbook.io` | Estilos e imágenes de la documentación de Lottielab (igual: texto sí, medidas no) |
| `cdn.lottielab.com`, `api.lottielab.com` | Demos de Livelink y el reproductor alojado de Lottielab |
| `qbbeqzzqoylaziguwfjx.supabase.co` | Imágenes de la galería de Pryzm (22 fallos) |
| `pbs.twimg.com`, `video.twimg.com`, `picsum.photos` | Testimonios y fotos de demo de Magic UI |
| `pro.magicui.design` | Magic UI Pro (sigue sin verse) |
| `api.github.com` para `magicuidesign/magicui` | La API; el historial se leyó con un clon superficial por git |

**Otros límites.**

- `jitter.video/robots.txt` prohíbe `/terms` y `/privacy` a los robots. No se abrieron. La licencia sale de su centro de ayuda («Templates, ownership, and licensing»).
- No se inició sesión en ningún sitio. Los editores (Jitter, Lottielab, el estudio de Pryzm) no se abrieron: lo que se dice de exportar viene de su documentación, no de una exportación propia.
- El módulo de la animación del inicio de Jitter no cargó en Chromium: su URL lleva `@` y entra en un bucle de redirecciones 307 a `%40`. Con `curl` baja bien, así que parece cosa del proxy de la sesión y no del sitio. El archivo se midió con `curl`.
- Chromium sin GPU: las cifras de fotogramas de la sección 6 son indicativas.

## 3. Jitter (jitter.video)

### Qué es

Herramienta de motion design en el navegador («A fast and simple motion design tool on the web»). Importa de Figma, anima con preajustes o fotogramas clave, tiene agentes de IA, y exporta a video, GIF y Lottie. Ofrece más de 300 plantillas gratuitas (la portada dice 400+, la página de Lottie dice 100+) en 16 categorías: Jitter AI, Devices, Logos, Social media, Video titles, Ads, Branding, Websites, UI elements, Charts, Icons, Buttons, Text, Backgrounds, Showreels, Community.

### Planes y licencia

| Plan | Precio (USD por editor al mes, cobro anual) | Exporta |
|---|---|---|
| Free | 0 | GIF, MP4 y Lottie a 720p y 30 fps; 3 archivos; **con marca de agua** |
| Pro | 15 | Sin marca de agua, 1080p y 60 fps, WebM y ProRes |
| Max | 35 | 4K y 120 fps, **fondo transparente**, cuadro por cuadro, por lotes |
| Ultra | 59 | Lo de Max con más créditos de IA |

- El pago mensual es más caro: la página de precios dice «Save 15%» al pagar anual y la ayuda dice «over 20%». No hay pago único.
- **Plantillas:** «free to remix, transform, and build upon for any purpose, even commercially… No attribution is required». Las de creadores de la comunidad pueden traer su propia licencia.
- **Lo que haces es tuyo:** «you retain all rights and ownership of your User Content».
- **Sin verificar:** si la marca de agua del plan gratis también va en el Lottie exportado o solo en video y GIF. La ayuda dice «remove the Jitter watermark from your exports» sin distinguir formato.

### Su portada, medida

Pila: React con Vite, GSAP con ScrollTrigger y SplitText, `lottie-web`, CSS Modules. La hoja de estilos es compartida con la app: 2.6 MB (292 KB gzip).

| Medida | 1440×900 | iPhone 16 (393×659) |
|---|---|---|
| Alto de la página | 16 269 px | 18 390 px |
| Cabecera | Fija, transparente; logo en y 66; enlaces Inter 16/600; «Sign up» 125×52 | Logo 68×24, «Log in», menú 52×52 |
| Cabecera al desplazar | Se reduce a «Sign up» + menú redondo de 52 | Solo el menú de 52 |
| Contenedor | 860 px centrado (x 290–1150) | Márgenes de 20 px |
| Titular h1 | 80/72, TWK Lausanne 800, −2.4 px; y 255–399 | No medido (oculto hasta que llega la animación) |
| h2 | 72/68.4, peso 800, −3.2 px, centrado | 40/40, −1.6 px |
| Texto | Inter 16/24 (−0.32 px); interfaz 18/27 peso 600 | Igual |
| Botones | Píldora de 52–57 de alto, radio 50, relleno 8/50, 18/600 | Igual |
| Sección → sección | 200 px | 140 px |
| Pie | Negro, 2 158 px, «Try Jitter today» a 80/76, 41 enlaces | 2 836 px |

Secciones en orden (1440): inicio con la animación (0–697) → cinta de plantillas (897) → párrafo que se enciende con el scroll (1643) → video del producto (2103) → «From idea to motion in seconds» con tres tarjetas pegajosas (2839, 2 375 px) → «Supercharge your creativity» (5415) → cita (7820) → «Where teams scale motion» (8372) → cita (9941) → colaboración (10565) → plantillas (11679) → clientes (13100) → pie (14111).

### Animaciones: cómo están hechas

| Efecto | Técnica | Duración y curva | ¿Movimiento reducido? |
|---|---|---|---|
| Animación del inicio | `lottie-web` completo, renderizador SVG, `loop: true`, datos en un módulo JS; pausa fuera de la vista con IntersectionObserver | 139 cuadros a 60 fps (2.3 s) en bucle | No lo consulta |
| Párrafo que se enciende | GSAP SplitText + ScrollTrigger con `scrub` (ligado al scroll) | `duration .25`, `stagger 1` | No |
| Tarjetas apiladas | Solo CSS: `position: sticky` con `top` de 185, 210 y 235 px (25 px de escalón), 460×580, radio 40 | — | — |
| Cinta de logos | `@keyframes` con `translate(-100%)` | 90 s lineal, infinito | No |
| Videos | 20 `<video autoplay loop muted preload="metadata">` sin póster | Bucle | Conservan `autoplay` |
| Botones | `transform` con una curva `linear()` de resorte que rebasa hasta 1.52 | 0.3 s | No |
| Enlaces de la cabecera | `transform` | 0.8 s, `cubic-bezier(.33,1.42,.05,.96)` | No |

**Peso de su propia animación de inicio:** reproductor 307 KB (76.8 KB gzip) + datos 203 KB (93.4 KB gzip, con 8 PNG incrustados en base64) = **170 KB gzip para una sola animación**.

**Tres hallazgos útiles:**

1. **El titular depende de la animación.** El `h1` está en el HTML con opacidad 0.00001 hasta que la animación avisa que está lista. En nuestra sesión el módulo no cargó y la primera vista quedó en blanco: solo la cabecera (captura `shots/jitter/jitter-desk-00-first.png`). Es el riesgo de atar el titular a un reproductor.
2. **Tienen un respaldo para equipos lentos.** La clase `.low-performance-device` sustituye la animación por cuatro `@keyframes` de CSS (escala y fundido, 0.4–0.8 s). Es la misma idea que nuestro `data-glass="lite"`.
3. **La portada no respeta el movimiento reducido.** La hoja tiene 34 bloques `prefers-reduced-motion`, pero todos son de la app; ninguno toca un componente de la portada. Con movimiento reducido emulado, las transiciones y los `autoplay` quedan iguales.

Una técnica de su app sí es aprovechable (sección 8, propuesta 5): el desvanecido de borde de un panel con scroll, solo CSS, con `animation-timeline: scroll(self)` y `animation-range: 0 24px, calc(100% - 24px) 100%` sobre una máscara.

## 4. Lottielab (lottielab.com)

### Qué es

Editor en el navegador para crear y editar animaciones Lottie («The motion design tool for product teams»). Importa de Figma, SVG y After Effects. Tiene modo de diseño y de animación, curvas con preajustes (Linear, Natural, Slow down, Accelerate, Bounce in/out), recorte de trazos, trayectorias de movimiento e **interactividad** (beta): estados que son tramos de la línea de tiempo, e interacciones (clic, hover, «al terminar», «tras una espera») que cambian de estado. Hospeda las animaciones en su CDN («Livelink») y ofrece conversores gratis: Lottie a dotLottie, GIF, MP4 y WebM; SVG a Lottie; optimizador.

### Planes y licencia

| Plan | Precio | Exporta |
|---|---|---|
| Free | 0 | **Solo GIF y MP4.** Archivos ilimitados, importar de Figma |
| Pro | 18 USD por editor al mes (cobro mensual) | **Lottie JSON**, video HD y 4K, optimización, alojamiento en su CDN |
| Enterprise | A consultar | Soporte y cumplimiento |

- **Para sacar un archivo Lottie hay que pagar Pro.** La descripción de la página dice «Upgrade to remove watermarks».
- Términos (23 abr 2024): conservas la propiedad de lo que subes y les das una licencia para usarlo. El material del sitio se concede para «personal, non-commercial transitory use»; los términos no dicen nada específico de las plantillas, así que su uso comercial queda **sin verificar**.
- Las plantillas de iconos son de terceros (Popicons, Central icons), cada una con su licencia.
- La interactividad solo funciona completa con su reproductor (`@lottielab/lottie-player`, MIT) y solo en web.

### Su portada, medida

Pila: Next.js en Heroku, Tailwind, `lottie-web` con renderizador SVG, `react-fast-marquee`, fuentes de Google Fonts.

| Medida | 1440×900 | iPhone 16 |
|---|---|---|
| Alto de la página | 8 311 px | 7 731 px |
| Cabecera | Fija, blanca, 64 px | 64 px |
| Titular h1 | 60/60, Plus Jakarta Sans 600, −1.5 px, centrado; y 256–376 | 48/64, a la izquierda, 4 renglones; y 128–384 |
| Entradilla | 18/28 gris; y 408 | y 416–472 |
| Acción | 206×46, radio 12, #7270ff, 18 px; y 468 | 329×46 a todo el ancho; y 504–550 |
| Titular → texto → botón | 32 px y 32 px | 32 px y 32 px |
| Contenedor | 1400 px máximo con 96 de relleno | Márgenes de 32 |
| Sección → sección | 192 px de margen; bandas con 96 de relleno | 96 px |
| h2 | 36/40 y 48/64 | 36/40 y 24/32 |
| Pie | Gris claro, 967 px, 34 enlaces en 5 columnas | — |

Secciones (1440): inicio → logos de clientes (610) → maqueta del editor en banda gris con cinco animaciones (771) → «Design to Motion» y «Animate with ease» (1484) → banda oscura «Share, review, and ship» (2665) → «All you need» (3777) → plantillas (4861) → testimonios en cinta (5769) → cierre (6577) → pie (7344).

### Animaciones

- **15 animaciones Lottie** en la portada, todas con `lottie-web` en SVG. Pesan **3.17 MB sin comprimir y 378 KB gzip** en total. La más pesada, 1.25 MB (59 KB gzip); una con dos imágenes incrustadas, 162 KB gzip.
- Las dos del logo son el dato útil: **10 y 19 KB sin comprimir, 1.7 y 1.6 KB gzip** (50×50 y 80×80, 3.1 s).
- Además baja `canvaskit.wasm` (Skia), 3.28 MB.
- Cinta de testimonios: `@keyframes scroll`, 32 s lineal, infinita.
- **Movimiento reducido: no existe.** Cero reglas `prefers-reduced-motion` en su CSS, y con movimiento reducido emulado las animaciones siguen corriendo.
- No pausan fuera de la vista. En iPhone con CPU 4×, donde hay animaciones a la vista medí 18–24 fotogramas por segundo y de 11 a 18 tareas largas en 3 s; lejos de ellas, 45–57. Cifra indicativa (Chromium sin GPU).

## 5. Pryzm (pryzm.design)

### Qué es (con evidencia)

No es un sistema de diseño ni una biblioteca de componentes. Es un **estudio en el navegador para generar fondos y texturas**: «Pryzm is a visual studio for designers. Create original backgrounds and textures for your websites, templates, and designs in seconds». Lo hizo una sola persona, Ava Thiery, que vende plantillas de Framer (página «About»).

Se compone un fondo con tres capas (degradado, imagen, patrón) y una pila de efectos: Light, Optics, Waves, Blobs, Glass distortion, Pixelate, Dither, Halftone, Plaid, ASCII y Grain. Todo se pinta con WebGL en el navegador. Tiene tres modos (Studio, Lab y Flow, un lienzo de nodos) y una galería de «looks» que se remezclan.

### Planes y licencia

| Plan | Precio | Exporta |
|---|---|---|
| Free | 0 | PNG a 480 px de base sin marca de agua; video a 480 px **con marca de agua**, 30 fps y 6 s; guarda 9 looks |
| Pro | 9 USD al mes (anual con 3 meses gratis) | PNG y video hasta 4K sin marca, bucles de 3 a 12 s, **exportar como código** (React, HTML, Framer) |

- Exportar pide cuenta. Video en MP4 (H.264), WebM (VP9) y AV1.
- Términos (ago 2026): lo exportado es tuyo para proyectos personales y comerciales, sin atribución. No se puede revender como recurso de stock, ni vender el código exportado solo, ni usarlo para hacer un generador rival.
- El «código exportado» es un componente que pinta el fondo en un `<canvas>` con WebGL y lo anima todo el tiempo (props `speed`, `paused`, `fps`).

### Su portada, medida

Pila: Next.js en Vercel, Tailwind, fuentes Poppins (titulares), Inter (texto) y Geist Mono (etiquetas).

| Medida | 1440×900 | iPhone 16 |
|---|---|---|
| Alto de la página | 9 360 px | 8 577 px |
| Cabecera | Fija, transparente, 64 px; botones de 24 de alto | Igual |
| Inicio | Ocupa la pantalla; mosaico de 48 imágenes; texto abajo | Igual, 5 imágenes |
| Titular h1 | 48/50.4, Poppins 600, −0.96 px; abajo a la izquierda, y 735–836 | 30/31.5; y 404–467 |
| Entradilla y acciones | A la derecha; botones 112×32 y 128×32 en y 804 | Entradilla y 495–543; botones en y 563–595 |
| Botones | **32 de alto**, radio 8, 12 px peso 500 | Igual: por debajo de los 44 de Apple |
| Contenedor | 1152 px con 24 de relleno (contenido de 1102) | Márgenes de 16 |
| Sección → sección | 112 px arriba y abajo | 80 px |
| h2 | 36/40 y 30/36, −0.02 em | 30/36 y 36/40 |
| Texto | Inter 14/22.75 | Igual |
| Pie | Pegado al fondo (`sticky bottom-0`): el contenido lo descubre al final | Igual |

Dos coincidencias con Itinerante: el contenedor de 1152 px y los 112 px de sección en escritorio.

Secciones: inicio → video del estudio (900) → Flow (1713) → galería para remezclar (3081) → «Ship it as code» con un fondo vivo (3963) → precios (5159) → preguntas (6214) → boletín (7337) → cierre (8390).

### Animaciones

| Efecto | Técnica | ¿Movimiento reducido? |
|---|---|---|
| Video del estudio | `<video muted loop playsinline preload="none">` con póster; WebM de 1.51 MB (16.5 s, 1601×900); **sin `autoplay`**: lo arranca JavaScript al verse | **Sí**: con movimiento reducido queda en pausa (medido) |
| Líneas del diagrama Flow | `@keyframes flow-edge-dash`, 700 ms lineal, infinito, 3 trazos SVG | Sin regla propia |
| Fondo vivo de «Embed» | `<canvas>` WebGL2 de 1102×826, solo en escritorio | Sin verificar |
| Mosaico del inicio | Estático; se desplaza más lento que la página | — |
| Botones | Transición de 0.15 s, `cubic-bezier(.4,0,.2,1)` | `motion-reduce:transition-none` |

El patrón del video es el mejor de los cuatro sitios: no pesa en la carga (`preload="none"` y póster de 92 KB), solo corre cuando se ve y se detiene con movimiento reducido.

## 6. Magic UI (magicui.design): lo nuevo

El estudio previo (`docs/ux/investigacion-2026-11/aceternity-magicui.md`) sigue vigente. Aquí va lo que faltaba.

### Novedades desde el 2026-11-13

**Ningún componente nuevo.** El catálogo sigue en 79 (`llms.txt` y la carpeta de documentación coinciden). El historial de git desde el 13 de noviembre trae un cambio a Tweet Card (prop `logo`), una guía de MCP y dependencias (Next 16, fumadocs 16). «Dither Field», que la portada anuncia, es del 2 de noviembre y ya estaba contado.

### Su portada, medida

| Medida | 1440×900 | iPhone 16 |
|---|---|---|
| Alto de la página | 3 733 px | 4 016 px |
| Aviso superior + cabecera | 48 + 56 (pegajosa) | 60 + 56 |
| Pastilla de novedad | 248×32 en y 240 | y 176 |
| Titular h1 | 72/72, Geist 600, −3.6 px (−0.05 em), centrado; y 296–456 | 48/48, −2.4 px, **a la izquierda**; y 232–396 |
| Entradilla | 18/28, máximo 576 px; y 480 | 16/24; y 420–516 |
| Acciones | Dos de 320×40, radio 10, 14 px, lado a lado en y 588 | Apiladas, 337×40, en y 540 y 588 |
| Titular → texto → botón | 24 px y 24 px | 24 px y 24 px |
| Contenedor | 1400 px con 32 de relleno | Márgenes de 16 a 28 |
| Sección | 56 px arriba y abajo | 40 px |
| h2 | 48/57.6, −2.4 px, centrado | 30/36 |
| Pie | 96 px, 2 enlaces | 56 px |

Solo cuatro secciones: inicio, Showcase (cinta de sitios), testimonios de Twitter y videos de YouTube. En el iPhone las dos acciones caben enteras en la primera vista (la segunda termina en y 628 de 659).

**Animaciones vivas: 10, todas infinitas** (`rainbow` 2 s ×5 bajo los botones, `marquee` 90 s ×4, `ping` 1 s). **Con movimiento reducido siguen las 10.** Su CSS solo trae la utilidad `motion-reduce:transition-none`.

### Su documentación como producto

Página de un componente (`/docs/components/blur-fade`), medida a 1440: tres columnas. Barra lateral izquierda con grupos (Getting Started, Templates, Components) e insignias «New» y «Pro»; columna central de 768 px; a la derecha, índice «On This Page» pegajoso y «Contribute». En iPhone es una sola columna de 345 px y la tabla de props se desplaza de lado dentro de su caja.

Orden fijo de cada página:

1. Migas (Docs / Components / Blur Fade).
2. Título (36/40, peso 600) y una frase de descripción.
3. **«Copy Page»** con desplegable, y flechas anterior / siguiente.
4. **Vista previa** con pestañas «Preview | Code»: marco de 774×450 con el componente vivo, botón **«reproducir de nuevo»** y «Open in v0».
5. **Installation** con pestañas «CLI | Manual» (y pnpm, npm, yarn, bun). Manual son pasos numerados con el código completo.
6. **Examples**: más vistas previas.
7. **Usage**: el import y el uso mínimo.
8. **Props**: tabla Prop · Type · Default · Description.
9. Al margen: «Report an issue», «Request a feature», «Edit this page».

Además, para máquinas: `llms.txt` (índice con una línea por componente), cada página como Markdown añadiendo `.md` a la URL, y cada componente como JSON en `/r/<nombre>.json` (esquema de shadcn: nombre, descripción, dependencias y archivos con su contenido).

Lo que **no** documentan: accesibilidad, teclado ni movimiento reducido. La página de Blur Fade no menciona ninguno.

## 7. Lottie a fondo

### El formato

Un archivo Lottie es un JSON que describe una animación vectorial. Nació de exportar After Effects (el plugin Bodymovin de Hernán Torrisi) y lo popularizó Airbnb. Estructura, vista en un archivo real de Lottielab:

- Raíz: `v` (versión), `fr` (cuadros por segundo), `ip` y `op` (cuadro inicial y final), `w` y `h`, `assets` (imágenes o precomposiciones), `layers`, `markers`, `metadata`.
- Capa: `ty` (0 precomposición, 2 imagen, 3 nulo, 4 formas), `ks` (transformaciones: posición `p`, ancla `a`, escala `s`, giro `r`, opacidad `o`), `ip`/`op`, y `shapes` en las capas de formas.
- Forma: grupos `gr` con trazados `sh`, rectángulos `rc`, rellenos `fl`, trazos `st`, recorte de trazo `tm` y transformación `tr`.
- Propiedad animada: `{"a":1,"k":[{"t":31,"s":[10,10],"o":{…},"i":{…}}, …]}`. Cada fotograma clave lleva tiempo, valor y las asas de su curva.
- Las **expresiones** (`x`) son código JavaScript dentro del JSON.

**dotLottie** (`.lottie`) es un ZIP con un `manifest.json`, una o varias animaciones, sus imágenes, temas y máquinas de estados. En archivos chicos no ahorra: el logo de Lottielab pesa 1 699 bytes en JSON con gzip y 1 937 como `.lottie`.

### Reproductores y su peso real (npm, minificado; gzip −9)

| Reproductor (versión, licencia MIT todos) | Minificado | gzip | Notas |
|---|---|---|---|
| `lottie-web` 5.13.0, `lottie_light.min.js` | 168.4 KB | **46.5 KB** | Solo SVG; sin expresiones ni efectos |
| `lottie-web`, `lottie_svg.min.js` | 242.6 KB | 62.4 KB | SVG con expresiones |
| `lottie-web`, `lottie.min.js` (completo) | 305.7 KB | 76.1 KB | SVG, canvas y HTML |
| `lottie-web`, `lottie_light_canvas.min.js` | 203.0 KB | 54.3 KB | |
| `@lottielab/lottie-player` 1.1.3 | 195.7 KB | 53.8 KB | `lottie-web` ligero + estados |
| `@lottiefiles/lottie-player` 2.0.12 | 384.0 KB | 97.8 KB | Incluye `lottie-web` y lit |
| `@lottiefiles/dotlottie-web` 0.83.2 | 161.0 KB + WASM 1 225.7 KB | 31.3 + 492.2 = **523.5 KB** | Canvas; motor ThorVG en WebAssembly |
| `@thorvg/lottie-player` 1.1.3 (variante `sw-lite`) | 44.4 KB + WASM 256.3 KB | 16.2 + 116.6 = 132.8 KB | La más chica con WebAssembly |
| `@dotlottie/player-component` 2.7.12 | 1 917.7 KB | 506.4 KB | Paquete viejo, todo en uno |

Referencia: todo el JavaScript de Itinerante suma 57.9 KB gzip −9 en el árbol actual (13 módulos; el encargo dice ~47 KB).

### CSP: probado con la del sitio

Servidor local con `default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'…` (la de `tools/preview-site.mjs`), iPhone 16, CPU 4×. Animación de prueba propia: una palomita de 828 bytes.

| Caso | Resultado |
|---|---|
| SVG + CSS propio | Funciona. 0 violaciones |
| `lottie-web` ligero | **Funciona. 0 violaciones.** Listo en 56–104 ms |
| `lottie-web` completo, JSON sin expresiones | Funciona. 0 violaciones |
| `lottie-web` completo, JSON **con una expresión** | **Falla**: violación `script-src` por `eval`; no pinta nada |
| Lo mismo con `'unsafe-eval'` | Funciona |
| `lottie-web` ligero, JSON con expresión | Funciona: ignora la expresión |
| `dotlottie-web` con el WASM alojado | **Falla**: `script-src` bloquea compilar WebAssembly |
| Lo mismo con `'wasm-unsafe-eval'` | Funciona |
| `dotlottie-web` sin configurar | **Falla**: pide el WASM a `cdn.jsdelivr.net` y `unpkg.com` (`connect-src`) |
| `@lottielab/lottie-player` (componente web) | Anima, pero viola `style-src` (inyecta un `<style>`) |
| `@lottiefiles/lottie-player` (componente web) | Anima, pero viola `style-src` (atributo `style`) |

Respuesta a la pregunta del encargo: **sí se puede alojar todo bajo `script-src 'self'`, pero solo con `lottie-web`** (ligero, o completo sin expresiones). No usa workers por omisión. Cualquier reproductor con WebAssembly exige relajar la CSP.

### Accesibilidad

**Ningún reproductor respeta el movimiento reducido por sí solo.** Con `prefers-reduced-motion: reduce` emulado, `lottie-web` y `dotlottie-web` siguieron animando. Tampoco traen pausa visible ni texto alternativo. Todo eso habría que escribirlo: comprobar la clase `motion`, llevar la animación a su último cuadro con `goToAndStop`, `loop: false`, y `aria-hidden` o un nombre.

### Alternativas sin reproductor, con pesos medidos

Misma animación para todas: el logo animado de Lottielab (3.1 s), pintado a 192×192 px y 30 cuadros por segundo sobre blanco, codificado con ffmpeg.

| Formato | Peso | Límites |
|---|---|---|
| Lottie JSON | 1.7 KB gzip **+ 46.5 KB de reproductor** | Nítido a cualquier tamaño |
| WebM (VP9) | 7.3 KB | Tamaño fijo, fondo horneado |
| AVIF animado | 7.6 KB | Igual; en `<img>` no se puede pausar |
| MP4 (H.264) | 8.9 KB | Igual, sin transparencia |
| GIF (64 colores) | 17.4 KB | Igual, peor calidad |
| APNG | 29.4 KB | Con transparencia |
| WebP animado | 84.0 KB | |
| **SVG + CSS escrito a mano** | Del orden de 0.3–1 KB | Solo formas y trazos simples |

Para la palomita de prueba: Lottie 344 bytes gzip más reproductor; SVG + CSS, 316 bytes gzip y nada más.

Dos límites del video pesan en Itinerante: el fondo queda horneado (el sitio cambia solo entre tema claro y oscuro, así que harían falta dos archivos) y un `<img>` animado no obedece «Pausar el movimiento». El SVG + CSS usa los tokens de color y de duración y queda bajo la clase `.motion`.

## 8. Encaje con Itinerante

Reglas del sitio que mandan aquí: sin dependencias en runtime, CSP estricta, movimiento como respuesta y nunca en bucle, todo plano con «reducir movimiento» o «Pausar el movimiento», duraciones de token (120 · 240 · 400 · 700 ms), fotos reales y nada inventado.

Buena parte de lo que estas herramientas venden **ya está hecho en nativo** desde la ronda del 2026-11-14: la palomita que se dibuja, el rebote al guardar, el conector que se llena, la ruta del mapa, el interruptor, los titulares por línea y el revelado de imagen.

### Lo que sí conviene (por valor / costo)

| # | Propuesta | Dónde | Cómo, bajo la CSP | Quién lo produce | Costo | Riesgo |
|---|---|---|---|---|---|---|
| 1 | **Ficha de movimiento por componente**: duración (token), curva, disparador, «¿bucle?» (siempre no) y qué pasa con movimiento reducido | `design/componentes.json` y `COMPONENTES.md` | Datos y una prueba que falle si falta la fila o si hay un bucle | Nosotros | 0.5 día | Casi nulo |
| 2 | **Página por componente** con orden fijo: qué es · vista previa (captura clara y oscura) · anatomía y selectores · tokens · estados · teclado y ARIA · movimiento · QA · historia; más un índice de una línea por componente | `design/` (generado con `npm run componentes`) | Markdown generado; nada se publica | Nosotros | 1–2 días | Bajo |
| 3 | **Pin que se asienta** al terminar de dibujarse la ruta: baja 6 px y se asienta con `curva-resorte` en `dur-rapida`, una vez | Mapa de Visita | `@keyframes` sobre el `<g>` del pin, encadenado a la ruta; bajo `.motion` | Nosotros, a mano | 1 h | Bajo |
| 4 | **«Compartir» confirma en el icono**: al copiar el enlace, el icono cede a la palomita que ya existe (`chk-dibuja`) y vuelve | Ficha y tarjetas de evento | Reutiliza `checkMark()` y `drawCheck()` | Nosotros | 1–2 h | Bajo; revisar que no duplique el aviso |
| 5 | **Desvanecido de borde en hojas con scroll**: el borde se desvanece solo cuando hay más contenido en esa dirección | Mi lista, Explorar, filtros, menú | Solo CSS: máscara con dos propiedades registradas (`@property`) animadas con `animation-timeline: scroll(self)`, dentro de `@supports`; sin soporte, nada | Nosotros | 2–3 h | Bajo; probar en Safari |
| 6 | **Vapor de la taza**: dos trazos que se dibujan una vez cuando la tarjeta llega al centro | Café y té | `stroke-dashoffset` en `dur-base`, con el patrón de la palomita | Nosotros, a mano | 2–3 h | Medio: roza lo decorativo; medir que no distraiga |
| 7 | **Marcador que se dibuja** en el estado vacío de Mi lista, una vez al abrir la hoja | Mi lista | Trazo SVG del icono `i-mark` ya existente | Nosotros, a mano | 1–2 h | Bajo |
| 8 | **Galería local de componentes** con botón «reproducir» y conmutadores de tema y movimiento | `tools/` (no se publica) | HTML que carga los estilos reales | Nosotros | 1–2 días | Bajo |
| 9 | **Norma para un video futuro** (si algún día hay uno real de la casa): `preload="none"`, póster, sin `autoplay`, arranca al verse y se detiene con movimiento reducido o la pausa | DESIGN.md | El patrón de Pryzm | Nosotros | 0.5 h (solo la norma) | Nulo |

Las propuestas 1, 2 y 8 son lo mejor de Magic UI: no sus efectos, sino cómo documenta. Y le ganamos en lo que omite: accesibilidad y movimiento reducido.

### Animación de marca del logo

Hoy no se puede: `Logo.png` y `Logo.webp` son imágenes de píxeles (256 y 768 px). Animar el logo pide un **logo en vectores (SVG)** que Aldo tendría que conseguir de quien lo diseñó.

Aun con el SVG, no la recomiendo al cargar la página: retrasa lo primero que se ve y es movimiento sin acción de la persona. Donde sí rinde es en redes, y ahí Jitter es la herramienta (ver abajo).

### Si Aldo quiere una animación compleja en el sitio

Una ilustración que no se pueda dibujar a mano en SVG. La única ruta viable:

- **Reproductor:** `lottie-web` ligero, alojado en `assets/`, importado solo al acercarse a la sección. Pesa **46.5 KB gzip**. Funciona con la CSP actual sin cambios (comprobado).
- **Es una dependencia nueva que Aldo debe aprobar**: AGENTS.md hoy prohíbe dependencias externas en runtime.
- **Condiciones del archivo:** sin expresiones, sin imágenes incrustadas, `loop: false`, colores resueltos para claro y oscuro (o dos archivos).
- **Trabajo nuestro:** envoltura que respete `.motion` y la pausa (último cuadro fijo), nombre accesible, registro en `assets/provenance.json` y prueba de INP.
- **Costo:** 1–2 días la primera vez, más el archivo.

Alternativa que prefiero: Aldo hace la animación en Jitter o Lottielab como **boceto**, nos pasa el video, y la reescribimos en SVG + CSS. Cero dependencias.

### Pasos concretos para Aldo, según lo que quiera

**A. Piezas para Instagram (recomendado; no toca el sitio).**
1. Crear cuenta gratis en jitter.video.
2. Abrir una plantilla de «Social media» o «Logos» y cambiar texto, colores (turquesa #7ac4b4, primario #176b62) y fotos **reales** de la casa.
3. Exportar MP4. Gratis sale a 720p con marca de agua; sin marca, plan Pro (15 USD al mes con cobro anual).
4. Uso comercial permitido y sin atribución en las plantillas de Jitter.

**B. Un archivo Lottie para el sitio (solo si aprueba la dependencia).**
1. En Jitter: exportar «Lottie» (el plan gratis lo permite; falta confirmar si lleva marca de agua). En Lottielab: hace falta Pro (18 USD al mes).
2. Mandarnos el `.json`. Nosotros revisamos que no traiga expresiones ni imágenes y lo medimos.

**C. Fondos de Pryzm:** no hace falta cuenta; no lo recomiendo.

### Lo que no conviene, y por qué

| Qué | Por qué |
|---|---|
| Lottie para iconos | 46.5 KB de reproductor contra 0.3 KB de SVG + CSS; no respeta la pausa por sí solo |
| dotLottie y cualquier reproductor con WebAssembly | 133 a 523 KB y obliga a añadir `'wasm-unsafe-eval'` a la CSP |
| Componentes web `<lottie-player>` | Violan `style-src 'self'` |
| Livelink u otro CDN de animaciones | Dominio externo en runtime; rompe `connect-src 'self'` |
| Titular o primera vista dentro de una animación | A Jitter se le queda en blanco si el archivo no llega; castiga el LCP |
| Fondos de Pryzm (degradado, vidrio, grano, fondo WebGL vivo) | El sitio es de fotos reales y fondos planos; el vidrio solo va en lo que flota; un canvas animado sin fin |
| Cintas infinitas, brillo arcoíris en botones, `ping` | Bucles sin fin; tropo de plantilla; ninguno de los cuatro los detiene con movimiento reducido |
| Texto que se enciende con el scroll (GSAP SplitText) | Dependencia de pago y lectura atada al desplazamiento |
| Tarjetas apiladas pegajosas | Alargan la página y atan la lectura al scroll (su sección mide 2 167 px en el iPhone de Jitter, más de tres pantallas) |
| Videos `autoplay` en bucle | Jitter carga 20; peso y movimiento sin pedirlo |
| Plantillas de ilustración o escenas | Una escena dibujada que finja ser la casa rompe los límites de verdad de PRODUCT.md |
| Botones de 32 px (Pryzm) o de 40 (Magic UI) | Bajo los 44 de Apple; los nuestros son 44/48/56 |
| Curvas de resorte que rebasan hasta 1.52 (Jitter) | Demasiado rebote para un sitio sobrio; la nuestra rebasa 1.05 |

## 9. Evidencia

Todo está en `/tmp/claude-0/-home-user-Itinerante/b8f46b7e-515f-5df7-abbe-59392678a2a6/scratchpad/rea-motion/`:

- `data/*.json`: medidas de cada portada (escritorio, iPhone, iPhone con movimiento reducido), de la documentación de Magic UI y Pryzm, y del rendimiento de Lottielab.
- `shots/<sitio>/`: capturas por sección; `sheet-desk.jpg` y `sheet-iphone.jpg` son hojas de contacto.
- `scripts/`: `measure.mjs` (medición de portadas), `probe.mjs` y los `p-*.js` (sondas), `bench.mjs` (prueba de CSP), `frames.mjs`.
- `bench/`: servidor con la CSP del sitio, los reproductores y la palomita de prueba; `bench/frames/out.*` son las alternativas codificadas.
- `dl/`: páginas, paquetes de npm y archivos bajados para medir. No se usan en el sitio.

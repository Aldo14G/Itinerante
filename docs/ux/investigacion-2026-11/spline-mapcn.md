# Spline y mapcn: arquitectura, animación, licencias y encaje con Itinerante

Investigación del 2026-11-14. Solo lectura del repo; no se tocó `/home/user/Itinerante`.

## Cómo se obtuvo (y qué no se pudo ver)

- **Red de la sesión:** `docs.spline.design`, `spline.design`, `mapcn.vercel.app` / `mapcn.dev`, `basemaps.cartocdn.com`, `unpkg.com` y `cdn.jsdelivr.net` **no** están permitidos en esta sesión (WebFetch: «host fuera de los dominios permitidos»). No pude abrir sus páginas ni ver las demos en vivo. Para leerlas hay que permitir esos hosts en la red del entorno.
- **Lo verificado de primera mano** (descargado e inspeccionado en el scratchpad):
  - Paquetes npm `@splinetool/runtime@2.0.183` y `@splinetool/viewer@2.0.183` (publicados el 2026-11-13): README, `AGENTS.md`, tipos `.d.ts` y tamaños medidos con gzip -9.
  - `maplibre-gl@6.18.0` (2026-11-11) y `pmtiles@4.5.0`: tamaños, licencia y búsquedas en el código.
  - Repositorio público de mapcn (`github.com/anmolsaini16/mapcn`, clon superficial, commit `b243a4d`, 2026-11-09): `README.md`, `LICENSE`, `registry.json`, `src/registry/map.tsx` (2 763 líneas) y los bloques.
- **Lo que viene de búsquedas web** (resúmenes de WebSearch, sin abrir la página): precios y planes de Spline, términos de CARTO, eventos de Spline y guías de terceros. Va marcado como «(búsqueda)» y hay que confirmarlo antes de decidir con ello.
- **Actualización del mismo día (2026-11-14):** con la red ampliada se abrieron en vivo `spline.design` (portada, `/pricing`, `/terms`, `/llms.txt`, `/web.md`, `/examples.md`) y `docs.spline.design` (páginas `.md` y `llms-full.txt`). Lo confirmado lleva «verificado en vivo (2026-11-14)» con su URL; el resumen está en «Verificación en vivo», al final. Siguen **bloqueados** por la red: `www.mapcn.dev` (`mapcn.dev` responde 307 hacia `www.mapcn.dev`, y ese host lo rechaza el proxy; se reintentó tras 30 s), `community.spline.design`, `app.spline.design`, `my.spline.design`, `prod.spline.design`, `carto.com` y `docs.carto.com`.

---

## 1. Spline (spline.design)

### 1.1 Arquitectura técnica

| Pieza | Qué es | Dato verificado |
|---|---|---|
| Editor | App web y de escritorio para modelar, animar y programar interacción en 3D (y 2D, «Hana»). Spline V2 (agosto de 2026) reconstruyó el editor e integró un agente de IA (búsqueda). | El agente en el editor, el servidor MCP (`mcp.spline.design/mcp`) y Hana: **verificado en vivo (2026-11-14)**, [spline.design](https://spline.design/) y [spline.design/llms.txt](https://spline.design/llms.txt). La fecha de V2 no se confirmó (el blog no se abrió). |
| Escena exportada | Archivo binario `.splinecode` (los `.spline` son solo del editor). El editor lo publica en `https://prod.spline.design/<id>/scene.splinecode`; la URL **no se puede derivar**, sale del panel Export → Code. | `AGENTS.md` del runtime |
| `@splinetool/runtime` | Clase `Application(canvas)`; `load(url)` o `start(arrayBuffer)`. Renderiza en `<canvas>` con **WebGPU y WebGL como respaldo** (selección automática; opción `renderer`). Base: three.js (el código cita issues de three.js; el paquete `@splinetool/loader` da el grafo de three.js crudo). | README, `AGENTS.md`, código |
| `@splinetool/viewer` | Web component `<spline-viewer url="…">` hecho con **Lit 2.6**. Atributos: `loading` (`auto` = perezoso hasta entrar en la vista, `lazy`, `eager`), `unloadable` (descarga el canvas al salir de la vista), `events-target` (`local`/`global`), `renderer`, `background`, `hint` (pista de arrastre), `loading-anim-type` (spinner). Eventos `load-start` / `load-complete`. | `spline-viewer.d.ts`, README |
| `@splinetool/react-spline` | Envoltura React (4.2.0) con marcador de carga blurhash/thumbhash. | npm |
| Otras salidas | iframe de la página pública, Next.js, Vue, Svelte, apps nativas (iOS/visionOS), GLTF/GLB, USDZ (de pago), y **grabación de vídeo WebM/MP4/GIF o secuencia de imágenes PNG/JPG a 15–60 fps** (búsqueda: docs de export). | **Corregido en vivo (2026-11-14):** la secuencia de imágenes es JPG o PNG a 15, 24, 30, 48 o 60 fps ([docs](https://docs.spline.design/exporting-your-scene/files/exporting-image-sequences.md)). El vídeo se exporta con duración, fps y resolución; la página no nombra formatos, así que **WebM y GIF no están confirmados** ([docs](https://docs.spline.design/exporting-your-scene/files/exporting-as-video.md)). Según [pricing](https://spline.design/pricing), exportar vídeo, USDZ/STL, GLTF con color y textura y descargar el código exige el plan **Pro**, y el export autoalojado, **Enterprise**. Las salidas de código son Vanilla JS, React, Next.js, Three.js y react-three-fiber ([docs](https://docs.spline.design/exporting-your-scene/web/exporting-as-code.md)); Vue y Svelte no tienen paquete propio (`llms-full.txt`: «No first-party Vue or Svelte package»). |

**Peso medido** (gzip -9; en la web se sirve también en Brotli, algo menor):

| Archivo | Sin comprimir | gzip |
|---|---|---|
| `runtime.js` (entrada; carga trozos bajo demanda) | 132 KB | 38 KB |
| Trozos principales de un render típico (`runtime-classicRuntime` 147 KB, `runtime-chunk-YEHLK4BX` 183 KB, `runtime-chunk-KPOUV3HD` 75 KB, …) | — | ≈ 450–600 KB, según lo que use la escena |
| `runtime.standalone.webgl.js` (todo en uno, solo WebGL) | 2,26 MB | **590 KB** |
| `spline-viewer.webgl.js` (web component, solo WebGL) | 2,48 MB | **670 KB** |
| `spline-viewer.js` (WebGPU + WebGL) | 3,63 MB | **1,0 MB** |
| WASM opcionales (física 586 KB gz, navmesh 140, booleanas 62, bisel 58, `process` 123, `hana-ui` 1,1 MB) | — | solo si la escena los usa |
| La escena `.splinecode` | — | **no medido** (depende de la escena; no tenía ninguna exportada) |

Para comparar: todo el JavaScript propio de Itinerante (`*.js` de la raíz y `assets/js/`) pesa **≈ 47 KB gzip**. Una escena de Spline multiplica eso por 12 a 14 antes de contar la escena.

**¿Se puede servir en local?** En parte, sí:

- El runtime se instala desde npm y se puede copiar a `assets/` (el `AGENTS.md` dice que el CDN `cdn.spline.design/@splinetool/runtime@<versión>/build/…` es la fuente y npm su espejo).
- El README dice que el `.splinecode` **se puede descargar desde el panel de export y alojar uno mismo** (lo propone como arreglo de CORS).
- **Corrección, verificado en vivo (2026-11-14):** el export que empaqueta escena, runtime y WASM para servirlo **sin pedir nada a servidores externos ni al CDN** es «Self-Hosted» y solo existe en el plan **Enterprise** ([docs](https://docs.spline.design/exporting-your-scene/web/exporting-as-self-hosted-project.md), [spline.design/web](https://spline.design/web.md), [pricing](https://spline.design/pricing): «Self-Hosted Export» solo en Enterprise; «Download Code Export» desde Pro). El export de código normal también se descarga y se puede alojar ([docs](https://docs.spline.design/exporting-your-scene/web/exporting-as-code.md)), pero que la documentación presente el autoalojado como la vía para no depender del CDN sugiere que el export normal sí lo usa (deducción, no probada). Para la CSP del sitio, la vía limpia cuesta un plan Enterprise.
- La opción `wasmPath` permite servir los WASM desde el propio origen (por omisión vienen del CDN).
- **Pero** el código del runtime trae URLs externas fijas que encontré al buscar: `cdn.spline.design` (WASM y trozos, si no se fija `wasmPath`), `www.gstatic.com/draco/…` (decodificador Draco para mallas comprimidas), `fonts.gstatic.com/…roboto…` (letra por omisión de los textos 3D), `hooks.spline.design/events` (EventSource, solo si la escena usa webhooks), `apis.spline.design`, `relayserver.spline.design` y `api.openai.com/v1/realtime` (funciones de IA/voz). Con nuestra CSP (`connect-src 'self'`, `script-src 'self'`) cualquier escena que toque una de esas rutas falla. **No verifiqué** cuáles llama una escena sencilla; habría que probarlo con una escena real y la CSP de producción.
- El runtime usa **WebAssembly** en algunos trozos (Draco, navmesh, física, `process`). Con `script-src 'self'` sin `'wasm-unsafe-eval'` Chrome bloquea compilar WASM. Si la escena lo necesita, habría que relajar la CSP.
- Usa `new Function` (msgpackr) dentro de un `try`; probablemente cae a una ruta lenta sin `unsafe-eval`, pero **no lo verifiqué** en navegador.

### 1.2 Animación e interacción (lo destacable)

Todo se programa en el editor como **estados + eventos + acciones**, sin código:

- **Estados** de cada objeto (posición, rotación, escala, material) y **transiciones** entre ellos con curva y duración. Desde código: `obj.transition({ to: 'Estado', duration, delay, easing })`, encadenables, con `play/pause/reset/seek` (README).
- **Eventos**: `mouseDown`, `mouseUp`, `mouseHover`, `keyDown`, `keyUp`, `start`, `lookAt` (el objeto mira al cursor o al dedo), `follow` (lo sigue), `scroll`, `collision`, `rendered` (lista cerrada en `AGENTS.md`). En el editor hay además «Distance», «State Change», «Variable Change» y «Game Controls» (búsqueda). Desde 2023, Look At y Follow aceptan límites de distancia, ejes restringidos y la cámara como blanco (changelog, búsqueda).
  - **Verificado en vivo (2026-11-14)** en el índice de [docs.spline.design/llms.txt](https://docs.spline.design/llms.txt): existen Distance, State Change, Variable Change y Game Controls, y además Mouse Press, Key Press, Drag and Drop, Trigger Area, Screen Resize, API Updated, Webhook Called y los dos del asistente de IA. Look At, Follow y Scroll pueden ser **globales** (toda la ventana) solo con el export Viewer; con la URL pública en iframe son solo locales ([docs del Viewer](https://docs.spline.design/exporting-your-scene/web/exporting-as-spline-viewer.md)). El changelog de 2023 no se abrió.
- **Scroll**: un evento de tipo «Steps» lleva la cámara por estados (pantalla 1 → 2 → 3) según el desplazamiento de la página. **Solo funciona con el export Viewer** (búsqueda: docs del evento Scroll y tutorial de DesignCode).
  - **Corregido en vivo (2026-11-14)** ([docs del evento Scroll](https://docs.spline.design/interaction-states-events-and-actions/events/scroll-event.md)): el evento tiene dos tipos. **Steps** es la cantidad de desplazamiento que hace falta para recorrer una transición. **Scroll** sigue el desplazamiento de la página (empieza al entrar el visor en la vista, arriba, en medio o abajo, o a una altura fija de la página, y termina tras N píxeles), y **ese tipo es el que solo funciona con el export Viewer**. No es «Steps» el que exige el Viewer.
- **Variables** (texto, número, booleano) que la página puede cambiar: `setVariable('nombre', valor)`; útiles para escenas que reaccionan a datos.
- **Materiales por capas** (color, fresnel, degradado, ruido, toon, contorno, textura, vídeo) editables desde código: `material.layers.find(l => l.type === 'fresnel').factor = 0.5`.
- **Física, partículas, controles de juego**, desenfoque de profundidad y bloom como trozos opcionales; **Gaussian splatting** (trozo `gaussian-splat-compression.js`).
- **`renderMode: 'manual'`**: solo pinta cuando se llama `requestRender()`; `stop()` / `play()` pausan render y eventos.
- **HTML sobre la escena** (Spline V2): un documento HTML hecho en el editor viaja dentro del `.splinecode` y se presenta encima del canvas en un iframe aislado (`htmlContentMode: 'sandbox'`, por omisión) o injertado en la página (`inline`).

Estilo visual típico de la galería (por los nombres de capas y la comunidad, no lo vi en vivo): objetos redondeados tipo «clay», vidrio y fresnel, iluminación suave, cámara que orbita o sigue al cursor, héroes de producto que giran. Es un estilo de «objeto juguete» que **choca con el minimalismo tipográfico de Itinerante Líquido**.

**Galería y visor, comprobación en vivo (2026-11-14), parcial:** la galería de la comunidad (`community.spline.design`) y el visor (`my.spline.design`, `prod.spline.design`) siguen bloqueados, así que **no vi ninguna escena renderizada**; en la portada de spline.design el lienzo se quedó en 300×150 porque su escena viene de `prod.spline.design`. Sí se abrió la lista de ejemplos oficiales ([spline.design/examples.md](https://spline.design/examples.md)): «3D Text - Blue», «Purple 3D Icons», «Kids Playground Physics», «Component Icecream», «Iphone 14 Pro», «Friends Kawai», «BMO - Adventure Time», «Polaroid Go», «Room - Relaxing», «Hands 3D UI». Los títulos confirman el registro de objeto juguete e icono 3D; el aspecto (clay, fresnel) sigue sin verse.

### 1.3 Licencias y condiciones

- **Runtime y viewer: propietarios.** El `package.json` no declara licencia y dice «© 2026 Spline, Inc.». No encontré una licencia de redistribución del runtime ni de los `.splinecode` (búsqueda sin resultado). Antes de alojarlo en el repo, conviene confirmarlo en `spline.design/terms` (los términos del 2026-09-29 nombran los planes Hobby, Professional y Max; búsqueda).
  - **Verificado en vivo (2026-11-14)**, [spline.design/terms](https://spline.design/terms): los términos se publicaron el 2026-09-29, rigen desde el 2026-10-29 y nombran los planes Hobby, Professional y Max. **No contienen ninguna licencia del runtime ni del viewer**; lo único que se publica como reutilizable es el contenido de la comunidad (ver abajo). La conclusión «propietario, sin licencia de redistribución» se mantiene.
  - Nuevo en esos términos (§6.2): Spline puede crear datos «desidentificados» a partir de las escenas y de lo que se haga con su IA, y usarlos para cualquier fin comercial, incluido **entrenar modelos**, también con datos anteriores al 2026-10-29. Importa solo si Aldo sube material de la librería al editor.
- **Contenido de la comunidad (nuevo, verificado en vivo, con una contradicción):** [spline.design/llms.txt](https://spline.design/llms.txt) y la documentación (`docs.spline.design/llms-full.txt`) dicen que las escenas de la comunidad son **CC BY 4.0** (atribución obligatoria: «Made with Spline» y el autor). Los [términos](https://spline.design/terms) dicen que la licencia por omisión de lo publicado en la comunidad es una «Standard Commercial License» (remezclar y modificar para uso personal y comercial). Las dos permiten uso comercial; si alguna vez se usara una escena ajena, conviene atribuir como pide CC BY.
- **Marca de agua:** según `AGENTS.md`, la marca «Made with Spline» va **dentro de los datos de la escena** (imagen `SplineWatermark`) y la pone el publicador; ningún código la quita y **no se debe intentar ocultarla**. La página de precios dice que los planes de pago dan «exports sin marca de agua» (búsqueda). Precio del plan de entrada: entre 12 y 15 USD por asiento al mes según la fuente (búsqueda, sin confirmar en la página oficial).
  - **Verificado y precisado en vivo (2026-11-14)**, [spline.design/pricing](https://spline.design/pricing): Free 0 USD («Web exports with watermark», archivos personales limitados, sin créditos de IA); **Hobby 12 USD por asiento al mes con pago anual o 15 USD mensual** (quita la marca en los exports web de 3D); **Pro 25 / 30 USD** (quita la marca en los embeds web de Hana 2D; vídeo, código descargable, GLTF con textura, apps iOS/Android); **Max 60 / 70 USD**; Enterprise a medida (export autoalojado). Las dos cifras de «12 a 15» eran el precio anual y el mensual del mismo plan. El Viewer tiene una opción «Logo» Sí/No ([docs](https://docs.spline.design/exporting-your-scene/web/exporting-as-spline-viewer.md)); la guía para agentes de Spline insiste en no publicar un embed sin la marca.
- **Atribución recomendada** en el marcado: «Made with Spline» y, si la escena viene de la comunidad, el autor (hay que hacerle «Remix» antes; las escenas de la comunidad no tienen URL `.splinecode`). **Verificado en vivo (2026-11-14)** en [spline.design/llms.txt](https://spline.design/llms.txt): «A community scene is not a published export and has no `scene.splinecode` URL of its own. Remix it, publish the copy, then use that URL.»

### 1.4 Rendimiento y accesibilidad

- **Peso:** 590–1 000 KB gzip de runtime más la escena. En móvil con CPU 4× eso es parseo y compilación de shaders en el hilo principal: riesgo alto para INP si coincide con un toque, y para LCP si la escena está arriba del pliegue.
- **Guía de Spline** (búsqueda): cargar perezoso (el viewer ya lo hace con `loading="auto"`), no más de tres escenas por página, `dispose()` al desmontar (si no, se pierde un contexto WebGL por montaje). Un caso de terceros reporta LCP de 5,7 s a 0,6 s solo con carga diferida (sin método publicado).
  - **Verificado en vivo (2026-11-14), en parte:** la documentación oficial pide precargar el archivo de la escena, montar en diferido todo lo que esté bajo el pliegue, esperar `load()` y llamar a `dispose()` al desmontar (`docs.spline.design/llms-full.txt`), y el Viewer carga en diferido por omisión ([docs](https://docs.spline.design/exporting-your-scene/web/exporting-as-spline-viewer.md)). Su guía de optimización trata de polígonos, materiales, luces y un panel de rendimiento ([docs](https://docs.spline.design/exporting-your-scene/how-to-optimize-your-scene.md)). **El tope de «tres escenas por página» no aparece en la documentación oficial**: es de terceros.
- **Safari iOS:** hay WebGL; WebGPU depende de la versión. Un desarrollador reporta que el embed puede medir 0 px de alto en Safari si el contenedor no tiene alto explícito (anécdota). Webflow recomienda probar en iPhones viejos (búsqueda).
- **Movimiento reducido:** **ni el runtime ni el viewer** mencionan `prefers-reduced-motion` (lo busqué en todo `build/`: cero resultados). Hay que hacerlo a mano: no montar la escena o llamar `stop()` y mostrar una imagen fija.
  - **Verificado en vivo (2026-11-14):** la documentación completa (`docs.spline.design/llms-full.txt`, 715 KB) tampoco menciona `prefers-reduced-motion`, lectores de pantalla ni `aria-`. Contraste curioso: **la página de marketing de Spline sí lo respeta**; en Chromium, con movimiento reducido emulado, sus 15 animaciones CSS infinitas pasan a 0 ([spline.design](https://spline.design/), medido con `document.getAnimations()`). El producto que venden no lo hace.
- **Accesibilidad:** el viewer no pone `role`, `aria-label` ni texto alternativo (cero resultados al buscar `aria-label`). El canvas es opaco para lectores de pantalla y el teclado solo llega si la escena programó `keyDown`. Patrón recomendado por terceros: imagen fija de respaldo, texto equivalente al lado y la escena como decoración (`aria-hidden`).
- **Sin JS:** no hay nada. Hace falta un `<img>` de respaldo.

---

## 2. mapcn

### 2.1 Arquitectura técnica

- **Qué es:** un componente React copiable, `map.tsx` (2 763 líneas), distribuido como **registro de shadcn** (`registry.json`, `npx shadcn add @mapcn/map`). No es un paquete npm: el código pasa a ser tuyo. Dependencias: **`maplibre-gl@^6`** y `lucide-react`; también React 19, Next 16, Tailwind 4, `cn()` de shadcn y CSS con `@apply` sobre las clases `.maplibregl-*`. MIT, © 2025 Anmoldeep Singh. Programa OSS de Vercel; tiene un *skill* para agentes (`npx skills add AnmolSaini16/mapcn`) y versiones de la comunidad para Vue y Svelte.
- **Motor:** usa **MapLibre GL JS** directamente, sin `react-map-gl`; `useMap()` da la instancia. MapLibre se importa de forma diferida (`import("maplibre-gl")`) y, si no hay URL del worker, **la toma de `unpkg.com`** (`setWorkerUrl('https://unpkg.com/maplibre-gl@<v>/dist/maplibre-gl-worker.mjs')`).
- **Componentes exportados:** `Map`, `MapMarker` + `MarkerContent` / `MarkerPopup` / `MarkerTooltip` / `MarkerLabel`, `MapPopup`, `MapControls` (zoom, brújula, ubicarme, pantalla completa), `MapRoute` + `RouteProgress` + `RouteMarker`, `MapGeoJSON` (con estado *hover*), `MapArc` (arcos geodésicos), `MapClusterLayer`. Proyección `globe` opcional y estilo `blank` (mapa sin teselas para visualización de datos).
- **Bloques** (páginas completas): Store Locator (lista buscable sincronizada con marcadores), Delivery Tracker, Logistics Network, Uptime Monitor, Analytics Map/Card, Choropleth, Heatmap sobre globo, Community Globe.
- **Teselas y estilos:** por omisión, **CARTO** `positron-gl-style` (claro) y `dark-matter-gl-style` (oscuro) en `basemaps.cartocdn.com`, con datos de OpenStreetMap. Los ejemplos usan además OpenFreeMap (`tiles.openfreemap.org/styles/bright` y `liberty`, este en 3D), rutas de **OSRM público** (`router.project-osrm.org`), GeoJSON de Natural Earth en jsDelivr, fotos de Unsplash y avatares de DiceBear. Se puede pasar cualquier estilo compatible con MapLibre (`styles={{ light, dark }}`).

**Peso medido de MapLibre GL JS 6.18.0** (lo que mapcn arrastra; gzip -9):

| Archivo | Sin comprimir | gzip |
|---|---|---|
| `maplibre-gl.mjs` (ESM; v6 ya no trae UMD) | 1,11 MB | 296 KB |
| `maplibre-gl-worker.mjs` | 520 KB | 147 KB |
| `maplibre-gl.css` | 72 KB | 10 KB |
| **Total del motor** | 1,70 MB | **≈ 453 KB** |
| `pmtiles` (protocolo para teselas en un solo archivo) | — | 6–8 KB |

Más React, lucide y Tailwind en el caso de mapcn.

### 2.2 Animaciones y estilos visuales destacados (del código)

- **Tema automático claro/oscuro:** `useResolvedTheme` lee la clase `dark`/`light` o `data-theme` en `<html>` (con un `MutationObserver`) y, si no hay, `prefers-color-scheme`. Al cambiar, sustituye el estilo del mapa sin reiniciarlo. Encaja con nuestro tema automático.
- **Cámara:** `flyTo` al ubicarse (1 500 ms, zoom 14) y al elegir tienda en Store Locator (800 ms, **`essential: true`**); zoom ±1 y «norte arriba» con `duration: 300`.
- **Popups y tooltips:** entrada `fade-in-0 zoom-in-95 duration-200 ease-out` (tailwindcss-animate); la «cola» del popup nativo se oculta y la caja toma `bg-background`/`border` de shadcn.
- **Marcadores:** cualquier nodo React como marcador (pin redondo que crece `scale-110` al activarse, avatares, insignias de estado), arrastrables, con etiqueta, tooltip o popup.
- **Rutas:** `MapRoute` dibuja la línea; **`RouteProgress`** pinta encima el tramo recorrido según una fracción (0–1), y `RouteMarker at={…}` coloca un icono (el coche del ejemplo) en ese punto: es la «ruta que avanza» de los demos, movida por un *slider*.
- **Arcos** curvos entre ciudades con área de toque ampliada (12 px), **clusters** con tres colores por umbral, **choropleth** y **heatmap** con *hover* por `feature-state`.
- **Escaparate de la portada:** la «pared de mapas» de mapcn.dev **no son mapas vivos**: son capturas (`ThemedImage`, versión clara y oscura) en columnas, con los rieles laterales desenfocados (`blur-[3px]`, opacidad 70 %, máscara a los lados) y `aria-hidden`. Lección útil: para lucir mapas en una página de marketing usan **imágenes**, no WebGL.
  - **Sin verificar en vivo (2026-11-14):** `mapcn.dev` redirige (307) a `www.mapcn.dev` y la red de la sesión rechaza ese host, así que la portada no se pudo abrir. Se volvió a clonar el repositorio: el último commit sigue siendo `b243a4d` (2026-11-09) y la pared sigue en `src/app/(main)/(home)/_components/map-wall.tsx` con `ThemedImage`. La afirmación sale del código del sitio, no de verlo. El mismo patrón sí se vio en vivo en otra portada: la de Aceternity es una pared de capturas en columnas (ver `aceternity-magicui.md`).
- **Atribución restilizada:** el control de atribución compacto de MapLibre toma los colores del tema (fondo, borde, texto apagado).

### 2.3 Licencias y condiciones

- **mapcn:** MIT. **MapLibre GL JS:** BSD-3-Clause. **pmtiles** y **@protomaps/basemaps:** BSD-3-Clause (npm).
- **Datos:** OpenStreetMap, bajo ODbL; la atribución «© OpenStreetMap contributors» es obligatoria (y la del proveedor de teselas).
- **CARTO** (según el README de mapcn, 2026-11-09): gratis hasta **1 millón de teselas al mes en uso comercial** y 5 millones en no comercial, atribución CARTO + OSM visible, y CARTO «requiere clave para las teselas raster y puede extenderlo a las vectoriales». Una búsqueda devolvió una entrada del blog de CARTO que dice que Positron y Dark Matter **ya piden clave gratuita** y que el tramo gratis está pensado para uso no comercial. **Las fuentes no coinciden**; los términos (`carto.com/legal/basemap-terms/`) no los pude abrir. Una librería es uso comercial: si se usara CARTO, habría que leerlos. **Sigue pendiente (2026-11-14):** `carto.com` y `docs.carto.com` no están en la red permitida. No cambia nada: la recomendación ya descarta CARTO.
- **OSRM público** (`router.project-osrm.org`): es un servidor de demostración; no apto para producción (no verificado aquí, es la política conocida del proyecto; confirmarla si se usara).

### 2.4 Rendimiento y accesibilidad

- **Peso:** ≈ 453 KB gzip de MapLibre, más estilo, teselas, glifos y sprites. En móvil la creación del contexto WebGL y el primer pintado son trabajo pesado: debe cargarse **solo al acercarse a la sección** y nunca arriba del pliegue.
- **Safari iOS:** MapLibre 6 usa WebGL2; mapcn lanza `GPUInitializationError` si no hay *painter* («WebGL2 no disponible»). Hace falta un respaldo estático.
- **Movimiento reducido:** **MapLibre sí lo respeta**: en el código, `easeTo`/`flyTo` ponen `duration = 0` si `prefers-reduced-motion: reduce`, **salvo con `essential: true`**. El Store Locator de mapcn usa `essential: true`, así que **ignora** la preferencia (fallo de mapcn). mapcn no añade ninguna otra regla de movimiento reducido (cero resultados en `src/registry`).
- **Teclado y lectores:** MapLibre pone `role="region"` y `aria-label="Map"` (cadena traducible `Map.Title`) en el contenedor, trae `KeyboardHandler` (flechas para desplazar, +/− para zoom) y `cooperativeGestures` (pide dos dedos o Ctrl para mover, así el mapa no secuestra el desplazamiento de la página). Los marcadores llevan `aria-label` («Map marker» por omisión). mapcn añade `aria-label` a sus botones y anillo `focus-visible`. Nadie da una **alternativa en texto**: la dirección y las indicaciones deben ir en HTML.
- **Sin JS:** nada. mapcn además necesita React.

---

## 3. Encaje con Itinerante

Restricciones que lo deciden (del repo): página estática sin dependencias ni build; CSP `default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data: blob:` (en `index.html` y en `tools/preview-site.mjs`); `Permissions-Policy: geolocation=()` en `worker/_headers`; INP ≤ 200 ms a CPU 4×, LCP ≤ 2,5 s; movimiento solo con duraciones de tokens y todo plano con movimiento reducido; vidrio solo en lo que flota; `PRODUCT.md` prohíbe presentar recreaciones como reales (las recreaciones de la casa se retiraron el 2026-11-10 por fotos reales). Visita (`index.html`, `#visita`) ya tiene dirección en `<address>` con entre calles, horario en tabla, foto real de la llegada y «Cómo llegar» a Google Maps.

### 3.1 Qué choca

| Elemento | Por qué no |
|---|---|
| mapcn tal cual | React, Next, Tailwind y shadcn: el proyecto prohíbe Tailwind y dependencias de runtime, y no hay build para TSX. |
| Teselas de CARTO / OpenFreeMap, OSRM, worker en unpkg | Orígenes externos: rompen `connect-src 'self'` y `script-src 'self'`; además dependen de cuotas y términos de terceros. |
| Botón «Ubícame» de mapcn | `geolocation=()` lo bloquea, y no hace falta para llegar a una sola dirección. |
| `<spline-viewer>` o runtime de Spline | 600 KB a 1 MB gzip (12–20 veces todo nuestro JS), WASM que pide `'wasm-unsafe-eval'`, URLs externas fijas, sin `prefers-reduced-motion` ni accesibilidad, licencia propietaria y marca de agua en el plan gratis. |
| Una escena 3D de la casa | Sería una **recreación**: va contra la regla de verdad de `PRODUCT.md`. |
| Estética «clay»/juguete de Spline | Choca con Itinerante Líquido (tipográfico, tipo Apple, fotos reales). |

### 3.2 Qué se puede aplicar tal cual o como inspiración

**A. Mapa estático de la casa en Visita (recomendado, el de mejor valor/costo).**
Un SVG (o WebP claro/oscuro) dibujado de un recorte pequeño del Centro: Matamoros entre Aldama y Rayón, un pin en el 421 y las calles con su nombre. Imita la «pared de mapas» de mapcn (imágenes, no WebGL).
- Cómo: exportar las calles de OSM del recorte (o trazarlas a mano), limpiarlas y colorearlas con tokens (`--fondo-2`, `--linea`, `--tinta-2`, `--primario` para el pin). Si es SVG en línea con `currentColor` o servido como archivo con dos variantes, cambia con el tema. El pin puede llevar el rebote de `pickPop()` solo al tocar, y nada con movimiento reducido.
- Enlace: toda la imagen enlaza a «Cómo llegar» (el mismo destino), con `alt` que dice la dirección y las entre calles.
- Atribución: «© colaboradores de OpenStreetMap» en un pie pequeño si se derivan datos de OSM (ODbL).
- Peso: ≈ 5–30 KB. Cero JS. LCP e INP sin cambios; no rompe la CSP.
- Esfuerzo: 0,5–1 día. Riesgo: bajo (que el dibujo quede desactualizado si cambian calles; mantener la escala modesta).

**B. Mapa vectorial interactivo local (solo si Aldo lo quiere de verdad).**
MapLibre GL JS 6 en vanilla JS (sin mapcn), copiado a `assets/vendor/`, más un archivo **PMTiles** del recorte de Monterrey sacado con `pmtiles extract --bbox=…` de una build de Protomaps, estilo propio hecho con tokens (claro y oscuro, como hace mapcn), glifos y sprite locales.
- CSP: el worker de v6 se sirve como URL del mismo origen (`setWorkerUrl('assets/vendor/maplibre-gl-worker.mjs')`), así que `worker-src` cae en `script-src 'self'` y no hace falta `blob:` (según la guía de migración v5→v6; en el código vi que con URL del mismo origen crea el worker directo). Teselas, estilo y glifos van por `fetch` al mismo origen: cumple `connect-src 'self'`. El PMTiles necesita peticiones con rango (`Range`): **confirmar que Workers Static Assets de Cloudflare las sirve** antes de elegir esta vía.
- Carga: `import()` al acercarse a `#visita` (como `feed.js` o `cafe.js`), con el SVG de la opción A como póster hasta que pinte y como respaldo sin WebGL2 o sin JS.
- Movimiento: `flyTo` sin `essential`, con duración de `motion.js`; `cooperativeGestures: true` para no secuestrar el desplazamiento; sin «ubícame».
- Accesibilidad: `aria-label` en español en el contenedor («Mapa de la llegada a la librería»), un marcador con nombre y el `<address>` existente como alternativa en texto.
- Peso: ≈ 460 KB gzip de motor + PMTiles del recorte (**tamaño no verificado**; medir con `pmtiles extract --dry-run`) + glifos. Sin efecto en LCP si se difiere; riesgo moderado para INP al crear el contexto WebGL (medir con `tools/qa/inp.mjs`).
- Esfuerzo: 3–5 días (estilo con tokens claro y oscuro, glifos y sprite, arnés de QA, pruebas en Safari iOS). Riesgo: medio. Pregunta honesta: para **una sola dirección** con enlace a Google Maps, el mapa interactivo aporta poco más que A.

**C. Ideas de animación de mapcn que sí caben sin MapLibre.**
- **«Ruta que avanza» (RouteProgress) en SVG:** en el mapa estático de A, una línea discontinua desde una referencia conocida (p. ej. la estación de Metro más cercana o la Macroplaza; **no verifiqué** cuál conviene) hasta el pin, que se dibuja con `stroke-dashoffset` una vez al entrar en la vista, con duración de token y plana con movimiento reducido. Un solo efecto, sin bucle.
- **Tooltip/popup con entrada `fade + zoom 95 %` a 200 ms:** coincide con lo que ya hacen las hojas; no hace falta nada nuevo.
- **Atribución compacta restilizada con tokens** si alguna vez hay mapa (B).

**D. Spline: solo como fuente de material, no como runtime.**
- Lo único sin conflicto técnico es usar el editor para **producir un recurso fijo**: un vídeo corto WebM/MP4 o una secuencia de imágenes (export de «Video Recording», búsqueda) o un GLB. Aun así, cualquier cosa que represente la casa sería recreación (choca con `PRODUCT.md`), y un objeto decorativo (un libro girando) no tiene sitio en el sistema Líquido. Además, la secuencia de fotogramas `seq/` ya se retiró del sitio el 2026-11-10. No lo recomiendo.
- Como inspiración, la gramática de Spline de **estados + eventos (hover, look-at, follow)** ya existe en el sitio con CSS: la «profundidad» del Carrusel3D (`tiltPose`/`tiltTransform`: la pieza se inclina hacia el cursor hasta 6°, solo con puntero fino y nada con movimiento reducido) es el equivalente ligero de «Look At». No hace falta más.
- Si Aldo insistiera en una escena viva: solo debajo del pliegue, tras un toque explícito («Ver en 3D»), con póster fijo, `renderMode: 'manual'` o `stop()` con movimiento reducido, `dispose()` al salir, runtime solo WebGL alojado en local con `wasmPath` local, escena sin texto 3D (evita la letra de gstatic) ni Draco, plan de pago para quitar la marca y CSP con `'wasm-unsafe-eval'` si la escena usa WASM. Esfuerzo 3–5 días más el diseño de la escena; riesgo alto de INP y de mantenimiento (la URL de la escena depende de la cuenta de Spline).

---

## 4. Fuentes

Verificadas de primera mano:
- npm `@splinetool/runtime@2.0.183` (README, AGENTS.md, build/): https://www.npmjs.com/package/@splinetool/runtime
- npm `@splinetool/viewer@2.0.183` (README, `spline-viewer.d.ts`): https://www.npmjs.com/package/@splinetool/viewer
- npm `@splinetool/react-spline@4.2.0`: https://www.npmjs.com/package/@splinetool/react-spline
- npm `maplibre-gl@6.18.0` (dist/, LICENSE.txt): https://www.npmjs.com/package/maplibre-gl
- npm `pmtiles@4.5.0`, `@protomaps/basemaps@5.7.2`: https://www.npmjs.com/package/pmtiles
- Repositorio mapcn, commit b243a4d (README, LICENSE, registry.json, src/registry/map.tsx, bloques): https://github.com/anmolsaini16/mapcn

Verificadas en vivo el 2026-11-14 (página abierta):
- Spline precios: https://spline.design/pricing
- Spline términos: https://spline.design/terms
- Spline para agentes y para la web: https://spline.design/llms.txt , https://spline.design/web.md , https://spline.design/examples.md
- Spline docs: https://docs.spline.design/llms.txt , https://docs.spline.design/llms-full.txt , https://docs.spline.design/interaction-states-events-and-actions/events/scroll-event.md , https://docs.spline.design/exporting-your-scene/web/exporting-as-spline-viewer.md , https://docs.spline.design/exporting-your-scene/web/exporting-as-code.md , https://docs.spline.design/exporting-your-scene/web/exporting-as-self-hosted-project.md , https://docs.spline.design/exporting-your-scene/files/exporting-as-video.md , https://docs.spline.design/exporting-your-scene/files/exporting-image-sequences.md , https://docs.spline.design/exporting-your-scene/how-to-optimize-your-scene.md

Por búsqueda web (resumen, página no abierta):
- mapcn docs: https://mapcn.vercel.app/docs y https://mapcn.vercel.app/docs/installation
- Spline V2: https://blog.spline.design/spline-v2 , https://updates.spline.design/changelog/introducing-spline-v2
- Spline eventos y scroll: https://docs.spline.design/interaction-states-events-and-actions/events/scroll-event.md , https://updates.spline.design/changelog/follow-and-look-at-event-enhancements , https://designcode.io/spline-ui-scroll-interaction/
- Spline exports: https://docs.spline.design/exporting-your-scene/files/exporting-image-sequences.md , https://docs.spline.design/exporting-your-scene/files/exporting-as-gtlf-glb.md , https://docs.spline.design/exporting-your-scene/web/exporting-as-spline-viewer.md
- Spline rendimiento (terceros): https://webdesign.tutsplus.com/how-to-optimize-spline-3d-scenes-for-speed-and-core-web-vitals--cms-108749a , https://dev.to/tolumen/optimizing-web-performance-how-lazy-loading-spline-assets-took-our-build-from-30-to-90-in-4ne2 , https://webflow.com/integrations/spline
- Spline accesibilidad (terceros): https://design.verdigris.co/categories/3d-and-spline/guidelines , https://21st.dev/blog/spline-3d-scenes-react
- CARTO: https://docs.carto.com/faqs/carto-basemaps , https://carto.com/legal/basemap-terms/ , https://www.carto.com/basemaps/apikey/
- MapLibre CSP y v6: https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/
- PMTiles / Protomaps: https://til.simonwillison.net/gis/pmtiles , https://protomaps.com/faq , https://blog.apps.npr.org/2024/11/26/slippy-maps.html
- Accesibilidad de mapas: https://sharedcontext.ai/skills/external/mgifford/maps , https://www.esri.com/arcgis-blog/products/js-api-arcgis/mapping/supporting-reduced-motion-enhancing-accessibility-in-web-apps

---

## Resumen (por valor/costo)

1. **Mapa estático SVG de la llegada en Visita** (Matamoros entre Aldama y Rayón, pin en el 421, colores de tokens claro/oscuro, enlaza a «Cómo llegar», «© OpenStreetMap»): ≈ 0,5–1 día, 0 JS, sin riesgo de CSP, LCP ni INP. Es lo que hace la portada de mapcn: imágenes, no WebGL.
2. **Una sola «ruta que avanza» en ese SVG** (`stroke-dashoffset`, duración de token, plana con movimiento reducido): +0,5 día, inspirada en `RouteProgress`.
3. **Mapa interactivo solo si se pide de verdad:** MapLibre 6 en vanilla + PMTiles del recorte, todo local, diferido al acercarse, `cooperativeGestures`, sin `essential` ni geolocalización. ≈ 460 KB gzip y 3–5 días; antes, confirmar que Cloudflare sirve peticiones con rango.
4. **mapcn tal cual: no.** React, Tailwind, CARTO, unpkg y OSRM chocan con la CSP y con «sin dependencias». Sus términos de CARTO tampoco coinciden entre fuentes.
5. **Spline como runtime: no.** 600 KB a 1 MB gzip, WASM, URLs externas fijas, sin movimiento reducido ni accesibilidad, licencia propietaria, marca de agua en el plan gratis, y una escena de la casa sería una recreación (`PRODUCT.md`).
6. **De Spline, solo la idea:** «Look At» ya existe en la profundidad del Carrusel3D. No hace falta más 3D.
7. **Pendiente de verificar:** docs.spline.design, mapcn.dev y CARTO estaban bloqueados en esta sesión. Los términos de CARTO y Spline y el tamaño del PMTiles no se confirmaron. *(Actualizado el 2026-11-14: Spline y su documentación ya se verificaron en vivo; siguen pendientes la portada de mapcn, los términos de CARTO, la galería y el visor de Spline y el tamaño del PMTiles. Ver «Verificación en vivo».)*

---

## Verificación en vivo (2026-11-14)

**Qué se abrió:** `spline.design` (portada en Chromium, `/pricing`, `/terms`, `/llms.txt`, `/web.md`, `/examples.md`) y `docs.spline.design` (`llms.txt`, `llms-full.txt` y las páginas `.md` del evento Scroll, Viewer, código, autoalojado, vídeo, secuencia de imágenes, GLTF, Look At y optimización). Capturas en el scratchpad de la sesión (`investigacion-ui/vivo/spline-home.png`). **No se pudo abrir:** `www.mapcn.dev` (destino del 307 de `mapcn.dev`; el proxy lo rechaza, reintentado a los 30 s), `community.spline.design`, `app.`, `my.` y `prod.spline.design`, `carto.com` y `docs.carto.com`.

**Correcciones:**

1. **Autoalojar Spline sin CDN cuesta un plan Enterprise.** El export «Self-Hosted» (runtime, WASM y escena en un ZIP, sin peticiones externas) solo existe en Enterprise; descargar el export de código pide Pro. Refuerza el «no» de la recomendación 5: la única vía compatible con la CSP es el plan más caro.
2. **Precios exactos:** Hobby 12 USD por asiento al mes (anual) o 15 (mensual); Pro 25/30; Max 60/70; Free con marca de agua. El «12 a 15» del informe eran los dos precios del mismo plan.
3. **Evento Scroll:** el tipo que sigue el desplazamiento de la página es «Scroll», y es ese el que solo funciona con el export Viewer; «Steps» es otra cosa (la cantidad de desplazamiento por transición).
4. **Salidas:** la secuencia de imágenes es JPG o PNG a 15, 24, 30, 48 o 60 fps (confirmado); WebM y GIF no aparecen en la documentación; Vue y Svelte no tienen paquete oficial.
5. **Licencia de la comunidad:** la documentación y `llms.txt` dicen CC BY 4.0; los términos, «Standard Commercial License». Contradicción anotada; las dos permiten uso comercial.
6. **Términos del 2026-10-29:** sin licencia del runtime (se mantiene «propietario») y con licencia a Spline sobre datos desidentificados para entrenar modelos.
7. **«Tres escenas por página»** no es una regla oficial de Spline; viene de terceros.

**Confirmado sin cambios:** escena publicada en `prod.spline.design/<id>/scene.splinecode`; WebGPU con WebGL de respaldo; Viewer como componente web con carga diferida por omisión; eventos Distance, State Change, Variable Change y Game Controls; ninguna mención de movimiento reducido ni accesibilidad en toda la documentación; ejemplos oficiales en registro de objeto juguete.

**Sigue pendiente:** la portada de mapcn (la afirmación «capturas, no WebGL» sale del código, mismo commit `b243a4d`), los términos y cuotas de CARTO, el aspecto real de la galería y el comportamiento del visor (sin escena renderizada) y el tamaño del PMTiles del recorte.

**Técnicas de la portada de Spline aplicables a Itinerante:**

- **Respeta el movimiento reducido en todo su marketing:** 15 animaciones CSS infinitas con movimiento normal y 0 con movimiento reducido. Itinerante ya pide lo mismo. La forma de medirlo, contar `document.getAnimations()` con `iterations === Infinity` bajo movimiento reducido emulado, es una comprobación barata para `tools/qa/motion.mjs`.
- **Titular con palabras de enlace atenuadas** («The **3D design** tool for / your **team** and **agents**»: los sustantivos en blanco y los conectores en gris, Geist 48 px, peso 450, tracking −0,06 em). Es pariente del patrón «Nombre *frase*» de nuestros titulares. No hace falta nada nuevo.
- **No aplicable:** la maqueta del editor con escena viva (WebGL de `prod.spline.design`) y el cuadro de prompt; son producto, no lectura.

**¿Cambia alguna recomendación?** No. Las siete del resumen se mantienen. La 5 (Spline como runtime: no) queda más firme por la corrección 1.

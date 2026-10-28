# Crítica y especificación de diseño · «Casa editorial» (local, 27 oct 2026)

Objeto: build local en `http://127.0.0.1:5087/` (carpeta `casa-editorial/x/public`), sin commit ni deploy. Producción (`libreria-itineranteymas.web.app`) solo como referencia.
Método: Laws of UX + catálogo de tells de «AI slop». Capturas Playwright 1440×900 y 390×844 en `shots/`, métricas en `capture-report.json`, axe-core 4.x.
Regla de hechos: todo dato del negocio que no está en `PRODUCT.md` o en las fotos oficiales va marcado **por confirmar con Aldo**.
No se tocó código, no se hizo commit ni deploy. El servidor ya estaba arriba; no se levantó ni se detuvo ninguno.

---

## 1. Veredicto

La página es correcta, accesible y rápida en escritorio, pero no es la librería. Es una plantilla de landing premium (hero oscuro con velo, polaroid inclinada, dos botones píldora, zigzag de imagen y texto) vestida con una paleta menta que no existe en el local. El elemento más grande de la pantalla es una recreación generada sin rótulo; las fotos reales, que son lo único verdaderamente propio, aparecen a 224–390 px y repetidas. El «recorrido cinematográfico» se agota en un tercio de pantalla y, en escritorio, el fondo apenas cambia. El copy está construido casi entero en tríadas.

Lo que sí funciona y hay que conservar: horario y dirección arriba del pliegue, WhatsApp como acción principal, targets ≥44 px, foco visible, 0 violaciones axe, `prefers-reduced-motion` respetado, interruptor de movimiento propio.

## 2. Scorecard (1 a 5)

| Área | Nota | Motivo corto |
|---|---|---|
| Identidad del negocio | 1.5 | Nada en la forma viene del local: ni piedra, ni damero, ni cajas turquesa, ni papel picado, ni la camioneta del logo |
| Inmersión / recorrido | 2 | El scrub se consume en 0–32vh, velo al 92 %, fondo casi estático en escritorio |
| Copy y microcopy | 2 | al menos 11 tríadas, enumeraciones-lema o aforismos (catálogo §5); afirmaciones sin verificar (café, «historia») |
| Fotografía | 2 | Generado a sangre, real en miniatura; 3 fotos usadas dos veces |
| Tipografía y color | 2 | Playfair + Inter + menta/tinta verde: la combinación por defecto de 2024–2026 |
| Ritmo y layout | 2 | La misma cabecera partida `1fr .65fr` y el mismo zigzag `1.3fr .8fr` en todas las secciones |
| Motion | 2 | Todo `ease`, 180/240/360 ms, sin metáfora material |
| Accesibilidad básica | 4 | 0 violaciones axe; 7–9 nodos «incomplete» por texto sobre imagen; un enlace duplicado |
| Rendimiento | 3 | 529 KiB inicial escritorio, pero 13 266 KiB al recorrer (MP4 de 4,7 MB); móvil 475 / 3 256 KiB; Lighthouse móvil 86 (autorreportado) |
| Utilidad práctica | 4 | Horario, dirección con entrecalles, WhatsApp y cómo llegar están claros |

## 3. Hallazgos (4 P0 · 8 P1 · 8 P2)

| ID | Sev. | Hallazgo | Evidencia | Ley UX |
|---|---|---|---|---|
| F01 | P0 | Recreaciones generadas a sangre, sin rótulo, junto a una foto real: el visitante no puede saber qué es la casa | `index.html:70-78`, `css:66-72`; `shots/cmp-01-generado-vs-real.png` | Jakob (expectativa de foto = lugar), confianza |
| F02 | P0 | El recorrido no se percibe: 7 frames en 0–32vh, velo .92/.65/.40, y en escritorio el MP4 (z-index 1) tapa los frames; de 45vh a 100vh solo queda fondo oscuro | `js:65`, `css:70-72`, `css:103`; `shots/cmp-03-recorrido-se-quema.png`, `desktop-hero-scroll-045vh.png` | Peak-end, Doherty |
| F03 | P0 | Hero de plantilla: H1 en tríada + 2 píldoras + polaroid a 2deg + velo oscuro | `index.html:90-99`, `css:87-92`; `desktop-00-fold.png` | Von Restorff (nada destaca porque todo es genérico) |
| F04 | P0 | Paleta y tipos ajenos al lugar: menta #5dc4b4 / tinta verde #061a18 frente a piedra, terracota, damero y turquesa reales | `DESIGN.md` tokens, `index.html:24-26`; `shots/cmp-02-paleta-sitio-vs-casa.png` | Estética-usabilidad |
| F05 | P1 | Copy en tríadas y aforismos de relleno | ver catálogo §5, líneas 90, 91, 113, 122, 130, 143, 149-152, 168, 189 | Carga cognitiva |
| F06 | P1 | «Itinerante» nunca se explica; la camioneta del logo no se usa en ningún otro lugar | `index.html:46`; todas las secciones | Jakob, memoria |
| F07 | P1 | Fotos repetidas y en miniatura: sala ×2, mesa ×2, rincón ×2; estantes a 224 px, encuentro a 390 px; la galería queda dispareja | `index.html:98,118,130,162-167`; `desktop-sec-galeria.png`, `mobile-sec-galeria.png` | Ley de la región común, Prägnanz |
| F08 | P1 | Secciones intercambiables: mismo esqueleto en Experiencia, Agenda, Galería y Visita | `css:107,109,117,137`; `desktop-full.png` | Similitud (todo pesa igual) |
| F09 | P1 | Agenda sin una sola fecha, foto ni persona; cuatro descripciones abstractas | `index.html:143-152`; `desktop-sec-eventos.png` | Goal-gradient (no hay siguiente paso concreto) |
| F10 | P1 | Afirmaciones sin verificar: «café» (líneas 6, 8, 91, 113, 134), «Rincones con historia» (165), «Libros curados» (91) | `index.html` | Confianza |
| F11 | P1 | Cierre con iframe gris de Google, interfaz en inglés («Open in Maps») | `index.html:184`; `desktop-sec-ubicacion.png` | Peak-end (la última escena es de Google, no de la casa) |
| F12 | P1 | Scrub de vídeo por `currentTime` en cada rAF + MP4 de 4 715 334 bytes tras el primer scroll | `js:111-128`, `js:151-158`; `capture-report.json` | Doherty |
| F13 | P2 | Motion genérico: `ease` en todo, 180/240/360 ms, `scroll-behavior: smooth` global | `css:9,56,67,70,155` | |
| F14 | P2 | Atributo que expone la herramienta: `data-canonical-model="claude-cinematic-higgsfield"` | `index.html:33` | |
| F15 | P2 | Enlace duplicado: flecha del retrato y «Conoce la casa» van a `#experiencia` (tab extra) | `index.html:99,103`; `desktop-focus-*.png` | Hick |
| F16 | P2 | 14 iconos de flecha (10 `arrow-ne`, 4 `arrow-right`), uno en cada enlace | `index.html` | Von Restorff |
| F17 | P2 | Texto del hero en móvil ≈4,35:1 en el borde derecho sobre el frame (medido en píxeles); axe marca 7–9 «incomplete» | `mobile-00-fold.png` | Accesibilidad |
| F18 | P2 | Con movimiento reducido los frames siguen cambiando por corte seco al hacer scroll | `mobile-reduced-scroll-050vh.png` | |
| F19 | P2 | Pies de foto huecos: «Una invitación a mirar de cerca.», «La conversación también tiene lugar.» | `index.html:118,165` | |
| F20 | P2 | Footer sin horario ni dirección, con lema en tríada | `index.html:189-193`; `desktop-sec-site-footer.png` | Serial position |

Detalle y propuesta por hallazgo P0:

**F01 · Procedencia.** `PRODUCT.md` dice que los frames son recreaciones y que solo lo documental se llama «foto real», pero en pantalla no hay ninguna etiqueta. El fondo del hero (1440 px, generado) es más grande y más «fotográfico» que la foto real (334 px). Los frames `05-talleres-ajedrez` y `06-comunidad-sonido` muestran un tablero de ajedrez y un gong que no aparecen en ninguna foto oficial (**por confirmar con Aldo** si existen). Si alguien llega buscando ese pasillo, no lo encuentra: rompe la inmersión en la vida real, que es la única que importa para una librería física.
Propuesta: sacar las recreaciones del hero. El hero usa una foto oficial (mesa o rincón, las únicas a 1600 px). Si Aldo quiere conservar alguna recreación, va en un bloque aparte con rótulo visible «Recreación, no es foto del local».

**F02 · Recorrido.** `frameStops=[0,.14,.25,.38,.5,.62,.71]` sobre un spacer de 38svh deja los 7 cambios en ~290 px de scroll. El velo pinta 92 % de tinta a la izquierda, justo donde está el texto, así que el frame casi no se ve. En escritorio el vídeo, una vez listo, se pone encima de los frames (`css:70-71`); en la captura headless el fondo es idéntico de 0 a 32vh (verificar en Chrome real, el seek headless puede no repintar). Resultado: 13 MB para un efecto que el ojo no registra.
Propuesta: quitar el scrub. Inmersión por secuencia de fotos reales a buen tamaño, cada una con su escena (ver direcciones).

**F03 · Hero de plantilla.** La composición texto-izquierda / imagen-derecha inclinada / dos botones es intercambiable con cualquier cafetería o coworking. Nada dice Monterrey, Matamoros, piedra o camioneta.
Propuesta: el primer plano es el lugar (foto real grande, sin velo) y el dato duro (dirección con entrecalles y horario) como composición tipográfica propia, no como fila de metadatos.

**F04 · Paleta.** Muestreo median-cut de las seis fotos oficiales: sombra #251f1a, piedra #5c453b y #916e5b, terracota #a95a28, mantel #d19027, caja turquesa #178999, papel picado #b64a55, cal #d3baac. El sitio usa menta #5dc4b4 (2,04:1 sobre marfil, inservible para texto) y tinta verde. La menta viene del logo; se puede conservar como acento de marca, no como atmósfera.

## 4. Crítica por sección

**Nav (`index.html:49-57`, `css:50-56`).** Barra tinta de 76 px, píldoras menta en el activo, «Consultar por WhatsApp» como botón contorno. Funciona (scrollspy correcto, 44 px). Es la nav de cualquier plantilla. Propuesta: etiquetas con el vocabulario del lugar solo si ayudan («Agenda», «Visita» ya están bien); el estado activo como subrayado de tinta, no píldora. Móvil: panel limpio (`mobile-nav-open.png`), animación 180 ms correcta.

**CTAs.** «Escríbenos por WhatsApp», «Cómo llegar», «Consultar por WhatsApp», «Pregunta por un libro», «Consultar próxima fecha»: cinco formas de decir WhatsApp. Bien que sea la acción principal; mal que todas lleven la misma flecha NE. Propuesta: un solo verbo consistente y la flecha solo en enlaces externos.

**Hero y recorrido.** Ver F01–F03. Además: `min-height:3.12em` en el H1 (`css:83`) reserva aire vacío; la cinta ámbar de progreso (`css:74`) mide algo que ya terminó; «Conoce la casa» y el botón «Reducir movimiento» flotan sobre el fondo vacío entre 24 y 70vh (`desktop-hero-scroll-045vh.png`).

**Experiencia (`index.html:112-136`).** «Cuatro maneras de habitar la librería» promete cuatro y muestra dos bloques. Zigzag imagen/texto `1.3fr .8fr` y su reverso. Las fotos mesa y rincón son buenas y aquí sí están grandes; luego se repiten en Galería.

**Agenda (`index.html:143-152`).** La sección más útil para volver y la más vacía: cuatro nombres reales de taller con descripciones abstractas (F09). Honesta en «publicamos fechas solo cuando están confirmadas», pero sin enlace a la última sesión ni a quien la imparte (**por confirmar con Aldo**).

**Galería (`index.html:158-168`).** «La casa, tal como es.» es el mejor título de la página porque es verdad. La rejilla de 12 columnas con fotos a tamaño nativo deja huecos irregulares y un aforismo suelto («Cada rincón, otra forma de quedarse.») rellenando el hueco. Tres de seis fotos ya se vieron.

**Visita (`index.html:173-184`).** Datos excelentes (entrecalles Aldama y Rayón, horario, festivos por WhatsApp). Título «Tu próxima lectura está en el Centro.» es eslogan. Mapa: F11.

**Footer (`index.html:189-193`).** Lema en tríada, sin horario ni dirección. En móvil es lo último que se ve.

**Tipografía.** Playfair 600 a 76 px / 40 px, cursiva menta en «y volver.»: el gesto «palabra en cursiva de color» es un tell. Inter 16 px cuerpo, 14 px pies. Jerarquía clara, carácter nulo.

**Color.** Ver F04 y `cmp-02`. Texto muted #3d6660 sobre marfil 6,26:1 (bien); ámbar #e8a020 sobre marfil 2,16:1 (solo decoración, el anillo de foco se salva por la sombra tinta de 6 px).

**Ritmo.** Alternancia oscuro / claro / verde / claro / oscuro sin relación con el contenido. Todas las secciones abren con la misma cabecera partida.

**Fotografía.** Ver F01, F07. Las fotos oficiales tienen un color fuerte y cálido; el velo verde y los marcos blancos las enfrían.

**Motion.** Transiciones de 180–360 ms con `ease` (F13). Scroll-jacking: no hay secuestro real del scroll (bien), pero el spacer de 38svh crea tramo muerto. Rendimiento: F12.

**Estados.** Hover de nav y botones correcto (`desktop-hover-*.png`). Foco: anillo ámbar 3 px + sombra tinta (`desktop-focus-08.png`), visible en todos los fondos. Skip link funciona.

**Móvil.** Hero de 1027 px (más alto que la pantalla de 844), la polaroid se corta abajo en el pliegue; la foto sala (390 px de origen) se muestra a 226 px CSS en pantalla 2x, se ve blanda. Galería en una columna con miniaturas de 165 px.

**Accesibilidad.** 0 violaciones axe en ambos viewports. F15, F17. El interruptor de movimiento usa `aria-pressed` y se desactiva si el sistema ya reduce movimiento (bien).

## 5. Catálogo de tells de AI slop

| # | Tell | Texto o selector exacto | Ubicación | Captura |
|---|---|---|---|---|
| T1 | Tríada en H1 | «Una casa para leer, conversar y volver.» | `index.html:90` | `desktop-00-fold.png` |
| T2 | Tríada en bajada | «Libros curados, café para quedarse y talleres» | `index.html:91` | `desktop-00-fold.png` |
| T3 | Anglicismo de plantilla | «Libros curados» / «selección curada» | `index.html:91`, `:6` | |
| T4 | Enumeración-lema | «Libros, café, agenda y comunidad dentro de una casa cultural» | `index.html:113` | `desktop-sec-experiencia.png` |
| T5 | Tríada material | «Piedra, madera y libros. Los detalles de la casa.» | `index.html:130` | `desktop-sec-experiencia.png` |
| T6 | Tríada en H2 | «Talleres, lecturas y conversación.» | `index.html:143` | `desktop-sec-eventos.png` |
| T7 | Descripciones abstractas en serie | «Voz, imagen, ritmo y estructura…», «Series visuales con intención, mirada y relato.» | `index.html:149-152` | `desktop-sec-eventos.png` |
| T8 | Verbo «descubrir» | «Una mesa para descubrir lecturas.» | `index.html:163` | `desktop-sec-galeria.png` |
| T9 | Aforismo de relleno | «Cada rincón, otra forma de quedarse.» | `index.html:168` | `desktop-sec-galeria.png` |
| T10 | Frase-póster | «Una lectura puede empezar aquí.» / «Tu próxima lectura está en el Centro.» | `index.html:121,173` | |
| T11 | Lema de footer | «Literatura, cultura y comunidad.» | `index.html:189` | `desktop-sec-site-footer.png` |
| T12 | Hero oscuro con velo degradado | `.scroll-scrub__veil { linear-gradient(90deg, rgba(6,26,24,.92)…) }` | `css:72` | `desktop-00-fold.png` |
| T13 | Polaroid inclinada | `.house-portrait { transform: rotate(2deg) }` + borde 8 px | `css:92` | `desktop-00-fold.png` |
| T14 | Palabra en cursiva de color | `<em>y volver.</em>` en menta | `index.html:90` | |
| T15 | Botones píldora + flecha NE en todo | `.button`, `icon-arrow-ne` ×10 | `css:87`, `index.html` | `desktop-hover-cta-*.png` |
| T16 | Zigzag simétrico | `.editorial-spread 1.3fr .8fr` / `--reverse .8fr 1.3fr` | `css:109,117` | `desktop-sec-experiencia.png` |
| T17 | Cabecera partida repetida | `.section-heading 1fr .65fr` | `css:107` | todas |
| T18 | Par tipográfico por defecto | Playfair Display + Inter | `index.html:24-26` | |
| T19 | Imagen generada fotorrealista como lugar | `05-talleres-ajedrez.webp`, `06-comunidad-sonido.webp` | `index.html:70-78` | `cmp-01` |
| T20 | Nombre de clase heredado | `.button--glass` (ya no es vidrio) | `css:90` | |
| T21 | Huella de la herramienta | `data-canonical-model="claude-cinematic-higgsfield"` | `index.html:33` | |

No se encontraron: estadísticas falsas, testimonios inventados, glassmorphism real, em dashes en el copy. Bien.

## 6. Direcciones de arte

Restricciones comunes: solo fotos oficiales (o nuevas fotos reales que Aldo entregue); ninguna imagen generada que represente el local; motion solo con `transform` y `opacity`; con `prefers-reduced-motion` todo queda estático y legible, sin scrub. Contrastes medidos con la fórmula WCAG 2.x.

### A · «Pliego y tinta» (taller de imprenta y papel picado)

**Concepto.** La página como un pliego impreso en el Centro: cartel de agenda, tipómetro, papel picado recortado. Toma el papel picado y el mantel naranja que ya existen en `oficial-mesa-compartida`.
**Tipos.** Libre Caslon Display + Libre Caslon Text (OFL, Impallari Type) para titulares y lectura; IBM Plex Mono (OFL) solo para horario, dirección y fechas, como pie de imprenta.
**Paleta.**

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| papel | #f3ead8 | fondo | |
| tinta | #1f1a17 | texto | 14,42:1 sobre papel |
| terracota | #9a4a24 | enlaces, titulares secundarios | 5,20:1 sobre papel |
| turquesa caja | #12707c | acento, foco | 4,83:1 sobre papel |
| piedra | #6b5a4c | texto secundario | 5,50:1 sobre papel |
| picado | #b64a55 | solo ≥24 px o decoración | 4,29:1 (no apto texto chico) |
| mantel | #d19027 | solo sobre tinta | 6,34:1 sobre tinta; 2,27:1 sobre papel, nunca texto ahí |

**Textura.** Grano de papel (PNG 4 % opacidad, <15 KiB), bordes de papel picado en SVG recortado, filetes de imprenta.
**Foto.** Recorte 3:2 y 4:5, sin velo, balance de blancos unificado, marco de margen de imprenta (no polaroid). Secuencia: mesa → rincón → estantes → mesa compartida.
**Motion tokens.** `--dur-tinta: 220ms`, `--dur-pliego: 420ms`, `--ease-pliego: cubic-bezier(.65,0,.35,1)`; entradas `translateY(12px)→0` + `opacity 0→1`. Reducido: sin desplazamiento, opacidad instantánea.
**Estructura.** 1) Portada: foto mesa grande + pie de imprenta con dirección y horario. 2) Cartel de agenda: los cuatro talleres como cartel tipográfico. 3) Pliego de fotos. 4) Colofón: visita y mapa estático.
**Interacción firma.** La tira de papel picado del borde superior se mece 2deg (`rotate`) al pasar el cursor o al hacer scroll, y se queda quieta con movimiento reducido.
**Microcopy.**
- «Mariano Matamoros Pte. 421, entre Juan Aldama e Ignacio Rayón.»
- «Lunes a sábado, de 11:00 a 20:00. Domingo cerrado.»
- «Escritura creativa · Círculos de lectura · Teatro gestual · Fotografía narrativa. Fechas en Instagram cuando estén confirmadas.»
- «¿Buscas un título? Mándanos el nombre por WhatsApp.»
**Riesgos.** Folclorizar (papel picado como disfraz); Caslon puede leerse «colonial» si no se equilibra con la foto. Necesita confirmar que el papel picado es permanente y no de una fecha (**por confirmar con Aldo**).

### B · «Cuaderno de margen» (marginalia sobre fotos documentales) · RECOMENDADA

**Concepto.** La página es el cuaderno de alguien que conoce la casa: fotos reales grandes, y en el margen notas cortas que señalan lo que hay en cada foto (el damero, las cajas turquesa, el papel picado). La inmersión sale de mirar de cerca lo real, no de una película.
**Tipos.** Alegreya + Alegreya Sans (OFL, Huerta Tipográfica). Notas al margen en Alegreya Italic; si Aldo entrega letra manuscrita real de alguien de la librería, se usa escaneada solo en 3–4 notas (**por confirmar**). Nada de fuentes «manuscritas» genéricas.
**Paleta.**

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| hoja | #f6f1e7 | fondo | |
| grafito | #2b2622 | texto | 13,30:1 sobre hoja |
| lápiz rojo | #a33a2a | notas, enlaces | 5,84:1 sobre hoja |
| turquesa | #0f6b75 | foco, acento (eco de las cajas) | 5,52:1 sobre hoja |
| piedra | #6e6155 | texto secundario | 5,32:1 sobre hoja |
| ocre subrayado | #e0b357 | resaltado detrás del texto, nunca texto | 1,73:1 (decorativo) |
| menta logo | #5dc4b4 | solo el logo | |

**Textura.** Papel de cuaderno sin rayas, una línea de margen vertical en lápiz rojo; numeración de notas en superíndice.
**Foto.** Grande y sin velo. Las de 1600 px (mesa, rincón) a ancho completo de columna; las chicas (sala 390, encuentro 390, estantes 224, mesa compartida 397) como fichas pegadas a su tamaño honesto (máx. 1,25× en pantalla 1x), con número y nota. Nunca escaladas para llenar. Secuencia: rincón (piedra) → sala (damero) → mesa → estantes (turquesa) → encuentro → mesa compartida (papel picado).
**Motion tokens.** `--dur-nota: 220ms`, `--dur-pagina: 360ms`, `--ease-lapiz: cubic-bezier(.2,.7,.2,1)`. Nota entra con `opacity 0→1` + `translateX(-8px)→0` cuando la foto llega al 40 % del viewport (IntersectionObserver, sin scrub). Reducido: notas visibles desde el inicio.
**Estructura.** 1) Portada: rincón a gran tamaño + dirección y horario escritos como encabezado de cuaderno. 2) Recorrido: 6 fotos con notas al margen (esto reemplaza el scrub y la galería repetida). 3) Agenda: lista de los cuatro talleres como índice del cuaderno, con espacio para fecha que se llena solo cuando hay fecha. 4) Visita: ficha con horario, entrecalles y enlace a Maps; mapa estático o ilustrado, sin iframe al cargar.
**Interacción firma.** Tocar o pasar sobre una nota aclara la zona de la foto que señala (capa de `opacity` sobre el resto) y numera la nota; en teclado, cada nota es un botón con foco.
**Microcopy.**
- Nota 1, sobre `oficial-sala`: «El piso de damero de la sala.»
- Nota 2, sobre `oficial-estantes`: «Los libros viven en cajas pintadas de turquesa.»
- Nota 3, sobre `oficial-mesa-compartida`: «Papel picado sobre la mesa larga.»
- Portada: «Matamoros 421, entre Aldama y Rayón. Abrimos de lunes a sábado, de 11:00 a 20:00.»
- Agenda: «Escritura creativa, círculos de lectura, teatro gestual y fotografía narrativa. Te avisamos la fecha por WhatsApp o Instagram cuando esté confirmada.»
**Riesgos.** Si las notas se vuelven poéticas, regresa el slop: cada nota describe algo visible en la foto, nada más. Cuatro fotos son de baja resolución; la dirección funciona con ellas, pero gana mucho con originales (**por confirmar**).

### C · «Ruta itinerante» (cartografía) · BLOQUEADA hasta confirmar la historia

**Concepto.** El nombre y la camioneta del logo sugieren una librería que viajó antes de quedarse en Matamoros 421. La página sería un mapa de esa ruta.
**Tipos.** Barlow Condensed (OFL, inspirada en señalética vial) + Source Serif 4 (OFL).
**Paleta.** papel mapa #efe6d2; tinta ruta #23303a (10,88:1); sello rojo #a8382c (5,18:1); turquesa #136f7b (4,72:1); gris camino #5f5a50 (5,52:1); ocre carretera #c9922e solo sobre tinta (4,91:1).
**Textura.** Papel de mapa plegado, curvas de nivel finas, sellos de tinta.
**Foto.** Fotos reales como paradas de la ruta, recorte cuadrado, sin velo.
**Motion tokens.** Marcador de camioneta que avanza con `translateX` por un trazo fijo, `--dur-parada: 420ms`, `--ease-ruta: cubic-bezier(.3,.6,.2,1)`. Reducido: ruta completa estática.
**Estructura.** Origen → paradas → la casa de Matamoros → agenda → visita.
**Interacción firma.** La camioneta del logo recorre el trazo hasta el pin de Matamoros 421.
**Microcopy.** Solo posible con datos reales de la ruta: hoy solo «Mariano Matamoros Pte. 421, Centro, Monterrey» es seguro.
**Riesgos.** Sin historia confirmada sería inventar. Es la más memorable si la historia existe.

**Recomendación.** B como base, ya, porque se construye solo con lo que hay: seis fotos reales, dirección, horario y cuatro talleres. Tomar de A la paleta terracota/turquesa y una sola tira de papel picado si Aldo confirma que es permanente. C se reconsidera si Aldo cuenta la historia de la camioneta.

## 7. Orden de implementación y criterios de Done

| # | Trabajo | Hallazgos | Done |
|---|---|---|---|
| 1 | Procedencia: quitar recreaciones del hero; si alguna se queda, rótulo visible «Recreación» | F01, F14 | Ninguna imagen generada visible sin rótulo; `grep data-canonical-model` = 0 |
| 2 | Pase de copy con hechos | F05, F10, F19, F20 | 0 tríadas en H1/H2/pies (lista §5 cerrada); 0 «descubrir», «curados», «historia»; «café» solo si Aldo lo confirma |
| 3 | Tokens de la dirección B | F04, F13, F16 | Todos los pares texto/fondo ≥4,5:1 medidos; sin Playfair ni Inter; flecha solo en enlaces externos |
| 4 | Hero y recorrido con fotos reales | F02, F03, F12, F17, F18 | Sin MP4 ni frames generados; peso inicial móvil ≤600 KiB y total ≤1,5 MB; LCP es una foto oficial; sin spacer muerto; texto nunca sobre foto sin fondo sólido |
| 5 | Sistema de fotos | F07 | Cada foto oficial aparece una vez; ratio renderizado/natural ≤1,25 (script sobre `naturalWidth`) |
| 6 | Layout por sección | F08, F09 | Ninguna sección repite la plantilla de grid de otra; la agenda muestra fecha o el texto «Sin fecha confirmada» |
| 7 | Visita y footer | F11, F20 | Sin iframe al cargar (mapa estático o al hacer clic, `hl=es`); footer con horario y dirección |
| 8 | Pulido a11y | F15 | Un solo enlace a `#experiencia` en el hero; axe 0 violaciones; incomplete solo el iframe |
| 9 | Historia «Itinerante» | F06 | Solo con texto aprobado por Aldo |

## 8. Preguntas abiertas para Aldo

1. ¿De dónde viene «Itinerante»? ¿La camioneta del logo existió o existe?
2. ¿Hay tablero de ajedrez y gong en la librería? (aparecen en recreaciones `05` y `06`, no en fotos)
3. ¿Conservamos alguna recreación generada? Si sí, ¿con rótulo visible?
4. ¿Hay originales más grandes de sala, encuentro, estantes y mesa compartida, o fotos nuevas con personas y talleres (con permiso)?
5. ¿Hay servicio de café? El copy lo afirma cinco veces.
6. ¿Quién imparte cada taller y cuál fue la última fecha de cada uno?
7. ¿El papel picado y el mural de la mesa compartida son permanentes? ¿Quién pintó el mural?
8. ¿Qué historia tiene la casa (año, uso anterior)? Hoy «Rincones con historia» no tiene respaldo.
9. ¿Qué días festivos cierran? (hoy solo «confírmalo por WhatsApp»)
10. ¿Alguien de la librería puede escribir a mano 3–4 notas para escanear (dirección B)?

## 9. Capturas clave

- `shots/cmp-01-generado-vs-real.png` · procedencia
- `shots/cmp-02-paleta-sitio-vs-casa.png` · paleta
- `shots/cmp-03-recorrido-se-quema.png` · recorrido
- `shots/desktop-00-fold.png`, `shots/mobile-00-fold.png`, `shots/mobile-nav-open.png`
- `shots/desktop-sec-*.png`, `shots/mobile-sec-*.png` (recortadas de la captura de página completa)
- `shots/*-focus-*.png`, `shots/desktop-hover-*.png`, `shots/*-reduced-*.png`

Nota de captura: el mapa de Google sale gris en escritorio headless (tiles no cargados); en móvil sí cargó. El seek del vídeo en headless puede no repintar; F02 se sostiene igual por el velo y los `frameStops`.

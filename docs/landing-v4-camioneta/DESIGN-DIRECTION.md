# Itinerante · Dirección de diseño v4.2 (fase de diseño, sin código de producción)

22 nov 2026, 15:40 (hora de Monterrey, UTC−6). **Revisión v4.1, 16:20 (hora de Monterrey):** aplica la crítica de diseño (P0-1, P1-1..4, P2 1–8) y de la segunda crítica de diseño (C1–C9) y las decisiones de Aldo (Barlow en todo; «Merch y talleres: próximamente.» como una línea; el movimiento se mejora, nunca se quita). Detalle y mediciones en §9, ronda 3. **Revisión v4.2, 22 nov 2026 (hora de Monterrey):** pedido de Aldo tras ver la v4.1: (1) la camioneta centrada en la Portada; (2) el carrusel se llama «Destacados» (sin la palabra «Tienda»), solo libros destacados; (3) la tienda de productos queda como **esqueleto honesto** «Próximamente»; (4) debajo de Destacados va el **catálogo completo** con búsqueda y filtros, con la plantilla del catálogo de la biblioteca (`Aldo14G/biblioteca-ecrmnl`, ver §6b); (5) el movimiento se mejora, nunca se quita. Mediciones en §9, ronda 4. La v4.1 queda en `DESIGN-DIRECTION.v41.md` y `prototipo-v41/`. Encargo original: rehacer la arquitectura UI **antes** de tocar el repo, revisando Awwwards y usando Impeccable.
No se tocó el repo ni se abrió PR. No se publicó ni envió nada. Todo vive en `/workspace/projects/itinerante-design-2026-11-22/`.

> **Autoridad de método:** la copia íntegra de Impeccable v4.9.0 en la guía local de diseño (SKILL.md + `reference/*.md`). El público `pbakaus/impeccable` (v4.10.0, leído antes en `_ref/impeccable/`) solo sirvió de contraste.
> **Launcher unavailable:** no se ejecutó `scripts/impeccable` (descarga un binario). Por eso no corrieron `context`, `concept-seed`, `detect`, `shot` ni `motion-capture`. Se aplicó la ruta «Launcher unavailable» de SKILL.md. Se leyeron PRODUCT.md y DESIGN.md del repo (rama `agent/claude/secciones-v3`, vía `gh api`). Los pasos 1–3 de `new-work.md` se hicieron a mano, con `seed: none (unavailable)`. Las capturas salieron de Playwright y la revisión de accesibilidad de axe-core.

---

## 0. Resumen (5 líneas)

1. Diagnóstico: v1–v3 fallaron por **mundo**, no por detalle. Usaban Inter como display, «suelo blanco + turquesa» al modo Apple y secciones de tarjetas iguales. En v2 el movimiento se trató como pecado y el resultado salió intercambiable con cualquier landing.
2. Dirección nueva, **«La camioneta»**: el trazo a mano del logo (una camioneta cuya caja de carga parece un libro abierto) es el material de la página. La menta del logo ocupa regiones enteras y una vitrina oscura funciona como escenario de las portadas.
3. Arquitectura (v4.2): Portada (cartel simétrico: H1 arriba, la camioneta cargada de libros reales **en el centro exacto de la vista**, línea y CTA abajo) → Eventos (paradas de una ruta, tarjetas al estilo Luma) → **Destacados** (vitrina 3D, solo 8 libros destacados) → **Catálogo** (los 41 con búsqueda, filtros, orden, vista cuadrícula/lista y «Mostrar más», estructura tomada de la plantilla de la biblioteca) → **Tienda: esqueleto «Próximamente»** (Libros · Merch · Talleres, sin productos) → Visita (dirección, horario y «Cómo llegar» una sola vez, carta «En la barra»).
4. El movimiento se mejora y no se quita (decisión de Aldo; solo `prefers-reduced-motion` lo suaviza). Hay un momento de autor: la vitrina 3D con arrastre e imán (un gesto corto avanza exactamente 1 libro), teclado con foco visible, inclinación hacia el puntero y la portada que «vuela» a la ficha. La llegada de la camioneta solo se ve una vez. El filtro reacomoda con FLIP dentro de su sección. Con `prefers-reduced-motion` todo queda plano, sin desplazamientos, pero los estados se siguen leyendo.
5. El prototipo v4.2 funciona con datos reales (41 libros, 32 portadas, 2 eventos oficiales, carta y horario confirmados) y trae **todo el contenido en el HTML** sin JS (lo genera `prototipo/build.py`, como hará el render del servidor). axe: 0 violaciones en 1440/390, normal y reducido (y en los estados filtro+búsqueda, vacío, hoja de filtros y ficha). Camioneta centrada: Δ 0 px en x y en y a 1440 y a 390. A 390, Visita empieza a 5,549 px. Capturas en `capturas-v3/` y video en `video/movimiento-v3-1440.mp4`. Quedan abiertos: la lista curada de Destacados (hoy es una regla provisional), permisos de Roberto, prueba en dispositivo real y precio de «Las ruinas de la caza» (§10). Prompt de implementación listo (§11).

---

## 1. Principios de Impeccable aplicados (y qué archivo los gobierna)

| Principio | Referencia que manda | Cómo se aplica aquí |
|---|---|---|
| Modo por superficie: la landing es **Persuade**; la vitrina y el estante, **Experience** | `SKILL.md` § Modes; `mode-persuade.md` | Portada: en segundos se entiende qué es, por qué importa y qué hacer (1 CTA). En Destacados y el Catálogo el libro manda y la interfaz se retira. |
| **Redesign replaces**: se conserva la verdad del producto y se cambia el mundo visual | `SKILL.md` § How to design; `new-work.md` §1 | Se conserva: logo, menta/verde del logo, datos, reglas de Aldo y spec v2. Se cambia: el sistema «Itinerante Líquido» (Apple/Inter/blanco), que v1–v3 heredaron. |
| Derivar el mundo de la cultura del público, no de la categoría | `new-work.md` §3 «Create or replace the visual world», pasos 1–3 | 7 candidatos de 4 familias de material (§4). Se descartan «crema + serif» y «negro cinematográfico». |
| Estrategia de color antes que colores; el color ocupa regiones | `new-work.md` §4; `colorize.md` | **Committed**: la menta ocupa la Portada y Visita (~40 % del scroll); la vitrina oscura, la Tienda. El papel menta claro queda para leer. |
| Caras con postura; no las de entrenamiento | `new-work.md` §4 (lista vetada: Inter-as-display, DM Sans, Fraunces…); `craft-floor.md` (sin fuente de sistema como display) | **Barlow Condensed** (display) + **Barlow** (texto), OFL, **en todo** (decisión de Aldo, 22 nov: reemplazan a Inter). Barlow viene de la señalética de carretera: una librería que nació sobre ruedas. 4 caras: Condensed 600/700 y Barlow 400/600. |
| Roles tipográficos con contraste obvio; medida de 45–75 ch | `typeset.md` | 5 roles (§5.1); sinopsis a ≤ 62 ch; `text-wrap: balance` en títulos. |
| Retícula y ritmo: grupos cerrados, separaciones generosas; más aire arriba del título que abajo | `layout.md`; `craft-floor.md` § Spacing | Escala de 4 px; secciones de 96–128 px; estante con 48 px vertical y 28 px horizontal. |
| **Un** momento de autor; ningún reveal idéntico en cada sección; el contenido es visible por omisión | `animate.md` § Motion thesis; `craft-floor.md` § Motion | La vitrina es el foco. La llegada de la camioneta pasa una sola vez y el escalonado solo en el estante (como lista, tope de 300 ms). |
| El hover nunca mueve al elemento propio; se mueve un hijo | `animate.md` § Hover | La tarjeta queda quieta; `.portada-libro` (hija) se inclina y sube 6 px. |
| `reduced-motion` = menos y más suave, no apagado | `animate.md` § Accessibility; `audit.md` §1 | La vitrina queda plana con la misma geometría, crossfades de 150 ms y sin inercia. |
| Superficies del navegador con diseño | `craft-floor.md` § Browser surfaces | `::selection` ámbar, `caret-color`, `scrollbar-color`, anillos de foco de 3 px (tinta en claro, ámbar en oscuro, también en la vitrina y el buscador), enlace «Ir al contenido», `tabular-nums`. |
| Prohibido: rótulo/eyebrow sobre el título, números de sección, tarjetas icono+título+texto, texto con degradado, barras laterales, emoji como iconos | `craft-floor.md` § Refuse | Ningún eyebrow; títulos de una palabra; iconos SVG propios con un solo trazo de 2 px. |
| La copia del producto, controles literales | `clarify.md`; PRODUCT.md «Voz y textos» | «Consultar disponibilidad por WhatsApp», «Ver en Instagram», «Registrarme», «Cómo llegar». Vacío: «No está en la tienda, pero te lo podemos pedir.» |
| Verificar en el render a los tamaños reales, por lotes, máx. 2 rondas | `SKILL.md`; `new-work.md` §7 | 2 rondas de captura (1440 y 390, normal y reducido); arreglos en lote entre ellas (§9). |

---

## 2. Referencias de Awwwards (verificadas el 22 nov 2026: página de Awwwards y sitio responden 200)

Capturas propias de cada sitio en `referencias/` (`<nombre>-1..3.png` y la hoja `_sheet-<nombre>.jpg`).

| # | Sitio · premio | Awwwards | Sitio | Técnica concreta que se toma | Dónde cae en Itinerante |
|---|---|---|---|---|---|
| 1 | **Codapress Publishing** · Honorable Mention, 24 jul 2026 | https://www.awwwards.com/sites/codapress-publishing | https://codapress.co.uk/ | Elemento premiado «Infinite circular book carousel with snapping»: portadas en carrusel con imán, sobre fondo oscuro, donde la portada es la única luz. | **Vitrina**: escenario oscuro, imán al centro, arrastre. No es infinito: tiene inicio y fin para que «1 de 32» sea verdad. |
| 2 | **Aardvark Book Club** · SOTD, 30 ago 2026 | https://www.awwwards.com/sites/aardvark-book-club | https://aardvarkbookclub.com/ | «Scroll-driven 3D book reveal» y «Genre discovery through hover»: el libro como objeto físico con volumen; un solo color de marca dominante por página. | Inclinación 3D de la portada hacia el puntero (vitrina y estante); la menta como color que ocupa la página entera. |
| 3 | **197 Historias Ilustradas** · SOTD, 20 nov 2026 | https://www.awwwards.com/sites/197-historias-ilustradas | https://www.197historiasilustradas.com/ | «List filters», «Grid Transition», «Search»: filtrar un archivo y que la rejilla se reacomode con transición en lugar de saltar. | **Estante**: chips de Género/Editorial + buscador; reacomodo con FLIP (500 ms, expo-out). |
| 4 | **Creative Reference Library** · SOTD, 10 nov 2026 | https://www.awwwards.com/sites/creative-reference-library | https://crl-2026.webflow.io/ | «List to carousel Transition»: el mismo objeto viaja entre vistas, sin cortes. | La portada vuela de la vitrina o el estante a la ficha (elemento compartido, 550 ms). |
| 5 | **Agrumea Farm** · SOTD, 5 nov 2026 | https://www.awwwards.com/sites/agrumea-farm | https://www.agrumeafarm.it/en | Hero y «Product Page»: los productos reales, inclinados, flotan sobre un campo de color de marca; nada de foto de archivo. | **Portada**: 4 portadas reales inclinadas dentro de la caja de la camioneta, sobre la menta. |
| 6 | **Delta Cafés** · SOTD, 13 nov 2026 | https://www.awwwards.com/sites/delta-cafes | https://deltacafes.com/en | «History Introduction»: la historia de origen abre la experiencia. | La camioneta (el origen itinerante, ya en el logo) abre la página; no se escribe una historia que no tenemos. |
| 7 | **Money in Check** · Honorable Mention, 22 sep 2026 | https://www.awwwards.com/sites/money-in-check-a-novel-by-oscar-perez | https://moneyincheck.org/ | «The novel — Book presentation and pricing»: un bloque editorial sobrio con precio y atributos; verde + tinta. | **Ficha**: portada grande, precio, atributos en versalitas, sinopsis y un solo CTA. |
| 8 | **Norstedts** · Honorable Mention, 25 abr 2023 (más antigua; se toma por su estante) | https://www.awwwards.com/sites/norstedts | https://www.norstedts.se/ | «Bookshelf»: rejilla de portadas de frente, con aire, sin marco de tarjeta; la portada es la única imagen. | **Estante**: portadas 2:3 sin tarjeta, título/autor/precio debajo, 48 px de aire vertical. |

Patrones fuera de Awwwards que pidió Aldo (no son premios):
- **Luma, Tekalendario** (https://luma.com/tekalendario), en `referencias/luma-tekalendario-*.png`: anatomía de la tarjeta (fecha agrupada, hora, título, «By …», lugar, miniatura cuadrada a la derecha) y línea de tiempo con punto por fecha.
- **MonteCoyote Shop** (https://montecoyote.com/shop), en `referencias/montecoyote-shop-*.png`: una sola tienda con filtros de tipo en una fila (ALL · COFFEE · MERCH · GEAR) y productos centrados sobre suelo claro.

Descartadas: Mendo (SOTD de 2017) y las librerías Pantoute y Hannenorak (HM de 2015 y 2017), por antiguas. Obys Design Books (2026) aparece como artículo y no se pudo verificar como premio.

---

## 3. Qué falló en v1–v3 (anti-patrones, con su regla de Impeccable)

| Falla observada | Versión | Regla que rompe | Corrección en v4 |
|---|---|---|---|
| Inter como display, escala Apple HIG y suelo blanco con turquesa: «sistema» sin mundo | v1–v3 (`tema-itinerante.css`: `--font-family-heading: Inter`) | `new-work.md` §4 (Inter-as-display vetada; «familiar = no buscaste»); `mode-persuade.md` («un mundo reducido a acento sobre plantilla neutra es el default con calcomanía») | Barlow Condensed + Barlow **reemplazan a Inter en todos los roles** (decisión de Aldo); la menta del logo ocupa regiones enteras. |
| Se quitó el movimiento (S-13: solo hover de 150 ms, sin carrusel) | v2 | `animate.md` («reduced-motion no es apagar»; un momento de autor) | Se recupera y mejora la vitrina 3D; el movimiento explica estado y continuidad. |
| El carrusel restaurado se veía plano | v3 | `animate.md` § Choose material by meaning (profundidad: luz, sombra, desenfoque) | Perspectiva de 4 piezas, giro de 42°, profundidad, brillo atenuado en vecinas, lámpara ámbar acotada y sombra con offset. |
| Pestañas o chips «Próximamente» como contenedores vacíos (filtros que no filtran nada) | v3 | `craft-floor.md` § Refuse (contenedores que sustituyen contenido); spec S-19 | La riqueza viene de ejes **reales**: Género (Narrativa 25 · Poesía 7 · Ensayo 6 · Otros 3) y Editorial (Abismos 19 · Iridiscencias 10 · Capítulo Siete 10 · Otros 2). Merch y Talleres se anuncian como Aldo decidió: **una sola línea de texto** en el encabezado de la Tienda, «Merch y talleres: próximamente.», sin pestaña, chip ni enlace. Las pestañas llegan cuando haya ≥ 2 productos del tipo (S-19). Lo vetado es el contenedor vacío, no el aviso. |
| Secciones que son «tarjetas iguales» y cuadrícula plana | v2–v3 | `craft-floor.md` (tarjetas iguales como estructura); `layout.md` (la topología sigue al contenido) | Cada sección tiene su topología: campo con objeto (Portada), ruta horizontal (Eventos), escenario (Destacados), catálogo con panel de filtros (Catálogo, v4.2), esqueleto quieto (Tienda), ficha técnica (Visita). |
| Placeholders oscuros con título, «inventando» portadas | v1 (S-9) | `craft-floor.md` (no sustituir con cromo) | Placeholder uniforme de papel, con título, autor, editorial y el trazo de la camioneta, `aria-hidden`. |
| «Cómo llegar» y la dirección repetidos | v1 | Regla de Aldo; spec §2 | Solo en Visita: 1 «Matamoros», 1 enlace a Maps y 1 teléfono. |
| Switch «Ver movimiento» y «Mi lista» | v1 | Regla de Aldo; `craft-floor.md` (modal o control sin tarea) | No existen. |

---

## 4. Derivación de la dirección (new-work.md §3, pasos 1–3, a mano; `seed: none (unavailable)`)

**Mecanismo único:** una librería que nació itinerante (su logo es una camioneta trazada a mano cuya caja de carga parece un libro abierto) y hoy vive en una casa de piedra del Centro de Monterrey, con editoriales independientes, café y eventos.
**Escena de uso:** una persona de Monterrey, casi siempre con el teléfono y de día, decide si ir esa semana. Por eso el suelo es claro y la vitrina oscura es un escenario puntual, no un «modo oscuro».
**Rut de la categoría:** crema + serif + terracota («librería bonita»). Su opuesto predecible: negro cinematográfico + neón. También queda fuera el «Apple minimal» que ya fracasó en v1–v3.

| # | Candidato (familia) | Por qué resuena | Cómo se ve |
|---|---|---|---|
| 1 | **El trazo del logo** (identidad gráfica) | Ya es de la marca y nadie más lo tiene; la camioneta-libro *es* el mecanismo | Campo menta, trazo blanco de brocha, tinta verde-negra |
| 2 | Piso de damero de la sala (arquitectura) | Está en las fotos oficiales | Retícula blanco/negro como trama |
| 3 | Mesa de novedades con portadas de frente (objeto) | Así se ve la mesa real (foto oficial) | Portadas de color sobre mesa clara |
| 4 | Cartel de evento del Barrio Antiguo / risografía (impresos) | Cultura local de eventos | Tintas planas sobrepuestas |
| 5 | Boleto de función (impresos) | Eventos con registro | Talón perforado y numeración |
| 6 | Letreros de ruta de los camiones urbanos de Monterrey (señalética) | El «itinerante» en la calle | Letras condensadas pintadas, números de ruta |
| 7 | Ficha de préstamo de biblioteca (objeto) | El lector y el libro | Cartulina, sello, renglones |

**Elegido: 1, «La camioneta»**, con dos refuerzos de otros candidatos:
- *Del 6 (señalética de ruta):* la letra condensada de carretera (Barlow Condensed) y Eventos como **paradas de una ruta** (línea punteada con un punto por fecha).
- *Del 3 (mesa de novedades):* el estante con portadas de frente y sin marcos.

Declinados: 2 (damero) se lee como textura decorativa y compite con las portadas; 4 y 5 obligarían a inventar carteles que no existen; 7 es nostalgia sin dato.

### Contrato de dirección (new-work §5)
- **THESIS:** la página es la ruta de la camioneta. Llega cargada de libros reales, para en Eventos, abre su vitrina y termina en la puerta (Visita). Rechaza el «hero partido + filas de tarjetas» de la categoría.
- **OWN-WORLD:** campo menta #5dc4b4 a sangre; trazo blanco de brocha derivado del logo; tinta #061a18; escenario #082724 con luz ámbar acotada; papel menta #f1f5f2 para leer; Barlow Condensed en títulos, Barlow en texto; iconos de un trazo de 2 px; ni vidrio ni degradados de texto.
- **STORY:** quien entra entiende «librería independiente + café en el Centro», ve que hay eventos (aniversario el 27), hojea portadas reales y sale con una consulta por WhatsApp o la ruta a la casa.
- **FIRST VIEWPORT (1440×900):** menta a sangre; la camioneta blanca de unos 640 px arriba a la derecha, con 4 portadas reales dentro de la caja; el H1 «Librería / Itinerante / y Más» abajo a la izquierda (≈ 132 px, 3 líneas); la línea de 21 px; 1 CTA tinta «Ver eventos». A 390 px: la camioneta arriba al centro y el H1 de ≈ 58 px debajo; Eventos asoma al pie.
- **FORM:** campo de identidad con objeto (no hay lista ordenada porque no corrió la tirada) · `seed: none (unavailable)`.
- **FINISH:** «unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance».

---

## 5. Dirección de arte

### 5.1 Tipografía (Barlow Condensed + Barlow, OFL, en todo; reemplazan a Inter por decisión de Aldo. 4 caras woff2 locales con subset latino: 77 KB en total, la display y el texto 400 con precarga)
| Rol | Cara · peso | Tamaño / interlínea | Tracking | Uso |
|---|---|---|---|---|
| Display (H1) | Barlow Condensed 700 | v4.2: clamp(52px, 7.4vw, 116px) / 0.88 en una línea · 390 px: clamp(46px, 13.4vw, 84px), máx. 9ch (3 líneas) | −0.02em | Solo el nombre en la Portada, centrado arriba de la camioneta |
| Sección (H2) | Barlow Condensed 700 | clamp(48px, 6.2vw, 88px) / 0.9 | −0.01em | Eventos · Destacados · Catálogo · Visita (una palabra). «Tienda» (esqueleto) va más chica, 40–56 px, porque es un anuncio |
| Subsección (H3 del panel) | Barlow Condensed 700 | 22–24 px | 0 | «Filtros» (panel y hoja móvil); H4 en versalitas Barlow 600 para Género y Editorial |
| Título (H3) | Barlow Condensed 600–700 | 22–44 px / 0.95–1.02 | −0.01em | Evento, libro, «En la barra», ficha |
| Texto | Barlow 400 | 17 px / 1.55 (sinopsis ≤ 62 ch) | 0 | Línea, sinopsis, respuestas |
| Metadato / versalitas | Barlow 600 | 12.5–13 px / 1.3, mayúsculas | +0.09em | AUTOR · EDITORIAL · GÉNERO · ISBN; grupos de la carta. **Nunca encima de un título.** |
| Acción | Barlow 600 (chips en 400; el estado activo se marca con el relleno, no con el peso) | 16–17 px | 0 | Botones y chips (≥ 44 px de alto) |
| Cifras | `font-variant-numeric: tabular-nums` | — | — | Precios, horario, contadores |

Nota: a 390 px «Matamoros 421 Pte., Centro, Monterrey» ocupa 2 líneas a 30 px. Es aceptable, porque no parte palabras.

### 5.2 Paleta (derivada del logo y de `.impeccable/design.json`; estrategia **Committed**)
| Rol | Hex | Dónde | Contraste medido |
|---|---|---|---|
| Menta del logo (campo) | #5dc4b4 | Portada, Visita, cartel de fecha | Tinta encima: **8.57:1**; verde sala encima: 4.81:1 (texto secundario) |
| Tinta | #061a18 | Texto, CTA primario | Sobre papel: 16.33:1 |
| Verde sala | #0d4a45 | Punto de ruta, cartel recurrente, secundarios sobre menta | Sobre papel-2: 8.38:1 |
| Vitrina | #082724 | Escenario de la Tienda | Texto #eaf6f3: 14.31:1; #b9d2cd: 9.93:1; menta: 7.56:1 |
| Papel menta | #f1f5f2 / #e4ece8 | Eventos, estante, ficha, placeholders | Secundario #2f4f4a: 8.16:1 |
| Ámbar | #e8a020 | Solo luz de la vitrina, `::selection` y foco sobre oscuro (anillo de la vitrina) | Sobre vitrina: 7.15:1 (medido en el anillo de foco) |
| Blanco | #ffffff | Trazo de la camioneta (decorativo), tarjetas de evento | — |

**Prohibido:** texto blanco sobre menta (2.1:1).

### 5.3 Retícula y ritmo
- 12 columnas, contenido de 1320 px, márgenes clamp(20px, 4vw, 56px); separación de 24 px.
- Escala de 4 px: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
- Secciones: 96 px arriba y 128 px abajo (más aire arriba del título que abajo, y cierre generoso).
- Cadencia de densidad (`new-work.md` «Pace the scroll»): campo amplio (Portada) → ruta ligera (Eventos) → escenario con un solo objeto (Destacados) → pasaje denso (Catálogo) → pausa quieta (esqueleto de Tienda) → ficha práctica y cálida (Visita) → pie en tinta.
- Cambio de suelo por sección: menta → papel → vitrina → papel → papel-2 → menta → tinta. La cabecera adopta el suelo de la sección bajo ella (240 ms).

---

## 6. Arquitectura sección por sección

| # | Sección (ancla) | Propósito | Contenido real (fuente) | Jerarquía | Estados |
|---|---|---|---|---|---|
| 0 | Cabecera | Orientarse | Logo (trazo) + «Itinerante y Más»; Eventos · **Libros** (→ `#destacados`) · Visita | Logo → 3 enlaces ≥ 44 px; subrayado = sección actual (Destacados y Catálogo marcan «Libros») | Sigue el suelo; a 390 solo el isotipo (S-21) |
| 1 | Portada (`#inicio`) | Qué es y qué hacer | H1 = nombre; línea de `negocio.json`; 4 portadas reales en la camioneta | **Cartel simétrico (v4.2):** retícula `1fr auto 1fr`: H1 centrado arriba, la camioneta en la fila central y línea + 1 CTA centrados abajo. El centro de la camioneta coincide con el centro de la vista (medido: Δx 0, Δy 0 a 1440 y a 390). Ancho de la camioneta `min(44vw, 620px, (100svh − 420px)·1.42)` (móvil `min(80vw, 400px, (100svh − 400px)·1.42)`), así que H1 y CTA siempre caben en la primera vista; las portadas de la carga quedan dentro de la caja (no tapan el H1) | CTA «Ver eventos» si hay evento futuro; si no, «Ver libros» → `#destacados` (S-18) |
| 2 | Eventos (`#eventos`) | Qué pasa y cómo ir | `eventos.json`: 6.º Aniversario (VIE 27 NOV, «Hora por anunciar», «En la librería») y Club de Dibujo y Pintura (sábados cada 15 días, 14:00–16:00, $150 MXN, incluye material, con Santiago González) | Ruta con punto por fecha (**la fecha sale 1 vez por evento, en la parada**) → tarjeta Luma: título → hora o «Hora por anunciar» · anfitrión · lugar · incluye (todo **bajo** el título) → cartel neutro con la camioneta (sin repetir la fecha) → CTA | CTA **Registrarme** si hay `registroUrl`; si no, **Ver en Instagram** al post oficial. Pasados ocultos (hora MTY, en servidor y de nuevo en el navegador). **Flechas solo cuando la ruta desborda** (a 1440 con 2 eventos no hay; a 390 sí) + snap con `scroll-padding` igual al margen; vacío: «Sin fechas publicadas por ahora. La agenda sale primero en Instagram.» Skribh fuera hasta el OK de Aldo. |
| 3 | **Destacados** (`#destacados`, vitrina) | Hojear lo que la librería quiere mostrar | H2 «Destacados» + «8 libros de la selección. Los 41 están abajo, en el catálogo.» **La palabra «Tienda» no titula el carrusel** (ni en el H2 ni en el `aria-label` «Destacados: 8 libros…»). Fuente en producción: `src/frente/destacados.json` (ids curados por la librería). **En el prototipo la selección es provisional y mecánica:** los primeros 8 con portada en el orden del inventario, porque los datos no traen un campo «destacado» y no se inventa curaduría (§10) | Portada central → ficha breve (aria-live) → «**4 de 8**» + flechas → enlace «**Ver el catálogo completo**» (→ `#libros`) | Arrastre con imán: **gesto corto (< 2 pasos) = 1 libro**; uno largo avanza lo que recorrió el dedo; sin inercia libre. Rueda y scroll vertical sobre la vitrina **no se secuestran**. ←/→/Inicio/Fin, Enter abre la ficha. Foco: anillo ámbar de 3 px (7.15:1) + pista «← → para hojear». Portadas diferidas: ±3 del centro. Sin JS la vitrina se oculta (el catálogo trae los 41) |
| 4 | **Catálogo** (`#libros`) | Encontrar uno concreto | H2 «Catálogo» + «41 libros · 4 editoriales»; los 41 (9 con placeholder). Filtros **solo con datos reales**: Género (colecciones reales de `assets/data/collections.json`: Narrativa 26 · Poesía 8 · Ensayo 9; un libro puede estar en dos) y Editorial (`catalog.json`: Abismos 19 · Capítulo Siete 10 · Iridiscencias 10 · Libro Objeto 1; 1 libro sin editorial no recibe filtro) | Estructura de la plantilla de la biblioteca (§6b): título + conteo → buscador ancho (56 px) → panel «Filtros» pegajoso de 256 px a la izquierda (≥ 1024 px; en móvil botón «Filtros» con insignia + hoja `<dialog>`) → barra de resultados (conteo vivo · Ordenar · cuadrícula/lista) → filtros aplicados quitables + «Quitar filtros» → cuadrícula 4/3/2 columnas o lista → «Mostrar más (N restantes)». Orden por omisión: con portada primero, luego editorial y título (orden de presentación, no curaduría); además Título, Autor, Precio ↑/↓ | Píldoras con `aria-pressed` y conteo (OR dentro de un grupo, AND entre grupos); búsqueda por título/autor/editorial insensible a acentos con `<mark>`, botón «Borrar búsqueda» y atajo «/»; estado en la URL (`?q=&genero=&editorial=&orden=&vista=&libro=`). Vacío: «No encontramos libros para «q»» / «Ningún libro cumple con estos filtros» + «Prueba con menos palabras o revisa la ortografía.» + «Borrar búsqueda» / «Quitar filtros» + «Si no lo tenemos, te lo podemos pedir» (WhatsApp). Página de 20 (≥ 1024), 12 (768–1023) o 10 (< 768); «Mostrar más» lleva el foco al primer libro nuevo y anuncia «Mostrando X de Y libros». **Sin JS: los 41 visibles, cada título enlaza a WhatsApp con el mensaje prellenado, y el buscador, el panel y la barra se ocultan** (en producción, filtros por GET en el servidor, como la plantilla). Cambios con FLIP contenido (§7) |
| 4b | Ficha (hoja lateral / inferior) | Decidir y preguntar | Portada, título, precio, AUTOR · EDITORIAL · GÉNERO · ISBN (solo con dato), sinopsis | Portada → título → precio → atributos → sinopsis → 1 CTA | «Consultar disponibilidad por WhatsApp» con mensaje prellenado (S-17); Esc, velo y botón cierran; el foco vuelve. Enlace profundo `?libro=ID` (idea de la plantilla) |
| 4c | **Tienda · esqueleto** (`#tienda`) | Anunciar lo que viene, sin fingir | H2 «Tienda» + sello «Próximamente» + la línea «Merch y talleres: próximamente.» + 3 huecos vacíos rotulados **Libros · Merch · Talleres** (marco punteado con la camioneta en tinta al 22 % y dos barras grises). Sin productos, precios ni fotos inventados | Debajo del Catálogo y antes de Visita: Aldo pidió el catálogo justo debajo del carrusel, y la tienda es lo de menor prioridad (todavía no se ilustran productos). No va en la navegación | Estático: sin brillo en bucle («nada en bucle»), sin enlaces ni botones (0 interactivos), rótulos como texto (no chips). A 390, 3 columnas compactas (sin scroll horizontal). Cuando un tipo tenga ≥ 2 productos reales en `merch.json`, su hueco se reemplaza por tarjetas reales y la línea deja de mencionarlo |
| 5 | Visita (`#visita`) | Llegar | Dirección + entre calles; horario confirmado (Lun–sáb 11:00–20:00 · Domingo cerrado); **1** «Cómo llegar»; WhatsApp, Tel., Instagram, Facebook, correo y «Rentar el espacio» (formulario oficial, enlaces de 44 px); foto del pasillo (Aldo, con permiso) | Orden S-20: dirección/horario/Cómo llegar → contacto → «En la barra» (carta en grupos, 2 columnas) → FAQ (2 preguntas; el enlace en línea «tienda» tiene 34 px de área) | Sin Abierto/Cerrado. Precio nulo = no se imprime nada. A 390, su parte superior queda a ≤ 6,000 px (medido: 5,326) |
| 6 | Pie | Cierre | Nombre · © · créditos de fotos | — | Sin dirección ni Maps |

Conteos garantizados: «Matamoros» visible 1, enlaces a Maps 1, teléfono 1, 0 switches, 0 «Mi lista», 0 «apartar», «próximamente» **2** (el sello y la línea, ambos dentro de `#tienda`, sin rol de tab, botón ni enlace), «Precio en tienda» **0**, la palabra «Tienda» **0** en `#destacados`. Primer Tab = «Ir al contenido».

## 6b. Qué se tomó de la plantilla de la Biblioteca (`Aldo14G/biblioteca-ecrmnl`, commit b5e3ab9 del 3 nov 2026)

Clon de solo lectura en `_ref/biblioteca/repo/` (no se tocó el repo). Se tomó la **estructura y el comportamiento** del catálogo, no la marca: todo va en menta, tinta, Barlow y la camioneta.

| Qué | Archivo de la plantilla | Cómo quedó en Itinerante |
|---|---|---|
| Composición: título + conteo «N libros · N colecciones», buscador ancho, columna de filtros de 256 px + resultados | `web/components/SearchPage.tsx`, `web/app/(catalogo)/page.tsx` | H2 «Catálogo» + «41 libros · 4 editoriales»; buscador de 56 px; `aside.panel` de 256 px pegajoso (top 84 px) |
| Panel «Filtros» con «Limpiar» (el foco vuelve al título) y secciones con título + `role=group` | `web/components/FilterSidebar.tsx`, `web/components/filtros/Seccion.tsx` | Igual: H3 «Filtros», «Limpiar», grupos Género y Editorial con H4 |
| Píldoras con `aria-pressed` y conteo | `web/components/filtros/SeccionColecciones.tsx` | `.pildora` con conteo, relleno tinta cuando está activa |
| Botón «Filtros» con insignia + hoja inferior `<dialog>` nativa con «Limpiar», cerrar y pie «Ver resultados» | `web/components/MobileFilterButton.tsx` | `#abrir-filtros` + `dialog#hoja-filtros`; pie «Ver N libros»; el panel se mueve dentro de la hoja y vuelve al cerrar |
| Barra de resultados: conteo vivo, Ordenar, cuadrícula/lista con `aria-pressed` | `web/components/search/ResultsToolbar.tsx` | `#conteo` (role=status), `select#orden` (5 órdenes con datos reales), `#vista-rejilla` / `#vista-lista` |
| Filtros aplicados quitables + «Quitar filtros» | `web/components/search/ActiveFilterChips.tsx` | `ul#aplicados` con «Quitar filtro X» |
| Estado vacío con copy y acciones | `web/components/search/EmptyState.tsx` | Mismo copy, más «Si no lo tenemos, te lo podemos pedir» por WhatsApp |
| «Mostrar más (N restantes)», estado sr «Mostrando X de Y libros», foco al primer nuevo | `web/components/search/LoadMore.tsx` | Igual (reemplaza al «Ver los 41» de v4.1) |
| Cuadrícula y lista; tarjeta `<article>` con enlace estirado en el título; fila con miniatura y «autor · editorial» | `web/components/search/ResultsGrid.tsx`, `ResultsList.tsx`, `web/components/BookCard.tsx`, `web/components/BookRow.tsx` | `li > article.libro`, enlace en el H3 que cubre la tarjeta; lista con miniatura de 56 px y precio a la derecha |
| Resaltado insensible a acentos | `web/lib/highlight.tsx` | `<mark>` en menta clara |
| Buscador con «Borrar búsqueda» y atajo «/» | `web/components/SearchBar.tsx` | `#q-borrar`, `kbd` «/» |
| Estado en la URL y ficha por `?libro=` | `web/lib/searchParams.ts`, `web/hooks/useCatalogSearch.ts` | `?q, genero, editorial, orden, vista, libro` con `replaceState` |
| Región de resultados enfocable con H sr-only | `SearchPage.tsx` (`#resultados`, tabIndex −1) | `#resultados` tabindex −1 + H3 sr «Resultados» |

**No se tomó:** la marca Cruz Roja (rojo #b90006, logos, la tipografía CruzAir), el filtro por rango de años, el árbol de materias, signatura/clasificación y disponibilidad por ejemplar (no existen en los datos de la librería), el combobox de sugerencias y «¿Quisiste decir?» (queda como P2) y la ficha en diálogo centrado: se conserva la hoja lateral con la portada que vuela, que ya era el momento de movimiento de la ficha.

---

## 7. Spec de movimiento

**Tesis (`animate.md`).** Regla de Aldo: el movimiento se mejora, nunca se quita; `prefers-reduced-motion` solo lo suaviza.
- **Foco:** la vitrina 3D.
- **Continuidad:** portada → ficha (elemento compartido) y filtros (FLIP).
- **Respuesta:** botones (escala 0.97), chips, flechas.
- **Presupuesto:** solo `transform`, `opacity` y `filter` en elementos aislados; `will-change` solo en las piezas de la vitrina.
- **Curvas:** salida `cubic-bezier(.16,1,.3,1)` (expo-out); cierres `power3.in`, más cortos.

| Sección | Qué se mueve | Disparador | Duración · curva | Con `prefers-reduced-motion` |
|---|---|---|---|---|
| Portada | (v4.2: la camioneta ya está centrada; la llegada termina en el centro exacto) La camioneta entra desde la izquierda (xPercent −38 → 0) mientras el trazo se revela con `clip-path`; luego caen las 4 portadas con su giro (escalonado de 80 ms) | Carga, **una vez** | 1.1 s expo-out (trazo 0.9 s power3.out; portadas 0.7 s desde 0.55 s) | Aparece quieta. El H1 y el CTA nunca se animan (visibles por omisión). |
| Cabecera | Fondo y color según el suelo; subrayado de la sección actual | Scroll | 240 ms / 300 ms expo-out | Igual (es un cambio de estado, no un desplazamiento) |
| Eventos | Ruta horizontal con snap; flechas con scroll suave; la sombra de la tarjeta crece al pasar el puntero | Gesto, flechas, hover | Nativo; sombra 300 ms | Scroll instantáneo; sombra igual |
| **Vitrina** | Pose por pieza según la distancia d al centro: x = ±(0.74·cerca + 0.46·lejos)·W, z = −(0.62·cerca + 0.42·lejos)·W, rotateY = ∓42°·cerca, brillo de vecinas 1 → 0.62; perspectiva 4W; se desvanece más allá de ±3.4 (±1.6 en móvil) | Arrastre propio con Pointer Events (la vitrina sigue al dedo 1:1 con paso 0.74·W), flechas, teclado, clic en vecina | Al soltar: < 24 px vuelve; < 2 pasos → **±1 libro** (0.5 s expo-out); más largo → lo recorrido (0.6 s). Flechas/teclado: 0.75 s expo-out. Medido: 180 px avanzan 1 libro a 1440 (ratón) y a 390 (toque lento y rápido) | Plana: misma geometría sin giro ni z (escala 0.84 / 0.80) y vecinas atenuadas; salto directo al soltar |
| Vitrina · foco | Anillo ámbar de 3 px dentro del escenario y pista «← → para hojear» que aparece | `:focus-visible` (Tab) | 200 ms de opacidad | Igual (es estado, no desplazamiento) |
| Vitrina · portada central | Se inclina hacia el puntero (rotateY ±10°, rotateX ±8°) y se adelanta 30 px; se mueve **la cara** (hija), no la pieza | Puntero fino | 450 ms expo-out | Desactivado |
| Vitrina · ficha breve | Crossfade del título/autor/precio con desenfoque 6 px → 0 y y 8 → 0 | Cambio de central | 380 ms expo-out | Solo opacidad, 150 ms |
| Catálogo · entrada | Entrada como **lista**: los primeros 8 libros suben 24 px | Primera vez en vista | 0.7 s, escalonado total 0.3 s | Sin entrada |
| Catálogo · hover | La portada (hija) sube 6 px, se inclina hacia el puntero (±6°/±4°) y la sombra crece (solo en cuadrícula) | Puntero fino | 450 ms expo-out | Sin inclinación ni desplazamiento; la sombra sí cambia |
| Catálogo · filtros y búsqueda | Reacomodo FLIP; los que entran escalan de 0.94 a 1 con fundido, los que salen se van en 200 ms. **Contenido:** mientras dura, `#resultados` lleva `overflow: clip` y la rejilla conserva su alto previo (`min-height`); al terminar se suelta y el inicio de los resultados vuelve a su sitio (medido: Δ 0 px, 0 libros visibles fuera de la caja) | Píldora, chip aplicado, búsqueda (160 ms de rebote) | 500 ms expo-out, escalonado de 0.1 s | Cambio instantáneo, misma regla de posición |
| Catálogo · orden y vista | El mismo FLIP reacomoda al cambiar el orden; cuadrícula ↔ lista se transforma con FLIP en escala (cada tarjeta viaja a su fila) | Select, botones de vista | 500 ms expo-out | Instantáneo |
| Catálogo · «Mostrar más» | Los libros nuevos suben 20 px con fundido, como lista; el foco pasa al primero | Botón | 0.6 s, escalonado total 0.25 s | Sin desplazamiento; el foco igual |
| Hoja de filtros (móvil) | La lámina sube desde abajo (yPercent 100 → 0); al cerrar baja | Botón «Filtros» / cerrar / «Ver N libros» / velo / Esc | 450 ms expo-out; cierre 250 ms power3.in | Aparece y se va sin desplazamiento |
| Tienda · esqueleto | Nada (estático a propósito: un brillo de carga en bucle mentiría que algo carga) | — | — | — |
| Ficha | La hoja entra (derecha en escritorio, abajo en móvil); un clon de la portada vuela de su origen al hueco de la ficha | Clic, Enter | 500 ms / 550 ms expo-out; cierre 300 ms power3.in | Aparece con fundido de 150 ms, sin vuelo |
| Botones | Escala 0.97 al presionar; la flecha avanza 3 px | `:active` / hover | 120 ms / 250 ms | Igual (feedback) |

Nada corre en bucle ni en autoplay, y nada depende del scroll salvo el cambio de suelo de la cabecera. El contenido nunca empieza oculto desde CSS: GSAP solo anima lo que el HTML ya trae (las 4 portadas de la camioneta entran desde `opacity: 0` vía JS; sin JS se ven quietas).

---

## 8. Anti-patrones vetados en la implementación (lista Impeccable aplicada)
1. Eyebrow o rótulo encima de un título (Eventos, Tienda, Visita van solos).
2. Números de sección «01 / 02».
3. Hero partido con texto a un lado y foto o tarjeta al otro.
4. Filas de tarjetas iguales como estructura de página.
5. Inter en cualquier rol (Aldo: Barlow Condensed + Barlow reemplazan a Inter en todo), fuentes de sistema como display y las fuentes vetadas de `new-work.md` §4.
6. Crema + serif + terracota.
7. Vidrio o desenfoque decorativo.
8. Texto con degradado.
9. Barra de color en un costado.
10. Sombras duras sin desenfoque.
11. Emoji o glifos como iconos. La flecha «↗» se dibuja en SVG.
12. Un mismo reveal en cada sección; scroll-jacking (tampoco la rueda ni el scroll vertical sobre la vitrina); autoplay; marquesinas.
13. Pestañas, chips o enlaces vacíos para Merch o Talleres, y textos sustitutos de precio («Precio en tienda», «Consultar precio» o similares: sin precio no se imprime nada; el precio lo da Roberto). **Sí va**, por decisión de Aldo, una sola línea de texto en la Tienda: «Merch y talleres: próximamente.», sin pestaña, chip ni enlace, hasta tener ≥ 2 productos del tipo; en v4.2 la acompañan el sello «Próximamente» y los huecos vacíos del esqueleto (no interactivos).
14. Frases de `frases-vetadas.json`, copy inventado o eventos sin post oficial.
15. «Cómo llegar», la dirección o el teléfono fuera de Visita.
16. Switch de movimiento, «Mi lista», `localStorage` o `role="switch"`.
17. Quitar o apagar movimiento para resolver un problema. Se arregla el movimiento (contenerlo, acotarlo, darle foco); solo `prefers-reduced-motion` lo suaviza.
18. Contenido que solo existe después de JS, o fuentes y scripts desde CDN en producción.
19. (v4.2) «Tienda» como título del carrusel, o productos, precios o fotos inventados en el esqueleto de la Tienda (solo huecos rotulados y «Próximamente»). Brillo/shimmer en bucle en el esqueleto.
20. (v4.2) Filtros con metadatos que no existen en los datos (año, materia, formato, disponibilidad), y la marca de la plantilla de la biblioteca (rojo #b90006, logos, CruzAir).

---

## 9. Autocrítica con la rúbrica de Impeccable (`critique.md` + `audit.md`), 4 rondas

**Ronda 1. Encontrado y arreglado en lote:**
- La hoja de ficha no aparecía (la `transform` CSS chocaba con GSAP).
- Las portadas sin imagen salían como bloques ámbar que dominaban el estante; ahora son el placeholder uniforme de papel (S-9).
- Las flechas de Eventos se veían aunque no había desbordamiento (`[hidden]` vencido por `display:flex`).
- El texto «Sábados cada 15 días» se salía de su cartel.
- La línea de la ruta pasaba por encima de las fechas.
- En móvil quedaba un hueco enorme bajo la camioneta y el buscador se escondía en el carrusel de chips.
- La vitrina era tan alta que la ficha breve quedaba bajo el pliegue.
- Las portadas de la camioneta salían por encima del techo y ahora van dentro de la caja.

**Ronda 2. Arreglado:**
- Había `<h3>` dentro de `<button>`, que es HTML inválido; ahora es `<span class="titulo">`.
- El enlace del logo medía 31 px de alto; ahora mide 44.

Resultado de axe-core (wcag2a/aa, wcag21aa, best-practice): **0 violaciones** a 1440 y a 390 px. No queda ningún objetivo interactivo bajo 44 px.

**Ronda 3 (v4.1, 22 nov, 16:20 hora de Monterrey). Crítica externa de la crítica de diseño y la segunda crítica de diseño, aplicada en documento y prototipo.**
Lo que mi autocrítica de la ronda 2 no vio: la vitrina sin foco visible (C1), el FLIP pintando portadas sobre Visita (C2), el estante abriendo con placeholders (C3), el swipe de 180 px que avanzaba 3 libros (C4) y la contradicción del contrato con la decisión de Aldo sobre «Próximamente» (P0-1). la segunda crítica de diseño tenía razón al bajar la técnica a 13/20 para v4.0.

Mediciones reales (Playwright + axe-core 4.14.1; script `medir-v2.js`, datos en `medir-v2.json`). «Antes» = las de la crítica de diseño y la segunda crítica de diseño sobre v4.0 (`/workspace/itinerante-critique/camioneta/audit.json`, `cam-raw.json`). «Después» = v4.1, servida en local:

| Criterio | Antes (v4.0) | Después (v4.1) | Referencia |
|---|---|---|---|
| axe (wcag2a/aa, 21aa, 22aa, best-practice) | 0 en las 4 combinaciones | **0** en 1440/390 × normal/reducido | `audit.md` §1 |
| «próximamente» | 0 (el contrato lo prohibía) | **1**: «Merch y talleres: próximamente.», `<p>` dentro de `#tienda`, sin rol, botón ni enlace | P0-1 · decisión de Aldo |
| «Precio en tienda» | 0 | **0**; «Las ruinas de la caza» se lee «título · autor», sin línea de precio | C7 · §8.13 |
| Sin JS | 345 caracteres, 0 libros | 4,147 caracteres (1440) / 4,130 (390); 41 libros, 2 eventos, 21 platos de la carta, Visita completa | P1-1 |
| Parte superior de Visita a 390 | 11,157 px (documento de 14,534) | **5,326 px** (documento de 8,704); 12 libros + «Ver los 41 libros» (52 px, `aria-expanded`) | P1-2 |
| Recorte de la vitrina | «5 de 32» frente a «41 libros» | «5 de 32 con portada» + «Ver los 41 en el estante» → `#libros` | P1-3 |
| Swipe horizontal de 180 px (390, toque) | 3 libros (5 → 8) | **1 libro** (6 → 7); rápido (60 ms): 1 (7 → 8) | P1-4 · C4 |
| Swipe vertical sobre la vitrina (390) | la página baja | la página baja (scrollY 1,587 → 2,109) | P1-4 |
| Rueda sobre la vitrina (1440) | la página avanza 600 de 600 px | 600 de 600 px (1,788 → 2,388) | §8.12 |
| Arrastre de 180 px con ratón (1440) | — | 1 libro (6 → 7) | P1-4 |
| Foco de la vitrina con Tab real | `outline: none` | **3 px sólido ámbar, 7.15:1** sobre #082724; pista visible (opacidad 1); → avanza (5 → 6) | C1 |
| Portadas fuera de `#libros` al filtrar Todos → Poesía → Todos | se pintaban sobre «Visita» (fotogramas f21–f23) | `overflow: clip` durante el FLIP; **0 fotogramas** con una portada visible fuera de la caja (68–69 fotogramas por cambio, 1440 y 390); las cajas que sobresalen quedan recortadas | C2 |
| Desplazamiento del inicio del estante al filtrar | colapsaba y movía la página | **Δ 0 px** en Poesía y en Todos (1440 y 390, normal y reducido) | C2 (tope ±8) |
| Primera fila del estante | 3 de 5 placeholders (1440), 2 de 4 (390) | 1440: 5 de 5 con portada real; 390: los 4 primeros con portada real; el placeholder ya no repite el título | C3 |
| H2 del estante | no había | «Todos los libros» | C5 |
| Foco del buscador | halo ≈ 1.3:1 | 3 px tinta, 16.33:1 | C6 |
| Caras de fuente | 6 caras, 134 KB, desde CDN | **4 caras, 77 KB**, woff2 local con subset | C8 · P2-6 |
| CLS | 0.032 (1440) | **0** (1440 y 390) | C8 |
| Portadas de la vitrina al cargar | las 32 (943 KB de imágenes) | 7 con `src` (±3 del centro), `loading=lazy` | C9 |
| Peso al cargar a 390 (sin hacer scroll) | 1,240,512 B | **450,918 B** (sin compresión: el servidor local no comprime) | P2-7 (≤ 700 KB) |
| Peso tras recorrer toda la página a 390 | — | 742,917 B sin compresión. Estimación con gzip de HTML/JS (251 KB → 84 KB): ≈ 576 KB. **Medir en el preview real.** | P2-7 |
| Peticiones a hosts externos | jsdelivr + fonts.googleapis/gstatic | **0** | P2-6 |
| Primer Tab | el logo | «Ir al contenido» | P2-5 |
| Fecha del Aniversario en su tarjeta | 3 veces | **1** (la parada de la ruta) | P2-1 |
| «Hora por anunciar» | encima del título | debajo del título, con el lugar | P2-2 |
| Flechas de Eventos con 2 eventos | a 390 sí; regla decía «≥ 3» | 1440: no hay; 390: sí. Regla nueva: «cuando la ruta desborda» | P2-3 |
| Enlace en línea «tienda» | 20 px de alto | 34 px | P2-4 |
| Enlaces de Contacto | — | 44 px mínimo | P2-8 (V7) |

Fuera de la crítica, arreglado en la misma pasada: el carril de Eventos a 390 arrancaba pegado al borde (faltaba `scroll-padding-inline`), y «Ver en Instagram» se partía en dos líneas (botones con `white-space: nowrap` y acciones que bajan de línea).

**Design Health Score (Nielsen; 7 y 10 n/a en Persuade/Experience):**

| # | Heurística | Puntos | Hallazgo clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | «5 de 32», sección actual en la cabecera, chips con conteo. Falta un estado de carga de imágenes en conexiones lentas. |
| 2 | Lenguaje del mundo real | 4 | Copy literal en español de MTY; datos reales; nada inventado. |
| 3 | Control y libertad | 3 | Esc, velo y cerrar; el foco vuelve. Filtro + búsqueda sin un «Limpiar» único (P2). |
| 4 | Consistencia | 4 | Mismo CTA por tipo; un solo sistema de botones, chips y flechas. |
| 5 | Prevención de errores | 3 | Mensaje de WhatsApp prellenado; no hay formularios. |
| 6 | Reconocer, no recordar | 3 | Portadas visibles y conteos. En móvil la fila de chips se corta en el borde sin indicio (P2). |
| 7 | Flexibilidad | n/a | Superficie Persuade/Experience (teclado completo en la vitrina, de todos modos). |
| 8 | Estética y minimalismo | 4 | Una sola dirección, un foco por sección, sin relleno. |
| 9 | Recuperación de errores | 3 | La búsqueda vacía ofrece pedir el libro por WhatsApp. Falta el caso «WhatsApp no instalado» en escritorio. |
| 10 | Ayuda | n/a | FAQ de 2 preguntas confirmadas. |
| **Total** | | **27/32 (84 %, Good)** | |

**Veredicto de especificidad:** autoral. Fuera de su contexto, el campo menta con la camioneta-libro cargada de portadas no se confunde con otra librería. Riesgo honesto: Barlow Condensed en peso alto, junto a la tinta plana, roza el rut «tinta plana + condensada pesada» de `new-work.md`. Se mitiga con caja mixta, sin cajas negras ni sombras duras, y con el trazo orgánico.

**Audit Health Score (prototipo, no producción):**

| # | Dimensión | Puntos | Hallazgo |
|---|---|---|---|
| 1 | Accesibilidad | 3 | axe 0 en 4 combinaciones; foco visible en todo, incluida la vitrina (7.15:1) y el buscador (16.33:1); enlace «Ir al contenido»; H2 en el estante; vitrina con 1 parada de Tab, ←/→ y Enter; `aria-live` en la ficha breve. No llega a 4: falta probarlo con un lector de pantalla real (VoiceOver/TalkBack). |
| 2 | Rendimiento | 3 | Solo transform/opacity/filter; 4 caras locales (77 KB); 0 hosts externos; vitrina diferida (±3); 451 KB al cargar a 390. No llega a 4: tras recorrer la página son 743 KB sin compresión (≈ 576 KB estimados con gzip, sin medir en el preview real) y no hay medición de LCP en un móvil real. |
| 3 | Theming | 3 | Tokens en `:root`; algunos colores aún escritos a mano en CSS. Sin modo oscuro, por decisión de escena (claro). |
| 4 | Responsive | 3 | 1440 y 390 verificados; Visita a 5,326 px en móvil; gesto corto = 1 libro y el scroll vertical no se atrapa, **con toque sintetizado (CDP)**. No llega a 4: falta la prueba en un iPhone (Safari) y un Android (Chrome) reales. |
| 5 | Integridad | 3 | Contrato coherente con las decisiones de Aldo (§3/§8/§10/§11 ya no se contradicen); contenido completo sin JS. No corrió el detector de Impeccable (binario no ejecutado). |
| **Total** | | **15/20 (Good)** | v4.0 se quedó en 13/20 (la segunda crítica de diseño) por C1 y C2. En v4.1 ambos están cerrados y medidos, así que Accesibilidad y Responsive vuelven a 3. Ninguna dimensión sube a 4 mientras falten el lector de pantalla real, el dispositivo físico y el peso medido en el preview. |

**Pendientes P2 para implementación:** botón «Limpiar filtros»; degradado de borde en la fila de chips móvil; estado de carga (esqueleto del color del papel) para portadas; prueba en un iPhone y un Android reales (video corto de cada uno en el PR); prueba con lector de pantalla; medir el peso comprimido y el LCP en el preview; prueba con merch de muestra (≥ 2 productos → aparecen las pestañas y desaparece la línea «próximamente»).

**Design Health Score tras la ronda 3:** se mantiene en 27/32. Lo que cambió (contador «con portada», enlace al estante, pista de teclado) mejora la visibilidad del estado, pero siguen abiertos los hallazgos que la limitaban: no hay estado de carga de imágenes, ni «Limpiar», ni indicio de chips cortados en móvil.

**Ronda 4 (v4.2, pedido de Aldo). Medido con `medir-v3.js` → `medir-v3.json` y `capturas-v3.js` (Playwright + axe-core 4.14.1, Chrome local):**

| Medición | 1440 | 390 |
|---|---|---|
| axe, normal / reducido | **0 / 0** | **0 / 0** |
| axe en estados: filtro+búsqueda, vacío, ficha (y hoja de filtros a 390) | 0 · 0 · 0 | 0 · 0 · 0 · 0 |
| Centro de la camioneta − centro de la vista (Δx, Δy) | **0, 0 px** (camioneta 620 px) | **0, 0 px** (312 px) |
| Separación H1 → camioneta / camioneta → línea+CTA | H1 termina a 205, camioneta 229–671, línea a 671 | H1 termina a 287, camioneta 309–535, línea a 535 |
| Título del carrusel | H2 «Destacados»; `aria-label` «Destacados: 8 libros…»; «Tienda» en la sección: **0** | igual |
| Parte superior de Visita | 6,245 px | **5,549 px** (≤ 6,000) |
| Sin JS | 41 libros visibles de 41, 41 enlaces a WhatsApp, UI de filtros oculta (0 visibles), 2 eventos, carta 21, «próximamente» 2, 5,023 caracteres | igual (5,006 caracteres) |
| «próximamente» / «Precio en tienda» | 2 (sello + línea, en `#tienda`, no interactivos) / **0** | igual |
| Esqueleto de Tienda | 3 huecos (Libros, Merch, Talleres); 0 imágenes, 0 precios, 0 interactivos | igual |
| Filtro Poesía (activar y quitar), muestreado por fotograma | 0 libros visibles fuera de `#resultados`; Δ del inicio de resultados 0 px; `overflow: clip` solo durante la animación | igual (a 390 vía la misma función que la píldora de la hoja) |
| Página inicial del catálogo | 20 + «Mostrar más (21 restantes)» | 10 + «Mostrar más (31 restantes)» |
| Foco: vitrina / buscador | ámbar 3 px 7.15:1 + pista / tinta 3 px 16.33:1 | igual |
| Gestos | arrastre de 180 px = 1 libro; la rueda sobre la vitrina baja la página | toque de 180 px = 1 libro (lento y rápido); swipe vertical baja la página |
| Peso al cargar / tras recorrer (sin compresión) | 474 KB / 795 KB | 474 KB / 737 KB |
| CLS · hosts externos · errores de consola | 0 · 0 · 0 | 0 · 0 · 0 |

Encontrado y arreglado en esta ronda: (1) las portadas de la camioneta medían 600 px de alto por el atributo `height` y tapaban el H1 → `height: auto`; (2) a 390 el `select` de orden perdía su nombre al ocultar «Ordenar» con `display:none` → se oculta visualmente; (3) el esqueleto con scroll horizontal a 390 no era enfocable con teclado (axe) → 3 columnas compactas sin scroll; (4) la ficha usaba `<aside role="dialog">` (rol no permitido, axe) → `<div role="dialog">`; (5) la barra de resultados a 390 apretaba el `select` → dos filas (Filtros + Ordenar / conteo + vista); (6) el CTA de respaldo «Ver libros» y el enlace de la FAQ apuntaban a «tienda» → ahora a Destacados y al catálogo.

**Design Health Score tras la ronda 4: 29/32.** Suben Control y libertad (3 → 4: «Limpiar», «Quitar filtros», chips quitables, «Borrar búsqueda», estado en la URL) y Reconocer, no recordar (3 → 4: filtros aplicados visibles, conteos en cada píldora, resaltado de la búsqueda). Siguen en 3 Visibilidad del estado (sin estado de carga de portadas), Prevención de errores y Recuperación de errores (sin sugerencias «¿Quisiste decir?»).

**Audit Health Score: 15/20, sin cambio.** Accesibilidad sigue en 3 (falta lector de pantalla real, ahora con más superficie: hoja de filtros, región en vivo del conteo); Rendimiento en 3 (737–795 KB tras recorrer sin compresión, por encima de 700 KB sin gzip; medir comprimido en el preview); Responsive en 3 (falta dispositivo real).

**Pendientes P2 para implementación (v4.2):** combobox de sugerencias y «¿Quisiste decir?» de la plantilla; estado de carga de portadas; prueba con lector de pantalla de la hoja de filtros; medir peso comprimido y LCP en el preview; prueba con `merch.json` de muestra (≥ 2 productos → el hueco de ese tipo se vuelve tarjetas reales).

---

## 10. Decisiones de Aldo y pendientes (no se inventaron)
**Decididas (22 nov 2026):**
1. **Merch y Talleres:** una sola línea de texto en la Tienda, «Merch y talleres: próximamente.», sin pestaña, chip ni enlace. En v4.2 vive en la sección esqueleto «Tienda · Próximamente» (§6, fila 4c). Cuando haya ≥ 2 productos reales de un tipo (S-19), su hueco se vuelve tarjetas reales y la línea deja de mencionarlo.
2. **Tipografía:** Barlow Condensed + Barlow reemplazan a Inter en todo.
3. **Movimiento:** se mejora, nunca se quita; solo `prefers-reduced-motion` lo suaviza.
3b. **(v4.2)** Camioneta centrada en la Portada; el carrusel es «Destacados» (sin «Tienda»); la tienda de productos queda como esqueleto «Próximamente»; debajo de Destacados va el catálogo completo con la plantilla de la biblioteca.

**Abiertas:**
4. **Permisos de Roberto:** los carteles de Instagram de los eventos y la foto `oficial-rincon` (`permisoRegistrado: false`). Mientras tanto, el cartel de la tarjeta es neutro (la camioneta sobre menta o verde sala) y la fecha va solo en la parada. Las fotos de @sharonmirelesgong y @alfonso_boeta siguen pendientes; el prototipo solo usa la del pasillo (Aldo, con permiso).
5. **Precio de «Las ruinas de la caza»:** lo da Roberto. Hasta entonces la tarjeta, la vitrina y la ficha van sin línea de precio y sin texto sustituto.
6. **Prueba en dispositivo real:** el gesto de la vitrina (corto = 1 libro; el scroll vertical no se atrapa) solo se probó con toque sintetizado. Falta un iPhone (Safari) y un Android (Chrome).
7. **Taller Skribh** del 23 nov: sigue fuera hasta su OK; su fecha ya está encima.
8. **(v4.2) Lista de Destacados:** la eligen Aldo/Roberto (ids en `src/frente/destacados.json`, 6–10 libros con portada). El prototipo usa una regla provisional (los primeros 8 con portada en el orden del inventario) que **no** es curaduría.
9. **(v4.2) ¿«Tienda» en la navegación?** Hoy no está: el esqueleto es un anuncio. Cuando haya productos reales, decidir si entra.
10. **PRODUCT.md** está desfasado (Mi lista, abierto/cerrado calculado, «Cartelera» con propuestas, barra inferior de 3 casillas). Tras aprobar, actualizarlo; DESIGN.md se reescribe al final, con el mundo ya construido (`new-work.md` §5 y §7).

## 11. Prompt de implementación (para un agente de código; usar solo tras el OK de Aldo)

```
Repo Aldo14G/Itinerante. Crea la rama agent/claude/landing-v4-camioneta desde agent/claude/secciones-v3 (PR #7) y abre un PR borrador hacia esa rama. No hagas merge ni deploy, y no uses force push. Commits con autor "Aldo G Pineda <gioaldo101@gmail.com>" y trailer "coautor del commit". En el repo no se mencionan otros agentes ni herramientas.

OBJETIVO: implementar en /nuevo la dirección «La camioneta» v4.2 descrita en DESIGN-DIRECTION.md (te la paso adjunta) y en el prototipo de referencia (prototipo/index.html, app.js y build.py adjuntos). El prototipo NO es código de producción: reescríbelo en el stack existente (React 19 → HTML estático en build, route handler con revalidate 3600, CSS precompilado). Se revocan la regla S-13 y el tope de ~2 KB de JS. Regla de Aldo: el movimiento se mejora, nunca se quita; solo prefers-reduced-motion lo suaviza.

RENDER (criterio de aceptación explícito):
- Producción con contenido completo sin JS: SSR o HTML estático. Con JS desactivado, el HTML del servidor trae la Portada, los eventos futuros, los 8 Destacados (como lista; la vitrina los mejora), el catálogo con los 41 libros (cada uno enlaza a WhatsApp con el mensaje prellenado), el esqueleto de la Tienda con «Próximamente», Visita completa y la carta. No copies la arquitectura del prototipo v4.0, que pintaba todo desde JS; build.py del prototipo v4.2 muestra el resultado esperado.
- Catálogo como la plantilla de la biblioteca (Aldo14G/biblioteca-ecrmnl, web/app/(catalogo)/page.tsx y web/components/SearchPage.tsx): los filtros, la búsqueda, el orden, la vista y la página funcionan también sin JS por GET (?q, genero, editorial, orden, vista, pagina) resueltos en el servidor, y ?libro=ID renderiza la ficha. El JS solo los vuelve instantáneos y animados.
- GSAP solo mejora lo que el HTML ya trae: nada empieza con opacity:0 desde CSS. Sin JS, la vitrina se oculta y el catálogo muestra los 41.
- El pasado de eventos se oculta en el servidor y de nuevo en el navegador (hora America/Monterrey), para cubrir el desfase del revalidate el día 28.

DATOS (únicas fuentes; no inventes nada):
- assets/data/catalog.json (41 libros) + src/frente/correcciones.json. Precio null = no se imprime nada, ni «Precio en tienda» ni otro sustituto (caso: «Las ruinas de la caza»; el precio lo da Roberto).
- src/frente/eventos.json: registroUrl → «Registrarme», si no «Ver en Instagram» al post oficial.
- src/frente/negocio.json: horario.confirmado true → Lun–sáb 11:00–20:00 · Domingo cerrado; el JSON-LD lee el mismo campo; nunca Abierto/Cerrado.
- src/frente/destacados.json (NUEVO, lo llena la librería): ids de 6–10 libros con portada para la vitrina «Destacados». Si falta o está vacío, la sección Destacados no se pinta (no se inventa selección); el catálogo sigue.
- assets/data/collections.json: géneros del filtro (Narrativa = narrativa + ensayo-narrativa; Poesía = poesia + ensayo-poesia; Ensayo = ensayo + divulgacion + ensayo-poesia + ensayo-narrativa). Editorial desde catalog.json. Ningún otro filtro (no hay año, materia ni formato en los datos).
- src/frente/merch.json: con < 2 productos de un tipo, la Tienda es un esqueleto: H2 «Tienda» + sello «Próximamente» + «Merch y talleres: próximamente.» + huecos rotulados Libros · Merch · Talleres (sin productos, precios ni fotos inventados, sin enlaces, sin brillo en bucle). Con ≥ 2 productos reales de un tipo, su hueco se vuelve tarjetas reales (S-19).
- assets/data/menu.json: «En la barra» en grupos; precio null = nada; sin la nota «Los tés…».
- faq.json: solo «¿Tienen el libro que busco?» y «¿Abren en días festivos?».

SISTEMA:
- Barlow Condensed (600, 700) y Barlow (400, 600) reemplazan a Inter en todo. 4 caras, OFL, woff2 locales con subset latino (≤ 80 KB en total), precarga de Condensed 700 y Barlow 400, y fuente de respaldo con size-adjust/ascent-override (CLS < 0.01). Nada desde fonts.googleapis.
- Tokens: --menta #5dc4b4, --tinta #061a18, --sala #0d4a45, --vitrina #082724, --papel #f1f5f2, --papel-2 #e4ece8, --linea #c9d8d2, --ambar #e8a020 (solo luz, selección y foco sobre oscuro).
- Escala de 4 px; contenido de 1320 px; márgenes clamp(20px, 4vw, 56px).
- Curvas: expo-out cubic-bezier(.16,1,.3,1); cierres power3.in.
- Iconos SVG de un trazo de 2 px.
- Isotipo: el trazo vectorizado del logo (camioneta-trazo.svg adjunto, derivado de Logo.png), como <symbol>.
- Superficies del navegador: ::selection, caret-color, scrollbar-color, anillos de foco de 3 px (tinta en claro, ámbar en oscuro) y enlace «Ir al contenido» como primer foco.
- Portadas en 400 px de ancho para estante, vitrina y camioneta; la original solo en la ficha.

SECCIONES (orden y reglas en §6 y §6b del documento): cabecera que sigue el suelo (Eventos · Libros → #destacados · Visita) · Portada menta en cartel simétrico, retícula 1fr auto 1fr, con el centro de la camioneta en el centro de la vista (±4 px) y 4 portadas reales dentro de la caja (1 CTA, S-18) · Eventos como ruta de paradas con tarjetas al estilo Luma (fecha 1 vez, en la parada; hora/«Hora por anunciar» bajo el título; cartel neutro con la camioneta; flechas solo si la ruta desborda) · Destacados (#destacados): H2 «Destacados» (nunca «Tienda»), vitrina 3D oscura con «i de N» y enlace «Ver el catálogo completo» · Catálogo (#libros) con la estructura de la plantilla: H2 «Catálogo» + conteo, buscador con «Borrar búsqueda» y atajo «/», panel «Filtros» de 256 px pegajoso (≥ 1024) / botón «Filtros» con insignia y hoja <dialog> (< 1024), píldoras Género y Editorial con aria-pressed y conteo, barra con conteo vivo + Ordenar + cuadrícula/lista, filtros aplicados quitables + «Quitar filtros», estado vacío con el copy de la plantilla + WhatsApp, «Mostrar más (N restantes)» de 20/12/10 con foco al primer nuevo, orden por omisión con portada primero, placeholder sin título repetido · Tienda esqueleto (#tienda) entre el Catálogo y Visita, fuera de la navegación · Ficha en hoja lateral o inferior con portada compartida · Visita menta (orden S-20) · pie en tinta.
- No copies la marca de la plantilla (rojo #b90006, logos, CruzAir): todo en menta, tinta, Barlow y la camioneta. Done: a 390, la parte superior de #visita queda a ≤ 6,000 px.

MOVIMIENTO (tabla §7 del documento):
- GSAP 3.13 core + Flip desde npm, en el bundle (nada de jsdelivr). Sin Draggable ni InertiaPlugin: el arrastre de la vitrina va con Pointer Events propios.
- Vitrina: una parada de Tab; ←/→/Inicio/Fin; Enter abre la ficha; aria-roledescription="carrusel"; aria-live en la ficha breve. .vitrina:focus-visible con anillo de 3 px de contraste ≥ 3:1 (ámbar sobre #082724 = 7.15:1) y pista visible «← → para hojear» mientras tiene el foco.
- Gesto: el dedo mueve la vitrina 1:1 (paso 0.74·W). Al soltar: < 24 px vuelve; < 2 pasos avanza exactamente 1 libro (180 px = 1 libro); más largo, lo recorrido; sin inercia libre. touch-action: pan-y y ningún manejador de rueda: el scroll vertical y la rueda sobre la vitrina mueven la página.
- Portadas de la vitrina diferidas: solo ±3 alrededor del centro tienen src.
- Catálogo con FLIP contenido para filtro, búsqueda, orden y cuadrícula↔lista: durante la animación #resultados lleva overflow: clip y la rejilla conserva su alto previo (min-height); al terminar se suelta y el inicio de los resultados vuelve a su posición en la vista (±8 px). «Mostrar más»: los nuevos entran escalonados (y 20 → 0). Hoja de filtros: sube desde abajo (450 ms) y baja al cerrar (250 ms). Con reduce, todo instantáneo.
- Con prefers-reduced-motion: vitrina plana con la misma geometría, sin giro ni z, crossfades de 150 ms; los estados se siguen leyendo.
- Nada en bucle ni en autoplay.

PRUEBAS (añade o ajusta tests y que todo pase):
1. Sin JS, el HTML trae los 41 libros, los eventos futuros, Visita completa, la carta y la línea «próximamente»; captura a 390 sin JS.
2. Conteos visibles: «Matamoros» 1, enlaces a google.com/maps 1, teléfono 1, role="switch" 0, «Mi lista» 0, «apartar» 0, «próximamente» 2 (sello + línea, dentro de #tienda, sin rol de tab, botón ni enlace), «Precio en tienda» 0, «Tienda» dentro de #destacados 0 (H2 y aria-label); el esqueleto de #tienda con 0 imágenes, 0 precios y 0 elementos interactivos; frases-vetadas.json = 0.
3. Reloj en 2026-11-28: el Aniversario desaparece y el CTA de la Portada pasa a «Ver libros».
4. axe 0 violaciones a 1440 y 390, normal y reducido; objetivos ≥ 44 px (en línea ≥ 24 px); primer Tab = «Ir al contenido»; con Tab real, la vitrina muestra el anillo ≥ 3:1 y la pista; el buscador, ≥ 3:1.
5. Con reduced-motion emulado, la vitrina no lleva rotateY ni translateZ.
6. Filtro Poesía activar/quitar muestreado por fotograma: ninguna portada visible fuera de la caja de #resultados y el inicio de los resultados se mueve ≤ 8 px.
7. A 390: #visita ≤ 6,000 px. Catálogo: «Mostrar más (N restantes)» presente sin filtro, el foco pasa al primer libro nuevo; búsqueda + filtro dan el conteo correcto y el URL refleja el estado; sin JS y con ?q=…&genero=… el servidor devuelve los resultados filtrados; la hoja de filtros atrapa el foco y lo devuelve al botón. Portada: |centro de la camioneta − centro de la vista| ≤ 4 px a 1440×900 y 390×844.
8. Gestos: toque sintetizado de 180 px = 1 libro (lento y rápido); swipe vertical sobre la vitrina desplaza la página; rueda sobre la vitrina desplaza la página. Prueba además en un iPhone (Safari) y un Android (Chrome) reales y adjunta un video corto de cada uno; si no se pudo, dilo en el PR.
9. Primera fila del catálogo a 1440 y los 4 primeros a 390 con portada real; el placeholder no repite el título.
10. Peso: ≤ 700 KB transferidos a 390 al cargar y tras recorrer la página (medido en el preview, con compresión); 0 peticiones a jsdelivr, fonts.googleapis y fonts.gstatic; ≤ 4 caras de fuente; CLS < 0.01.
11. Playwright: capturas de cada sección a 1440 y 390, normal y reducido, más un video con el arrastre de la vitrina, filtro + búsqueda + orden + vista + «Mostrar más», el swipe táctil y la apertura de la ficha.
12. Con un merch.json de muestra de ≥ 2 productos, el hueco del tipo se vuelve tarjetas reales y la línea «próximamente» deja de mencionarlo.

NO HAGAS:
- eyebrows ni números de sección; tarjetas iguales como estructura; Inter en cualquier rol; vidrio decorativo; texto con degradado; emoji como iconos;
- pestañas, chips o enlaces vacíos para Merch o Talleres (lo permitido es el esqueleto: sello «Próximamente», la línea «Merch y talleres: próximamente.» y huecos rotulados sin enlace); productos, precios o fotos inventados; «Precio en tienda» u otro texto sustituto de precio; «Tienda» como título del carrusel; filtros con metadatos que no existen; la marca de la plantilla de la biblioteca;
- quitar o apagar movimiento para resolver un problema (se arregla: se contiene, se acota, se le da foco); scroll-jacking; contenido que solo aparece con JS; fuentes o GSAP desde CDN;
- «Cómo llegar» fuera de Visita; fotos sin permiso (oficial-rincon no); carteles de Instagram descargados sin permiso de Roberto; el taller Skribh.

ENTREGA: PR borrador con capturas, video, resultados de tests y axe, y la lista de pendientes P2 (§9). Al final, reescribe DESIGN.md con el sistema construido y propone en el PR (sin aplicarlos) los cambios a PRODUCT.md.
```

---

## 12. Archivos
- Este documento (v4.2): `/workspace/projects/itinerante-design-2026-11-22/DESIGN-DIRECTION.md`. v4.1: `DESIGN-DIRECTION.v41.md`; v4.0: `DESIGN-DIRECTION.v1.md`
- Prototipo v4.2 (se abre servido desde la carpeta raíz del proyecto; copia íntegra de v4.1 en `prototipo-v41/`): `prototipo/index.html` (generado; contenido completo sin JS), `prototipo/build.py` (genera el HTML desde `plantilla.html` + `estilos.css.part` + `datos.js`; equivale al render del servidor), `prototipo/app.js` (solo mejora), `prototipo/datos.js` (generado del PR #7), `prototipo/camioneta-trazo.svg`, `prototipo/fuentes/` (4 woff2 con subset), `prototipo/vendor/` (gsap y Flip 3.13, locales). Versión v4.0: `prototipo/index.src.v1.html`, `prototipo/app.v1.js`
- Assets descargados del repo (`main` @ 21526515, solo lectura): `assets/portadas/` (32), `assets/portadas-400/` (las mismas a 400 px), `assets/img/` (fotos y logo)
- Capturas v4.1: `capturas-v2/{1440,390}[-reducido]-{inicio,eventos,tienda,libros,visita,cafe,ficha,filtro-poesia,completa,vitrina-foco,buscador-foco,skip-link}.png`, `capturas-v2/390[-reducido]-ver-todos.png`, `capturas-v2/{1440,390}-sinjs-completa.png`. Capturas v4.0: `capturas/`
- Videos v4.1: `video/movimiento-v2-1440.mp4` (30.3 s: llegada de la camioneta → Eventos → vitrina con inclinación, dos arrastres de 180 px = 1 libro cada uno, arrastre largo, foco por Tab con pista y flechas → ficha con portada compartida → estante con hover → filtro Poesía → Todos → Capítulo Siete → Todos → ficha desde el estante) y `video/movimiento-v2-390-tactil.mp4` (19.8 s: swipes de 180 px lento/rápido/de vuelta = 1 libro cada uno, swipe vertical sobre la vitrina que baja la página, filtro Poesía → Todos, «Ver los 41 libros»). Hojas de fotogramas: `video/fotogramas-v2/`. Video v4.0: `video/movimiento-1440.mp4`
- Referencias: `referencias/*.png` (Aardvark, Codapress, 197 Historias, Delta Cafés, Agrumea, Money in Check, CRL, Norstedts, Luma, MonteCoyote)
- Lecturas de Impeccable (público, contraste): `_ref/impeccable/`; repo: `_ref/repo-main/`, `_ref/pr7/`, `_ref/pr7-PRODUCT.md`, `_ref/pr7-DESIGN.md`
- **v4.2:** capturas `capturas-v3/{1440,390}-{01-inicio,02-destacados,03-catalogo,04-catalogo-filtro-busqueda,04c-catalogo-vacio,04d-catalogo-lista,05-tienda-esqueleto,06-visita,07-ficha}.png`, `capturas-v3/390-04b-hoja-filtros.png`, `capturas-v3/{1440,390}-sinjs-completa.png`; video `video/movimiento-v3-1440.mp4` (33.9 s: llegada de la camioneta centrada → Destacados con dos arrastres de 180 px = 1 libro, arrastre largo, foco por teclado y ficha → catálogo: hover, Poesía, búsqueda «los», «Quitar filtros», «Borrar búsqueda», orden por precio, cuadrícula↔lista, «Mostrar más» → esqueleto de Tienda → Visita), fotogramas en `video/fotogramas-v3/`; scripts `medir-v3.js` (→ `medir-v3.json`), `capturas-v3.js`, `video-v3.js`; plantilla de la biblioteca (solo lectura) en `_ref/biblioteca/repo/`
- Scripts de verificación v4.1: `medir-v2.js` (→ `medir-v2.json`), `capturas-v2.js`, `capturas-foco.js`, `video-v2.js`. v4.0: `capturas.js`, `video.js`, `axe.js`

# Itinerante · Dirección de diseño v4 (fase de diseño, sin código de producción)

22 nov 2026, 15:40 (hora de Monterrey/CDMX, UTC−6). Encargo: rehacer la arquitectura UI **antes** de tocar el repo, revisando Awwwards y usando Impeccable.
No se tocó el repo ni se abrió PR. No se publicó ni envió nada. Todo vive en `/workspace/projects/itinerante-design-2026-11-22/`.

> **Autoridad de método:** la copia íntegra de Impeccable v4.9.0 en la guía local de diseño (SKILL.md + `reference/*.md`). El público `pbakaus/impeccable` (v4.10.0, leído antes en `_ref/impeccable/`) solo sirvió de contraste.
> **Launcher unavailable:** no se ejecutó `scripts/impeccable` (descarga un binario). Por eso no corrieron `context`, `concept-seed`, `detect`, `shot` ni `motion-capture`. Se aplicó la ruta «Launcher unavailable» de SKILL.md. Se leyeron PRODUCT.md y DESIGN.md del repo (rama `agent/claude/secciones-v3`, vía `gh api`). Los pasos 1–3 de `new-work.md` se hicieron a mano, con `seed: none (unavailable)`. Las capturas salieron de Playwright y la revisión de accesibilidad de axe-core.

---

## 0. Resumen (5 líneas)

1. Diagnóstico: v1–v3 fallaron por **mundo**, no por detalle. Usaban Inter como display, «suelo blanco + turquesa» al modo Apple y secciones de tarjetas iguales. En v2 el movimiento se trató como pecado y el resultado salió intercambiable con cualquier landing.
2. Dirección nueva, **«La camioneta»**: el trazo a mano del logo (una camioneta cuya caja de carga parece un libro abierto) es el material de la página. La menta del logo ocupa regiones enteras y una vitrina oscura funciona como escenario de las portadas.
3. Arquitectura: Portada (la camioneta llega cargada de libros reales) → Eventos (paradas de una ruta, tarjetas al estilo Luma) → Tienda (vitrina 3D) → Libros (estante con filtros y FLIP) → Visita (dirección, horario y «Cómo llegar» una sola vez, carta «En la barra»).
4. El movimiento se mejora y no se quita. Hay un momento de autor: la vitrina 3D con arrastre, inercia, imán, teclado, inclinación hacia el puntero y la portada que «vuela» a la ficha. La llegada de la camioneta solo se ve una vez. Con `prefers-reduced-motion` todo queda plano, sin desplazamientos, pero los estados se siguen leyendo.
5. El prototipo funciona con datos reales: 41 libros, 32 portadas, 2 eventos oficiales, carta y horario confirmados. axe marca 0 violaciones a 1440 y a 390 px. Hay 20 capturas y un MP4 de 27 s. Quedan 6 decisiones para Aldo (§10) y un prompt de implementación listo (§11).

---

## 1. Principios de Impeccable aplicados (y qué archivo los gobierna)

| Principio | Referencia que manda | Cómo se aplica aquí |
|---|---|---|
| Modo por superficie: la landing es **Persuade**; la vitrina y el estante, **Experience** | `SKILL.md` § Modes; `mode-persuade.md` | Portada: en segundos se entiende qué es, por qué importa y qué hacer (1 CTA). En la Tienda el libro manda y la interfaz se retira. |
| **Redesign replaces**: se conserva la verdad del producto y se cambia el mundo visual | `SKILL.md` § How to design; `new-work.md` §1 | Se conserva: logo, menta/verde del logo, datos, reglas de Aldo y spec v2. Se cambia: el sistema «Itinerante Líquido» (Apple/Inter/blanco), que v1–v3 heredaron. |
| Derivar el mundo de la cultura del público, no de la categoría | `new-work.md` §3 «Create or replace the visual world», pasos 1–3 | 7 candidatos de 4 familias de material (§4). Se descartan «crema + serif» y «negro cinematográfico». |
| Estrategia de color antes que colores; el color ocupa regiones | `new-work.md` §4; `colorize.md` | **Committed**: la menta ocupa la Portada y Visita (~40 % del scroll); la vitrina oscura, la Tienda. El papel menta claro queda para leer. |
| Caras con postura; no las de entrenamiento | `new-work.md` §4 (lista vetada: Inter-as-display, DM Sans, Fraunces…); `craft-floor.md` (sin fuente de sistema como display) | **Barlow Condensed** (display) + **Barlow** (texto), OFL. Barlow viene de la señalética de carretera: una librería que nació sobre ruedas. |
| Roles tipográficos con contraste obvio; medida de 45–75 ch | `typeset.md` | 5 roles (§5.1); sinopsis a ≤ 62 ch; `text-wrap: balance` en títulos. |
| Retícula y ritmo: grupos cerrados, separaciones generosas; más aire arriba del título que abajo | `layout.md`; `craft-floor.md` § Spacing | Escala de 4 px; secciones de 96–128 px; estante con 48 px vertical y 28 px horizontal. |
| **Un** momento de autor; ningún reveal idéntico en cada sección; el contenido es visible por omisión | `animate.md` § Motion thesis; `craft-floor.md` § Motion | La vitrina es el foco. La llegada de la camioneta pasa una sola vez y el escalonado solo en el estante (como lista, tope de 300 ms). |
| El hover nunca mueve al elemento propio; se mueve un hijo | `animate.md` § Hover | La tarjeta queda quieta; `.portada-libro` (hija) se inclina y sube 6 px. |
| `reduced-motion` = menos y más suave, no apagado | `animate.md` § Accessibility; `audit.md` §1 | La vitrina queda plana con la misma geometría, crossfades de 150 ms y sin inercia. |
| Superficies del navegador con diseño | `craft-floor.md` § Browser surfaces | `::selection` ámbar, `caret-color`, `scrollbar-color`, anillos de foco de 3 px (tinta en claro, ámbar en oscuro), `tabular-nums`. |
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
| Inter como display, escala Apple HIG y suelo blanco con turquesa: «sistema» sin mundo | v1–v3 (`tema-itinerante.css`: `--font-family-heading: Inter`) | `new-work.md` §4 (Inter-as-display vetada; «familiar = no buscaste»); `mode-persuade.md` («un mundo reducido a acento sobre plantilla neutra es el default con calcomanía») | Barlow Condensed + Barlow; la menta del logo ocupa regiones enteras. |
| Se quitó el movimiento (S-13: solo hover de 150 ms, sin carrusel) | v2 | `animate.md` («reduced-motion no es apagar»; un momento de autor) | Se recupera y mejora la vitrina 3D; el movimiento explica estado y continuidad. |
| El carrusel restaurado se veía plano | v3 | `animate.md` § Choose material by meaning (profundidad: luz, sombra, desenfoque) | Perspectiva de 4 piezas, giro de 42°, profundidad, brillo atenuado en vecinas, lámpara ámbar acotada y sombra con offset. |
| Categorías «Próximamente» como relleno | v3 | `craft-floor.md` § Refuse (contenedores que sustituyen contenido); spec S-19 | La riqueza viene de ejes **reales**: Género (Narrativa 25 · Poesía 7 · Ensayo 6 · Otros 3) y Editorial (Abismos 19 · Iridiscencias 10 · Capítulo Siete 10 · Otros 2). Merch/Talleres aparecen solos cuando haya datos (decisión abierta §10). |
| Secciones que son «tarjetas iguales» y cuadrícula plana | v2–v3 | `craft-floor.md` (tarjetas iguales como estructura); `layout.md` (la topología sigue al contenido) | Cada sección tiene su topología: campo con objeto (Portada), ruta horizontal (Eventos), escenario (Vitrina), estante (Libros), ficha técnica (Visita). |
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

### 5.1 Tipografía (Barlow Condensed + Barlow, OFL; en producción se alojan localmente, solo los pesos usados)
| Rol | Cara · peso | Tamaño / interlínea | Tracking | Uso |
|---|---|---|---|---|
| Display (H1) | Barlow Condensed 700 | clamp(64px, 9.2vw, 136px) / 0.86 · 390 px: clamp(54px, 15vw, 84px) ≈ 58 px | −0.02em | Solo el nombre en la Portada |
| Sección (H2) | Barlow Condensed 700 | clamp(48px, 6.2vw, 88px) / 0.9 | −0.01em | Eventos · Tienda · Visita (una palabra) |
| Título (H3) | Barlow Condensed 600–700 | 22–44 px / 0.95–1.02 | −0.01em | Evento, libro, «En la barra», ficha |
| Texto | Barlow 400 | 17 px / 1.55 (sinopsis ≤ 62 ch) | 0 | Línea, sinopsis, respuestas |
| Metadato / versalitas | Barlow 600 | 12.5–13 px / 1.3, mayúsculas | +0.09em | AUTOR · EDITORIAL · GÉNERO · ISBN; grupos de la carta. **Nunca encima de un título.** |
| Acción | Barlow 600 | 16–17 px | 0 | Botones y chips (≥ 44 px de alto) |
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
| Ámbar | #e8a020 | Solo luz de la vitrina, `::selection` y foco sobre oscuro | Sobre vitrina: 7.15:1 |
| Blanco | #ffffff | Trazo de la camioneta (decorativo), tarjetas de evento | — |

**Prohibido:** texto blanco sobre menta (2.1:1).

### 5.3 Retícula y ritmo
- 12 columnas, contenido de 1320 px, márgenes clamp(20px, 4vw, 56px); separación de 24 px.
- Escala de 4 px: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
- Secciones: 96 px arriba y 128 px abajo (más aire arriba del título que abajo, y cierre generoso).
- Cadencia de densidad (`new-work.md` «Pace the scroll»): campo amplio (Portada) → ruta ligera (Eventos) → escenario con un solo objeto (Vitrina) → pasaje denso (Estante) → ficha práctica y cálida (Visita) → pie en tinta.
- Cambio de suelo por sección: menta → papel → vitrina → papel → menta → tinta. La cabecera adopta el suelo de la sección bajo ella (240 ms).

---

## 6. Arquitectura sección por sección

| # | Sección (ancla) | Propósito | Contenido real (fuente) | Jerarquía | Estados |
|---|---|---|---|---|---|
| 0 | Cabecera | Orientarse | Logo (trazo) + «Itinerante y Más»; Eventos · Tienda · Visita | Logo → 3 enlaces ≥ 44 px; subrayado = sección actual | Sigue el suelo; a 390 solo el isotipo (S-21) |
| 1 | Portada (`#inicio`) | Qué es y qué hacer | H1 = nombre; línea de `negocio.json`; 4 portadas reales en la camioneta | H1 → línea → 1 CTA | CTA «Ver eventos» si hay evento futuro; si no, «Ver libros» → `#tienda` (S-18) |
| 2 | Eventos (`#eventos`) | Qué pasa y cómo ir | `eventos.json`: 6.º Aniversario (VIE 27 NOV, «Hora por anunciar», «En la librería») y Club de Dibujo y Pintura (sábados cada 15 días, 14:00–16:00, $150 MXN, incluye material, con Santiago González) | Ruta con punto por fecha → tarjeta Luma (hora · título · anfitrión · lugar · cartel) → CTA | CTA **Registrarme** si hay `registroUrl`; si no, **Ver en Instagram** al post oficial. Pasados ocultos (hora MTY). ≥ 3 eventos: flechas + snap; vacío: «Sin fechas publicadas por ahora. La agenda sale primero en Instagram.» Skribh fuera hasta el OK de Aldo. |
| 3 | Tienda · Vitrina (`#tienda`) | Hojear como en la mesa | 32 libros con portada (`catalog.json`); título · autor · editorial · precio de la central | Portada central → ficha breve (aria-live) → «5 de 32» + flechas | Arrastre/inercia/imán, ←/→/Inicio/Fin, Enter abre la ficha; clic en una vecina la trae al centro |
| 4 | Libros (`#libros`) | Encontrar uno concreto | Los 41 (9 con placeholder); filtros Género y Editorial con conteos (solo valores ≥ 2, el resto en «Otros»); buscador | Filtros (pegajosos en escritorio) → estante 5–6 columnas / 2 en móvil | Vacío: «No está en la tienda, pero te lo podemos pedir.» + WhatsApp. Pestañas Libros/Merch/Talleres solo cuando haya ≥ 2 productos del tipo (S-19) |
| 4b | Ficha (hoja lateral / inferior) | Decidir y preguntar | Portada, título, precio, AUTOR · EDITORIAL · GÉNERO · ISBN (solo con dato), sinopsis | Portada → título → precio → atributos → sinopsis → 1 CTA | «Consultar disponibilidad por WhatsApp» con mensaje prellenado (S-17); Esc, velo y botón cierran; el foco vuelve |
| 5 | Visita (`#visita`) | Llegar | Dirección + entre calles; horario confirmado (Lun–sáb 11:00–20:00 · Domingo cerrado); **1** «Cómo llegar»; WhatsApp, Tel., Instagram, Facebook, correo y «Rentar el espacio» (formulario oficial); foto del pasillo (Aldo, con permiso) | Orden S-20: dirección/horario/Cómo llegar → contacto → «En la barra» (carta, 2 columnas) → FAQ (2 preguntas) | Sin Abierto/Cerrado. Precio nulo = no se imprime nada |
| 6 | Pie | Cierre | Nombre · © · créditos de fotos | — | Sin dirección ni Maps |

Conteos garantizados: «Matamoros» visible 1, enlaces a Maps 1, teléfono 1, 0 switches, 0 «Mi lista», 0 «apartar».

---

## 7. Spec de movimiento

**Tesis (`animate.md`):**
- **Foco:** la vitrina 3D.
- **Continuidad:** portada → ficha (elemento compartido) y filtros (FLIP).
- **Respuesta:** botones (escala 0.97), chips, flechas.
- **Presupuesto:** solo `transform`, `opacity` y `filter` en elementos aislados; `will-change` solo en las piezas de la vitrina.
- **Curvas:** salida `cubic-bezier(.16,1,.3,1)` (expo-out); cierres `power3.in`, más cortos.

| Sección | Qué se mueve | Disparador | Duración · curva | Con `prefers-reduced-motion` |
|---|---|---|---|---|
| Portada | La camioneta entra desde la izquierda (xPercent −38 → 0) mientras el trazo se revela con `clip-path`; luego caen las 4 portadas con su giro (escalonado de 80 ms) | Carga, **una vez** | 1.1 s expo-out (trazo 0.9 s power3.out; portadas 0.7 s desde 0.55 s) | Aparece quieta. El H1 y el CTA nunca se animan (visibles por omisión). |
| Cabecera | Fondo y color según el suelo; subrayado de la sección actual | Scroll | 240 ms / 300 ms expo-out | Igual (es un cambio de estado, no un desplazamiento) |
| Eventos | Ruta horizontal con snap; flechas con scroll suave; la sombra de la tarjeta crece al pasar el puntero | Gesto, flechas, hover | Nativo; sombra 300 ms | Scroll instantáneo; sombra igual |
| **Vitrina** | Pose por pieza según la distancia d al centro: x = ±(0.74·cerca + 0.46·lejos)·W, z = −(0.62·cerca + 0.42·lejos)·W, rotateY = ∓42°·cerca, brillo de vecinas 1 → 0.62; perspectiva 4W; se desvanece más allá de ±3.4 (±1.6 en móvil) | Arrastre (Draggable + Inertia), flechas, teclado, clic en vecina | Tween 0.75 s expo-out; lanzamiento con inercia y snap al entero | Plana: misma geometría sin giro ni z (escala 0.84 / 0.80) y vecinas atenuadas; sin inercia (salto directo al soltar) |
| Vitrina · portada central | Se inclina hacia el puntero (rotateY ±10°, rotateX ±8°) y se adelanta 30 px; se mueve **la cara** (hija), no la pieza | Puntero fino | 450 ms expo-out | Desactivado |
| Vitrina · ficha breve | Crossfade del título/autor/precio con desenfoque 6 px → 0 y y 8 → 0 | Cambio de central | 380 ms expo-out | Solo opacidad, 150 ms |
| Estante | Entrada como **lista**: las primeras 12 portadas suben 24 px | Primera vez en vista | 0.7 s, escalonado total 0.3 s | Sin entrada |
| Estante · hover | La portada (hija) sube 6 px, se inclina hacia el puntero (±6°/±4°) y la sombra crece | Puntero fino | 450 ms expo-out | Sin inclinación ni desplazamiento; la sombra sí cambia |
| Estante · filtros | Reacomodo FLIP; los que entran escalan de 0.94 a 1 con fundido, los que salen se van en 200 ms | Chip o búsqueda (160 ms de rebote) | 500 ms expo-out, escalonado de 0.12 s | Cambio instantáneo |
| Ficha | La hoja entra (derecha en escritorio, abajo en móvil); un clon de la portada vuela de su origen al hueco de la ficha | Clic, Enter | 500 ms / 550 ms expo-out; cierre 300 ms power3.in | Aparece con fundido de 150 ms, sin vuelo |
| Botones | Escala 0.97 al presionar; la flecha avanza 3 px | `:active` / hover | 120 ms / 250 ms | Igual (feedback) |

Nada corre en bucle ni en autoplay, y nada depende del scroll salvo el cambio de suelo de la cabecera.

---

## 8. Anti-patrones vetados en la implementación (lista Impeccable aplicada)
1. Eyebrow o rótulo encima de un título (Eventos, Tienda, Visita van solos).
2. Números de sección «01 / 02».
3. Hero partido con texto a un lado y foto o tarjeta al otro.
4. Filas de tarjetas iguales como estructura de página.
5. Inter (o cualquier fuente de sistema) como display, y las fuentes vetadas de `new-work.md` §4.
6. Crema + serif + terracota.
7. Vidrio o desenfoque decorativo.
8. Texto con degradado.
9. Barra de color en un costado.
10. Sombras duras sin desenfoque.
11. Emoji o glifos como iconos. La flecha «↗» se dibuja en SVG.
12. Un mismo reveal en cada sección; scroll-jacking; autoplay; marquesinas.
13. Pestañas o chips vacíos («Próximamente») y textos sustitutos de precio.
14. Frases de `frases-vetadas.json`, copy inventado o eventos sin post oficial.
15. «Cómo llegar», la dirección o el teléfono fuera de Visita.
16. Switch de movimiento, «Mi lista», `localStorage` o `role="switch"`.

---

## 9. Autocrítica con la rúbrica de Impeccable (`critique.md` + `audit.md`), 2 rondas

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
| 1 | Accesibilidad | 3 | axe 0; foco visible; vitrina con 1 parada de Tab, ←/→ y Enter; `aria-live` en la ficha breve. Falta probarlo con lector de pantalla real. |
| 2 | Rendimiento | 3 | Solo transform/opacity/filter; portadas lazy. El prototipo carga GSAP y fuentes de CDN: en producción se alojan localmente, con subset y precarga de la fuente display. |
| 3 | Theming | 3 | Tokens en `:root`; algunos colores aún escritos a mano en JS/CSS. Sin modo oscuro, por decisión de escena (claro). |
| 4 | Responsive | 3 | 1440 y 390 verificados. Arrastre táctil (`touch-action: pan-y`) solo emulado: el gesto con dedo real queda **sin probar** en dispositivo físico. |
| 5 | Integridad | 3 | Sistema coherente y específico. No corrió el detector de Impeccable (binario no ejecutado). |
| **Total** | | **15/20 (Good)** | |

**Pendientes P2 para implementación:** botón «Limpiar filtros»; degradado de borde en la fila de chips móvil; estado de carga (esqueleto del color del papel) para portadas; prueba táctil en un iPhone real; captura de movimiento normal y reducido de la ficha y de los filtros por separado (`animate.md` § Verify).

---

## 10. Decisiones que necesita Aldo (no se inventaron)
1. **Merch y Talleres en la Tienda:** ¿pestañas solo cuando haya ≥ 2 productos reales (recomendado, S-19) o una mención «Próximamente»? Hoy `merch.json` está vacío y el Club vive en Eventos.
2. **Fotos:** `oficial-rincon` no tiene permiso registrado (`negocio.json`: `permisoRegistrado: false`) y no se usó. Las fotos de Instagram de @sharonmirelesgong y @alfonso_boeta siguen pendientes. El prototipo solo usa la del pasillo (Aldo, con permiso).
3. **Imágenes de eventos:** los carteles de Instagram necesitan el permiso de Roberto. Mientras tanto, el cartel tipográfico (fecha + camioneta) hace de portada.
4. **Taller Skribh** del 23 nov: sigue fuera hasta su OK. Además, su fecha ya está encima.
5. **Tipografía:** aprobar Barlow Condensed + Barlow, que reemplaza a Inter del sistema «Itinerante Líquido».
6. **PRODUCT.md** está desfasado (Mi lista, abierto/cerrado calculado, «Cartelera» con propuestas, barra inferior de 3 casillas). Tras aprobar, actualizarlo; DESIGN.md se reescribe al final, con el mundo ya construido (`new-work.md` §5 y §7).

---

## 11. Prompt de implementación (para un agente de código; usar solo tras el OK de Aldo)

```
Repo Aldo14G/Itinerante. Crea la rama agent/claude/landing-v4-camioneta desde agent/claude/secciones-v3 (PR #7) y abre un PR borrador hacia esa rama. No hagas merge ni deploy, y no uses force push. Commits con autor "Aldo G Pineda <gioaldo101@gmail.com>" y trailer "coautor del commit". En el repo no se mencionan otros agentes ni herramientas.

OBJETIVO: implementar en /nuevo la dirección «La camioneta» descrita en DESIGN-DIRECTION.md (te la paso adjunta) y en el prototipo de referencia (index.html + app.js adjuntos). El prototipo NO es código de producción: reescríbelo en el stack existente (React 19 → HTML estático en build, route handler con revalidate 3600, CSS precompilado). Se revocan la regla S-13 y el tope de ~2 KB de JS: el movimiento se mejora, no se quita.

DATOS (únicas fuentes; no inventes nada):
- assets/data/catalog.json (41 libros) + src/frente/correcciones.json.
- src/frente/eventos.json: el pasado se oculta en servidor y navegador con la hora de America/Monterrey; registroUrl → «Registrarme», si no «Ver en Instagram».
- src/frente/negocio.json: horario.confirmado true → Lun–sáb 11:00–20:00 · Domingo cerrado; el JSON-LD lee el mismo campo; nunca Abierto/Cerrado.
- assets/data/menu.json: «En la barra»; precio null = nada; sin la nota «Los tés…».
- faq.json: solo «¿Tienen el libro que busco?» y «¿Abren en días festivos?».

SISTEMA:
- Fuentes Barlow Condensed (600, 700) y Barlow (400, 500, 600), OFL, alojadas localmente en woff2 con subset latino y precarga de la display.
- Tokens: --menta #5dc4b4, --tinta #061a18, --sala #0d4a45, --vitrina #082724, --papel #f1f5f2, --papel-2 #e4ece8, --linea #c9d8d2, --ambar #e8a020 (solo luz, selección y foco sobre oscuro).
- Escala de 4 px; contenido de 1320 px; márgenes clamp(20px, 4vw, 56px).
- Curvas: expo-out cubic-bezier(.16,1,.3,1); cierres power3.in.
- Iconos SVG de un trazo de 2 px.
- Isotipo: el trazo vectorizado del logo (camioneta-trazo.svg adjunto, derivado de Logo.png), como <symbol>.
- Superficies del navegador: ::selection, caret-color, scrollbar-color y anillos de foco de 3 px.

SECCIONES (orden y reglas en §6 del documento): cabecera que sigue el suelo · Portada menta con la camioneta y 4 portadas reales (1 CTA, S-18) · Eventos como ruta de paradas con tarjetas al estilo Luma · Tienda/Vitrina 3D oscura · Libros (estante + filtros Género/Editorial con conteos ≥ 2 + «Otros» + buscador + FLIP) · Ficha en hoja lateral o inferior con portada compartida · Visita menta (orden S-20) · pie en tinta.

MOVIMIENTO (tabla §7 del documento):
- GSAP 3.13 desde npm (Draggable, InertiaPlugin, Flip).
- Vitrina: una parada de Tab; ←/→/Inicio/Fin; Enter abre la ficha; aria-roledescription="carrusel"; aria-live en la ficha breve; touch-action: pan-y.
- Con prefers-reduced-motion: vitrina plana con la misma geometría, sin inercia, crossfades de 150 ms; los estados se siguen leyendo.
- Nada en bucle ni en autoplay.

PRUEBAS (añade o ajusta tests y que todo pase):
1. Sin JS, el HTML trae los 41 libros, los eventos futuros, Visita completa y la carta.
2. Conteos visibles: «Matamoros» 1, enlaces a google.com/maps 1, teléfono 1, role="switch" 0, «Mi lista» 0, «apartar» 0; frases-vetadas.json = 0.
3. Reloj en 2026-11-28: el Aniversario desaparece y el CTA de la Portada pasa a «Ver libros».
4. axe 0 violaciones a 1440 y 390; objetivos ≥ 44 px; foco visible.
5. Con reduced-motion emulado, la vitrina no lleva rotateY ni translateZ.
6. Playwright: capturas de cada sección a 1440 y 390, normal y reducido, más un video del arrastre de la vitrina, la apertura de la ficha y un filtro.
7. Arrastre táctil con toque sintetizado; dilo en el PR si no se probó en un dispositivo físico.

NO HAGAS:
- eyebrows ni números de sección; tarjetas iguales como estructura; Inter como display; vidrio decorativo; texto con degradado; emoji como iconos;
- pestañas «Próximamente»; «Cómo llegar» fuera de Visita; fotos sin permiso (oficial-rincon no); carteles de Instagram descargados; el taller Skribh.

ENTREGA: PR borrador con capturas, video, resultados de tests y axe, y la lista de pendientes P2 (§9). Al final, reescribe DESIGN.md con el sistema construido y propone en el PR (sin aplicarlos) los cambios a PRODUCT.md.
```

---

## 12. Archivos
- Este documento: `/workspace/projects/itinerante-design-2026-11-22/DESIGN-DIRECTION.md`
- Prototipo (estático, se abre servido desde la carpeta raíz): `prototipo/index.html`, `prototipo/app.js`, `prototipo/datos.js` (generado del PR #7), `prototipo/camioneta-trazo.svg`; fuente sin el trazo incrustado: `prototipo/index.src.html`
- Assets descargados del repo (`main` @ 21526515, solo lectura): `assets/portadas/` (32), `assets/img/` (fotos y logo)
- Capturas: `capturas/{1440,390}-{inicio,eventos,tienda,libros,ficha,filtro-poesia,visita,cafe,completa}.png` y `capturas/{1440,390}-reducido-tienda.png`
- Video: `video/movimiento-1440.mp4` (26.6 s: llegada de la camioneta → Eventos → vitrina con inclinación, lanzamiento con inercia, arrastre lento y teclado → ficha con portada compartida → estante con hover → filtros FLIP → ficha desde el estante)
- Referencias: `referencias/*.png` (Aardvark, Codapress, 197 Historias, Delta Cafés, Agrumea, Money in Check, CRL, Norstedts, Luma, MonteCoyote)
- Lecturas de Impeccable (público, contraste): `_ref/impeccable/`; repo: `_ref/repo-main/`, `_ref/pr7/`, `_ref/pr7-PRODUCT.md`, `_ref/pr7-DESIGN.md`
- Scripts de verificación: `capturas.js`, `video.js`, `axe.js`

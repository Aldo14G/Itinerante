# Continuidad de Itinerante — 2026-11-13 (catálogo «Líquido»: carrusel 3D, tarjetas que voltean, Novedades con todo el catálogo y tamaños del teléfono)

- **Pedido de Aldo:** construir el diseño aprobado de Claude Design («Itinerante Líquido»), ajustar los tamaños del teléfono a los estándares de Safari/Chromium; Novedades como carrusel desplegable por todo el catálogo, con selección y enlace directo a Instagram, Facebook y WhatsApp. Antes eligió carrusel de portadas en 3D, tarjetas que voltean y movimiento sutil.
- **Carrusel 3D** (`rail.js`, capa 1 del Catálogo): coverflow sobre el desplazamiento nativo con imán al centro; la pose (`coverflowPose`) sale de la distancia al centro una vez por fotograma; plano con movimiento reducido. La pose va en `.cf-pose` para que el imán centre el `<li>` sin transformar (antes perseguía la silueta girada y se quedaba a 29 px), y la pista no recibe toques (en 3D su plano quedaba delante de las vecinas hundidas). Recorrido de paradas intacto.
- **Tarjeta que voltea** (`catalog.js`, rejilla de Explorar): botón «Voltear» con `aria-pressed`; la portada sigue abriendo la ficha. Se eligió la rejilla (ver DESIGN.md).
- **Novedades** (`news.js`): tira por los 41 libros de la A a la Z con «Ver todo» / «Ver menos» (FLIP); «Nuevo» solo con fechas reales (`shelfPlan`; la lógica de llegadas y sus pruebas siguen). La sección, su enlace y su fila del menú existen siempre; la ficha se abre en modo «redes» (WhatsApp prellenado, Guardar, Instagram, Facebook, Compartir con respaldo de copiar; enlace `#libro-<id>`).
- **Defectos de las capturas:** (a) el hueco de ~75 px entre la dirección y la foto era la reserva de `news-hint` en una primera visita: ahora solo se reserva si la visita anterior dejó llegadas sin ver; (b) en 1440 × 900 el titular quedaba a ~270 px de la barra: la columna ya no se estira a una pantalla y arranca con el borde de la foto (3:2).
- **Teléfono:** márgenes 16/20 con corte en 375, nunca menos que el área segura; selector de orden a 17 px; `text-size-adjust`, sin destello gris, `touch-action: manipulation`.
- **Tokens nuevos:** `profundidad` (`perspectiva-carrusel` 900, `perspectiva-carrusel-ancha` 1200, `giro-carrusel` 52deg, `perspectiva-tarjeta` 1000). **Crítica:** el precio de la hoja va con `data-fuente="hoja"` y no cuenta como precio inventado.
- **Arnés:** `rail.mjs` mide el coverflow (centro, giro, flechas, teclado, vecina, ficha); `feed.mjs` reescribió Novedades; `inp.mjs` mide flecha, vecina, «Ver todo», «Ver menos», ficha con redes y volteo; `saved.mjs`, `ficha.mjs`, `skeleton.mjs`, `contrast.mjs`, `motion.mjs` tocan la portada del centro; `controles.mjs`, `responsive.mjs` y `e2e.mjs` reconocen la tira de Novedades y «Voltear» sobre su portada; `feed.mjs` corrigió su comprobación de la dirección (espacio duro).
- **Abierto:** `copy-repeat` (aviso) sube porque Novedades repite los títulos del catálogo; el 3D se probó solo en Chromium (Safari pendiente en un iPhone real); cuando lleguen fechas reales, revisar el texto del control del inicio en la primera visita (aparece fuera de la vista).

# Continuidad de Itinerante — 2026-11-12 (escala de controles WCAG, pendientes cerrados y revisión adaptada de MotionSites)

- **Pedido de Aldo:** cerrar lo que se quedaba en bucle (pendientes que pasaban de ronda en ronda), corregir dimensiones, tamaños y posiciones de los botones según WCAG, y revisar https://github.com/Motionsites-AI/claude-skill para adaptar lo útil.
- **Revisión previa:** los despliegues de Vercel estaban todos en READY (producción en `478df35`) y el sitio no tiene animaciones infinitas ni temporizadores sueltos (el reloj del estado corre cada 60 s; el bucle de desplazamiento se apaga en reposo). Lo «en bucle» eran los pendientes repetidos.
- **Medición de botones (antes):** siete altos distintos (40, 41, 44, 48, 54, 56, 64/70 px), «Ver las N» de 30 px a 4 px de la lista, enlaces del pie de 41, salto al contenido de 40, «Compartir» a 5–7 px de su vecino, letra de 14 y 16 px mezclada en botones del mismo tipo; en escritorio el párrafo del inicio a la izquierda y sus botones al extremo derecho.
- **Escala de controles:** tokens `--ctl-sm` 44 / `--ctl-md` 48 / `--ctl-lg` 56 (`design/tokens.json` → `tokens.css`). La primaria y los botones de su grupo miden 56 (comparten alto); botones, acciones, chips y botones de icono 48; acciones en texto y cabecera 44. Rótulos de botón a 16 px. 12 px dentro de los grupos. Ahora todo control mide ≥ 44×44 (WCAG 2.5.5 AAA) en 320, 390, 900 y 1440 px.
- **Posiciones:** en escritorio el párrafo del inicio y sus dos botones van juntos a la izquierda, con el aviso de novedades en el renglón de la dirección.
- **Pendientes cerrados:** el «visto» de Novedades usa el día de Monterrey (antes el del dispositivo); el punto de «cerrado» es un anillo hueco gris (antes turquesa, se leía como abierto); `e2e.mjs` usa un puerto al azar y sale con código 1 si falla; el horario puede partir con el texto ampliado; el recorrido se abre a lo ancho en escritorio (paso `clamp(128px, 14vw, 216px)`); las flechas de Novedades ya apuntan a los lados; el lienzo es blanco (sin franja oscura ni destello).
- **De MotionSites (MIT) se adoptó:** la revisión «mira y corrige» con diez criterios y vara (promedio ≥ 8, nada < 7) en `docs/agentes/rubrica-visual.md`, y sus bloqueantes en `tools/qa/controles.mjs` (primer cuadro, fuentes cargadas, imágenes rotas, peticiones fallidas, desborde) junto con la auditoría de controles. **No se adoptó:** ejemplos y repisa de medios (licencia aparte), librerías por CDN, vidrio, video, sus tipografías ni su bloque promocional (chocan con la CSP, los tokens o PRODUCT.md).
- **Verificación:** `npm test` 140 + 18 + 4; `test:design` 80; tokens al día; crítica sin hallazgos; `test:browser` 7/7; `feed.mjs` 48/48; `e2e.mjs` 115/115; `responsive.mjs` 42/42; piso en verde; hero ≥ 4.5:1; movimiento con tokens; INP ≤ 200 ms; `controles.mjs` 26/26 (y falla cuando se rompe un botón a propósito).
- **Abierto:** la foto apaisada del inicio sigue ampliándose en pantallas grandes hasta la sesión profesional; Novedades sigue con datos de ejemplo hasta la lista de Roberto; la línea en ángulo del recorrido solo se probó en Chromium.

# Continuidad de Itinerante — 2026-11-12 (sistema táctil: componentes con canto, letra redonda, cinco destinos, recorrido y Novedades)

- **Pedido de Aldo:** que la UX/UI se sienta como los componentes de una app de aprendizaje bien hecha, sin verse amateur, pensando solo en menú, secciones, catálogo, eventos y talleres y novedades; que invite a volver cuando suban libros; estilo y coherencia marcados. Respuestas a las preguntas: estilo táctil con nuestra identidad; letra redonda en títulos y botones; secciones Inicio, Catálogo, Eventos, Novedades y Más; para volver, «Nuevo desde tu visita», colecciones como recorrido y solo contenido fresco (sin rachas ni retos).
- **Norma:** `DESIGN.md`, «Sistema táctil» (manda sobre lo histórico). Tokens nuevos de borde, canto y «elegido» por tono; Nunito variable (OFL) alojada; Bodoni Moda retirada; texto corrido a 16 px (≤ 6 tamaños por pantalla).
- **Piel (todo el sitio):** una sola regla de control (borde 2 px, canto de 4 px que se hunde al presionar), un solo código de «elegido» (menta con borde turquesa), tarjetas planas, portadas con canto, insignias; sin botones magnéticos ni barridos.
- **Orden y navegación:** Inicio (con La casa) → Catálogo (`#libros`) → Eventos y talleres (`#cartelera`) → Novedades (`#novedades`, capítulo propio) → Visita → pie. Barra inferior acoplada de cinco casillas con nombre (Inicio, Catálogo, Eventos, Novedades, Más); cabecera de escritorio Catálogo, Eventos, Novedades, Visita; hoja «Más» con Mi lista, buscador, La casa, Visita con horario y redes.
- **Catálogo como recorrido:** paradas redondas con icono propio por colección, línea que se colorea al hojear y «N de M paradas hojeadas» (local, sin cuenta). Añadir una colección sigue siendo añadir un objeto al JSON (`icono` opcional).
- **Eventos y talleres:** tarjeta con foto, insignias de tipo y de estado («Propuesta · sin fecha» hasta que el `details` lleve `data-fecha`), «Me interesa», «Compartir» de icono y «Preguntar por WhatsApp». Cabe en el alto útil desde 320×640 (0.91×; antes 1.06×).
- **Novedades:** `novedades.entradas` (`{ id, llegada }`), hoy **12 datos de ejemplo del catálogo de prueba** hasta que Roberto mande la lista real; «Nuevo» por visita (primera visita: últimos 14 días), punto en la casilla y control «N novedades…» en el inicio; sin entradas no existe nada de eso. Se actualiza añadiendo renglones al JSON.
- **Filtros de Explorar:** cada grupo muestra 5 opciones y «Ver las N».
- **Cómo se hizo:** tres agentes (piel; navegación y Novedades; recorrido, eventos y filtros, este en un worktree aparte) y fusión con git; dos cortes por límite de uso y un reinicio de contenedor sin pérdida (punto de guardado `46ce258`). En la fusión: las flechas del carrusel de Novedades en escritorio apuntaban hacia abajo (corregido) y `feed.mjs` leía el texto de Eventos fuera de pantalla (ahora desplaza primero).
- **Verificación tras la fusión:** `npm test` 139 + 18 + 4; `test:design` 79; tokens al día; crítica sin hallazgos; `test:browser` 7/7 (axe 0); `feed.mjs` 48/48; `e2e.mjs` 115/115; `responsive.mjs` 42/42; piso en verde; hero ≥ 18:1; movimiento con duraciones de tokens; INP ≤ 200 ms; 0 errores de consola a 320, 390 y 1440; estimaciones de `content-visibility` a 0.3 % del largo real.
- **Abierto:** `e2e.mjs` usa el puerto CDP fijo 9470 (choca si dos corridas van a la vez); la fecha de «visto» de Novedades es la del dispositivo, no la de Monterrey; el punto de «cerrado» se pinta en turquesa; en escritorio el recorrido ocupa solo la mitad izquierda del ancho; la línea en ángulo del recorrido solo se probó en Chromium (sin soporte queda recta); la foto apaisada del inicio sigue ampliándose en pantallas grandes hasta la sesión profesional.

# Continuidad de Itinerante — 2026-11-11 (acomodo responsive: menos cromo, piezas que caben y tramos por alto de ventana)

- **Pedido de Aldo:** corregir posición, dimensiones y espacio de pantalla para no sobresaturar; auditar con agentes según las Laws of UX; dejarlo lo más responsive posible; mover botones si hace falta.
- **Auditorías (solo lectura, en paralelo):** saturación en móvil (145 pantallas, 15 defectos SAT) y responsive por anchos y orientaciones (34 tamaños, 14 defectos RSP). Informes en `.tmp-audit/agentes/responsive/` (ignorado por git). Ninguno de los dos encontró desborde horizontal.
- **Error propio corregido:** al quitar el sello de la muestra quedó un comentario sin cerrar en `mobile.css` que desactivaba el encaje de la tira de La casa y el ocultado de su medidor. Hay prueba para que no vuelva.
- **Móvil:** cromo fijo 18.8 % a 320×640 (antes 21.3 %) y 7–10 % al bajar; barra de casillas fijas (los botones ya no se corren); salto desde la barra con el capítulo en y = 0 y titular a 48 px (antes 68 y 111, con la cola del capítulo anterior a la vista); publicación de Cartelera 0.80× del alto útil a 390 (antes 1.02×) con sus acciones sobre la barra; ritmo en tres escalones; menú con Mi lista y el buscador primero y pie de una fila (zona fija 17 % a 390, antes 31 %); filtros de Explorar con salida fija; conteo de Mi lista en el botón Menú; «Guardado» sin relleno sólido. Página: 8.4 pantallas a 390×844 (antes 9.0), 11.1 a 320×640 (antes 12.0).
- **Responsive:** rótulo «ITINERANTE» entero con movimiento reducido; pie de tableta sin encimar; teléfono en horizontal con el inicio dentro de la ventana (≤ 760 px en tres columnas; > 760 px sin el rótulo gigante y con velo medido con la cabecera: la marca pasó de 2.2:1 a 12:1); 520–760 con portadas con tope y rejillas de 3–4 columnas; tope de contenido de 1632 px desde 1728; foto vertical del inicio para tabletas en vertical; horario sin partir; ritmo compacto hasta 1100 px.
- **Decisiones tomadas sin consultar (reversibles):** «La casa» se queda en el menú (la auditoría proponía quitarla; se conserva por consistencia con la barra); «Ver todo el catálogo» se queda al pie del carrusel (junto a la nota, las notas largas pasaban a dos renglones y el carrusel saltaba); el aviso de guardado va sobre la barra, compacto, en vez de ocultarla 4.5 s; no se recorta el párrafo de las publicaciones.
- Verificación: `npm test` 130 + 18 + 4, `test:design` 70, crítica en baseline, `test:browser` 7/7 (axe 0), feed 30/30, e2e 101/101 (LCP 1.7 s, CLS 0.001), piso de oficio en verde, hero móvil ≥ 18:1, INP ≤ 56 ms con CPU 4×, movimiento con duraciones de tokens, `responsive.mjs` 42/42, 0 errores de consola con y sin movimiento.
- Abierto: a 320×640 la publicación de Cartelera mide 1.06× del alto útil (las acciones quedan bajo la barra) y «Ver todo el catálogo» no entra en la vista de aterrizaje; con cabecera, barra y aviso a la vez el cromo llega a 21–25 % durante 4.5 s (15–20 % sin cabecera); el panel de filtros sigue con 25 opciones (falta «Ver las N» por grupo); la foto apaisada del inicio (1080 px) se amplía ×1.8 a 1920 y ×2.4 a 2560 hasta la sesión profesional; el salto 760 → 761 px sigue cambiando de maqueta (catálogo en línea); 15 tamaños de letra en la página (SAT-14, tipografía: no se tocó); texto ampliado al 200 % en la cabecera de escritorio (RSP-09, quiebres en em: no probado).

# Continuidad de Itinerante — 2026-11-11 (rediseño móvil: sin historias, barra centrada, categorías y piel suave)

- **Pedido de Aldo:** la experiencia debe sentirse como navegar una red social sin copiar sus secciones de historias; mejorar categorías, menú y navegación inferior; usar la plantilla de referencia (guía de estilo suave) con mejor textura y nuestra paleta.
- **Fuera:** los cuatro destacados del inicio, el visor de historias (`feed.js` queda en 59 líneas: «Me interesa» y «Compartir»), sus estilos y miniaturas, la hamburguesa de la cabecera y el estado `at-top`.
- **Barra inferior:** cápsula centrada con cinco botones de 48 px (cuatro capítulos y Menú); la activa muestra su nombre en cápsula `--terra`. Visible desde la primera pantalla sin tapar «Cómo llegar» (medido en 390, 360 y 320). Sin JavaScript no se muestra y la cabecera conserva los cuatro enlaces.
- **Categorías:** colecciones (4) y temas (6) en rejilla de dos columnas en móvil; a 320 px cada chip mide 140×48 sin desbordar.
- **Piel suave:** tokens `--elev-1/2/in` y `--radius-card`; chips, tarjetas de Cartelera, portadas, fotos, campo de búsqueda, aviso y primaria. El «activo» sigue siendo la cápsula `--terra` y los filetes mantienen 3:1.
- **Rendimiento:** la foto vertical del inicio baja a 648×864 (66 KB): LCP 1.7 s con CPU 4× y 4G lenta (había subido a 2.5 s con la versión de 104 KB).
- Verificación: `npm test`, `test:design`, crítica en baseline, feed 30/30 (antes 61: salieron las comprobaciones de historias), e2e 101/101, piso de oficio en verde, hero ≥ 4.5:1, 0 errores de consola. Móvil 8.9 pantallas (la rejilla de categorías añade dos filas).
- Abierto: la hoja de menú repite los cuatro capítulos que ya están en la barra (podría quedarse solo con subtemas, Mi lista y contacto); los iconos sin nombre a la vista dependen de que se reconozcan (probar con usuarios); desktop conserva su cabecera con enlaces.

# Continuidad de Itinerante — 2026-11-11 (fotos reales y piso de oficio)

- **Fotos reales (pedido de Aldo):** se retiraron las 20 recreaciones y los 218 fotogramas generados. Vistas de La casa, Cartelera, temas de Poesía e Infantil, llegada, destacados e inicio usan fotos de la casa: publicadas por la cuenta oficial de Instagram (@sharonmirelesgong, @alfonso_boeta; tomadas de la rama `agent/atenea/casa-editorial-base`) y tres de Aldo. `assets/provenance.json` guarda fuente, autor y huella de cada una. **Pendiente de la librería: confirmar el permiso de uso de los dos fotógrafos**, o sustituir por la sesión profesional.
- **Inicio:** foto fija de la sala central (1080 px; se ve algo suave por encima de 1440 px de ancho hasta tener la foto profesional). El recorrido por fotogramas queda dormido tras `data-seq`. Contraste del texto sobre la foto: percentil 5 ≥ 5.2:1 en 1024, 1280, 1440 y 1920.
- **Impeccable (pedido de Aldo):** se leyó `pbakaus/impeccable` v4.8.2 (Apache 2.0) y sus reglas aplicables quedaron en el bloque «piso de oficio» de `docs/agentes/00-contexto-compartido.md` y como fuente 14 en `docs/ux/FUENTES.md`. No se ejecutó su lanzador (descarga un binario) ni se instaló la skill en el repositorio. `tools/qa/piso.mjs` mide el piso: todo dentro en 1280 y 390.
- **Pulido:** foto del tema a 3:2 en escritorio (CR2-02: de 522 a 435 px; nombre y frase caben a 1280×800), la cita cierra con `--sec-sm` (CR2-03: hueco con el llamado de 192 a 128 px), barra inferior sin desenfoque (era opaca: adorno sin efecto), `accent-color` de la paleta.
- Verificación: `npm test` 132 + 18 + 4, `test:design` 72, crítica en baseline, `test:browser` 7/7 con las fotos reales, e2e 101/101, piso de oficio en verde, móvil 8.7 pantallas y escritorio 15.6 (antes 17.4).
- Abierto: CR2-04 (pie del escenario de Cartelera sobre la foto con degradado), CR2-06 (ficha a 360 px parte «Guardar en mi lista»), `worker/_headers` aún nombra `assets/seq` (inofensivo), fechas reales de Cartelera, hoja del catálogo con estante, capítulo de café y menú para el recorrido pasillo → libreros → mesa → patio.

# Continuidad de Itinerante — 2026-11-10 (plantilla sin avisos de maqueta y versión única)

- **Decisiones de Aldo:** paleta A (la de la rama, tono del logo `#7ac4b4`; la variante «celeste de la lona» `#8bd2cf` queda descartada por ahora), una sola versión a partir de esta rama (se fusiona en `main`), y la plantilla real sin subtextos de maqueta.
- **Fuera de la página:** «Recreación IA», «Foto real», insignias IA/Foto de los destacados, el crédito del hero, «Datos de muestra · no es inventario» (carrusel, capa Explora, hoja Explorar, ficha, Novedades) y «Registro de muestra». El texto visible dice «catálogo» en vez de «muestra».
- **Lo que se conserva como dato:** `data-kind="ai|real"` en pies de foto y publicaciones, `kind` en los temas, `assets/provenance.json`; `tag.js` exporta `KINDS` y `validKind`. Una foto sin procedencia registrada sigue sin entrar a las historias.
- **Vigilancia invertida:** la prueba «plantilla: sin sellos…», `critique.mjs` (`copy-label`) y el arnés (`explorer`, `ficha`, `rail`, `feed`, `e2e`) fallan si un aviso vuelve a aparecer.
- **CR2-01 cerrado** (crítico ronda 2): la cita y la cortinilla declaran tema y la cabecera opaca ya no cae a noche sobre el sitio claro; sin JavaScript la banda es de papel.
- Verificación: `npm test` 132 + 18 + 4, `test:design` 72, crítica en baseline, `test:browser` 7/7 (axe 0), feed 61/61, e2e 101/101, hero ≥ 18:1, móvil 8.7 pantallas, 0 errores de consola.
- **Riesgo anotado para Aldo:** producción en Vercel sirve `main`. Con la fusión quedan publicadas recreaciones hechas con IA sin rótulo y 500 registros de prueba presentados como catálogo. Antes de anunciar la dirección al público hay que sustituirlas por las fotos reales y el listado real.
- Pendiente con la librería: fotos profesionales por estación (pasillo, libreros, mesa central, patio), hoja del catálogo con ISBN y estante, fechas reales de Cartelera (hoy dice «propuesta» y «sin fecha confirmada»), capturas de Instagram para afinar marca. QA de la ronda 2 no terminó sus mediciones propias (se detuvo); el arnés completo sí pasó.

# Continuidad de Itinerante — 2026-11-05 (curaduría, ronda 1, sesión en la nube)

Rama: `claude/cool-turing-37uiqt` (sobre `main` 4af8612; respaldo `backup/pre-curaduria-2026-11-04`). Commits de la curaduría: 1f32a95 (paleta del logo, reglas «cómo evitarlo», axe en el arnés), f088b4d y 69263c0 (catálogo de fuentes `docs/ux/FUENTES.md` corregido y enlazado; supera la PR 1), 877b676 (paleta-skeletons), 03ce089 (navegacion-desplegables), 07d215e (ux-movil-feed), 25a6bef (movimiento). Informes y capturas en `.tmp-audit/agentes/curaduria/ronda-{0,1}/` (efímero).

## Cerrado con medición (ronda 1: 16 de 19 defectos de la línea base)

- **CR0-02** · Cromo móvil blanco: chips de cabecera y barra con icono en tinta (16.8:1), filete 4.3:1, sin reflejo ni vidrio oscuro; pestaña activa en cápsula turquesa (5.2:1). Tokens `glass-*` redefinidos.
- **CR0-04/05** · Portadas planas (sin ajedrezado ni lomo), nota y sello sin rotación ni sombra; sombras a 0 8px 16px al 20 %.
- **CR0-07/11, QA0-04** · Una sola piel de rótulo «Recreación IA / Foto real» (12:1, filete 4.9–6.3:1) y un solo «activo» (cápsula `--terra`) en chips, pestañas, HOY y menú; filetes inactivos ≥ 3.2:1 (`--line-strong` 0.34 → 0.5 en light/mist).
- **CR0-06** · Cruces de registro eliminadas (`.rx` = 0). **CR0-08** · Publicación de Cartelera móvil como tarjeta de papel con filete. **CR0-10** · Cierre móvil con tres fondos (bruma, blanco, profundo), antes cinco. **CR0-13** · Cabecera fija de Explorar a 360 px: 69 px (antes ~200).
- **CR0-09** · El hover del menú de escritorio no reescribe el rótulo; la pista es subtítulo de 12 px solo con cursor. e2e 99/99.
- **QA0-01/06 (A03)** · Sin `catalog.json`: Mi lista anuncia con `role=status` cuántos títulos siguen guardados, ofrece Reintentar y WhatsApp; el carrusel muestra su estado en vez de desaparecer; el reintento recupera ambos. axe 0 también en esos estados.
- **CR0-01** · Cortinilla de 100 a 40 svh con entrega al titular de Cartelera: ninguna pantalla completa de un solo color entre La casa y Cartelera (1024–1920). **CR0-12** · Manifiesto centrado en escritorio: 27/27 palabras al 100 %.
- **QA0-02/03 (T02)** · e2e, AGENTS.md, CONTEXT.md, DESIGN.md y scripts alineados a `light|mist|deep`; grep de la paleta anterior = 0.

Verificación final (QA ronda 1, HEAD 25a6bef): `npm test` 132 + 18 + 4, `test:design` 72, crítica en baseline, tokens al día, `test:browser` 7/7 (axe 0 serias y 0 leves en 10 estados), contrast ✓, skeleton 12/12, motion ✓, spacing 8.7 pantallas, rail 49/49, saved 34/34, explorer 23/23, e2e 99/99 (LCP 1.36 s, CLS 0.001), INP máx 40 ms con CPU 4×, feed 61/61, hero ≥ 18:1. Crítico ronda 1: identidad 4, jerarquía 4, tipografía 4, ritmo 4, componentes 4, movimiento 4, red social 4, camino a la visita 5, accesibilidad 4, verdad 5 (ronda 0: 3/4/4/4/3/3/4/4/4/5); 0 defectos altos o medios.

## Abierto (ronda 2 o decisión)

- **A01 sigue failing por tres contrastes no textuales** (QA ronda 1): QA1-01 (media) anillo de foco del chip de menú sobre la foto del hero móvil 1.37:1; QA1-02 (baja) filete de «Guardar en mi lista» en la ficha 1.33:1; QA1-03 (baja) botones de contorno de Cartelera en escritorio sobre turquesa 2.69:1. Dueño: paleta-skeletons.
- **CR0-03 parcial / QA1-05 (baja):** el velo del hero de escritorio cubre el 70 % de la altura (la foto se ve limpia del 13 al 43 %); el crítico lo acepta, QA lo deja anotado. Cerrarlo del todo implica mover el texto de la entrada o dar respaldo propio a la cabecera (CR1-02).
- **Bajos del crítico (CR1-01…08):** titular de Cartelera de 9rem a 1280 (≈ 0.9 pantallas de turquesa); franja pálida 0–16 % del hero de escritorio; degradado de las portadas; sombra de la ficha de escritorio (-30px 0 70px al 80 %); cita en el tono de Libros (fundir con el llamado sobre blanco); chips inactivos grises en móvil y transparentes en escritorio; velo 80–95 % sobre la foto del tema activo; cabecera móvil al 92 % deja leer el texto que pasa debajo.
- **QA1-04 (baja, herramienta):** `rail.mjs` y `test:browser` fallan con la máquina cargada (ev() sin guarda); en solitario pasan.
- **Para Aldo:** QA0-05 (28 controles de 26–36 px en escritorio, cumplen AA de 24 px); conservar o no la cortinilla reducida; la PR 1 queda superada por `docs/ux/FUENTES.md` corregido en esta rama (cerrarla sin fusionar).

# Continuidad de Itinerante — 2026-11-04 (ronda 5, sesión en la nube)

- **CR4-01 cerrado:** Visita cierra en móvil con `--sec-sm` (48 + 48 del pie = 96, el tope de CR-14); la cruz de registro queda a 24 px del ladrillo y a 11 del rótulo (medido a 360, 390 y 414). Regla de ritmo actualizada en DESIGN.md.
- **CR4-02 cerrado:** desde 1600 px la columna derecha de Visita se fija en 560 px; a 1920 la izquierda termina 119 px antes que la derecha (antes 203), con la foto al ancho exacto de la tabla de horario.
- Verificación: `npm test`, `test:design`, crítica en baseline, tokens; `e2e.mjs` 97/97.
- Crítico (ronda 5, acotado a Visita): CR4-01 y CR4-02 cerrados; ritmo y espaciado 5, jerarquía y composición 4 (a 1920 el aire entre titular y horario sube a ~570 px: convención del sitio sin contenedor máximo; si se limita, que sea global). Sin defectos nuevos.

# Continuidad de Itinerante — 2026-11-04 (ronda 4, sesión en la nube)

- **CR3-05 cerrado:** la foto de llegada de Visita pasa a la columna derecha, bajo el horario y la nota de festivos (`index.html`; `.visit-arrival` con margen superior `--space-6`). Medido a 1280, 1440 y 1920: las dos columnas terminan a la misma altura y ya no quedan ~800 px vacíos junto a la foto; a 390 el capítulo cierra con la foto. Nota en DESIGN.md («Visita (escritorio)»).
- **`e2e.mjs` sin falsos positivos:** la comprobación de desborde ignora lo que recorta un antepasado con `overflow: hidden/clip` que cabe en la ventana (la IMG escalada 1.22 al revelarse). 97/97. Actualizados `tools/qa/README.md` y `docs/agentes/06-qa.md`.
- Verificación: `npm test` 132 + 18 + 4, `test:design` 72, crítica en baseline, tokens al día. Crítico (ronda 4, acotado a Visita): CR3-05 cerrado, jerarquía y composición 5, ritmo 4; capturas en `.tmp-audit/agentes/ronda-4/` de esta sesión.
- Abierto (baja, decisión de Aldo): **CR4-01** cruz de registro inferior de Visita en móvil a 8 px del ladrillo (cerrar con `--sec-sm` cambia la regla de ritmo documentada); **CR4-02** a 1920 la izquierda termina 203 px antes que la derecha (propuesta: `max-width` ~560 px en la foto desde 1600 px).

# Continuidad de Itinerante — 2026-11-04 (ronda 3 del bucle de maqueta, sesión en la nube)

Rama: `claude/cool-turing-37uiqt`, sobre `claude/maqueta-bucle-ronda3` (0f7e2b4). Seis commits: 41d1655, 55a0004, 3f0465d, ece8a79 y los dos siguientes. El estado efímero de los agentes (`.tmp-audit/agentes/`) no viaja entre máquinas: esta entrada lo resume.

## Cerrado con medición

- **QA1-04** · Tab en el carrusel: la tarjeta asomada recibía el foco sin desplazarse y quedaba recortada (390, 360 y 1280). `rail.js` la alinea al inicio con un oyente `focusin`; `tools/qa/rail.mjs` recorre las 24 paradas con Tab real (49/49).
- **CR-17** · Enlaces de capítulo de la cabecera de escritorio: de 30 a 44 px de alto (y ≥ 45 de ancho) con el texto centrado; el `hdr` sigue en 68 px.
- **CR3-01** · La pista (`data-hint`) pisaba al vecino («Temas y muestra» sobre Visita, «81 8087 5940» sobre Correo): etiqueta y pista comparten una celda de retícula y el enlace mide la más ancha. La pista de Libros pasa a «6 temas» (DESIGN.md ya la definía así).
- **QA3-01** · Regresión del anterior: el filete sobraba bajo «Visita». Ahora se pinta como fondo de la palabra visible y mide lo que mide el texto; con colores forzados es subrayado real.
- **CR3-02** · Explorar abre al toque con esqueletos y «Cargando la muestra…»; el catálogo se pide después. Con `catalog.json` retenido 2.5 s: hoja en 96 ms, tarjetas a los 4.3 s.
- **CR3-03** · Menú lateral: el acordeón abierto se lleva a la vista y el pie de la lista se funde (`data-more`) mientras haya más abajo (Visita y Mi lista en 360×740).
- **CR3-06** · Lista de pistas de DESIGN.md al día. **QA3-04** · `e2e.mjs` ya no marca `.sk-chip` como desborde. **CR3-07** · Dirección del perfil parte limpia en 360 px con el pin en la primera línea.

Verificación final: `npm test` 132 + 18 + 4, `test:design` 72, `critique.mjs` en baseline (sigue el aviso heredado de interlineado 1.03), tokens al día, `npm run test:browser` completo en verde (Chromium como root necesita `CHROME_PATH` con `--no-sandbox`), `e2e.mjs` 97 comprobaciones con solo los 4 falsos positivos documentados (IMG en `.frame-clip`).

## Abierto (decisión o ronda siguiente)

- **CR3-05 (baja, ux-movil-feed):** Visita en escritorio deja ~800 px vacíos junto a la foto de llegada (`.tmp-audit` de esta sesión: `d1280-05b-visita-2.png`). Propuesta del crítico: foto bajo el horario o a ancho completo.
- ~~**CR3-04 (baja, paleta):** cabecera móvil con alfa 0.92 sin desenfoque; el documento la describe opaca.~~ Resuelto en curaduría ronda 2 (CR1-08): la banda de la cabecera es opaca (tono al 100 %, sin desenfoque) en móvil y escritorio; DESIGN.md lo describe.
- **QA3-02 (baja):** con puntero fino quedan objetivos < 44 px: CTA de cabecera 134×40, Instagram en Cartelera 105×26, «Ver los 48 géneros» 144×30, filas de filtro 262×36, marca 222×36.
- **QA3-05 (baja):** a 320×640 la página mide 11.5 pantallas (el umbral ≤ 11 se mide a 390, donde da 8.7).
- **Miller:** el submenú Libros tiene 7 filas; reducir a ≤ 5 es decisión editorial.
- **CR-16** (registros de prueba A-Z) y el azul de portadas frías (tono 240) siguen siendo decisiones de Aldo.
- QA3-03 no aplica: el `AGENTS.md` de la rama ya describe B.4; `docs/AVANCES-Y-RAZONAMIENTO.md` es bitácora histórica.

# Continuidad de Itinerante — 2026-11-01

## Último avance: B.4 «Función de la casa» sustituye al sitio raíz

**Decisión de Aldo (2026-11-01):** el prototipo B.4 sustituye al sitio raíz anterior (Higgsfield `d599d36a`). Hay una sola home.

Qué se movió:

- A la raíz: `index.html`, `style.css`, `mobile.css`, `tokens.css` (generado), `app.js`, `catalog.js`, `motion.js`, `scenes-desktop.js`, `assets/{data,fonts,img,js/boot.js,seq,seq-m,provenance.json}` y `DESIGN.md` (el de B.4).
- `prototypes/itinerante-b4/check.mjs` pasó a `tests/site.test.mjs`; `preview.mjs` a `tools/preview-site.mjs`; `BRIEF.md` y `README.md` a `docs/B4-BRIEF.md` y `docs/B4-README.md`; `evidence/` a `docs/evidence/`. El directorio `prototypes/` ya no existe.
- El sitio anterior quedó en `_archive/models/higgsfield-d599d36a/` (`index.html`, `assets/`, `images/`, `DESIGN.md`, `tests/site.test.mjs`). Esa carpeta está ignorada por git; la historia de git es la copia recuperable (el último estado del sitio anterior está en los commits previos a esta promoción).

Documentación ajustada en esta pasada: `AGENTS.md`, `CONTEXT.md`, `PRODUCT.md`, `README.md`, `DESIGN.md`, `docs/B4-BRIEF.md`, `docs/B4-README.md`, `docs/ARCHITECTURE_AND_CONTEXT.md`, `docs/premium-site-architecture.md` (marcada como histórica) y, con nota de estado, `design-system/libreria-itinerante-y-mas/MASTER.md` y `pages/home.md`. La documentación de las secciones de abajo (septiembre) describe el sitio anterior y el catálogo con Iti IA en la interfaz; ya no corresponde a la UI publicada.

Estado real del sitio B.4: el catálogo es un JSON de muestra estático (500 registros de prueba) con búsqueda local; Iti IA existe como API en el Worker pero no está conectada a la interfaz. No se hizo commit, push ni deploy.

### Sigue pendiente (auditoría del 2026-11-01)

- **Contrato de datos del catálogo**: JSON de muestra estático de B.4 frente a `/api/catalog` con taxonomía controlada. Falta decidir y unificar.
- **Iti IA** no está integrada en la UI.
- **Límites de ritmo del Worker** (`IA_PER_IP`, `IA_GLOBAL`): sin validar en preview; `limit()` sin try/catch.
- **La API expone** calificación, reseñas y precio de referencia de Amazon, contra la regla de no publicar datos sin fuente.
- Los filtros `category`/`subgenre` de la API son incoherentes con las facetas; `condition` está fijo en `nuevo`.
- Sin inventario real, sin Data Connect conectado al Worker y sin Go.
- Restos de Supabase en el repositorio.
- Dominio de producción sin confirmar para `canonical`, `og:url` y sitemap; `index.html` conserva `noindex,nofollow` y `theme-color #100d0a` (hero ahora claro).
- Sin desplegar. Cloudflare es el destino; Vercel, Firebase y Next son legado.

---

# Continuidad de Itinerante — 2026-09-07

## Último avance: patrón Liquid Glass unificado

Se unificaron los CTA “Consultar y apartar” y “Descubrir con Iti IA” mediante
un componente de vidrio compartido con variantes primaria y secundaria. El
mismo vocabulario de transparencia, borde luminoso, desenfoque, profundidad y
estados se extendió a la acción del encabezado, navegación de capítulos,
categorías, selector de vista, paginación, buscadores y controles de Iti IA.
En móvil se corrigieron el recorte del CTA principal y la superposición entre
el acceso flotante a Iti IA y la navegación.

La revisión visual detectó además que el rescate por prefijo aplicaba las
traducciones añadidas por expansión semántica: `verse` podía emparejarse con
Verity o Veronica al consultar “Poesía”. El rescate ahora opera sólo sobre las
palabras escritas por la persona; las expansiones continúan disponibles para
coincidencias exactas verificables.

Validación: `npm.cmd test` 73/73 y `tests/browser-local.mjs` aprobado a
1440×900, 390×844, 820×700, 844×390 y 320×568. Capturas actuales en
`.tmp-audit/local-fix/*-glass-*.png`.

## Último avance: biblioteca digital e Iti IA

Se reconstruyó `#catalogo` tomando como referencia de interacción el proyecto
ECRMNL: búsqueda dominante, categorías visibles, contador, orden, vista de
cuadrícula/lista, carga progresiva y ficha detallada en diálogo. La navegación
de capítulos queda fija durante el recorrido y los controles se adaptan hasta
320 px. Se mantuvieron la identidad, los tokens y la arquitectura Vanilla de
Itinerante; no se copiaron marca ni datos de ECRMNL.

Iti IA ahora presenta una introducción breve y una lista de opciones con título,
autor, género/formato y procedencia. Se eliminó de la respuesta visible el texto
técnico de contingencia. Las expansiones en español cubren poesía, psicología y
fantasía, y el ranking ya no expande las etiquetas del documento como si fueran
la consulta. Si un filtro controlado no encuentra resultados, la recuperación
reintenta sobre el catálogo completo antes de declarar que no hay coincidencias.

Validación del 7 de septiembre:

- `npm.cmd test`: 73/73 (69 contratos principales y 4 de filtros).
- Compilación del backend Next: aprobada.
- `tests/browser-local.mjs`: aprobado a 1440×900, 390×844, 820×700,
  844×390 y 320×568; navegación, catálogo, diálogo, cuadrícula/lista, Iti IA,
  movimiento reducido y batería baja, sin errores de página.
- Consultas verificadas desde la UI: Literatura, Psicología, Fantasía y Poesía.
  Psicología y Fantasía devuelven opciones pertinentes. Poesía conserva una
  respuesta vacía clara porque el dataset de prueba actual no contiene una
  coincidencia verificable.
- La portada local y `/api/catalog` responden HTTP 200. Evidencia visual en
  `.tmp-audit/local-fix/` y análisis de referencia en
  `web-intel/ecrmnl/2026-09-06/`.

El catálogo visible sigue siendo el dataset de prueba Amazon de 500 registros y
cada ficha lo identifica como “Datos de prueba · no es inventario”. No hubo
importación a inventario, commit, push ni despliegue.

# Continuidad anterior — 2026-09-06

## Último avance: cierre del pendiente de Seguimiento

Se retomó el archivo raíz `Seguimiento`, interrumpido al detectar overflow a
320 px. La causa era el mínimo automático del panel de catálogo dentro de CSS
Grid: su formulario ensanchaba la columna a 336.64 px. Se añadió `min-width: 0`
a `.catalog-panel`; el documento y el panel ahora miden 320 px, con buscador y
filtros dentro del ancho disponible. No se oculta el desbordamiento global.

Validación del 6 de septiembre:

- `npm.cmd test`: 61/61 (57 contratos y 4 pruebas de filtros).
- `tests/browser-local.mjs`: aprobado a 1440×900, 390×844, 820×700,
  844×390 y 320×568; video hacia delante/atrás, seis secciones sin overflow,
  catálogo cargado, filtro Literatura, diálogo móvil, cambio de orientación,
  movimiento reducido y batería baja. Sin errores JavaScript `pageerror`.
- Se revisaron capturas de inicio en escritorio/320 px, catálogo a 320 px
  y diálogo móvil. Evidencias locales: `.tmp-audit/local-fix/`.
- El equipo tenía 17 % de batería y la página activó correctamente los
  fotogramas estáticos. La prueba ahora fija batería en carga para el video
  y verifica por separado la salida con batería baja.
- La primera consulta real usó ranking de contingencia por `fetch failed`
  dentro del sandbox. Tras autorizar el arranque fuera del sandbox, la consulta
  «Literatura.» desde la UI devolvió HTTP 200 en 10.0 s: el principal alcanzó
  el timeout y `gemini-3.1-flash-lite` completó la selección. Evidencia:
  `.tmp-audit/local-fix/ai-live.json` y `mobile-iti-ia-live.png`.

El pendiente concreto de `Seguimiento` queda cerrado. La selección utiliza
el dataset de prueba existente y muestra «Datos de prueba · no es inventario»;
esto no acredita inventario comercial ni publicación del backend. No hubo
cambios de modelos, importación de libros, commit, push o despliegue.

Siguiente paso de frontend: revisión táctil en dispositivo físico y los
escenarios de foco/red lenta/fallo/vacío del gate ampliado descrito abajo;
la prueba de escritorio automatizada no los sustituye. Los pendientes de
datos y conexión pública conservan sus propios límites de autorización.

## Último avance: segunda pasada bibliográfica

Se añadieron siete fichas al registro de evidencia y se amplió el contraste
de El fin del poder y Arte poética. Informe y fuentes:
[segunda pasada](research/goodreads-editorial-review-round2-2026-09-05.md).

- Dos coautorías corregidas: Silvia Salinas y Bruce R. Powers.
- Tinísima pasa de idioma desconocido a español, con respaldo bibliográfico.
- Y Matarazo no llamó… y Harakiri reciben síntesis editoriales breves con
  procedencia; las descripciones vacías originales se conservan en el crudo.
- Se proponen materias Novela para Garro y Tinísima usando el término existente.
- El ETL valida evidencia, longitud y taxonomía para esos nuevos campos.
- Se conservan las dos cuarentenas: confirmar a qué edición pertenece el ISBN
  no demuestra cuál pretendía representar el ID Goodreads.

Estado actual: 84 fichas, 82 candidatas, 2 en cuarentena, cero admitidas;
13 con contraste externo parcial y 71 sin él. Lenguas: 77 `es`, 5 `en`,
2 `mul`. Quedan dos descripciones ausentes y tres fichas con roles pendientes.
La cola de incidencias específicas tiene 33 fichas.

Validación nueva: `npm.cmd test` 60/60, Python unittest 7/7 y ETL `--check`
idéntico byte por byte. Sin cambios en frontend/API, importación a BD o despliegue.
El gate visual no se repitió; permanece pendiente por el navegador ausente
documentado en la primera pasada.

Siguiente paso: representar las variantes Horatius/Horácio sin duplicar autor;
verificar créditos de la antología y Fontamara; completar descripciones de
Arte poética y Poesía de Girondo; seguir con formas y materias. Las cuarentenas
requieren evidencia sobre la edición pretendida, no sustituir ISBN automáticamente.
Ninguna corrección parcial admite una ficha como `reviewed`.

## Avance anterior: primer lote de revisión editorial

Se contrastaron seis fichas con fuentes externas y se aplicaron decisiones
por campo, trazadas en `imports/kaggle-goodreads/editorial-review.json`.
Detalle y fuentes: [revisión editorial](research/goodreads-editorial-review-2026-09-05.md).

- `Arte poética` pasa de `es` a `mul` por su edición bilingüe.
- Josephs y Caballero quedan como editores en `Poema del Cante Jondo`;
  David Naimon como autor en `Conversaciones sobre la escritura`.
- `La noche de San Juan` y `El fin del poder` quedan en cuarentena por
  discrepancias entre ISBN y edición. No se reasignan sus ISBN.
- Se registran diferencias de paginación y materias aún pendientes.
- El ETL valida hash y valor anterior, conserva el crudo e impide promover
  fichas a `reviewed`. La búsqueda existente excluye las cuarentenas.

Estado actual: 84 fichas; 82 candidatas, 2 en cuarentena y 0 admitidas.
Seis tienen evidencia externa parcial; las otras 78 aún no. La cola de
incidencias específicas contiene 37 fichas. Las lenguas son 76 `es`, 5 `en`,
2 `mul` y 1 `und`, incluyendo las cuarentenas.

Validación nueva: `npm.cmd test` 59/59, Python unittest 6/6 y ETL `--check`
reproducible byte por byte. No se repitió build del backend porque no se
modificó backend/API. Los originales y el catálogo comercial siguen intactos.
No se importó a BD ni se desplegó.

Se intentó el gate visual: Computer Use no encontró navegadores y la apertura
de la URL local devolvió `No browser is available`. Continúa pendiente.

Siguiente paso: resolver las dos identidades en cuarentena y seguir con roles,
descripciones y materias; exigir contraste del resto antes de admitir fichas.
No tratar una corrección parcial como validación editorial completa.

## Avance anterior: normalización y recuperación bibliográfica local

Se retomó el pendiente explícito de `Seguimiento`: normalizar las 84 candidatas
y evaluar su recuperación antes de ampliar la importación. La etapa local está
implementada en `scripts/etl-goodreads.py` y `src/lib/reference-search.js`.
Instrucciones y contrato: [CATALOG_DATASET_AND_MODEL.md](CATALOG_DATASET_AND_MODEL.md#implementación-local--2026-09-05).

- CSV original contrastado por SHA-256 y por cada campo de las fichas candidatas.
- 84 identidades estables de Goodreads; 80 ISBN-13 válidos por dígito de control.
- 77 fichas `es`, 5 `en`, una `mul` y una `und`; cuatro sin descripción.
- Roles explícitos separados de la autoría provisional; siete fichas con roles
  por resolver y una con lista de colaboradores truncada.
- Materias múltiples propuestas mediante alias versionados en la taxonomía
  existente. Etiquetas sin correspondencia conservadas; no se infiere nacionalidad.
- 36 fichas con incidencias específicas en `normalization-quality.json`.
  Las 84 siguen `candidate`; las otras 48 tampoco equivalen a revisión editorial.
- Búsqueda local por título, ISBN, autor, colaborador, materia y descripción;
  filtros antes del límite. No se generan embeddings ni se modifica el RAG actual.
- `reference` es por ahora un contrato de preparación local. No se añadió al
  importador de inventario ni a las APIs; buscar candidatas requiere opt-in explícito.

Validación actual: `npm.cmd test` 58/58 (incluye veinte consultas fijas dentro
del test de recuperación), Python unittest 5/5, `etl-goodreads.py --check`
idéntico byte por byte y `npm.cmd run dataconnect:verify` aprobado.
`npm.cmd run backend:build` aprobado, incluidos compilación y chequeo de tipos.
El catálogo anterior, inventario y originales permanecen intactos. Sin importación
de BD, migración ni despliegue. No hay validación nueva en navegador.

Siguiente paso de datos: resolver la cola editorial, verificar correspondencia
de edición/idioma/ISBN y roles, y definir qué fichas pueden pasar a `reviewed`.
Después aplicar el modelo aditivo en un entorno local aislado y unificar la
recuperación con procedencia de embeddings antes de conectar API/Iti IA. El gate
visual del frontend descrito abajo sigue pendiente; la búsqueda lexical local
no acredita recuperación semántica ni operación pública de extremo a extremo.

## Antecedentes del 4 de septiembre

## Actualización posterior: nueva fuente bibliográfica

Aldo pidió conservar por ahora el catálogo actual y buscar en Kaggle literatura
mexicana, poesía, psicología y filosofía, tomando ECRMNL como referencia de
estructura. Se descargaron y perfilaron dos fuentes. GoodReads Best Books es
la candidata elegida; se prepararon 84 fichas bibliográficas preliminares.
La comparación, cobertura, límites y modelo propuesto están en
[CATALOG_DATASET_AND_MODEL.md](CATALOG_DATASET_AND_MODEL.md). El siguiente paso
de datos al cierre del día 4 era normalizar esas candidatas y diseñar el modo bibliográfico
`reference`, sin convertirlas en inventario ni reemplazar el catálogo actual.
No se aplicaron migraciones, importaciones de BD ni despliegues.

## Punto recuperado

Aldo confirmó que el trabajo de la sesión anterior era mejorar primero la UX/UI
con Impeccable. La siguiente fase es conectar la búsqueda del catálogo y el RAG
real. No se recuperó el mensaje de cierre de aquella sesión; este checkpoint
se apoya en la aclaración de Aldo y en el código actual.

`index.html` sigue siendo la única home. `PRODUCT.md`, `DESIGN.md`, `CONTEXT.md`
y `design-system/libreria-itinerante-y-mas/MASTER.md` fijan la composición de
Claude Design y el uso de Higgsfield exclusivamente para medios y movimiento.
`AGENTS.md` conserva una descripción anterior del modelo y de Git; esa
discrepancia está identificada, sin modificar instrucciones como efecto lateral.

## Avance de frontend en esta continuación

- Estado y recuperación del catálogo trasladados de la fotografía al panel de
  búsqueda, después de los filtros, para mantenerlos cerca de la acción en móvil.
- Peticiones de catálogo e Iti IA acotadas a 90 segundos mediante AbortSignal.
- Protección contra consultas superpuestas del catálogo.
- Pregunta fallida de Iti IA recuperada en el campo si no hay un borrador nuevo;
  reintento sin duplicar el turno fallido en el historial enviado al servidor.
- Conservadas composición, medios, navegación y separación entre datos de prueba
  e inventario. No se modificó el backend ni se desplegó.

Validación: `npm.cmd test`, 54 pruebas aprobadas. La nueva comprobación ejecuta
el runtime con una respuesta de red fallida y posterior reintento; cubre tanto
campo vacío como borrador nuevo. No reemplaza una prueba en navegador.

Impeccable: contexto cargado para `index.html` y detector ejecutado una vez sobre
HTML, CSS y JS. Reportó 3 warnings y 20 avisos tipográficos. Inter está fijada
por el diseño; el escenario audiovisual a sangre explica el aviso de padding.
Se ajustó el tamaño del estado modificado a la escala de DESIGN.md. Los demás
avisos de tamaños existentes quedan para la revisión visual; no se declara el
detector limpio ni se cambió el diseño para silenciarlos.

## Gate pendiente de frontend

No hubo navegador disponible mediante Computer Use. Las capturas heredadas de
`.tmp-audit/cdp-*.png` sirven como evidencia anterior, no verifican estos cambios.
Al recuperar navegador: una pasada conjunta a 390, 768 y 1440 px de inicio,
scroll descendente/ascendente, catálogo y diálogo. Comprobar foco, teclado,
movimiento reducido, red lenta, fallo, ausencia de coincidencias y resultados.
En móvil, confirmar que el estado y la recuperación se leen junto a los filtros.

## RAG: código existente y brechas verificadas

Hay una base previa en `src/app/api/catalog/route.ts`, `src/ai/iti-ia.ts`,
`src/lib/test-catalog.ts`, `scripts/import-books.mjs` y `dataconnect/`.
La presencia de esos archivos y las pruebas actuales no acredita operación
real de extremo a extremo ni despliegue.

1. **Fuente de datos pendiente.** `data/books.amazon-test.json` es un dataset de
   prueba. `data/books.inventory-001.json` contiene una ficha piloto de Pedro
   Páramo que dice explícitamente «No publicar» y declara precio/existencias
   pendientes, aunque guarda `status: active` y `stockQty: 1`. No usar esa ficha
   como evidencia de inventario comercial. Quedó preguntado a Aldo dónde está
   el catálogo autorizado. No se importó ni se alteró la ficha en esta sesión.
2. **Recuperación inconsistente.** La ruta de catálogo llama directamente a
   `searchInventoryBooks` (Vertex `text-embedding-005`), mientras Iti IA puede
   elegir `searchInventoryBooksByVector` con Gemini según
   `INVENTORY_EMBEDDINGS`. La importación usa otra variable, `EMBEDDINGS`.
   Unificar la elección y registrar/verificar la procedencia del vector antes
   de conectar un inventario. No mezclar espacios vectoriales.
3. **Filtros y relevancia.** La ruta de catálogo filtra después de recuperar;
   la variante Gemini también filtra después de limitar resultados. Aplicar
   filtros antes del límite y comprobar título/autor exactos además de tema e
   intención. Una búsqueda de catálogo necesita recuperación; la generación
   de recomendaciones fundamentadas pertenece a Iti IA.
4. **Conexión pública ausente en configuración.** `tools/static-server.mjs`
   ofrece proxy local, pero `firebase.json` no contiene rewrites para `/api`.
   Resolver dónde se ejecuta el backend antes de publicar; el proxy local no
   demuestra que Firebase Hosting sirva las rutas.
5. **Gate de datos insuficiente.** `scripts/check-inventory-rag.mjs` exige el
   slug de la ficha piloto. Sustituir esa expectativa por casos sobre el catálogo
   autorizado: título, autor, consulta temática en español, categoría, ausencia
   de resultados, fuente verificable y fallo del proveedor.

## Siguiente ejecución

Cerrar primero el gate visual del frontend. Para el backend, confirmar la fuente
autorizada y distinguir catálogo bibliográfico de existencias verificadas;
reutilizar el importador y la recuperación existentes. Unificar proveedor de
embeddings, filtros y contratos de búsqueda/IA; comprobar importación y consulta
en un entorno local aislado. Ejecutar pruebas, compilación de backend y el gate
de recuperación sobre datos autorizados. Sólo declarar RAG real cuando una
consulta desde la UI devuelva fichas trazables del catálogo elegido.

No inferir autorización para importar a producción, aprovisionar servicios o
desplegar a partir de este checkpoint.

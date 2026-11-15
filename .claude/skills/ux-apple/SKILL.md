---
name: ux-apple
description: Guía de diseño de Librería Itinerante con Apple Human Interface Guidelines y leyes de UX (Laws of UX, NN/g, WCAG). Úsala SIEMPRE antes de diseñar, auditar o refinar cualquier interfaz del sitio (carruseles, tarjetas, barras, hojas, tipografía, espaciado, móvil y escritorio), y cuando Aldo pida «sigue las guidelines de Apple», «leyes UX/UI», «refina el diseño», «que se vea fino» o «centra/amplía el carrusel». Da reglas medibles, cómo medirlas y el procedimiento de auditoría y corrección.
---

# /ux-apple — Apple HIG + leyes de UX para el sitio

Aldo pide esto con frecuencia: no hace falta que lo repita. Si vas a tocar la interfaz, esta skill aplica.

## 0. Antes de empezar (obligatorio)

1. Lee `AGENTS.md`, `DESIGN.md` (sistema «Itinerante Líquido»), `PRODUCT.md` (límites de verdad) y, en `docs/agentes/00-contexto-compartido.md`, la tabla `<como_evitarlo>` y el bloque `<piso_de_oficio>`. Esta skill no los sustituye: los aterriza.
2. Mira el sitio **renderizado** antes de opinar: `PORT=XXXX nohup node tools/preview-site.mjs > /dev/null 2>&1 &` y capturas con Playwright (`import pw from '/opt/node-tools/node_modules/playwright/index.js'`), claro y oscuro. Nadie juzga lo que no ha visto.
   - **Teléfono = iPhone reales** (desde el 2026-11-14; 390×844 ya no se usa: ningún iPhone ofrece 743 px de franja útil). El alto es la zona visible de Safari con sus barras; usa `pw.devices[...]` (UA, dpr, toque, `isMobile`) y fija las áreas seguras con `Emulation.setSafeAreaInsetsOverride` por CDP:
     - **iPhone 16 393×659** (dpr 3): la referencia principal (franja útil 558).
     - **iPhone 13 mini 375×629** (dpr 3): el peor alto (franja 528): lo que debe caber entre las barras se comprueba aquí.
     - **iPhone SE (3.ª gen.) 375×667** (dpr 2) e **iPhone 16 Pro Max 440×763** (dpr 3).
     - **iPhone 16 Pro a pantalla completa 402×874 con áreas seguras 62/34** (app en la pantalla de inicio o barras de Safari ocultas): cabecera, barra inferior y hojas respetan la Dynamic Island.
     - **320×640** (Zoom de pantalla en los iPhone de 375).
   - Tableta y escritorio: **768×1024, 1024×768, 1440×900 y 1920×1080**.
3. Refinar conserva: identidad, copy, datos y estructura aprobados se quedan. Si algo exige cambiar dirección (quitar una sección, cambiar la paleta, copy nuevo con afirmaciones), propónlo; no lo cueles.

## 1. Principios de Apple que mandan aquí

- **Claridad:** el texto se lee a la primera; la jerarquía la da el tamaño y el peso, no la decoración. Una idea por pantalla.
- **Deferencia:** el contenido (portadas, fotos reales de la casa) es el protagonista; el cromo (barras, flechas, vidrio) se retira. El vidrio solo en lo que flota.
- **Profundidad:** capas y movimiento comunican jerarquía y posición (el carrusel 3D, las hojas que suben). La profundidad orienta; nunca adorna ni marea.
- **Consistencia y convenciones (Jakob):** barra de pestañas, hojas, diálogos y controles se comportan como en iOS.
- **Escala tipográfica de Apple (Dynamic Type, tamaño grande por omisión, en px CSS = pt):** Large Title 34/41 · Title 1 28/34 · Title 2 22/28 · Title 3 20/25 · Headline 17/22 semibold · Body 17/22 · Callout 16/21 · Subheadline 15/20 · Footnote 13/18 · Caption 1 12/16 · Caption 2 11/13. Tokens `--t-*`. Lectura nunca bajo 15; máximo 6 tamaños por pantalla.
- **Objetivos táctiles:** mínimo 44×44 pt (HIG). Aquí: escala 44/48/56 (`--alto-sm/md/lg`), ≥ 8 px entre vecinos, 12 dentro de un grupo.
- **Márgenes de contenido estilo iOS:** 16 (≤ 375 px) / 20 (≥ 376) / 32 (≥ 1024), nunca menos que el área segura. Desde 1024 el contenido y la cabecera viven en un contenedor centrado de 1152 px (12 columnas con canal de 32, `--ancho-contenido` y `--rejilla`; 2026-11-14 y 2026-11-15). Barra de navegación 44 + área segura; barra de pestañas 49.
- **Ritmo de landing (Uber/Pinterest, 2026-11-14):** del fin de una sección al titular de la siguiente, 64 en el teléfono y 112 en escritorio (`--sec`, la mitad a cada lado del borde de la banda). Lo demás, **un valor por rol** (§3 bis, 2026-11-15): titular → texto 12; texto → botón 24. Posiciones fijas en el inicio del teléfono: entre modelos solo cambia el ancho.
- **Movimiento:** respuesta, no espectáculo; duraciones de tokens (`motion.js`); con «reducir movimiento» todo queda plano.

## 2. Leyes de UX y su regla comprobable aquí

| Ley | Regla en el sitio | Cómo se comprueba |
|---|---|---|
| Fitts | Lo que se toca es grande y está cerca de su contexto; flechas del carrusel de 48 junto a la pieza, nunca encima de la pieza central | `controles.mjs`, medición de solapes (§4) |
| Hick | ≤ 7 opciones por grupo; una sola acción primaria por vista | `critique.mjs` (`law-hick`), conteo en capturas |
| Miller | Agrupa en bloques de 3–5; carruseles con ≤ 5 piezas a la vista | §3 |
| Jakob | Patrones conocidos (tab bar, hoja inferior, carrusel con imán) | revisión |
| Proximidad (Gestalt) | Texto y su acción juntos; el pie del carrusel pegado a su pieza (16–20 px), separado del bloque siguiente (≥ 24); un dato va junto a lo suyo («N de 3 paradas hojeadas»: 16 px tras su nota o debajo a 8, nunca suelto en el borde opuesto) | `guias.mjs` (R y G6) |
| Continuidad / alineación | Un eje izquierdo por sección; las columnas derechas de todas las secciones empiezan en la misma x (columna 7); dos columnas de una fila comparten tope | `guias.mjs` (G1, G3, G4) |
| Región común / similitud | Piezas de un mismo carrusel del mismo tamaño y estilo; una sola familia de tarjeta por carrusel | capturas |
| Von Restorff | Solo una cosa destaca por vista (la pieza central con sombra; la primaria) | `law-restorff` |
| Ley de Prägnanz / simetría | Lo centrado está centrado al píxel sobre el eje de su columna, y solo se centra el escenario del carrusel | §4 (|Δ| ≤ 1 px), `guias.mjs` (G2, G5) |
| Serial position | Lo importante al principio o al final de un grupo | revisión |
| Doherty | Respuesta visible < 400 ms; INP ≤ 200 ms con CPU 4× | `inp.mjs` |
| Estética-usabilidad | El acabado (alineación, ritmo, radios) se nota y genera confianza: no se deja un descuadre «porque funciona» | rúbrica visual |
| Gradiente de meta / Zeigarnik | El recorrido muestra progreso real («N de 3 paradas hojeadas»), sin inventar | revisión |
| Tesler | La complejidad la absorbe la interfaz, no la persona (el carrusel empieza centrado en algo útil) | revisión |

## 3. Norma del Carrusel3D (portada, evento, carta)

Objetivo: **la pieza central se lee como protagonista, centrada al píxel, con aire alrededor; las vecinas asoman para invitar a deslizar, sin amontonarse.** Valores de la casa, derivados de los principios de arriba (no son cifras de Apple):

**Teléfono (≤ 760 px):**
- Pieza central: portada 54–60 % del ancho útil (≈ 206–248 px en los iPhone; ≥ 168 a 320); carta 56–62 %; evento 76–82 %. Siempre con tope de alto: carrusel + pie caben entre la barra superior y la barra de pestañas (usa `svh`) **en el 13 mini (375×629)**.
- **Llegar por su enlace** (2026-11-14): cada sección aterriza con su titular a 24 px bajo la cabecera (`scroll-margin-top`); «Catálogo» de la barra inferior aterriza en los chips (`#colecciones`) y chips → portada → «título · autor · precio» quedan enteros entre las barras; en Eventos, la tarjeta central con su «Compartir» (en la fila de insignias); en Café, chips y carta (la carta va antes que la foto).
- Las vecinas asoman entre 16 y 32 % de su ancho por lado en portada y carta (en evento, que ocupa el 76 %, lo que queda: ≈ 11 %), con **≥ 12 px de hueco visible** entre la central y cada vecina (la central nunca queda tapada; desde el 2026-11-13 las vecinas no se enciman).
- Máximo 3 piezas a la vista (1 por lado).
- Flechas: con toque (`(hover: none) and (pointer: coarse)`) no se muestran en ningún carrusel: el control es deslizar o tocar la vecina (alternativa de un puntero a arrastrar, WCAG 2.5.7; Jakob) y se conservan teclado y lector (decisión de Aldo, 2026-11-13). Con puntero fino, sin tapar la pieza central (≥ 8 px de hueco).

**Tableta y escritorio (≥ 761 px):**
- Pieza central: portada 280–320 px; evento 400–460 px; carta 240–280 px. Entre 761 y 1279 px el escenario no da para esa pieza con sus vecinas y las dos flechas: toma la que quepa (`(escenario − 128) / (2 × borde)`), con mínimo portada 240, evento 300 y carta 232.
- Máximo 5 piezas a la vista (2 por lado); el escenario tiene un ancho máximo (~1100–1240 px) **centrado en la columna de contenido** (no en la ventana con barra de desplazamiento) y los bordes se desvanecen suavemente (máscara), sin cortes duros.
- Flechas fuera de la última pieza visible, ≥ 16 px de ella, centradas en el alto de la pieza central.
- Un carrusel no se mete en una columna estrecha: si su sección va en dos columnas, el carrusel ocupa el ancho de la columna de contenido completa debajo del encabezado.

**Siempre:**
- |centro de la pieza central − centro de su contenedor| ≤ 1 px en todos los tamaños.
- Pie (título, «autor · precio») centrado en el mismo eje que la pieza **mientras quepa en dos renglones**. Un texto de más de dos renglones que cuelga del escenario (la descripción de un evento) no va centrado: es un bloque del ancho de la pieza, centrado en el eje, con el texto a la izquierda en la sangría de la tarjeta (16) (2026-11-15).
- Ritmo vertical: chips/nota → carrusel 24–32 px; carrusel → pie 16–20; pie → acción 24.
- Sin texto cortado en piezas centrales; en vecinas, el texto puede quedar oculto pero nunca partido a la mitad de una línea visible.
- Con movimiento reducido: plano, misma geometría, sin giro.

## 3 bis. Sistema de guías (2026-11-15; norma completa en `DESIGN.md`, «Sistema de guías»)

Reglas medibles (todas las comprueba `tools/qa/guias.mjs`; la letra es su regla):

- **Rejilla (G1, G3).** Teléfono y tableta: una columna; líneas = los dos márgenes y el eje. Desde 1024: 12 columnas con canal de 32 en el contenedor (`--rejilla`), **división única 1–6 | 7–12** en todas las secciones (Inicio: texto 1–5, foto 7–12; Explorar: filtros 1–3, tarjetas 4–12). Cada borde de una pieza de primer nivel cae en una línea (± 1 px); nada sale del contenedor salvo lo que va a sangre (ventana del carrusel, tira de La casa). Prohibido definir fracciones por sección (`5fr 7fr`).
- **Alineación (G2, G4, G5, G6).** Un eje izquierdo por sección. Centrado solo el escenario del carrusel (pieza, pie de ≤ 2 renglones, flechas), a ± 1 px del eje. Nada alineado a la derecha en el teléfono salvo cifras en una fila de lista. Controles sin fondo: se alinea su tinta, no su caja. Dos columnas comparten tope (Δ ≤ 1); ninguna pareja de cajas «casi alineada» (1–16 px). Un dato asociado va junto a su texto.
- **Aire por rol (R1–R3).** Un valor por rol y todo hueco en la escala de 4: banda → titular 32 / 56 · titular → texto 12 · texto → texto 8 · texto → control 24 · control → control 16 · control → su nota 12 · cabecera → contenido 24 · rótulo → grupo 8 · contenido → pie de figura 8 · pieza → pie 20 · contenido → su acción 24 (32 en tableta y escritorio) · filete 24 + 24 · bloque → bloque 32 / 48 · capa → capa 64 / 96 · sección → sección 64 / 112. Antes de poner un margen, nombra el rol; si no existe, no es un margen nuevo: es una pieza mal clasificada.
- **Botones (B1–B3).** Misma jerarquía = mismo alto, relleno, rótulo e icono. Primario 56: ancho completo en el teléfono, al ancho del rótulo desde 761, siempre desde el margen izquierdo, a 24 de su texto. Chips: un solo relleno por ancho.
- **Títulos (T1–T3).** Una forma por nivel: titular de sección Title 1 (también «Contacto») en dos renglones «Nombre / frase»; subtitular y nombre de pieza central Title 3; entradilla Body ≤ 60 ch (medida ≤ 78 ch); párrafo de tres renglones o más (≥ 120 caracteres), `lectura` 17/24 (interlínea ≥ 1.35, `critique.mjs` `law-lineheight`); nota Subheadline 15; sin renglón final de una sola palabra; ≤ 6 tamaños por sección.
- **Tarjetas (C1, C2).** Sin vacío interior mayor que el 25 % de su alto; una sola sangría.
- **Hojas y barras (H1–H3, N1–N3).** Margen de hoja de la escala (16 / 20 / 32), que no crece con la ventana; botones sin aplastar; un eje de tinta y uno de cajas en menú, Mi lista y Explorar. Cabecera en el contenedor y sin piezas que se muevan al desplazar; barra inferior centrada.
- **Excepciones:** se escriben con su razón en `SISTEMA.excepciones` (inicio del teléfono, fila de dos columnas, reserva del pie del libro, chips de Café en escritorio). Un fallo no se apaga relajando la norma.

## 4. Cómo medir (no opines sin cifras)

- **Sistema de guías**: `node tools/qa/guias.mjs URL [DIR] [--perfiles=iphone16,d1440] [--capturas=ref|todas|no] [--oscuro] [--css=parche.css] [--js=parche.js]` (2026-11-15). Siete perfiles (iPhone 16 393×659, 13 mini 375×629, 16 Pro Max 440×763 con toque; 768×1024; 1024×768, 1440×900 y 1920×1080 con puntero fino). Mide con `getBoundingClientRect`, estilos calculados y rangos de texto (la tinta, no la caja): rejilla y ejes por sección, aire por rol, botones por jerarquía, niveles de título, tarjetas, barras y hojas. Sale con 1 si hay fallos; escribe `guias.txt`, `guias.json` y capturas con la superposición de la rejilla. **Objetivo: 0 fallos en los siete perfiles.** `--css` / `--js` inyectan un parche de prueba para medir una propuesta antes de construirla. Usa Playwright (`PLAYWRIGHT_PATH` o `/opt/node-tools`), a diferencia del resto del arnés.

- **Llegar a cada sección en iPhone**: `node tools/qa/iphone.mjs URL [DIR]` (2026-11-14). En los perfiles de §0 toca de verdad la barra inferior o el menú ☰ y comprueba que titular, acción y pieza central quedan enteros entre la cabecera y la barra inferior (≥ 8 px), el titular a 24 px de la cabecera, el inicio en sus posiciones fijas (titular y 68–150 y «Cómo llegar» 256–312 con la barra de 44; foto 3:2 entera sobre la barra), el menú sin desbordar y la ficha bajo el área segura. Sale con 1 si algo falla.
- Medición de carruseles: `node tools/qa/carrusel.mjs URL [DIR]` (sale con 1 si algo sale de la norma de §3). Mide portada, evento y carta en 320×640, los iPhone de §0 (375×629, 375×667, 393×659, 440×763 y 402×874 con áreas seguras), 768 (con toque), 1024, 1280, 1440 y 1920 (puntero fino), con movimiento y con movimiento reducido. Para cada `.c3d` comprueba: centro de la pieza central contra `c3d.getBoundingClientRect()` y contra la columna de su sección (no contra `innerWidth`; ≤ 1 px), ancho (% del carrusel en el teléfono, px desde 761), piezas a la vista (> 50 % dentro), hueco central↔vecina (≥ 12), flechas (ocultas con toque; con puntero fino ≥ 44, sin tapar la central, centradas en el alto de la pieza y desde 1024 ≥ 16 px fuera de la última pieza), bloque carrusel + pie + acción dentro del alto útil, aire (arriba 24–32, pieza → pie 16–20, pie → acción 24), texto cortado (central, pie y vecinas en el borde) y, con movimiento reducido, que nada quede en 3D. Escribe la tabla, `carrusel.json` y capturas en `DIR`.
- Arnés del repo: `node tools/qa/controles.mjs URL DIR`, `piso.mjs`, `responsive.mjs` (42 tamaños), `rail.mjs`, `feed.mjs`, `e2e.mjs`, `inp.mjs` (CPU 4×), `motion.mjs`; `npm test`, `npm run test:design`, `npm run critique`, `npm run tokens:check`, `npm run test:browser`.
- Rúbrica `docs/agentes/rubrica-visual.md`: puntúa mirando capturas (iPhone 16 393×659 claro y oscuro, 13 mini 375×629, 16 Pro Max 440×763, 320 y 1440). Vara: promedio ≥ 8 y nada < 7. Para «lo más fino posible» apunta a ≥ 9 en Composición, Móvil y Pulido.

## 5. Procedimiento

1. **Medir** (capturas + cifras de §4) y anotar el estado de partida.
2. **Diagnosticar** contra §1–§3: cada hallazgo con la ley o principio, la cifra medida y el valor objetivo («portada central 172 → 220 px a 390; hueco con vecina −18 → 12 px»), nunca adjetivos.
3. **Corregir** en tokens (`design/tokens.json` → `npm run tokens`) y CSS local; nada en línea (CSP). Cambios coherentes por lote.
4. **Verificar** con el arnés y nuevas capturas; repetir hasta 3 rondas o hasta cumplir.
5. **Documentar** en `DESIGN.md` (norma nueva o cambiada, con fecha) y una entrada en `docs/CONTINUITY.md`.

## 6. Complementos

- **Impeccable** (`pbakaus/impeccable`, Apache 2.0): sus referencias `critique`, `audit`, `layout`, `polish`, `adapt`, `craft-floor`, `ios` y `mode-persuade` se leen como guía. Desde el 2026-11-13 está instalado con sus hooks por decisión de Aldo (`.claude/skills/impeccable/`, `.claude/settings.json`); su lanzador descarga el motor verificado por checksum a una caché fuera del repositorio. Úsalo: `context` una vez por sesión, `detect` sobre los archivos tocados y atiende los avisos del hook.
- Fuentes con citas y licencias: `docs/ux/FUENTES.md`.

---
name: ux-apple
description: Guía de diseño de Librería Itinerante con Apple Human Interface Guidelines y leyes de UX (Laws of UX, NN/g, WCAG). Úsala SIEMPRE antes de diseñar, auditar o refinar cualquier interfaz del sitio (carruseles, tarjetas, barras, hojas, tipografía, espaciado, móvil y escritorio), y cuando Aldo pida «sigue las guidelines de Apple», «leyes UX/UI», «refina el diseño», «que se vea fino» o «centra/amplía el carrusel». Da reglas medibles, cómo medirlas y el procedimiento de auditoría y corrección.
---

# /ux-apple — Apple HIG + leyes de UX para el sitio

Aldo pide esto con frecuencia: no hace falta que lo repita. Si vas a tocar la interfaz, esta skill aplica.

## 0. Antes de empezar (obligatorio)

1. Lee `AGENTS.md`, `DESIGN.md` (sistema «Itinerante Líquido»), `PRODUCT.md` (límites de verdad) y, en `docs/agentes/00-contexto-compartido.md`, la tabla `<como_evitarlo>` y el bloque `<piso_de_oficio>`. Esta skill no los sustituye: los aterriza.
2. Mira el sitio **renderizado** antes de opinar: `PORT=XXXX nohup node tools/preview-site.mjs > /dev/null 2>&1 &` y capturas con Playwright (`import pw from '/opt/node-tools/node_modules/playwright/index.js'`) en **320×640, 390×844, 768×1024, 1024×768, 1440×900 y 1920×1080**, claro y oscuro. Nadie juzga lo que no ha visto.
3. Refinar conserva: identidad, copy, datos y estructura aprobados se quedan. Si algo exige cambiar dirección (quitar una sección, cambiar la paleta, copy nuevo con afirmaciones), propónlo; no lo cueles.

## 1. Principios de Apple que mandan aquí

- **Claridad:** el texto se lee a la primera; la jerarquía la da el tamaño y el peso, no la decoración. Una idea por pantalla.
- **Deferencia:** el contenido (portadas, fotos reales de la casa) es el protagonista; el cromo (barras, flechas, vidrio) se retira. El vidrio solo en lo que flota.
- **Profundidad:** capas y movimiento comunican jerarquía y posición (el carrusel 3D, las hojas que suben). La profundidad orienta; nunca adorna ni marea.
- **Consistencia y convenciones (Jakob):** barra de pestañas, hojas, diálogos y controles se comportan como en iOS.
- **Escala tipográfica de Apple (Dynamic Type, tamaño grande por omisión, en px CSS = pt):** Large Title 34/41 · Title 1 28/34 · Title 2 22/28 · Title 3 20/25 · Headline 17/22 semibold · Body 17/22 · Callout 16/21 · Subheadline 15/20 · Footnote 13/18 · Caption 1 12/16 · Caption 2 11/13. Tokens `--t-*`. Lectura nunca bajo 15; máximo 6 tamaños por pantalla.
- **Objetivos táctiles:** mínimo 44×44 pt (HIG). Aquí: escala 44/48/56 (`--alto-sm/md/lg`), ≥ 8 px entre vecinos, 12 dentro de un grupo.
- **Márgenes de contenido estilo iOS:** 16 (≤ 389 px) / 20 (≥ 390) / 32 (≥ 1024), nunca menos que el área segura. Barra de navegación 44 + área segura; barra de pestañas 49.
- **Movimiento:** respuesta, no espectáculo; duraciones de tokens (`motion.js`); con «reducir movimiento» todo queda plano.

## 2. Leyes de UX y su regla comprobable aquí

| Ley | Regla en el sitio | Cómo se comprueba |
|---|---|---|
| Fitts | Lo que se toca es grande y está cerca de su contexto; flechas del carrusel de 48 junto a la pieza, nunca encima de la pieza central | `controles.mjs`, medición de solapes (§4) |
| Hick | ≤ 7 opciones por grupo; una sola acción primaria por vista | `critique.mjs` (`law-hick`), conteo en capturas |
| Miller | Agrupa en bloques de 3–5; carruseles con ≤ 5 piezas a la vista | §3 |
| Jakob | Patrones conocidos (tab bar, hoja inferior, carrusel con imán) | revisión |
| Proximidad (Gestalt) | Texto y su acción juntos; el pie del carrusel pegado a su pieza (16–20 px), separado del bloque siguiente (≥ 24) | medición de aire |
| Región común / similitud | Piezas de un mismo carrusel del mismo tamaño y estilo; una sola familia de tarjeta por carrusel | capturas |
| Von Restorff | Solo una cosa destaca por vista (la pieza central con sombra; la primaria) | `law-restorff` |
| Ley de Prägnanz / simetría | Lo centrado está centrado al píxel sobre el eje de su columna | §4 (|Δ| ≤ 1 px) |
| Serial position | Lo importante al principio o al final de un grupo | revisión |
| Doherty | Respuesta visible < 400 ms; INP ≤ 200 ms con CPU 4× | `inp.mjs` |
| Estética-usabilidad | El acabado (alineación, ritmo, radios) se nota y genera confianza: no se deja un descuadre «porque funciona» | rúbrica visual |
| Gradiente de meta / Zeigarnik | El recorrido muestra progreso real («N de 3 paradas hojeadas»), sin inventar | revisión |
| Tesler | La complejidad la absorbe la interfaz, no la persona (el carrusel empieza centrado en algo útil) | revisión |

## 3. Norma del Carrusel3D (portada, evento, carta)

Objetivo: **la pieza central se lee como protagonista, centrada al píxel, con aire alrededor; las vecinas asoman para invitar a deslizar, sin amontonarse.** Valores de la casa, derivados de los principios de arriba (no son cifras de Apple):

**Teléfono (≤ 760 px):**
- Pieza central: portada 54–60 % del ancho útil (≈ 210–230 px a 390; ≥ 168 a 320); carta 56–62 %; evento 76–82 %. Siempre con tope de alto: carrusel + pie + acción caben entre la barra superior y la barra de pestañas (usa `svh`).
- Las vecinas asoman entre 16 y 28 % de su ancho por lado, con **≥ 12 px de hueco visible** entre la central y cada vecina (la central nunca queda tapada).
- Máximo 3 piezas a la vista (1 por lado).
- Flechas: sin tapar la pieza central (≥ 8 px de hueco); si no caben, se esconden en el teléfono (el gesto de deslizar es el control primario, Jakob) y se conservan teclado y lector.

**Tableta y escritorio (≥ 761 px):**
- Pieza central: portada 280–320 px; evento 400–460 px; carta 240–280 px.
- Máximo 5 piezas a la vista (2 por lado); el escenario tiene un ancho máximo (~1100–1240 px) **centrado en la columna de contenido** (no en la ventana con barra de desplazamiento) y los bordes se desvanecen suavemente (máscara), sin cortes duros.
- Flechas fuera de la última pieza visible, ≥ 16 px de ella, centradas en el alto de la pieza central.
- Un carrusel no se mete en una columna estrecha: si su sección va en dos columnas, el carrusel ocupa el ancho de la columna de contenido completa debajo del encabezado.

**Siempre:**
- |centro de la pieza central − centro de su contenedor| ≤ 1 px en todos los tamaños.
- Pie (título, «autor · precio») y acción centrados en el mismo eje que la pieza.
- Ritmo vertical: chips/nota → carrusel 24–32 px; carrusel → pie 16–20; pie → acción 24.
- Sin texto cortado en piezas centrales; en vecinas, el texto puede quedar oculto pero nunca partido a la mitad de una línea visible.
- Con movimiento reducido: plano, misma geometría, sin giro.

## 4. Cómo medir (no opines sin cifras)

- Medición de carruseles: `node tools/qa/carrusel.mjs URL [DIR]` (falla si algo sale de la norma de §3). Para cada `.c3d` devuelve: `centroDx` contra `c3d.getBoundingClientRect()` (no contra `innerWidth`), `% del ancho útil`, piezas visibles (> 50 % dentro), hueco mínimo central↔vecina, solape flecha↔central y aire arriba/abajo.
- Arnés del repo: `node tools/qa/controles.mjs URL DIR`, `piso.mjs`, `responsive.mjs` (42 tamaños), `rail.mjs`, `feed.mjs`, `e2e.mjs`, `inp.mjs` (CPU 4×), `motion.mjs`; `npm test`, `npm run test:design`, `npm run critique`, `npm run tokens:check`, `npm run test:browser`.
- Rúbrica `docs/agentes/rubrica-visual.md`: puntúa mirando capturas (390 claro y oscuro, 320, 1440). Vara: promedio ≥ 8 y nada < 7. Para «lo más fino posible» apunta a ≥ 9 en Composición, Móvil y Pulido.

## 5. Procedimiento

1. **Medir** (capturas + cifras de §4) y anotar el estado de partida.
2. **Diagnosticar** contra §1–§3: cada hallazgo con la ley o principio, la cifra medida y el valor objetivo («portada central 172 → 220 px a 390; hueco con vecina −18 → 12 px»), nunca adjetivos.
3. **Corregir** en tokens (`design/tokens.json` → `npm run tokens`) y CSS local; nada en línea (CSP). Cambios coherentes por lote.
4. **Verificar** con el arnés y nuevas capturas; repetir hasta 3 rondas o hasta cumplir.
5. **Documentar** en `DESIGN.md` (norma nueva o cambiada, con fecha) y una entrada en `docs/CONTINUITY.md`.

## 6. Complementos

- **Impeccable** (`pbakaus/impeccable`, Apache 2.0): sus referencias `critique`, `audit`, `layout`, `polish`, `adapt`, `craft-floor`, `ios` y `mode-persuade` se leen como guía. Su lanzador descarga un binario y sus hooks se instalan en `.claude/`: no se ejecutan ni se instalan sin permiso explícito de Aldo en la sesión.
- Fuentes con citas y licencias: `docs/ux/FUENTES.md`.

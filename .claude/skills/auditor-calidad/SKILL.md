---
name: auditor-calidad
description: Auditor de calidad de UX/UI y movimiento de Librería Itinerante con los 20 principios (los 12 de animación — squash & stretch, anticipación, puesta en escena, pose a pose, follow through, slow in/out, arcos, acción secundaria, timing, exageración, dibujo sólido en 3D, atractivo — y 8 leyes de UX — Fitts, zonas de toque, Hick, Miller, Doherty, Postel, Jakob, frecuencia de uso). Úsala cuando Aldo pida «audita la calidad», «los 20 principios», «principios de animación», «revisa las animaciones/microinteracciones», «mejora la UX/UI», «que se sienta fino/vivo», antes de diseñar o aprobar un componente o una animación nueva, y como cierre de cualquier ronda de interfaz. Da la regla medible de cada principio en este sitio, el script que la mide, la revisión a ojo, la puntuación y el formato del informe.
---

# /auditor-calidad — los 20 principios de UX y animación, aterrizados en el sitio

Complementa a `ux-apple` (composición, rejilla, Apple HIG): esta skill mira **cómo responde y cómo se mueve** la interfaz y **cuánto le cuesta a la persona** usarla. Sirve para dos cosas: **auditar** lo que existe (§3–§5) y **diseñar** lo nuevo sin romper la norma (§6).

## 0. Antes de empezar

1. Lee `AGENTS.md`, `DESIGN.md` («Movimiento», «Carrusel3D», «Sistema de guías»), `PRODUCT.md` y `.claude/skills/ux-apple/SKILL.md`. Si algo de aquí choca con `DESIGN.md`, manda `DESIGN.md` y se anota la contradicción.
2. Límites que ningún principio puede saltarse:
   - **Movimiento solo desde tokens**: duraciones 120 / 240 / 400 / 700 ms (`dur-instantanea`, `dur-rapida`, `dur-base`, `dur-lenta`), escalón de 60 ms, curvas `curva-salida`, `curva-entrada-salida`, `curva-resorte`. En JS, por `motion.js`. Nada de milisegundos ni `ease` a mano.
   - **Nada se mueve solo**: sin bucles, sin autoplay. Todo movimiento responde a un toque, al cursor o a que algo entra a la vista, y ocurre una vez.
   - **«Reducir movimiento» y la pausa del pie valen lo mismo**: todo aparece colocado en su estado final; los colores siguen respondiendo.
   - **La información nunca va solo en el movimiento**: el estado también está en texto o en ARIA.
   - CSP estricta, sin dependencias nuevas (Lottie, GSAP y similares necesitan aprobación de Aldo), sin datos inventados (contadores, rankings, «N personas…»).
3. Los 12 principios de animación nacieron para personajes. Aquí se traducen a interfaz: **no** se trata de que las cosas reboten, sino de que la respuesta se entienda. Ante la duda, menos.

## 1. Los 12 principios de animación en este sitio

| # | Principio | Aquí significa | Regla medible | Dónde vive hoy | Se mide con |
|---|---|---|---|---|---|
| 1 | Squash & stretch | La pieza cede al presionarla y vuelve | Escala solo como respuesta a un toque, entre **0.9 y 1.06**; nunca sobre párrafos ni fotos enteras; uniforme (no deforma el texto) | Botones 0.97, chips 0.96, casillas de la barra 0.94, portada 0.98, `il-pop` 0.9 → 1 al guardar, pulgar del interruptor | `principios.mjs` (escalas), `motion.mjs` |
| 2 | Anticipación | La interfaz avisa antes de que pase algo | Todo control tiene sus estados previos (hover con puntero fino, `:focus-visible`, presionado) declarados en `design/componentes.json`; toda carga muestra un esqueleto del tamaño del contenido (CLS 0); las vecinas del carrusel asoman | Estados del catálogo de componentes, esqueletos, `.is-entrando` de la profundidad, vecinas del Carrusel3D | `tests/componentes.test.mjs`, `skeleton.mjs` |
| 3 | Puesta en escena (staging) | Un foco por vista | Una sola primaria por vista; solo la pieza central lleva `sombra-portada`; detrás de una hoja, el velo; lo que asoma se atenúa | Primaria «Cómo llegar», central del carrusel, `::backdrop`, tira de La casa | `critique` (`law-restorff`, `law-hick`), `carrusel.mjs`, `guias.mjs` |
| 4 | Pose a pose | Estados con nombre; el navegador interpola | Toda animación va de un estado declarado a otro (`.is-centro`, `.is-llena`, `.is-dibuja`, `.is-entrando`, `[open]`), no fotograma a fotograma en JS; la única pose calculada es la del carrusel y es función pura de la distancia (`coverflowPose`, `tiltPose`); sin movimiento se salta al estado final | `carousel3d.js`, `motion.js`, `@starting-style` de las hojas | `npm test`, `carrusel.mjs` (pasada sin movimiento) |
| 5 | Follow through y solapamiento | Lo que llega se asienta; las partes no llegan todas a la vez | Rebote **≤ 5 %** y una sola vez (`curva-resorte`), solo en piezas pequeñas; escalonado de 60 ms y todo el grupo dentro de `dur-lenta`; **cero animaciones infinitas** | Pulgar del interruptor, `il-pop`, titulares por línea, `staggerIn` de la rejilla, imán del carrusel | `principios.mjs` (bucles), `motion.mjs` |
| 6 | Slow in & slow out | Nada arranca ni se detiene en seco | Entradas con `curva-salida`; movimientos dentro de la pantalla con `curva-entrada-salida`; `linear` solo en lo atado al scroll (`casa-enfoque`); ningún `ease` genérico | Todas las transiciones | `principios.mjs` (curvas), `motion.mjs` |
| 7 | Arcos | Las trayectorias largas son curvas; las cortas, rectas | El arco es del **carrusel** (giro + profundidad + empuje) y de la **inclinación** al cursor. Hojas, menú y avisos suben o bajan en línea recta, como en iOS (Jakob manda sobre el arco) | Carrusel3D, `initDepth` | `carrusel.mjs` |
| 8 | Acción secundaria | Un detalle que acompaña sin competir | A lo más **una** por interacción; dura lo mismo o menos que la principal; no la retrasa; no es el único portador del estado | Palomita que se dibuja al elegir chip o guardar, conector del recorrido que se llena, pastilla de la barra inferior, brillo de lámina, ruta del mapa | `saved.mjs`, `rail.mjs`, revisión a ojo |
| 9 | Timing | Cada cosa dura lo que pesa | Respuesta al toque 120; cambio de estado de un control 240; hojas y cambios de composición 400; entradas de titular e imagen 700 (la escala de la foto, 1.6 × 700); **ninguna respuesta a una acción pasa de 700**; salir es igual o más corto que entrar | Tokens `dur-*` | `principios.mjs` (duraciones), `motion.mjs` |
| 10 | Exageración | La respuesta se nota, sin gritar | Toda acción que cambia algo responde en **dos canales** (forma o color + texto o región viva) en ≤ 100 ms; techos: escala 1.06, inclinación 6°, giro 44°, adelanto 12 px; sin sacudidas, confeti ni contadores | «Guardado en Mi lista.», marcador relleno, chip en primario con palomita, `aria-pressed` | `principios.mjs` (escalas), `saved.mjs`, `tests/componentes.test.mjs` |
| 11 | Dibujo sólido (3D) | El volumen es coherente | Una perspectiva por escena (4 anchos de pieza en el carrusel; 800 px en la inclinación); una sola luz (el brillo sigue al cursor); sombra solo en la central; vecinas separadas ≥ 12 px, nunca encimadas; sin movimiento, plano con la misma geometría | Carrusel3D, tarjetas de la rejilla | `principios.mjs` (profundidad), `carrusel.mjs` |
| 12 | Atractivo (appeal) | El conjunto da gusto y confianza | Rúbrica visual: promedio ≥ 8 y nada bajo 7 (para «lo más fino», ≥ 9 en Composición, Móvil y Pulido); fotos reales; una sola familia de letra | Todo el sitio | `docs/agentes/rubrica-visual.md`, `piso.mjs`, Impeccable `critique` |

## 2. Las 8 leyes de UX en este sitio

| # | Ley | Aquí significa | Regla medible | Se mide con |
|---|---|---|---|---|
| 13 | Fitts | Lo importante es grande y está cerca | Primaria de 56 a todo el ancho en el teléfono y a 24 de su texto; barra inferior al alcance del pulgar; flechas de 48 junto a la pieza, nunca encima de la central | `controles.mjs`, `iphone.mjs`, `guias.mjs` (B) |
| 14 | Zonas de toque amplias | Se toca más de lo que se ve | Todo control ≥ 44 × 44; chips 48; primarias 56; ≥ 8 px entre vecinos; lo pequeño a la vista (interruptor 51 × 31, iconos) vive en un objetivo de 44 | `controles.mjs`, `axe.mjs` |
| 15 | Hick | Pocas decisiones a la vez | Una primaria por vista; ≤ 7 opciones por grupo; ≤ 6 destinos en la primera vista; un grupo de filtros se pliega desde 8 | `critique` (`law-hick`), `feed.mjs` |
| 16 | Miller | Bloques de 3 a 5 | ≤ 5 piezas a la vista en un carrusel; barra inferior de 3; navegación de ≤ 5 secciones; rejilla plegada a dos filas; listas largas, agrupadas | `carrusel.mjs`, `explorer.mjs` |
| 17 | Umbral de Doherty | La respuesta llega antes de 400 ms | INP ≤ 200 ms con CPU 4×; ninguna tarea larga > 200 ms por un clic; lo que tarda muestra esqueleto; LCP ≤ 2.5 s y CLS 0 | `inp.mjs`, `skeleton.mjs`, `e2e.mjs` |
| 18 | Postel | Tolerante con lo que recibe, estricta con lo que entrega | La búsqueda ignora acentos, mayúsculas y espacios (`norm`); un enlace `#libro-<id>` inexistente, una fecha inválida, una portada rota o un `localStorage` bloqueado caen a un estado digno, no a un error; lo que se imprime tiene un solo formato («$250 MXN», «Sáb 21 nov · 18:30») | `principios.mjs` (postel), `explorer.mjs`, `npm test` (`validMenu`, `validDay`, `eventBadge`) |
| 19 | Jakob | Se usa como lo que la gente ya conoce | Barra inferior, hoja que sube, ☰ con × en su sitio, «atrás» y Escape cierran la hoja de arriba, carrusel con imán, interruptor al modo de iOS, campo de búsqueda con su × | `e2e.mjs`, `explorer.mjs` |
| 20 | Frecuencia de uso | Lo que más se usa, a un toque | «Cómo llegar», Catálogo y Mi lista a **un toque** desde cualquier punto de la página en el teléfono; lo ocasional (pausar el movimiento, redes) a ≤ 2 toques y fuera del lugar principal. **No hay analítica**: la frecuencia se deduce de los objetivos de `PRODUCT.md`; no se inventan cifras de uso | `feed.mjs`, `iphone.mjs` |

## 3. Medir primero

```bash
node tools/qa/principios.mjs            # los 20, con vista previa propia (≈ 10 min)
node tools/qa/principios.mjs --rapido   # lo estático + motion + controles (≈ 1,5 min)
node tools/qa/principios.mjs --completo # además, guias en sus siete perfiles
node tools/qa/principios.mjs --solo=1,5,9 --dir=CARPETA --url=http://127.0.0.1:8500/
```

Imprime una tabla de 20 filas (estado, qué herramienta pasó o falló y la pregunta «a ojo»), la guarda en `principios.md` y `principios.json`, y sale con 1 si algo falla. La norma numérica vive en `NORMA` al inicio del script: si `DESIGN.md` cambia un techo, se cambia ahí, nunca para tapar un fallo. Como root hace falta `CHROME_PATH` con `--no-sandbox` (igual que el resto del arnés).

Un verde del script **no** aprueba el principio: solo dice que no se rompió la parte medible.

## 4. Revisar a ojo (la otra mitad)

El movimiento no se juzga en una captura. Para cada interacción que se audite, graba una **tira de fotogramas** con Playwright (skill `webapp-testing`): dispara la acción y captura a 0, 60, 120, 240, 400 y 700 ms, con movimiento y con `reducedMotion: 'reduce'`, en iPhone 16 (393 × 659) y 1440. Míralas en orden.

Interacciones que siempre entran: presionar una primaria · elegir un chip · guardar un libro · mover el carrusel (flecha, deslizar y tocar la vecina) · abrir y cerrar el menú ☰, Mi lista, la ficha y Explorar · «Ver los 41 títulos» · llegar a una sección por su enlace · el interruptor de movimiento · pasar el cursor por la portada central y por una tarjeta.

Preguntas por tira (anota la cifra, no el adjetivo):
- ¿En qué fotograma aparece la primera respuesta? (≤ 120 ms)
- ¿Algo se mueve antes de que la persona haga nada, o sigue moviéndose después de 700 ms?
- ¿Cuántas cosas se mueven a la vez? Si son más de dos, ¿cuál es la principal y se distingue?
- ¿El estado final con movimiento reducido es idéntico al final con movimiento?
- ¿La respuesta existe también en texto o ARIA?
- ¿La trayectoria y la curva son las de la tabla (recta en hojas, arco en el carrusel; frena al llegar)?

## 5. Puntuar e informar

Cada principio recibe **0, 1 o 2**: 0 = rompe la regla medible o falla su script; 1 = cumple lo medible con observaciones a ojo; 2 = cumple y la tira lo confirma. Total sobre 40. **Vara: ≥ 34 y ningún 0.** Un 0 en 9, 14 o 17 (timing, zonas de toque, Doherty) es P0.

El informe, en español y sin adjetivos sin número:

1. Resumen de 5 a 10 líneas con el total y los P0.
2. Tabla de 20 filas: principio · puntos · cifra medida · objetivo · evidencia (script o tira) · `archivo:selector` donde se corrige.
3. Hallazgos priorizados (P0 bloqueante, P1, P2), cada uno con su corrección concreta en tokens o CSS.
4. Qué mejora propone y **qué decisión aprobada por Aldo cambiaría** (esas no se aplican sin preguntarle).
5. Qué no se pudo medir (Safari real, iPhone físico, lo que el script no cubre).

Auditar es de solo lectura. Corregir es otro paso: tokens (`design/tokens.json` → `npm run tokens`) → CSS local → arnés completo → `DESIGN.md` y `docs/CONTINUITY.md`, como en `ux-apple` §5. El subagente `auditor-calidad` hace la auditoría; `refinador-ux-apple` aplica.

## 6. Diseñar con los 20 (antes de construir algo nuevo)

Todo componente o animación nueva llega con su **ficha**, y la ficha se revisa contra las tablas antes de escribir código:

| Campo | Qué se decide | Principios |
|---|---|---|
| Para qué | Qué entiende la persona gracias a esto que sin ello no entendería. Si la respuesta es «se ve bonito», no entra | 3, 8, 12 |
| Disparador | Toque, cursor o entrada a la vista. Nunca el paso del tiempo | 5 |
| Estados | Reposo, hover, foco, presionado, ocupado, final. Con nombre de clase o atributo | 2, 4 |
| Duración y curva | Un token de cada uno, por la tabla de timing | 6, 9 |
| Qué se mueve | Propiedades (solo `transform`, `opacity`, color; nada que recalcule la composición) y cuánto (dentro de los techos) | 1, 10, 11 |
| Sin movimiento | Cómo queda con «reducir movimiento» o la pausa | 4 |
| Segundo canal | El texto o el atributo ARIA que dice lo mismo | 10 |
| Tamaño y lugar | Alto de la escala 44 / 48 / 56, a cuántos toques queda y junto a qué | 13, 14, 20 |
| Carga para la persona | Cuántas opciones añade a la vista y a qué grupo pertenece | 15, 16 |
| Entradas raras | Qué pasa si el dato falta, viene mal o tarda | 17, 18 |
| Patrón conocido | A qué control de iOS o de la web se parece | 19 |

Después de construir: se añade al catálogo (`design/componentes.json`, `npm run componentes`), se corre `principios.mjs` y se graba su tira.

## 7. Lo que esta skill no hace

- No autoriza animaciones decorativas, bucles, vídeo de fondo, fondos animados ni logotipos animados al cargar.
- No sustituye a `ux-apple` (rejilla, aire, títulos), a `autocorregir` (tokens, copy y verdad) ni a Impeccable (`critique`, `polish`); se apoya en ellas.
- No inventa métricas de uso: sin analítica, «frecuencia» es un juicio razonado desde `PRODUCT.md` y así se dice en el informe.

Fuentes: los doce principios de animación de Thomas y Johnston (*The Illusion of Life*, 1981); las leyes de Fitts, Hick, Miller, Doherty, Postel y Jakob según Laws of UX y NN/g; objetivos táctiles de Apple HIG y WCAG 2.2 (2.5.5 y 2.5.8); la frecuencia de uso como principio clásico de disposición en ergonomía. Citas y licencias en `docs/ux/FUENTES.md`.

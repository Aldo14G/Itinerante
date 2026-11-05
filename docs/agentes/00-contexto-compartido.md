# Contexto compartido (lo leen todos los agentes antes de empezar)

Este archivo es la fuente de verdad del proyecto para el equipo de agentes. Está escrito siguiendo la guía oficial de Anthropic para prompts agénticos («Prompting best practices»): contexto con motivo, criterios de éxito explícitos, estado en archivos y verificación antes de dar algo por terminado.

<project>
Librería Itinerante y Más, centro de Monterrey (Mariano Matamoros Pte. 421). El sitio es una sola página estática (HTML, CSS y JavaScript sin dependencias) que ya sustituyó al sitio anterior y vive en la raíz del repositorio. **El objetivo del sitio es que la gente visite la librería**: la acción primaria de cada pantalla es «Cómo llegar». WhatsApp es apoyo informativo («confirma si lo tienen»). No es una tienda ni un menú de restaurante: en móvil debe sentirse como una red social (perfil, destacados, publicaciones, guardar, compartir), sin inventar contenido.
</project>

<state_of_the_site>
- Cuatro capítulos con los mismos nombres en cabecera, menú y barra inferior: La casa · Cartelera · Libros · Visita. Libros tiene tres capas: carrusel de libros → temas y consulta por WhatsApp → «Explorar la muestra» (hoja a pantalla completa en móvil; en línea en escritorio).
- Archivos: `index.html`, `style.css` (base y escritorio), `mobile.css` (solo ≤ 760 px), `tokens.css` (GENERADO desde `design/tokens.json` con `npm run tokens`; no se edita a mano), `app.js` (escenas, menú lateral, Explorar), `scenes-desktop.js` (solo escritorio), `catalog.js` (muestra y ficha), `rail.js` (carrusel), `saved.js` (Mi lista), `sample.js`, `motion.js`, `assets/`.
- Documentos de diseño vigentes: `DESIGN.md`, `PRODUCT.md`, `design/tokens.json`, `docs/PLAN-ESTRUCTURA-Y-CARRUSEL.md`. El sitio anterior está archivado y NO se toca (`_archive/`).
</state_of_the_site>

<truth_rules>
Estas reglas no se negocian: la librería confirma la existencia y el precio de todo.
1. Sin precios, existencias, fechas, reseñas ni calificaciones inventados. Nada de «más leídos» ni «lo más preguntado»: no hay datos.
2. Imágenes generadas se rotulan «Recreación IA»; fotos reales, «Foto real».
3. Todo lo que venga de la muestra lleva el rótulo «Datos de muestra · no es inventario». El listado real de obras llegará después: los módulos (carrusel, Novedades) deben poder recibirlo (`ids` en `assets/data/collections.json`) y **ocultarse** si no hay datos.
4. Horario: lunes a sábado 11:00–20:00; domingo cerrado. WhatsApp 528180875940.
</truth_rules>

<design_system>
- Paleta del logo: turquesa `#7ac4b4` y blanco `#f8f8f8`. Dirección: **moderno y minimalista en lo digital frente a rústico y clásico en la casa**: la piedra, la madera y el ladrillo viven solo en las fotos; ningún token es cálido. Campos de color a ancho completo con croma OKLCH ≤ 0.09 (el turquesa del logo mide 0.078); acentos pequeños hasta 0.11. Tinta `#10201e`; primaria «Cómo llegar» turquesa profundo `#176b62` con texto blanco. Tonos por sección: `data-tone="light|mist|deep"`.
- Ritmo vertical: `--sec-sm` y `--sec-md` (48/96 px en móvil, 64/128 en escritorio). Cuadrícula de 4 px. Nada de `clamp(...vh)` para rellenos de sección.
- Movimiento: duraciones solo de los tokens (`--dur-instant` 120, `--dur-fast` 240, `--dur-base` 400, `--dur-slow` 700, `--dur-scene` 1200 ms); en JS, `motion.js`. Con `prefers-reduced-motion: reduce` no queda ninguna transición ni animación (regla general al final de `style.css`).
- CSP estricta: sin estilos ni scripts en línea, sin orígenes externos. Se puede asignar estilos por CSSOM desde JS.
- Los colores, tamaños y duraciones se cambian en `design/tokens.json` y se regenera con `npm run tokens`.
</design_system>

<como_evitarlo>
Errores típicos de productos hechos por agentes y la regla comprobable que los evita. Las fuentes se verificaron el 2026-11-04 (todas respondieron HTTP 200); cada regla dice con qué se mide aquí. Ninguna de estas cifras se relaja para que una prueba pase.

| Anti-patrón | Regla comprobable | Se mide con | Fuente |
|---|---|---|---|
| Texto gris sobre gris, bajo contraste | Texto ≥ 4.5:1; texto grande (≥ 24 px, o ≥ 18.66 px en negrita) ≥ 3:1 | `contrast.mjs` (todos los estados), `axe.mjs`, `critique.mjs` (`a11y-contrast`) | [WCAG 2.2 · 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum) |
| Iconos, bordes de campos y anillo de foco que no se ven | Componentes de interfaz y gráficos ≥ 3:1 contra lo adyacente | `axe.mjs`, crítico con capturas | [WCAG 2.2 · 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast) |
| Objetivos táctiles diminutos | Mínimo WCAG AA: 24×24 px CSS o espaciado equivalente (2.5.8). **Aquí el estándar es 44×44 px** para todo lo táctil y para la navegación también con puntero fino (criterio de Apple HIG; Fitts). Cita correcta: 2.5.5 (44 px) es AAA, no el mínimo | `e2e.mjs`, `rail.mjs`, `saved.mjs`, `ficha.mjs` | [WCAG 2.2 · 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html); [Apple HIG · Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility); [Fitts](https://lawsofux.com/fittss-law/) |
| Foco invisible (`outline: none`) o tapado por una barra fija | Foco siempre visible (2.4.7) y nunca oculto del todo (2.4.11); ideal perímetro ≥ 2 px y 3:1 (2.4.13, AAA). Se comprueba con Tab real, no con `focus()` | `e2e.mjs` (Tab en menú), `rail.mjs` (24 paradas), `ficha.mjs` | [WCAG 2.2 · 2.4.7](https://www.w3.org/TR/WCAG22/#focus-visible), [2.4.11](https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum), [2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) |
| Acciones sin respuesta; pantallas sin estado de carga, vacío o error | Toda acción responde en < 400 ms con algo visible (Doherty) e INP ≤ 200 ms; cada región asíncrona reserva su forma (esqueletos del tamaño final) y tiene estado vacío y de error con salida (reintentar, WhatsApp); los avisos llevan `role="status"` o `alert` | `inp.mjs` (CPU 4×), `skeleton.mjs`, `explorer.mjs` (red lenta), revisión manual del vacío y el error | [Doherty](https://lawsofux.com/doherty-threshold/); [web.dev INP](https://web.dev/articles/inp); [NN/g #1](https://www.nngroup.com/articles/ten-usability-heuristics/); [WCAG 4.1.3](https://www.w3.org/TR/WCAG22/#status-messages) |
| Errores de formulario solo con color o en un aviso que desaparece | El error se anuncia (`aria-live`/`role`), dice el problema y la salida en lenguaje llano, no depende solo del color; en formularios largos, resumen arriba con foco y «Error:» en el título | revisión manual + `axe.mjs` | [GOV.UK · Validation](https://design-system.service.gov.uk/patterns/validation/); [NN/g #9](https://www.nngroup.com/articles/ten-usability-heuristics/) |
| Carga lenta, saltos de diseño | LCP ≤ 2.5 s y CLS ≤ 0.1 en el p75 de campo (aquí: CLS ≤ 0.05 y LCP ≤ 3.5 s con CPU 4× y 4G lenta, criterio R01); toda imagen con `width` y `height` | `e2e.mjs`, `skeleton.mjs`, perfil CDP | [web.dev · Core Web Vitals](https://web.dev/articles/vitals) |
| Animación forzada | Con `prefers-reduced-motion: reduce` no queda ninguna transición ni animación (salvo el progreso ligado al scroll); las duraciones salen de los tokens | `motion.mjs` (pasada de movimiento reducido) | [WCAG 2.3.3](https://www.w3.org/TR/WCAG22/#animation-from-interactions); [MDN · prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) |
| `div` clicables, ARIA inventado, widgets sin teclado | HTML nativo primero (`<button>`, `<dialog>`, `<details>`, `inert`); «No ARIA is better than Bad ARIA»; cada widget sigue la tabla de teclado del patrón APG (Tab, flechas, Enter, Esc); el nombre accesible contiene el texto visible (2.5.3) | `axe.mjs` (sin violaciones serias ni críticas en los estados principales), `explorer.mjs`, `saved.mjs`, `e2e.mjs` | [APG · Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/); [WCAG 2.5.3](https://www.w3.org/TR/WCAG22/#label-in-name) |
| Jerarquía plana, sobrecarga de opciones | Una sola acción primaria por pantalla; ≤ 7 elementos por grupo de navegación; quitar lo irrelevante | `critique.mjs` (`law-hick`, `law-miller`, `law-restorff`), crítico | [Hick](https://lawsofux.com/hicks-law/); [NN/g #8](https://www.nngroup.com/articles/ten-usability-heuristics/) |
| Patrones inventados donde hay convenciones | Usar lo que la gente ya conoce: diálogo nativo, hoja inferior, barra de pestañas, acordeón | crítico (Jakob) | [Jakob](https://lawsofux.com/jakobs-law/); [GOV.UK Design System](https://design-system.service.gov.uk/) |
| Errores que se podían prevenir | Valores por defecto, restricciones y confirmación en acciones destructivas | revisión manual | [NN/g #5](https://www.nngroup.com/articles/ten-usability-heuristics/) |

Catálogo de fuentes (citas, licencias y lo que no se pudo verificar): `docs/ux/FUENTES.md`. Esta tabla manda si difieren.

Herramientas: además del arnés propio, `axe.mjs` corre axe-core (WCAG 2.x A/AA y buenas prácticas) en inicio, manifiesto revelado, menú con acordeón, Explorar, ficha, Mi lista y catálogo en línea. Lighthouse no está instalado: LCP, CLS e INP se miden por CDP (`e2e.mjs`, `inp.mjs`).
</como_evitarlo>

<tools>
Verificación (todas aceptan una URL y salen con código ≠ 0 si fallan):
- `npm test` (regresión completa), `npm run test:design`, `node scripts/critique.mjs` (reglas de diseño con ratchet en `design/baseline.json`; nunca subir un conteo).
- Vista previa: `PORT=<puerto> node tools/preview-site.mjs` (sirve el sitio con la CSP de producción; deténla al terminar).
- Arnés de Chromium en `tools/qa/` (ver `tools/qa/README.md`): `contrast.mjs`, `skeleton.mjs`, `motion.mjs`, `spacing.mjs`, `rail.mjs`, `saved.mjs`, `explorer.mjs`, `e2e.mjs`, `strip.mjs` (capturas móviles), `palette.py`/`oklch.py` (croma de las fotos frente a la paleta), `axe.mjs` (axe-core en los estados principales).
Cada agente usa su propio puerto (ver su spec) para no chocar con los demás.
</tools>

<known_baseline_findings date="2026-11-01">
Medidos antes de empezar el bucle; sirven de punto de partida, no de lista cerrada:
1. Contraste: el autor de las portadas (`.cover-author`, color `--cover-ink-dim`) mide 4.06:1 sobre la parada más clara del degradado (mínimo 4.5:1). 24 portadas afectadas.
2. Esqueletos: la tarjeta real del carrusel mide 164×329 en móvil y el esqueleto 164×294 (210×379 vs 210×363 en escritorio): el carrusel salta 58 px al cargar y produce CLS 0.051 (máximo 0.02). En escritorio el esqueleto del catálogo ya no está al medir (0 esqueletos antes de las 24 tarjetas): comprobar si el catálogo arranca antes de lo debido.
3. Las portadas tipográficas de una misma colección salen casi del mismo marrón: el catálogo se siente repetitivo y poco «social».
4. Movil: el hero tiene un velo claro que baja la foto; el texto de entrada sobre la foto puede quedar con poco contraste.
5. `critique.mjs` mantiene un aviso abierto: interlineado 1.03 del manifiesto.
6. La cabecera móvil no se parece a un perfil; Cartelera es una lista de tarjetas, no «publicaciones»; no existe el módulo Novedades.
7. Los desplegables funcionan, pero no hay una revisión sistemática de foco, orden de tabulación, `aria-expanded`, cierre con Escape/atrás y fugas de bloqueo de scroll entre menú, ficha, Mi lista y Explorar.
</known_baseline_findings>

<safety>
Considera la reversibilidad de cada acción. Puedes editar archivos y ejecutar pruebas (acciones locales y reversibles). **No hagas**, y pregunta antes si crees que hace falta: `git commit`, `git push`, `git reset --hard`, borrar carpetas, tocar `_archive/`, `worker/`, `src/`, `data/`, `design-system/`, desplegar (`wrangler deploy`, `firebase deploy`), usar secretos, o instalar dependencias. Si te topas con un obstáculo no uses un atajo destructivo ni saltes los controles (por ejemplo, no cambies una prueba para que pase: arregla la causa o repórtala). El humano hace los commits.
</safety>

<state_protocol>
El trabajo dura varias rondas y varias ventanas de contexto. Usa archivos para no perder el hilo:
- `.tmp-audit/agentes/tests.json`: estado de cada criterio de `docs/agentes/rubrica.json` (`pending|failing|passing`, con evidencia breve). Es JSON porque tiene un esquema. Nunca borres ni relajes un criterio para que «pase».
- `.tmp-audit/agentes/progress.md`: notas libres por ronda y por agente (qué se hizo, qué se intentó y falló, qué sigue). Añade al final; no reescribas lo ajeno.
- `.tmp-audit/agentes/defects.json`: defectos abiertos, con `id`, `severidad` (alta|media|baja), `criterio`, `dueño`, `evidencia`, `intentos`.
La carpeta `.tmp-audit/` está ignorada por git: es estado efímero. Los archivos temporales que crees fuera de ahí, elimínalos al terminar.
</state_protocol>

<working_style>
- Investiga antes de afirmar: nunca hables de código que no hayas abierto ni des por cierto un resultado que no hayas medido.
- Por defecto actúa: implementa en lugar de solo sugerir; si falta un dato, descúbrelo con herramientas en lugar de adivinar.
- Cambios mínimos y generales: no refactorices ni añadas configurabilidad que no se pida; no codifiques valores para que pase una prueba; resuelve la causa, no el síntoma.
- Llama en paralelo a las herramientas independientes (leer varios archivos, correr varias comprobaciones); en secuencia las que dependen unas de otras.
- Antes de decir «listo»: vuelve a correr las comprobaciones de tu área y las pruebas del repositorio, y revisa tu propio diff buscando regresiones en escritorio, móvil y movimiento reducido.
- No te detengas por presupuesto de contexto: guarda estado en los archivos y continúa. Termina la tarea completa.
</working_style>

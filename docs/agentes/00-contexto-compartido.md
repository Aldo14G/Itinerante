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
- Paleta tomada de las paredes del local, apagada: campos de color a ancho completo con croma OKLCH ≤ 0.085 (los muros de las fotos miden 0.02–0.085); acentos pequeños hasta 0.105. Tonos por sección: `data-tone="light|sand|brick"`.
- Ritmo vertical: `--sec-sm` y `--sec-md` (48/96 px en móvil, 64/128 en escritorio). Cuadrícula de 4 px. Nada de `clamp(...vh)` para rellenos de sección.
- Movimiento: duraciones solo de los tokens (`--dur-instant` 120, `--dur-fast` 240, `--dur-base` 400, `--dur-slow` 700, `--dur-scene` 1200 ms); en JS, `motion.js`. Con `prefers-reduced-motion: reduce` no queda ninguna transición ni animación (regla general al final de `style.css`).
- CSP estricta: sin estilos ni scripts en línea, sin orígenes externos. Se puede asignar estilos por CSSOM desde JS.
- Los colores, tamaños y duraciones se cambian en `design/tokens.json` y se regenera con `npm run tokens`.
</design_system>

<tools>
Verificación (todas aceptan una URL y salen con código ≠ 0 si fallan):
- `npm test` (regresión completa), `npm run test:design`, `node scripts/critique.mjs` (reglas de diseño con ratchet en `design/baseline.json`; nunca subir un conteo).
- Vista previa: `PORT=<puerto> node tools/preview-site.mjs` (sirve el sitio con la CSP de producción; deténla al terminar).
- Arnés de Chromium en `tools/qa/` (ver `tools/qa/README.md`): `contrast.mjs`, `skeleton.mjs`, `motion.mjs`, `spacing.mjs`, `rail.mjs`, `saved.mjs`, `explorer.mjs`, `e2e.mjs`, `strip.mjs` (capturas móviles), `palette.py`/`oklch.py` (croma de paredes).
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

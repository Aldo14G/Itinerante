---
name: autocorregir
description: Loop de autocorrección de diseño para Librería Itinerante. Mide tokens, accesibilidad, movimiento, copy/verdad y leyes UX con `npm run critique`, corrige por rondas con un commit por ronda y revierte si algo empeora. Úsalo cuando pidan autocorregir, criticar el diseño o revisar tokens, colores, textos o animaciones.
---

# /autocorregir

Loop de crítica y corrección sobre **B.4** (`prototypes/itinerante-b4`) y el **sitio raíz** (`index.html` + `assets/css/higgsfield-site.css`). No hace falta que la persona señale cada detalle: tú mides, corriges y verificas.

## Piezas

- `design/tokens.json`: fuente de verdad (escalas compartidas + temas `b4` y `root`). `npm run tokens` genera `prototypes/itinerante-b4/tokens.css`; el tema `root` solo se verifica.
- `scripts/critique.mjs` (`npm run critique`, `npm run critique:static`): reglas deterministas, informe en `design/report.json`. Las de severidad **error** no pueden superar `design/baseline.json` (ratchet: solo baja). Las **warn** son críticas a revisar.
- Familias: `tokens` (color, escala tipográfica, cuadrícula de 4 px, radios, duraciones), `a11y` (contraste AA, objetivos 44/24 px, nombres, foco, h1, 12 px mínimo, desborde, consola), `motion` (≤1.2 s, sin animar layout, `prefers-reduced-motion`), `copy` (verdad comercial, rótulos Foto real / Recreación IA, repeticiones, medida), `law` (Hick, Miller, Von Restorff, interlineado).

## Reglas de seguridad (no negociables)

- **Verdad:** no inventes precios, existencias, fechas, reseñas, cifras ni citas. Imágenes IA rotuladas «Recreación IA», fotos oficiales «Foto real».
- **Datos protegidos:** horario (lun–sáb 11:00–20:00, domingo cerrado), dirección (Mariano Matamoros Pte. 421), WhatsApp 528180875940, rótulos de procedencia y `assets/provenance.json`.
- Nunca `git push`, deploy, `--no-verify` ni editar `main`. Trabaja en la rama actual.
- Los colores de marca de `tokens.json` solo cambian si lo exige un contraste medido; di cuál y por qué.
- Si una corrección exige una decisión de dirección (quitar una sección, cambiar la paleta), no la tomes: repórtala.

## Ronda (máximo 5)

1. **Preflight (solo la primera vez):** árbol limpio, rama distinta de `main`, `npm run tokens:check`.
2. **Medir:** `npm run critique -- --surface b4` (y `root`). Lee `design/report.json`; ordena por familia: a11y → tokens → motion → copy → law.
3. **Elegir un lote coherente** (≤ 30 hallazgos, una causa común): por ejemplo, «todos los radios de 3 px a `--radius-2`», «duraciones de 0.3 s a `--dur-fast`», «tamaños de texto a `--fs-*`».
   - Para un valor que falta en las escalas, agrégalo a `design/tokens.json` primero y corre `npm run tokens`.
   - Cada sustitución debe conservar el aspecto: elige el token más cercano; si el salto es visible, registra por qué.
4. **Crítica visual (una vez por ronda):** captura escritorio 1440×900 y móvil 390×844 de lo tocado (CDP o navegador integrado), mira las imágenes y critica color, estilo, animación y texto como director de diseño. Anota hallazgos que las reglas no miden; arregla los que estén dentro de las reglas de seguridad.
5. **Verificar:** `node --test prototypes/itinerante-b4/check.mjs`, `node --test tests/critique.test.mjs`, `npm test` (hoy falla 1 prueba previa que depende de `_archive/`; no cuenta como regresión), y vuelve a correr `npm run critique`.
6. **Decidir:**
   - Si una regla *error* subió, una prueba nueva falla o la captura se ve rota → revierte la ronda (`git checkout -- .` de lo que tocaste) y prueba un lote más pequeño.
   - Si todo baja o se mantiene → `node scripts/critique.mjs --update-baseline` (solo si bajó), y **un commit por ronda**: `fix(design): ronda N · <causa común>` con el recuento antes/después en el cuerpo.
7. **Parar** cuando: una ronda no mejora nada, se llegó a 5 rondas, o quedan solo hallazgos que requieren decisión humana.

## Cierre

Entrega una tabla antes/después por regla y superficie, los commits de las rondas, lo que quedó y por qué (decisión humana, riesgo visual o fuera de reglas), y las críticas visuales que no son medibles. Pregunta solo por decisiones que cambian la dirección.

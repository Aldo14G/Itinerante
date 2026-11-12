# Fuentes oficiales de UX/UI para agentes (4 nov 2026)

Este archivo es el **catálogo de fuentes** (qué dice cada una, cita, licencia y qué no se pudo verificar). Las **reglas operativas de este repositorio**, con la herramienta que las mide, viven en la tabla «cómo evitarlo» de `docs/agentes/00-contexto-compartido.md` y en `docs/agentes/rubrica.json`; si algo aquí y allá difiere, manda el contexto compartido.

Verificado: todas las URL respondieron HTTP 200 con curl el 4 nov 2026. Las citas entre comillas se extrajeron del HTML (o del JSON oficial, en el caso de Apple) en esa misma corrida. Si una regla no trae cita textual, se marca como **[sin cita textual]**. No inventé ningún umbral.

## 1. W3C WCAG 2.2 (norma W3C Recommendation; licencia W3C Document License, se puede citar)
https://www.w3.org/TR/WCAG22/ · Cubre la accesibilidad web medible y es la base legal de muchas normas.
- Evitar texto gris sobre gris → texto normal ≥ 4.5:1 y texto grande ≥ 3:1. Cita de 1.4.3 Contrast (Minimum): "contrast ratio of at least 4.5:1".
- Evitar iconos, bordes de inputs y foco poco visibles → componentes de UI y gráficos con contraste ≥ 3:1. Cita de 1.4.11 Non-text Contrast: "at least 3:1 against adjacent color(s)".
- Evitar objetivos táctiles diminutos → mínimo 24×24 px CSS o el espaciado equivalente. Ver 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Evitar foco invisible → indicador con área ≥ un perímetro de 2 px CSS y contraste ≥ 3:1 entre el estado con foco y sin foco. Es 2.4.13 Focus Appearance, nivel AAA (https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html). En nivel AA aplican 2.4.7 Focus Visible y 2.4.11 Focus Not Obscured.
- Evitar animación forzada → "Motion animation triggered by interaction can be disabled" (2.3.3, AAA). Se implementa con `prefers-reduced-motion` (MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).
- Evitar toasts mudos → "status messages can be programmatically determined through role or properties" (4.1.3 Status Messages). Prueba: `role="status"` (cortés, no interrumpe) para avisos de rutina como «Guardado en tu lista»; `role="alert"` solo para mensajes urgentes, porque interrumpe lo que el lector de pantalla está leyendo.

## 2. WAI-ARIA Authoring Practices Guide (W3C)
https://www.w3.org/WAI/ARIA/apg/ · Cubre los patrones de teclado y ARIA de widgets: diálogo, tabs, menú, combobox.
- Evitar ARIA decorativo o incorrecto → HTML nativo primero. Cita de Read Me First (https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/): "No ARIA is better than Bad ARIA".
- Evitar modales, tabs o menús que no se operan con teclado → seguir la tabla "Keyboard Interaction" de cada patrón. Prueba: recorrer la tabla completa de teclado del patrón (no solo Tab, flechas, Enter y Esc: también Espacio, Inicio/Fin y las teclas propias de cada patrón) y comprobar cada fila; aquí se hace con Tab real, no con `focus()`.

## 3. Nielsen Norman Group: 10 heurísticas
https://www.nngroup.com/articles/ten-usability-heuristics/ · Cubre la evaluación heurística. Uso: © NN/g; se puede citar y enlazar, pero no copiar entero (hay pósters gratuitos con licencia propia).
- Evitar acciones sin respuesta → #1 Visibility of System Status: "appropriate feedback within a reasonable amount of time". Prueba: cada acción muestra un estado de carga, éxito o error.
- Evitar errores que se podían prevenir → #5 Error Prevention: restricciones, valores por defecto y confirmación en acciones destructivas.
- Evitar el relleno → #8 Aesthetic and Minimalist Design: "should not contain information that is irrelevant or rarely needed".
- Evitar mensajes de error crípticos → #9: lenguaje llano que diga el problema y la solución.

## 4. Laws of UX (Jon Yablonski)
https://lawsofux.com/ · Cubre principios psicológicos (30 leyes). Uso: © del autor; se cita con enlace.
- Evitar esperas sin feedback → mostrar una respuesta visible (esqueleto, estado, progreso) antes de 400 ms, aunque la operación tarde más en completarse. Cita de https://lawsofux.com/doherty-threshold/: "Provide system feedback within 400 ms".
- Evitar menús con demasiadas opciones → Hick (https://lawsofux.com/hicks-law/): "decision increases with the number and complexity of choices". Prueba: una acción primaria por pantalla.
- Evitar botones pequeños o lejanos → Fitts (https://lawsofux.com/fittss-law/): "Touch targets should be large enough… ample spacing". El umbral se toma de WCAG o Apple.
- Evitar patrones inventados → Jakob (https://lawsofux.com/jakobs-law/): usar convenciones conocidas.

## 5. Apple Human Interface Guidelines: Accessibility
https://developer.apple.com/design/human-interface-guidelines/accessibility (la página se renderiza con JS; la verifiqué en el JSON oficial `developer.apple.com/tutorials/data/design/human-interface-guidelines/accessibility.json`). Uso: © Apple, solo referencia.
- Evitar controles pequeños en iOS → tamaño por defecto 44×44 pt y mínimo 28×28 pt (tabla de tamaños de control).
- Evitar contraste bajo → 4.5:1 en texto (tabla de contraste, con 18 pt como límite de texto grande).
- Evitar ignorar Reduce Motion → respetar el ajuste del sistema **[sección Motion; sin cita textual extraída]**.

## 6. Material Design 3
https://m3.material.io/foundations/designing/structure · Cubre layout, componentes y tokens de Android y web. La página carga por JS y el texto no salió con curl: **no verifiqué el umbral de 48 dp**. Antes de citarlo hay que abrirlo en el navegador.

## 7. GOV.UK Design System
https://design-system.service.gov.uk/ · Cubre patrones probados con usuarios reales. Licencia: código MIT y contenido Open Government Licence v3.0.
- Evitar errores que el usuario no ve → poner un Error summary arriba y mover el foco a él. Cita de https://design-system.service.gov.uk/patterns/validation/: "show an Error summary component at the top of the page, and move keyboard focus to it".
- Evitar que el lector de pantalla no anuncie el error → "add 'Error: ' to the beginning of the page <title>".
- Evitar validar antes de tiempo → validar al enviar (mismo patrón) **[sin cita textual extraída]**.

## 8. GOV.UK Service Manual
https://www.gov.uk/service-manual · Cubre el proceso: investigación, accesibilidad y evaluación. Licencia OGL v3.0.
- Evitar lanzar sin probar con usuarios ni revisar accesibilidad → seguir "Accessibility and assisted digital" y publicar una declaración de accesibilidad.

## 9. U.S. Web Design System (USWDS)
https://designsystem.digital.gov/ · Cubre componentes accesibles. Es dominio público (gobierno de EE. UU.).
- Evitar alertas puramente visuales → componente Alert con su guía de accesibilidad (https://designsystem.digital.gov/components/alert/) **[detalle de role no extraído con claridad; revisar la sección Accessibility]**.

## 10. web.dev: Core Web Vitals (Google)
https://web.dev/articles/vitals · Cubre el rendimiento percibido. Licencia: contenido CC BY 4.0 y código Apache 2.0.
- Evitar una carga lenta → "LCP should occur within 2.5 seconds".
- Evitar clics que tardan en responder → "INP of 200 milliseconds or less" (https://web.dev/articles/inp).
- Evitar saltos de layout (imágenes sin tamaño, banners inyectados) → "CLS of 0.1 or less".
- Prueba: el percentil 75 de usuarios reales (CrUX u otra fuente de campo). Lighthouse y el arnés propio (`tools/qa/e2e.mjs`, `inp.mjs`) son diagnósticos de laboratorio: una corrida en verde no demuestra el p75 de campo.

## 11. MDN: prefers-reduced-motion
https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion · Implementación de referencia. Licencia CC BY-SA 2.5.
- Evitar animación sin alternativa → envolver la animación no esencial en `@media (prefers-reduced-motion: reduce)` o desactivarla ahí.

## 12. Baymard Institute (parcial)
https://baymard.com/blog · Cubre e-commerce y checkout. Tiene más de 450 artículos gratuitos; el benchmark completo es de pago (no lo usé). Solo aplica a tiendas o formularios largos.

## 13. Refactoring UI (Adam Wathan y Steve Schoger, fuente de los autores)
https://www.refactoringui.com/ · Cubre la jerarquía visual práctica. El libro es de pago y no lo abrí, así que no saco reglas de ahí. Solo la cito como lectura recomendada **[sin reglas citadas]**.

## 14. Impeccable (Paul Bakaus)
https://github.com/pbakaus/impeccable · Skill de diseño para agentes: piso de oficio, pulido, composición, tipografía, auditoría y crítica. Licencia Apache 2.0. Leída el 11 nov 2026 (versión 4.8.2).
- Evitar la página «armada» en vez de construida → tematizar selección, cursor, barras de desplazamiento, foco y subrayados desde la paleta (referencia `craft-floor`, «Browser surfaces»).
- Evitar la jerarquía por adorno → nada de ceja sobre el titular, texto con degradado ni tarjetas idénticas como estructura (`craft-floor`, «Refuse»).
- Evitar pulir a ciegas → comprobar el render en los tamaños reales y clasificar cada desviación (token faltante, implementación suelta, desajuste de concepto, defecto local) antes de corregir (`polish`).
- Las reglas que se aplican en este repositorio están en el bloque «piso de oficio» de `docs/agentes/00-contexto-compartido.md`.

---

## Anti-patrones comunes de productos hechos por agentes
| Anti-patrón | Regla comprobable | Fuente |
|---|---|---|
| Contraste bajo / gris sobre gris | Texto ≥ 4.5:1 (≥ 3:1 en grande); UI ≥ 3:1 | WCAG 1.4.3 y 1.4.11; Apple HIG |
| Objetivos táctiles pequeños | Piso WCAG AA: ≥ 24×24 px CSS (2.5.8). **Estándar de este repositorio: 44×44 px** en todo lo táctil y en la navegación también con puntero fino (Apple HIG) | WCAG 2.5.8; Apple HIG; Fitts |
| Foco invisible (`outline:none`) | Foco visible; ideal ≥ 2 px de perímetro y 3:1 | WCAG 2.4.7 y 2.4.13 |
| Sin estados de carga, vacío o error | Respuesta visible antes de 400 ms (aunque la tarea siga) e INP ≤ 200 ms; cada región asíncrona reserva su forma (esqueleto del tamaño final); estado vacío que distingue «sin datos» de «sin resultados» y ofrece una salida (limpiar filtros, reintentar, WhatsApp); estado de error que dice el problema y la salida | NN/g #1; Doherty; web.dev; WCAG 4.1.3 |
| Errores de formulario solo en color o en un toast | Error summary con foco + "Error:" en el title + role de estado | GOV.UK validation; WCAG 4.1.3 |
| Jerarquía plana / todo igual de fuerte / todo centrado | Una acción primaria por pantalla; quitar lo irrelevante | NN/g #8; Hick; Von Restorff (lawsofux) **[centrar no tiene umbral oficial]** |
| Sobrecarga de opciones | Reducir y agrupar las opciones visibles | Hick; NN/g #8 |
| Animación sin reduced-motion | Respetar `prefers-reduced-motion` | WCAG 2.3.3; MDN; Apple HIG |
| ARIA inventado en divs clicables | HTML nativo y patrones APG | APG "No ARIA is better than Bad ARIA" |
| Layout que salta al cargar | CLS ≤ 0.1; width y height en las imágenes | web.dev |
| Widgets nuevos donde hay convenciones | Usar patrones conocidos | Jakob; GOV.UK y USWDS |

## Cómo se aplica aquí (y qué no cubre todavía)

La skill de este repositorio es `/autocorregir` (`npm run critique`): mide tokens, contraste de texto, movimiento, copy y leyes de UX, y revierte si algo empeora. Lo que ya cubre con medición: contraste 4.5:1 (`a11y-contrast`), Hick, Miller, Von Restorff, duraciones de tokens. Lo que se cubre con el arnés de Chromium (`tools/qa/`): foco con Tab real, objetivos de 44 px, esqueletos, INP con CPU 4×, LCP y CLS por CDP, movimiento reducido y axe-core (`axe.mjs`). Lo que sigue sin medición automática y se revisa a mano o con el crítico: lector de pantalla real, dispositivo y red reales, estados vacío y de error (criterio A03 de la rúbrica), validación de formularios (GOV.UK) y convenciones por plataforma.

## Qué no pude abrir o verificar
- Material 3: respondió 200, pero el contenido se carga por JS; no verifiqué el umbral de 48 dp.
- Apple HIG: el HTML es JS; la verifiqué en su JSON oficial.
- Refactoring UI y Baymard benchmark: son de pago; no los abrí.
- USWDS Alert: la página abrió, pero no extraje una regla textual.

## MotionSites Web Builder (skill de Claude; instrucciones, referencias y scripts bajo licencia MIT)
https://github.com/Motionsites-AI/claude-skill · Revisado el 12 nov 2026 a pedido de Aldo. Se adoptó: la revisión «mira y corrige» (capturar, puntuar diez criterios, corregir los tres más bajos con valores y repetir; vara: promedio ≥ 8 y nada < 7), los bloqueantes (destello al cargar, fuentes sin cargar, imágenes rotas, desborde) y la regla de que el fondo del lienzo sea el del borde de la imagen. Vive en `docs/agentes/rubrica-visual.md` y `tools/qa/controles.mjs`. No se adoptó: los ejemplos y la repisa de medios (licencia aparte), librerías por CDN, vidrio, video de fondo, tipografías de su catálogo ni su bloque promocional, porque chocan con la CSP, los tokens o `PRODUCT.md`.

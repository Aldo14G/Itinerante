# Auditoría UX/UI de Librería Itinerante y Más

> Seguimiento del 26 de agosto de 2026: la bifurcacion de superficies quedo
> resuelta. `index.html` es la unica interfaz oficial; la home y el catalogo
> Next, `catalogo.html`, sus componentes y sus copias de assets fueron
> retirados. Los hallazgos que los mencionan abajo conservan valor historico y
> no son instrucciones para restaurarlos.

> Implementación P0 completada el 24 de agosto de 2026: portada reducida a seis secciones, conversión principal limitada a tres accesos de WhatsApp, carrusel de agenda manual, prueba social enlazada a su fuente y módulos no verificados retirados de la experiencia publicada. Seguimiento del 25 de agosto: 39 pruebas, SDK/herramientas Data Connect y build Next pasan; la verificación visual en navegador y la prueba end-to-end con datos reales siguen pendientes.

Fecha: 24 de agosto de 2026  
Alcance: `index.html` como superficie publicada, `catalogo.html`, la implementación paralela en `src/app/` y sus contratos de diseño y ejecución.  
Método: revisión de código y arquitectura con Impeccable, contraste con UI UX Pro Max, detector mecánico, suite de regresión y build. La inspección visual en navegador quedó pendiente porque no había un navegador conectado en esta sesión; no se califican capturas que no se observaron.

## Veredicto de integridad

**No pasa.** La interfaz expresa una identidad cromática reconocible, pero no un producto único y confiable. La publicación real es el HTML estático servido desde la raíz de Firebase, mientras existe una segunda home en Next.js con otra jerarquía. Además, varias superficies demostrativas se presentaban como funcionalidad o evidencia real: la antigua recomendación estática no consultaba IA, las reseñas nuevas sólo vivían en `localStorage`, había precios y afinidades inventados, y las secciones de prensa y aliados contenían enlaces y nombres placeholder.

El principal problema visual es consecuencia de esa falta de edición: demasiadas señales compiten por atención y cada módulo intenta demostrar una capacidad distinta. La mejora no debe comenzar agregando otro framework o una nueva capa de efectos. Debe comenzar eliminando lo provisional, definiendo una sola superficie canónica y reduciendo la narrativa a los cuatro pilares y dos acciones de conversión.

## Salud de la interfaz

| # | Dimensión | Puntaje | Hallazgo principal |
|---|---|---:|---|
| 1 | Accesibilidad | 2/4 | Hay semántica y estados de foco, pero los diálogos no gestionan foco y varios controles no alcanzan el mínimo de 44 px del proyecto. |
| 2 | Rendimiento | 2/4 | Buenos formatos de imagen y carga diferida, contrarrestados por un HTML monolítico, marquee infinito, blurs y transiciones de layout. |
| 3 | Responsive | 3/4 | La base es mobile-first y usa rails con scroll-snap; faltan capturas reales y corregir targets de 36–42 px. |
| 4 | Theming | 2/4 | Existen tokens y modo oscuro, pero 44 estilos inline, 23 hexadecimales únicos en CSS y dos sistemas paralelos provocan deriva. |
| 5 | Integridad de implementación | 1/4 | Contenido demo se comunica como real y la arquitectura estática/Next no tiene un dueño único. |
| **Total** |  | **10/20** | **Aceptable en estructura técnica; requiere trabajo significativo antes de presentarse como producto final.** |

Se identificaron **13 hallazgos**: 2 P0, 6 P1, 4 P2 y 1 P3.

## Resumen ejecutivo

1. La estética se siente genérica y saturada porque hay demasiados módulos, pills, gradientes, sombras, carruseles y CTAs compitiendo entre sí.
2. El producto publicado promete más de lo que realmente ejecuta. Esto es más grave que la falta de refinamiento visual.
3. La conversión por WhatsApp está sobrerrepresentada: 11 enlaces reducen la jerarquía en lugar de reforzarla.
4. La home estática y la home Next duplican decisiones. Firebase sigue publicando `index.html`; el build Next y el script `preview` ya funcionan, pero no resuelven la duplicidad ni convierten el prototipo en producción.
5. El sistema de diseño correcto ya existe. Conviene conservar la paleta teal, papel y ámbar, pero reemplazar la gramática de “UI generada” por una dirección editorial barrial más sobria y fotográfica.

## Hallazgos priorizados

### [P0] La experiencia de IA publicada simulaba resultados personalizados

- **Ubicación:** `index.html:3335-3418`.
- **Categoría:** Integridad de implementación / confianza.
- **Evidencia:** el flujo muestra un loader, ignora el contenido útil de `userQuery`, toma siempre `BOOKS.slice(0, 3)` y asigna porcentajes y racionales fijos. No llama al endpoint Genkit existente en la implementación Next.
- **Impacto:** una persona cree recibir una recomendación personalizada y puede tomar una decisión de compra basada en una simulación no declarada.
- **Estándar:** verdad de producto; las acciones y estados deben comunicar lo que realmente ocurre.
- **Recomendación:** retirar el disparador de IA de producción hasta conectar el flujo real. Como fallback, ofrecer “Pedir recomendación humana por WhatsApp” o etiquetar explícitamente la experiencia como demo sin porcentajes de afinidad.
- **Comando sugerido:** `$impeccable clarify`.

### [P0] Datos demostrativos se presentan como catálogo, comunidad y prueba social reales

- **Ubicación:** `index.html:2259-2265`, `index.html:2378-2407`, `index.html:2504-2624`, `index.html:2637-2769`, `index.html:3010-3089`, `catalogo.html:903-1022` y `catalogo.html:1231-1373`.
- **Categoría:** Integridad de implementación / contenido.
- **Evidencia:** precios y ratings inventados para categorías que se muestran como obras; “inscripciones abiertas” y “cupo limitado” sin fuente; tres notas de prensa con `href="#"`; aliados genéricos con `href="#"`; reseñas iniciales no trazables; publicación y votos de nuevas reseñas sólo en `localStorage`.
- **Impacto:** erosiona confianza, puede crear expectativas comerciales falsas y hace que el sitio se sienta como plantilla aunque esté visualmente pulido.
- **Estándar:** `MASTER.md` y `home.md` prohíben inventar precios, inventario, fechas y promesas.
- **Recomendación:** conservar sólo evidencia verificable. Cambiar categorías a “rutas de lectura” sin precio/rating, ocultar prensa y aliados hasta contar con fuentes reales, y etiquetar las reseñas locales como borradores privados o conectarlas a la base real antes de decir “publicada”.
- **Comando sugerido:** `$impeccable harden`.

### [P1] La arquitectura de información diluye los cuatro pilares

- **Ubicación:** `index.html:2092-2890`.
- **Categoría:** UX / arquitectura de información.
- **Evidencia:** 10 secciones y 11 títulos de segundo nivel; prensa, aliados y boletín ocupan capítulos completos aunque no forman parte del recorrido principal definido en `home.md`.
- **Impacto:** el usuario pierde el arco “descubrir → confiar → consultar → visitar” y recibe módulos con el mismo peso visual.
- **Recomendación:** reducir la home a seis capítulos máximos: Hero, Experiencia/4 pilares, Agenda, Curaduría, Comunidad y Visita. Integrar FAQ en Visita y boletín en el footer. No publicar Prensa/Aliados sin evidencia real.
- **Comando sugerido:** `$impeccable distill`.

### [P1] Hay dos frontends sin una superficie canónica única

- **Ubicación:** `firebase.json:15`, `CONTEXT.md:16`, `docs/ARCHITECTURE_AND_CONTEXT.md:30-57`, `src/app/page.tsx` y `package.json`.
- **Categoría:** Integridad / mantenibilidad.
- **Evidencia:** Firebase publica la raíz estática y el contexto vigente mantiene HTML/CSS/JS como superficie canónica. El 25 de agosto `npm run build` pasó, pero Next continúa como prototipo paralelo sin Hosting/App Hosting ni backend end-to-end verificado.
- **Impacto:** cada corrección visual puede aplicarse a la superficie equivocada; aparecen diferencias de copy, CTA, tokens y comportamiento.
- **Recomendación:** mantener `index.html` como dueño de producción durante el rediseño. Tratar `src/app/` como prototipo hasta que exista una decisión explícita de migración, build verde, hosting compatible y backend real. No mantener dos homes activas.
- **Comando sugerido:** `$impeccable document`.

### [P1] La jerarquía de conversión compite consigo misma

- **Ubicación:** `index.html:2069-2083`, `index.html:2119-2129`, `index.html:2431-2489`, `index.html:2848-2859`, `index.html:2922-2927`; `src/components/Hero.tsx:37-64`.
- **Categoría:** UX / conversión.
- **Evidencia:** 11 enlaces de WhatsApp en la home estática; navbar con Catálogo, tema y WhatsApp; hero estático con dos CTA; hero Next con tres CTA equivalentes; botón flotante adicional.
- **Impacto:** la repetición excesiva hace que ninguna acción parezca prioritaria y aumenta ruido en móvil.
- **Recomendación:** una acción primaria estable —“Consultar y apartar por WhatsApp”— y una secundaria contextual —“Explorar la curaduría”—. Repetir la primaria sólo en navbar, después de prueba social y en Visita.
- **Comando sugerido:** `$impeccable clarify`.

### [P1] Los diálogos no cumplen un ciclo de foco completo

- **Ubicación:** `index.html:2933-3000`, `index.html:3314-3327`, `index.html:3470-3608`.
- **Categoría:** Accesibilidad.
- **Evidencia:** los contenedores tienen `role="dialog"` y Escape, pero no `aria-labelledby`; el lightbox no recibe foco; no hay focus trap ni restauración al control que abrió el modal.
- **Impacto:** usuarios de teclado o lector de pantalla pueden perder contexto o tabular hacia contenido oculto detrás del modal.
- **Estándar:** patrón de diálogo modal y orden de foco.
- **Recomendación:** nombrar cada diálogo, mover el foco al primer control, contenerlo mientras está abierto, marcar el fondo como inerte y devolver el foco al disparador al cerrar.
- **Comando sugerido:** `$impeccable harden`.

### [P1] Algunos targets táctiles incumplen el estándar del proyecto

- **Ubicación:** `index.html:162-175`, `index.html:270-281`, `index.html:1024`, `index.html:1076`.
- **Categoría:** Accesibilidad / responsive.
- **Evidencia:** toggle de tema de 36 × 36 px; chapter links de 40 px; otros controles de 40–42 px.
- **Impacto:** errores de toque y menor comodidad en pantallas pequeñas.
- **Estándar:** mínimo de 44 px definido en `MASTER.md`.
- **Recomendación:** ampliar el área interactiva real a 44–48 px sin inflar visualmente el icono.
- **Comando sugerido:** `$impeccable adapt`.

### [P1] El fallback de movimiento elimina también feedback útil

- **Ubicación:** `index.html:2043-2049`.
- **Categoría:** Accesibilidad / movimiento.
- **Evidencia:** el bloque global fuerza todas las animaciones y transiciones a `.01ms`.
- **Impacto:** evita movimiento, pero también borra cambios de estado que ayudan a entender interacción y jerarquía.
- **Recomendación:** desactivar sólo marquee, autoplay, reveal, rebote y desplazamiento suave; mantener feedback instantáneo de foco, hover y estado.
- **Comando sugerido:** `$impeccable animate`.

### [P2] La gramática visual acumula rasgos de plantilla generada

- **Ubicación:** CSS inline de `index.html`; hallazgos del detector en `index.html:415`, `index.html:1657` y el marquee de aliados.
- **Categoría:** Integridad visual.
- **Evidencia:** 16 gradientes, 27 sombras, 12 backdrop blurs, 9 declaraciones de animación, rebote, glow verde de WhatsApp y marquee perpetuo.
- **Impacto:** todo intenta verse “especial”; desaparecen jerarquía, materialidad editorial y sentido de lugar.
- **Recomendación:** reservar gradiente para el hero, blur para navbar y modal, y elevación para elementos realmente superpuestos. Convertir aliados en una lista manual o prueba comunitaria estática.
- **Comando sugerido:** `$impeccable quieter`.

### [P2] Los tokens existen, pero la implementación deriva de ellos

- **Ubicación:** `index.html:39-92`, estilos inline del documento y `src/styles/globals.css`.
- **Categoría:** Theming / sistema de diseño.
- **Evidencia:** 44 atributos `style`, 41 usos hexadecimales en CSS con 23 valores únicos y una segunda traducción de tokens en Tailwind.
- **Impacto:** mantener dark mode y coherencia de marca requiere corregir varias fuentes y favorece diferencias entre estático y Next.
- **Recomendación:** conservar los tokens canónicos teal/papel/ámbar; crear tokens de componente para CTA, bordes, radios y elevación; eliminar valores inline al tocar cada módulo.
- **Comando sugerido:** `$impeccable document`.

### [P2] La página monolítica encarece rendimiento y mantenimiento

- **Ubicación:** `index.html` completo, 148 KB; `catalogo.html`, 46 KB.
- **Categoría:** Rendimiento / mantenibilidad.
- **Evidencia:** CSS, datos y JavaScript viven dentro del documento; se anima `width` en dos lugares; hay `will-change` persistente y múltiples blurs.
- **Impacto:** aumenta el coste de revisión, dificulta cachear recursos y facilita regresiones cruzadas.
- **Recomendación:** después de definir la arquitectura visual, extraer sólo `css/site.css`, `js/site.js` y datos demo/producción claramente separados. No convertirlo en un framework nuevo por esta razón.
- **Comando sugerido:** `$impeccable optimize`.

### [P2 resuelto] La documentación de comandos no coincidía con el proyecto ejecutable

- **Ubicación:** `docs/ARCHITECTURE_AND_CONTEXT.md:134-142` y `package.json:6-16`.
- **Categoría:** Integridad / experiencia de desarrollo.
- **Evidencia:** el 25 de agosto se verificaron `npm run preview`, `npm test`, `npm run dataconnect:verify` y `npm run build`; los comandos y el lockfile ya están alineados.
- **Impacto:** resuelto para ejecución local. Sigue siendo necesario distinguir la portada estática publicada del prototipo Next.
- **Recomendación:** conservar esa distinción hasta definir Hosting/App Hosting y completar la prueba end-to-end.
- **Comando sugerido:** `$impeccable document`.

### [P3] La pareja tipográfica es correcta pero poco distintiva

- **Ubicación:** `index.html:30-36` y `MASTER.md`.
- **Categoría:** Tipografía.
- **Evidencia:** Playfair Display + Inter es legible y coherente, pero el detector marca Inter como una señal muy repetida en interfaces generadas.
- **Impacto:** contribuye a la sensación de plantilla, aunque no causa un problema funcional.
- **Recomendación:** no cambiar tipografías en el primer pase. Tras resolver verdad, jerarquía y fotografía, evaluar una sans con más carácter local y actualizar `MASTER.md` sólo si la mejora es demostrable.
- **Comando sugerido:** `$impeccable typeset`.

## Problemas sistémicos

- **Adición sin sustracción:** cada nueva capacidad recibe sección, CTA y efecto propios.
- **Demo y producción mezcladas:** los nombres de archivo indican demo, pero la UI comunica disponibilidad, ratings, reseñas y afinidad como si fueran datos reales.
- **Dos fuentes visuales:** HTML estático y React/Tailwind implementan la misma marca por separado.
- **Prueba estructural sin prueba de verdad:** las 31 pruebas validan que existan secciones, estilos y restricciones, pero no detectan si la promesa visible coincide con el comportamiento.
- **Diseño por componentes, no por recorrido:** la suma de tarjetas, carruseles, pills y modales no crea por sí sola una experiencia editorial.

## Hallazgos positivos que deben conservarse

- Las **31 pruebas de regresión pasan** y protegen CSP, assets, anchors, reduced motion, tokens y estructura crítica.
- La home tiene una base semántica razonable: un `h1`, títulos jerárquicos, labels de formulario, estados `aria-pressed`, Escape en modales y numerosos `:focus-visible`.
- La implementación es mobile-first, usa 17 media queries, scroll-snap y tamaños intrínsecos en imágenes.
- Los assets principales son locales, WebP y lazy-loaded bajo el fold.
- La paleta teal, papel y ámbar sí expresa una casa cultural cálida y puede sostener la nueva dirección.
- La separación conceptual entre navbar primaria y chapter nav es sólida.
- La credencial de Firebase encontrada en la raíz está ignorada por Git y por Hosting; no se inspeccionó ni se expuso su contenido.

## Dirección recomendada: Editorial barrial contemporánea

La librería no necesita parecer una app de Google ni una startup de IA. Debe sentirse como entrar a un espacio cultural del centro de Monterrey: papel, tinta, luz cálida, fotografía real, señalética precisa y una voz humana.

### Principios visuales

1. **Fotografía y contenido real antes que efectos.** Una imagen real potente vale más que tres gradientes y seis tarjetas.
2. **Composición editorial.** Alternar spreads amplios, columnas de lectura y una sola rail cultural; evitar tarjetas flotantes en cada sección.
3. **Una firma gráfica.** Usar la idea de ruta/carreta como línea, numeración o ritmo de capítulos, no como animación ornamental constante.
4. **Paleta disciplinada.** Papel como superficie dominante, teal oscuro para momentos editoriales, ámbar sólo para énfasis o rating verificado.
5. **Menos pills.** Reservarlas para estados y filtros, no para decorar subtítulos o cada CTA.
6. **Movimiento con intención.** Sin marquee, bounce ni glow. Transiciones de opacidad y transform de 180–300 ms; autoplay sólo cuando el contenido cambie y con control del usuario.

UI UX Pro Max recomienda para productos comunitarios mostrar actividad y prueba social pronto, usar contenido humano y mantener una incorporación sencilla. Se adopta esa estructura, pero **no** su paleta rosa ni el estilo “vibrant block-based”, porque chocan con los tokens y el carácter editorial ya acordados.

## Nueva arquitectura de la home

| Orden | Capítulo | Contenido | Acción |
|---:|---|---|---|
| 1 | Hero | Qué es Itinerante, Monterrey, promesa concreta y una fotografía o logo aprobado | Primaria: Consultar y apartar. Secundaria: Ver curaduría. |
| 2 | La experiencia | Los cuatro pilares en una composición editorial unificada, no cuatro cards equivalentes | Conocer la agenda o bajar a catálogo. |
| 3 | Agenda viva | Máximo 3 actividades con estado real y fecha sólo si está confirmada | Consultar actividad por WhatsApp. |
| 4 | Curaduría | Rutas de lectura o títulos reales; búsqueda y filtros compactos | Consultar disponibilidad. |
| 5 | Comunidad | 3–5 reseñas verificables y, sólo si existen, aliados reales dentro del mismo capítulo | Ver prueba original / escribir. |
| 6 | Visita | Dirección, horario confirmado, mapa, cómo funciona y FAQ compacta | Cómo llegar / WhatsApp. |
| — | Footer | Redes, datos legales y boletín de una sola línea | Suscripción secundaria. |

La chapter nav conserva sólo `Experiencia`, `Agenda`, `Libros` y `Visita`. Prensa no se publica hasta tener notas reales; Aliados no usa placeholders; FAQ deja de ser un capítulo visual autónomo; el boletín deja de competir con la conversión principal.

## Decisión de framework

**No agregar otro framework.** Para el primer rediseño, conservar la home estática que realmente sirve Firebase. Extraer CSS/JS únicamente cuando la nueva arquitectura quede estable.

Next.js, React, Tailwind, Radix y Framer Motion pueden convertirse en la plataforma canónica sólo cuando se cumplan juntos estos criterios:

- build reproducible;
- una sola home, sin duplicado estático;
- Hosting/App Hosting definido;
- Data Connect y Genkit reales conectados;
- fallback accesible y sin datos inventados;
- harness actualizado para la nueva superficie.

Hasta entonces, la capa Next debe considerarse prototipo técnico, no arquitectura oficial de producción.

## Criterios de aceptación del rediseño

- Máximo seis capítulos de contenido antes del footer.
- Cero enlaces `href="#"` usados como evidencia o acción.
- Cero precios, ratings, cupos, fechas o afinidades sin fuente trazable.
- Iti IA usa el flujo real o no se presenta como IA.
- Una CTA primaria por viewport y máximo tres repeticiones estratégicas de WhatsApp.
- Todos los targets interactivos miden al menos 44 × 44 px.
- Cero emojis como iconos estructurales; usar SVG/Lucide de forma consistente.
- Sin marquee automático, rebote ni glow cromático.
- Gradientes limitados al hero o a una única pieza de marca; blur sólo en navbar/modal.
- Modales con nombre accesible, focus trap, fondo inerte y devolución de foco.
- Capturas verificadas en 375, 768 y 1440 px; navegación por teclado, reduced motion y consola sin errores.
- `npm test`, preview real y build de la superficie canónica en verde.

## Plan recomendado

1. **[P0] `$impeccable clarify`:** retirar promesas falsas de Iti IA, catálogo, agenda, prensa, aliados y reseñas.
2. **[P1] `$impeccable distill`:** reducir la home a seis capítulos y una jerarquía de conversión.
3. **[P1] `$impeccable document`:** declarar una sola superficie canónica y alinear arquitectura, scripts y harness.
4. **[P1] `$impeccable layout`:** construir la composición “Editorial barrial contemporánea” con el contenido real disponible.
5. **[P1] `$impeccable adapt`:** corregir targets, rails y comportamiento móvil.
6. **[P1] `$impeccable harden`:** cerrar accesibilidad de modales, estados vacíos, errores y fallbacks.
7. **[P2] `$impeccable quieter`:** retirar marquee, bounce, glows, exceso de pills, sombras y blur.
8. **[P2] `$impeccable optimize`:** separar recursos sólo después de estabilizar el diseño y medir el resultado.
9. **[P2] `$impeccable polish`:** una ronda final con capturas desktop/móvil y detector mecánico.

Se pueden ejecutar estos pasos de uno en uno, todos juntos o en el orden que convenga. Al finalizar, volver a ejecutar `$impeccable audit` para medir el cambio de puntaje.

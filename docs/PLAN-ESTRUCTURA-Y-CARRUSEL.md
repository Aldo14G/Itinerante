# Plan: estructura Inicio · Medio · Fin y carrusel de libros

Estado: **plan, sin construir** (2026-11-01). Fuentes: las 30 leyes de [lawsofux.com](https://lawsofux.com/), el catálogo público de patrones de [thepromptsfactory.com](https://thepromptsfactory.com/) y una auditoría del sitio actual (`index.html`, `app.js`, `mobile.css`).

Reglas que no se negocian (PRODUCT.md): sin precios, existencias, fechas ni reseñas inventados; imágenes IA rotuladas «Recreación IA» y fotos reales «Foto real». Hoy **no hay fotos de portada**: las obras se muestran con portada tipográfica propia hasta que llegue el listado real.

## 1. Cómo está hoy (auditoría)

Arco actual: **Inicio** = hero + manifiesto · **Medio** = La casa, Cartelera, Libros, Catálogo · **Fin** = cita, llamado, Visita, pie.

Lo que funciona: el primer elemento (hero con «Cómo llegar») y el último (Visita) llevan la acción práctica; el menú y la barra inferior comparten nombres; cada sección tiene un solo título.

Lo que desorienta o carga de más:

| # | Problema | Ley |
|---|---|---|
| 1 | **Libros y Catálogo compiten.** «Elige un tema» (mensaje a WhatsApp) y «Explora la muestra» (buscador) son dos puertas para lo mismo, una detrás de otra. | Hick, Choice Overload, Tesler |
| 2 | **Cinco capítulos en el medio y 4–5 pestañas en la barra**, sin señal de «dónde voy» más allá del icono activo. | Miller, Goal-Gradient, Zeigarnik |
| 3 | **Primera vista móvil con 10 acciones** (aviso `law-hick` abierto). | Hick, Cognitive Load |
| 4 | **Cada capítulo cambia de lenguaje visual** (cortinilla de tiles, tonos, carrusel, historias) sin una regla de cuándo usar cuál. | Von Restorff (se diluye), Aesthetic-Usability |
| 5 | **El medio es lo menos recordado**: Serial Position dice que se recuerdan el primero y el último; el medio necesita anclas propias. | Serial Position, Peak-End |
| 6 | El catálogo muestra «Datos de muestra · no es inventario» pero el usuario que va al local no sabe **si el libro está**. | Mental Model, Postel |

## 2. Las 30 leyes y qué decide cada una

**Percepción y agrupación** — Common Region: cada capítulo es una región con fondo propio (ya hecho con los tonos). Proximity: título + frase + acción de un capítulo viven juntos; separar capítulos con espacio, no con líneas. Similarity: todas las tarjetas de libro iguales; las de cartelera iguales entre sí. Uniform Connectedness: un hilo (barra de progreso) conecta los capítulos. Prägnanz: formas simples; sin 3D ornamental. Von Restorff: **un solo** elemento distinto por pantalla (el CTA «Cómo llegar»).

**Memoria y carga mental** — Miller: máximo 5 capítulos nombrados; 5 filas en el menú; carruseles de ≤12 tarjetas por vista inicial. Working Memory: no obligar a recordar de una sección a otra (repetir horario y acción donde se decide). Chunking: capítulos con promesa de una línea; listas en grupos de 3–4. Cognitive Load / Selective Attention: una acción primaria por pantalla; quitar texto que no ayude a ir o preguntar. Serial Position + Peak-End: **primero** = nombre + Cómo llegar; **pico** = recorrido de La casa; **último** = Visita con una sola acción.

**Decisión** — Hick, Choice Overload: un solo punto de entrada a libros (ver §3); filtros ocultos hasta pedirlos. Pareto: el 20 % de acciones (cómo llegar, horario, preguntar por WhatsApp) en el 80 % de las pantallas. Occam: si dos componentes hacen lo mismo, queda uno. Tesler: la complejidad (catálogo, filtros) vive en el sistema, no en la persona. Paradox of the Active User: nadie lee instrucciones; el carrusel se entiende a la primera (se ve el borde de la siguiente tarjeta). Parkinson: la tarea «saber si abren y cómo llegar» debe tomar segundos, no una sección.

**Interacción** — Fitts: objetivos ≥ 44 px, acciones principales al alcance del pulgar (barra inferior, ya hecho). Jakob: carrusel con snap, flechas y puntos como en tiendas y apps conocidas; menú con categorías como en apps. Mental Model: «Cartelera» = lo que ocurre; «Libros» = lo que hay; nunca «Eventos» para propuestas sin fecha. Postel: aceptar búsquedas con acento, mayúsculas o errores; enviar mensajes de WhatsApp limpios. Doherty: respuesta < 400 ms; esqueleto estático mientras carga; sin trabajo bloqueante en el primer render.

**Motivación y emoción** — Goal-Gradient: indicador «02 / 05» y barra fina que se llena; en la rejilla, «quedan N». Zeigarnik: dejar a la vista el siguiente paso (la siguiente tarjeta asoma; el siguiente capítulo se anuncia). Flow: transiciones continuas y breves, sin esperas. Aesthetic-Usability: la paleta clara y la tipografía sostienen la confianza, pero no sustituyen claridad.

**Sesgos** — Cognitive Bias: no usar urgencia ni escasez falsas (prohibidas por PRODUCT.md).

## 3. Estructura propuesta

Cinco capítulos con el mismo nombre en cabecera, menú y barra inferior, y la misma plantilla: **etiqueta numerada · promesa de una línea · contenido · una acción primaria · pista del siguiente**.

**INICIO — «¿Dónde estoy y puedo ir?»** (≤ 8 s)
1. *Hero*: nombre, una frase, estado abierto/cerrado, **Cómo llegar** (primaria) y «Pregunta por un libro» (secundaria). Quitar del primer viewport móvil lo que no sea esto (objetivo: ≤ 6 acciones; cierra `law-hick`).
2. *Manifiesto*: qué es Itinerante en tres líneas. Sin acción nueva; el scroll es la acción.

**MEDIO — «¿Qué hay y cómo se vive?»** (tres capítulos, no cuatro)
3. **01 · La casa** — recorrido (el pico emocional). Acción: «Ver cómo llegar».
4. **02 · Cartelera** — propuestas sin fecha, carrusel de tarjetas. Acción: «Pedir informes».
5. **03 · Libros** — **fusión de Libros y Catálogo en un solo capítulo con tres capas**:
   a) *Carrusel de selección* (§4) → b) *Temas* (los chips actuales filtran el carrusel) → c) *Ver todos / buscar*, que abre el catálogo completo. Un solo punto de entrada, la complejidad aparece cuando se pide (Hick, Tesler).

**FIN — «Cómo llego y qué hago»**
6. *Cita* (una pausa; mantener, es el pico de calma).
7. **04 · Visita** — dirección, horario con estado en vivo, **Cómo llegar**, WhatsApp. Es el «último elemento»: una sola acción dominante.
8. *Pie* — redes y datos; sin acciones nuevas.

Orientación en todo el recorrido: etiqueta numerada en cada título; barra fina de progreso en la cabecera (Goal-Gradient); «Siguiente: Cartelera →» al final de cada capítulo (Zeigarnik); la barra inferior ya marca la sección actual.

Vocabulario de transiciones (para que no se diluya Von Restorff): **una firma** (las baldosas del suelo ajedrezado, solo entre La casa y Cartelera) y **una transición simple** para el resto (el capítulo siguiente «asoma» con borde redondeado y parallax suave). Nada más.

## 4. Carrusel de libros

**Qué mostrar (honesto).** «Los más leídos» exige datos de lectura que no tenemos, y las calificaciones de Amazon están prohibidas como reseñas. Opciones reales, de la más a la menos viable hoy:

| Colección | Fuente verificable | Cuándo |
|---|---|---|
| **Selección de la casa** | lista manual de Roberto/Aldo (8–12 títulos con una línea de por qué) | en cuanto llegue el listado |
| **Por tema** (Narrativa, Poesía, Ensayo, Crónica, Infantil) | taxonomía controlada + listado real | con el listado |
| **Los que más preguntan** | solo si hay conteo real de consultas por WhatsApp | cuando exista el dato |
| **Recién llegados** | fecha de ingreso real | cuando exista inventario |

Mientras no llegue el listado, el carrusel muestra la **muestra** con el rótulo «Muestra · no es inventario» y portadas tipográficas. Nunca se llama «Más leídos» sin dato.

**Componente (una sola pieza, varias colecciones).** Datos: `assets/data/collections.json` → `{ id, titulo, descripcion, fuente, libros: [ids] }`; el mismo componente sirve a «Selección de la casa» y a cada tema.

- **Base (todos los equipos):** lista horizontal con `scroll-snap-type: x mandatory`, tarjetas de 2.3 por vista en móvil (se ve el borde de la siguiente) y 4–5 en escritorio; `scroll-padding`, sin autoplay (WCAG 2.2.2), `overscroll-behavior-x: contain`. Tarjeta = portada tipográfica 2:3 + título + autor + etiqueta de colección. Puntos o barra de progreso; flechas ≥ 44 px solo con puntero fino; «Ver todos →» al final de la fila.
- **Mejora progresiva (escritorio, puntero fino, movimiento activo):** escala/profundidad de la tarjeta central con `animation-timeline: view(inline)` donde se soporte; arrastre con inercia; entrada escalonada (`stagger-char` de tokens). Nada de WebGL ni vidrio líquido en gama media.
- **Accesibilidad:** `role="region"` + `aria-roledescription="carrusel"` + nombre; cada tarjeta es un botón que abre la ficha existente; foco visible; teclado: Tab recorre, Flechas desplazan; `prefers-reduced-motion` sin inercia ni profundidad.
- **Rendimiento (gama media):** ≤ 12 tarjetas en el DOM inicial, `content-visibility` por tarjeta, sin `backdrop-filter` ni sombras costosas, JS solo para flechas y puntos; medir INP < 200 ms con CPU 4×.
- **Interacción con temas:** los chips «Narrativa, Poesía…» cambian la colección del mismo carrusel (con transición corta de contenido) y actualizan la URL (`#libros?tema=poesia`) para poder compartir (la referencia SP lo pide y hoy falta).

## 5. Qué enseña thepromptsfactory.com (y qué no)

Es una galería de **71 animaciones, 36 transiciones y sitios 3D completos** con vistas interactivas (los prompts completos exigen cuenta de pago; no inicié sesión ni copié nada; rechacé sus cookies opcionales). Solo vi títulos y descriptores, no código. De ahí salen patrones, que reconstruimos con nuestro código:

| Necesidad nuestra | Patrones de la galería | Decisión |
|---|---|---|
| Carrusel de libros | LUCENT *slide & focus*, CHAPTER *staggered cards*, ROOM *curved selector*, LAGOON *wave carousel (inercia y profundidad)*, MONO *browse & flip*, REFRACT *liquid glass* | **Base**: LUCENT + CHAPTER. **Mejora**: profundidad suave tipo ROOM/LAGOON solo en escritorio. REFRACT/liquid glass: no (peso) |
| Cambio de capítulo | PASSAGE *next chapter*, OFFBEAT *staggered panels*, SUMMIT *hero peel*, STRATA *organic reveal*, SORA *shrink & draw* | transición simple = SUMMIT/PASSAGE |
| Manifiesto y titulares | MANIFESTO *line wipe*, Falling curtain, Settling/Spring type | ya hay revelado por líneas; mantener, sin sumar tipos |
| Menú | NOCTURNE *expanding menu*, MONOGRAPH *clip & scale*, KINETIC *accordion measured height* | el panel lateral ya usa el equivalente de KINETIC; NOCTURNE como mejora de escritorio |
| Cinta de texto | AIRWAVE *ticker de velocidad según scroll* | ya existe (llamado final) |
| Recorrido del hero | FLINT *frame sequence*, OTHERWHERE *horizontal story* | ya existe; no añadir |
| No aplica | KOSMO/FORMA/SONO (producto 3D), CITRUS/CHARM (física), NECTAR/liquid, IRON MAN | pesadas y sin sentido para una librería; descartadas |

## 6. Ruta de trabajo (cada fase con criterio de salida medible)

1. **Estructura y orientación** — numerar capítulos, nombres únicos, barra de progreso, «Siguiente →»; primera vista móvil ≤ 6 acciones. *Salida:* `critique` sin `law-hick`; prueba de que menú, barra y títulos usan los mismos nombres.
2. **Fusionar Libros + Catálogo** — un solo capítulo con tres capas; estado en URL. *Salida:* un único punto de entrada a libros; E2E de tema→carrusel→ficha→WhatsApp; la URL restaura el estado.
3. **Carrusel base** — componente + `collections.json` con la muestra. *Salida:* axe sin errores, teclado completo, INP < 200 ms con CPU 4×, ≤ 12 tarjetas iniciales, sin desborde 360–1920 px.
4. **Mejora progresiva** — profundidad/inercia solo escritorio. *Salida:* 0 impacto en móvil (misma métrica de la fase 3), reduced-motion respetado.
5. **Datos reales** — al llegar el listado: colecciones reales, portadas (cuando existan fotos, rotuladas), y poner en `null` los 195 `coverUrl` locales de la API. *Salida:* ningún libro mostrado sin fuente; «Muestra» desaparece solo donde haya inventario verificado.

## 7. Decisiones de Aldo (2026-11-01)

1. **Fusionar Libros y Catálogo en un capítulo:** sí (hecho, commit `e29395c`).
2. **Listado de obras:** lo entregan ellos cuando se actualicen las ediciones y lleguen libros nuevos. Hasta entonces el carrusel usa la muestra, rotulada, y debe poder recibir una lista curada (`ids`) sin tocar código.
3. **Tráfico a WhatsApp:** es solo informativo; no hay conteo útil de «lo que más preguntan». Ninguna colección se llama «más leídos» ni «lo que más preguntan».
4. **Objetivo del sitio: que visiten la librería.** La acción primaria de cada pantalla es «Cómo llegar»; WhatsApp es apoyo informativo («confirma que lo tienen»). Pendiente de aplicar a los textos de la ficha y del compositor de consultas.

Pendiente de Aldo: quién cura la «Selección de la casa» cuando llegue el listado, y los nombres finales de capítulos.

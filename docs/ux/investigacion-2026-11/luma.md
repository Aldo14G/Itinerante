# Luma (lu.ma): estructura de su lista y de la página de un evento (2026-11-16)

**Advertencia: es referencia de estructura, no de código ni de imagen.** Aldo pidió que Eventos se parezca, en orden y en lectura, a la agenda de Luma (la plataforma de eventos, `lu.ma` / `luma.com`; no es «Luma», el estilo de shadcn/ui que aparece en `shadcn-21st-uiverse.md`). De sus páginas se tomó **cómo se organiza la información** y se midió; **no se copió nada**: ni HTML, CSS o JavaScript, ni tipografías, ni imágenes, ni textos. El sitio tampoco carga nada de Luma: el único vínculo es un enlace normal «Registrarme» a la página de un evento, que se abre en otra pestaña (`feed.js`, `validRegistro`: solo `https`, solo `lu.ma` o `luma.com`).

## Qué se midió y cómo

Páginas públicas de Luma (una lista «Eventos populares», la de una ciudad, el descubrimiento y la página de un evento), abiertas con Chromium (Playwright) en iPhone 393 × 659 y en 1440 × 900; se guardaron el HTML renderizado, capturas y medidas de cajas, tipografía y huecos con `getBoundingClientRect` y estilos calculados. Los archivos viven fuera del repositorio (scratchpad de la sesión: `rea-luma/descargado/`, `lista.json`, `medidas.json`, `lista-*.png`, `evento-*.png`); aquí solo se resumen. Lo que no se pudo verificar: el comportamiento con sesión iniciada, la página de un evento con registro aprobado y cualquier cosa que cambie con el tiempo (la hoja de estilos de Luma es suya y cambia sin aviso).

## Hallazgos de la lista (estructura)

1. **Agrupada por día.** Cada día es una sección con un rótulo de dos partes —«18 nov» en tinta y «miércoles» en gris, 26 px de alto; «Mañana martes» para el día siguiente— que se queda fijo al desplazar dentro de su día. Los eventos del día van debajo, tras un carril con línea y punto.
2b. **Dos columnas a 1440:** la lista (620 de ancho) a la izquierda y, a la derecha, un panel lateral de unos 260 (nombre de la ciudad, una frase y un campo para suscribirse). Es la estructura que el sitio adaptó para la nota «¿Cómo me registro?» en las columnas 9–12.
2. **Fila horizontal, texto a la izquierda y portada cuadrada a la derecha.** Orden del texto: **hora** (16/24, gris), **título** (20/24, peso 500, tinta), quién lo da («Por …», gris) y el lugar (gris). Abajo, una barra con insignias de estado. La portada mide 119–121 px, cuadrada, a la derecha.
3. **Medidas a 1440:** tarjeta de 596 de ancho (columna de 620 con 24 de carril), 148–196 de alto, **16 px entre tarjetas**, relleno 12 (16 a la izquierda), radio 24, fondo blanco al 80 % con borde blanco de 1 px y sin sombra. En el teléfono: 337 de ancho, a 40 px del borde, misma estructura.
4. **La acción es la fila entera** (enlace a la página del evento), no un botón dentro de ella.
5. **Página de un evento (a 1440, dos columnas):** a la izquierda el **cartel cuadrado entero, como un objeto** (tarjeta blanca con borde y radio sobre fondo gris claro), quién presenta y la descripción; a la derecha, el título grande, un bloque de fecha («NOV / 18» como un mini calendario) con la fecha y hora en texto, el lugar, y una tarjeta «Inscripción» con los tipos de entrada y **un único botón** («Inscribirse»); en el teléfono todo en una columna (3 084 px de alto; 1 912 a 1440). De ahí salen el cartel entero sobre fondo suave y la fecha como bloque propio del destacado; el sitio no copia el mini calendario ni la tarjeta de inscripción: la fecha es tipográfica y el registro es un enlace a la página de Luma.

## Qué se tomó para el sitio

| De Luma | En el sitio | Dónde |
|---|---|---|
| Lista por día con el rótulo de fecha al lado | Rótulo «SÁB · 28 NOV» (teléfono) o columna a la izquierda con el número ligero (desde 761 px) | `ev-dia`, `fechaBloque` |
| Fila: hora, título, quién y portada cuadrada a la derecha | `.ev-card`: «17:00 · Juego», título Title 3, «Con …», portada de 88 / 120 con radio 12 | `cardNode` |
| Un destacado con el cartel entero como objeto, la fecha como bloque propio y un botón de registro | Panel con la foto a sangre o el cartel entero y «Registrarme» (o «Reservar por WhatsApp») como primaria de 56 | `destacadoNode` |
| Registro como enlace a la página del evento | `reserva: { tipo: "luma", url }`, en otra pestaña | `reservaLink`, `validRegistro` |

## Qué no se tomó (y por qué)

- **La tarjeta de vidrio al 80 % con radio 24, el degradado de fondo y el carril de línea y punto:** la piel del sitio es «Itinerante Líquido» (`DESIGN.md`); las filas son líneas finas sin relleno.
- **Contadores de asistentes, cupos, «+73» y cualquier señal social:** el sitio no guarda registros ni muestra cupos ni asistentes (`PRODUCT.md`).
- **Su tipografía y sus tonos grises al 36 %:** el texto secundario es `tinta-2` (≥ 4.5:1 en ambos temas); Luma usa gris al 36 % para hora y organizador, que no pasa ese contraste.
- **El rótulo de día fijo al desplazar:** en el sitio es decorativo y no se queda fijo (nada que se mueva al desplazar fuera de lo aprobado).
- **Su código, sus imágenes y todo lo que se carga desde su dominio.**

## Cómo se comparó con lo construido

Las medidas de Luma sirvieron de orden de magnitud, no de objetivo: portada de 120 (la del sitio, 88 en el teléfono y 120 desde 1024), hueco entre filas de 16 en Luma frente a filas de 20 + 20 con una línea fina en el sitio, hora y título en la misma jerarquía (hora primero, título después). La referencia del día a un lado se adaptó a la rejilla del sitio: el día ocupa las dos primeras columnas de la lista (`DESIGN.md`, «Eventos: destacado y lista por fecha; carta en parrilla»).

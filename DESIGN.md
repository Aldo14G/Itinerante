---
name: "Librería Itinerante y Más"
description: "Una librería cultural que se descubre como se habita."
colors:
  mint-library: "#5dc4b4"
  green-room: "#0d4a45"
  night-ink: "#061a18"
  mint-light: "#9de3da"
  signal-amber: "#e8a020"
  ivory-paper: "#fdfcf8"
  bright-paper: "#ffffff"
  muted-teal: "#3d6660"
  editorial-line: "rgba(13, 74, 69, .22)"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(3.5rem, 5.3vw, 5.75rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.1rem, 4vw, 4rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.55rem, 2.5vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.65
  action:
    fontFamily: "Inter, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.65
rounded:
  none: "0"
  logo: "9px"
  menu: "12px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  spread: "36px"
  wide: "64px"
  page: "clamp(20px, 5vw, 96px)"
  section: "clamp(76px, 8vw, 136px)"
components:
  button-primary:
    backgroundColor: "{colors.ivory-paper}"
    textColor: "{colors.night-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.mint-light}"
    textColor: "{colors.night-ink}"
  button-secondary:
    backgroundColor: "{colors.night-ink}"
    textColor: "{colors.ivory-paper}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
    height: "48px"
  chapter-current:
    backgroundColor: "{colors.mint-light}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
    height: "44px"
  motion-toggle:
    backgroundColor: "{colors.night-ink}"
    textColor: "{colors.ivory-paper}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
    height: "44px"
  editorial-surface:
    backgroundColor: "{colors.ivory-paper}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.none}"
  agenda-surface:
    backgroundColor: "{colors.green-room}"
    textColor: "{colors.ivory-paper}"
    rounded: "{rounded.none}"
---

# Design System: Librería Itinerante y Más

## Overview

**Creative North Star: "La Librería Habitada"**

La interfaz se siente como una estancia dentro de una librería real. La fotografía documental conserva la piedra, la madera, el piso ajedrezado y los muebles turquesa de la casa; la tipografía editorial ordena el relato y los controles permanecen claros y cercanos.

Casa editorial, aprobada el 27-oct-2026, conserva esa identidad y cambia su expresión: un umbral audiovisual breve abre el recorrido; el papel recupera la lectura, el verde sostiene la agenda y la tinta reúne los datos de visita. El movimiento es una mejora opcional, mientras la fotografía real lleva la experiencia después del ingreso.

**Key Characteristics:**

- Casa real y procedencia documental reconocible.
- Titulares serif expresivos y controles sans serif claros.
- Papel, verde profundo y tinta en superficies opacas.
- Fotografía contenida por la resolución de sus originales.
- Movimiento opcional con una ruta completa y calmada.

## Colors

Verdes domésticos y tinta profunda se alternan con papel cálido; la menta orienta y el ámbar señala.

### Primary

- **Menta librera:** identidad, selección de texto contextual y detalles de orientación.
- **Verde sala:** superficie de Agenda y respaldo tonal del mapa.
- **Tinta nocturna:** texto sobre papel, cabecera opaca, ingreso y cierre de visita.

### Secondary

- **Menta clara:** texto secundario sobre fondos profundos, contornos interactivos y navegación activa.

### Tertiary

- **Ámbar de señal:** foco visible, selección y línea fina de progreso del umbral.

### Neutral

- **Papel marfil:** fondo amplio de lectura en Experiencia y Galería, texto sobre superficies profundas y botón primario.
- **Papel luminoso:** token de respaldo conservado; no define una superficie pública distinta en Casa editorial.
- **Verde apagado:** texto secundario y pies de foto sobre papel.
- **Línea editorial:** separaciones suaves disponibles en el sistema local.

**The Signal Amber Rule.** El ámbar señala foco, selección o progreso; nunca domina una superficie de lectura.

## Typography

**Display Font:** Playfair Display (con Georgia como respaldo)  
**Body Font:** Inter (con Segoe UI como respaldo)

**Character:** Playfair narra el espacio con peso medio y líneas breves; Inter permite leer, orientarse y actuar con calma. Las familias se autoalojan y el énfasis del titular conserva la cursiva editorial existente.

### Hierarchy

- **Display:** titular de ingreso. En hasta 1100 px usa `clamp(3rem, 5.3vw, 4.5rem)`; en hasta 760 px, `clamp(2.5rem, 8.5vw, 3.7rem)`; la variante más compacta usa `2.2rem`. La medida de escritorio está en el frontmatter.
- **Headline:** títulos de sección; escala fluida con interlínea corta.
- **Title:** aperturas editoriales; la lista de Agenda ajusta sus títulos a `1.65rem`.
- **Body:** texto continuo con interlínea amplia; el hero usa `1.7` y longitudes máximas entre 38 y 52ch según el bloque.
- **Label:** pies de foto, horario y texto auxiliar. Se conservan desde `0.875rem`; solo los datos del hero más compacto llegan a `0.8rem`.
- **Action:** botones con peso 600. La navegación usa peso 500; enlaces editoriales usan `0.9375rem` y peso 600.

**The Two-Voice Rule.** Playfair narra; Inter orienta y permite actuar. No se intercambian esos papeles por conveniencia local.

## Layout

El ancho de contenido es de 1320 px y los rellenos fluidos de página y sección están en el frontmatter. Las cabeceras editoriales se dividen en título y explicación; las aperturas alternan fotografía y texto en columnas desiguales, con espacio para que cada imagen conserve su escala. La galería usa doce columnas con figuras de anchura limitada por el original, sin recortarlas para forzar uniformidad.

A 1100 px aparece el menú compacto. A 760 px las aperturas, Agenda y Visita se apilan y la galería pasa a dos columnas, con imágenes amplias a todo el ancho. La navegación conserva sus cinco anchors; el menú no sustituye la estructura semántica cuando JavaScript falta. El retrato del ingreso tiene marco de papel y no supera 320 px; la sala original mide 390 px de ancho. En pantallas de hasta 600 px de altura y desde 761 px de ancho, el retrato no esencial se oculta, el texto ocupa una columna y el titular usa 2.5rem para conservar las acciones a la vista.

**The Reading Before Spectacle Rule.** La lectura, los datos de visita y las acciones conservan una ruta completa sin video.

## Elevation & Depth

La profundidad es tonal y espacial: papel, verde y tinta opacos, separación por aire y trazos finos. No hay sombras ambientales ni desenfoque en las superficies activas. Solo el velo del umbral usa un gradiente oscuro sobre los medios para proteger el texto; el foco combina contorno ámbar y un respaldo tinta de 6 px. No convertir ese respaldo de accesibilidad en una sombra decorativa.

**The Opaque Reading Rule.** Las superficies de lectura mantienen su propio contraste y no dejan que un medio de fondo compita con el contenido.

## Shapes

Fotografías, aperturas, mapa y secciones usan esquinas rectas. La cápsula identifica acciones y navegación; el logotipo conserva su radio pequeño y el menú compacto un radio contenido. El retrato del hero tiene una rotación de dos grados y un marco de papel de 8 px, sin extrapolar ese gesto a todas las fotografías.

**The Shape Has a Job Rule.** La cápsula indica interacción; el rectángulo contiene fotografía y lectura.

## Components

Los componentes activos se extraen de `index.html`, `assets/css/higgsfield-site.css` y `assets/js/higgsfield-site.js`; los contratos de catálogo e Iti IA conservados más abajo están pausados y no aportan tokens activos.

### Buttons

Cápsulas opacas con altura mínima de 48 px. El primario usa papel/tinta; el secundario usa tinta/papel y borde menta. Ambos invierten a menta/tinta en hover. Las transiciones de color y borde duran 180 ms; el foco común permanece visible. El estilo secundario conserva el nombre técnico histórico `button--glass`, pero ya no es vidrio.

### Navigation

Cabecera tinta opaca y lockup compacto. Los enlaces tienen altura mínima de 44 px, texto Inter y estado actual menta con `aria-current`; el hover usa papel. El menú compacto usa un botón nativo con `aria-expanded`, restaura foco con Escape y oculta sus enlaces mediante `inert` al cerrarse. No hay una segunda navegación de fases.

### Editorial photographs

Los seis originales oficiales se preservan en `_archive/reference-inputs/2026-10-27-official-interiors/`, fuera de `public/`. Sus doce derivados WebP `images/gallery/oficial-*` y dimensiones constan en `docs/official-photo-derivatives.json`; no se amplían originales. Rincón y mesa ofrecen 480/800/1200/1600; sala, encuentro, estantes y mesa compartida conservan sus tamaños pequeños. Los pies describen lo visible y ninguna portada acredita existencia actual.

### Cinematic threshold and motion control

Solo Inicio y su breve salida usan medios generados. La salida mide 38svh en escritorio y 18svh en móvil, y se elimina con `prefers-reduced-motion`. Los siete fotogramas se activan por scroll nativo y se cargan al necesitarlos; cada uno tiene encuadre móvil, incluidos 04–07. El primer fotograma ofrece respaldo desde la carga inicial. El video no tiene autoplay ni loop y requiere al menos 1024 px e interacción real; movimiento reducido, Save-Data o batería baja conservan el respaldo estático. El botón nativo «Reducir movimiento» usa `aria-pressed` y respeta la preferencia del sistema. Una línea ámbar fina comunica progreso; no hay tarjeta demo ni píldoras de fase.

### Agenda

Superficie verde profunda, lista plana con divisores menta y tipografía editorial. No introduce fechas, cupos ni estados sin evidencia. WhatsApp e Instagram conducen a información vigente.

### Visita

Tinta opaca sin video, horario en lista de definición, nota de festivos por confirmar, Cómo llegar y WhatsApp. El mapa de Google Maps tiene carga diferida y esquinas rectas.

### Funciones pausadas

Los contratos siguientes se conservan como referencia de `features/catalog-iti-ia/`. No se publican, no se enlazan, no aparecen en el sidecar activo y no autorizan reactivación ni nuevos claims comerciales.
### Paginador del catálogo — En pausa (`features/catalog-iti-ia/`)

El catálogo muestra nueve fichas por página con un paginador Anterior /
Siguiente; la altura de la sección queda acotada y los filtros ya no desplazan
el resto de la página. El estado anuncia "Mostrando X–Y de Z" y la página
actual. Durante la recarga se conserva el contenido anterior hasta tener datos
nuevos: nunca se vacía la retícula antes de tiempo.

### Descubrimiento (funciones Amazon adaptadas) — En pausa (`features/catalog-iti-ia/`)

- **Sugerencias:** el buscador ofrece títulos y autores del resultado actual
  mediante `datalist`, sin llamadas extra.
- **Facetas con conteo:** cada filtro muestra su conteo ("Literatura · 18");
  el total acompaña a "Todos los libros".
- **Orden:** relevancia, A–Z, novedades (año de publicación) y mejor valorados.
- **Valoración en tarjeta:** `★ 4.7 (1,234) · Fuente` solo cuando existe dato
  real con procedencia; nunca inventada.
- **Relacionados en ficha:** hasta tres libros del mismo subgénero que abren su
  propia ficha al tocarlos.

### Iti IA Dialog — En pausa (`features/catalog-iti-ia/`)

El diálogo es una superficie de papel claramente separada del fondo. La
cabecera lleva el avatar real de la librería y una línea de propósito
("Recomendaciones de la librería"). Mensajes, estado, recuperación y
formulario permanecen en flujo normal; la personalidad proviene de la
tipografía y los colores de la librería, no de convenciones visuales de
chat genérico. Cada recomendado es una tarjeta con portada (cuando el
catálogo cargado la conoce), motivo y acciones en fila: "Ver ficha" y
WhatsApp. Las filas de chips (predicciones, filtros) nunca muestran barras
de desplazamiento: se desvanecen al borde; los mensajes reservan el carril
del scroll para no saltar. Las etiquetas TÚ / ITI IA aparecen solo en
cambio de turno.

### Iti IA Flotante — En pausa (`features/catalog-iti-ia/`)

Una píldora fija abajo a la derecha (avatar real de la librería + "Iti IA",
56px, tinta con borde menta, elevada sobre la zona segura) acompaña todo el
recorrido y abre el mismo diálogo contextual; se oculta al bajar y reaparece
al subir (conducta Meta, sin movimiento reducido). El diálogo nunca vive
flotando, solo su acceso. Cada recomendado incluye "Ver ficha del libro" y
siempre aterriza en la ficha de la obra: directo si ya está en el catálogo
cargado, o buscando y abriendo el mejor resultado en caso contrario.

### Predicciones de búsqueda — En pausa (`features/catalog-iti-ia/`)

Sobre el formulario, una fila de predicciones sugiere el siguiente paso sin
escribir de más: al abrir, tres preguntas iniciales cálidas; al escribir,
hasta cuatro predicciones vivas del catálogo cargado (títulos, autores y
temas que contienen lo escrito). Tocar una envía la consulta directo.

## Do's and Don'ts

### Do:

- **Do** conservar el espacio, la arquitectura y la fotografía reales como referencia visual principal.
- **Do** usar menta para orientar, ámbar para señalar y papel para leer.
- **Do** mantener foco visible, objetivos táctiles suficientes y una ruta completa sin movimiento.
- **Do** usar tono, espacio y proporción para ordenar superficies opacas.
- **Do** respetar la resolución de cada original y distinguir fotografía de recreación generada.

### Don't:

- **Don't** introducir estética SaaS, marketplace, IA genérica o plantilla saturada.
- **Don't** inventar habitaciones, materiales, fotografías o claims que sustituyan la evidencia del lugar.
- **Don't** usar ámbar como fondo dominante ni añadir colores sin un papel durable.
- **Don't** aplicar cápsulas a fotografías o contenido puramente editorial.
- **Don't** secuestrar el desplazamiento, reproducir video automáticamente ni depender de animación para comprender o usar la página.

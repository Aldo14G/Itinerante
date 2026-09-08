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
  status-error: "#8a241d"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(3.2rem, 6.4vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.9rem, 1.2vw + 1.6rem, 2.9rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, Segoe UI, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.08em"
  action:
    fontFamily: "Inter, Segoe UI, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  none: "0"
  logo: "9px"
  surface: "16px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  surface: "30px"
  page: "clamp(20px, 4vw, 64px)"
  section: "clamp(72px, 10vw, 140px)"
components:
  button-primary:
    backgroundColor: "{colors.ivory-paper}"
    textColor: "{colors.night-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "46px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ivory-paper}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "46px"
  chapter-current:
    backgroundColor: "{colors.mint-light}"
    textColor: "{colors.night-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
    height: "44px"
  search-input:
    backgroundColor: "rgba(255, 253, 248, 0.84)"
    textColor: "{colors.night-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "48px"
  book-card:
    backgroundColor: "{colors.bright-paper}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.none}"
    padding: "28px"
---

# Design System: Librería Itinerante y Más

## Overview

**Creative North Star: "La Librería Habitada"**

La interfaz debe sentirse como una estancia dentro de una librería real, no
como un escaparate digital aislado. Su atmósfera es íntima, doméstica y pausada:
la fotografía conserva la presencia material del lugar, la tipografía editorial
ordena el relato y los controles permanecen claros y cercanos.

La expresión visual evita el espectáculo gratuito. El movimiento acompaña la
orientación espacial, mientras las capas de verde, papel y vidrio tenue permiten
que el contenido se lea con calma. La identidad nunca adopta la retórica de una
interfaz SaaS, un marketplace, una IA genérica o una plantilla saturada.

**Key Characteristics:**

- Presencia constante del espacio físico y sus materiales reales.
- Jerarquía editorial con titulares serif y controles sans serif.
- Superficies profundas, translúcidas y contenidas, sin ornamentación excesiva.
- Ritmo espacioso que conduce a acciones concretas sin urgencia artificial.
- Movimiento continuo y reversible que nunca sustituye al contenido.

## Colors

La paleta combina verdes domésticos y tinta profunda con papel cálido; la menta
abre y orienta, mientras el ámbar aparece sólo como señal puntual.

### Primary

- **Menta librera:** identifica acciones seleccionadas, estados activos y
  detalles que guían el recorrido.
- **Verde sala:** sostiene las superficies principales y conecta la interfaz con
  el interior físico de la librería.
- **Tinta nocturna:** ofrece el contraste estructural para texto, fondos y
  controles de máxima prioridad.

### Secondary

- **Menta clara:** ilumina texto destacado, bordes activos y superficies
  seleccionadas sin introducir otro lenguaje cromático.

### Tertiary

- **Ámbar de señal:** marca progreso, metadatos y acciones puntuales; su rareza
  conserva su capacidad de orientar.

### Neutral

- **Papel marfil:** islas de lectura y acción sobre la sala oscura (tarjetas de
  libros, campos de búsqueda, diálogos modales), nunca grandes superficies de
  sección; así se evita la fatiga visual del blanco sólido y galería + catálogo
  permanecen en verde sala y tinta nocturna como el resto del recorrido.
- **Papel luminoso:** reserva para tarjetas y superficies que necesitan máxima
  claridad sobre el papel marfil.
- **Verde apagado:** texto secundario sobre papel y transiciones de menor
  contraste.

**The Signal Amber Rule.** El ámbar nunca llena grandes superficies ni compite
con la menta; señala un momento, una categoría o una acción. Las etiquetas
editoriales (Libros, Café, Agenda, Comunidad) usan papel tenue y el género de
las fichas usa verde sala: el ámbar queda reservado a números de capítulo,
galería y acciones puntuales.

## Typography

**Display Font:** Playfair Display (con Georgia como respaldo)  
**Body Font:** Inter (con Segoe UI como respaldo)

**Character:** Playfair aporta la voz editorial y doméstica de la librería;
Inter mantiene navegación, formularios y metadatos precisos. La pareja contrasta
sin convertir la lectura en un gesto decorativo.

### Hierarchy

- **Display:** reservado para el ingreso y las declaraciones de mayor escala;
  líneas compactas y pocas palabras.
- **Headline:** títulos de sección contenidos a una escala claramente menor
  que Display (el Display queda reservado al hero), normalmente contenidos a una
  anchura corta para conservar ritmo vertical.
- **Title:** títulos de tarjetas, actividades y resultados editoriales.
- **Body:** lectura continua con longitudes aproximadas de 39 a 58 caracteres
  tipográficos por bloque según el contexto.
- **Label:** metadatos y categorías en mayúsculas, nunca por debajo del piso de
  legibilidad establecido.
- **Action:** botones y navegación con peso firme, sin imitar titulares.

**The Two-Voice Rule.** Playfair narra; Inter orienta y permite actuar. No se
intercambian esos papeles por conveniencia local.

## Layout

El sistema usa una retícula editorial flexible: composiciones de dos columnas
para relacionar relato y evidencia, mosaicos de doce columnas para fotografía y
una sola columna cuando la pantalla o la tarea exige concentración. El contenido
respira mediante rellenos de página y sección fluidos; los bloques internos
repiten intervalos cortos y medianos en lugar de márgenes arbitrarios.
Experiencia usa una sola columna: cabecera editorial sin caja (titular y
descripción en fila) y mosaico de dos columnas para las cuatro maneras de
habitar la librería, con el siguiente capítulo como pie de sección.

En pantallas estrechas las composiciones se apilan, la galería se convierte en
una secuencia vertical y la navegación de capítulos conserva desplazamiento
horizontal. Los controles mantienen una altura táctil mínima de 44px. El
recorrido cinematográfico se adapta en duración y encuadre, pero no crea una
segunda trayectoria espacial.

**The Reading Before Spectacle Rule.** Catálogo, formularios e información de
visita abandonan la composición cinematográfica cuando ésta pueda competir con
la lectura o la acción.

## Elevation & Depth

La profundidad es tonal y atmosférica antes que física. Paneles verde tinta con
transparencia y desenfoque leve se separan de la fotografía mediante contraste y
bordes claros de baja opacidad. Las tarjetas permanecen planas; la sombra amplia
se reserva para el diálogo modal que debe separarse inequívocamente del fondo.

### Shadow Vocabulary

- **Separación modal:** sombra ambiental amplia para el diálogo Iti IA; no se
  reutiliza como tratamiento habitual de tarjetas.
- **Profundidad tipográfica:** sombra mínima sobre el gran titular cuando la
  fotografía necesita proteger su legibilidad.

**The Shadow Is an Event Rule.** Una sombra visible comunica una capa temporal o
modal, no decoración permanente.

## Shapes

Las formas combinan superficies rectangulares de lectura con curvas contenidas.
Paneles de vidrio usan esquinas suavemente redondeadas; botones de acción y
navegación usan silueta de cápsula; campos, tarjetas de libros y mosaicos
fotográficos conservan esquinas rectas. Logotipo y cierre modal son las únicas
formas pequeñas con redondeo distintivo o circular.

**The Shape Has a Job Rule.** La cápsula indica interacción; el rectángulo indica
contenido; el radio intermedio indica una superficie ambiental.

## Components

Los componentes son táctiles y sobrios: sus estados se reconocen por contraste,
desplazamientos mínimos y foco visible, nunca por animaciones elásticas.

### Buttons

- **Shape:** cápsula para acciones generales; forma recta cuando el botón está
  unido a un campo de búsqueda.
- **Primary:** papel sobre tinta o tinta sobre papel, con peso firme y altura
  táctil suficiente.
- **Hover / Focus:** elevación vertical de uno o dos píxeles y contorno ámbar de
  alto contraste; las transiciones nombran propiedades específicas.
- **Ghost:** fondo transparente y borde claro para acciones secundarias sobre
  superficies profundas.

### Chips

- **Style:** rectangulares, transparentes y delineados sobre verde sala, en una
  sola fila horizontal con desplazamiento; el título del grupo usa Inter en
  mayúsculas, nunca serif.
- **State:** el seleccionado invierte a menta clara con tinta nocturna; el estado
  se comunica además mediante `aria-pressed`.

### Paginador del catálogo

El catálogo muestra nueve fichas por página con un paginador Anterior /
Siguiente; la altura de la sección queda acotada y los filtros ya no desplazan
el resto de la página. El estado anuncia "Mostrando X–Y de Z" y la página
actual. Durante la recarga se conserva el contenido anterior hasta tener datos
nuevos: nunca se vacía la retícula antes de tiempo.

### Descubrimiento (funciones Amazon adaptadas)

- **Sugerencias:** el buscador ofrece títulos y autores del resultado actual
  mediante `datalist`, sin llamadas extra.
- **Facetas con conteo:** cada filtro muestra su conteo ("Literatura · 18");
  el total acompaña a "Todos los libros".
- **Orden:** relevancia, A–Z, novedades (año de publicación) y mejor valorados.
- **Valoración en tarjeta:** `★ 4.7 (1,234) · Fuente` solo cuando existe dato
  real con procedencia; nunca inventada.
- **Relacionados en ficha:** hasta tres libros del mismo subgénero que abren su
  propia ficha al tocarlos.

### Cards / Containers

- **Corner Style:** recto en tarjetas de contenido; suavemente curvo en paneles
  ambientales.
- **Background:** papel luminoso para tarjetas de libros (islas claras sobre la
  sala oscura) y verde tinta translúcido sobre fotografía; los paneles de
  filtros del catálogo usan la misma superficie oscura contenida que la lista
  de experiencia.
- **Shadow Strategy:** plano por defecto; la separación nace de tono, borde y
  espacio.
- **Internal Padding:** generoso y consistente, con títulos anclados al ritmo
  vertical del contenido.

### Inputs / Fields

- **Style:** papel translúcido, tinta oscura, trazo fino y esquina recta.
- **Focus:** contorno ámbar exterior que no cambia las dimensiones del campo.
- **Error / Disabled:** el error usa rojo oscuro con lenguaje de recuperación;
  los controles deshabilitados reducen opacidad y conservan legibilidad.

### Navigation

La cabecera y la barra de capítulos usan capas oscuras translúcidas. La barra
nace solapada al pie del hero para leerse como su cierre y luego permanece
fija; los enlaces mantienen 44px de altura, responden con cambios breves de
opacidad o posición y el capítulo actual se convierte en una cápsula menta
con tinta oscura.

### Cinematic Progress

Una línea ámbar y cuatro hitos discretos muestran la posición dentro del
recorrido. En móvil se conservan todos los hitos, pero sólo se rotulan los
extremos para evitar colisiones.

### Iti IA Dialog

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

### Iti IA Flotante

Una píldora fija abajo a la derecha (avatar real de la librería + "Iti IA",
56px, tinta con borde menta, elevada sobre la zona segura) acompaña todo el
recorrido y abre el mismo diálogo contextual; se oculta al bajar y reaparece
al subir (conducta Meta, sin movimiento reducido). El diálogo nunca vive
flotando, solo su acceso. Cada
recomendado incluye "Ver ficha del libro" y siempre aterriza en la ficha de
la obra: directo si ya está en el catálogo cargado, o buscando y abriendo el
mejor resultado en caso contrario.

### Predicciones de búsqueda

Sobre el formulario, una fila de predicciones sugiere el siguiente paso sin
escribir de más: al abrir, tres preguntas iniciales cálidas; al escribir,
hasta cuatro predicciones vivas del catálogo cargado (títulos, autores y
temas que contienen lo escrito). Tocar una envía la consulta directo.

## Do's and Don'ts

### Do:

- **Do** conservar el espacio, la arquitectura y la fotografía reales como
  referencia visual principal.
- **Do** usar menta para orientar, ámbar para señalar y papel para leer.
- **Do** mantener foco visible, objetivos táctiles suficientes y una ruta completa
  sin movimiento.
- **Do** elegir profundidad tonal y bordes sutiles antes de añadir sombras.
- **Do** permitir que los títulos serif sean expresivos y que los controles sans
  serif sean inequívocos.

### Don't:

- **Don't** introducir estética SaaS, marketplace, IA genérica o plantilla
  saturada.
- **Don't** inventar nuevas habitaciones, materiales o fotografías que sustituyan
  la identidad física del lugar.
- **Don't** usar ámbar como fondo dominante ni añadir colores sin un papel durable.
- **Don't** aplicar cápsulas a tarjetas o contenido puramente editorial.
- **Don't** secuestrar el desplazamiento, reproducir video automáticamente ni
  depender de animación para comprender o usar la página.

# SPEC-v2 · Dirección B «Cuaderno de margen»

v2.1 2026-10-27: Aldo aprueba; sale maps-03
v2.1 2026-10-27 (misma pasada): respuestas de Aldo sobre gong, murales, letrero, libros usados y nuevos, carta del café, permisos, local anterior y camioneta
v2.1 2026-10-27: Aldo confirma que las 3 «oficial-*» son de Matamoros; autor y fecha siguen [pendiente]

Librería Itinerante y Más · Monterrey · 27 oct 2026 (hora de Ciudad de México)
Solo especificación. No se tocó el código del sitio, no hubo deploy y no se generó ninguna imagen.

Archivos de apoyo en `docs/cuaderno-de-margen/spec/v2/`:

- `paleta-v2.png`: muestras de color y pares de contraste
- `contacto-1-portada-casa.png` y `contacto-2-patio-agenda-visita.png`: fotos elegidas por sección, con el punto focal marcado
- `palette_check.py`, `palette_check.txt` y `palette.json`: cálculo de contraste WCAG, reproducible con `python3 v2/palette_check.py`
- `fotos.json`: recorte, tamaño y crédito de cada foto
- `crops/`: recortes de referencia (vista previa, no son assets finales)
- `sheets.py`: genera las hojas de contacto y la paleta

Reglas que no cambian: no inventar datos del negocio, no usar imágenes generadas, no usar rayas largas en el texto. Lo que no está confirmado se marca **[pendiente]** y no se publica como hecho.

---

## 1. Dirección B, ajustada

El sitio se lee como la página de un cuaderno. Hay una columna de texto, un margen a la izquierda con notas breves y fotos reales de la casa pegadas sobre la hoja. Las notas señalan algo concreto de cada foto, como la silla turquesa, el tablero de ajedrez o el muro de piedra.

Cambios respecto a la v1:

1. **Solo fotos oficiales.** Se usan las de Instagram (@sharonmirelesgong y @alfonso_boeta) y, con reserva, dos capturas de Google Maps. Cada foto lleva su crédito. Ya no hay recorrido cinematográfico.
2. **La paleta sale de los materiales de la casa**: cantera, cal, madera, damero, sillas turquesa y verdes del patio. Quitamos el rojo de lápiz de la v1 porque podía confundirse con el papel picado. Las notas ahora van en color madera.
3. **El papel picado y los murales de temporada se vuelven una capa aparte**, que se activa por fechas y está apagada por defecto.
4. **El café ya se puede mencionar**, porque Aldo lo confirmó. El ajedrez también. El gong queda fuera: Aldo cree que no hay.
8. **Solo el local actual.** Ningún texto ni foto menciona o muestra el local anterior. Todas las fotos son de Matamoros 421 (las «oficial-*» confirmadas por Aldo; fecha **[pendiente]**).
5. **La agenda pasa a una plantilla «Próximamente»** sin nombres ni fechas de talleres.
6. **Las notas manuscritas se dejan como espacios marcados (N1 a N8).** Mientras llegan los trazos de Aldo, se muestran en tipografía itálica.
7. **El tamaño de las fotos está limitado.** Las de Instagram miden 1080 px, así que ninguna va a sangre completa en escritorio (ver sección 5).

Movimiento: solo `transform` y `opacity`, con `IntersectionObserver`. Nada se mueve con el scroll y no se rota ninguna foto. Con `prefers-reduced-motion: reduce` todo queda estático y las notas se ven desde el inicio.

---

## 2. Paleta base

Muestreada este turno (median-cut con PIL y promedio por tono saturado) de ig-01, ig-03, ig-04, ig-07, ig-08, ig-09, ig-12 y maps-01, sin el 8 % inferior de cada imagen. En la v2.1 se volvió a comprobar sin maps-03: los ocho tokens muestreados siguen presentes en esas fotos (entre 0.14 % y 9.19 % de los píxeles a 24 niveles RGB o menos), así que la paleta no cambia. No incluye rojos, magentas ni azules de papel picado.

| Token | Hex | Origen | Uso |
|---|---|---|---|
| `--papel` | #f5f0e7 | cal #e8e6e0 y cantera #d7c5ae, aclaradas | fondo principal |
| `--cal` | #e8e6e0 | muestreado (muros, mosaico claro) | fondo alterno de sección |
| `--cantera` | #d7c5ae | muestreado (piedra clara) | fichas, marcos de foto, filetes gruesos |
| `--hollin` | #1d1411 | muestreado (sombras de madera y piedra) | texto principal |
| `--piedra` | #5a4037 | muestreado (piedra oscura) | texto secundario, pies de foto |
| `--madera` | #845635 | muestreado (madera de libreros) | notas al margen, línea del margen |
| `--turquesa` | #2d7a70 | muestreado (sillas y bancas) | decoración y texto de 24 px o más |
| `--turquesa-tinta` | #236861 | #2d7a70 oscurecido | enlaces, botones, anillo de foco sobre claro |
| `--patio` | #5d7339 | muestreado (plantas del patio) | acento, etiquetas |
| `--mosaico` | #373731 | muestreado (mosaico negro del damero) | fondo oscuro (pie de página, Visita) |
| `--menta-logo` | #5dc4b4 | color del logo | solo la placa del logo, y enlaces y foco sobre `--mosaico` |

Contraste calculado por script (`v2/palette_check.txt`). AA pide 4.5:1 para texto normal y 3:1 para texto grande y anillos de foco.

| Texto | Fondo | Ratio | Resultado |
|---|---|---|---|
| hollin | papel | 15.94 | AAA |
| piedra | papel | 8.32 | AAA |
| madera | papel | 5.50 | AA |
| turquesa-tinta | papel | 5.74 | AA |
| turquesa | papel | 4.48 | solo texto de 24 px o más (o 18.66 px en negrita) |
| patio | papel | 4.65 | AA |
| hollin | cal | 14.50 | AAA |
| piedra | cal | 7.57 | AAA |
| madera | cal | 5.00 | AA |
| turquesa-tinta | cal | 5.22 | AA |
| hollin | cantera | 10.76 | AAA |
| piedra | cantera | 5.62 | AA |
| madera | cantera | 3.71 | solo texto grande |
| turquesa-tinta | cantera | 3.87 | solo texto grande |
| papel | mosaico | 10.55 | AAA |
| cal | mosaico | 9.60 | AAA |
| cantera | mosaico | 7.12 | AAA |
| menta-logo | mosaico | 5.72 | AA |
| papel (botón) | turquesa-tinta | 5.74 | AA |
| papel (botón) | hollin | 15.94 | AAA |
| foco turquesa-tinta | papel | 5.74 | pasa 3:1 |
| foco menta-logo | mosaico | 5.72 | pasa 3:1 |

Reglas:

- Las notas al margen sobre `--cantera` van en `--hollin` o `--piedra`, nunca en madera.
- Si se usa `--turquesa`, es en texto grande. Para texto normal se usa `--turquesa-tinta`.
- La menta del logo sobre papel da 1.85, así que el logo siempre va dentro de su placa.
- No se usan grises fríos ni la menta y el teal de la v1 fuera del logo.

```css
:root{
  --papel:#f5f0e7; --cal:#e8e6e0; --cantera:#d7c5ae;
  --hollin:#1d1411; --piedra:#5a4037; --madera:#845635;
  --turquesa:#2d7a70; --turquesa-tinta:#236861; --patio:#5d7339;
  --mosaico:#373731; --menta-logo:#5dc4b4;
}
```

---

## 3. Capa de temporada (aparte de la base)

Se activa con `<html data-temporada="muertos">` y está apagada por defecto. Las fechas de activación son **[pendiente]**. Los colores salen de la foto del papel picado (`oficial-mesa-compartida.webp`, franja superior) y del mantel naranja.

| Token | Hex | Ratio sobre papel | Uso permitido |
|---|---|---|---|
| `--muertos-morado` | #42327b | 9.37 | texto y fondo (papel sobre morado: 9.37) |
| `--muertos-rosa-viejo` | #893a4d | 6.66 | texto |
| `--muertos-magenta` | #b74396 | 4.35 | texto de 24 px o más, o decoración |
| `--muertos-azul` | #1c90c9 | 3.15 | texto de 24 px o más, o decoración |
| `--muertos-cempasuchil` | #d19027 | 2.39 | solo decoración. Como texto, solo sobre hollín (6.66) |

Qué cambia cuando la capa está activa:

- aparece una tira de papel picado arriba de la portada, dibujada en SVG con formas geométricas (es un ornamento, no una foto)
- se muestra la ficha estacional con `oficial-mesa-compartida.webp`
- el subrayado de los enlaces pasa a magenta

Qué no cambia: los tokens base de texto y fondo. La capa no sustituye la paleta, solo se suma.

**Navidad [pendiente]:** no hay foto oficial de la decoración de diciembre. No se definen tokens hasta tenerla.

---

## 4. Tipografía y retícula

- **Alegreya** (400, 500, 700 e itálica) para títulos, texto corrido y notas.
- **Alegreya Sans** (400 y 500) para navegación, botones, horarios y pies de foto, con cifras tabulares (`font-variant-numeric: tabular-nums`) en el horario.
- Se quitan Playfair Display e Inter.

| Rol | Tamaño | Interlínea | Fuente |
|---|---|---|---|
| Portada (h1) | clamp(2.5rem, 4.2vw, 4.25rem) | 1.05 | Alegreya 500 |
| Sección (h2) | clamp(1.875rem, 3vw, 2.75rem) | 1.1 | Alegreya 500 |
| Texto | 1.125rem | 1.6, máximo 62ch | Alegreya 400 |
| Nota al margen | 1.0625rem | 1.4 | Alegreya itálica, color madera |
| Datos y botones | 1rem | 1.4 | Alegreya Sans 500 |
| Pie de foto y crédito | 0.9375rem (mínimo 15 px) | 1.4 | Alegreya Sans 400, color piedra |

Retícula:

- **Escritorio:** contenedor de 1200 px y 12 columnas. Las columnas 1 y 2 son el margen del cuaderno, con una línea vertical de 1 px en `--madera` al 40 %. El texto va en las columnas 3 a 7 y las fotos en las columnas 6 a 12.
- **Móvil (390 px):** una columna con 20 px de márgenes laterales. Las notas bajan debajo de cada foto con una sangría de 16 px y la línea de margen a la izquierda.
- Botones y enlaces táctiles miden al menos 48 × 48 px. Los botones tienen esquinas de 4 px, nada de píldoras.
- El foco se marca con `outline: 3px solid var(--turquesa-tinta); outline-offset: 3px`.

Por sección:

1. **Encabezado.** Placa del logo y cuatro enlaces (La casa, Patio y café, Agenda, Visita) más un botón de WhatsApp. En móvil se reduce a logo, «Visita» y WhatsApp.
2. **Portada, sobre papel.** A la izquierda van la dirección, el h1, una frase y el horario. A la derecha, ig-01 con un ancho máximo de 640 px. Las notas N1 y N2 van en el margen y apuntan a la foto.
3. **El nombre, sobre cal.** Composición solo tipográfica. Se presenta la definición como si fuera una entrada de diccionario, con el lema en Alegreya 700 y la etimología en itálica. A la derecha va el logo a 160 px, dentro de su placa, sin texto al lado.
4. **La casa por dentro, sobre papel.** Un recorrido de cinco fichas. Las fotos se alternan a la izquierda y a la derecha, cada una con su nota (N3 a N7) en el margen.
5. **Patio y café, sobre cal.** ig-12 grande, con ig-07 e ig-08 en una fila de dos debajo. La ficha del café lleva un hueco marcado «[pendiente: foto del menú actual]» con el mismo tamaño de ficha (4:5, 420 px como máximo) y los muros del patio van en una fila aparte. El hueco no se publica: hasta tener la foto, la ficha muestra solo el texto del café.
6. **Agenda, sobre papel.** ig-09 a la izquierda y la plantilla «Próximamente» a la derecha.
7. **Visita, sobre mosaico.** Dirección, horario y cierres a la izquierda. maps-01 a la derecha, con un ancho máximo de 420 px. En lugar del iframe de Maps hay un botón «Abrir en Google Maps».
8. **Pie de página, sobre mosaico.** Logo, datos, redes y la lista de créditos de las fotos.

Movimiento de la firma visual:

- Cada nota es un `<button>`. Al pasar el cursor o enfocarla, aparece sobre la foto un aro de 2 px en `--madera` en las coordenadas de la nota (porcentajes guardados en `data-x` y `data-y`). El aro va de opacity 0 a 1 y de scale .96 a 1 en 200 ms con `cubic-bezier(.2,.7,.2,1)`.
- Las notas entran con opacity 0 a 1 y translateX(-8px) a 0 en 220 ms, una vez, al entrar en pantalla.

---

## 5. Fotos por sección

Regla de tamaño: la foto se ve nítida en pantallas retina hasta la mitad de su ancho en píxeles. El tope duro es el ancho dividido entre 1.25, que equivale a no ampliar más de 1.25×. A las capturas de Maps se les quita la barra de Google, más o menos los 73 px inferiores.

| Sección | Archivo | Recorte (px de origen) y foco | Por qué | Crédito | Máx. css · nítido 2x | Alerta |
|---|---|---|---|---|---|---|
| Portada | ig-01.jpg | x 108–972, y 0–1080 (4:5). Foco 50 % / 42 %, en la ventana y la mesa | Es la vista que resume la casa: libreros al techo, damero y sillas turquesa | Foto: @sharonmirelesgong **[pendiente: permiso]** | 691 · 432 | En escritorio no va a sangre. Se usa a 640 px como máximo |
| El nombre | sin foto | | La gráfica ig-14 tiene erratas («itinĕrants», «itenrāri»), así que la definición se compone en texto | | | |
| La casa | ig-04.jpg | Completo 1:1. Foco 68 % / 55 %, en la silla y la ventana | Estantes junto a la ventana y la silla turquesa (nota N3) | Foto: @sharonmirelesgong **[pendiente: permiso]** | 864 · 540 | |
| La casa | ig-03.jpg | Completo 1:1. Foco 25 % / 50 %, en el libro antiguo | Libro antiguo con el muro de piedra y cuadros detrás (N4) | Foto: @sharonmirelesgong **[pendiente: permiso]** | 864 · 540 | |
| La casa | ig-02.jpg | Completo 1:1. Foco al centro, en el globo | Detalle pequeño entre libros (N5). Ficha de 320 px | Foto: @sharonmirelesgong **[pendiente: permiso]** | 864 · 540 | |
| La casa | oficial-mesa-1600.webp | Completo 4:3. Foco 50 % / 60 % | Mesa de libros frente al muro de piedra (N6). El muro de piedra con repisa de madera coincide con ig-03 e ig-04 | **[pendiente: autor y permiso]** | 1280 · 800 | Sede actual (Matamoros), confirmada por Aldo. Fecha **[pendiente]** |
| La casa | oficial-rincon-1600.webp | Completo 4:3. Foco 45 % / 50 % | Cuadros sobre el muro de piedra y la silla roja (N7). La repisa de madera bajo los cuadros coincide con ig-03 | **[pendiente: autor y permiso]** | 1280 · 800 | Sede actual (Matamoros), confirmada por Aldo. Fecha **[pendiente]** |
| Patio y café | ig-12.jpg | y 60–1410 (4:5). Foco 62 % / 66 %, en la mesa de carrete | Patio con luces, plantas y sillas tejidas. Es la foto grande de la sección | Foto: @alfonso_boeta **[pendiente: permiso]** | 864 · 540 | |
| Patio y café | ig-07.jpg | Completo 1:1. Foco 45 % / 72 %, en el tablero | Ajedrez en el patio (N8), confirmado por Aldo | Foto: @sharonmirelesgong **[pendiente: permiso]** | 864 · 540 | |
| Patio y café | ig-08.jpg | Completo 1:1. Foco 40 % / 55 % | Pasillo del patio con plantas y sillas | Foto: @sharonmirelesgong **[pendiente: permiso]** | 864 · 540 | |
| Patio y café | «[pendiente: foto del menú actual]» | 4:5, foco en la carta | Ficha del café. Debe ser del local de Matamoros 421 | **[pendiente]** | se define con la foto | No se publica vacío |
| Patio y café | ig-13.jpg | Completo 3:4. Foco 55 % / 40 %, en la cabeza del venado | Mural del venado azul. Aldo cree que es permanente | Foto: @alfonso_boeta **[pendiente: permiso]** | 864 · 540 | Autor del mural **[pendiente]** |
| Patio y café | ig-10.jpg | Completo 3:4. Foco 50 % / 45 % | Mural con raíces. Aldo cree que es permanente | Foto: @alfonso_boeta **[pendiente: permiso]** | 864 · 540 | Autor del mural **[pendiente]** |
| Agenda | ig-09.jpg | y 90–1440 (4:5). Foco 50 % / 70 %, en las sillas | El salón con sillas en fila, listo para una actividad | Foto: @alfonso_boeta **[pendiente: permiso]** | 864 · 540 | |
| Visita | maps-01.jpg | x 0–837, y 0–1040. Foco 35 % / 45 %, en la placa del logo | Única foto de la fachada actual, con la puerta, la placa y el letrero «Libros desde $10» | Imagen: Google, oct 2026 **[pendiente: permiso]** | 669 · 418 | **Baja resolución.** Es imagen de Google, así que hay que revisar la licencia. Mejor una foto propia de la fachada |
| Temporada | oficial-mesa-compartida.webp | Completo. Foco 50 % / 30 %, en el papel picado | Papel picado y mantel de Día de Muertos. Sede actual (Matamoros), confirmada por Aldo | **[pendiente: autor y permiso]** | 317 · 198 | **Baja resolución.** Solo como ficha pequeña y solo en temporada. Fecha **[pendiente]** |

En reserva, sin uso por ahora: ig-06 (patio con amarilis rojas) e ig-11 (muro del patio en blanco y negro).

Formatos: AVIF con WebP de respaldo, en dos anchos (el máximo y la mitad), con `width` y `height` explícitos. ig-01 se precarga como LCP. La imagen OG sale de ig-01 a 1080 × 567. No se amplía a 1200 × 630.

---

## 6. Texto completo (español)

Fuentes de cada dato: respuestas de Aldo (A1 a A10), `fotos-oficiales/SOURCES.md` (IG) y los datos que ya estaban en el sitio (dirección, horario, WhatsApp y redes). Lo que está entre corchetes no se publica hasta confirmarse.

**Meta**

- Título: Librería Itinerante y Más · Centro de Monterrey
- Descripción: Librería con café en Mariano Matamoros Pte. 421, Centro de Monterrey. Abre de lunes a sábado de 11:00 a 20:00.

**Encabezado**

- Enlaces: La casa · Patio y café · Agenda · Visita
- Botón: WhatsApp

**Portada**

- Antetítulo: Mariano Matamoros Pte. 421 · Centro, Monterrey
- h1: Librería Itinerante y Más
- Frase: Libros usados y nuevos, café y un patio en una casa del Centro.
- Horario: Abrimos de lunes a sábado, de 11:00 a 20:00. El domingo cerramos.
- Botones: Escríbenos por WhatsApp · Cómo llegar
- Pie de foto (ig-01): El salón principal, con piso de damero. Foto: @sharonmirelesgong **[pendiente: permiso]**
- N1 [manuscrita pendiente]: las sillas turquesa
- N2 [manuscrita pendiente]: la ventana del fondo

**El nombre**

- Lema: Itinerante
- Definición: Del latín *itinĕrans*, viajero. Ambulante.
- Texto: El proyecto empezó en 2020. Hoy estamos en Matamoros 421, entre Juan Aldama e Ignacio Rayón.
- Junto al logo: sin texto. El logo va solo, con su `alt` «Logo de Librería Itinerante y Más».

**La casa por dentro**

- h2: La casa por dentro
- Entrada: Los libreros llegan hasta el techo y los muros son de piedra. Al fondo del salón hay una ventana grande.
- N3 (ig-04) [manuscrita pendiente]: aquí se lee con luz de la tarde **[pendiente: confirmar orientación. Si no se confirma: «junto a la ventana»]**
- N4 (ig-03) [manuscrita pendiente]: un libro antiguo
- N5 (ig-02) [manuscrita pendiente]: el globo terráqueo
- N6 (oficial-mesa) [manuscrita pendiente]: la mesa de libros
- N7 (oficial-rincón) [manuscrita pendiente]: cuadros en la piedra
- Párrafo: ¿Buscas un título en especial? Mándanos el nombre por WhatsApp y te decimos si lo tenemos.
- Precio: Hay libros desde $10.

**Patio y café**

- h2: Patio y café
- Entrada: La casa tiene un patio con plantas, luces colgadas y una mesa hecha con un carrete de cable.
- Café: También hay café. La carta se llama «Café Itinerante». **[pendiente: precios]**
- Ficha del café: «[pendiente: foto del menú actual]»
- Ajedrez: En el patio hay un tablero de ajedrez.
- N8 (ig-07) [manuscrita pendiente]: ¿una partida?
- Muros: Dos muros del patio están pintados, uno con un venado azul y otro con raíces. **[pendiente: autor de los murales, para dar crédito]**

**Agenda**

- h2: Agenda
- Plantilla de cada taller: etiqueta «Próximamente» / [Nombre del taller, pendiente] / [Fecha y hora, pendiente] / [Quién lo imparte, pendiente] / [Costo y cupo, pendiente] / botón «Apartar lugar por WhatsApp»
- Estado vacío (lo que se publica hoy): Próximamente. Cuando haya fechas de talleres las publicamos aquí y en Instagram.
- Botón: Ver Instagram
- Pie de foto (ig-09): El salón con sillas en fila. Foto: @alfonso_boeta **[pendiente: permiso]**

**Visita**

- h2: Cómo llegar
- Dirección: Mariano Matamoros Pte. 421, Centro, Monterrey, N. L. Entre Juan Aldama e Ignacio Rayón.
- Horario: lunes a sábado de 11:00 a 20:00 / domingo cerrado
- Cierres: Cerramos en Navidad y Año Nuevo. **[pendiente: fechas exactas]** Si vienes en día festivo, pregúntanos antes por WhatsApp.
- Botones: Abrir en Google Maps · WhatsApp
- Pie de foto (maps-01): La entrada, con el logo junto a la puerta. Imagen: Google **[pendiente: permiso, o reemplazar por una foto propia]**

**Pie de página**

- Librería Itinerante y Más · Mariano Matamoros Pte. 421, Centro, Monterrey · Lunes a sábado de 11:00 a 20:00
- Instagram @libreriaitineranteymasmty · Facebook · WhatsApp
- Créditos: Fotos de @sharonmirelesgong y @alfonso_boeta. Fachada tomada de Google Maps. **[pendiente: permiso de cada fotógrafo y de Google; autor de las fotos de la mesa, el rincón y el papel picado]**

**Temporada de Día de Muertos (solo con la capa activa)**

- Ficha: Papel picado en la mesa larga, por la temporada.
- Fechas de la capa: **[pendiente]**

**Textos alternativos (alt)**

| Foto | Alt |
|---|---|
| ig-01 | Salón con libreros hasta el techo, piso de damero blanco y negro, mesa redonda con sillas turquesa y una ventana al fondo. |
| ig-04 | Estantes llenos de libros junto a una ventana, con una silla turquesa. |
| ig-03 | Libro antiguo de lomo gastado frente a un muro de piedra con cuadros. |
| ig-02 | Globo terráqueo antiguo entre libros. |
| ig-12 | Patio con luces colgadas, plantas, sillas tejidas y una mesa hecha con un carrete de cable. |
| ig-07 | Tablero de ajedrez sobre una mesa del patio. |
| ig-09 | Salón con sillas en fila frente a una ventana. |
| maps-01 | Puerta de piedra de la librería con la placa del logo y un letrero de libros desde 10 pesos. |

---

## 7. Implementación

### P0, antes de publicar nada

| # | Tarea | Hecho cuando |
|---|---|---|
| P0.1 | Quitar todo el recorrido generado: frames de Higgsfield 01 a 07 (escritorio y móvil), el póster, los dos MP4, el JS y el CSS de scrub, el velo, la barra de progreso, el espaciador, el control de movimiento y `data-canonical-model` | `rg -i "higgsfield\|scrub\|cinematic\|canonical-model\|<video" public` devuelve 0 resultados y la carpeta de frames no existe |
| P0.2 | Quitar el gong (ig-05 y la recreación 06) | `rg -i "gong\|ig-05"` en el código y el texto da 0. «sharonmirelesgong» solo aparece en créditos |
| P0.3 | Poner crédito a cada foto | Cada `<figure>` tiene `<figcaption>` con su crédito. Las fotos de Maps no se publican sin permiso o reemplazo documentado |
| P0.4 | Cambiar el texto al de la sección 6, sin lo marcado como pendiente | Ninguna línea **[pendiente]** llega a producción. `rg -i "descubr\|sumérg\|curad\|más que\|rincones con historia\|padre mier\|836\|local anterior\|camioneta"` en el texto visible da 0 y no queda ninguna raya larga (U+2014). Los nombres de taller de la v1 no aparecen |
| P0.5 | Aplicar los tokens de color y tipografía | Solo existen los tokens de las secciones 2 y 3. `python3 palette_check.py` pasa en todos los pares usados. No se cargan Playfair ni Inter |

### P1, la dirección B completa

| # | Tarea | Hecho cuando |
|---|---|---|
| P1.1 | Portada con ig-01 a 640 px como máximo, precargada, en AVIF y WebP de 864 y 432 px | En Lighthouse móvil, LCP < 2.5 s. La página inicial en móvil pesa ≤ 600 KiB |
| P1.2 | Componente de nota al margen y foto, con aro sobre la foto y entrada con IntersectionObserver | Cada nota se alcanza con Tab, el aro aparece con foco y con hover, y con movimiento reducido todo está quieto y visible |
| P1.3 | Secciones La casa y Patio y café según la sección 4 | A 390 px no hay scroll horizontal. Las notas quedan debajo de cada foto |
| P1.4 | Agenda con datos en `talleres.json` y estado vacío | Con `[]` se ve el texto «Próximamente». Con un taller se ven sus cinco campos. No hay fechas de ejemplo en producción |
| P1.5 | Visita con botón a Maps en lugar del iframe | No queda ningún iframe. El botón abre la ficha de Maps de Matamoros 421 |
| P1.6 | Respetar los tamaños máximos | Un script de Playwright mide el ancho que ocupa cada `<img>` en pantalla contra su ancho real en píxeles (`naturalWidth`) y falla si alguna se amplía más de 1.25× a DPR 1 |

### P2, capas y acabados

| # | Tarea | Hecho cuando |
|---|---|---|
| P2.1 | Capa de Día de Muertos con `data-temporada`, por fechas de configuración y apagada por defecto | Sin la capa no hay rastro de papel picado. Con la capa aparecen la tira SVG y la ficha, y los pares de color pasan el script |
| P2.2 | Cambiar las notas tipográficas N1 a N8 por las manuscritas de Aldo | Cada nota manuscrita es un SVG o un PNG a 2x, con su texto como `aria-label`. El texto en itálica queda como respaldo |
| P2.3 | Capa de Navidad | Hay foto oficial y tokens nuevos con contraste revisado. Sin eso no se hace |
| P2.4 | Meta y OG nuevos | La tarjeta OG usa ig-01 a 1080 × 567 y la descripción de la sección 6 |
| P2.5 | Cambiar maps-01 por una foto propia de la fachada y llenar el hueco «[pendiente: foto del menú actual]» con una foto del café en Matamoros 421 | No queda ninguna foto de Google en el sitio y ninguna foto es anterior a marzo de 2026 |

---

## 8. Lo que se quita

- **Recorrido generado.** Los frames 01 a 07 de Higgsfield (escritorio y móvil), el póster, los dos MP4 y todo el código del scrub.
- **Gong.** ig-05 y la recreación 06. Aldo cree que no hay gong.
- **Atributo y control de movimiento.** `data-canonical-model` y el control de movimiento.
- **Paleta y fuentes de la v1.** La paleta fría de menta y teal (la menta queda solo en el logo), Playfair Display e Inter.
- **Rojo de lápiz de la v1** (#a33a2a). Lo reemplaza `--madera` para que no se confunda con el papel picado.
- **Papel picado y mural de la mesa larga como parte de la base.** Pasan a la capa de temporada.
- **Talleres de la v1.** Los cuatro nombres (Escritura creativa, Círculos de lectura, Teatro gestual, Fotografía narrativa) y sus descripciones. Los reemplaza la plantilla «Próximamente».
- **Iframe de Google Maps.**
- **Fotos viejas en baja resolución.** oficial-sala (390 px), oficial-encuentro (390 px) y oficial-estantes (224 px). Las reemplazan ig-01, ig-09 e ig-04.
- **Fotos de Maps que no sirven.**
  - maps-02 es de oct 2022, anterior a la mudanza de marzo de 2026, así que no puede ser de Matamoros. Muestra libreros blancos con juguetes, que no aparecen en ninguna foto actual. Además tiene la interfaz de Google encima.
  - maps-03 (carta «Café Itinerante») es de sept 2024, también anterior a la mudanza. Sale en la v2.1 por decisión de Aldo.
  - maps-04 es de jun 2023, anterior a la mudanza.
  - maps-05 es de abr 2022, anterior a la mudanza, y muestra a una persona identificable.
- **Cualquier mención del local anterior y la línea sobre la camioneta.** Por indicación de Aldo.
- **Gráficas ig-14 a ig-18 como imágenes.** Solo sirven como fuente de datos.
- **Texto con muletillas de la v1**, como «rincones con historia» y las frases de tres elementos.
- **Lo que deja de quitarse:** el café. Se menciona porque Aldo lo confirmó.

---

## 9. Preguntas abiertas para Aldo

Resueltas en v2.1: gong (fuera), murales (permanentes), letrero de $10 (vigente), libros usados y nuevos (sí), nombre de la carta (el mismo), local anterior (no se menciona) y camioneta (sin texto).

1. ¿En qué fechas se activa la capa de Día de Muertos? ¿Qué decoración ponen en diciembre? Necesitamos una foto.
2. ¿Quién pintó los murales del venado y de las raíces?
3. Foto del menú actual del café, tomada en Matamoros, y precios.
4. Permisos: @sharonmirelesgong, @alfonso_boeta y la fachada de Google Maps. Lo mejor sería una foto propia de la fachada.
5. Autor, fecha y permiso de las fotos «oficial-*» (mesa, rincón y papel picado). La sede (Matamoros) ya está confirmada.
6. ¿Qué fechas exactas cierran en Navidad y Año Nuevo?
7. Fechas y nombres de los talleres, cuando existan.
8. ¿Cuándo hacemos la sesión de notas manuscritas? Son ocho notas (N1 a N8).

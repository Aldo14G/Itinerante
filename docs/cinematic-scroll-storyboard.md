# Storyboard maestro del recorrido cinematográfico

## Intención

El desplazamiento vertical del sitio representa una sola entrada en primera persona a la Librería Itinerante y Más. La cámara no salta entre fotografías ni transforma una habitación en otra: avanza, cruza umbrales y gira dentro de una geometría continua.

La continuidad física confirmada es:

**pasillo → vano de acceso → giro hacia el centro/izquierda → sala principal → zonas de exploración → mesa de libros → catálogo → visita**

## Recorrido por capítulos

| Progreso aproximado | Espacio y movimiento | Contenido del sitio | Referencia visual |
| --- | --- | --- | --- |
| 0–14 % | Avance lento por el pasillo, a altura de los ojos. | Preludio visual; marca discreta. | `real-space-07-corridor-captioned-reference.png` |
| 14–25 % | Cruce del vano. El marco ocupa brevemente el encuadre y oculta el primer empalme. | Entrada al Home. | `real-space-08-cozy-area-captioned-reference.png` |
| 25–38 % | Giro progresivo hacia el centro/izquierda hasta abrir la sala completa. | Titular del Home, propuesta de valor, CTA principal y botón de Iti IA. | `real-space-01-reading-room.png` |
| 38–50 % | La mirada se desplaza hacia los libreros y la ventana, sin cambiar la altura de cámara. | Experiencia. | `real-space-02-window-shelves.png` |
| 50–62 % | Avance corto hacia la mesa comunitaria; el ajedrez entra al primer plano. | Talleres y actividades. | `real-space-05-chess-community-table.png` |
| 62–71 % | Giro suave hacia la zona de lectura y sonido. | Continuidad de agenda y comunidad. | `real-space-06-sound-reading-room.png` |
| 71–78 % | Acercamiento a la mesa de libros. Una pila cruza el primer plano y permite un segundo empalme invisible. | Transición del espacio físico al descubrimiento editorial. | `real-space-03-book-table-detail.png` |
| 78–91 % | La cámara queda inmóvil. El plano físico cede profundidad y contraste al catálogo. | Catálogo, búsqueda, categorías, portadas e Iti IA. | Interfaz funcional, sin video compitiendo detrás. |
| 91–100 % | La profundidad del espacio regresa de manera sutil, sin reiniciar la caminata. | Visita, dirección, mapa, horarios y contacto. | Plano estable derivado de la sala principal. |

## Lenguaje de cámara

- Altura visual constante entre 1.60 y 1.70 m.
- Lente equivalente constante, de apariencia natural; evitar gran angular extremo.
- Movimiento frontal lento, estabilizado y con una oscilación humana apenas perceptible.
- Giros motivados de 30–45°, sin paneos violentos ni cambios súbitos de eje.
- Sin zoom digital, efecto vértigo, vuelo de dron, cámara orbital ni aceleraciones artificiales.
- Exposición, temperatura de color y hora del día coherentes durante todo el recorrido.
- Los objetos reales, la arquitectura y la distribución de los libros deben conservarse; la generación no inventará nuevas habitaciones.

## Empalmes permitidos

Los únicos cortes entre segmentos se ocultarán mediante oclusiones físicas:

1. el marco del vano al pasar del pasillo a la sala;
2. un muro o lateral de librero durante un giro;
3. una pila de libros muy cercana antes del catálogo.

Cada segmento deberá comenzar desde el fotograma final del anterior. No se utilizarán morphs, disoluciones largas entre ángulos incompatibles ni interpolaciones que deformen paredes, estantes, textos o portadas.

## Comportamiento de interfaz

- El progreso cinematográfico responde al scroll nativo; no secuestra la rueda ni obliga a terminar la animación.
- Al desplazarse hacia arriba, el recorrido retrocede de forma coherente.
- Los textos aparecen cuando la cámara ya ha orientado al visitante dentro del espacio.
- El movimiento se detiene al entrar al catálogo para proteger búsqueda, lectura y selección.
- Iti IA aparece como acceso secundario en el Home y como herramienta contextual dentro del catálogo; no como elemento flotante permanente sobre todas las escenas.
- FAQ, dirección, mapa, horarios y contacto permanecen calmados y legibles.

## Adaptaciones obligatorias

### Móvil

- Mantener la misma ruta espacial, con menor duración y giros recortados.
- Usar encuadres verticales derivados del eje original, sin inventar una segunda trayectoria.
- Evitar bloques de scroll excesivamente largos y mantener accesibles los controles.

### Movimiento reducido

- Sustituir el recorrido por fotogramas clave estáticos.
- Permitir fundidos breves de opacidad, sin interpolación espacial.
- Mostrar todo el contenido y la navegación sin depender de la animación.

### Rendimiento

- Cargar primero el fotograma inicial y solicitar los segmentos posteriores de forma progresiva.
- Mantener una imagen de respaldo para cada capítulo.
- No reproducir video detrás del catálogo ni de la información de visita.

## Uso de las referencias

- Las fotografías 07 y 08 contienen texto incrustado y solo sirven como referencia de geometría y recorrido; no se publicarán directamente.
- La botella azul de la fotografía 04 es un detalle opcional. Solo se incluirá si puede ubicarse sin romper el eje espacial; de lo contrario, se descarta.
- La generación cinematográfica deberá apoyarse en las fotos reales y no reemplazar la identidad del lugar por una librería genérica.

## Criterio de aceptación

La secuencia se aprueba únicamente si, al verla sin textos, una persona puede explicar de forma natural: dónde entró, hacia dónde giró, qué zona recorrió, cómo llegó a los libros y por qué el catálogo aparece en ese momento.

## Producción de storyboard con Higgsfield

Fecha: 26 de agosto de 2026.

Se generó una segunda pasada de siete paneles 16:9 utilizando las fotografías reales como un único elemento de entorno de Higgsfield (`itinerante-interior`). Esta pasada reemplaza como candidata a la exploración inicial de Soul Cinema, que reinterpretaba demasiado la arquitectura.

La lámina completa está en:

`images/cinematic/storyboard/candidate/00-storyboard-contact-sheet.jpg`

Los fotogramas individuales candidatos están en:

`images/cinematic/storyboard/candidate/`

La primera exploración permanece separada y no debe usarse en la implementación:

`images/cinematic/storyboard/explorations/soul-cinema-v1/`

### Estado de revisión

- Paneles 01 y 03–07: aceptables como referencias de composición y continuidad narrativa.
- Panel 02: requiere corrección antes de animarse. Higgsfield conservó el vano y eliminó el texto incrustado, pero alteró el color y la geometría del piso. No debe emplearse como fotograma final ni como autoridad del espacio.
- Ningún panel generado sustituye a las fotografías reales como fuente de verdad arquitectónica.
- La producción de video solo debe comenzar cuando el panel 02 conecte físicamente el piso y el eje de cámara de los paneles 01 y 03.

## Candidato de video de Google Flow

El primer clip entregado se conserva en:

`images/cinematic/video/candidates/flow-entrada-sala-v1.mp4`

Estado: **candidato no aprobado para runtime**.

- Duración: 8 segundos; resolución: 1280 × 720; peso: 5,463,367 bytes.
- Conserva un avance frontal comprensible desde el pasillo hacia la sala y mantiene un horizonte estable.
- Reinterpreta mobiliario, iluminación y detalles del espacio, por lo que no sustituye a las fotos reales como fuente de verdad.
- La revisión por fotogramas detectó una retención temporal entre las muestras de 2 y 4 segundos; debe verificarse o regenerarse antes de mapearse al scroll.
- Solo cubre el establecimiento del Home. No resuelve los capítulos de Talleres, transición material a Libros, catálogo ni Visita.
- No se conectará al sitio hasta que pase continuidad, reproducción móvil, movimiento reducido y rendimiento.

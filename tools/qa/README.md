# Arnés de verificación en Chromium

Scripts que abren el sitio en Chrome headless por CDP y miden lo que importa. Todos reciben la URL de una vista previa (`PORT=8500 node tools/preview-site.mjs`). Cambia el navegador con `CHROME_PATH`. Los que generan imágenes las escriben en el directorio actual: ejecútalos desde una carpeta temporal.

| Script | Qué comprueba | Falla (código ≠ 0) |
|---|---|---|
| `run.mjs` | Levanta su propia vista previa y corre explorer, saved, rail, skeleton, contrast, ficha y axe (`npm run test:browser`). | sí |
| `axe.mjs URL` | axe-core (WCAG 2.x A/AA y buenas prácticas) en inicio, manifiesto revelado, menú con acordeón, Explorar, ficha, Mi lista y catálogo en línea, en 390 y 1280. `AXE_ALL=1` lista también las moderadas y leves. | sí (violaciones serias o críticas) |
| `contrast.mjs URL` | Contraste de texto en todos los estados (secciones, menú, acordeones, ficha, Mi lista, Explorar, aviso) y de las portadas. | sí |
| `skeleton.mjs URL` | Esqueletos del tamaño del contenido y CLS de la carga diferida. | sí |
| `motion.mjs URL` | Transiciones y animaciones disparadas, duraciones frente a tokens y pasada de movimiento reducido. | informa |
| `spacing.mjs URL` | Relleno y alto de cada capítulo, pantallas por capítulo, uso de grid/flex y cuadrícula de 4 px. | informa |
| `rail.mjs URL` | Carrusel de libros: colecciones, teclado, progreso, ficha, foco. | informa |
| `saved.mjs URL` | Guardar, Mi lista, persistencia, aviso y mensaje de WhatsApp. | informa |
| `explorer.mjs URL` | Hoja «Explorar»: modal, URL `#explorar`, botón atrás, ficha encima, escritorio y redimensionar. | informa |
| `e2e.mjs URL DIR` | Auditoría general (desbordes, consola, menú, tonos, barra inferior, cartelera, catálogo, movimiento reducido, rendimiento). | informa |
| `desk.mjs URL` | Escenas de escritorio frente a móvil (qué módulos se descargan). | informa |
| `hero.mjs URL [DIR]` | Contraste real del párrafo del hero móvil con muestreo de píxeles (320×640, 360×640, 375×667, 390×844): captura con el texto transparente y compara los píxeles de cada línea con la tinta; `HERO_SELECTORS` cambia qué texto medir. | sí |
| `feed.mjs URL [DIR]` | Perfil y destacados (≥ 3 visibles), historias (modal, foco, rótulo en cada foto, Escape, atrás), Cartelera como publicaciones (orden encabezado → foto → acciones → texto en el DOM y en pantalla, «Me interesa» y «Compartir» con nombre accesible propio según el árbol de accesibilidad), Novedades (oculta sin datos, pintada con ids; intercepta `collections.json`) y barrido de acciones primarias en 390×844 y 1280×800. | sí |
| `inp.mjs URL [corridas] [cpu] [ancho] [alto]` | INP con CPU limitada (4× por defecto): clics reales en menú (abrir y cerrar), chip del carrusel, guardar y ficha (abrir y cerrar), en frío y con la página en reposo; muestra tareas largas y, con `INP_DETAIL=1`, el desglose de `long-animation-frame`. | sí (> 200 ms o tarea larga > 200 ms al abrir la ficha) |
| `ficha.mjs URL [DIR]` | Ficha móvil con clic real en la tarjeta 2 del carrusel a 360×740, 375×667, 320×640 y 390×844: «Cómo llegar» dentro del primer pliegue sin desplazar la hoja, sello literal sin partir, foco inicial y Escape; foco de teclado real en «Foto siguiente» de una historia (indicador de 44 px, sin marco sobre la zona); sin JavaScript (menú oculto, cuatro capítulos alcanzables). | sí |
| `strip.mjs URL` | Capturas móviles por capítulo (`strip-NN-*.jpg`). | no |
| `palette.py` / `oklch.py` | Croma de las paredes (fotos) frente a la paleta. | no |

Notas de fiabilidad:
- Los clics que abren diálogos usan `Input.dispatchMouseEvent`: Chromium agrupa los diálogos abiertos sin activación del usuario y una tecla Escape cierra todo el grupo. Un `element.click()` de JavaScript no cuenta como activación.
- `e2e.mjs` ya no marca como desborde una `IMG` dentro de `.frame-clip` (escalada 1.22 al revelarse y recortada por su contenedor): ignora lo que recorta un antepasado con `overflow: hidden/clip` que cabe en la ventana. Un fallo de «sin desborde horizontal» es real. Sus métricas de FCP/LCP pueden salir en cero si la máquina está cargada: repite o usa CDP directo.
- `contrast.mjs` omite cabecera, barra inferior y aviso (su fondo es un pseudoelemento o vidrio) y el texto sobre foto: eso lo juzga el crítico con capturas.

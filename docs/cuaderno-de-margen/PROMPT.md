# Prompt para Claude Code · Cuaderno de margen

Copia todo lo que está debajo de la línea y pégalo en Claude Code desde la raíz del repo `C:\Proyectos\Itinerante`, con la rama `agent/atenea/casa-editorial-base` ya descargada.

---

Implementa la dirección de arte aprobada «Cuaderno de margen» en la landing de Librería Itinerante y más. Es un frontend estático (`index.html`, `assets/css`, `assets/js`, `images`) que se construye con `npm run build:public` en `public/` y se publica en Firebase.

## Rama y alcance

- Crea la rama `agent/cuaderno-de-margen` desde `agent/atenea/casa-editorial-base`. Esa base tiene el frontend actual «Casa editorial».
- Solo frontend. No toques el backend (`src/`, Iti IA, API del catálogo, configuración de Supabase o del backend de Firebase). El catálogo e Iti IA siguen pausados.
- Al terminar, sube la rama y abre un PR contra `agent/atenea/casa-editorial-base`. No hagas merge ni deploy.

## Material en esta carpeta (`docs/cuaderno-de-margen/`)

- `spec/SPEC-v2.md`: es el spec obligatorio, versión 2.1, con su registro de cambios arriba. Contiene los tokens de paleta con sus contrastes, la selección de fotos por sección, el copy reescrito, los requisitos P0, P1 y P2 (incluida la verificación P0.4 de contenido pendiente) y los espacios N1–N8 para notas a mano.
- `spec/CRITICA-SPEC.md`: la crítica completa, con 21 señales de diseño genérico de IA que hay que eliminar.
- `spec/RESUMEN-ALDO-v2.md`: resumen corto.
- `spec/v2/`: imagen de la paleta, hojas de contacto con la foto que va en cada sección, recortes, `fotos.json`, `palette.json` y `palette_check.py` para verificar el contraste.
- `RECORRIDO-FOTOS.md`: clasificación de cada foto oficial por parada del recorrido 3D (entrada, salas y patio), con el hero de cada parada y los huecos.
- `fotos/`: fotos oficiales. `ig-01` a `ig-18` vienen del Instagram @libreriaitineranteymasmty a 1080 px; de ellas, `ig-01` a `ig-13` muestran el lugar y `ig-14` a `ig-18` son gráficos. `maps-01` es la fachada actual. Las tres `oficial-*` de la sede actual están en `images/gallery/`. Los créditos y las fuentes están en `fotos/SOURCES.md`.

Importa las fotos que el spec selecciona como derivados optimizados con el mismo método de `scripts/prepare-official-photos.py` y `docs/official-photo-derivatives.json`: registra la fuente y el SHA-256 de cada una. Asegúrate de que `docs/` y estos originales nunca entren al build público; agrega un test 404 para `docs/cuaderno-de-margen/`.

## Decisiones del dueño (obligatorias, ya reflejadas en el spec 2.1)

- **Fotos:** solo fotos oficiales de Instagram y Google Maps, más las tres `oficial-*` actuales, que el dueño confirmó que son de la sede actual en Matamoros.
- **Nada generado:** quita las recreaciones de Higgsfield, los fotogramas, el MP4 y el código del scrub.
- **Sede anterior:** nunca uses fotos de ella. `maps-02` a `maps-05` quedan fuera.
- **Lo que hay en la casa:**
  - No hay gong; no aparece en ningún lado. Ajedrez sí.
  - Hay café. La carta se llama «Café Itinerante»; los precios y una foto de la carta actual están pendientes.
  - Venden libros usados y nuevos, y el letrero «Libros desde $10» sigue vigente.
  - Los murales del venado y de las raíces son permanentes; el autor está pendiente.
- **Papel picado:** es decoración de temporada de Día de Muertos. Va como capa estacional apagada por defecto (`data-temporada="muertos"`), no en la paleta base.
- **Talleres:** solo la plantilla «Próximamente», sin nombres ni fechas inventadas.
- **Historia y nombre:**
  - La historia de la casa se cuenta solo desde su estética, sin hechos ni fechas inventadas.
  - No menciones la sede anterior (Padre Mier) ni la frase «Desde marzo de 2026».
  - No hay línea sobre la van. El logo con la van se queda como marca.
- **Pendientes:** los cierres de Navidad y Año Nuevo, las notas a mano N1–N8, el autor del mural, los permisos de las fotos y los autores de las `oficial-*`. Déjalos como espacios marcados en el código según el spec, nunca como texto visible de relleno. La verificación P0.4 debe fallar si alguno sale publicado.
- **Créditos:** da crédito visible a @sharonmirelesgong y @alfonso_boeta.

## Recorrido 3D de la casa

El dueño aprobó un recorrido 3D que se mueve con el scroll y cuenta la casa en tres paradas: **entrada → salas → patio**. La referencia es el sitio Pear: la cámara avanza con el scroll, hay transiciones donde un color inunda la pantalla y etiquetas pequeñas en un riel lateral. Solo dentro del recorrido, esto sustituye la regla del spec §1 «Nada se mueve con el scroll». Fuera del recorrido, el spec sigue igual. No es el scrub de Higgsfield, que se elimina de todos modos.

**Lugar en la página.** El orden es Encabezado → Portada → El nombre → **Recorrido** → Agenda → Visita → Pie. El recorrido envuelve las secciones «La casa por dentro» y «Patio y café», cuyo HTML, copy, notas N3–N8 y créditos se quedan en el DOM. La Portada sigue siendo estática y su LCP es `ig-01` en un `<img>` normal.

**Fotos.** Usa solo el mapeo de `RECORRIDO-FOTOS.md`, con los recortes, focos y topes de tamaño del spec §5.
- Entrada: `maps-01`, sin la barra de Google.
- Salas: `oficial-mesa-1600` (hero), `ig-04`, `oficial-rincon-1600`, `ig-03` e `ig-02` (esta como ficha chica).
- Patio: `ig-12` (hero), `ig-07`, `ig-08`, `ig-13` e `ig-10`.

La entrada tiene una sola foto. Resuélvela con un solo plano y el letrero «Libros desde $10» en texto real; no rellenes con otras fotos. Ningún plano se muestra más grande que su tope nítido.

**Técnica.**
- Mantén el sitio estático. No migres a React ni a Next.
- Agrega `gsap` con `ScrollTrigger` y `three` a versiones fijas. `lenis` es opcional. Empaquétalos en `build:public` (con esbuild u otro, con tree-shaking) y sírvelos desde `'self'`. Nada de CDN en tiempo de ejecución, sin cambiar la CSP actual (`script-src 'self'`).
- El modelo es scroll → progreso (0–1) → posición de la cámara a lo largo de una curva.
- Las fotos son planos con textura, colocados en profundidad a lo largo del camino.
- Los títulos de cada parada se revelan con el scroll y son texto HTML, no texto dentro del canvas.
- Parallax sutil con el puntero.
- El shader es contenido: una ondulación o desplazamiento leve solo al pasar el cursor o durante la transición. En reposo, las fotos se ven nítidas y sin filtro. No pongas dither ni halftone sobre las fotos. Un grano de papel opcional va solo en el fondo o en la tipografía.
- Entre paradas, el color de la paleta 2.1 inunda la pantalla: entrada → salas con `--cantera`, salas → patio con `--patio`, y al salir `--papel`. Cualquier texto encima debe cumplir AA según `palette_check.py`.
- Un riel lateral muestra el nombre de la parada activa con `--madera`.

**Rendimiento.**
- Carga el módulo WebGL de forma diferida, después del primer render (`requestIdleCallback` o `IntersectionObserver` al acercarse).
- Texturas WebP o AVIF responsivas de 2048 px como máximo, generadas con `prepare-official-photos.py`. KTX2 solo si no obliga a relajar la CSP.
- DPR limitado a 1.5–2. Pausa el render fuera de pantalla y cuando la pestaña está oculta. Sin post-procesado pesado.
- En móvil, una ruta más simple: menos planos, sin shader de hover y DPR 1.5.
- Presupuesto: el chunk 3D pesa como máximo unos 200 KB gzip (three + gsap + ScrollTrigger + código propio). El LCP no depende de ese chunk. Si te pasas, quita `lenis` antes que nada y reporta el peso.

**Respaldo y accesibilidad.**
- Con `prefers-reduced-motion: reduce`, sin WebGL o sin JS, se muestran las mismas fotos como una narrativa estática y accesible: `<img>` reales con su `alt` del spec, en el mismo orden de paradas.
- Ningún contenido existe solo dentro del canvas. El canvas lleva `aria-hidden="true"`.
- Las paradas se recorren con teclado: enlaces del riel con foco visible que llevan a cada parada.

**Tests y entrega.**
- Agrega tests de que el respaldo se muestra con movimiento reducido y sin WebGL, de que las `<img>` y sus `alt` existen sin JS y de que el canvas tiene `aria-hidden`.
- Incluye en el PR capturas de cada parada en escritorio y en móvil.
- Reporta los números de Lighthouse (Performance, LCP, CLS, TBT) en móvil y escritorio, y el peso gzip del chunk 3D.

## Barra de calidad

Debe sentirse como una obra de arte digital hecha para esta librería, no como una plantilla. Elimina todas las señales de diseño genérico de IA que lista la crítica: copy en tríadas, hero de plantilla con pastillas y marco girado, simetría genérica y kickers decorativos. Usa tu criterio en la implementación: el spec describe el resultado, no los pasos.

Mantén las garantías que ya existen:
- Contraste WCAG AA, comprobado con `python spec/v2/palette_check.py`.
- Teclado y foco.
- Áreas táctiles de al menos 44 px.
- Movimiento reducido.
- Lectura sin JS.
- CSP.
- 404 en rutas privadas.
- Sin desbordamiento horizontal de 320 a 1920 px.

## Terminado cuando

- `npm test` pasa. Actualiza solo los contratos visuales que el spec reemplaza.
- `npm run build:public` funciona.
- Agregaste tests para los requisitos P0.
- El PR incluye capturas de escritorio y móvil de cada sección y una lista corta de lo que sigue pendiente.

## Reglas del repo

- Autor del commit: `Aldo G Pineda <gioaldo101@gmail.com>`, con el trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Copy en español con acentos correctos y sin mojibake.
- Nunca subas secretos ni archivos `.env`.
- Sin force push.

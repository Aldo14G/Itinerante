# Rúbrica visual: mira y corrige

Adaptada de la revisión «look-and-fix» del skill MotionSites Web Builder (`references/review.md` y `references/craft.md`, licencia MIT, https://github.com/Motionsites-AI/claude-skill). De ese skill **no** se adoptan: medios de su repisa, librerías por CDN, video de fondo ni su bloque promocional. El vidrio sí existe, pero con las reglas del sistema «Itinerante Líquido» (`DESIGN.md`): solo en lo que flota y con respaldo opaco. La CSP, los tokens y `PRODUCT.md` mandan sobre cualquier regla de aquí.

## Cuándo

Después de cada cambio visual, antes de pedir commit. Nadie juzga una página que no ha visto.

1. `node tools/qa/controles.mjs URL DIR`. Guarda tres capturas (`primer-cuadro.png` a 350 ms, `escritorio.png` 1440×900 y `movil.png` 390×844) y revisa los controles y la carga. Si falla, se corrige antes de puntuar.
2. Abre las capturas **como imágenes** y puntúa los diez criterios de abajo en **390×844 claro y oscuro, 320×640 y 1440×900** (el tema oscuro se captura con `prefers-color-scheme: dark`).
3. Anota los tres más bajos, cada uno con el cambio concreto en valores, no en adjetivos. Ejemplo: «"Ver las N" de 30 a 44 px (`--alto-sm`) y 8 px sobre la lista», no «botón más grande».
4. Corrige, vuelve a capturar y vuelve a puntuar. Se repite hasta 3 rondas o hasta pasar la vara.

**Vara:** promedio ≥ 8 y ningún criterio < 7.

## Bloqueantes (fallan aunque lo demás esté bien)

- Errores de consola, peticiones fallidas o imágenes rotas.
- Desborde horizontal.
- Destello en el primer cuadro: el lienzo (`html`) es el `--fondo` del tema (blanco en claro).
- Texto ilegible: bajo 4.5:1 en cualquiera de los dos temas, sobre la parte agitada de una foto (el texto sobre foto va en vidrio) o cortado.
- Inter sin cargar (donde no hay letra de Apple) o restos de Nunito o Archivo.
- Vidrio sin respaldo opaco (sin `backdrop-filter`, transparencia reducida, contraste alto) o vidrio sobre vidrio.
- Controles fuera de la escala, de menos de 44×44 px o a menos de 8 px de su vecino (`controles.mjs`).
- Texto de relleno o cifras inventadas (`PRODUCT.md`).

## Los diez criterios (1–10)

1. **Primer vistazo (3 s):** un solo foco. Se entiende qué es y adónde mirar.
2. **Firma:** algo memorable y nuestro. Aquí: la foto real de la casa con radio grande, el turquesa del logo, el vidrio de las barras y el recorrido de colecciones.
3. **Tipografía:** la del sistema de Apple (Inter de respaldo) en la escala de Apple HIG: Large Title solo en el h1, Title 1 en secciones, Body 17/22 en el texto; nada de lectura bajo 15 px; como máximo 6 tamaños por pantalla.
4. **Composición:** el texto y sus acciones juntos (proximidad), bordes alineados, recorrido de la vista titular → mensaje → acción. Nada huérfano.
5. **Color y luz:** `fondo`/`fondo-2` alternos, `tinta`, `tinta-2` y un acento (turquesa). Un solo primario por vista («Cómo llegar»; en la ficha, «Preguntar por WhatsApp»); el secundario es menta. Sombras solo en lo que flota. Los dos temas se ven igual de cuidados.
6. **Foto:** encuadrada a propósito (`object-position`), sin chocar con el texto.
7. **Movimiento:** respuesta, no decoración (titulares por línea, revelado de imagen, escala al toque, pastilla con resorte). Duraciones de tokens y nada con «reducir movimiento».
8. **Móvil:** primero el teléfono: márgenes 16/20, acciones a todo el ancho, objetivos de 48 (44 en línea y barras, 56 los principales), barra inferior de vidrio que no tapa nada y la firma sigue presente.
9. **Texto:** concreto y verdadero. Verbo al frente en las acciones.
10. **Pulido:** anillo de foco del sistema, radios 12/20/28/píldora consistentes, sin saltos al cargar fuentes o datos.

## Escala de controles (lo que mide `controles.mjs`)

| Token | Alto | Para qué |
|---|---|---|
| `--alto-lg` | 56 px | «Cómo llegar» y los botones de su grupo, el pie de las hojas y las filas del menú |
| `--alto-md` | 48 px | Estándar móvil: todo botón, acción, chip, campo y botón de icono (también «Cómo llegar» de la barra) |
| `--alto-sm` | 44 px | Controles secundarios en línea (pie, «Ver todo», «Ver las N»), los de las barras (☰, secciones, Mi lista) y «Guardar» sobre una portada |

- **Piezas con alto propio** (cada una con su razón): casillas de la barra inferior (49 px, la tab bar de iOS), paradas del recorrido (64 px), tarjetas de libro, opciones de filtro y sugerencias.
- **Separación:** ≥ 8 px entre controles vecinos; 12 px dentro de un grupo de acciones.
- **Rótulos:** 17 px (Headline) en botones de 48 y 56; 15 px (Subheadline) en botones de 44 y chips.
- **Botones de un mismo grupo** comparten alto.
- **Referencias:** WCAG 2.2 · 2.5.8 pide 24 px como mínimo (AA); aquí se cumple 2.5.5 (AAA, 44 px) en todo control.

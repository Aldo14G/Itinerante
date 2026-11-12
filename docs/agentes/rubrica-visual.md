# Rúbrica visual: mira y corrige

Adaptada de la revisión «look-and-fix» del skill MotionSites Web Builder (`references/review.md` y `references/craft.md`, licencia MIT, https://github.com/Motionsites-AI/claude-skill). De ese skill **no** se adoptan: medios de su repisa, librerías por CDN, vidrio, video de fondo ni su bloque promocional. La CSP, los tokens y `PRODUCT.md` mandan sobre cualquier regla de aquí.

## Cuándo

Después de cada cambio visual, antes de pedir commit. Nadie juzga una página que no ha visto.

1. `node tools/qa/controles.mjs URL DIR`. Guarda tres capturas (`primer-cuadro.png` a 350 ms, `escritorio.png` 1440×900 y `movil.png` 390×844) y revisa los controles y la carga. Si falla, se corrige antes de puntuar.
2. Abre las tres capturas **como imágenes** y puntúa los diez criterios de abajo.
3. Anota los tres más bajos, cada uno con el cambio concreto en valores, no en adjetivos. Ejemplo: «"Ver las N" de 30 a 44 px (`--ctl-sm`) y 8 px sobre la lista», no «botón más grande».
4. Corrige, vuelve a capturar y vuelve a puntuar. Se repite hasta 3 rondas o hasta pasar la vara.

**Vara:** promedio ≥ 8 y ningún criterio < 7.

## Bloqueantes (fallan aunque lo demás esté bien)

- Errores de consola, peticiones fallidas o imágenes rotas.
- Desborde horizontal.
- Destello oscuro en el primer cuadro: el lienzo (`html`) es el blanco del inicio.
- Texto ilegible: bajo 4.5:1, sobre la parte agitada de una foto o cortado.
- Nunito o Archivo sin cargar.
- Controles fuera de la escala, de menos de 44×44 px o a menos de 8 px de su vecino (`controles.mjs`).
- Texto de relleno o cifras inventadas (`PRODUCT.md`).

## Los diez criterios (1–10)

1. **Primer vistazo (3 s):** un solo foco. Se entiende qué es y adónde mirar.
2. **Firma:** algo memorable y nuestro. Aquí: la foto real de la casa, el rótulo «ITINERANTE» y el recorrido de colecciones.
3. **Tipografía:** Nunito para titulares y controles, Archivo para el texto corrido; como máximo 6 tamaños por pantalla.
4. **Composición:** el texto y sus acciones juntos (proximidad), bordes alineados, recorrido de la vista titular → mensaje → acción. Nada huérfano.
5. **Color y luz:** fondo, tinta, gris y un acento (turquesa). El relleno turquesa profundo solo en «Cómo llegar». Texto protegido sobre la foto.
6. **Foto:** encuadrada a propósito (`object-position`), sin chocar con el texto.
7. **Movimiento:** respuesta, no decoración. Duraciones de tokens y nada con «reducir movimiento».
8. **Móvil:** no basta con apilar. Acciones a todo el ancho, objetivos de 48–56 px y la firma sigue presente.
9. **Texto:** concreto y verdadero. Verbo al frente en las acciones.
10. **Pulido:** foco visible por fuera del canto, radios y bordes consistentes, sin saltos al cargar fuentes o datos.

## Escala de controles (lo que mide `controles.mjs`)

| Token | Alto | Para qué |
|---|---|---|
| `--ctl-lg` | 56 px | «Cómo llegar» y los botones de su mismo grupo; campos, selectores y filas del menú |
| `--ctl-md` | 48 px | Todo botón, acción, chip y botón de icono |
| `--ctl-sm` | 44 px | Acciones en texto (pie, «Ver todo», «Ver las N»), navegación de la cabecera y «Guardar» sobre una portada |

- **Piezas con alto propio** (cada una con su razón): casillas de la barra (54 px), paradas del recorrido (64 px), tarjetas, filas de tema y campos.
- **Separación:** ≥ 8 px entre controles vecinos; 12 px dentro de un grupo de acciones.
- **Rótulos:** 16 px en botones y acciones, 14 px en chips y acciones pequeñas.
- **Botones de un mismo grupo** comparten alto.
- **Referencias:** WCAG 2.2 · 2.5.8 pide 24 px como mínimo (AA); aquí se cumple 2.5.5 (AAA, 44 px) en todo control.

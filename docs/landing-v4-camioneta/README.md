# Landing v4 · La camioneta

Documentación de la dirección «La camioneta» y de su implementación en `/nuevo`. Esta versión sigue en borrador (PR #8, rama `agent/claude/landing-v4-camioneta`) y **no debe publicarse**: el preview de Vercel de esta rama está apagado a propósito.

## Qué es

Es una landing nueva para Librería Itinerante y Más, no un retoque de la página actual. El mundo visual sale del logo: una camioneta trazada a mano, cuya caja de carga parece un libro abierto, sobre el campo menta de la marca. La página se lee como una ruta: la camioneta llega cargada de portadas reales, para en Eventos, abre la vitrina de Destacados, deja el catálogo completo y termina en la puerta (Visita).

La implementación vive en `/nuevo` (React 19 renderizado a HTML estático, ruta con regeneración cada hora). El HTML del servidor ya trae el contenido. Los filtros del catálogo también funcionan sin JavaScript, por la URL. Esta carpeta guarda la dirección, las críticas, las mediciones, las capturas del prototipo aprobado y el prototipo de referencia. El prototipo no es código de producción.

| Pieza | Dónde |
|---|---|
| Dirección vigente (v4.2) | `DESIGN-DIRECTION.md` |
| Dirección v4.1 | `DESIGN-DIRECTION.v41.md` |
| Dirección v1 | `DESIGN-DIRECTION.v1.md` |
| Críticas | `criticas/` |
| Mediciones | `mediciones/medir-v2.json`, `mediciones/medir-v3.json` |
| Capturas del prototipo v4.2 | `capturas-v3/` |
| Prototipo de referencia | `prototipo/` |

## Decisiones de Aldo

- **Barlow.** Barlow Condensed y Barlow, en local y con licencia OFL, reemplazan a Inter en todos los roles de esta versión.
- **Merch y talleres.** Mientras no haya al menos dos productos reales de un tipo, la tienda es un esqueleto: el sello «Próximamente», la línea «Merch y talleres: próximamente.» y huecos rotulados Libros, Merch y Talleres. Sin pestañas, chips ni enlaces vacíos, y sin productos, precios ni fotos inventados.
- **Movimiento.** Se mejora y no se quita. Solo `prefers-reduced-motion` lo suaviza: la vitrina queda plana, sin giro ni profundidad, y los estados se siguen leyendo.
- **Destacados y catálogo.** El carrusel se llama Destacados y no lleva la palabra «Tienda». Debajo va el catálogo completo, con la estructura del catálogo de la biblioteca (título y conteo, buscador, filtros, orden, vista de cuadrícula o lista, filtros aplicados y «Mostrar más»), en la paleta y la letra de Itinerante.

## Las 12 pruebas

Corridas sobre `/nuevo` antes de documentar. El detalle de cada una está en el PR #8.

| # | Resultado |
|---|---|
| 1. Contenido completo sin JavaScript, y filtros por URL en el servidor | Pasa |
| 2. Conteos (Matamoros, Maps, teléfono, sin switch, sin «Mi lista», sin «apartar», «próximamente» solo en la tienda, sin «Precio en tienda») | Pasa |
| 3. El 28 de noviembre de 2026 el Aniversario sale y el llamado pasa a «Ver libros» | Pasa |
| 4. axe en 0 a 1440 y 390, normal y reducido; primer Tab «Ir al contenido»; anillos de foco | Pasa |
| 5. Con movimiento reducido, la vitrina no gira ni tiene profundidad | Pasa |
| 6. Al filtrar, ninguna portada se ve fuera de los resultados y el inicio casi no se mueve | Pasa |
| 7. Visita a 390 por debajo de 6 000 px; «Mostrar más»; foco; URL; camioneta centrada | Pasa |
| 8. Gesto de 180 px = un libro; el scroll vertical y la rueda no se atrapan | Pasa con toque sintetizado. Falta el teléfono real |
| 9. Primera fila con portada real; el placeholder no repite el título | Pasa |
| 10. Peso a 390 con compresión: 352 KB al cargar y 362 KB tras recorrer; sin fuentes externas; CLS bajo | Pasa |
| 11. Capturas y video | Pasa; están en el PR |
| 12. Con dos productos de muestra, el hueco de ese tipo pasa a tarjetas | Pasa en prueba. `merch.json` real sigue vacío |

## El build

El primer preview de Vercel falló en `next build`. La ruta `/nuevo` importaba `react-dom/server` para volver a pintar la página cuando la URL traía filtros. Next no admite ese módulo dentro de `app/`.

El arreglo deja el render de React en el build. Si la URL trae una consulta, la ruta reescribe el HTML ya generado (filtros, orden, vista y ficha). El mismo `next build` del proyecto pasa, y `/nuevo` respondió 200 en el preview de ese arreglo. Ese preview queda como historia del commit anterior: esta rama ya no debe desplegarse.

## Pendientes

- **Destacados provisional.** `src/frente/destacados.json` trae los ocho primeros libros con portada, en el orden del inventario. No es una selección de la librería. Si el archivo se vacía, la sección no se pinta.
- **Permisos de Roberto.** Los carteles de Instagram de los eventos y la foto del rincón no tienen permiso de uso. La página no usa esa foto: el cartel del evento es el trazo neutro de la camioneta.
- **Precio de «Las ruinas de la caza».** Lo da Roberto. Hasta entonces la tarjeta, la vitrina y la ficha van sin línea de precio y sin un texto que lo sustituya.
- **Prueba en teléfono real.** El gesto de la vitrina se midió con toque sintetizado. Falta un iPhone (Safari) y un Android (Chrome).
- **Siguiente iteración.** Galerías propias para merch, talleres y eventos, cuando haya piezas reales. Hoy merch y talleres siguen en el esqueleto, y los eventos son la ruta de paradas, no una galería.

## Deployments de esta rama

En `vercel.json`, `git.deploymentEnabled` deja en `false` únicamente la rama `agent/claude/landing-v4-camioneta`. Es la opción oficial de Vercel para apagar el deploy automático de una rama. Las ramas que no están en esa lista, incluida `main`, siguen en el valor por omisión (deploy activo). No se usó `ignoreCommand`: ese comando igual registra un deployment y lo marca como ignorado. Aquí la meta es que no se cree.

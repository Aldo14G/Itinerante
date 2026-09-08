# Funciones de Amazon Books → Librería Itinerante

## Por qué no hay scraping de Amazon

Amazon.com bloquea scrapers (captchas, rate-limit agresivo, markup cambiante) y
sus Términos lo prohíben; su API oficial (Product Advertising API) exige cuenta
de afiliado con ventas. Decisión: **cero scraping de Amazon**. Sus funciones se
adoptan como diseño; sus datos llegan por repositorios oficiales.

## Anatomía funcional de Amazon Books (lo que sí copiamos)

| # | Función Amazon | Qué resuelve | Estado en Itinerante |
|---|---|---|---|
| 1 | Buscador con alcance (Todo / Libros) + sugerencias al escribir | Precisión desde el primer carácter | ⏳ Sugerencias al escribir pendientes |
| 2 | Filtros facetados con conteos (categoría, autor, idioma, precio, rating) | Hick: decidir sin abrir fichas | ✅ Facetas `categories/subgenres/formats` en `/api/catalog`; conteos visibles pendientes |
| 3 | Ordenar por relevancia / novedad / precio / rating | Control del ranking | ✅ Relevancia + A–Z; ⏳ novedad y precio |
| 4 | Rating + número de reseñas en cada tarjeta | Prueba social de un vistazo | ⏳ `averageRating/ratingsCount` ya se rescatan al manifiesto (`amazon:enrich`); falta pintarlos |
| 5 | Página de producto: portada, sinopsis, detalles (páginas, editorial, ISBN), autor enlazado | Ficha completa verificable | ✅ Diálogo de ficha con hechos; ⏳ página de autor/serie |
| 6 | "Los clientes también compraron" | Descubrimiento sin buscar | ⏳ Recomendados por subgénero en la ficha |
| 7 | Vista previa / "Look Inside" | Probar antes de visitar | ⏳ Enlace a vista previa Google Books cuando `accessInfo` la permite |
| 8 | Listas y rankings (bestsellers por categoría) | Entrada curada | ✅ Dataset Amazon 500 como fixture; ⏳ estante "destacados" con fuente visible |

## Repositorios oficiales (fuente de datos, no de diseño)

| Fuente | Endpoint | Campos que usamos | Costo |
|---|---|---|---|
| Google Books API | `GET /books/v1/volumes?q=…&maxResults=40` con `intitle:`, `inauthor:`, `isbn:`, `subject:` | Portada, ISBN-13, páginas, categorías, descripción, `averageRating`, `ratingsCount`, `canonicalVolumeLink` | Gratis con cuota; sin llave para volumen bajo |
| Open Library | `GET /search.json?q=…&fields=key,title,author_name,cover_i,isbn&limit=5` + `covers.openlibrary.org` | ISBN, portada de respaldo, clave de obra (`sourceUrl`) | Gratis, sin llave |

Implementado en `scripts/enrich-google-books.mjs` (Google primero, Open Library de
respaldo, concurrencia 3 + reintentos 429). Regla dura: todo dato enriquecido
conserva su fuente (`provider` en el manifiesto); jamás se presenta como
inventario de la librería.

## Fallas internas corregidas en este pase

1. `searchInventoryBooks` inyectaba `subgenre.slug = undefined` y
   `category.slug = undefined` en el `where` de GraphQL: **toda búsqueda de
   inventario con texto y todo Iti IA con filtro de solo-categoría fallaban**.
   Ahora el `where` se construye solo con filtros definidos.
2. Recall ciego en terror/horror, distopía, clásicos, manga/cómic, novela negra,
   cuentos, teatro, espiritualidad, feminismo, true crime y ciencia general:
   nuevas expansiones ES→EN en `local-test-search.js`.
3. Cero tolerancia a errores de dedo: capa de rescate por prefijo que solo
   puntúa libros con score exacto 0 (no reordena ganadores verificados).
4. Ruido de consulta ("busco", "dame", "recomiéndame"...) ahora en stopwords.

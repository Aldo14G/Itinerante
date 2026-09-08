# Revisión bibliográfica — segunda pasada

Fecha: 2026-09-05. Se incorporan siete fichas al registro de evidencia y se
amplían dos decisiones anteriores. El acumulado es 13 fichas con contraste
externo parcial; 71 aún no lo tienen. Las 84 siguen pendientes de admisión:
82 candidatas y dos en cuarentena.

## Cambios aplicados

| Ficha | Cambio | Evidencia y límite |
|---|---|---|
| Amarse con los ojos abiertos · `goodreads-25623` | Silvia Salinas pasa de colaboradora sin rol a autora. | [Océano](https://oceano.mx/obras/amarse-con-los-ojos-abiertos-jorge-bucay-silvia-salinas-ebook-20113.aspx) confirma la coautoría de la obra. [Casa del Libro](https://latam.casadellibro.com/libro-amarse-con-los-ojos-abiertos/9788479019396/885797) vincula ambos autores al ISBN de la candidata. RBA/Alfaguara queda como conflicto editorial pendiente; no se traslada la edición digital de Océano. |
| La aldea global · `goodreads-385544` | Bruce R. Powers pasa a autor. | [Gedisa, catálogo 2017, página PDF 79](https://www.gedisa.com/catalogo/GedisaCatalogo2017.pdf) corrobora coautoría en otra edición. [UNLaM](https://pergamo.unlam.edu.ar/pergamo/documento.php?id=PERGAMO.1.17547&recno=17547&ui=1) registra a Powers y el ISBN-10 8474324033, correspondiente al ISBN-13 de la candidata. No se cambian año, páginas ni otros roles. |
| Y Matarazo no llamó… · `goodreads-1034888` | Se añade síntesis propia breve y materia propuesta Novela. | [Ficha ELEM](https://www.elem.mx/obra/datos/124027) identifica novela, Grijalbo e ISBN; el [estudio de Garro](https://www.elem.mx/autor/datos/421) aporta contexto para la síntesis. No se copia la sinopsis ni se afirma inspección de la edición. |
| Tinísima · `goodreads-1293796` | `und` pasa a `es`; se propone Novela. | [CiNii BA22325829](https://ci.nii.ac.jp/ncid/BA22325829) vincula ISBN-10 9684113056, Era, 663 páginas y código de lengua del texto `spa`. [ELEM](https://www.elem.mx/obra/datos/2566) confirma la forma novela y el par ISBN-10/13. Estas dos fichas se consultaron mediante sus resultados indexados; sus aperturas directas fallaron. [Open Library](https://openlibrary.org/books/OL1352581M/Tini%CC%81sima) corrobora la edición y vincula Goodreads 1293796. Queda pendiente la reimpresión concreta. |
| Harakiri · `goodreads-7511615` | Se añade síntesis propia breve sobre la obra. | [Memoria Chilena](https://www.memoriachilena.gob.cl/602/w3-article-92862.html) aporta el análisis literario. La [Biblioteca Nacional Digital](https://www.bibliotecanacionaldigital.gob.cl/visor/BND%3A10181) describe una edición de 2005, usada sólo como contraste; no se asigna su fecha a la candidata de 2004. |

La síntesis de Garro permite recuperar la ficha mediante `Garro conflictos
sindicales`; la de Bertoni mediante `Bertoni enfermedad`. Son descripciones
editoriales nuevas, identificadas con `basis: editorial-summary` y URLs de
evidencia. El CSV, las descripciones crudas vacías y los identificadores
permanecen intactos. Ningún precio o stock externo se convierte en inventario.

## Decisiones sin corrección automática

- **El fin del poder:** la [Biblioteca de Filadelfia](https://catalog.freelibrary.org/Record/1881093)
  confirma que el ISBN 9780465031566 corresponde a *The end of power*, Basic
  Books, inglés, 2013; su MARC registra xiii, 306 páginas. Esto refuerza el
  conflicto, pero no identifica la edición que el registro Goodreads pretendía
  representar. Continúa en cuarentena. No se sustituye la paginación por la
  de la reseña comercial anterior ni se cambia el título al inglés.
- **La noche de San Juan:** el acceso directo al ID Goodreads no devolvió
  una ficha utilizable. No se obtuvo contraste nuevo de Litera o una biblioteca
  para resolver la edición pretendida. Continúa en cuarentena.
- **Antología de la Generación del 27:** [Santillana](https://promos.santillanausa.com/eMag_SecondarySpanishCatalog_2013-14/HTML/SecondarySpCat2013_14/assets/basic-html/page62.html)
  confirma el ISBN y la autoría colectiva, pero el extracto no contiene los
  créditos completos. Se mantienen roles pendientes y lista truncada; no se
  importa la lista de otra antología o de un catálogo social.
- **De profundis:** el [catálogo BUR 2026](https://www.rizzolilibri.it/content/uploads/2026/02/Catalogo2026.pdf)
  vincula a Scarlini con una edición distinta. No demuestra su participación
  en Fontamara 1993. Se registra `contributor-edition-unverified`, se conserva
  el ISBN nulo y no se traduce `Redattore` para aparentar verificación editorial.
- **Arte poética:** [Biblissima](https://iiif.biblissima.fr/collections/manifest/e0946cc7f39aadfb886ac154f0c2cf76bdb8cf67)
  reúne Horatius y Horácio bajo Horace. Se registra esa evidencia. Queda
  representar la variante sin crear dos autores; la corrección de idioma
  bilingüe anterior se conserva.

## Contrato y comprobación

El ETL existente admite ahora sólo dos operaciones adicionales: una descripción
editorial breve y materias pertenecientes a la taxonomía actual. Exige evidencia
por campo, límite de longitud, texto sin marcado, categoría y nombre coherentes
con el ID, ausencia de materias duplicadas y estado `proposed`. Las materias
editoriales llevan `basis: editorial-evidence`; no inventan una versión del
mapeo de etiquetas Goodreads. El conjunto de siete categorías y 21 subgéneros
no cambia. Continúa bloqueada la admisión `reviewed` y cualquier campo comercial.

Validación ejecutada: `npm.cmd test` **60/60**, Python unittest **7/7** y
`etl-goodreads.py --check` idéntico byte por byte. Se comprueban coautores,
búsqueda sobre las síntesis, filtro español de Tinísima, datos crudos intactos,
rechazo de evidencia ajena o ausente y de materias inventadas o incoherentes.
La prueba de idioma desconocido usa ahora una copia sintética marcada `und`;
no mantiene a Tinísima como desconocida para conservar un resultado antiguo.

Estado: 77 `es`, 5 `en`, 2 `mul`; 80 ISBN-13 válidos por checksum, dos fichas
sin descripción, tres con roles pendientes y 33 con incidencias específicas.
No tener incidencias automáticas no acredita revisión completa. El frontend,
API y RAG no se modificaron; no se repitió build del backend ni gate visual.
No hubo importación a BD, despliegue ni cambios en originales.

## Siguiente paso concreto

Resolver representación de variantes de autor con la evidencia de Horacio;
conseguir créditos de la antología y Fontamara; completar las descripciones de
Arte poética y Poesía de Girondo. Después revisar formas y materias (en especial
teatro, psicología y ficción filosófica). Las cuarentenas requieren evidencia
sobre la identidad pretendida del registro o una decisión explícita de crear
otra ficha desde una fuente bibliográfica completa; cambiar sólo el ISBN no
resuelve una mezcla de ediciones. Las 71 fichas sin contraste siguen pendientes.

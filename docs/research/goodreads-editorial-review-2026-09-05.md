# Revisión editorial de Goodreads — primer lote

Fecha: 2026-09-05. Alcance: seis fichas con revisión parcial por campo.
Ninguna ficha se admite todavía como `reviewed`.

Se priorizaron roles ambiguos y posibles mezclas de edición. El lote incluye
`El fin del poder`, que no tenía incidencias automáticas: un ISBN con checksum
correcto no garantiza que título, idioma y editorial pertenezcan a esa edición.
Las otras 78 fichas no tienen contraste externo en esta pasada.

| Ficha | Evidencia y decisión aplicada | Pendiente |
|---|---|---|
| Arte poética · `goodreads-10602457` | [Dykinson](https://www.dykinson.com/libros/arte-poetica-9788498498837/) identifica el ISBN como edición bilingüe. Se cambia `es` a `mul`. | Idiomas concretos, variantes Horatius/Horácio, roles y descripción. Paginación: fuente 168, editorial 166; se conserva el valor original y se registra conflicto. |
| Poema del Cante Jondo / Romancero gitano · `goodreads-237815` | [Cátedra](https://www.catedra.com/libro/letras-hispanicas/poema-del-cante-jondo-romancero-gitano-federico-garcia-lorca-9788437601144/) confirma a Allen Josephs y Juan Caballero como editores. Se corrigen ambos roles. | Paginación: candidata 317, ficha editorial 320; verificar reimpresión, idioma, descripción y materias. |
| Conversaciones sobre la escritura · `goodreads-50627133` | [Alpha Decay](https://alphadecaytienda.com/producto/conversaciones-sobre-la-escritura-ursula-k-le-guin-y-david-naimon) documenta el diálogo y su traducción; [Todos Tus Libros](https://www.todostuslibros.com/libros/conversaciones-sobre-la-escritura_978-84-120738-4-3) vincula el ISBN con ambos autores. David Naimon pasa a autor. | La poesía es asunto de las conversaciones; falta revisar la materia propuesta como forma de poemario. |
| Bodas de sangre · `goodreads-77903` | [Cátedra](https://www.catedra.com/libro/letras-hispanicas/bodas-de-sangre-federico-garcia-lorca-9788437605609/) confirma teatro y poesía dramática, roles y 176 páginas. Se registra la falta de término controlado para teatro. | Resolver forma y tema sin borrar el carácter poético ni inventar un subgénero. Se conserva la propuesta existente. |
| La noche de San Juan · `goodreads-18586193` | **Cuarentena.** [Herder](https://herdereditorial.com/la-noche-de-san-juan-9788425420436) identifica la traducción de Garrigós con ISBN 9788425420436. [Cărturești](https://carturesti.ro/carte/noaptea-de-sanziene-vol-1-54502) asocia el ISBN de la candidata, 9789736753985, a un volumen rumano de Litera. | Resolver identidad contra la edición y el registro de origen. No cambiar automáticamente el ISBN o el idioma para construir una ficha híbrida. |
| El fin del poder · `goodreads-19049001` | **Cuarentena.** [Publishers Weekly](https://www.publishersweekly.com/9780465031566) atribuye su ISBN a The End of Power, Basic, 304 páginas. La candidata dice DEBATE y 313. [Penguin Random House](https://www.penguinrandomhouse.com/books/240539/el-fin-del-poder--the-end-of-power-by-moises-naim/9788499923000/) documenta otra edición con distinto ISBN. | Verificar conjuntamente título, ISBN, lengua y editorial. La edición alternativa no es un reemplazo autorizado del identificador. |

Las conclusiones de mezcla de edición son decisiones editoriales a partir de
las discrepancias anteriores. Se distingue evidencia editorial de corroboración
comercial; no se guardan precios, existencias, portadas ni sinopsis completas.

## Aplicación y verificación

`imports/kaggle-goodreads/editorial-review.json` conserva URL, tipo de fuente,
fecha de consulta, hallazgo, cambios antes/después y pendientes por registro.
`scripts/etl-goodreads.py` comprueba el hash del crudo y el valor anterior antes
de aplicar decisiones. Sólo admite cambios de idioma y roles, y estados
`candidate` o `quarantined`. No permite admitir una ficha como `reviewed`.
El ETL preserva `source.raw`, incorpora las decisiones y su hash a la proyección,
y regenera `normalized.reference.json` y `normalization-quality.json`.

Resultado: 84 registros, 82 candidatas y 2 en cuarentena; 76 `es`, 5 `en`,
2 `mul` y 1 `und` contando también la cuarentena. Se conservan 80 ISBN válidos
por checksum y cuatro descripciones ausentes. Cinco fichas mantienen roles
pendientes. La cola automática pasa de 36 a 37 fichas al incorporar conflictos
externos; no es el conteo total de fichas pendientes de revisión editorial.

Validación ejecutada: `npm.cmd test` 59/59; Python unittest 6/6;
`etl-goodreads.py --check` idéntico byte por byte. Los tests comprueban rechazo
de decisiones obsoletas, campos comerciales y admisiones no implementadas,
preservación del crudo y exclusión de la cuarentena incluso con opt-in de
candidatas. La búsqueda por David Naimon ahora coincide en el campo autor;
Josephs sigue siendo recuperable como colaborador. No se cambió la API ni el RAG.

Para continuar: resolver las dos identidades en cuarentena; después las cinco
fichas con roles pendientes, las cuatro sin descripción y la correspondencia
de materias. Las 78 fichas sin contraste externo también deben pasar revisión
antes de aplicar el modelo aditivo local. El gate visual sigue pendiente:
Computer Use devolvió inventario vacío y `No browser is available` en esta sesión.

Catálogo comercial y originales intactos. Sin importación a BD ni despliegue.

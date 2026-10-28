# Recorrido 3D · clasificación de fotos por parada

Fotos revisadas una por una: `fotos/ig-01` a `ig-18`, `fotos/maps-01` y las tres `oficial-*` de la sede actual, que viven en `images/gallery/` (`oficial-mesa-1600.webp`, `oficial-rincon-1600.webp` y `oficial-mesa-compartida.webp`). «Nitidez» es la varianza de bordes medida a 800 px de ancho: más alto es más nítido y menos de 1000 es suave.

Reglas: solo fotos oficiales y nada generado. `maps-02` a `maps-05` quedan fuera porque son de la sede anterior (`maps-03` fue rechazada expresamente). Tampoco entra nada con gong.

## Tabla

| Archivo | Parada | Qué muestra | Resolución | Nitidez | Papel |
|---|---|---|---|---|---|
| maps-01.jpg | Entrada | Fachada actual: puerta, placa con el logo y el letrero «Libros desde $10» | 837×1113 (captura del visor; hay que quitar la barra de Google, unos 73 px abajo) | 2583 | **hero** (único). Plano chico, máximo 669 px css. Licencia de Google pendiente |
| ig-17.jpg | Entrada | Gráfica «Próximamente nuevo espacio» con un mapa encima de la foto del pasillo | 864×1080 | — | skip (gráfica con texto) |
| ig-18.jpg | Entrada | Flyer de apertura con texto sobre la foto de la entrada | 1080×1350 | — | skip (gráfica con texto) |
| oficial-mesa-1600.webp | Salas | Mesa de libros frente al muro de piedra | 1600×1200 | 3024 | **hero** |
| ig-04.jpg | Salas | Estantes junto a la ventana, silla turquesa y damero | 1080×1080 | 2149 | **hero alterno** / support |
| oficial-rincon-1600.webp | Salas | Cuadros sobre el muro de piedra y la silla roja | 1600×1200 | 2677 | support |
| ig-03.jpg | Salas | Diccionario antiguo con el muro de piedra y cuadros | 1080×1080 | 1621 | support |
| ig-02.jpg | Salas | Globo terráqueo entre libros | 1080×1080 | 716 (suave) | support, solo como ficha chica (≤ 320 px) |
| ig-01.jpg | Salas | Salón con libreros hasta el techo, mesa, sillas turquesa y damero | 1080×1080 | 2608 | skip en el recorrido: es la foto de la Portada (LCP en `<img>`), no se repite |
| ig-09.jpg | Salas | Salón con sillas en fila y libreros | 1080×1440 | 1489 | skip: la usa la sección Agenda |
| ig-05.jpg | Salas | Gong en primer plano | 1080×1080 | — | **skip (gong)** |
| ig-12.jpg | Patio | Patio con luces, plantas, sillas tejidas y mesa de carrete | 1080×1440 | 923 (suave, foto de noche) | **hero** (es la foto grande del spec). Máximo 864 px css |
| ig-07.jpg | Patio | Tablero de ajedrez en el patio | 1080×1080 | 3151 | **hero alterno** / support |
| ig-08.jpg | Patio | Pasillo del patio con plantas y sillas | 1080×1080 | 2351 | support |
| ig-13.jpg | Patio | Mural del venado azul en el muro del patio | 1080×1440 | 1570 | support (autor del mural pendiente) |
| ig-10.jpg | Patio | Mural con raíces sobre el muro, banca de madera | 1080×1440 | 953 (suave) | support (autor del mural pendiente) |
| ig-06.jpg | Patio | Amarilis roja con la banca tejida turquesa | 1080×1080 | 2199 | reserva (el spec la deja sin uso) |
| ig-11.jpg | Patio | Muro del patio con ventana, en blanco y negro | 1080×1440 | 1767 | reserva (el spec la deja sin uso) |
| oficial-mesa-compartida.webp | — | Papel picado y mantel de Día de Muertos | 397×298 | 2292 | skip: es de temporada y de baja resolución. Solo en la capa `muertos` |
| ig-14.jpg, ig-15.jpg, ig-16.jpg | — | Gráficas: definición de «Itinerante» y 5.º aniversario | 1080 px | — | skip (gráficas) |
| maps-02 a maps-05 | — | Sede anterior | — | — | **excluidas** |
| oficial-sala, oficial-encuentro, oficial-estantes | — | Fotos viejas de la galería | 224 a 390 px | — | skip: baja resolución, el spec 2.1 las reemplaza |

## Por parada

| Parada | Utilizables | Hero | Support | Hueco |
|---|---|---|---|---|
| Entrada | **1** | maps-01 | — | **Menos de 2 fotos.** Solo existe la captura de Maps (837 px, de Google). Falta una foto propia de la fachada o de la puerta. |
| Salas | 5 | oficial-mesa-1600 (alterno: ig-04) | oficial-rincon-1600, ig-03, ig-02 | No hay foto de la barra del café. La carta actual sigue pendiente y maps-03 está rechazada. |
| Patio | 5 (+2 en reserva) | ig-12 (alterno: ig-07) | ig-07, ig-08, ig-13, ig-10 (reserva: ig-06, ig-11) | Ninguno |

Notas:
- Los murales del venado y de las raíces están en el patio, según las fotos y `fotos/SOURCES.md`, así que van en esa parada y no en Salas.
- El ajedrez (ig-07) también está en el patio.
- Ninguna foto va a sangre completa en escritorio. El tamaño máximo en pantalla de cada plano sigue la regla del spec §5: hasta la mitad del ancho en píxeles para verse nítida en retina, y nunca más de ancho ÷ 1.25.

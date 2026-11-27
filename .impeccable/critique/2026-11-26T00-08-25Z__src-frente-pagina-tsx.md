---
target: "Café y comida /nuevo#cafe"
total_score: 22
max_score: 28
na_heuristics: 5,9,10
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\aldog\\AppData\\Local\\Temp\\Itinerante-pr8-lista-eventos\\src\\frente\\pagina.tsx"
target_fingerprint: "sha256:692b2d1da9bf3589b801baa0a8394a7f74fa60fd44b438ad3f9a802056961dc0"
target_path: "C:\\Users\\aldog\\AppData\\Local\\Temp\\Itinerante-pr8-lista-eventos\\src\\frente\\pagina.tsx"
timestamp: 2026-11-26T00-08-25Z
slug: src-frente-pagina-tsx
---
# Crítica UX de Café y comida

Método dual: diseño independiente y detector más navegador. Alcance: carrusel, acceso, categorías y lista de Café y comida en /nuevo#cafe. La página busca facilitar una visita a la librería y una consulta de la carta.

## Heurísticas de Nielsen

| Heurística | Puntos | Evidencia |
|---|---:|---|
| Visibilidad del estado | 3/4 | El contador y la categoría activa indican la selección. |
| Lenguaje del usuario | 4/4 | Nombres reales, precios en MXN y explicación del servicio en barra. |
| Control y libertad | 3/4 | Gesto, flechas y teclado en un carrusel manual. |
| Consistencia | 3/4 | Los dos enlaces con «la carta» producen resultados distintos. |
| Prevención de errores | n/a | La superficie es de consulta y carece de operaciones con efectos que requieran prevención. |
| Reconocimiento | 4/4 | Categorías y precios se leen directamente. |
| Eficiencia | 2/4 | La carta exige desplazamiento o un salto previo, especialmente en móvil. |
| Diseño estético y minimalista | 3/4 | Identidad coherente, con una jerarquía de bloques que favorece un solo plato. |
| Recuperación de errores | n/a | La carta consultada carece de un estado de error propio. |
| Ayuda y documentación | n/a | La consulta se explica mediante los rótulos de la interfaz. |
| Total | 22/28 | 79 %, buena base funcional. |

## Veredicto

El turquesa y la tipografía identifican a Itinerante. La composición traslada la lógica visual de la vitrina de libros a una carta de texto. La tarjeta negra tiene el mayor peso visual aunque contiene el nombre, una línea y el precio de un solo plato. La franja recortada de la siguiente tarjeta sí comunica continuidad, con texto visible a medias.

Funcionan el contraste de texto en el plato activo, la lectura de precios en las tarjetas de la carta y la navegación manual. Las categorías miden 48 px de alto y el botón principal 175 × 52 px. Con Tab, el botón, la pista y ambas flechas muestran un contorno oscuro sólido de 3 px.

## Prioridades

1. P1 · Jerarquía y tarea principal. En 393 × 852 px, las categorías empiezan en y=584 y el primer precio de la lista de Cafés queda parcialmente bajo el borde del primer viewport (y=833–860). En 1280 × 800 px, las categorías empiezan en y=530. Reorganizar alrededor de la consulta y reducir el alto del destacado mientras el contenido sea tipográfico. Comando sugerido: layout.
2. P2 · CTA y categorías. «Explorar la carta» lleva al selector y «Ver toda la carta» muestra las cuatro categorías. Los rótulos se parecen, pero los resultados difieren. Integrar «Toda» al selector y dar a sus opciones una distribución deliberada en móvil. A 393 px, Postres queda en la segunda fila. Comandos sugeridos: clarify y adapt.
3. P2 · Tarjetas y movimiento. La vitrina enfatiza tres platos que ya están en la carta. Alrededor de la tarjeta protagonista asoma un fragmento con texto cortado. Reducir la masa de la tarjeta, acercar los controles al contenido y mostrar una pista legible del siguiente plato. Si se mantiene el carrusel, usar el movimiento para marcar qué plato cambió. Comandos sugeridos: layout y animate.
4. P3 · De la consulta a la visita. Al terminar de comparar los precios falta una transición contextual hacia la visita. Integrar un enlace discreto a Visita al final de la carta. Comando sugerido: layout.

## Personas y recorrido

Quien busca un café y su precio en el teléfono obtiene ese dato después de la vitrina o al pulsar el atajo. Quien quiere descubrir qué pedir sí recibe una sugerencia visible al entrar. Quien navega por teclado puede mover el carrusel con foco perceptible. El objetivo después de consultar la carta es llegar con facilidad a la información de visita.

## Observaciones

La carta contiene 4 categorías, 21 productos y 14 precios publicados. Hay 0 fotos de producto registradas. El detector CLI sobre src/frente/pagina.tsx devolvió 0 hallazgos. Las mediciones manuales revelan las diferencias de jerarquía móvil y escritorio. Los 2 recorridos con navegador se ejecutaron en contextos independientes. La navegación y los controles conservaron su estado y el foco visible en la prueba con Tab.

Referencias: Nielsen Norman Group, Ten Usability Heuristics y Proximity Principle in Visual Design. W3C WAI, Carousels Tutorial.

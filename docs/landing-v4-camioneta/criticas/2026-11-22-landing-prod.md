# Segunda crítica de diseño · Landing Librería Itinerante y Más · 2026-11-22

Revisado: producción https://itinerante.vercel.app (main @ 21526515, 2026-11-16), desktop 1920px, teclado, código fuente.
NO revisado: preview PR #5 (https://itinerante-hmqtmbiaf-aldo14gs-projects.vercel.app) — detrás de Vercel Authentication. Para revisarlo hace falta un enlace compartible del preview o quitar la protección de ese deployment.
Evidencia: /workspace/itinerante-critique/prod/*.png

Quién llega: alguien en Monterrey decidiendo si ir a la casa. Viene a saber qué hay, si está abierto, cuánto cuesta y cómo llegar.

Severidad: bloqueador / vale la pena / menor. No hay bloqueadores.

## Vale la pena (por impacto)
1. Hero: la promesa es el texto más chico. El H1 repite la marca del header y "Libros, café y talleres en una casa de piedra…" va a 17px en gris. Fix: H1 = la promesa (o el nombre arriba como eyebrow), lede ≥20px en --tinta; estado como pill con horario completo ("Cerrado · Lun–Sáb 11:00–20:00"); segundo CTA secundario "Ver catálogo" junto a "Cómo llegar". Done: en 3 s se lee qué es, cuándo abre y hay dos caminos.
2. Dos secciones llamadas catálogo ("Catálogo / por dónde empezar" y "Explora el catálogo"). Fix: carrusel = "Recomendados por colección"; grid = "Catálogo completo · 41 títulos"; el link "Buscar en el catálogo" pasa a input real en el grid. Quitar "N de 3 paradas hojeadas" (métrica sin sentido para el visitante).
3. Carta de café: 7 bebidas sin precio dejan media fila vacía y parecen datos rotos. Fix: conseguir precios; mientras, agrupar en una fila "Tés e infusiones · Hierbabuena, manzanilla, 7 azahares, limón, jamaica, té verde" + "Precio en barra"; "Aguas frescas" igual. Done: ninguna fila sin precio ni nota.
4. Carrusel: el arrastre con mouse (300px) no mueve; flechas del teclado no funcionan si el foco está en los botones-flecha (solo en la pista); el título/precio bajo la portada se actualiza tarde; sin indicación de posición/final. Fix: pointer drag en desktop; ArrowLeft/Right también desde las flechas; actualizar caption al iniciar el snap; "3 de 5" junto a las flechas y flecha deshabilitada al final.
5. Scroll-spy atrasado: nav marca "Café" estando en Visita; chip de carta marca "Sin café" mostrando Salado/Postres. Fix: IntersectionObserver con rootMargin superior = alto del header y línea de activación ~35% del viewport; el chip activo debe coincidir con el h3 bajo el header.
6. "Cómo llegar ↗" aparece 4+ veces (header sticky, hero, fin del catálogo, Visita). Al final del catálogo el texto dice "La librería confirma si los tienen", así que la acción correcta ahí es "Preguntar por WhatsApp" (idealmente con Mi lista). Done: cada sección termina en la acción que su contenido pide.
7. Eventos: tres tarjetas "sin fecha" + "Aún sin fecha" comunican casa inactiva. Fix: hasta que haya fechas, colapsar a una línea con los 3 tipos de actividad + "Fechas en Instagram ↗", y moverlo después de Café.
8. Producción sin og:image / og:url / canonical: compartido por WhatsApp o Instagram sale sin imagen. Los commits del PR #5 mencionan share image; verificar que llegue a main.

## Menor
9. Facetas de Género con categorías de 1 título ("Divulgación", "Ensayo y narrativa", "Ensayo y poesía"): unificar en Narrativa/Poesía/Ensayo.
10. Estado vacío con dos botones que hacen lo mismo ("Limpiar todo" y "Limpiar búsqueda y filtros"): dejar uno. Se vio una vez el contador "10 títulos" tras limpiar (posible stale, no confirmado).
11. Todas las secciones usan el título en dos líneas "X / frase en gris": funciona, pero 8 veces seguidas se vuelve plantilla; reservarlo para hero, casa y visita.

## Lo que ya está bien (no tocar)
Contraste AA en todo el texto (gris 6.88:1, botón primario 6.33:1); focus ring visible; prefers-reduced-motion respetado en todas las capas; targets ≥44px; skip link; Inter variable en un solo archivo.

## Pendiente
Motion de botones y transiciones de scroll-reveal no se midieron en vivo; estado de estas en PR #5 sin revisar (SSO).

---
# Comparación PR #5 (copia local 127.0.0.1:8765, 868b740) vs producción · 2026-11-22 12:45
Evidencia: /workspace/itinerante-critique/pr5/*.png

Qué cambió: tira de editoriales en movimiento bajo el hero; bloque de 3 fotos-capítulo (Catálogo, Café y té, Eventos); sección Editoriales; FAQ en Visita; intro de marca en la primera carga; tagline nueva ("Libros de editoriales independientes, café, eventos y talleres en el centro."); estado de apertura movido debajo del CTA; barra de la carta como pestañas de texto subrayadas.

Publicar: PR #5 rehecho sobre main, con los arreglos de abajo. Responde más preguntas del visitante (horario, FAQ, qué editoriales hay, si te consiguen un libro). Pero hoy empuja el contenido real más abajo.

Contra mi crítica de producción:
1 Hero: sigue abierto. Mejoró el texto, pero sigue chico y gris, el H1 sigue siendo la marca y el estado bajó debajo del CTA (peor).
2 Catálogo duplicado: sigue abierto y empeoró. Ahora son 4 entradas: capítulo "Catálogo", el carrusel, la rejilla y Editoriales. "Llevas 1 de 3 paradas" sigue.
3 Precios de la carta: sigue abierto (los mismos 7 sin precio).
4 Carrusel con teclado: sigue abierto (la crítica de diseño lo confirmó en el PR #5). Arrastre sin revisar.
5 Resaltado de sección: en la carta coincidió en esta pasada; sin confirmar del todo.
6 "Cómo llegar" repetido: sigue abierto. Editoriales dice "te confirmamos si los tenemos" y cierra con Cómo llegar en vez de WhatsApp.
7 Eventos sin fecha: empeoró. Ahora además hay una foto-capítulo en el primer tercio que dice "Aún sin fecha".
8 og:image: los commits dicen que se agregó; sin verificar.
9-11: siguen igual.

Nuevos en el PR #5:
N1 (vale la pena) Las fotos-capítulo repiten el nav del header y empujan "La casa" debajo del pliegue. La tercera es más chica y queda descuadrada. Fix: quitar el bloque, o dejar 2 tarjetas iguales (Catálogo, Café) y meter Eventos solo cuando haya fecha.
N2 (vale la pena) La tira en movimiento corta los nombres en los bordes y compite con el hero. La etiqueta es gris diminuta. Fix: fila estática de nombres/logos (centrada, envolviendo a 2 líneas en móvil), o pausa al pasar el mouse y velocidad lenta.
N3 (vale la pena) Al saltar a #cafe, el título "Café y té" queda tapado por el header pegajoso. Fix: scroll-margin-top = alto del header + 16px en todas las secciones con ancla.
N4 (vale la pena) La barra de la carta perdió fuerza: pasó de pills rellenas a pestañas de texto chico. Fix: volver a las pills de producción.
N5 (menor) Columnas izquierdas vacías en Editoriales y en la FAQ.
N6 (menor) Tres fotos de La casa sin pie útil ("El globo terráqueo", "Ajedrez", "La sala del gong").
N7 (menor) El anillo de foco tarda ~450 ms en aparecer (medición de la crítica de diseño). Debe aparecer al instante: sin transición en box-shadow para :focus-visible.
N8 (menor) "Bestiaria" sale con un color en el carrusel y otro en la rejilla.
Nota: en esta pasada la portada de "Demonios" sí cargó (imagen real). Si la crítica de diseño la vio como rectángulo menta, puede ser intermitente: revisar carga/lazy.

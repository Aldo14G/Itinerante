# Fix list · Itinerante landing (prod)
Fuente: 2026-11-22-landing-prod.md
| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | Hero: promesa en texto más chico, un solo CTA | vale la pena | abierto |
| 2 | Dos secciones "catálogo" + "paradas hojeadas" | vale la pena | abierto |
| 3 | Carta: 7 bebidas sin precio | vale la pena | abierto |
| 4 | Carrusel: drag, teclado en flechas, caption tarde, sin posición | vale la pena | abierto |
| 5 | Scroll-spy atrasado (nav y carta) | vale la pena | abierto |
| 6 | "Cómo llegar" repetido; fin de catálogo debería ser WhatsApp | vale la pena | abierto |
| 7 | Eventos sin fecha ocupando sección completa | vale la pena | abierto |
| 8 | Falta og:image/og:url/canonical | vale la pena | abierto |
| 9 | Facetas de género de 1 título | menor | abierto |
| 10 | Estado vacío con dos botones iguales | menor | abierto |
| 11 | Patrón de título en dos líneas repetido 8 veces | menor | abierto |
PR #5 preview: sin revisar (Vercel SSO).

## PR #5 (868b740) revisado 2026-11-22: 1-11 siguen abiertos (2 y 7 empeoraron). Nuevos:
| N1 | Fotos-capítulo duplican el nav y empujan contenido | vale la pena | abierto |
| N2 | Tira en movimiento corta nombres | vale la pena | abierto |
| N3 | Ancla #cafe tapada por el header | vale la pena | abierto |
| N4 | Barra de la carta perdió fuerza | vale la pena | abierto |
| N5 | Columnas vacías Editoriales/FAQ | menor | abierto |
| N6 | Fotos de La casa sin pie | menor | abierto |
| N7 | Anillo de foco tarda 450 ms | menor | abierto |
| N8 | Color de Bestiaria inconsistente | menor | abierto |
| N9 | Enlace a Facebook roto (profile.php sin id); URL correcta: https://www.facebook.com/people/Librer%C3%ADa-Itinerante-y-m%C3%A1s/100095548961064/ | vale arreglar | abierto (cerrar al verlo en preview) |

Nota punto 7 (2026-11-22): las 3 tarjetas (círculo de lectura, ajedrez, taller) son propuestas, no eventos anunciados. Done = solo llevan fecha si un post oficial anuncia esa misma actividad; eventos de posts entran como tarjetas nuevas con `fuente`; propuestas sin anuncio quedan en la línea con enlace a Instagram; ninguna tarjeta muestra un evento pasado.

Eventos confirmados (la revisión de diseño, 2026-11-22): 6.º Aniversario 27 nov, Matamoros 421, hora sin anunciar; Club de Dibujo y Pintura recurrente sin fecha de inicio. Revisar en preview: la hora faltante no debe mostrarse como "[pendiente]".

## PR #6 (/nuevo) revisado 2026-11-22 13:50 (hora CDMX) · detalle en 2026-11-22-pr6-nuevo.md
Resumen: 16 resueltos, 1 provisional (3), 3 abiertos (5, N4, N6). Nuevos W1–W8.
| # | Hallazgo | Severidad | PR #6 (/nuevo) |
|---|---|---|---|
| 1 | Hero: promesa en texto más chico, un solo CTA | vale la pena | resuelto (H1 = promesa, 2 CTAs; ver W1) |
| 2 | Dos secciones "catálogo" + "paradas hojeadas" | vale la pena | resuelto |
| 3 | Carta: 7 bebidas sin precio | vale la pena | provisional: 2 filas "Precio en barra"; faltan precios reales |
| 4 | Carrusel: drag, teclado en flechas, caption tarde, sin posición | vale la pena | resuelto (teclado, mouse, swipe, "N de 12", pie ≤150 ms) |
| 5 | Scroll-spy atrasado (nav y carta) | vale la pena | abierto: marca la sección anterior en cada clic del nav (Visita→"Eventos") |
| 6 | "Cómo llegar" repetido; fin de catálogo debería ser WhatsApp | vale la pena | resuelto (3; catálogo → WhatsApp) |
| 7 | Eventos sin fecha ocupando sección completa | vale la pena | resuelto (§3b; se oculta el 28 en el cliente; ver W2) |
| 8 | Falta og:image/og:url/canonical | vale la pena | resuelto |
| 9 | Facetas de género de 1 título | menor | resuelto (ver W4) |
| 10 | Estado vacío con dos botones iguales | menor | resuelto |
| 11 | Patrón de título en dos líneas repetido 8 veces | menor | resuelto |
| N1 | Fotos-capítulo duplican el nav | vale la pena | resuelto (bloque quitado) |
| N2 | Tira en movimiento corta nombres | vale la pena | resuelto (fila estática) |
| N3 | Ancla #cafe tapada por el header | vale la pena | resuelto (h2 a 184 px, header 77) |
| N4 | Barra de la carta perdió fuerza | vale la pena | abierto (48 px de alto, sigue como texto subrayado) |
| N5 | Columnas vacías Editoriales/FAQ | menor | resuelto / no aplica |
| N6 | Fotos de La casa sin pie | menor | abierto (3 fotos solo con nombre) |
| N7 | Anillo de foco tarda 450 ms | menor | resuelto (3 px, 0 s, primer frame) |
| N8 | Color de Bestiaria inconsistente | menor | resuelto |
| N9 | Enlace a Facebook roto | vale arreglar | resuelto (URL exacta en el pie) |
| W1 | Horario sin fuente en hero, Visita y JSON-LD (Lun–sáb 11–20, Dom cerrado) | vale la pena | abierto: confirmar con Roberto o quitar la pill y openingHours |
| W2 | Tarjeta del Aniversario de 288 px de 1280, fecha y hora a 14 px | vale la pena | abierto |
| W3 | Carrusel con 15 paradas de Tab (12 portadas) | vale la pena | abierto: roving tabindex |
| W4 | "Las ruinas de la caza" sin género, invisible en los filtros | menor | abierto |
| W5 | 390: "· Sábados" huérfano; "Hora por / anunciar" partido | menor | abierto |
| W6 | Copy: "y más, y sorpresas", "en la casa" ×2, "Los tés" sobre Chocolate | menor | abierto |
| W7 | FAQ: respuesta fuera del recuadro; "¿A qué hora abren?" circular | menor | abierto |
| W8 | Sin JS: flechas y "7 de 12" visibles sin función | menor | abierto |
Bloqueador para cambiar `/`: JS de /nuevo (321 kB en la primera visita, ~1 MB sin comprimir) contra ~175 kB de `/` (la revisión de diseño y la crítica de diseño; coincido).
Lista fusionada P0/P1/P2 para spec v2: 2026-11-22-lista-fusionada-spec-v2.md (buscador 24 px retirado por la crítica de diseño).

## Slop (2026-11-22) · lo que la SPEC v2 no cubre (detalle: 2026-11-22-critica-spec-v2.md)
| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| S-16 | El horario está confirmado (PENDIENTES-NEGOCIO c); la v2 lo quita. Retira W1 | P0 | abierto |
| S-17 | «Apartar por WhatsApp» sin política de apartado (A7) → «Consultar disponibilidad» | P0 | abierto |
| S-18 | Portada y menú sin eventos ni novedades: CTA «Ver eventos» vacío, falta «Libros» en el menú | P1 | abierto |
| S-19 | Club duplicado en Eventos y Tienda; filtro Talleres con 1 elemento | P1 | abierto |
| S-20 | Visita saturada con la carta: orden fijo y carta compacta/`<details>` | P1 | abierto |
| S-21 | Drawer innecesario con 3–4 ítems; texto «Tu sistema pide movimiento reducido» ×2 | P1 | abierto |
| S-22 | Permisos de fotos fuera de los pendientes; la portada depende de una foto | P1 | abierto |
| S-23 | Datos/conteos: 9 sin portada, done de 41 imposible, mapeo de subgéneros, `novedad` vs `novedades.entradas`, 3 contadores, anclas viejas, FB en Visita | P2 | abierto |

2026-11-22 13:46: Aldo confirmó horario Lun–sáb 11:00–20:00, Dom cerrado. W1 retirado; S-16 resuelto en spec (verificar en preview: horario 1 vez en Visita, JSON-LD del mismo campo, sin Abierto/Cerrado).

## v2 11dc813 (f0864f8 + horario) revisado 2026-11-22 14:25 (hora CDMX) · detalle: 2026-11-22-v2-11dc813.md
Veredicto: lista para el OK de Aldo; nada bloquea. 15 resueltos, 1 abierto (P2), 7 nuevos (P2).
| # | Hallazgo | Severidad | v2 11dc813 |
|---|---|---|---|
| JS | JS de la home | P0 | resuelto (0 archivos JS, ~1,3 KB gz inline) |
| 5 | Scroll-spy | P1 | resuelto (clics y barrido correctos a 1440/390) |
| 44px | Objetivos de 44 px | P1 | abierto P2: enlaces de Contacto ~20 px (ver V7) |
| W2 | Aniversario chico | P1 | resuelto (a todo el ancho; queda la fecha repetida, la crítica de diseño) |
| W4 | Ruinas sin género | P2 | resuelto (Narrativa, ELEM citada en correcciones.json) |
| W5 | Cortes a 390 | P2 | resuelto |
| W6 | Copy de relleno | P2 | resuelto (0 frases vetadas) |
| N9 | Facebook | — | resuelto (URL oficial, en Visita) |
| Ev | Reglas de eventos | — | resuelto (Hora por anunciar; oculto el 28 en hora de Monterrey; Club solo en Eventos; sin propuestas) |
| S-16 | Horario confirmado | P0 | resuelto (1 vez en Visita + JSON-LD) |
| S-17 | Sin «apartar» | P0 | resuelto |
| S-18 | CTA y menú sin eventos | P1 | resuelto (28 nov: «Ver libros», «Actividades») |
| S-19 | Club solo en Eventos; filtros de ≥2 | P1 | resuelto |
| S-20 | Orden de Visita | P1 | resuelto (313 px a 390) |
| S-21 | Header sin drawer | P1 | resuelto (isotipo + 3 enlaces) |
| S-22 | Fotos con permiso | P1 | portada ok; Visita ver V4 |
| S-23 | Datos/conteos/anclas | P2 | resuelto |
| V1 | Carta: 7 filas sin precio sueltas | P2 | abierto |
| V2 | Portadas 800 px sin srcset (~1,5–2,5 MB al recorrer) | P2 | abierto |
| V3 | H1 «y / Más» viuda a 1440 | P2 | abierto |
| V4 | Foto oficial en Visita sin permiso registrado | P2 | abierto (decisión de Aldo) |
| V5 | Pies de foto que parecen alt | P2 | abierto |
| V6 | stale-while-revalidate ~1 año (HTML viejo sin JS) | P2 | abierto |
| V7 | Enlaces de Contacto < 44 px | P2 | abierto |

## La camioneta (prototipo, antes de código) revisado 2026-11-22 16:10 (hora de Monterrey) · detalle: 2026-11-22-camioneta-segunda-critica.md
Lo de la crítica de diseño (P0-1, P1-1..4, P2 1–8) se sigue en su archivo; aquí solo lo que no cubrió.

| ID | Sev | Hallazgo | Done | Estado |
|---|---|---|---|---|
| C1 | P1 | La vitrina no tiene foco visible (`.vitrina{outline:none}` anula `:focus-visible`) | Tab real → indicador ≥ 3:1 a 1440 y 390 | abierto |
| C2 | P1 | El FLIP del filtro pinta libros sobre Visita y mueve la página al colapsar | Ninguna portada fuera de `#libros`; parte superior del estante ±8 px | abierto |
| C3 | P1 | El estante abre con placeholders (3 de 5 a 1440, 2 de 4 a 390) y el título va duplicado | Primera fila con portada real; sin título doble | abierto |
| C4 | P1 | Swipe de 180 px avanza 3 libros (refuerza la crítica de diseño P1-4) | Gesto corto = ±1 libro | abierto |
| C5 | P2 | `#libros` sin H2 | H2 visible o sr-only | abierto |
| C6 | P2 | Foco del buscador ≈1.3:1 | ≥ 3:1 | abierto |
| C7 | P2 | Ruinas sin precio | Retirado el fix «Precio en tienda» (choca con §8.13 y spec v2: sin precio no se imprime nada). Pendiente de negocio: Roberto da el precio. | pendiente negocio |
| C8 | P2 | 6 caras de fuente, 134 KB; CLS 0.032 por cambio de fuente | ≤ 4 caras, ≤ 80 KB, CLS < 0.01 | abierto |
| C9 | P2 | La vitrina descarga las 32 portadas al cargar (943 KB frente a 344 KB con reduce) | Lazy ±3 | abierto |

# Crítica de diseño · «La camioneta» · 22 nov 2026

Fuente: `/workspace/projects/itinerante-design-2026-11-22/` (DESIGN-DIRECTION.md completo + prototipo servido en local).
Medición: Playwright + axe-core a 1440 y 390 px, normal y `prefers-reduced-motion`, sin JS, y reloj en 2026-11-28.
Script: `/workspace/projects/itinerante-ux-2026-11-22/cam-audit.js` · datos `cam-raw.json` · capturas `critica-diseno-shots/cam-*`.
Repo no tocado.

## Veredicto: PASA con condiciones

La dirección es la primera de las cuatro versiones que tiene identidad propia y no lee como «IA slop»:
- menta del logo a sangre;
- un solo objeto héroe que es la marca (la camioneta con portadas reales);
- H1 condensado enorme;
- suelos que cambian por sección;
- una vitrina 3D que corresponde a algo real (hojear libros en la mesa).

Se puede pasar a implementación cuando se cierre el P0 (una decisión en el contrato, no en el diseño).

## Lo medido que pasa

| Criterio | Resultado |
|---|---|
| axe (WCAG 2.2 AA) | 0 violaciones en las 4 combinaciones |
| Conteos | «Matamoros» 1, Maps 1, `tel:` 1 · `role=switch` 0 · localStorage vacío |
| Frases vetadas | 0 de 43 |
| Eventos | Sin `registroUrl` muestra «Ver en Instagram» (×2) y «Registrarme» 0, como debe |
| Reloj en 28 nov | El Aniversario se oculta y el CTA pasa a «Ver libros» |
| Reduced motion | `matrix3d` en la vitrina: 31 → 0 (sin rotateY ni translateZ) · 0 animaciones activas |
| Teclado | La vitrina es una sola parada de Tab con aria-roledescription «carrusel» + flechas. **Corrección (16:05 MTY): la vitrina tiene `outline-style: none`, así que no muestra foco. Mi medición solo leyó `outline-width`. Ver C1 de la segunda crítica de diseño (P1).** |
| H1 | 132 px a 1440 · 58.5 px a 390 |
| Jerarquía | H1 → H2 (Eventos/Tienda/Visita) → H3 sin saltos ni eyebrows de sección |

## P0: bloquea entregar §11 al agente de código

**P0-1. El contrato contradice una decisión de Aldo.**
- Aldo decidió que Merch y Talleres van como «Próximamente».
- DESIGN-DIRECTION lo prohíbe en tres sitios: §3 (anti-patrón), §8.13 y §11 «NO HAGAS: pestañas «Próximamente»». Además, §10.1 sigue planteándolo como pregunta abierta.
- El prototipo tampoco lo muestra («Próximamente» = 0). Un agente de código seguiría §11 e ignoraría a Aldo.
- **Fix:** respetar la decisión sin crear contenedores vacíos.
  - Una sola línea de texto en la Tienda, debajo de los filtros: «Merch y talleres: próximamente.» Es texto, no pestaña, chip ni enlace.
  - Reescribir §8.13 y §11 para que digan «sin pestañas ni chips vacíos; Merch/Talleres = una línea "próximamente" hasta tener ≥ 2 productos».
  - Cerrar §10.1 como decidida.
- **Done:** «Próximamente» aparece 1 vez, dentro de `#tienda`, sin rol de tab, botón ni enlace; §8/§10/§11 ya no se contradicen; el test de conteos lo verifica.

## P1: antes del PR

**P1-1. Sin JS la página está vacía.**
- Medido: 345 caracteres de texto, sin libros, sin eventos y sin carta, porque todo se pinta desde `datos.js`.
- En el prototipo es aceptable, y §11 ya exige en la prueba 1 que sin JS el HTML traiga los 41 libros, los eventos, Visita y la carta.
- El riesgo es que se copie la arquitectura del prototipo, y el PR #6 actual sí funciona sin JS.
- **Fix:** el HTML del servidor trae todo el contenido; GSAP solo mejora lo que ya está (vitrina plana y estante visibles por omisión, sin `opacity:0` inicial puesto desde CSS).
- **Done:** la prueba 1 de §11 en verde y una captura a 390 sin JS que muestre portada, eventos, estante y Visita.

**P1-2. A 390 px, Visita queda a 11,157 px (unas 13 pantallas).**
- El estante de 41 libros a 2 columnas mide 8,810 px y la página completa 14,534 px.
- La cabecera enlaza a Visita, pero quien hace scroll para saber cómo llegar se ahoga en el estante.
- **Fix:** a < 768 px, mostrar 12 libros más un botón «Ver los 41 libros» (con el conteo del filtro activo). Al buscar o filtrar se muestra todo lo que coincide. En escritorio, igual que ahora.
- **Done:** a 390, la parte superior de `#visita` queda a ≤ 6,000 px; el botón mide ≥ 44 px y lleva `aria-expanded`; con filtro activo no hay corte.

**P1-3. «41 libros» frente a «5 de 32».**
- La Tienda anuncia «41 libros de editoriales independientes» y la vitrina cuenta «5 de 32».
- Además, la vitrina y el estante muestran los mismos libros dos veces seguidas.
- **Fix:**
  - La vitrina declara su recorte: «5 de 32 con portada».
  - Debajo de la ficha breve, un enlace «Ver los 41 en el estante» que lleve a `#libros`.
  - No inventar un criterio de «novedades» para recortarla.
- **Done:** ningún número contradice a otro en la misma pantalla; desde la vitrina se llega al estante en 1 acción.

**P1-4. El arrastre táctil no se probó en un dispositivo real.**
- Lo admite la autocrítica (15/20). El `touch-action: pan-y` es correcto, pero el gesto horizontal dentro de una página vertical es justo donde fallan estos carruseles.
- **Fix:** probar en un iPhone (Safari) y un Android (Chrome). En la prueba 7, reportar si el scroll vertical sobre la vitrina se queda atrapado.
- **Done:** video corto de cada dispositivo en el PR; el scroll vertical iniciado sobre la vitrina sigue desplazando la página; un lanzamiento corto avanza 1 libro.

## P2: pulido

1. **La fecha del Aniversario sale 3 veces en la tarjeta:** la parada de la ruta (VIE 27 NOV), el bloque menta «VIE 27 NOV» y el contexto. **Fix:** si no hay cartel con permiso, el bloque menta muestra la camioneta o queda neutro sin repetir la fecha. **Done:** la fecha aparece 1 vez por evento.
2. **«Hora por anunciar» va encima del título del evento,** que es el patrón de Luma pero rompe la regla §5.1/§8.1 del propio documento («nunca encima de un título»). **Fix:** moverlo bajo el título junto al lugar, o aceptar la excepción por escrito en §8. **Done:** regla y prototipo coinciden.
3. **Flechas de Eventos con 2 eventos.** §6 dice «≥ 3 eventos: flechas»; a 390 las flechas aparecen con 2. En móvil se justifican porque hay desborde. **Fix:** cambiar la regla a «flechas cuando la ruta desborda». **Done:** a 1440 con 2 eventos no hay flechas; a 390 sí.
4. **Enlace en línea «tienda» de 20 px de alto.** Entra en la excepción en línea de WCAG 2.5.8, pero se toca mal en móvil. **Fix:** aumentar el área con padding vertical, o mejor, convertirlo en una acción. **Done:** área ≥ 24 px.
5. **Sin enlace para saltar al contenido.** El primer Tab cae en el logo y la página tiene 72–74 paradas. **Fix:** un enlace oculto «Ir al contenido» como primer foco. **Done:** el primer Tab lo muestra.
6. **GSAP (106 KB) y las fuentes llegan desde CDN en el prototipo.** §11 ya pide npm y woff2 locales. **Done:** 0 peticiones a jsdelivr y a fonts.googleapis en producción.
7. **Peso de la página: 1.23 MB con movimiento y 0.63–0.67 MB con movimiento reducido.** **Fix:** usar las portadas -600 en la vitrina y el estante (P2 abierto de la segunda crítica de diseño). **Done:** ≤ 700 KB a 390.
8. **Pendientes heredados que siguen abiertos (la segunda crítica de diseño, v2):** carta en grupos, Contacto a 44 px, desfase de revalidate el día 28 y prueba con merch de muestra.

## Riesgo «IA slop»: bajo

- No hay gradiente, vidrio, eyebrows numerados, hero partido de plantilla ni filas de tarjetas iguales.
- El trazo de la camioneta es el logo real, no un ícono de librería.
- El único punto con olor a plantilla es la tarjeta de evento sin cartel (bloque de color con fecha). Se resuelve con el P2-1 y con los carteles cuando Roberto dé permiso.

## Decisiones para Aldo (no las resuelve la crítica de diseño)
- Confirmar la redacción de la línea «Merch y talleres: próximamente.» (P0-1).
- El permiso de Roberto para los carteles de eventos y la foto oficial-rincon siguen pendientes.

## Nota sobre la segunda crítica de diseño (16:05 MTY)
- Confirmo su C1: la vitrina no muestra foco. Queda como P1.
- No adoptar «Precio en tienda» para «Las ruinas de la caza». Es un texto que sustituye al precio, y §8.13 del documento y la spec v2 lo prohíben: si el precio es nulo, no se imprime nada. Si falta el dato, lo da Roberto.

# REA «interfaz premium»: sistemas de producto y librerías de componentes (2026-11-18)

**Qué es.** Investigación de referencia para Librería Itinerante y Más. Aldo quiere que la interfaz se sienta premium con las normas que usan Uber, DiDi, Airbnb y Apple. Se estudió **cómo lo resuelven** y se extrajeron reglas con cifra. **No se copió nada**: ni texto, ni logotipos, ni imágenes, ni código. Todo lo que se propone se implementa con HTML, CSS y JS propios y los tokens de `design/tokens.json`; las librerías no entran al sitio (cero dependencias en tiempo de ejecución).

**Cómo se leyó (honestidad de la evidencia).**
- **A = fuente primaria leída en esta corrida**: código o tokens publicados (GitHub raw, paquetes de npm descargados y abiertos) o el JSON oficial de la HIG de Apple.
- **B = secundaria**: solo resumen del buscador; **no cuenta como cifra verificada**. Va marcada «(B)».
- La mayoría de los sitios de documentación están bloqueados en la red de la sesión (lista al final). Para esos sistemas se leyó el **paquete de tokens publicado en npm**, que es la misma verdad que la documentación, pero sin su prosa.
- Lo que ya catalogan `docs/ux/FUENTES.md` y la REA de Luma y de apps de comida (WCAG, APG, NN/g, Laws of UX, medidas de DiDi Food) no se repite: se cita por nombre.

**Léase con esto en mano.** El sitio ya está muy sistematizado (Apple HIG + tokens + Sistema de guías). La mayor parte de la tabla de consenso sale «cumple». El valor de este informe está en (1) confirmar con cifras de otros sistemas que las decisiones actuales no son raras y (2) las 12 mejoras de la sección final, que son huecos reales.

---

## 1. Reglas por fuente

Formato: regla con cifra · fuente · ley de UX que la sustenta.

### 1.1 Uber Base Web (A: código en GitHub; docs `baseweb.design` y `base.uber.com` bloqueados)
URL: https://github.com/uber/baseweb (`src/themes/shared/*.ts`, `src/button/styled-components.ts`) · **Licencia MIT**, © Uber Technologies.
1. **Espacio con base de 4 px**: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 96, 128, 192 (`sizing.ts`). Miller/orden: pocos escalones, todos múltiplos de 2.
2. **Alto de botón**: mini 28 · compacto 36 · **por omisión 48 · grande 56** (`scale850/950/1200/1400`). Ancho mínimo si «fill»: 52/60/72/80. Fitts.
3. **Forma**: radio de botón e input 8, popover 8, etiqueta 24; **píldora opcional (999)** y círculo/cuadrado solo para iconos con tamaño fijo = alto del botón. Escala de radios 2, 4, 8, 12, 16. Gestalt (forma común).
4. **Cuerpo 16/24** (font300) y 18/28; etiqueta de botón 16/20 peso 500; texto auxiliar 14/20 y 12/20; encabezados 20/28, 24/32, 28/36, 32/40, 36/44, 40/52 (todos 700); display 52/64 y 96/112. Interlínea 1.5 en cuerpo, 1.2–1.33 en títulos.
5. **Movimiento**: 100, 150, 200, 250, 300, 400, 500, 600, 700… ms; **tres curvas con papel**: desacelerar al entrar `cubic-bezier(0.22,1,0.36,1)`, acelerar al salir `(0.64,0,0.78,0)`, mover en pantalla `(0.83,0,0.17,1)`. Doherty.
6. **Elevación**: cuatro sombras de alfa 0.16: `0 1px 4px`, `0 2px 8px`, `0 4px 16px`, `0 8px 24px`; direccionales «above» para barras de abajo (`0 -4px 16px` a 0.12; profunda `0 -16px 48px` a 0.22).
7. **Todos los bordes miden 1 px.** Ley de la región común: borde fino, no peso.
8. Principios públicos de Base (B, página de carreras de Uber): 4 categorías de letra, 3 colores principales (blanco, negro y un acento) y 5 tamaños sobre una cuadrícula de 4 px. Miller + Hick.

### 1.2 DiDi (A parcial: lo medido antes; sin sistema público)
No hay sistema de diseño público de DiDi ni de DiDi Food (búsqueda, 2026-11-18). Solo aparece la ficha del premio iF 2024 de «Global One Design System» (sin especificación) y un centro de marca (`DiDiBrandCenter.com`, no verificado). **Las medidas de DiDi Food que existen** son las de `docs/ux/investigacion-2026-11/apps-de-comida.md` (nombre 600 18/20, precio a 4 px debajo, foto cuadrada de 144 a la derecha, una columna en teléfono y dos en escritorio, 16 px entre filas). No se repiten aquí.

### 1.3 Airbnb DLS (B; `airbnb.design` bloqueado)
Solo el buscador: el DLS busca «un lenguaje más bello y accesible» y un sistema unificado para construir mejor y más rápido. La cifra de 44 pt que circula viene de una guía de terceros, **no de Airbnb**; no se usa. **Sin reglas con cifra verificada.** Lo útil es conceptual: un solo lenguaje entre plataformas (el sitio ya lo hace con tokens).

### 1.4 Apple HIG, lo que no está en DESIGN.md (A: JSON oficial `developer.apple.com/tutorials/data/design/human-interface-guidelines/*.json`)
© Apple, solo referencia, sin copia de texto.
1. **Botones**: región mínima 44×44 pt; **«una o dos» primarias prominentes por vista; el favorito se distingue por estilo, no por tamaño: las opciones miden lo mismo**; siempre un estado de presionado; para acciones no instantáneas, indicador de actividad dentro del botón y verbo en gerundio («Checking out…»). Fitts, Hick, Von Restorff.
2. **Hojas**: detentes medio y grande; **grabber en toda hoja redimensionable**; **en iOS, deslizar hacia abajo cierra**, con confirmación si hay cambios sin guardar; una hoja a la vez (si cerrar una abre otra, se cierra la primera); nunca Cancelar, Listo y Atrás juntos. Jakob, Postel.
3. **Barra de pestañas**: «las menos posibles»; ≤ 5 en iPad; etiqueta de una palabra; no deshabilitar ni ocultar una pestaña; **las pestañas navegan entre secciones, no ejecutan acciones**; insignias solo para lo crítico; en iOS flota sobre vidrio y puede minimizarse al desplazar. Jakob, Miller.
4. **Movimiento**: con propósito; **evitar movimiento en interacciones muy frecuentes** (la gente lo paga cada vez); opcional (nunca el único canal); reversible (si entra por arriba, no sale de lado); **cancelable**: no hacer esperar a que termine; feedback breve y atado a la acción. Doherty, frecuencia de uso.
5. **Materiales**: Liquid Glass solo en la **capa funcional** (barras, controles que flotan), «con mesura»; variante regular por omisión, clara solo sobre fotos y con **velo oscuro de 35 %** si el fondo es claro; nunca colores de bajo contraste sobre material. Von Restorff.
6. **Color**: dar a cada color propio **variantes clara, oscura y de alto contraste** («significativamente» más diferenciadas); no usar color como único indicador; **colorear el fondo de la acción primaria, no el símbolo**, y no colorear fondos de varios controles. Von Restorff.
7. **Barras de herramientas**: ≤ 3 grupos; títulos de menos de 15 caracteres; una sola acción prominente en el extremo final; **radios concéntricos** con el de la barra (los componentes propios deben igualarlo). Gestalt (continuidad).
8. **Carga**: mostrar algo enseguida, con marcadores; determinado cuando se sabe el tiempo, indeterminado si no. Doherty.
9. **Imágenes**: @2x y @3x en iOS; fotos en JPEG o HEIC; incluir perfil de color.
10. **Distribución**: agrupar por espacio, contenedor o línea; espaciado consistente («el inconsistente rompe la rejilla»); apilar en vertical cuando crece el texto; probar el menor y el mayor tamaño primero. Gestalt (proximidad).

### 1.5 Material 3 (A: `@material/web` 2.5.0 en npm; `m3.material.io` bloqueado) · **Licencia Apache-2.0**
URL: https://github.com/material-components/material-web
1. **Capas de estado**: hover 8 %, foco 10 % (tokens `*-state-layer-opacity`). Dos cifras de capa sobre el color del contenedor, no un tono nuevo por estado.
2. **Deshabilitado**: texto al **38 %**, contenedor al **12 %** (`disabled-label-text-opacity`, `disabled-container-opacity`).
3. **Objetivo táctil 48×48** aunque el contenedor mida 40: un envoltorio añade `margin: max(0, (48 − alto)/2)`. Fitts.
4. **Anillo de foco de 3 px** con separación de 2 px (`focus-ring-width`, `focus-ring-offset`), animado en 600 ms.
5. **Movimiento** (tokens `--md-sys-motion-*`): corto 50/100/150/200, medio 250/300/350/400, largo 450/500/550/600, extra largo 700–1000 ms. Curvas: estándar `(0.2,0,0,1)`, desacelerar `(0,0,0,1)`, acelerar `(0.3,0,1,1)`; enfatizada `(0.2,0,0,1)`, desacelerada `(0.05,0.7,0.1,1)`, **acelerada `(0.3,0,0.8,0.15)`**.
6. **Forma**: esquinas 0, 4, 8, 12, 16, 20, 28, 32, 48 y total.
7. **Jerarquía de tokens**: referencia → sistema (rol) → componente; el tema se cambia con variables CSS.
8. (B) 48 dp de objetivo y 8 dp entre objetivos; las alturas de lista 48/56/72 son de Material 1, no se usan.

### 1.6 Shopify Polaris (A: `@shopify/polaris-tokens` 9.4.2 en npm; `polaris-react.shopify.com` bloqueado) · **Licencia MIT**, © Shopify
URL: https://github.com/Shopify/polaris
1. **Espacio**: 0, 1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 112, 128. **Hueco entre botones 8; hueco y relleno de tarjeta 16**, pero **en el tema móvil el hueco de tarjeta baja a 8** (`--p-space-card-gap`). Proximidad.
2. **El tema móvil sube el cuerpo**: body-md 13/20 pasa a **16/24**, body-sm 12/16 a 14/20, body-lg 14/20 a 18/28. Regla: en el teléfono el texto de lectura nunca queda en 13–14.
3. **Escala de títulos**: 24/32 (xl), 30/40 (2xl), 36/48 (3xl), con peso 700 y **tracking negativo** creciente (−0.2 px a −0.54 px).
4. **Pesos finos de letra variable**: 450, 550, 650, 700 (no 400/500/600). Una forma de afinar el tono sin cambiar de fuente.
5. **Radios** 2, 4, 6, 8, 12, 16, 20, 30 y total; borde 1 px (2 y 4 para énfasis).
6. **Movimiento**: 50–500 ms; `ease-out (0.19,0.91,0.38,1)`, `ease-in (0.42,0,1,1)`.
7. **Elevación**: seis sombras de dos capas y alfa 0.07–0.28; **en el tema móvil las sombras de botones se vuelven nada o borde interior**: el teléfono es plano y la elevación solo va en lo que flota.
8. **Estados como sufijo en cada rol**: `bg-fill`, `-hover`, `-active`, `-selected`, `-disabled`; `text`, `-secondary`, `-disabled`, `-link`; `border`, `-hover`, `-disabled`, `-focus`; input con borde propio (`#8a8a8a`, 3:1+). Es el patrón que el sitio ya sigue con `fondo-3-presionado`.
9. Puntos de quiebre: 0, 490, 768, 1040, 1440.

### 1.7 Atlassian Design System (A: `@atlaskit/tokens` 20.13.0 en npm; `atlassian.design` bloqueado) · **Licencia Apache-2.0**
URL: https://atlassian.design (paquete en npm).
1. **Espacio**: 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, con alias de rol (`gap` xxsmall 2 … xxlarge 24; `inset` 2 … 5xlarge 48). Un valor por rol, igual que «aire por rol» del sitio.
2. **Radios** 2, 4, 6, 8, 12, 16, total; borde 1 px; **borde seleccionado y enfocado 2 px**.
3. **Duraciones**: 50, 100, 150, 200, 250, 400, 600 ms (instantánea, xxs … xxlong). Tope de interfaz: 600.
4. **Curvas**: `out.expo (0.16,1,0.3,1)` (**es la `curva-salida` del sitio**), `out.quart (0.25,1,0.5,1)`, `in.practical (0.6,0,0.8,0.6)`, `inout.bold (0.4,0,0,1)` y un **resorte** `linear(…)` con rebote de 2.4 %.
5. **Entrada y salida no son simétricas en distancia**: se entra deslizando **8 px** y se sale deslizando **4 px**; escala de entrada 95→100 % (pequeña) u 80→100 % (media). La salida es la mitad. Doherty, feedback breve.
6. **Temas**: claro, oscuro y **sus variantes de alto contraste** como temas aparte (`atlassian-light-increased-contrast`, `…-dark-increased-contrast`). Tres ejes: claro/oscuro × contraste.
7. Pesos de letra 400, 500, 600 y 653 (negrita afinada).

### 1.8 IBM Carbon (A: `@carbon/layout` 11.63, `@carbon/motion` 11.56, `@carbon/type` 11.71 en npm; `carbondesignsystem.com` bloqueado) · **Licencia Apache-2.0**
URL: https://github.com/carbon-design-system/carbon
1. **Espacio en rem de la mini-unidad de 8**: 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160 px. Tamaños de contenedor 24, 32, 40, 48, 64 (xs a xl) y 80 (2xl).
2. **Escala tipográfica por fórmula**: de 12 px a 92 px, cada paso suma 2 px (+1 cada 4 pasos); piso de 12 px; interlíneas de cuerpo 1.28 a 1.5.
3. **Duraciones**: rápida 70 y 110, moderada 150 y 240, lenta **400 y 700**. **La escalera del sitio (120/240/400/700) es esta casi igual.**
4. **Curvas con papel**: estándar `(0.2,0,0.38,0.9)`, **entrada `(0,0,0.38,0.9)`, salida `(0.2,0,1,0.9)`**, y variantes expresivas `(0.4,0.14,0.3,1)`, `(0.4,0.14,1,1)`. Productivo = respuesta; expresivo = momentos grandes.
5. Iconos de 16 y 20 px.

### 1.9 Radix Themes 3.3.0 y Radix Primitives (A: npm) · **Licencia MIT**
URL: https://github.com/radix-ui/themes · https://github.com/radix-ui/primitives
1. **Espacio** 4, 8, 12, 16, 24, 32, 40, 48, 64; **un único `--scaling` (90–110 %)** multiplica espacio, letra y radios: un solo mando de densidad.
2. **Letra** 12, 14, 16, 18, 20, 24, 28, 35, 60 con interlíneas 16, 20, 24, 26, 28, 30, 36, 40, 60; por omisión 16/24.
3. **Radios** 3, 4, 6, 8, 12, 16 multiplicados por un `--radius-factor` (un mando para pasar de recto a píldora).
4. **Botones 24 / 32 / 40 / 48** (tamaños 1–4 = `space-5…8`); sombras 1–6 con anillo de 1 px más una o dos capas.
5. `cursor: default` en botones (no mano): convención de app, no de página.
6. **Primitives**: sin estilo; cada parte expone `data-state` y `data-orientation`; **Tabs tiene `activationMode`**: automático (el foco selecciona) o manual (Enter/Espacio confirma), para paneles caros. Jakob.

### 1.10 React Aria (Adobe) (A: `react-aria` 3.53.1 y `@react-aria/interactions` en npm; docs bloqueadas) · **Licencia Apache-2.0**
URL: https://github.com/adobe/react-spectrum
1. **Presionar es un estado propio, no `:active`**: sigue `isOverTarget` (si el dedo sale del objetivo, el estado de presionado se retira; si vuelve, regresa).
2. **En toque, desplazar cancela el presionado** (escucha `scroll`): un deslizamiento nunca dispara una acción.
3. **Pulsación larga: 500 ms** por omisión (`DEFAULT_THRESHOLD`).
4. **Hover ignora el ratón emulado tras un toque** (iOS dispara `pointerenter` dos veces, una de toque y otra de ratón): el hover solo existe con puntero real. El sitio lo logra con `@media (hover: hover)`.
5. **Foco visible por modalidad** (teclado sí, puntero no): el equivalente de `:focus-visible`.

### 1.11 Ark UI (Chakra) y Zag.js (A: `@ark-ui/react` 5.40, `@zag-js/dialog` 1.48 en npm; `ark-ui.com` bloqueado) · **Licencia MIT**
1. Componentes como **máquinas de estado** (Zag): una sola fuente de verdad por widget, sin estilos.
2. **Diálogo**: opciones explícitas `trapFocus`, `restoreFocus`, `preventScroll`, `closeOnEscape`, `closeOnInteractOutside`, y `aria-modal`. Es la lista que un `<dialog>` nativo debe cumplir (el sitio lo cumple con `showModal()` y el contador de bloqueo de scroll).

### 1.12 Headless UI (Tailwind Labs) (A parcial: `@headlessui/react` 2.2.10; `headlessui.com` bloqueado) · **Licencia MIT**
Expone el estado por atributo (`data-headlessui-state`) para que el CSS lo lea sin clases de JS. Sin cifras.

### 1.13 shadcn/ui (A: raw de `shadcn-ui/ui` y paquete `shadcn` 4.23) · **Licencia MIT**
URL: https://github.com/shadcn-ui/ui
1. **Botón** `h-9` (36) por omisión, `h-8` (32), `h-10` (40) y `h-6` (24); icono 36/32/40/24; texto 14 peso 500; gap 8; radio `md`. Es **escala de escritorio**.
2. **Input** de 36 con `text-base` (16) en teléfono y `md:text-sm` (14) desde el punto de quiebre medio. **La regla de 16 px en campos del teléfono (que iOS no acerque la página) está en su base.**
3. **Foco**: anillo de **3 px al 50 %** de opacidad más borde en el color de anillo; **inválido**: anillo al 20 % (40 % en oscuro); **deshabilitado**: **opacidad 50 %** y sin eventos de puntero.
4. **Hoja** (sheet): velo `black/50`; **abrir 500 ms, cerrar 300 ms** (la salida dura 60 % de la entrada); lateral `w-3/4` hasta `sm:max-w-sm`; inferior `h-auto` con borde superior.
5. **Variantes de estado por atributo** (`data-open`, `data-closed`, `data-checked`, `data-selected`, `data-disabled`, `data-active`, `data-horizontal`): el CSS se lee como una tabla de estados.
6. **«Código abierto»**: el componente se copia al repo, no se importa; el sitio ya tiene su equivalente en `design/componentes.json`.

### 1.14 Origin UI (A: README en GitHub, `origin-space/originui`) · **Licencia MIT**
Colección heredada (ahora con soporte limitado) de componentes al estilo shadcn sobre Radix; el trabajo nuevo pasó a «Particles» (coss ui). **No aporta reglas nuevas** sobre shadcn; no se estudió su CSS. Magic UI y Aceternity ya estaban estudiados.

### 1.15 Primer (GitHub) (A: `@primer/primitives` 11.10 en npm; extra, no pedido) · **Licencia MIT**
1. **Objetivo mínimo según puntero**: `control-minTarget-coarse` **44 px**, `fine` **16 px**. Es el mismo criterio del sitio (token `target`: 24 fino / 44 táctil).
2. Alto de control 24, 28, 32, 40, 48; relleno horizontal 12.
3. Hueco de pila **condensado 8, normal 16**. Radios 3, 6, 12, total. Duraciones 50–1000 ms.

### 1.16 Vercel Geist, Linear y Stripe (B: sus sitios están bloqueados)
- **Geist** (B): 10 escalas de color de 100 a 1000; **cada paso tiene un rol** (4–6 bordes en reposo/hover/activo; 7–8 fondo de alto contraste y su hover; 9–10 texto secundario y primario) y dos fondos (100 y 200). Es el mismo patrón que `fondo-3 → fondo-3-presionado` del sitio, pero ordenado por número. La fuente Geist es **SIL OFL** (npm).
- **Linear** (B): el tema se genera en **LCH** con **tres variables** (color base, acento, contraste) en lugar de 98; uniformidad perceptual para que las superficies suban de nivel con el mismo salto.
- **Stripe** (B): paleta en **CIELAB** con contraste uniforme entre tonos y texto que pasa el umbral WCAG por construcción.
- Sin cifras verificadas; el valor es el **método**: derivar los tonos de estado del color base con una regla, no a mano.

---

## 2. Tabla de consenso

«Sitio hoy» según `DESIGN.md` y `design/tokens.json`. ✓ cumple · ~ cumple en parte · ✗ no cumple.

| # | Regla | Cifra que comparten | Fuentes | Sitio hoy | ¿Cumple? | Leyes |
|---|---|---|---|---|---|---|
| 1 | Base de espacio | **4 px** con escalones de 8 | Uber, Polaris, Atlassian, Carbon (2/4/8), Radix, Primer | `space-1` = 4 … `space-28` = 112 | ✓ | Miller |
| 2 | Alto de control táctil | **44 mín., 48 por omisión, 56 grande** | Apple 44; Uber 48/56; Material 48; Primer coarse 44; Radix 48 | 44 / 48 / 56 | ✓ | Fitts |
| 3 | Objetivo según puntero | **coarse 44 / fine 16–24** | Primer (44/16), WCAG 2.5.8 (24) | `target` 24 fino, 44 táctil | ✓ | Fitts |
| 4 | Aire entre objetivos | **8 px** | Material (B), Polaris (hueco de botones 8), Primer (8) | `separacion-tactil` 8 | ✓ | Fitts |
| 5 | Primarias por vista | **1** (Apple: 1–2) | Apple, Polaris | 1 por pantalla (más estricto) | ✓ | Hick, Von Restorff |
| 6 | Opciones del mismo grupo | **mismo tamaño; jerarquía por estilo** | Apple; Uber (un tamaño por grupo) | Primaria 56 con secundarias de 44 (destacado de Eventos) | ✗ | Gestalt, Fitts |
| 7 | Cuerpo en teléfono | **16–17 px** | Uber 16, Radix 16, Polaris móvil 16, shadcn input 16 | 17/22 y 17/24 | ✓ | Legibilidad |
| 8 | Interlínea de lectura | **1.4–1.5** | Uber 16/24, Material 1rem/1.5rem, Radix 16/24, Carbon 1.43 | UI 1.29 (17/22); lectura 1.41 (17/24) | ~ | Legibilidad |
| 9 | Interlínea de títulos | **1.15–1.33** | Uber 28/36…, Polaris 24/32, Radix 28/36 | 1.2 (34/41), 1.21 (28/34) | ✓ | — |
| 10 | Piso de tamaño de letra | **12 px** | Carbon, Radix, Uber, Polaris (11) | 12 (el 11 no se usa) | ✓ | Legibilidad |
| 11 | Tracking de titulares | **negativo, creciente con el tamaño** | Polaris (−0.2 a −0.54 px), Apple | `ls-*` −0.022 em en 34 | ✓ | — |
| 12 | Radios | botones 8; tarjetas 12–16; píldora opcional | Uber 8, Polaris 8–12, Atlassian 8, Material 12–28 | 12 / 20 / 28 / píldora | ✓ (más suave por diseño Apple) | Gestalt |
| 13 | Radios concéntricos | **interior = exterior − inset** | Apple (barras) | Interior 12 dentro de 28 con inset 8 (el menú) | ~ | Gestalt |
| 14 | Elevación | **3–4 niveles, alfa .07–.28, blur 4–24 px, borde 1 px** | Uber, Polaris, Radix | 5 sombras con nombre de uso; bordes de 1 px | ✓ | Región común |
| 15 | Elevación en oscuro | **superficie más clara, no sombra** | Atlassian, Material | `fondo` → `fondo-2` → `superficie` → `fondo-3` más claros | ✓ | — |
| 16 | Duraciones | rápida **100–150**, base **200–250**, lenta **300–400**, tope UI **≤ 600** | Carbon 110/240/400/700, Atlassian 100…600, Material 100…600, Polaris ≤ 500 | 120 / 240 / 400 / 700 (700 solo revelados) | ✓ | Doherty |
| 17 | Curvas con papel | **decelerar al entrar, acelerar al salir** | Uber, Material, Carbon, Atlassian, Polaris | `curva-salida` (= Atlassian expo), `curva-entrada-salida`, resorte; **sin curva de aceleración** | ~ | Doherty |
| 18 | Salida más corta que entrada | **≈ 60 %** (300/500; 4 px/8 px) | shadcn sheet, Atlassian | Hojas de Mi lista 240 vs 400 ✓; **menú ☰ 400 y 400** | ~ | Doherty |
| 19 | Capas de estado | hover **8 %**, foco **10 %** | Material | hover 6 % (mezcla) y 10 %; presionado con tono propio | ✓ | Feedback |
| 20 | Deshabilitado | texto **38 %**, contenedor **12 %** (o 50 % de opacidad) | Material, shadcn | `fondo-3` y `tinta-2` sin atenuar | ~ | Jakob |
| 21 | Foco visible | **2–3 px** con separación de 2 | Material 3, Atlassian 2, shadcn 3, WCAG 2.4.13 | `anillo-foco` 2 + 2 | ✓ | Accesibilidad |
| 22 | Movimiento en lo frecuente | **evitarlo o dejarlo muy breve** | Apple; Atlassian (máx. 250 en lo común) | Menú ☰: cascada de 30 ms, la última termina a los 450 ms | ✗ | Frecuencia, Doherty |
| 23 | Hojas inferiores | **grabber + deslizar para cerrar** | Apple | Solo la ficha lo tiene; Mi lista y Explorar, no | ✗ | Jakob |
| 24 | Barra de pestañas | **≤ 5, etiqueta, navegar no actuar** | Apple | 3; Mi lista abre una hoja (acción) | ~ | Jakob, Miller |
| 25 | Diálogo accesible | **trampa de foco, devolver foco, Esc, bloqueo de scroll** | Zag, Radix, React Aria | `<dialog>.showModal()` + contador de scroll | ✓ | Accesibilidad |
| 26 | Hover solo con puntero real | **ignorar el emulado por toque** | React Aria | `@media (hover: hover)` | ✓ | Jakob |
| 27 | Presionar | **estado propio; desplazar cancela** | React Aria | `:active` por familia (color y escala) | ✓ | Feedback |
| 28 | Cristal solo en lo funcional | **capa funcional, con mesura, respaldo opaco** | Apple Materials | Vidrio solo en lo que flota, con respaldo | ✓ | Von Restorff |
| 29 | Color en alto contraste | **variante clara, oscura y de alto contraste** | Apple Color, Atlassian | Solo un contorno en el vidrio con `prefers-contrast: more` | ✗ | Accesibilidad |
| 30 | Carga | **marcador inmediato, indicador en la acción lenta** | Apple Loading, Doherty | Esqueletos y estados vacío/error | ✓ | Doherty |
| 31 | Estado como atributo | **`data-state` / `data-*`** | shadcn, Radix, Zag, Headless UI | Clases `.is-*` y `aria-*` | ~ | Mantenibilidad |
| 32 | Tonos de estado derivados | **regla, no hex a mano** | Linear (B), Stripe (B), Polaris | 3 tonos de presionado a mano, medidos en prueba | ~ | — |

---

## 3. Dónde las fuentes discrepan y qué recomiendo

| Tema | Discrepancia | Recomendación |
|---|---|---|
| **Alto de control en escritorio** | Apple 44; Uber 48; Material 40 + 48 de área; shadcn 36; Radix 32–40; Primer 32 | Mantener **44/48/56** en toque y como valor por omisión del sitio (comercio y editorial, no panel de control). En escritorio con puntero fino, solo los chips de filtro y las acciones de tercer nivel podrían bajar a 40. |
| **Tamaño entre opciones** | Apple: «mismo tamaño, estilo distinto»; el sitio usa 56 vs 44 para marcar la primaria | Apple y Uber son explícitos. Recomiendo igualar el alto dentro de un grupo y diferenciar por relleno (primaria llena, contorno). **Decisión de Aldo.** |
| **Radio de botón** | Uber 8 (píldora opcional); Material 8–28; Apple cápsula en iOS 26 | Seguir con píldora (es la decisión del sistema Líquido y coincide con Apple). |
| **Duración máxima** | Atlassian 600; Polaris 500; Material 600 (700–1000 «extra largo»); Uber y Primer hasta 1000 | **UI ≤ 400 ms; 700 solo revelados editoriales** (la regla actual). Carbon avala el 700 como «lento 02». |
| **Curva de entrada** | Material `(0.05,0.7,0.1,1)`, Uber `(0.22,1,0.36,1)`, Atlassian `(0.16,1,0.3,1)`, Polaris `(0.19,0.91,0.38,1)` | Son casi la misma familia. **La `curva-salida` del sitio es la de Atlassian: no cambiar.** |
| **Curva de salida** | Material `(0.3,0,0.8,0.15)`, Uber `(0.64,0,0.78,0)`, Atlassian `(0.6,0,0.8,0.6)`, Carbon `(0.2,0,1,0.9)` | Elegir Material acelerada `(0.3, 0, 0.8, 0.15)`: la más conocida y la que más rápido deja salir lo que ya no importa. |
| **Interlínea de cuerpo** | Apple 17/22 (1.29) en UI; Uber/Material/Radix 1.5 | Dos reglas: **1.29 en controles y filas, 1.5 en párrafos de tres renglones o más**. Hoy hay 1.41. |
| **Deshabilitado** | Material 38/12; shadcn 50 % de opacidad; Polaris tokens propios | Un token `deshabilitado`: 38 % de la tinta sobre `fondo-3`. WCAG exime a lo inactivo. |
| **Foco** | Material 3 px; shadcn 3 px a 50 %; Atlassian 2 px; Apple/WCAG 2 px | Mantener 2 + 2 (cumple 2.4.13). |
| **Pestañas que navegan** | Apple: nunca una acción; el sitio pone «Mi lista» (abre hoja) | Aceptable como destino, pero conviene documentarla como excepción deliberada. |

---

## 4. Mejoras priorizadas (12)

Todas con HTML, CSS y JS propios y tokens. «Decisión» = lo que cambiaría una decisión ya aprobada por Aldo.

### P0 (hueco medible, evidencia fuerte, riesgo bajo)

**M1. Deslizar para cerrar en Mi lista y Explorar (teléfono).**
- Hoy solo la ficha lo hace (`catalog.js:645`, grabber `.drawer-grabber` en `mobile.css`); Mi lista y Explorar no tienen asa ni gesto.
- Objetivo: mismo grabber (36 × 5 px, a 8 px del borde), mismo umbral (120 px o 0.7 px/ms) y el cierre en `dur-rapida`. Sacar la lógica de arrastre de `catalog.js` a `sheets.js` y usarla en `.mylist` y `.explorer`.
- Apple (Sheets: grabber, deslizar para cerrar), Jakob, Postel. **Decisión: ninguna** (consistencia con la ficha).

**M2. Salidas más cortas y con curva de aceleración.**
- Añadir un token `curva-aceleracion`: `cubic-bezier(0.3, 0, 0.8, 0.15)`. Usarla en todo `is-closing` y en el aviso que se va.
- Regla: **salida = 60 % de la entrada** (240 si entra en 400). El menú ☰ hoy cierra en `dur-base` (400): pasar a `dur-rapida` (240), como ya hacen `.drawer` y `.mylist` (`style.css` ~1041).
- Material (acelerada), shadcn (300/500), Atlassian (4/8 px), Apple (cancelable, reversible). Doherty. **Decisión: ninguna**, solo un token nuevo; el catálogo de tokens ya admite añadidos.

**M3. Presupuesto de movimiento del menú ☰.**
- Hoy la cascada de 30 ms deja la última fila a los 450 ms (`DESIGN.md`, Menú ☰). Apple pide **evitar movimiento en lo frecuente** y el sitio mide «tarea < 400 ms».
- Objetivo: escalón de **15 ms** (la última a ≤ 330 ms) o cascada solo la primera apertura de la sesión. Selector probable: `.menu-row` con `transition-delay` por índice; `dur-rapida` se queda.
- Apple (Motion), Atlassian (≤ 250 ms en lo común), Doherty, frecuencia de uso. **Decisión de Aldo**: la cascada de 30 ms se aprobó en la ronda del 2026-11-14.

### P1 (mejora clara; algo de trabajo o una decisión)

**M4. Mismo tamaño en un grupo de acciones; jerarquía por estilo.**
- Destacado de Eventos: primaria de 56 junto a contorno de 44 → ambas de 56 (primaria llena, contorno de línea) en el teléfono; en escritorio ambas 48.
- Selector: `.ev-prox .btn`, `--alto` por grupo (`.btn-grupo`). Apple (Buttons), Uber (un tamaño por grupo), Fitts. **Decisión de Aldo**: cambia «nunca mayor que la primaria» por «misma altura».

**M5. Alto contraste en los tokens.**
- Hoy solo el vidrio se contorna con `prefers-contrast: more`. Añadir una tercera variante de color en `design/tokens.json` bajo `@media (prefers-contrast: more)`: `tinta-2` a **≥ 7:1**, `linea` a **≥ 3:1** (hoy es decorativa), `linea-fuerte` a **≥ 4.5:1**, `turquesa-texto` y `primario` a **≥ 7:1**.
- Apple (Color: variante de alto contraste), Atlassian (temas `increased-contrast`), WCAG 1.4.3/1.4.11. `npm run tokens` los genera; `tests/componentes.test.mjs` ya mide pares.
- **Decisión: ninguna** (el sistema ya se declara AA).

**M6. Estado «deshabilitado» que se vea deshabilitado.**
- Token `deshabilitado`: texto al **38 %** de la tinta sobre `fondo-3` (contenedor 12 %). Selector: `.btn:disabled`, `.btn[aria-disabled="true"]` (`style.css:152`) y el interruptor.
- Material (38/12), shadcn (50 %). Hoy `tinta-2` sobre `fondo-3` pasa por un botón secundario normal. Jakob. Añadir el par al catálogo de contraste como excepción de «inactivo».

**M7. Radios concéntricos.**
- Regla: `radio-interior = radio-exterior − inset`. El menú ☰ usa filas de `radio-sm` (12) dentro de una hoja de `radio-lg` (28) con inset de 8: lo concéntrico son **20** (`radio-md`).
- Selector: `.menu-row`; revisar `.mylist`, `.ev-prox` (28 con relleno 20 y cartel de 20). Añadir al `guias.mjs` una comprobación «interior ≥ exterior − inset».
- Apple (Toolbars: concéntricos). Gestalt (continuidad). **Decisión: ninguna**.

**M8. Interlínea de lectura 1.5 en párrafos largos.**
- `lectura` 17/24 → **17/26** (1.53) para párrafos de tres renglones o más (entradillas largas, La casa); `cuerpo` 17/22 queda para filas y controles.
- Uber (16/24), Material (1rem/1.5rem), Radix (16/24), Polaris móvil (16/24). WCAG 1.4.12 (espaciado de texto) pide poder llegar a 1.5. **Decisión de Aldo**: toca la escala HIG aprobada (+2 px por renglón).

### P2 (pulido y mantenimiento)

**M9. Borde de desplazamiento suave (scroll edge).**
- Un degradado de 24 px en `fondo` bajo la cabecera y sobre la barra inferior en vez de un corte seco; el vidrio queda como está. Selector: `.hdr::after`, `.tabbar::before` con `mask-image`.
- Apple (Toolbars: «scroll edge effect»; reducir fondos propios), Von Restorff. **Decisión visual de Aldo**.

**M10. Estado por atributo en componentes nuevos.**
- Convención: `data-state="open|closed|active"` y `data-orientation`, además de `aria-*`, para que el CSS sea una tabla de estados. Añadir el campo `atributo` a `design/componentes.json` y no migrar lo existente.
- shadcn/Radix/Zag/Headless. **Decisión: ninguna**.

**M11. Tonos de estado derivados con una regla.**
- Hoy `primario-presionado`, `primario-pulsado`, `menta-presionado` y `fondo-3-presionado` son hex medidos a mano. Definir la regla (por ejemplo `color-mix(in oklab, X, tinta 8 %)` o L − 6 % en OKLCH) y generarlos en `scripts/build-tokens.mjs`, conservando la prueba de contraste.
- Linear (B, LCH, 3 variables), Stripe (B), Polaris (estados como sufijo). Reduce deriva si cambia `primario`.

**M12. Chips y filtros de 40 con puntero fino.**
- `@media (pointer: fine)`: chips de Explorar y acciones de tercer nivel a 40 (el objetivo táctil sigue en 44 con el área invisible). Resto igual.
- Radix 40, Primer 32/40, Material 40 con área de 48. **Decisión de Aldo**: toca «controles 44/48/56».

*Se descartaron:* barra inferior que se minimiza al desplazar (la HIG lo documenta solo con accesorio) y mover «Mi lista» fuera de la barra (es un destino; basta documentar la excepción).

---

## 5. Lo que no se pudo leer

**Hosts bloqueados en la red de la sesión** (`getaddrinfo ENOTFOUND`; habría que permitirlos en la configuración de red para leerlos): `baseweb.design`, `base.uber.com`, `www.uber.com`, `eng.uber.com`, `airbnb.design`, `m3.material.io`, `m1.material.io`, `polaris-react.shopify.com`, `atlassian.design`, `carbondesignsystem.com`, `vercel.com` (Geist), `linear.app`, `stripe.com`, `www.radix-ui.com`, `react-spectrum.adobe.com`, `ark-ui.com`, `headlessui.com`, `cdn.jsdelivr.net`, `support.google.com`, `matthewstrom.com`. `api.github.com` y `gh` devolvieron 403 («GitHub access … not enabled»).

**Sí funcionaron:** `raw.githubusercontent.com`, `developer.apple.com` (JSON de la HIG), `npm` (paquetes descargados y abiertos fuera del repositorio; no se guardan aquí).

**Lo que quedó sin leer o sin verificar:**
- **DiDi**: no existe sistema público; solo lo medido antes (REA de apps de comida).
- **Airbnb DLS, Geist, Linear, Stripe**: solo resúmenes del buscador (B). No hay cifras de ellos en las reglas.
- **Uber Eats**: páginas de tienda con reto anti-bot (no se intentó saltar); `uber.com` bloqueado.
- **Material 3 vivo**: se leyeron los tokens de `@material/web`, no la especificación (alturas de lista, tamaños de ventana). El 48 dp de objetivo está confirmado por el código (`touch-target`), el 8 dp entre objetivos solo por el buscador (B).
- **Radix Colors (12 pasos)** y **la prosa de accesibilidad de Radix**: no leídas; del paquete solo `activationMode` de Tabs.
- **Estado «presionado» de Material**: solo se encontraron hover (8 %) y foco (10 %); el valor de presionado no se confirmó.
- **HIG de color**: solo los primeros 100 000 de 181 946 caracteres de la página.
- **HIG de listas y tablas**: no trae alturas de fila ni sangrías (la página dice que están en la documentación de SwiftUI y UIKit).
- **Origin UI**: README solamente.
- **Headless UI**: confirmado `data-headlessui-state`; no se verificaron las demás.

**Licencias.** Todo lo leído es MIT o Apache-2.0 salvo Geist (fuente SIL OFL) y los textos de Apple (© Apple, solo referencia). No se copió código ni texto: solo cifras de tokens y reglas parafraseadas, que no son material con derechos de autor.

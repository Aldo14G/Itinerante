# shadcn/ui, 21st.dev y Uiverse: qué aprender para Librería Itinerante

Investigación del 2026-11-14. Solo lectura del repo; nada se editó en `/home/user/Itinerante`.

## 0. Cómo se verificó (y qué no)

- **Desde esta sesión no se alcanzan** `ui.shadcn.com`, `21st.dev` ni `uiverse.io` (la red del entorno no los resuelve). Para verlos en vivo (galerías, popularidad, precios, términos) hay que permitir esos hosts en la red de la sesión.
- Como sustituto, leí **las fuentes primarias en GitHub**, clonadas en modo solo lectura:
  - `shadcn-ui/ui`, commit `e62c9435` (13 nov 2026): documentación (`apps/v4/content/docs/…`), componentes y hojas de estilo del registro.
  - `21st-dev/magic-mcp` (último commit 9 sep 2026): README y la skill del MCP de 21st.
  - `serafimcloud/21st` (código abierto del sitio; último commit 28 may 2025, así que puede estar desfasado respecto al sitio actual).
  - `uiverse-io/galaxy` (archivo de Uiverse; último commit 2 sep 2024): 3,802 elementos en HTML. Con él saqué estadísticas propias de accesibilidad.
- Lo que viene de reseñas de terceros (precios de 21st.dev, conteos de componentes) lo marco como **no verificado**.
- **No verifiqué** qué componentes concretos son «los más populares» en 21st.dev ni en Uiverse: no pude abrir sus rankings. Para Uiverse doy como sustituto las etiquetas más frecuentes del archivo.
- **Actualización del mismo día (2026-11-14):** con la red ampliada se abrieron en vivo `ui.shadcn.com` (portada en Chromium, `/docs`, `/docs/changelog`), `21st.dev` (`/pricing`, `/terms`, `/community/components`, `/community/libraries`, `/llms.txt`) y `uiverse.io` (portada y `/elements` en Chromium). Lo confirmado lleva «verificado en vivo (2026-11-14)» con su URL; el resumen está en «Verificación en vivo», al final. Dos límites: **Uiverse** respondió 403 a `curl` y, tras tres cargas en Chromium, su Cloudflare bloqueó la sesión («Sorry, you have been blocked»); no se forzó. **21st.dev** prohíbe en sus términos la recolección automatizada («scraping… bots, crawlers»), así que después de leerlos no se abrieron más páginas con herramientas.

---

## 1. shadcn/ui

### 1.1 Arquitectura

**Verificado en vivo (2026-11-14):** el changelog público ([ui.shadcn.com/docs/changelog](https://ui.shadcn.com/docs/changelog)) lista las entradas citadas abajo (Base UI as the Default, React Aria, GitHub Registries, shadcn eject, Rhea, Sera, Luma, shadcn/cli v4, Universal Registry Items). Hay una posterior: **«August 2026 - Private GitHub Registries»** (los registros de GitHub ya funcionan con repositorios privados). La portada declara 128k estrellas en GitHub.

**Modelo «copiar y poseer» (Open Code).** La introducción lo resume así: *«This is not a component library. It is how you build your component library.»* Sus cinco principios son Open Code, Composition, Distribution, Beautiful Defaults y AI-Ready. El código del componente se copia al proyecto y se edita directamente: *«you simply edit the button code directly»*. Las correcciones de comportamiento llegan por la dependencia «headless» (`@base-ui/react`, Radix, React Aria); la capa de estilo queda en el proyecto. Fuente: [docs (root)/index.mdx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/(root)/index.mdx).

**Primitivas debajo (cambio de 2026).**
- Desde el **2 jul 2026, Base UI es la base por omisión**. Radix sigue soportado (`npx shadcn init -b radix`): [2026-07-base-ui-default](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2026-07-base-ui-default.mdx).
- Desde el 17 jul 2026, **React Aria** es una tercera base (`--base aria`): [2026-07-react-aria](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2026-07-react-aria.mdx).
- Lema: *«Same Abstraction, Different Primitives»*. La API del componente es la misma y solo cambia la implementación.

**CLI.** Comandos `init`, `add`, `build`, `create`, `eject` y `mcp init`.
- La v4 (mar 2026) añadió `--preset` (un código corto que empaqueta colores, tema, iconos, fuentes y radio), `--dry-run`, `--diff` y `--view` para revisar antes de escribir, y «shadcn/skills» para agentes: [2026-03-cli-v4](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2026-03-cli-v4.mdx).
- `shadcn eject` incrusta `shadcn/tailwind.css` y quita la dependencia: [2026-05-shadcn-eject](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2026-05-shadcn-eject.mdx).

**`components.json`.** Es opcional: solo lo necesita la CLI. Campos: `$schema`, `style` (inmutable tras `init`), `tailwind.{config (vacío en v4), css, baseColor (neutral|stone|zinc|mauve|olive|mist|taupe), cssVariables, prefix}`, `rsc`, `tsx`, `aliases.{components, ui, lib, hooks, utils}` y `registries` (namespaces `@acme` → plantilla de URL). Fuente: [components-json.mdx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/(root)/components-json.mdx).

**Registry (distribución de código por JSON plano).**
- `registry.json` lleva `name`, `homepage`, `items[]` y opcionalmente `include[]` para componer el registro a partir de otros `registry.json`.
- Cada item sigue `registry-item.json`:
  - Datos: `name`, `title`, `description`, `type`, `author`.
  - Dependencias: `dependencies` (npm), `devDependencies` y `registryDependencies`. Estas últimas se direccionan por nombre (`button`), namespace (`@acme/x`), GitHub (`owner/repo/item#tag`), URL o archivo local.
  - Archivos: `files[]` con `path`, `type` y `target`, que acepta los marcadores `@ui/`, `@components/`, `@lib/` y `@hooks/`.
  - Estilo y entorno: `cssVars.{theme,light,dark}`, `css` (reglas `@layer`, `@keyframes`, `@utility`), `envVars` y `font`.
- Tipos de item: `registry:base | block | component | font | lib | hook | ui | page | file | style | theme | item`.
- Fuentes: [registry-json.mdx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/registry/registry-json.mdx), [registry-item-json.mdx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/registry/registry-item-json.mdx).
- `npx shadcn build` genera JSON estáticos en `public/r/<name>.json`, servidos por URL. Admite negociación de contenido por `Accept` y autenticación: [getting-started.mdx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/registry/getting-started.mdx).
- Desde jun 2026, **cualquier repo público con `registry.json` es un registro**, sin `build` (`npx shadcn add owner/repo/item`). Puede distribuir *«design tokens… project conventions, agent instructions, testing setup, CI workflows»*: [2026-06-github-registries](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2026-06-github-registries.mdx).
- Los **items universales** (jul 2025) sirven *«no framework, no components.json, no tailwind, no react required»*: [2025-07-universal-registry](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2025-07-universal-registry.mdx). El índice dice: *«The registry works with any project type and any framework, and is not limited to React.»*
- **Servidor MCP** (`npx shadcn@latest mcp init --client claude`): busca e instala items de los registros configurados en `components.json`: [mcp.mdx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/(root)/mcp.mdx).

**Tailwind v4, tokens y OKLCH** (fuente: [theming.mdx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/(root)/theming.mdx)):
- **Pares semánticos superficie/tinta**: `background`/`foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent` (cada uno con `-foreground`), más `destructive`, `border`, `input`, `ring`, `chart-1…5`, `sidebar-*` y `radius`. Regla: *«The base token controls the surface color and the `-foreground` token controls the text and icon color that sits on that surface.»*
- Valores en **OKLCH** (desde feb 2025, *«HSL colors are now converted to OKLCH»*). Ejemplo: `--primary: oklch(0.205 0 0)`. En oscuro, bordes con alfa: `--border: oklch(1 0 0 / 10%)`.
- Oscuro = **los mismos nombres** redefinidos bajo `.dark` (por clase, no por `prefers-color-scheme`), con `@custom-variant dark (&:is(.dark *))`.
- Puente a Tailwind con `@theme inline { --color-primary: var(--primary); … }`.
- **Radios derivados de un solo token**: `--radius: 0.625rem` y `--radius-sm: calc(var(--radius) * 0.6)` … `--radius-4xl: calc(var(--radius) * 2.6)`.
- Para añadir un token se define en `:root` y en `.dark` y se expone en `@theme inline`. El ejemplo de la doc es `--warning`/`--warning-foreground`.

**Variantes (`cva`) y `data-slot`.**
- En el estilo clásico (`new-york-v4/ui/button.tsx`), `cva` define `variant` (default, destructive, outline, secondary, ghost, link) × `size` (default h-9, xs, sm, lg, icon, icon-xs/sm/lg). El elemento lleva `data-slot="button"`, `data-variant` y `data-size`: [button.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/button.tsx).
- **Novedad de 2026**: en las bases nuevas, `cva` ya no lleva utilidades, sino **clases semánticas** (`cn-button`, `cn-button-variant-default`, `cn-button-size-lg`), y cada «estilo» (Vega, Nova, Maia, Lyra, Mira, Luma, Rhea, Sera) es una hoja CSS que las rellena: [bases/base/ui/button.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/button.tsx), [styles/style-luma.css](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/styles/style-luma.css). Es decir, **separan estructura y piel con clases con nombre**, igual que nuestro `.btn--primario`.
- `data-slot` llegó con Tailwind v4: *«Every primitive now has a data-slot attribute for styling»* ([2025-02-tailwind-v4](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2025-02-tailwind-v4.mdx)). Sirve para estilar partes desde el padre sin depender de clases.

**Accesibilidad.** Está delegada a las primitivas (Base UI / Radix / React Aria: patrones WAI-ARIA, foco atrapado en diálogos, teclado). La capa propia aporta:
- Estados estilados por atributos (`data-[state=open]`, `data-checked`, `aria-invalid`, `disabled`).
- Foco con `focus-visible:ring-[3px] ring-ring/50`.
- `sr-only` («Close») en el cierre del diálogo.
- Spinner con `role="status" aria-label="Loading"`.
- Carrusel (Embla) con `role="region" aria-roledescription="carousel"` y diapositivas `role="group" aria-roledescription="slide"`, más flechas de teclado ([carousel.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/carousel.tsx)).
- La documentación **no** menciona `prefers-reduced-motion`. Las animaciones salen de `tw-animate-css` (`animate-in fade-in-0 zoom-in-95`). No verifiqué si esa librería trae una regla global de movimiento reducido.

### 1.2 Estilos y estados visuales destacados

- **Estados normalizados por variante** (button new-york-v4):
  - hover: `bg-primary/90`; secundario `/80`.
  - foco: `focus-visible:border-ring ring-[3px] ring-ring/50`.
  - deshabilitado: `disabled:pointer-events-none disabled:opacity-50`.
  - inválido: `aria-invalid:border-destructive ring-destructive/20`.
  - iconos: `[&_svg]:size-4 pointer-events-none`.
- En **Luma** se presiona con `active:translate-y-px`, la píldora es `rounded-4xl` y el foco usa `ring-3 ring-ring/30`.
- **Switch** (new-york): pista `h-[1.15rem] w-8`, en Luma `h-5 w-11`. Pulgar con `transition-transform` y `translate-x-[calc(100%-2px)]`. Marcado = `bg-primary`, sin marcar = `bg-input`.
- **Skeleton**: `animate-pulse rounded-md bg-accent` (Luma: `bg-muted rounded-2xl`).
- **Diálogo**: entra y sale con `fade` + `zoom-95` según `data-state`.
- **Estilos 2026** (*«goes beyond theming»*: cambian geometría y densidad, no solo color):
  - **Luma**: *«Rounded geometry. Soft elevation. Breathable layouts. Inspired by macOS Tahoe, minus the glass.»*
  - **Rhea**: Luma compacta. Crearon un estilo nuevo en vez de cambiar el multiplicador `--spacing` para no alterar el significado de la escala.
  - **Sera**: editorial y tipográfico, títulos con serifa y controles subrayados.
  - Fuentes: [2026-03-luma](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2026-03-luma.mdx), [2026-05-rhea](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2026-05-rhea.mdx), [2026-04-sera](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2026-04-sera.mdx).
- La autocrítica de shadcn al lanzar `create` vale para nosotros: *«all apps started looking the same. I guess the defaults were a little too good»* ([2025-12-shadcn-create](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2025-12-shadcn-create.mdx)).

### 1.3 Licencia

**MIT**, «Copyright (c) 2023 shadcn» ([LICENSE.md](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)). Al copiar una porción sustancial del código hay que conservar el aviso de copyright y de permiso.

---

## 2. 21st.dev

### 2.1 Qué es y arquitectura

- **Registro y marketplace comunitario de componentes React + Tailwind compatibles con shadcn.** El README del código abierto lo llama *«open-source community registry for React UI components… Inspired by shadcn/ui»* ([README](https://github.com/serafimcloud/21st/blob/main/README.md), MIT, «Copyright (c) 2024 21st.dev»).
- **Instalación vía shadcn CLI por URL**: `npx shadcn@latest add "https://21st.dev/r/<autor>/<componente>"`. Cada componente es un item de registry servido por 21st.
- **Organización por autor**:
  - Rutas `21st.dev/@autor/…` y bibliotecas de autor (`/community/<autor>/library/<lib>`, p. ej. shadcn/ui, Magic UI, ReUI).
  - Estructura por componente: `code.tsx` reutilizable, más `demos/<nombre>/code.demo.tsx`, `preview.png` y `video.mp4`, guardados en Cloudflare R2.
  - Revisión en tres estados: `on_review` → `posted` → `featured` (revisión personal del fundador).
  - Criterio de calidad: usar las variables de tema de shadcn y soportar claro y oscuro.
  - Fuente: README del repo.
- **Agentes / MCP**: «Magic MCP» se convirtió en el **21st MCP**, un servidor HTTP en `https://21st.dev/api/mcp` con cabecera `x-api-key`, instalable con `npx @21st-dev/cli@latest init --client claude`.
  - Herramientas: `search`, `get_component`, `generate`, `get_inspiration`, `search_logo` y otras.
  - La skill oficial dice: *«marketplace of 10,000+ production-ready React/Tailwind (shadcn-compatible) components»* y *«Free tier allows catalog search and 2 component installs per day; paid components return code only after unlock.»*
  - La generación con IA requiere suscripción.
  - Fuentes: [magic-mcp README](https://github.com/21st-dev/magic-mcp/blob/main/README.md), [skills/21st-ui/SKILL.md](https://github.com/21st-dev/magic-mcp/blob/main/skills/21st-ui/SKILL.md).
- **Precios (no verificado; reseñas de terceros de oct–nov 2026)**: Builder ~6 USD/mes anual, Team 7.50/asiento, Builder + AI 15/mes. Fuentes: [dailyaipedia](https://dailyaipedia.com/21st-dev-review-pricing-mcp-shadcn-components/), [better-design.com](https://better-design.com/guides/21st-dev).
  - **Verificado en vivo (2026-11-14)**, [21st.dev/pricing](https://21st.dev/pricing): las cifras eran correctas. **Free**: todo el catálogo a la vista, 2 copias al día (web, MCP y CLI) y 5 revisiones del «Design Bug Bot». **Builder**: 6 USD al mes con pago anual (72 USD) u 8 trimestral; copias e instalaciones ilimitadas. **Builder + AI**: 15 USD al mes anual (180) o 20; 500 créditos al mes. **Team**: 7,50 USD por asiento al mes anual o 10, de 2 a 50 asientos. No hay pago mensual: trimestral o anual (−25 %). Pagos no reembolsables.
- **Escala (autodeclarada o de terceros, no verificada)**: 10,000–12,000+ componentes y unas 114–174 bibliotecas ([21st.dev/community/libraries](https://21st.dev/community/libraries)).
  - **Verificado en vivo (2026-11-14), como cifra que el sitio declara:** 12,000+ componentes («12K»), 362 plantillas, 991 temas, 648 shaders y 138 apps ([pricing](https://21st.dev/pricing), [community/components](https://21st.dev/community/components)). La misma página de precios dice «17,500+ icons» en un sitio y «29,000 Icons» en otro. La página de bibliotecas enlaza 153 bibliotecas distintas en su HTML. Por categoría: botones 1.7K, formularios 1.7K, héroes 1.3K, tarjetas 1.3K, shaders 648, texto 605, fondos 542.

### 2.2 Estilo visual y populares

No pude abrir el sitio ni su ranking, así que **no verifiqué** qué componentes son los más populares. Por su catálogo de bibliotecas (Magic UI, Aceternity, Kokonut, ReUI…), el estilo dominante son **héroes animados, fondos con shaders o gradientes, texto animado, marquees y tarjetas con brillo**. Todo depende de React, Tailwind y a menudo de `motion`/`framer-motion`. Es una impresión general, no un dato medido.

**Verificado en vivo (2026-11-14)**, [21st.dev/community/components](https://21st.dev/community/components): la primera página del catálogo (sin sesión) muestra 16 piezas, cada una con su número de **guardados** (el icono es un marcador). No es un ranking declarado, pero es lo que el sitio pone al frente:

| Componente | Guardados |
|---|---|
| Scroll media expansion hero | 11.1K |
| Container Scroll Animation | 10.6K |
| Spline Scene | 9.7K |
| Liquid Glass Button | 7K |
| Scroll Morph Hero | 6.6K |
| Animated hero | 6.1K |
| Motion Footer | 6K |
| Sign In | 4.8K |
| Aurora Background | 4.6K |
| Interactive Image Accordion | 4.4K |
| Pricing | 4K |
| Shader Animation, Sidebar | 3.8K cada uno |
| Features 8 | 3.2K |
| Text Rotate | 2.1K |
| Logo Cloud 2 | 1.7K |

La impresión anterior se confirma: dominan los **héroes ligados al scroll** (expansión de medios, contenedor que se endereza, morph), los **shaders y auroras**, el **vidrio líquido** y el **texto que rota**. Que «Spline Scene» sea la tercera pieza más guardada es coherente con `spline-mapcn.md`: es la vía rápida para meter 3D en un héroe.

### 2.3 Licencias

- **Por componente**: el autor elige al publicar. Opciones en el código: MIT, Apache-2.0, BSD-3-Clause, LGPL, MPL-2.0, ISC y «no-license» ([lib/licenses.ts](https://github.com/serafimcloud/21st/blob/main/apps/web/lib/licenses.ts)).
  - **Ojo**: el sitio describe «No License» como *«Releases software into the public domain»*. Jurídicamente es al revés: **sin licencia, el autor se reserva todos los derechos**. Un componente «no-license» o «License: unknown» **no se puede reutilizar**.
- **Términos del sitio** (vía buscador; no leí el texto completo): los componentes son propiedad de sus autores y de 21st Labs Inc., y los demos, previews y medios no se licencian al copiar el código ([21st.dev/terms](https://21st.dev/terms)). **No verifiqué** la cláusula de redistribución fuera de la plataforma.
  - **Verificado en vivo (2026-11-14)**, [21st.dev/terms](https://21st.dev/terms), «Last updated July 20, 2026», 21st Labs Inc.:
    - §2: código, documentación, metadatos y medios son «sole and exclusive property of their respective authors and 21st Labs Inc.», y se concede verlos y usarlos «solely through the official 21st.dev platform». Los demos, previews, capturas y vídeos son obra de 21st y **no se licencian aunque se copie el código**, sea cual sea la licencia del componente.
    - §3 prohíbe, entre otras cosas: recolectar datos con *scraping*, bots o *crawlers*; usar el contenido para **entrenar IA**; redistribuir, vender o licenciar contenido «without authorization»; reutilizar medios o metadatos; y **copiar y redistribuir componentes a otros sitios sin un enlace visible a la página original** en 21st.dev.
    - §3.1 (para quien publica): no subir código de kits comerciales que prohíban redistribuir (cita Tailwind Plus) y, si se parte de código abierto, conservar su licencia y dar crédito visible.
  - Lectura para nosotros: incluso un componente MIT de 21st viene con condiciones de la plataforma encima (enlace de vuelta si se redistribuye; demos y medios intocables). **Se confirma «solo inspiración».**
- Los componentes de pago se desbloquean por suscripción. Sus condiciones de reutilización no las verifiqué. *(Sigue sin verificar el 2026-11-14: haría falta una cuenta de pago.)*

---

## 3. Uiverse (uiverse.io)

### 3.1 Arquitectura

- **Elementos sueltos en HTML + CSS puro o Tailwind**, hechos por la comunidad.
  - El archivo `galaxy` tiene 3,802 archivos `.html`, cada uno con el marcado y un bloque `<style>` en línea.
  - Cada bloque abre con un comentario de autoría: `/* From Uiverse.io by AUTOR - Tags: … */`.
  - El sitio permite exportar a Tailwind y copiar a Figma, según reseñas que no verifiqué ([subscribed.fyi](https://subscribed.fyi/?p=15971)). **Verificado y ampliado en vivo (2026-11-14)**, [uiverse.io](https://uiverse.io/): «Copy as HTML/CSS, Tailwind, React and Figma» (también React).
- **Publicación**:
  - Se envía en el sitio, pasa revisión y, si se aprueba, se sube sola al repo. *«Direct contributions or pull requests to this repository will be ignored.»*
  - Las [guías de publicación](https://uiverse.notion.site/Uiverse-io-post-guidelines-68dd61b731b04f7c88129c71d645cf02) rechazan duplicados y piezas fuera de escala; un botón debe medir como un botón.
  - Fuente: [galaxy README](https://github.com/uiverse-io/galaxy/blob/main/README.md).
- **Tipos y conteo en el archivo (sep 2024)**:

  | Tipo | Elementos |
  |---|---|
  | Buttons | 1,231 |
  | Cards | 726 |
  | loaders | 718 |
  | Toggle-switches | 260 |
  | Inputs | 226 |
  | Forms | 180 |
  | Checkboxes | 171 |
  | Patterns | 103 |
  | Radio-buttons | 102 |
  | Tooltips | 62 |
  | Notifications | 23 |

  El sitio hoy dice tener más de 5,400 ([uiverse.io/elements](https://uiverse.io/elements), vía buscador). **Corregido en vivo (2026-11-14):** la portada dice «7,471 Community-made UI elements» ([uiverse.io](https://uiverse.io/)) y la página de elementos se titula «4510 UI elements: CSS & Tailwind» ([uiverse.io/elements](https://uiverse.io/elements)). El sitio da dos cifras distintas; la diferencia probablemente sean piezas fuera del listado general (kits, pendientes), pero no lo confirmé.

### 3.2 Estilo visual y popularidad

- **Etiquetas más frecuentes del archivo** (sustituto de popularidad, que no verifiqué): button 1,247 · loader 703 · card 698 · simple 463 · animation 385 · hover 304 · hover effect 283 · switch 245 · gradient 193 · material design 139 · minimalist 133 · dark 119 · 3d 114 · **neumorphism 112** · tailwind 84.
- **Popularidad en vivo (2026-11-14): sigue sin verificar.** El listado de [uiverse.io/elements](https://uiverse.io/elements) se abre con orden «Randomized» por omisión, y cada tarjeta muestra vistas y guardados (p. ej. 30K vistas y 1.3K guardados), pero el Cloudflare del sitio bloqueó la sesión antes de poder cambiar el orden. Lo que sí se vio: la portada lista sus «Top Creators» por vistas (vinodjangid07 926,350 con 157 publicaciones; Yaya12085 494,970; Praashoo7 474,820…) y sus etiquetas destacadas (button, card, loader, rounded, dark, minimal, animated, switch, gradient, glow, neumorphism, 3d…). Esas etiquetas coinciden con las del archivo: el sustituto era razonable.
- La estética dominante es **efecto de hover y animación decorativa**: gradientes, neumorfismo, 3D, brillo y loaders temáticos. Ejemplo real: `loaders/0xnihilism_brown-puma-30.html`, un ojo «BIG BROTHER IS LOADING» con líneas de escaneo.
- **Accesibilidad medida por mí sobre el archivo (grep, aproximado):**

  | Tipo | n | respeta `prefers-reduced-motion` | usa `:focus-visible` | algún `aria-`/`role` |
  |---|---|---|---|---|
  | Buttons | 1,231 | 1 | 27 | 38 |
  | Loaders | 718 | 1 | 0 | 6 |
  | Toggles | 260 | 2 | 6 | 10 |
  | Checkboxes | 171 | 1 | 2 | 3 |
  | Radio | 102 | 0 | 2 | 4 |

  Además, alrededor del **30 %** de toggles (78/260), checkboxes (44/171) y radios (27/102) ocultan el `<input>` con `display:none`, lo que lo saca del tabulador y del lector de pantalla. Ejemplo típico: `Toggle-switches/AbanoubMagdy1_pink-panda-32.html`, con `#3bd826` fijo, foco `box-shadow: 0 0 1px` casi invisible y `transition: .4s` sin respaldo. **Conclusión: Uiverse sirve como idea visual, no como código listo para WCAG.**

### 3.3 Licencia

- **MIT**, «Copyright (c) 2023 Uiverse.io» ([LICENSE](https://github.com/uiverse-io/galaxy/blob/main/LICENSE)). El README dice que la atribución es *«not mandatory»* pero muy apreciada, y pide citar al autor y a Uiverse.
  - **Verificado en vivo (2026-11-14)**, pie de [uiverse.io](https://uiverse.io/): «MIT License. All content (UI elements) on this site are published under the MIT License», y en la portada «100% Free for personal and commercial use». El sitio es de «Pixel Galaxies» («2026 Pixel Galaxies. All rights reserved.»: el sitio, no los elementos). Los «Terms and Conditions» enlazados en el pie no se pudieron leer (`/terms` da 404 y el bloqueo de Cloudflare impidió seguir el enlace real).
- **Matiz**: el texto MIT exige conservar el aviso de copyright y de permiso en «copias o porciones sustanciales». Si portamos una pieza casi literal, conviene conservar el comentario `From Uiverse.io by AUTOR` y el aviso MIT. Si solo tomamos la idea y la reescribimos con nuestros tokens, no hay obligación, pero la registraría igual en `docs/ux/FUENTES.md` por trazabilidad.

---

## 4. Encaje con nuestro sitio

Restricciones: HTML/CSS/JS nativo, sin build, **sin Tailwind** (prohibido), CSP estricta (sin `<style>` ni `style=""` en línea, sin orígenes externos), tokens propios, WCAG 2.2 AA con axe sin violaciones, INP ≤ 200 ms a CPU 4× y movimiento plano con `prefers-reduced-motion`.

### 4.1 Lo que ya tenemos equivalente (no hay que importar nada)

| Idea de shadcn | En Itinerante hoy |
|---|---|
| Pares superficie/tinta (`primary`/`primary-foreground`) | `primario`/`en-primario`, `menta`/`en-menta` |
| Mismos nombres en claro y oscuro | Mismos nombres con `prefers-color-scheme` (`tokens.css`) |
| Fuente única de tokens (`cssVars`) | `design/tokens.json` → `tokens.css` (`npm run tokens`, `tokens:check`) |
| `cva` variante × tamaño | `.btn` + `--primario/--secundario/--plano/--vidrio` × `--sm/--lg` (44/48/56) |
| Clases semánticas por estilo (`cn-button-variant-*`) | Idéntica filosofía: clase con nombre, piel en `style.css` |
| Anillo de foco por token (`ring`) | `--anillo-foco` (2 px de fondo + 2 de foco) en `:focus-visible` |
| Estado por atributo (`data-state`, `aria-invalid`) | `aria-pressed`, `aria-checked`, `aria-expanded`, `aria-busy` en el CSS |
| Primitivas accesibles (Dialog) | `<dialog>` nativo en `sheets.js` |
| Carrusel `region` + `aria-roledescription` | Carrusel3D con `role="region" aria-roledescription="carrusel"` |
| Skeleton | Esqueletos quietos que reservan el alto exacto (más estricto que el `animate-pulse` de shadcn) |

Ya implementamos la parte valiosa de shadcn sin React. **Adoptar shadcn, Base UI, Radix o Tailwind no aporta y rompe tres reglas del repo** (sin dependencias de runtime, sin build, sin Tailwind).

### 4.2 Ideas de arquitectura que sí nos sirven

1. **Matriz de estados normalizada y probada** (inspirada en el `cva` de shadcn, donde cada variante declara hover, foco, deshabilitado e inválido).
   - Documentar en DESIGN.md una tabla control × estado: reposo, hover (solo dentro de `@media (hover: hover)`), `:focus-visible`, presionado (escala 0.97 con resorte), `:disabled`/`[aria-disabled]`, `[aria-invalid]` en campos y `[aria-busy]`.
   - Añadir a `npm run critique` o a `tests/site.test.mjs` una comprobación de que cada selector de control (`.btn`, `.chip`, `.save`, `.c3d-flecha`, campos) tiene regla de `:focus-visible` y de deshabilitado, y que su hover vive bajo `hover: hover`.
   - **Esfuerzo S–M · riesgo bajo · valor alto.** Cierra huecos que axe no ve: hover pegajoso en táctil, deshabilitado sin estilo.
2. **Catálogo de componentes como datos** (inspirado en `registry.json` / `registry-item.json`).
   - Un `design/componentes.json` con `name`, `title`, `description`, `type` (ui | bloque | lib), `files` (módulos JS y selectores CSS), `tokens` usados, `estados`, `patron_aria` (APG), `qa` (herramienta de `tools/qa/` que lo mide) y `decision` (fecha y fuente en DESIGN.md).
   - Una prueba que confirme que cada archivo y selector existe y que cada token está en `tokens.json`.
   - Sin la CLI de shadcn: el valor está en el formato plano que un agente lee de un vistazo, que es justo el argumento *AI-Ready* de shadcn.
   - **Esfuerzo M · riesgo bajo · valor medio-alto** (continuidad entre agentes). Hoy esa información vive repartida entre AGENTS.md y DESIGN.md.
3. **Regla de atributos explícita.** Clase = parte o variante, `aria-*` = estado, `data-*` = gancho de JS (ya pasa así: `data-cat-clear`, `data-motion-toggle`).
   - **No recomiendo migrar a `data-slot`**: duplicaría nuestras clases de parte sin beneficio, porque no tenemos componentes que se compongan desde fuera.
   - Solo vale anotar la convención en DESIGN.md. **Esfuerzo XS.**
4. **Comprobar los pares de color** (convención `-foreground` de shadcn). Una prueba que, para cada token de relleno usado como `background` en un control (`primario`, `menta`, `superficie`, `fondo-3`), exija su tinta asociada con contraste ≥ 4.5:1 en ambos temas. Parte ya existe (contraste del vidrio y harness `contrast`).
   - **Esfuerzo S · riesgo bajo.**
5. **OKLCH**: opcional. El sitio ya mezcla en `oklab` con `color-mix`. Pasar `tokens.json` a OKLCH facilitaría derivar tonos, pero obliga a revisar el cálculo de contraste de las pruebas.
   - **Valor bajo ahora; no lo haría.**
6. **Registro shadcn como distribución** (`registry:item` universal, no requiere React): técnicamente podría publicar el Carrusel3D o los tokens como item instalable desde GitHub. Para un sitio único no hay consumidor.
   - **No recomendado** salvo que Aldo quiera reutilizar piezas en otro proyecto.

### 4.3 Microinteracciones que se pueden portar a CSS/JS nativo

Todas se reescriben desde cero con tokens, en `style.css`, sin `<style>` en línea, planas con movimiento reducido o «Pausar el movimiento».

1. **Interruptor (switch) para «Pausar el movimiento».** Hoy es un botón `aria-pressed` (`index.html:480`, `app.js:121`). La HIG usa un switch para ajustes de encendido y apagado.
   - Propuesta: `<button role="switch" aria-checked>` con rótulo visible y una pista de unos 51×31 (geometría iOS; shadcn/Luma usa 44×20) dentro de una zona táctil de 44 o más.
   - Colores: pista `fondo-3` → `primario`. Pulgar `superficie` con `sombra-flotante`, `translateX` en `--dur-rapida` con `--curva-resorte`.
   - Foco `--anillo-foco`. `forced-colors`: borde del sistema.
   - Rompe `aria-pressed` en `app.js`/tests: hay que ajustarlos. Es un cambio de forma del control: **proponer a Aldo antes**.
   - **Esfuerzo S · riesgo bajo-medio.**
2. **Palomita que se dibuja** (patrón muy frecuente en los checkboxes de Uiverse). En el chip elegido y en «Guardar», el `<path>` de la palomita entra con `stroke-dasharray`/`stroke-dashoffset` en `--dur-rapida` con `--curva-salida`.
   - Encaja con «la forma acompaña al color» de DESIGN.md.
   - Solo se pinta un SVG pequeño, sin coste de layout ni riesgo de INP.
   - Sin movimiento: aparece completa.
   - **Esfuerzo S · riesgo bajo.**
3. **Presionado coherente**: shadcn/Luma usa `translate-y-px` y nosotros escala 0.97 con resorte. **Conservar el nuestro** y extenderlo a chips y filas del menú si aún no lo tienen (verificar).
   - **Esfuerzo XS.**
4. **Loaders**: **no portar.** Nuestros esqueletos quietos con alto reservado son mejores para CLS y para movimiento reducido. Casi ningún loader de Uiverse respeta `prefers-reduced-motion` (1 de 718) ni anuncia estado.
   - Si alguna vez hace falta un indicador indeterminado (p. ej. una espera de Iti IA), usar el spinner de shadcn: `role="status"` + nombre accesible, que gire solo con movimiento y que sin movimiento muestre texto («Cargando…»).
5. **Hover de botones de Uiverse** (gradientes, neumorfismo, 3D, brillo): **chocan** con el sistema Líquido. El vidrio solo va en lo que flota, la profundidad orienta y no adorna, y hay una sola primaria por vista. **No portar.**
6. **Fondos y héroes de 21st.dev** (shaders, partículas, texto animado): chocan con INP 4×, con la CSP (WebGL de terceros y `framer-motion`) y con la regla de deferencia (las protagonistas son las portadas y las fotos reales). **No portar.**

### 4.4 Qué choca, en resumen

- **Tailwind** (shadcn, 21st y las variantes Tailwind de Uiverse): prohibido en el repo.
- **React, Radix, Base UI, Embla y motion**: dependencias de runtime y build. Ya tenemos `<dialog>` y Carrusel3D propios.
- **`<style>` en línea de Uiverse**: viola la CSP. Hay que moverlo a `style.css`.
- **Colores fijos, `transition: .4s` y `display:none` en inputs** (Uiverse): violan tokens, `motion.js` y accesibilidad.
- **21st.dev**: licencia por componente que puede ser restrictiva o desconocida, términos que reservan demos y medios, instalación limitada en el plan gratuito y código de pago. **Úsese, si acaso, solo como inspiración visual** (el MCP de 21st da `search`/`get_inspiration`), nunca copiando código sin licencia clara.
- **Tema oscuro por clase `.dark`** (shadcn): nuestro sistema decide por `prefers-color-scheme`, sin selector manual (decisión vigente). No cambiar.

### 4.5 Procedimiento si se porta algo de Uiverse o 21st

1. Que la licencia sea MIT, ISC, Apache o BSD y esté visible en la ficha. Si no, solo idea.
2. Reescribir con tokens (`--primario`, `--dur-*`, `--curva-*`, `--radio-*`, `--alto-*`), sin colores ni milisegundos a mano y sin `<style>` en línea.
3. Controles nativos: `<input>` visualmente oculto, nunca `display:none`, o `<button role="switch">`. Foco con `--anillo-foco`. Respaldo para `forced-colors`.
4. Plano con `prefers-reduced-motion` y con «Pausar el movimiento».
5. Registrar la fuente, URL, autor y licencia en `docs/ux/FUENTES.md`. Si el código es casi literal, conservar el aviso MIT en un comentario.
6. Pasar `npm test`, `npm run critique`, `npm run test:browser` (axe y contraste en claro y oscuro) y `tools/qa/inp.mjs`.

---

## 5. Recomendaciones ordenadas por valor/costo

1. **Matriz de estados** (hover solo con `hover: hover`, foco, presionado, deshabilitado, inválido, ocupado) en DESIGN.md y comprobada en `critique`/tests. S, riesgo bajo.
2. **Palomita que se dibuja** en chips y «Guardar», con tokens y plana sin movimiento. S, riesgo bajo.
3. **Prueba de pares superficie/tinta** con contraste ≥ 4.5 en ambos temas, a la manera del `-foreground` de shadcn. S, riesgo bajo.
4. **`design/componentes.json`**, catálogo plano de componentes con archivos, tokens, estados, patrón ARIA y herramienta de QA (formato inspirado en `registry-item.json`) y prueba de que existe todo lo que nombra. M, riesgo bajo.
5. **Switch iOS para «Pausar el movimiento»** (`role="switch"`). S, riesgo bajo-medio. Requiere el visto bueno de Aldo.
6. Anotar la regla «clase = parte/variante, `aria-*` = estado, `data-*` = JS». XS.
7. **No adoptar** shadcn, Tailwind, Radix ni Base UI; no portar loaders, hovers decorativos de Uiverse ni fondos de 21st. 21st, solo como inspiración y con licencia verificada.
8. Para verificar popularidad, precios y términos en vivo: permitir `ui.shadcn.com`, `21st.dev` y `uiverse.io` en la red de la sesión. *(Hecho el 2026-11-14; ver abajo. Falta la popularidad de Uiverse y los términos de su pie.)*

---

## Verificación en vivo (2026-11-14)

**Qué se abrió:** `ui.shadcn.com` (portada en Chromium, `/docs`, `/docs/changelog`); `21st.dev` (`/pricing`, `/terms`, `/community/components`, `/community/libraries`, `/llms.txt`, con `curl`, una vez cada una); `uiverse.io` (portada y `/elements` en Chromium; `curl` recibe 403 de Cloudflare). Capturas en el scratchpad de la sesión (`investigacion-ui/vivo/shadcn-home.png`, `uiverse-home.png`).

**Correcciones y confirmaciones:**

1. **21st.dev, precios: confirmados** (Builder 6 USD/mes anual, Builder + AI 15, Team 7,50 por asiento; gratis, 2 copias al día). Se precisa: no hay pago mensual, solo trimestral (8, 20 y 10 USD) o anual.
2. **21st.dev, términos (20 jul 2026): ya leídos.** Prohíben redistribuir sin autorización, exigen un enlace visible a la página original si se copia un componente a otro sitio, prohíben el *scraping* y entrenar IA con el catálogo, y reservan a 21st los demos y los medios aunque el código sea MIT. Antes estaba «no verificado»; ahora **refuerza** «solo inspiración».
3. **21st.dev, lo más guardado: ya visible.** Héroes ligados al scroll, Spline Scene, Liquid Glass Button, Aurora, shaders y Text Rotate encabezan la primera página (tabla en § 2.2). Confirma la impresión anterior.
4. **Uiverse, licencia MIT: confirmada en el sitio** y «100% Free for personal and commercial use». **Corrección de escala:** 7,471 elementos según la portada (4,510 según el listado), no «más de 5,400». **Exporta también a React.**
5. **Uiverse, popularidad: sigue sin verificar** (orden por omisión «Randomized»; Cloudflare bloqueó la sesión al tercer intento y no se forzó).
6. **shadcn/ui: confirmado** el changelog citado; se añade «Private GitHub Registries» (agosto de 2026).

**Técnicas de estas portadas aplicables a Itinerante:**

- **Mostrar el objeto real, no una captura.** La portada de shadcn/ui pone **componentes vivos** bajo el titular (formularios, gráficas y diálogos que funcionan), sin una sola imagen. Uiverse hace lo mismo con su rejilla de elementos reales. Itinerante ya lo hace con portadas y fotos reales; la lección es no cambiarlo por ilustraciones ni maquetas.
- **Titulares con tracking negativo.** shadcn usa Geist 48 px, peso 600, −0,05 em. Nuestros tokens ya llevan su tracking por tamaño (`display` −0,025 em, `titulo-grande` −0,022 em, en `design/tokens.json`), en la línea de Apple. **No cambiar**: los −0,05 a −0,06 em de estas landings son una voz de marca SaaS más apretada que la HIG.
- **Esquinas superelípticas.** En el HTML de 21st.dev los avatares llevan `corner-shape: superellipse(1.25)` (la esquina «squircle» de iOS) sobre un `border-radius` normal. Como mejora progresiva cabría en Itinerante (con `border-radius` el aspecto no cambia donde no hay soporte), pero **no verifiqué el soporte en Safari**: proponerlo solo después de medirlo.
- **No aplicable:** las filas de etiquetas y creadores de Uiverse que se repiten en marquesina, y su fondo negro con Montserrat 72 px y peso 700. Son movimiento perpetuo y una voz que no es la nuestra.

**¿Cambia alguna recomendación?** No. Las ocho de § 5 se mantienen; la 7 («21st, solo como inspiración y con licencia verificada») queda más firme por los términos.

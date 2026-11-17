// Sistema de guías (DESIGN.md, «Sistema de guías», 2026-11-15; skill ux-apple §3 bis): alineación a la rejilla, aire por rol, botones por
// jerarquía, una forma por nivel de título, tarjetas, barras y hojas. Sale con código 1 si algo se sale de la norma.
// node tools/qa/guias.mjs URL [DIR] [--perfiles=iphone16,d1440] [--capturas=ref|todas|no] [--oscuro] [--css=parche.css] [--js=parche.js]
//   DIR: guias.txt (tablas), guias.json (todas las medidas) y las capturas con la superposición; por omisión, el directorio actual.
//   --perfiles: por omisión los siete (iPhone 16 393×659, 13 mini 375×629, 16 Pro Max 440×763 —toque real—, tableta 768×1024, 1024×768,
//               1440×900 y 1920×1080 —puntero fino—). --capturas: ref = iPhone 16 y 1440 (por omisión), todas o no. --oscuro: tema oscuro.
//   --css / --js: inyecta un parche de prueba en el navegador (sin tocar el sitio, con la CSP de producción) para medir una propuesta antes de
//               construirla: el CSS se añade al final de style.css y mobile.css mientras viajan y el JS corre al terminar de leerse el documento.
// Cambia el navegador con CHROME_PATH. A diferencia del resto del arnés (CDP a mano) usa Playwright, que no es dependencia del repo: lo toma
// de PLAYWRIGHT_PATH, de «playwright» si está instalado o de /opt/node-tools (el contenedor de trabajo); sin él sale con 2 y lo dice.
//
// Qué mide el arnés del repo y qué no: controles.mjs, carrusel.mjs e iphone.mjs miden tamaños de toque, que las piezas quepan y dónde aterriza
// cada ancla. Ninguno mide si los bordes caen en una rejilla ni si el mismo hueco vale lo mismo en dos secciones. Esto sí:
//   G · guías verticales: cada pieza de primer nivel de cada sección empieza en una línea de la rejilla (margen, columna de 12 con canal de 32
//       desde 761 px, o el eje central solo para el escenario del carrusel y su pie); las columnas derechas de todas las secciones empiezan
//       en la misma x (columna 7); las dos columnas de una sección comparten la línea superior; lo centrado, centrado al píxel; un dato
//       asociado («N de 3 paradas hojeadas») va junto a lo suyo: en el renglón de su nota, 16 px después, o debajo de ella a 8 (G6).
//   R · ritmo vertical: cada hueco entre piezas consecutivas se clasifica por rol; un rol tiene un solo valor por perfil y está en la escala de 4.
//   B · botones: los de la misma jerarquía miden lo mismo (alto, relleno, rótulo, icono) y se colocan igual (ancho, alineación, aire).
//   T · títulos: cada nivel (h1, titular de sección, entradilla, pie, rótulo…) tiene un solo estilo en toda la página; el titular de sección
//       va en dos renglones («Nombre / frase») sin palabra viuda; ≤ 6 tamaños de letra por sección.
//   C · tarjetas: sin vacíos interiores (> 25 % del alto) y con una sola sangría.
//   H · hojas: margen interior de la escala (16 / 20 / 32), que no crece con la ventana; botones sin aplastar; en el menú ☰, Mi lista y
//       Explorar, un solo eje de tinta (texto y controles sin fondo) y uno de cajas (controles con fondo) (H3).
//   N · barras: cabecera alineada al contenedor (la tinta, no la caja), sin piezas que se muevan al desplazar; barra inferior centrada.
//   E · estado: nada se mide sobre un esqueleto (una lista en aria-busy).
// Escribe guias.json, guias.txt y, en DIR, guias-<seccion>-<perfil>.png y guias-hoja-<hoja>-<perfil>.png con la superposición (magenta =
// márgenes y columnas, la gruesa es la columna 7; azul punteado = eje; verde = pieza en la rejilla; rojo = fuera; azul = centrado permitido;
// etiqueta amarilla = hueco en px, roja si está fuera de norma; naranja = topes de columna que no coinciden).
//
// La norma que comprueba está en SISTEMA (abajo), con sus excepciones escritas: cambiar la norma es cambiar ese objeto, no el código.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

let pw = null;
for (const ruta of [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/node-tools/node_modules/playwright/index.js'].filter(Boolean)) {
  try { const m = await import(ruta.startsWith('/') || /^[A-Za-z]:[\\/]/.test(ruta) ? pathToFileURL(ruta).href : ruta); pw = m.default?.chromium ? m.default : m; if (pw?.chromium) break; pw = null; } catch { /* la siguiente */ }
}
if (!pw) { console.error('guias.mjs: no encuentro Playwright (PLAYWRIGHT_PATH=/ruta/a/playwright/index.js, o instálalo fuera del repo)'); process.exit(2); }
const CHROME = process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : undefined;

const args = process.argv.slice(2);
const pos = args.filter(a => !a.startsWith('--'));
const opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const URL_ = pos[0] || 'http://127.0.0.1:8094/';
const DIR = pos[1] || '.';
mkdirSync(DIR, { recursive: true });

// ---------------------------------------------------------------------------------------------------------------------------------------
// La norma («Sistema de guías»).
const SISTEMA = {
  tolerancia: 1,                       // px
  canal: 32,                           // canal de la rejilla de 12 desde 761 px (space-8)
  columnas: 12,
  division: [6, 7],                    // la columna izquierda termina en la 6 y la derecha empieza en la 7, en todas las secciones
  escala: 4,                           // todo hueco es múltiplo de 4
  // Solo el escenario del carrusel y lo que cuelga de él puede ir sobre el eje central.
  centrables: '.c3d, .cf-pie',
  renglonesCentradosMax: 2,            // un texto centrado no pasa de dos renglones
  // Proximidad: un dato asociado va junto a lo suyo, en el eje izquierdo: en el renglón de su texto, `hueco` px después de su última letra, o
  // debajo de él a `debajo` px. Nunca suelto en el borde derecho (decisión del 2026-11-15: a 1440 quedaba a ~600 px de sus chips).
  asociados: [{ dato: '.rail-progreso', de: '.rail-note', hueco: 16, debajo: 8 }],
  // Nota lateral (2026-11-16): la única pieza que no sigue la división 1–6 | 7–12. La lista de Eventos va en las columnas 1–8 y su nota en
  // 9–12 (estructura aprobada por Aldo: lista ancha y panel estrecho, como en Luma). No se le perdona nada más: empieza exactamente en su
  // columna, termina en el margen derecho y comparte tope con la lista (G3 y G4 la miden aparte).
  laterales: [{ sel: '.ev-lado', columna: 9 }],
  // Contenedor propio (2026-11-17, recomposición de Café pedida por Aldo: «una sola cuadrícula, contenedor centrado de 1 040–1 120 px»): desde
  // 1024 px la sección mide sus columnas en su propio contenedor (token ancho-carta, 1120: 12 columnas de 64 con canal de 32), no en el de la
  // página (1152), y su división es la suya: cabecera en 1–8 y la foto en un tercio, 9–12. Se exige que el contenedor mida lo que dice el token
  // (o el de la página, si la ventana no da para más), que esté centrado en el eje, que titular, categorías y primer producto compartan su
  // margen y que la foto empiece en su columna 9; su columna derecha no se compara con la de las demás secciones (G3 de página).
  contenedores: { cafe: { ancho: 1120, division: [8, 9] } },
  // Primaria dentro de una tarjeta (2026-11-16, el evento destacado): se mide contra su tarjeta, no contra la página. Empieza en la sangría
  // de la tarjeta; en el teléfono su fila de acciones llega al borde interior derecho (la primaria sola a todo el ancho interior, o seguida de
  // sus iconos); desde 761, al ancho del rótulo.
  tarjetasConPrimaria: '.ev-prox',
  // Hojas con un solo eje de tinta (texto y controles sin fondo) y uno de cajas (controles con fondo). La ficha tiene su retícula interior
  // (portada + título, tabla de datos) y solo se informa.
  hojasUnEje: ['menu', 'milista', 'explorar'],
  // Un único valor por rol de aire: [teléfono ≤ 760, tableta 761–1023, escritorio ≥ 1024]. null = sin objetivo (se informa).
  aire: {
    'banda→titular': [32, 32, 56],            // --sec / 2
    'titular→texto': [12, 12, 12],
    'texto→texto': [8, 8, 8],
    'texto→control': [24, 24, 24],
    'control→control': [16, 16, 16],
    'control→nota': [12, 12, 12],
    'cabecera→contenido': [24, 24, 24],
    'rótulo→contenido': [8, 8, 8],
    'contenido→pie': [8, 8, 8],
    'escenario→pie': [20, 20, 20],            // norma del Carrusel3D
    'contenido→acción': [24, 32, 32],
    'filete': [null, 48, 48],                 // un filete entre dos bloques: 24 a cada lado
    'bloque→bloque': [32, 32, 48],
    'capa→capa': [null, 64, 96],              // con filete: la mitad a cada lado
    'sección→sección': [64, 64, 112],         // --sec
    // Inicio: posiciones fijas aprobadas (variante A, 2026-11-14) en el teléfono; en escritorio el bloque se centra en el alto de la foto.
    'inicio·barra→titular': [24, 32, null],
    'inicio·titular→texto': [8, 12, 12],
    'inicio·texto→texto': [8, 8, 8],
    'inicio·texto→control': [24, 24, 24],
    'inicio·control→nota': [12, 12, 12],
    'inicio·cabecera→contenido': [24, 32, null]
  },

  // Botones: [variante-tamaño]: ancho en el teléfono / desde 761 px
  botones: { 'primario-56': { telefono: 'completo', ancho: 'contenido' } },
  tamanosMax: 6,
  // Excepciones escritas (lo que el código deja pasar a propósito, con su razón):
  excepciones: [
    'Inicio del teléfono: posiciones fijas aprobadas (variante A, 2026-11-14): sus roles llevan el prefijo «inicio·» y sus propios valores.',
    'Inicio de escritorio: el bloque de texto se centra en el alto de la foto (texto en 1–5, foto en 7–12): no se le exige compartir tope (G4) ni un valor de barra → titular.',
    'Una fila de dos columnas: la más corta absorbe la diferencia al final de su celda; de cada fila cuenta el hueco menor (piezas con `fila`).',
    'Café en escritorio: la barra de categorías es el control de la carta, no del encabezado: abre un bloque nuevo a todo el ancho, así que su aire es bloque → bloque (48) y se mide desde lo más bajo que tiene encima (la foto de 9–12, del alto del encabezado o un poco más), no desde la entradilla (pieza con `bloque`); en teléfono y tableta, texto → control (24). Lo mismo el cierre de la carta: su texto abre un bloque nuevo y su aire es bloque → bloque (48) desde la carta.',
    'Barra de categorías de la carta: cuenta como un solo control (la unión de sus enlaces), no enlace por enlace.',
    'Pie del libro: el aire hacia abajo se cuenta desde la reserva (--cf-reserva), no desde la última letra: con un título de un renglón se ve más.',
    'Tira de La casa y ventana del carrusel: van a sangre; de la tira se mide su primera pieza y del carrusel, la pieza central.',
    'Titular de sección en el teléfono: hasta tres renglones si la frase no cabe en dos; «Contacto» es de un renglón (no lleva frase).',
    'Controles sin fondo (texto, interruptor, «Mi lista»): se alinean por su tinta, no por su caja de toque.',
    'Descripción de un evento (propuesta o destacado): es un párrafo de lectura (≥ 120 caracteres, tres o cuatro renglones) y lleva la letra `lectura` 17/24, no la de las entradillas (17/22): scripts/critique.mjs (law-lineheight) pide interlínea ≥ 1.35 en esos párrafos. Nivel propio en NIVELES.',
    'Eventos en escritorio: la lista va en las columnas 1–8 y la nota lateral en 9–12 (`laterales`; aprobado por Aldo el 2026-11-16): la nota no cuenta como «columna derecha» de la división única, pero debe empezar en la columna 9, terminar en el margen y compartir tope con la lista.',
    'Primaria del evento destacado: vive dentro de su tarjeta (`tarjetasConPrimaria`); se le exige la sangría de la tarjeta y, en el teléfono, que su fila llegue al borde interior (no el ancho de la página).',
    'Fecha tipográfica de Eventos (el número de 52 del destacado y el de 32 del día): es una cifra decorativa (aria-hidden; la fecha se lee en texto sr-only), no texto de lectura: no cuenta para el máximo de tamaños por sección (T3).',
    'Ficha del libro: tiene retícula interior propia; de ella solo fallan el margen (H1) y los botones aplastados (H2).',
    'Café desde 1024 px (2026-11-17, pedido de Aldo): contenedor propio de 1120 (`contenedores.cafe`, token ancho-carta) centrado, 16 px más estrecho por lado que el de la página a partir de 1184 px; sus columnas y su división (1–8 | 9–12: la foto en un tercio) son las de ese contenedor. Su columna derecha no entra en la comparación entre secciones (G3 de página). Titular, categorías y primer producto comparten su margen.',
    'Barra de categorías de la carta (2026-11-17): enlaces sin fondo (texto con objetivo de 44): se alinea por la tinta de su primer enlace, no por la caja de toque.'
  ]
};

const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
// clave: [nombre, ancho, alto, dpr de captura, toque]
const PERFILES = {
  iphone16: ['iPhone 16 393×659', 393, 659, 2, true],
  iphone13mini: ['iPhone 13 mini 375×629', 375, 629, 2, true],
  iphone16promax: ['iPhone 16 Pro Max 440×763', 440, 763, 2, true],
  tablet768: ['Tableta 768×1024', 768, 1024, 1, true],
  d1024: ['Escritorio 1024×768', 1024, 768, 1, false],
  d1440: ['Escritorio 1440×900', 1440, 900, 1, false],
  d1920: ['Escritorio 1920×1080', 1920, 1080, 1, false]
};
const claves = opt.perfiles ? String(opt.perfiles).split(',') : Object.keys(PERFILES);
const CAPTURAS = opt.capturas || 'ref';            // ref = iPhone 16 y 1440
const REF = ['iphone16', 'd1440'];

// Secciones y sus piezas con rol (para el ritmo). [rol, selector, { c3d }] — con c3d, la pieza central de ese carrusel.
const SECCIONES = [
  { id: 'inicio', sel: '#inicio', piezas: [
    ['titular', '.entry-title'], ['estado', '.entry-status'], ['entradilla', '.entry-lede'], ['control', '.entry-actions .btn'],
    ['nota', '.entry-address'], ['dato', '.entry-ev'], ['contenido', '.entry-media'] ] },
  { id: 'casa', sel: '#casa', piezas: [
    ['titular', '#house-title'], ['entradilla', '.house .sec-texto'], ['contenido', '.house-track .still:first-child .still-img'],
    ['pie', '.house-track .still:first-child figcaption'] ] },
  { id: 'catalogo', sel: '#libros', piezas: [
    ['titular', '#books-title'], ['control', '.explore-open'], ['control', '.rail-chips'], ['nota', '.rail-note'], ['dato', '.rail-progreso'],
    ['escenario', '.c3d--portada', { c3d: true }], ['pie-escenario', '.cf-texto'],
['subtitular', '.layer-title'], ['rotulo', '.cat-search label'], ['control', '.cat-combo'], ['rotulo', '.cat-status'],
['contenido', '.cat-grid'], ['accion', '.cat-fold'], ['texto', '.books-foot p'], ['control', '.books-foot .btn'] ] },
  { id: 'eventos', sel: '#cartelera', piezas: [
    ['titular', '#bill-title'], ['entradilla', '.bill .sec-texto'], ['contenido', '.ev-prox'], ['rotulo', '.ev-grupo:not(.ev-propuestas):not(.ev-anteriores) > .ev-sub'], ['contenido', '.ev-dias'],
    ['rotulo', '.ev-propuestas > .ev-sub'], ['contenido', '.ev-propuestas .ev-filas'], ['bloque', '.ev-lado'],
    ['rotulo', '.ev-anteriores > .ev-sub'], ['contenido', '.ev-pasados'], ['accion', '.ev-fold'] ] },
  { id: 'cafe', sel: '#cafe', piezas: [
    ['titular', '#cafe-title'], ['entradilla', '.cafe .sec-texto'], ['control', '.ct-nav', { bloque: true }], ['contenido', '.ct-lista'],
    ['contenido', '.cafe-foto'], ['texto', '.ct-cierre p', { bloque: true }], ['control', '.ct-cierre .btn'] ] },
  { id: 'visita', sel: '#visita', piezas: [
    ['titular', '#visit-title'], ['subtitular', '.visit address'], ['estado', '.visit-status'], ['control', '.visit-actions .btn'],
['contenido', '.visit-map-link', { fila: 'figuras' }], ['pie', '.visit-map figcaption'], ['rotulo', '.hours caption'], ['contenido', '.hours tbody'],
['nota', '.visit-note'], ['contenido', '.visit-arrival .frame-clip', { fila: 'figuras' }], ['pie', '.visit-arrival figcaption'] ] },
  { id: 'contacto', sel: 'footer.ftr', piezas: [
    ['titular', '.ftr-title'], ['entradilla', '.ftr-lede'], ['contenido', '.ftr-links'], ['bloque', '.interruptor'] ] }
];
// Niveles de texto que deben ser idénticos en toda la página.
const NIVELES = {
  'h1': ['.entry-title'],
  'titular de sección': ['#house-title', '#books-title', '#bill-title', '#cafe-title', '#visit-title', '#ftr-title'],
  'subtitular': ['.layer-title', '.visit address', '.ev-sub', '.ev-lado-tit', '.ct-grupo-tit'],
  'entradilla y cuerpo': ['.house .sec-texto', '.bill .sec-texto', '.cafe .sec-texto', '.ftr-lede', '.books-foot p', '.ct-cierre p'],
  'párrafo de lectura': ['.ev-card-desc', '.ev-prox-desc'],   // tres renglones o más (≥ 120 caracteres): token `lectura` 17/24; la crítica (law-lineheight) pide ≥ 1.35
  'estado': ['.entry-status', '.visit-status'],
  'título de pieza': ['.cf-titulo', '.ev-card-tit'],
  'título del destacado': ['.ev-prox-tit'],   // Title 1 (2026-11-16): el destacado es lo único de Eventos que compite con el titular de sección; su forma es una sola
  'versalitas': ['.ev-fecha-rot', '.ev-dia-sem', '.ev-pas-fecha'],   // 13 semibold en mayúsculas con interletra abierta: la fecha del destacado y el día de la lista
  'título de fila anterior': ['.ev-pas-tit'],   // Headline 17 (2026-11-16): «Eventos anteriores» es archivo; su título no compite con el de una fila de «Después» (Title 3)
  'rótulo de dato': ['.ev-dato dt'],
  'valor de dato': ['.ev-dato dd'],
  'nombre de producto': ['.ct-nom'],      // Headline 17: la fila de la carta (1 / 2 columnas, 2026-11-17) lleva su nombre bajo el título del grupo, sin competir con él
  'texto de pieza': ['.cf-meta', '.ct-desc'],
  'pie de figura': ['.visit-map figcaption', '.visit-arrival figcaption'],
  'rótulo de grupo': ['.hours caption', '.cat-search label', '.cat-filters legend'],
  'nota': ['.entry-address', '.rail-note', '.visit-note', '.visit address span', '.cat-status', '.ev-card-meta', '.ev-lado-txt', '.ev-pas-meta']
};

// ---------------------------------------------------------------------------------------------------------------------------------------
// Medición en la página.
function enPagina(cfg) {
  const sx = scrollX, sy = scrollY;
  const rd = v => Math.round(v * 10) / 10;
  const B = r => ({ l: rd(r.left + sx), t: rd(r.top + sy), r: rd(r.right + sx), b: rd(r.bottom + sy), w: rd(r.width), h: rd(r.height) });
  const visible = e => {
    if (!e.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    const r = e.getBoundingClientRect(); return r.width > 1.5 && r.height > 1.5;
  };
  const alpha = c => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return 0; const p = m[1].split(/[,\s/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; };
  const lienzo = document.createElement('canvas').getContext('2d');
  const nombre = e => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + [...e.classList].slice(0, 3).map(c => '.' + c).join(''));
  const oculto = e => !!e.closest('.sr-only');
  const letra = e0 => {
    let e = e0;
    const tw0 = document.createTreeWalker(e0, NodeFilter.SHOW_TEXT);
    for (let n = tw0.nextNode(); n; n = tw0.nextNode()) if (n.data.trim() && n.parentElement && !oculto(n.parentElement) && visible(n.parentElement)) { e = n.parentElement; break; }
    const cs = getComputedStyle(e), cs0 = getComputedStyle(e0);
    lienzo.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    return { px: parseFloat(cs.fontSize), lh: cs.lineHeight === 'normal' ? null : rd(parseFloat(cs.lineHeight)), peso: +cs.fontWeight, ls: cs.letterSpacing === 'normal' ? 0 : Math.round(parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize) * 1000) / 1000,
      color: cs.color, alinea: cs0.textAlign === 'start' ? 'left' : cs0.textAlign === 'end' ? 'right' : cs0.textAlign, ch: rd(lienzo.measureText('0').width) };
  };
  // La tinta de un texto: de dónde a dónde llegan sus letras y cómo se reparten en renglones.
  const tinta = e => {
    const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    const palabras = [];
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.parentElement || oculto(n.parentElement) || !visible(n.parentElement)) continue;
      const lh = parseFloat(getComputedStyle(n.parentElement).lineHeight) || parseFloat(getComputedStyle(n.parentElement).fontSize) * 1.2;
      const re = /\S+/g; let m;
      while ((m = re.exec(n.data))) {
        const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        for (const r of rg.getClientRects()) if (r.width > 0.5 && r.height > 1.5) palabras.push({ l: r.left, r: r.right, t: r.top, b: r.bottom, txt: m[0], lh });
      }
    }
    if (!palabras.length) return null;
    // gráficos en línea que pertenecen al renglón (punto de estado, icono): cuentan para el borde, no para las palabras
    const graficos = [...e.querySelectorAll('svg, img, .status-dot, .interruptor-pista')].filter(g => !oculto(g) && visible(g)).map(g => g.getBoundingClientRect());
    palabras.sort((a, b) => a.t - b.t || a.l - b.l);
    const renglones = [];
    for (const p of palabras) {
      const u = renglones[renglones.length - 1];
      if (u && Math.abs((p.t + p.b) / 2 - (u.t + u.b) / 2) < Math.max(p.b - p.t, u.b - u.t) * 0.5) { u.l = Math.min(u.l, p.l); u.r = Math.max(u.r, p.r); u.n++; u.txt += ' ' + p.txt; if (p.b - p.t > u.b - u.t) { u.t = p.t; u.b = p.b; u.lh = p.lh; } }
      else renglones.push({ l: p.l, r: p.r, t: p.t, b: p.b, lh: p.lh, n: 1, txt: p.txt });
    }
    const l = Math.min(...renglones.map(x => x.l)), r = Math.max(...renglones.map(x => x.r));
    const gl = Math.min(l, ...graficos.map(g => g.left)), gr = Math.max(r, ...graficos.map(g => g.right));
    const a = renglones[0], z = renglones[renglones.length - 1];
    let top = (a.t + a.b) / 2 - a.lh / 2, bot = (z.t + z.b) / 2 + z.lh / 2;
    for (const g of graficos) { top = Math.min(top, g.top); bot = Math.max(bot, g.bottom); }
    return { l: rd(l + sx), r: rd(r + sx), w: rd(r - l), ml: rd(gl + sx), mr: rd(gr + sx), t: rd(top + sy), b: rd(bot + sy), renglones: renglones.map(x => ({ w: rd(x.r - x.l), n: x.n, txt: x.txt.slice(0, 60), l: rd(x.l + sx), r: rd(x.r + sx), t: rd(x.t + sy), b: rd(x.b + sy) })) };
  };
  const texto = e => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48);
  const CONTROL = 'a[href], button, input, select, textarea, [role="radio"], [role="switch"]';
  const TEXTO = /^(H[1-6]|P|FIGCAPTION|CAPTION|LABEL|ADDRESS|TH|TD|DT|DD|LEGEND|BLOCKQUOTE)$/;

  function medirRaiz(raizSel, piezasCfg) {
    const raiz = document.querySelector(raizSel);
    if (!raiz || !visible(raiz)) return null;
    const atomos = [];
    const empuja = (e, tipo, sup, extra = {}) => {
      const cs = getComputedStyle(e);
      const a = { id: atomos.length, tipo, sel: nombre(e), txt: texto(e), caja: B(e.getBoundingClientRect()), sup, escenario: !!e.closest(cfg.centrables),
        relleno: [parseFloat(cs.paddingTop), parseFloat(cs.paddingRight), parseFloat(cs.paddingBottom), parseFloat(cs.paddingLeft)].map(rd), radio: cs.borderTopLeftRadius, ...extra };
      if (tipo === 'texto' || tipo === 'control' || tipo === 'insignia') { a.letra = letra(e); a.tinta = tinta(e); if (e.closest('[aria-hidden="true"]')) a.decorativo = true; }
      if (tipo === 'control' && extra.fondo === undefined) a.fondo = alpha(cs.backgroundColor) > 0.03 || cs.boxShadow !== 'none' || parseFloat(cs.borderTopWidth) > 0;
      atomos.push(a); return a.id;
    };
    const union = e => { const rs = [...e.children].filter(visible).map(c => c.getBoundingClientRect()); if (!rs.length) return B(e.getBoundingClientRect()); const l = Math.min(...rs.map(r => r.left)), t = Math.min(...rs.map(r => r.top)), r = Math.max(...rs.map(r => r.right)), b = Math.max(...rs.map(r => r.bottom)); return B({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t }); };
    const directo = e => [...e.childNodes].some(n => n.nodeType === 3 && n.data.trim());
    const esTexto = e => (TEXTO.test(e.tagName) || directo(e)) && !!texto(e) && !oculto(e) && !e.querySelector('button, input, select, [role="radio"], [role="switch"]');
    const cubre = (e, cs) => {   // una figura recortada: caja con radio y una imagen que la llena
      if (!/hidden|clip/.test(cs.overflow + cs.overflowX)) return false;
      const m = e.querySelector('img, svg:not(.ic), video'); if (!m || !visible(m)) return false;
      const a = e.getBoundingClientRect(), b = m.getBoundingClientRect();
      return b.width * b.height >= a.width * a.height * 0.85 && !e.querySelector('p, h1, h2, h3, h4, figcaption');
    };
    const superficie = (e, cs) => {
      const bordes = ['Top', 'Right', 'Bottom', 'Left'].every(s => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none');
      return alpha(cs.backgroundColor) > 0.03 || bordes || cs.boxShadow !== 'none';
    };
    function c3d(e, sup) {
      const cr = e.getBoundingClientRect(), cx = cr.left + cr.width / 2;
      const vp = e.querySelector('.c3d-viewport') || e;
      const idEsc = empuja(vp, 'escenario', sup);
      let centro = null, d = 1e9;
      for (const li of e.querySelectorAll('.c3d-track > li')) { const r = li.getBoundingClientRect(); if (!r.width) continue; const dd = Math.abs(r.left + r.width / 2 - cx); if (dd < d) { d = dd; centro = li; } }
      if (centro) {
        const cara = centro.querySelector('.cover') || centro;
        const id = empuja(cara, 'pieza-central', sup, { escenario: true, ejeEscenario: rd(cx + sx), piezas: e.querySelectorAll('.c3d-track > li').length });
        camina(cara, id);
      }
      for (const f of e.querySelectorAll('.c3d-flecha')) if (visible(f)) empuja(f, 'flecha', sup, { escenario: true });
      return idEsc;
    }
    function camina(e, sup) {
      for (const h of e.children) {
        const cs = getComputedStyle(h);
        if (cs.display === 'contents') { camina(h, sup); continue; }
        if (h.tagName === 'DIALOG' && !h.open) continue;
        if (!visible(h)) continue;
        if (h.matches('.c3d')) { c3d(h, sup); continue; }
        if (h.matches('[role="radiogroup"]')) { const id = empuja(h, 'control', sup, { grupo: true, fondo: true }); atomos[id].caja = union(h); continue; }
        if (h.matches('.ct-nav')) { const id = empuja(h, 'control', sup, { grupo: true, fondo: false }); atomos[id].caja = union(h); continue; }   // enlaces sin fondo: la tinta del primero
        if (h.matches('.house-track, .news-list, .cat-grid, .ev-filas, .ev-pasados, .ct-rejilla')) {
          const id = empuja(h, 'rejilla', sup);
          let i = 0;
          for (const li of h.children) { const r = li.getBoundingClientRect(); if (r.left < -1 || r.right > document.documentElement.clientWidth + 1 || !visible(li)) continue; if (i++ > 5) break; camina(li, id); }
          continue;
        }
        if (h.matches(CONTROL)) {
          const r = h.getBoundingClientRect();
          const grande = r.height > 72 && h.querySelector('img, svg:not(.ic), .cover');
          if (grande && !h.querySelector('p, h3, h4, .card-title, [class*="titulo"], [class*="title"]')) { empuja(h, 'media', sup); continue; }
          if (grande) { camina(h, empuja(h, 'tarjeta', sup)); continue; }
          empuja(h, 'control', sup, { icono: (i => i && visible(i) ? rd(i.getBoundingClientRect().width) : null)(h.querySelector('svg')) }); continue;
        }
        if (h.matches('img, picture, video, canvas, svg')) { empuja(h, 'media', sup); continue; }
        if (cubre(h, cs)) { empuja(h, 'media', sup); continue; }
        if (esTexto(h)) { empuja(h, superficie(h, cs) && h.tagName === 'SPAN' ? 'insignia' : 'texto', sup); continue; }
        if (superficie(h, cs) && h.getBoundingClientRect().width < document.documentElement.clientWidth - 2) { camina(h, empuja(h, 'superficie', sup)); continue; }
        camina(h, sup);
      }
    }
    camina(raiz, null);
    const piezas = [];
    for (const [rol, sel, o] of piezasCfg || []) {
      let e = null;
      if (o && o.c3d) {
        const c = document.querySelector(sel); if (!c || !visible(c)) continue;
        const cr = c.getBoundingClientRect(), cx = cr.left + cr.width / 2; let d = 1e9;
        for (const li of c.querySelectorAll('.c3d-track > li')) { const r = li.getBoundingClientRect(); if (!r.width) continue; const dd = Math.abs(r.left + r.width / 2 - cx); if (dd < d) { d = dd; e = li.querySelector('.cover') || li; } }
      } else e = [...document.querySelectorAll(sel)].find(visible) || null;
      if (!e) continue;
      const p = { rol, sel, fila: (o && o.fila) || null, bloque: !!(o && o.bloque), caja: e.matches('[role="radiogroup"], .ct-nav') ? union(e) : B(e.getBoundingClientRect()), txt: texto(e) };
      const ecs = getComputedStyle(e);
      const sinFondo = rol === 'control' && !(alpha(ecs.backgroundColor) > 0.03 || ecs.boxShadow !== 'none' || parseFloat(ecs.borderTopWidth) > 0) && !e.matches('[role="radiogroup"], .ct-nav, .cat-combo');
      if (/titular|entradilla|estado|nota|dato|pie|rotulo|texto|subtitular/.test(rol) || sinFondo) {
        p.letra = letra(e); p.tinta = tinta(e);
        if (p.tinta) {   // de renglón a renglón (lo que se ve): la caja de contenido, salvo que el texto no la llene (objetivo de toque, alto mínimo)
          const r = e.getBoundingClientRect();
          const ct = r.top + sy + parseFloat(ecs.borderTopWidth) + parseFloat(ecs.paddingTop), cb = r.bottom + sy - parseFloat(ecs.borderBottomWidth) - parseFloat(ecs.paddingBottom);
          const t = Math.abs(p.tinta.t - ct) <= 2 ? rd(ct) : p.tinta.t, bb = Math.abs(p.tinta.b - cb) <= 2 ? rd(cb) : p.tinta.b;
          p.cajaCss = p.caja; p.caja = { ...p.caja, t, b: rol === 'pie-escenario' ? rd(cb) : bb, h: rd(bb - t) }; p.reserva = rd(cb - p.tinta.b);
        }
      }
      piezas.push(p);
    }
    const cs = getComputedStyle(raiz);
    return { caja: B(raiz.getBoundingClientRect()), relleno: [parseFloat(cs.paddingTop), parseFloat(cs.paddingRight), parseFloat(cs.paddingBottom), parseFloat(cs.paddingLeft)].map(rd), atomos, piezas };
  }

  if (cfg.modo === 'raiz') return medirRaiz(cfg.sel, cfg.piezas);

  if (cfg.modo === 'pagina') {
    // margen real: una sonda con el relleno de la variable
    const s = document.createElement('div'); s.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;padding-left:var(--margen);visibility:hidden'; document.body.append(s);
    const margen = parseFloat(getComputedStyle(s).paddingLeft); s.remove();
    const secciones = {};
    for (const sc of cfg.secciones) secciones[sc.id] = medirRaiz(sc.sel, sc.piezas);
    // niveles de texto
    const niveles = {};
    for (const [nivel, sels] of Object.entries(cfg.niveles)) {
      niveles[nivel] = [];
      for (const sel of sels) { const e = [...document.querySelectorAll(sel)].find(visible); if (!e) continue; niveles[nivel].push({ sel, txt: texto(e), letra: letra(e), tinta: tinta(e), caja: B(e.getBoundingClientRect()) }); }
    }
    // botones y controles
    const botones = [];
    const SEL = '.btn, .chip, .explore-open, .cat-fold, .interruptor, .ftr-link, .hdr-nav a, .tabbar a, .tabbar button, .menu-btn, #cat-q, .cat-filters-btn';
    for (const e of document.querySelectorAll(SEL)) {
      if (!visible(e) || e.closest('dialog:not([open])')) continue;
      const c = e.classList, cs = getComputedStyle(e);
      const variante = c.contains('btn--primario') ? 'primario' : c.contains('btn--secundario') ? 'secundario' : c.contains('btn--plano') ? 'plano' : c.contains('btn--vidrio') ? 'vidrio'
        : c.contains('chip') ? 'chip' : c.contains('explore-open') ? 'campo-enlace' : e.id === 'cat-q' ? 'campo' : c.contains('ftr-link') ? 'fila' : c.contains('interruptor') ? 'interruptor'
        : e.closest('.hdr-nav') ? 'nav' : e.closest('.tabbar') ? 'pestaña' : c.contains('menu-btn') ? 'menú' : c.contains('cat-fold') ? 'secundario' : nombre(e);
      const r = e.getBoundingClientRect();
      const ic = [...e.querySelectorAll('svg')].find(visible);
      const zona = e.closest('dialog') ? 'hoja:' + e.closest('dialog').id : e.closest('.hdr') ? 'cabecera' : e.closest('.tabbar') ? 'barra-inferior' : e.closest('footer') ? 'contacto' : (e.closest('main > section') || {}).id || '?';
      const padre = e.parentElement.getBoundingClientRect(), pcs = getComputedStyle(e.parentElement);
      const util = padre.width - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight);
      botones.push({ variante, icono: c.contains('btn--icono'), alto: rd(r.height), ancho: rd(r.width), caja: B(r), relleno: [rd(parseFloat(cs.paddingLeft)), rd(parseFloat(cs.paddingRight))], letra: letra(e), tinta: tinta(e),
        ic: ic ? rd(ic.getBoundingClientRect().width) : null, hueco: cs.columnGap === 'normal' ? 0 : rd(parseFloat(cs.columnGap)), radio: cs.borderTopLeftRadius, txt: texto(e) || e.getAttribute('aria-label') || e.getAttribute('placeholder') || '', zona, sel: nombre(e),
        completo: r.width >= util - 2, enEscenario: !!e.closest('.c3d'),
        tarjeta: (t => { if (!t) return null; const tr = t.getBoundingClientRect(); const fila = [...e.parentElement.children].filter(visible).filter(x => Math.abs(x.getBoundingClientRect().top - r.top) < r.height / 2).map(x => x.getBoundingClientRect());
          let c = e; while (c.parentElement && c.parentElement !== t) c = c.parentElement;   // el hijo directo de la tarjeta que contiene el botón: su relleno es la sangría
          const sang = c.getBoundingClientRect().left - tr.left + parseFloat(getComputedStyle(c).paddingLeft);
          return { l: rd(tr.left + sx), r: rd(tr.right + sx), sangria: rd(sang), filaR: rd(Math.max(...fila.map(x => x.right)) + sx), interiorR: rd(padre.right - parseFloat(pcs.paddingRight) + sx) }; })(cfg.tarjetasConPrimaria ? e.closest(cfg.tarjetasConPrimaria) : null) });
    }
    const asociados = [];
    for (const a of cfg.asociados || []) { const d = [...document.querySelectorAll(a.dato)].find(visible), n = [...document.querySelectorAll(a.de)].find(visible); if (d && n) asociados.push({ ...a, d: tinta(d), n: tinta(n), txt: texto(d) }); }
    return { W: rd(document.querySelector('main').getBoundingClientRect().right), iw: innerWidth, H: innerHeight, margen, alto: document.documentElement.scrollHeight, secciones, niveles, botones, asociados,
      ocupado: [...document.querySelectorAll('main [aria-busy="true"]')].filter(visible).map(nombre) };
  }

  if (cfg.modo === 'barras') {
    const q = s => { const e = document.querySelector(s); if (!e || !visible(e)) return null; const r = e.getBoundingClientRect(); const t = tinta(e); return { l: rd(r.left), r: rd(r.right), t: rd(r.top), b: rd(r.bottom), w: rd(r.width), h: rd(r.height), tl: t ? rd(t.l - sx) : null, tr: t ? rd(t.r - sx) : null }; };
    const nav = [...document.querySelectorAll('.hdr-nav a')].filter(visible).map(e => { const r = e.getBoundingClientRect(); return { txt: texto(e), l: rd(r.left), r: rd(r.right), actual: e.hasAttribute('aria-current') }; });
    const tabs = [...document.querySelectorAll('.tabbar > a, .tabbar > button')].filter(visible).map(e => { const r = e.getBoundingClientRect(); return { txt: texto(e), l: rd(r.left), r: rd(r.right), w: rd(r.width), h: rd(r.height) }; });
    return { y: scrollY, hdr: q('.hdr'), marca: q('.hdr-brand'), logo: q('.hdr-brand img'), cta: q('.hdr-cta'), lista: q('.hdr-list'), menu: q('.menu-btn'), nav, navCaja: q('.hdr-nav'), tabbar: q('.tabbar'), tabs };
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Análisis.
const clase = W => (W <= 760 ? 0 : W < 1024 ? 1 : 2);
const NOMBRE_CLASE = ['teléfono', 'tableta', 'escritorio'];
function rejilla(W, margen, iw = W, LR = null) {
  const L = LR ? LR[0] : margen, R = LR ? LR[1] : W - margen, C = (L + R) / 2, g = SISTEMA.canal, n = SISTEMA.columnas;
  if (iw <= 760) return { L, R, C, inicios: [L], finales: [R], col: R - L };
  const col = (R - L - (n - 1) * g) / n;
  const inicios = Array.from({ length: n }, (_, i) => L + i * (col + g));
  return { L, R, C, col, inicios, finales: inicios.map(x => x + col) };
}
const cerca = (x, lista, tol = SISTEMA.tolerancia) => { let m = null, d = 1e9; lista.forEach((v, i) => { const dd = Math.abs(v - x); if (dd < d) { d = dd; m = i; } }); return { i: m, d, ok: d <= tol, v: lista[m] }; };
const r1 = v => Math.round(v * 10) / 10;
const r0 = v => Math.round(v);

function parRol(a, b) {
  const txt = ['entradilla', 'estado', 'texto', 'subtitular'];
  if (a === 'titular' && ['subtitular', 'rotulo'].includes(b)) return 'cabecera→contenido';
  if (b === 'accion') return 'contenido→acción';
  if (a === 'control' && b === 'rotulo') return 'filete';
  if (b === 'subtitular') return 'capa→capa';
  if (a === 'subtitular' && b === 'rotulo') return 'texto→control';
  if (a === 'nota' && b === 'dato') return 'texto→texto';
  if (a === 'titular' && [...txt, 'nota'].includes(b)) return 'titular→texto';
  if (b === 'control' && ['titular', ...txt, 'nota', 'dato'].includes(a)) return 'texto→control';
  if (a === 'control' && b === 'control') return 'control→control';
  if (a === 'control' && ['nota', 'dato'].includes(b)) return 'control→nota';
  if (a === 'rotulo') return 'rótulo→contenido';
  if (a === 'escenario' && b === 'pie-escenario') return 'escenario→pie';
  if (a === 'contenido' && ['pie', 'nota'].includes(b)) return 'contenido→pie';
  if (['contenido', 'escenario'].includes(b) && ['titular', ...txt, 'control', 'nota', 'dato'].includes(a)) return 'cabecera→contenido';
  if (txt.includes(a) && [...txt, 'nota'].includes(b)) return 'texto→texto';
  return 'bloque→bloque';
}

// Juicio de cada pieza de primer nivel contra la rejilla: en qué línea se ancla y si esa línea existe.
function juzgar(atomos, G, k, id, F, enLinea = []) {
  const tol = SISTEMA.tolerancia;
  const s = { atomos };
    const ejes = { izq: new Map(), centro: new Map(), der: new Map() };
  const marca = (mapa, x, a) => { const kx = r0(x); if (!mapa.has(kx)) mapa.set(kx, []); mapa.get(kx).push(a.sel); };
  const juicio = [];
  for (const a of s.atomos) {
    if (a.sup !== null) continue;                               // lo de dentro de una tarjeta se mide contra su tarjeta
    // un control sin fondo (texto o interruptor sueltos) se alinea por su tinta, no por su caja de toque
    const c = a.tipo === 'control' && !a.fondo && a.tinta ? { ...a.caja, l: a.tinta.ml, r: a.tinta.mr } : a.caja, cx = (c.l + c.r) / 2;
    let j = { id: a.id, ancla: '', ok: true, nota: '', c };
    if (a.tipo === 'escenario') { j.ancla = 'escenario'; if (Math.abs(cx - G.C) > tol) { j.ok = false; j.nota = `escenario centrado a ${r1(cx - G.C)} px del eje`; F('G5', id, `${a.sel}: ${j.nota}`); } juicio.push(j); continue; }
    if (a.tipo === 'flecha') { j.ancla = 'flecha'; juicio.push(j); continue; }
    if (a.tipo === 'pieza-central') {
      j.ancla = 'centro'; marca(ejes.centro, cx, a);
      if (Math.abs(cx - G.C) > tol) { j.ok = false; j.nota = `pieza central a ${r1(cx - G.C)} px del eje`; F('G5', id, `${a.sel}: ${j.nota}`); }
      juicio.push(j); continue;
    }
    const esTexto = a.tipo === 'texto' || a.tipo === 'insignia';
    if (esTexto && enLinea.some(c => a.sel.includes(c))) { j.ancla = 'asociado'; juicio.push(j); continue; }   // va tras su texto: lo juzga G6
    if (esTexto && a.tinta) {
      const al = a.letra.alinea;
      if (al === 'center') {
        j.ancla = 'centro'; marca(ejes.centro, cx, a);
        if (!a.escenario) { j.ok = false; j.nota = 'texto centrado fuera del escenario'; F('G2', id, `${a.sel} «${a.txt}»: ${j.nota} (eje ${r1(cx)})`); }
        else {
          if (Math.abs(cx - G.C) > tol) { j.ok = false; j.nota = `centrado a ${r1(cx - G.C)} px del eje`; F('G5', id, `${a.sel}: ${j.nota}`); }
          if (a.tinta.renglones.length > SISTEMA.renglonesCentradosMax) { j.ok = false; j.nota = `párrafo centrado de ${a.tinta.renglones.length} renglones`; F('G2', id, `${a.sel} «${a.txt}»: ${j.nota} (máx. ${SISTEMA.renglonesCentradosMax})`); }
        }
      } else if (al === 'right') {
        j.ancla = 'der'; marca(ejes.der, a.tinta.r, a);
        const f = cerca(a.tinta.r, G.finales);
        if (!f.ok) { j.ok = false; j.nota = `borde derecho ${a.tinta.r} fuera de rejilla (línea ${r1(f.v)}, Δ ${r1(a.tinta.r - f.v)})`; F('G1', id, `${a.sel} «${a.txt}»: ${j.nota}`); }
        else if (k === 0 && a.tinta.l - G.L > 40) { j.ok = false; j.nota = 'renglón suelto alineado a la derecha en el teléfono'; F('G2', id, `${a.sel} «${a.txt}»: ${j.nota} (tinta ${a.tinta.l}–${a.tinta.r})`); }
      } else {
        j.ancla = 'izq';
        const pc = a.escenario ? s.atomos.find(x => x.tipo === 'pieza-central') : null;
        if (pc) {   // cuelga del escenario: bloque centrado en el eje y texto en la sangría de la pieza (16)
          const sang = a.tinta.ml - pc.caja.l, cxb = (a.caja.l + a.caja.r) / 2;
          j.ancla = 'centro'; marca(ejes.centro, cxb, a);
          if (Math.abs(cxb - G.C) > tol || Math.abs(sang - 16) > 1.5) { j.ok = false; j.nota = `cuelga del escenario pero no sigue a la pieza central (bloque a ${r1(cxb - G.C)} px del eje; sangría ${r1(sang)}, objetivo 16)`; F('G5', id, `${a.sel}: ${j.nota}`); }
          juicio.push(j); continue;
        }
        marca(ejes.izq, a.tinta.ml, a);
        const f = cerca(a.tinta.ml, G.inicios);
        if (!f.ok) { j.ok = false; j.nota = `borde izquierdo ${a.tinta.ml} fuera de rejilla (línea ${r1(f.v)}, Δ ${r1(a.tinta.ml - f.v)})`; F('G1', id, `${a.sel} «${a.txt}»: ${j.nota}`); }
      }
      juicio.push(j); continue;
    }
    // cajas: control, media, superficie, tarjeta, rejilla
    const enL = cerca(c.l, G.inicios), enR = cerca(c.r, G.finales);
    const completo = Math.abs(c.l - G.L) <= tol && Math.abs(c.r - G.R) <= tol;
    const sangra = c.l < G.L - tol || c.r > G.R + tol;
    const ajustado = a.tipo === 'control';                     // un control al ancho de su contenido solo ancla un borde
    if (completo) { j.ancla = 'completo'; marca(ejes.izq, c.l, a); }
    else if (a.tipo === 'rejilla' && Math.abs(c.l) <= tol) { j.ancla = 'sangre'; }           // tira a sangre: su primera pieza es la que se mide
    else if (sangra && !a.escenario) { j.ancla = 'sangre'; j.ok = false; j.nota = `sale del contenedor (${c.l}–${c.r}; contenedor ${r1(G.L)}–${r1(G.R)})`; F('G1', id, `${a.sel}: ${j.nota}`); }
    else if (enL.ok && (enR.ok || ajustado)) { j.ancla = 'izq'; marca(ejes.izq, c.l, a); }
    else if (Math.abs(cx - G.C) <= tol) {
      j.ancla = 'centro'; marca(ejes.centro, cx, a);
      if (!a.escenario) { j.ok = false; j.nota = `centrado fuera del escenario (${c.l}–${c.r})`; F('G2', id, `${a.sel} «${a.txt}»: ${j.nota}`); }
    } else if (enR.ok && ajustado) { j.ancla = 'der'; marca(ejes.der, c.r, a); }
    else {
      j.ok = false; marca(ejes.izq, c.l, a); j.ancla = 'izq';
      const p = [];
      if (!enL.ok) p.push(`izq. ${c.l} (línea ${r1(enL.v)}, Δ ${r1(c.l - enL.v)})`);
      if (!enR.ok && !ajustado) p.push(`der. ${c.r} (línea ${r1(enR.v)}, Δ ${r1(c.r - enR.v)})`);
      j.nota = 'fuera de rejilla: ' + p.join('; ');
      F('G1', id, `${a.sel} «${a.txt}»: ${j.nota}`);
    }
    juicio.push(j);
  }
  return { ejes, juicio };
}

function analizar(clave, m) {
  const fallos = [];
  const F = (regla, seccion, detalle, extra = {}) => fallos.push({ perfil: clave, regla, seccion, detalle, ...extra });
  const W = m.W, k = clase(m.iw), G = rejilla(W, m.margen, m.iw), tol = SISTEMA.tolerancia;
  const res = { perfil: clave, W, margen: m.margen, rejilla: { L: r1(G.L), R: r1(G.R), C: r1(G.C), col: r1(G.col), inicios: G.inicios.map(r1), finales: G.finales.map(r1) }, secciones: {}, aire: [], colDer: {} };
  const ids = SECCIONES.map(s => s.id).filter(id => m.secciones[id]);

  // --- E: nada se mide sobre un esqueleto (un módulo que no cargó deja su lista en aria-busy)
  for (const o of m.ocupado || []) F('E1', 'página', `${o} sigue en aria-busy: el módulo no cargó y lo medido ahí es el esqueleto`);

  // --- G6: un dato asociado va junto a lo suyo (en su renglón, tras la última letra, o debajo), nunca suelto
  const enLinea = [];
  res.asociados = [];
  for (const a of m.asociados || []) {
    if (!a.d || !a.n) continue;
    const u = a.n.renglones.at(-1), d0 = a.d.renglones[0];
    const mismo = Math.abs((d0.t + d0.b) / 2 - (u.t + u.b) / 2) < Math.max(d0.b - d0.t, u.b - u.t) * 0.5;
    const hueco = r1(a.d.l - u.r), abajo = r1(a.d.t - a.n.b), dx = r1(a.d.ml - a.n.ml);
    const caso = { dato: a.dato, de: a.de, modo: mismo ? 'en línea' : 'debajo', hueco: mismo ? hueco : abajo, dx: mismo ? null : dx };
    if (mismo) { enLinea.push(a.dato); caso.ok = Math.abs(hueco - a.hueco) <= 2; if (!caso.ok) F('G6', 'página', `${a.dato} «${a.txt}» va en el renglón de ${a.de} pero a ${hueco} px de su última letra; objetivo ${a.hueco}`); }
    else { caso.ok = Math.abs(abajo - a.debajo) <= tol && Math.abs(dx) <= tol; if (!caso.ok) F('G6', 'página', `${a.dato} «${a.txt}» no va junto a ${a.de}: ${abajo} px debajo (objetivo ${a.debajo}) y a ${dx} px de su eje izquierdo (objetivo 0)`); }
    res.asociados.push(caso);
  }

  // --- G: guías verticales
  res.rejillas = {};
  const rejillaDe = id => {   // la de la página o, con contenedor propio (desde 1024), la de su contenedor (borde de contenido de la sección)
    const ct = SISTEMA.contenedores[id], s = m.secciones[id];
    if (!ct || k !== 2 || !s) return G;
    return rejilla(W, m.margen, m.iw, [s.caja.l + s.relleno[3], s.caja.r - s.relleno[1]]);
  };
  for (const id of ids) {
    const s = m.secciones[id];
    const Gp = G;
    const G_ = rejillaDe(id);
    if (G_ !== Gp) {   // contenedor propio: mide lo que dice su token (o el de la página si no cabe) y va centrado en el eje de la página
      const ct = SISTEMA.contenedores[id], barra = Math.max(0, m.iw - m.W), quiere = Math.min(ct.ancho - barra, Gp.R - Gp.L), mide = G_.R - G_.L;   // con barra de desplazamiento clásica, 100vw la incluye (lo mismo le pasa al contenedor de la página)
      res.rejillas[id] = { L: r1(G_.L), R: r1(G_.R), col: r1(G_.col), inicios: G_.inicios.map(r1), ancho: r1(mide), objetivo: quiere, desfase: r1(G_.L - Gp.L) };
      if (Math.abs(mide - quiere) > tol) F('G3', id, `su contenedor mide ${r1(mide)} px; su norma es ${quiere} (contenedores.${id})`);
      if (Math.abs(G_.C - Gp.C) > tol) F('G5', id, `su contenedor está centrado en x ${r1(G_.C)}; el eje de la página es ${r1(Gp.C)}`);
    }
    const { ejes, juicio } = juzgar(s.atomos, G_, k, id, F, enLinea);
    // columnas (desde 1024): dónde empieza la columna derecha y si las dos comparten la línea superior
    let colDer = null, tops = null;
    if (k === 2) {
      const tl = s.atomos.filter(a => a.sup === null && !['escenario', 'flecha', 'pieza-central', 'rejilla'].includes(a.tipo) && !a.escenario);
      const izqX = a => (a.tinta && a.tipo !== 'control' ? a.tinta.ml : a.caja.l);
      const esLateral = a => SISTEMA.laterales.find(l => a.sel.includes(l.sel));
      for (const a of tl.filter(esLateral)) {   // la nota lateral: su columna, el margen derecho y el tope de la lista que acompaña
        const lat = esLateral(a), x0 = G_.inicios[lat.columna - 1];
        if (Math.abs(a.caja.l - x0) > tol || Math.abs(a.caja.r - G_.R) > tol) F('G3', id, `${a.sel}: la nota lateral va de la columna ${lat.columna} al margen (${r1(x0)}–${r1(G_.R)}); está en ${a.caja.l}–${a.caja.r}`);
        const junto = tl.filter(b => b !== a && !esLateral(b) && Math.abs(izqX(b) - G_.L) <= 2 && b.caja.b > a.caja.t && b.caja.t < a.caja.b);
        if (junto.length) { const t0 = Math.min(...junto.map(b => b.caja.t)); if (Math.abs(t0 - a.caja.t) > tol) F('G4', id, `${a.sel}: la nota lateral no comparte tope con la lista (lista y ${r1(t0 - s.caja.t)}, nota y ${r1(a.caja.t - s.caja.t)}, Δ ${r1(a.caja.t - t0)})`); }
        res.laterales = [...(res.laterales || []), { seccion: id, sel: a.sel, l: a.caja.l, r: a.caja.r, columna: lat.columna }];
      }
      const der = tl.filter(a => !esLateral(a) && izqX(a) > G_.C - 100 && !(a.letra && a.letra.alinea !== 'left' && a.tipo !== 'control') && Math.abs((a.caja.l + a.caja.r) / 2 - G_.C) > 2 && a.caja.w > 120);
      const izq = tl.filter(a => Math.abs(izqX(a) - G_.L) <= 2);
      if (der.length && izq.length) {
        colDer = Math.min(...der.map(izqX));
        const dcol = der.filter(a => Math.abs(izqX(a) - colDer) <= 2);
        const tDer = Math.min(...dcol.map(a => a.caja.t));
        // la pieza de la izquierda que arranca la misma franja: la más alta que se solapa en vertical con la columna derecha
        const bDer = Math.max(...dcol.map(a => a.caja.b));
        const fr = izq.filter(a => a.caja.b > tDer && a.caja.t < bDer);
        if (fr.length) { const tIzq = Math.min(...fr.map(a => a.caja.t)); tops = { izq: tIzq, der: tDer, d: r1(tDer - tIzq), bIzq: Math.max(...fr.map(a => a.caja.b)), bDer }; }
        if (G_ === Gp) res.colDer[id] = r1(colDer); else res.rejillas[id].colDer = r1(colDer);   // con contenedor propio no se compara entre secciones
        const div = (SISTEMA.contenedores[id] && G_ !== Gp ? SISTEMA.contenedores[id].division : SISTEMA.division);
        const f = cerca(colDer, [G_.inicios[div[1] - 1]]);
        if (!f.ok) F('G3', id, `la columna derecha empieza en x ${r1(colDer)}; la división ${G_ !== Gp ? `de su contenedor` : 'única'} la pone en ${r1(f.v)} (columna ${div[1]}), Δ ${r1(colDer - f.v)}`);
        const soloControl = dcol.filter(a => a.caja.t < tDer + 4).every(a => a.tipo === 'control');
        if (tops && soloControl) { tops.d = r1(tops.bDer - tops.bIzq); tops.izq = tops.bIzq; tops.der = tops.bDer; tops.porAbajo = true; }
        if (tops && Math.abs(tops.d) > tol && id !== 'inicio') F('G4', id, tops.porAbajo ? `el control de la columna derecha no termina con el bloque izquierdo (Δ ${tops.d})` : `las dos columnas no comparten la línea superior: izquierda y ${r1(tops.izq - s.caja.t)}, derecha y ${r1(tops.der - s.caja.t)} (Δ ${tops.d})`);
      }
    }
    const casi = [];
    if (k === 2) {
      const cajas = s.atomos.filter(a => a.sup === null && ['media', 'superficie', 'tarjeta'].includes(a.tipo) && !a.escenario);
      for (let i = 0; i < cajas.length; i++) for (let j2 = i + 1; j2 < cajas.length; j2++) {
        const a = cajas[i].caja, b = cajas[j2].caja;
        if (Math.min(a.r, b.r) - Math.max(a.l, b.l) > 0) continue;               // misma columna: no son vecinas de fila
        if (Math.min(a.b, b.b) - Math.max(a.t, b.t) < Math.min(a.h, b.h) * 0.5) continue;
        for (const [n, d] of [['tope', b.t - a.t], ['fondo', b.b - a.b]]) if (Math.abs(d) > tol && Math.abs(d) <= 16) {
          casi.push({ a: cajas[i].sel, b: cajas[j2].sel, borde: n, d: r1(d), ya: n === 'tope' ? a.t : a.b, yb: n === 'tope' ? b.t : b.b, xa: a.l, xb: b.r });
          F('G4', id, `${cajas[i].sel} y ${cajas[j2].sel} casi alineados: ${n} ${r1((n === 'tope' ? a.t : a.b) - s.caja.t)} frente a ${r1((n === 'tope' ? b.t : b.b) - s.caja.t)} (Δ ${r1(d)})`);
        }
      }
    }
    const fuera = juicio.filter(j => !j.ok).length;
    res.secciones[id] = { caja: s.caja, juicio, ejes: Object.fromEntries(Object.entries(ejes).map(([n, mp]) => [n, [...mp.keys()].sort((a, b) => a - b)])), ejesDetalle: Object.fromEntries(Object.entries(ejes).map(([n, mp]) => [n, Object.fromEntries(mp)])), fuera, colDer: colDer === null ? null : r1(colDer), tops, casi };
  }
  // columnas derechas distintas entre secciones
  const xs = [...new Set(Object.values(res.colDer).map(r0))];
  if (xs.length > 1) F('G3', 'página', `las columnas derechas empiezan en ${xs.length} x distintas: ${Object.entries(res.colDer).map(([s, x]) => `${s} ${x}`).join(', ')}`);

  // --- R: ritmo vertical
  let previa = null;
  for (const id of ids) {
    const s = m.secciones[id], ps = s.piezas;
    ps.forEach((p, i) => {
      let ant = null;
      const ancho = ['escenario', 'bloque'].includes(p.rol) || (p.bloque && k === 2);   // ocupan la fila entera aunque su caja sea estrecha (también la pieza que abre un bloque nuevo en escritorio)
      if (p.rol === 'dato' && enLinea.includes(p.sel)) return;   // va en el renglón de su nota: su aire es el de la nota (lo juzga G6)
      for (const q of ps) {
        if (q === p) continue;
        if (q.caja.b > p.caja.t + 2) continue;
        if (!ancho && Math.min(q.caja.r, p.caja.r) - Math.max(q.caja.l, p.caja.l) <= 1) continue;
        if (!ant || q.caja.b > ant.caja.b) ant = q;
      }
      if (ant) { const rol = p.bloque && k === 2 ? 'bloque→bloque' : (id === 'inicio' ? 'inicio·' : '') + parRol(ant.rol, p.rol); res.aire.push({ seccion: id, rol, par: `${ant.rol}→${p.rol}`, fila: p.fila, de: ant.sel, a: p.sel, v: r1(p.caja.t - ant.caja.b), x: r1(Math.max(ant.caja.l, p.caja.l) + 6), y0: ant.caja.b, y1: p.caja.t }); }
      else if (p.rol === 'titular') {
        const rol = id === 'inicio' ? 'inicio·barra→titular' : 'banda→titular';
        res.aire.push({ seccion: id, rol, par: rol, de: 'borde de la banda', a: p.sel, v: r1(p.caja.t - s.caja.t), x: p.caja.l + 6, y0: s.caja.t, y1: p.caja.t });
      }
    });
    if (previa && ps.length) {   // del fin de la última pieza de una sección al comienzo de la primera de la siguiente
      const fin = Math.max(...previa.s.piezas.map(q => q.caja.b)), ini = ps.reduce((a, b) => (b.caja.t < a.caja.t ? b : a));
      res.aire.push({ seccion: id, rol: 'sección→sección', par: 'sección→sección', de: `fin de ${previa.id}`, a: ini.sel, v: r1(ini.caja.t - fin), x: G.L + 80, y0: fin, y1: ini.caja.t });
    }
    previa = { id, s };
  }
  // en una fila de dos columnas la más corta absorbe la diferencia al final de su celda: de cada fila cuenta el hueco menor
  const filas = {};
  for (const g of res.aire) if (g.fila) (filas[g.seccion + '·' + g.fila] ||= []).push(g);
  for (const gs of Object.values(filas)) { const min = Math.min(...gs.map(g => g.v)); for (const g of gs) if (g.v > min + 1) g.absorbe = true; }
  const agrupa = vs => { const o = []; for (const v of [...vs].sort((a, b) => a - b)) if (!o.length || v - o[o.length - 1] > 1) o.push(v); return o; };
  const porRol = {};
  for (const g of res.aire) if (!g.absorbe) (porRol[g.rol] ||= []).push(g);
  res.porRol = {};
  for (const [rol, gs] of Object.entries(porRol)) {
    const vals = agrupa(new Set(gs.map(g => g.v)));
    const objetivo = SISTEMA.aire[rol] ? SISTEMA.aire[rol][k] : null;
    let mal = vals.length > 1;
    if (vals.length > 1) F('R1', 'página', `${rol}: ${vals.length} valores distintos (${vals.join(', ')}); objetivo ${objetivo ?? '—'}`, { rol });
    for (const g of gs) {   // un fallo por hueco: fuera del objetivo de su rol o, si el rol no tiene objetivo, fuera de la escala de 4
      const fueraEscala = Math.abs(g.v / SISTEMA.escala - Math.round(g.v / SISTEMA.escala)) > 0.26;
      g.objetivo = objetivo;
      if (objetivo !== null && Math.abs(g.v - objetivo) > 1) { g.mal = true; mal = true; F('R3', g.seccion, `${rol} (${g.de} → ${g.a}): ${g.v} px; objetivo ${objetivo}`, { rol }); }
      else if (objetivo === null && fueraEscala) { g.mal = true; mal = true; F('R2', g.seccion, `${g.par} (${g.de} → ${g.a}): ${g.v} px no es múltiplo de ${SISTEMA.escala}`, { rol }); }
      else g.mal = false;
    }
    res.porRol[rol] = { valores: vals, objetivo, mal, casos: gs.map(g => ({ seccion: g.seccion, par: g.par, v: g.v, de: g.de, a: g.a })) };
  }

  // --- B: botones de la misma jerarquía
  const grupos = {};
  for (const b of m.botones) { if (!b.zona.startsWith('hoja:')) b.completo = b.ancho >= (G.R - G.L) - 2; const key = `${b.variante}${b.icono ? '-icono' : ''}-${r0(b.alto)}`; b.clave = key; (grupos[`${b.variante}${b.icono ? '-icono' : ''}`] ||= []).push(b); }
  res.botones = {};
  for (const [g, bs] of Object.entries(grupos)) {
    const u = f => [...new Set(bs.map(f))];
    const altos = u(b => r0(b.alto)), rell = u(b => b.relleno.join('/')), letras = u(b => `${b.letra.px}/${b.letra.peso}`), ics = u(b => b.ic).filter(v => v !== null);
    res.botones[g] = { n: bs.length, altos, rellenos: rell, letras, iconos: ics, casos: bs.map(b => ({ zona: b.zona, txt: b.txt.slice(0, 28), alto: b.alto, ancho: b.ancho, l: b.caja.l, r: b.caja.r, relleno: b.relleno.join('/'), letra: `${b.letra.px}/${b.letra.peso}`, ic: b.ic, completo: b.completo })) };
    if (['primario', 'secundario', 'plano', 'chip', 'fila', 'vidrio-icono', 'secundario-icono'].includes(g)) {
      const enPagina = bs.filter(b => !b.zona.startsWith('hoja:') && b.zona !== 'cabecera');
      const sueltos = enPagina.filter(b => !b.tarjeta);   // el ancho se compara entre las que van sueltas en la página
      const uu = f => [...new Set(enPagina.map(f))];
      if (enPagina.length > 1) {
        if (uu(b => r0(b.alto)).length > 1) F('B1', 'página', `${g}: altos distintos en la página (${enPagina.map(b => `${b.zona} «${b.txt.slice(0, 18)}» ${b.alto}`).join(', ')})`);
        if (uu(b => b.relleno.join('/')).length > 1) F('B1', 'página', `${g}: rellenos distintos (${uu(b => b.relleno.join('/')).join(' · ')})`);
        if (uu(b => `${b.letra.px}/${b.letra.peso}`).length > 1) F('B1', 'página', `${g}: rótulos distintos (${uu(b => `${b.letra.px}/${b.letra.peso}`).join(' · ')})`);
        if (g === 'primario' && new Set(sueltos.map(b => b.completo)).size > 1) F('B1', 'página', `primario «Cómo llegar»: ancho completo en ${sueltos.filter(b => b.completo).map(b => b.zona).join(', ')} y al ancho del texto en ${sueltos.filter(b => !b.completo).map(b => `${b.zona} (${b.ancho})`).join(', ')}`);
      }
      if (g === 'primario') for (const b of enPagina.filter(x => x.tarjeta)) {   // dentro de una tarjeta: su sangría y, en el teléfono, la fila hasta el borde interior
        const t = b.tarjeta;
        if (Math.abs(b.caja.l - (t.l + t.sangria)) > tol) F('B2', b.zona, `primario «${b.txt}» en su tarjeta: empieza en x ${b.caja.l}; la sangría de la tarjeta está en ${r1(t.l + t.sangria)}`);
        if (k === 0 && Math.abs(t.filaR - t.interiorR) > tol) F('B2', b.zona, `primario «${b.txt}» en su tarjeta: su fila de acciones termina en x ${t.filaR}; el borde interior está en ${t.interiorR}`);
        if (k > 0 && Math.abs(b.caja.r - t.interiorR) <= tol) F('B2', b.zona, `primario «${b.txt}» en su tarjeta: ocupa todo el ancho interior; desde 761 px va al ancho de su rótulo`);
      }
      if (g === 'primario') for (const b of sueltos) {
        const quiere = k === 0 ? SISTEMA.botones['primario-56'].telefono : SISTEMA.botones['primario-56'].ancho;
        if ((quiere === 'completo') !== b.completo) F('B2', b.zona, `primario «${b.txt}»: ${b.completo ? 'ancho completo' : `ancho ${b.ancho}`}; la regla en ${NOMBRE_CLASE[k]} es «${quiere}»`);
        if (Math.abs(b.caja.l - G.L) > tol) F('B2', b.zona, `primario «${b.txt}»: empieza en x ${b.caja.l}; el margen está en ${r1(G.L)}`);
      }
    }
  }
  // aire alrededor de la acción primaria
  const prim = res.aire.filter(g => /\.btn/.test(g.a) && g.rol === 'texto→control');
  const vp = [...new Set(prim.map(g => g.v))];
  res.airePrimario = prim.map(g => ({ seccion: g.seccion, de: g.de, v: g.v }));
  if (vp.length > 1) F('B3', 'página', `texto → «Cómo llegar»: ${prim.map(g => `${g.seccion} ${g.v}`).join(', ')}`);

  // --- T: niveles de texto
  res.niveles = {};
  for (const [nivel, casos] of Object.entries(m.niveles)) {
    // la interletra heredada en px cambia la tercera cifra según el tamaño: se compara con 0.004 em de margen
    const base = {}, memo = new Map();
    const firma = c => { if (memo.has(c)) return memo.get(c); const f0 = `${c.letra.px}/${c.letra.lh} ${c.letra.peso}`; const ls = (base[f0] ||= []).find(v => Math.abs(v - c.letra.ls) <= 0.004); if (ls === undefined) base[f0].push(c.letra.ls); const f = `${f0} ${ls ?? c.letra.ls}em`; memo.set(c, f); return f; };
    const fs = [...new Set(casos.map(firma))];
    res.niveles[nivel] = { firmas: fs, casos: casos.map(c => ({ sel: c.sel, txt: c.txt, firma: firma(c), color: c.letra.color, renglones: c.tinta ? c.tinta.renglones.length : 0, ancho: c.tinta ? c.tinta.w : 0, ch: c.tinta ? r1(c.tinta.w / c.letra.ch) : 0, ultimo: c.tinta ? c.tinta.renglones.at(-1) : null, primero: c.tinta ? c.tinta.renglones[0] : null })) };
    if (fs.length > 1) F('T1', 'página', `${nivel}: ${fs.length} estilos (${casos.map(c => `${c.sel} ${firma(c)}`).join(' · ')})`);
    for (const c of casos) {
      if (!c.tinta) continue;
      const n = c.tinta.renglones.length, u = c.tinta.renglones.at(-1);
      if (nivel === 'titular de sección' && c.sel !== '#ftr-title' && n !== 2 && !(n === 3 && k === 0)) F('T2', 'página', `${c.sel} «${c.txt}»: ${n} renglones (la forma única es «Nombre / frase», 2)`);
      if (n >= 2 && u.n === 1 && nivel !== 'titular de sección' && nivel !== 'h1') F('T2', 'página', `${c.sel} «${c.txt}»: último renglón de una sola palabra («${u.txt}»)`);
      if (['entradilla y cuerpo', 'párrafo de lectura', 'texto de pieza'].includes(nivel) && c.tinta.w / c.letra.ch > 78) F('T2', 'página', `${c.sel}: medida de ${r1(c.tinta.w / c.letra.ch)} ch (máx. 78)`);
    }
  }
  for (const id of ids) {
    const at = m.secciones[id].atomos, tarjetas = [];
    for (const sup of at.filter(a => ['pieza-central', 'superficie', 'tarjeta'].includes(a.tipo))) {
      const hijos = at.filter(a => a.sup === sup.id && a.tipo !== 'flecha').sort((a, b) => a.caja.t - b.caja.t);
      if (hijos.length < 2 || tarjetas.some(t => t.sel === sup.sel) || /\.cover\b|button\.card/.test(sup.sel)) continue;
      const izq = a => ((a.tipo === 'texto' || (a.tipo === 'control' && !a.fondo)) && a.tinta ? a.tinta.ml : a.caja.l);
      const renglon = [];   // el primero de cada fila
      for (const h of hijos) { const f = renglon.find(r => Math.min(r.b, h.caja.b) - Math.max(r.t, h.caja.t) > Math.min(r.b - r.t, h.caja.h) * 0.5); if (f) { if (izq(h) < f.x) f.x = izq(h); f.t = Math.min(f.t, h.caja.t); f.b = Math.max(f.b, h.caja.b); } else renglon.push({ t: h.caja.t, b: h.caja.b, x: izq(h), w: h.caja.w }); }
      const sangrias = [...new Set(renglon.filter(r => r.w < sup.caja.w - 2).map(r => r0(r.x - sup.caja.l)))].sort((a, b) => a - b);
      const huecos = []; let ant = null;
      for (const h of hijos) { if (ant && h.caja.t >= ant.caja.b - 1) huecos.push({ de: ant.sel, a: h.sel, v: r1(h.caja.t - ant.caja.b) }); if (!ant || h.caja.b > ant.caja.b) ant = h; }
      const t = { sel: sup.sel, w: sup.caja.w, h: sup.caja.h, radio: sup.radio, sangrias, arriba: r1(hijos[0].caja.t - sup.caja.t), abajo: r1(sup.caja.b - Math.max(...hijos.map(h => h.caja.b))), huecos };
      tarjetas.push(t);
      for (const h of huecos) if (h.v > Math.max(48, t.h * 0.25)) F('C1', id, `${t.sel} (${t.w}×${t.h}): vacío interior de ${h.v} px entre ${h.de} y ${h.a} (${r0(h.v / t.h * 100)} % del alto de la tarjeta)`);
      if (sangrias.length > 1 && sup.tipo !== 'tarjeta' && !/^fieldset/.test(sup.sel)) F('C2', id, `${t.sel}: ${sangrias.length} sangrías interiores distintas (${sangrias.join(', ')} px desde el borde)`);
    }
    res.secciones[id].tarjetas = tarjetas;
    const tams = [...new Set(m.secciones[id].atomos.filter(a => a.letra && !a.decorativo).map(a => a.letra.px))].sort((a, b) => a - b);
    res.secciones[id].tamanos = tams;
    if (tams.length > SISTEMA.tamanosMax) F('T3', id, `${tams.length} tamaños de letra (${tams.join(', ')}); máximo ${SISTEMA.tamanosMax}`);
  }
  return { res, fallos, G, rejillaDe };
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Superposición de guías sobre la captura (solo CSSOM: la CSP no deja estilos en línea).
function pintar({ G, sec, juicio, atomos, aire, W, rotulo, tops, casi, dentro }) {
  const capa = document.createElement('div'); capa.id = '__guias';
  capa.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${document.documentElement.scrollHeight}px;pointer-events:none;z-index:2147483647;font:700 10px/12px ui-monospace,Menlo,Consolas,monospace;text-align:left;letter-spacing:0;`;
  const caja = (css, txt) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;box-sizing:border-box;' + css; if (txt) d.textContent = txt; capa.append(d); return d; };
  const y0 = sec.t, h = sec.h;
  // columnas y márgenes de la rejilla propuesta
  if (G.inicios.length > 1) G.inicios.forEach((x, i) => caja(`left:${x}px;top:${y0}px;width:${G.col}px;height:${h}px;background:rgba(255,0,128,.07);border-left:1px solid rgba(255,0,128,.35);border-right:1px solid rgba(255,0,128,.35);`));
  caja(`left:${G.L - 0.5}px;top:${y0}px;width:1px;height:${h}px;background:#e6007e;`);
  caja(`left:${G.R - 0.5}px;top:${y0}px;width:1px;height:${h}px;background:#e6007e;`);
  caja(`left:${G.C - 0.5}px;top:${y0}px;width:0;height:${h}px;border-left:1px dashed #0a84ff;`);
  if (G.inicios.length > 1) caja(`left:${G.inicios[6] - 1}px;top:${y0}px;width:2px;height:${h}px;background:rgba(230,0,126,.8);`);
  // piezas de primer nivel: verde en la rejilla, rojo fuera, azul lo centrado permitido
  for (const j of juicio) {
    const a = atomos[j.id]; if (a.tipo === 'escenario' || a.tipo === 'rejilla') continue;
    const c = a.tinta && (a.tipo === 'texto' || a.tipo === 'insignia') ? { l: a.tinta.ml, r: a.tinta.mr, t: a.caja.t, b: a.caja.b } : (j.c || a.caja);
    const color = !j.ok ? '#ff2d20' : j.ancla === 'centro' || j.ancla === 'flecha' ? '#0a84ff' : '#12a150';
    caja(`left:${c.l}px;top:${c.t}px;width:${c.r - c.l}px;height:${c.b - c.t}px;border:${j.ok ? 1 : 2}px solid ${color};${j.ok ? '' : 'background:rgba(255,45,32,.10);'}`);
    if (!j.ok) caja(`left:${Math.max(2, Math.min(c.l, W - 190))}px;top:${c.t - 13}px;padding:0 3px;background:#ff2d20;color:#fff;white-space:nowrap;`, j.ancla === 'centro' ? `eje ${Math.round((c.l + c.r) / 2)} · centrado` : `x ${Math.round(c.l)}–${Math.round(c.r)}`);
  }
  // huecos entre piezas con su valor
  const usados = [];
  for (const g of aire) {
    if (g.y1 - g.y0 < -200) continue;
    let x = g.x; while (usados.some(u => Math.abs(u.x - x) < 44 && !(g.y1 < u.y0 - 6 || g.y0 > u.y1 + 6))) x += 46;
    usados.push({ x, y0: Math.min(g.y0, g.y1), y1: Math.max(g.y0, g.y1) });
    const color = g.mal ? '#ff2d20' : '#111';
    const top = Math.min(g.y0, g.y1), alto = Math.abs(g.y1 - g.y0);
    caja(`left:${x}px;top:${top}px;width:9px;height:${Math.max(alto, 1)}px;border-top:1px solid ${color};border-bottom:1px solid ${color};`);
    caja(`left:${x + 4}px;top:${top}px;width:1px;height:${Math.max(alto, 1)}px;background:${color};`);
    caja(`left:${x + 11}px;top:${top + alto / 2 - 6}px;padding:0 3px;background:${g.mal ? '#ff2d20' : '#ffd60a'};color:${g.mal ? '#fff' : '#111'};white-space:nowrap;border-radius:2px;`, String(g.v));
  }
  const horizontal = (y, x0, x1, color) => caja(`left:${x0}px;top:${y - 0.5}px;width:${x1 - x0}px;height:0;border-top:1px dashed ${color};`);
  if (tops && Math.abs(tops.d) > 1) {
    horizontal(tops.izq, G.L, G.R, '#ff9500'); horizontal(tops.der, G.L, G.R, '#ff9500');
    caja(`left:${G.C + 6}px;top:${Math.min(tops.izq, tops.der) + Math.abs(tops.d) / 2 - 7}px;padding:1px 4px;background:#ff9500;color:#111;white-space:nowrap;border-radius:2px;`, `topes de columna Δ ${Math.abs(tops.d)}`);
  }
  for (const c of casi || []) {
    horizontal(c.ya, G.L, G.R, '#ff9500'); horizontal(c.yb, G.L, G.R, '#ff9500');
    caja(`left:${G.C + 6}px;top:${Math.max(c.ya, c.yb) + 2}px;padding:1px 4px;background:#ff9500;color:#111;white-space:nowrap;border-radius:2px;`, `${c.borde} Δ ${Math.abs(c.d)}`);
  }
  caja(`left:${Math.max(2, G.L)}px;top:${y0 + 2}px;padding:1px 4px;background:#111;color:#fff;white-space:nowrap;`, rotulo);
  if (dentro) {   // una hoja vive en la capa superior: la superposición va dentro de ella, corregida a coordenadas de página
    const d = document.querySelector(dentro); d.append(capa);
    capa.style.position = 'fixed'; capa.style.height = innerHeight + 'px';
    const r = capa.getBoundingClientRect(); capa.style.left = -r.left - scrollX + 'px'; capa.style.top = -r.top - scrollY + 'px';
  } else document.body.append(capa);
}

// ---------------------------------------------------------------------------------------------------------------------------------------
const navegadores = {};
async function navegador(toque) {
  const kk = toque ? 't' : 'f';
  navegadores[kk] ||= await pw.chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--hide-scrollbars',
    toque ? '--blink-settings=primaryHoverType=1,availableHoverTypes=1,primaryPointerType=2,availablePointerTypes=2' : '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4'] });
  return navegadores[kk];
}
async function cargar(page, toque) {
  // Parche de prueba: se añade al final de las hojas del sitio mientras viajan (así vale desde el primer render y con la CSP de producción)
  // y el script corre al terminar de leerse el documento. Nada de esto toca los archivos del sitio.
  if (opt.css) {
    const parche = readFileSync(String(opt.css), 'utf8');
    await page.route(/\/(style|mobile)\.css(\?.*)?$/, async route => { const r = await route.fetch(); await route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: (await r.text()) + '\n' + parche }); });
  }
  if (opt.js) await page.addInitScript(`document.addEventListener('DOMContentLoaded', () => { ${readFileSync(String(opt.js), 'utf8')} });`);
  await page.goto(URL_, { waitUntil: 'networkidle' });
  // Un iPhone no reserva canal para la barra de desplazamiento; Chromium emulado sí lo hace tras una captura más allá de la ventana
  // (scrollbar-gutter: stable) y la página pasa de 393 a 378 px. Se fija sin barra, que es lo que pinta el aparato.
  if (toque) await page.evaluate(() => { document.documentElement.style.scrollbarWidth = 'none'; });
  await page.evaluate(() => document.fonts.ready);
  const alto = await page.evaluate(() => innerHeight);
  for (let pasada = 0; pasada < 2; pasada++) {
    let y = 0;
    for (;;) {
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      if (y >= total - alto) break;
      y = Math.min(y + Math.round(alto * 0.6), total - alto);
      await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(160);
    }
    await page.waitForTimeout(300);
  }
  await page.waitForFunction(() => !document.querySelector('main [aria-busy="true"]'), null, { timeout: 8000 }).catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
  if (opt.js) { await page.evaluate(readFileSync(String(opt.js), 'utf8')); await page.waitForTimeout(600); }
  // content-visibility: auto deja sin maquetar lo que está lejos de la ventana; se pinta todo, que es lo que la persona ve al llegar.
  await page.evaluate(() => { for (const e of document.querySelectorAll('*')) { const cv = getComputedStyle(e).contentVisibility; if (cv && cv !== 'visible') e.style.contentVisibility = 'visible'; } document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); });
  await page.waitForTimeout(900);
}

const todo = { url: URL_, fecha: new Date().toISOString(), sistema: SISTEMA, perfiles: {} };
const fallosTodos = [];
const lineas = [];
const P = (...a) => { const s = a.join(' '); lineas.push(s); console.log(s); };

for (const clave of claves) {
  const [nombre, w, h, dpr, toque] = PERFILES[clave];
  const nuevoCtx = async () => (await navegador(toque)).newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: toque, hasTouch: toque, userAgent: toque && w < 760 ? UA_IPHONE : undefined,
    locale: 'es-MX', timezoneId: 'America/Monterrey', colorScheme: opt.oscuro ? 'dark' : 'light' });
  let ctx = await nuevoCtx();
  let page = await ctx.newPage();
  await cargar(page, toque);
  const m = await page.evaluate(enPagina, { modo: 'pagina', secciones: SECCIONES, niveles: NIVELES, centrables: SISTEMA.centrables, asociados: SISTEMA.asociados, tarjetasConPrimaria: SISTEMA.tarjetasConPrimaria });
  const { res, fallos, G, rejillaDe } = analizar(clave, m);

  // barras: en el tope y con cada sección bajo la cabecera
  const barras = [];
  for (const sel of [null, '#casa', '#libros', '#cartelera', '#cafe', '#visita']) {
    if (sel) await page.evaluate(s => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + 40); }, sel); else await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(700);
    barras.push({ en: sel || 'tope', ...(await page.evaluate(enPagina, { modo: 'barras', centrables: SISTEMA.centrables })) });
  }
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
  res.barras = barras;
  const F = (regla, detalle) => fallos.push({ perfil: clave, regla, seccion: 'barras', detalle });
  const b0 = barras[0], tol = SISTEMA.tolerancia;
  if (b0.logo && Math.abs(b0.logo.l - G.L) > tol) F('N1', `la marca empieza en x ${b0.logo.l}; el margen está en ${r1(G.L)}`);
  const fin = [b0.menu, b0.lista, b0.cta].filter(Boolean).sort((a, b) => b.r - a.r)[0];
  if (fin && fin !== b0.lista && Math.abs(fin.r - G.R) > tol) F('N1', `el último control de la cabecera termina en x ${fin.r}; el borde del contenido está en ${r1(G.R)}`);
  if (b0.lista && b0.lista.tr !== null && fin === b0.lista && Math.abs(G.R - b0.lista.tr) > 2) F('N1', `la tinta de «Mi lista» termina en x ${b0.lista.tr}: ${r1(G.R - b0.lista.tr)} px antes del borde del contenido (${r1(G.R)}), donde sí terminan las fotos y las listas`);
  if (b0.navCaja && Math.abs((b0.navCaja.l + b0.navCaja.r) / 2 - G.C) > tol) F('N1', `las secciones de la barra están centradas en x ${r1((b0.navCaja.l + b0.navCaja.r) / 2)}; el eje de la página es ${r1(G.C)}`);
  for (const b of barras.slice(1)) {
    for (const kx of ['logo', 'lista', 'menu']) if (b0[kx] && b[kx] && (Math.abs(b0[kx].l - b[kx].l) > 0.5 || Math.abs(b0[kx].t - b[kx].t) > 0.5)) F('N2', `${kx} se mueve al llegar a ${b.en}: x ${b0[kx].l} → ${b[kx].l}, y ${b0[kx].t} → ${b[kx].t}`);
    b.nav.forEach((n, i) => { if (b0.nav[i] && Math.abs(b0.nav[i].l - n.l) > 0.5) F('N2', `«${n.txt}» de la barra se mueve al llegar a ${b.en}: x ${b0.nav[i].l} → ${n.l}`); });
  }
  if (b0.tabbar && Math.abs((b0.tabbar.l + b0.tabbar.r) / 2 - G.C) > 0.5) F('N3', `la barra inferior está centrada en x ${r1((b0.tabbar.l + b0.tabbar.r) / 2)}; el eje es ${r1(G.C)}`);

  // capturas con superposición
  if (CAPTURAS === 'todas' || (CAPTURAS === 'ref' && REF.includes(clave))) {
    const cdp = await ctx.newCDPSession(page);
    for (const sc of SECCIONES) {
      const s = res.secciones[sc.id]; if (!s) continue;
      const ms = m.secciones[sc.id];
      const e = s.ejes;
      await page.evaluate(pintar, { G: rejillaDe(sc.id), sec: s.caja, juicio: s.juicio, atomos: ms.atomos, aire: res.aire.filter(g => g.seccion === sc.id), W: m.W, tops: s.tops, casi: s.casi,
        rotulo: `${sc.id} · ${clave} · ejes izq ${e.izq.join(' ')} · centro ${e.centro.join(' ')} · der ${e.der.join(' ')} · fuera de rejilla ${s.fuera}` });
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: Math.max(0, s.caja.t - 16), width: m.W, height: s.caja.h + 32, scale: w < 760 ? 2 : 1 } });
      writeFileSync(join(DIR, `guias-${sc.id}-${clave}.png`), Buffer.from(shot.data, 'base64'));
      await page.evaluate(() => document.getElementById('__guias')?.remove());
    }
  }
  // hojas (menú ☰, ficha, Mi lista, Explorar): un margen, un eje. En un contexto nuevo: la captura más allá de la ventana deja reservado el
  // canal de la barra de desplazamiento en el teléfono emulado, y abrir la ficha mueve el carrusel y el recorrido.
  await ctx.close();
  ctx = await nuevoCtx(); page = await ctx.newPage(); await cargar(page, toque);
  res.hojas = {};
  const conCaptura = CAPTURAS === 'todas' || (CAPTURAS === 'ref' && REF.includes(clave));
  async function hoja(nombreHoja, raizSel, panelSel, abre) {
    try {
      if (!(await abre())) return;
      await page.waitForSelector(`${raizSel}[open]`, { timeout: 4000 });
      await page.waitForTimeout(1100);
      const mh = await page.evaluate(enPagina, { modo: 'raiz', sel: raizSel, piezas: [], centrables: SISTEMA.centrables });
      const panel = await page.evaluate(([r, ps]) => { const e = document.querySelector(ps) || document.querySelector(r); const b = e.getBoundingClientRect(); return { l: b.left + scrollX, r: b.right + scrollX, t: b.top + scrollY, b: b.bottom + scrollY, w: b.width, h: b.height }; }, [raizSel, panelSel]);
      // primer nivel: lo que no cuelga de una tarjeta (el propio panel no cuenta como tarjeta)
      const idPanel = (mh.atomos.filter(a => a.tipo === 'superficie' && a.caja.w >= panel.w - 2).sort((a, b) => b.caja.h - a.caja.h)[0] || {}).id;
      for (const a of mh.atomos) if (a.sup === idPanel && idPanel !== undefined) a.sup = null;
      const nivel = mh.atomos.filter(a => a.sup === null && a.id !== idPanel && a.caja.t >= panel.t - 1 && a.caja.b <= panel.b + 1 && !/close|cerrar|grabber|asa/.test(a.sel));
      for (const a of mh.atomos) if (!nivel.includes(a)) a.sup = a.sup ?? -1;
      const izqs = {};
      for (const a of nivel) { const x = r0(a.tipo !== 'control' && a.tinta ? a.tinta.ml : a.tipo === 'control' && !a.fondo && a.tinta ? a.tinta.ml : a.caja.l); izqs[x] = (izqs[x] || 0) + 1; }
      const L = +Object.entries(izqs).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
      const Gh = { L, R: panel.l + panel.r - L, C: (panel.l + panel.r) / 2, inicios: [L], finales: [panel.l + panel.r - L], col: panel.w - 2 * (L - panel.l) };
      const fh = [];
      const { ejes, juicio } = juzgar(mh.atomos, Gh, k0, nombreHoja, (regla, sec, det) => fh.push({ perfil: clave, regla: 'H' + regla.slice(1), seccion: sec, detalle: det }));
      const botonesH = mh.atomos.filter(a => a.tipo === 'control' && a.caja.h >= 40).map(a => ({ sel: a.sel, txt: a.txt, l: a.caja.l, r: a.caja.r, w: a.caja.w, h: a.caja.h, px: a.letra?.px }));
      res.hojas[nombreHoja] = { panel, margen: r1(L - panel.l), ejes: Object.fromEntries(Object.entries(ejes).map(([n, mp]) => [n, [...mp.keys()].sort((a, b) => a - b)])), fuera: juicio.filter(j => !j.ok).length, botones: botonesH,
        tamanos: [...new Set(mh.atomos.filter(a => a.letra && a.tinta).map(a => a.letra.px))].sort((a, b) => a - b), textos: mh.atomos.filter(a => a.tipo === 'texto' && a.tinta).map(a => ({ sel: a.sel, txt: a.txt, px: a.letra.px, lh: a.letra.lh, peso: a.letra.peso, alinea: a.letra.alinea, l: a.tinta.ml, r: a.tinta.mr, t: a.caja.t, b: a.caja.b, sup: a.sup })) };
      const mg = r1(L - panel.l);
      if (mg > 34) fallos.push({ perfil: clave, regla: 'H1', seccion: nombreHoja, detalle: `margen interior de ${mg} px en una hoja de ${r1(panel.w)} px (quedan ${r1(panel.w - 2 * mg)} px para el contenido); objetivo 16 / 20 / 32` });
      for (const b of botonesH) if (b.w < 44 || (b.px >= 17 && b.txt && b.h > 58)) fallos.push({ perfil: clave, regla: 'H2', seccion: nombreHoja, detalle: `${b.sel} «${b.txt.slice(0, 28)}» mide ${b.w}×${b.h}: rótulo partido o botón aplastado` });
      res.hojas[nombreHoja].observaciones = fh.map(f => f.detalle);   // informativo: cada hoja tiene su retícula interior (portada + título, tabla de datos)
      // H3: un eje de tinta y uno de cajas. De cada renglón cuenta su primera pieza: por su tinta si es texto o un control sin fondo, por su
      // caja si lleva fondo. Lo que cuelga de una rejilla de tarjetas o de un carrusel no cuenta.
      if (SISTEMA.hojasUnEje.includes(nombreHoja)) {
        const renglones = [];
        for (const a of [...nivel].sort((x, y) => x.caja.t - y.caja.t)) {
          if (['escenario', 'flecha', 'pieza-central', 'rejilla'].includes(a.tipo) || a.escenario || a.caja.w < 2) continue;
          const deTinta = (a.tipo === 'texto' || a.tipo === 'insignia' || (a.tipo === 'control' && !a.fondo)) && !!a.tinta;
          if ((a.tipo === 'texto' || a.tipo === 'insignia') && a.letra && a.letra.alinea !== 'left') continue;
          const x = deTinta ? a.tinta.ml : a.caja.l;
          const f = renglones.find(r => Math.min(r.b, a.caja.b) - Math.max(r.t, a.caja.t) > Math.min(r.b - r.t, a.caja.h) * 0.5);
          if (f) { if (x < f.x) { f.x = x; f.deTinta = deTinta; f.sel = a.sel; f.txt = a.txt; } f.t = Math.min(f.t, a.caja.t); f.b = Math.max(f.b, a.caja.b); }
          else renglones.push({ t: a.caja.t, b: a.caja.b, x, deTinta, sel: a.sel, txt: a.txt });
        }
        const ejesDe = t => { const o = []; for (const r of renglones.filter(r => r.deTinta === t).sort((a, b) => a.x - b.x)) { const u = o[o.length - 1]; if (u && r.x - u.x <= 1.5) u.n++; else o.push({ x: r1(r.x), n: 1, sel: r.sel, txt: (r.txt || '').slice(0, 24) }); } return o; };
        const eT = ejesDe(true), eC = ejesDe(false);
        res.hojas[nombreHoja].ejeTinta = eT.map(e => e.x - r1(panel.l)); res.hojas[nombreHoja].ejeCajas = eC.map(e => e.x - r1(panel.l));
        if (eT.length > 1) fallos.push({ perfil: clave, regla: 'H3', seccion: nombreHoja, detalle: `${eT.length} ejes de tinta (${eT.map(e => `x ${r1(e.x - panel.l)}: ${e.n} × ${e.sel} «${e.txt}»`).join(' · ')}); la hoja lleva uno` });
        if (eC.length > 1) fallos.push({ perfil: clave, regla: 'H3', seccion: nombreHoja, detalle: `${eC.length} bordes de caja (${eC.map(e => `x ${r1(e.x - panel.l)}: ${e.n} × ${e.sel} «${e.txt}»`).join(' · ')}); las cajas con fondo comparten uno` });
      }
      if (conCaptura) {
        const e = res.hojas[nombreHoja].ejes;
        await page.evaluate(pintar, { G: Gh, sec: { t: panel.t, h: panel.h }, juicio, atomos: mh.atomos, aire: [], W: m.W, dentro: raizSel,
          rotulo: `${nombreHoja} · ${clave} · margen ${r1(L - panel.l)} · ejes izq ${e.izq.join(' ')} · centro ${e.centro.join(' ')} · der ${e.der.join(' ')} · fuera ${juicio.filter(j => !j.ok).length}` });
        await page.screenshot({ path: join(DIR, `guias-hoja-${nombreHoja}-${clave}.png`) });
        await page.evaluate(() => document.getElementById('__guias')?.remove());
      }
    } catch (err) { res.hojas[nombreHoja] = { error: String(err.message || err).split('\n')[0] }; }
    await page.keyboard.press('Escape'); await page.waitForTimeout(700);
    if (await page.evaluate(r => !!document.querySelector(`${r}[open]`), raizSel)) { await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
  }
  const k0 = clase(m.iw);
  const pulsa = async sel => { const l = page.locator(sel).first(); if (!(await l.count()) || !(await l.isVisible())) return false; await l.click({ timeout: 4000 }); return true; };
  await hoja('menu', '#menu', '.menu-hoja', () => pulsa('.menu-btn'));
  await page.evaluate(() => { const e = document.querySelector('#colecciones'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 120); }); await page.waitForTimeout(700);
  await hoja('ficha', '#cat-drawer', '#cat-drawer', async () => { const ok = await pulsa('.c3d--portada .is-centro .card'); if (ok) { await page.waitForSelector('#cat-drawer[open]', { timeout: 4000 }); await page.waitForTimeout(600); await pulsa('#cat-drawer [data-d-save]'); await page.waitForTimeout(2600); } return ok; });
  await hoja('milista', '#mylist', '#mylist', () => pulsa(k0 === 0 ? '.tabbar [data-open-mylist]' : '.hdr [data-open-mylist]'));
  if (k0 === 0) await hoja('explorar', '#explorer', '#explorer', () => pulsa('.explore-open'));
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(400);

  todo.perfiles[clave] = { nombre, medida: m, analisis: res, fallos };
  fallosTodos.push(...fallos);
  await ctx.close();

  // ---- tablas
  P(`\n================ ${nombre} · margen ${m.margen} · contenedor ${res.rejilla.L}–${res.rejilla.R} · eje ${res.rejilla.C}${res.rejilla.inicios.length > 1 ? ` · columna ${res.rejilla.col} + canal ${SISTEMA.canal} · col. 7 en x ${res.rejilla.inicios[6]}` : ''} ================`);
  P('GUÍAS por sección (ejes de las piezas de primer nivel)');
  for (const [id, r] of Object.entries(res.rejillas || {})) P(`  ${id}: contenedor propio ${r.L}–${r.R} (${r.ancho} px; norma ${r.objetivo}) · columna ${r.col} · desfase con la página ${r.desfase} px · columnas ${r.inicios.join(' ')}${r.colDer !== undefined ? ` · col. derecha x ${r.colDer}` : ''}`);
  for (const id of Object.keys(res.secciones)) { const s = res.secciones[id]; P(`  ${id.padEnd(9)} izq [${s.ejes.izq.join(', ')}]  centro [${s.ejes.centro.join(', ')}]  der [${s.ejes.der.join(', ')}]  · ejes ${s.ejes.izq.length + s.ejes.centro.length + s.ejes.der.length} · fuera de rejilla ${s.fuera}${s.colDer !== null ? ` · col. derecha x ${s.colDer}` : ''}${s.tops ? ` · tope izq/der Δ ${s.tops.d}` : ''} · tamaños ${s.tamanos.join('/')}`); }
  P('RITMO por rol (valores encontrados → objetivo)');
  for (const [rol, d] of Object.entries(res.porRol)) P(`  ${rol.padEnd(26)} ${d.mal ? '✗' : '✓'} [${d.valores.join(', ')}] → ${d.objetivo ?? '—'}   ${d.casos.map(c => `${c.seccion}:${c.par.replace('→', '>')}=${c.v}`).join('  ')}`);
  P('TARJETAS (relleno interior, sangrías y huecos)');
  for (const id of Object.keys(res.secciones)) for (const t of res.secciones[id].tarjetas) P(`  ${id.padEnd(9)} ${t.sel.padEnd(40)} ${t.w}×${t.h} radio ${t.radio} · sangrías [${t.sangrias.join(', ')}] · arriba ${t.arriba} · abajo ${t.abajo} · huecos ${t.huecos.map(h => h.v).join(', ')}`);
  P('BOTONES por jerarquía');
  for (const [g, d] of Object.entries(res.botones)) P(`  ${g.padEnd(18)} n ${String(d.n).padStart(2)} · altos ${d.altos.join('/')} · relleno ${d.rellenos.join(' · ')} · rótulo ${d.letras.join(' · ')} · icono ${d.iconos.join('/') || '—'}`);
  for (const b of (res.botones.primario || { casos: [] }).casos) P(`     primario ${b.zona.padEnd(16)} «${b.txt}» ${b.ancho}×${b.alto} x ${b.l}–${b.r} ${b.completo ? 'completo' : 'al texto'}`);
  P('   aire texto → primaria: ' + res.airePrimario.map(a => `${a.seccion} ${a.v}`).join(' · '));
  if (res.asociados.length) P('DATOS ASOCIADOS  ' + res.asociados.map(a => `${a.dato} ${a.modo} de ${a.de}: ${a.hueco} px${a.dx !== null ? `, eje Δ ${a.dx}` : ''} ${a.ok ? '✓' : '✗'}`).join(' · '));
  P('TÍTULOS por nivel');
  for (const [n, d] of Object.entries(res.niveles)) { P(`  ${n.padEnd(20)} ${d.firmas.length > 1 ? '✗' : '✓'} ${d.firmas.join(' | ')}`); for (const c of d.casos) P(`     ${c.sel.padEnd(42)} ${c.firma.padEnd(22)} ${c.renglones} r · ${c.ancho} px · ${c.ch} ch · último «${c.ultimo ? c.ultimo.txt : ''}»`); }
  P('BARRAS');
  for (const b of barras) P(`  ${b.en.padEnd(10)} marca x ${b.logo?.l ?? '—'} · nav ${b.nav.map(n => `${n.txt}${n.actual ? '*' : ''} ${n.l}`).join(' ') || '—'} · cta ${b.cta ? `${b.cta.l}–${b.cta.r}` : 'oculta'} · lista ${b.lista ? `${b.lista.l}–${b.lista.r} (tinta hasta ${b.lista.tr})` : '—'} · ☰ ${b.menu ? `${b.menu.l}–${b.menu.r}` : '—'}${b.tabbar ? ` · barra inferior ${b.tabbar.l}–${b.tabbar.r} (${b.tabbar.w}×${b.tabbar.h})` : ''}`);
  P('HOJAS');
  for (const [n, h] of Object.entries(res.hojas)) { if (h.error) { P(`  ${n}: no se pudo abrir (${h.error})`); continue; } P(`  ${n.padEnd(9)} panel ${r1(h.panel.l)}–${r1(h.panel.r)} × ${r1(h.panel.t)}–${r1(h.panel.b)} · margen ${h.margen} · izq [${h.ejes.izq.join(', ')}] centro [${h.ejes.centro.join(', ')}] der [${h.ejes.der.join(', ')}] · fuera ${h.fuera} · tamaños ${h.tamanos.join('/')}${h.ejeTinta ? ` · eje de tinta [${h.ejeTinta.join(', ')}] · cajas [${h.ejeCajas.join(', ')}]` : ''}`); for (const b of h.botones) P(`     ${b.sel.padEnd(46)} «${(b.txt || '').slice(0, 26)}» x ${b.l}–${b.r} · ${b.w}×${b.h} · ${b.px ?? ''}`); }
  const cuenta = {}; for (const f of fallos) cuenta[f.regla[0]] = (cuenta[f.regla[0]] || 0) + 1;
  P(`FALLOS ${fallos.length}: ` + Object.entries(cuenta).map(([kk, v]) => `${kk} ${v}`).join(' · '));
  for (const f of fallos) P(`  ✗ ${f.regla} ${f.seccion}: ${f.detalle}`);
}
for (const b of Object.values(navegadores)) await b.close();

const resumen = {};
for (const f of fallosTodos) { resumen[f.perfil] ||= { G: 0, R: 0, B: 0, T: 0, C: 0, N: 0, H: 0, E: 0, total: 0 }; resumen[f.perfil][f.regla[0]]++; resumen[f.perfil].total++; }
P('\n================ RECUENTO ================');
P('perfil'.padEnd(16) + ['G guías', 'R ritmo', 'B botones', 'T títulos', 'C tarjetas', 'N barras', 'H hojas', 'E estado', 'total'].map(s => s.padStart(11)).join(''));
for (const [p, r] of Object.entries(resumen)) P(p.padEnd(16) + [r.G, r.R, r.B, r.T, r.C, r.N, r.H, r.E, r.total].map(v => String(v).padStart(11)).join(''));
P('TOTAL'.padEnd(16) + ['G', 'R', 'B', 'T', 'C', 'N', 'H', 'E'].map(kk => String(fallosTodos.filter(f => f.regla[0] === kk).length).padStart(11)).join('') + String(fallosTodos.length).padStart(11));
todo.resumen = resumen; todo.total = fallosTodos.length;
writeFileSync(join(DIR, 'guias.json'), JSON.stringify(todo, null, 1));
writeFileSync(join(DIR, 'guias.txt'), lineas.join('\n') + '\n');
process.exit(fallosTodos.length ? 1 : 0);

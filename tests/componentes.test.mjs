// Catálogo de componentes (design/componentes.json, aprobado por Aldo el 2026-11-14; formato inspirado en registry-item.json de shadcn/ui, MIT):
// integridad (todo lo que nombra existe), estados declarados presentes en el CSS/JS con su condición, reglas globales de estado y contraste
// de los pares fondo↔texto de los controles en claro y oscuro, calculado desde design/tokens.json.
import { strict as assert } from 'node:assert';
const strict = assert;
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { renderSite } from '../scripts/build-tokens.mjs';
import { renderMd, pairRatio, MINIMO, COLUMNAS } from '../scripts/build-componentes.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const catalog = JSON.parse(read('design/componentes.json'));
const tokens = JSON.parse(read('design/tokens.json'));
const colors = tokens.themes.liquido.color;
const C = catalog.componentes;

// ---------- Lectura del CSS: reglas con su cadena de at-rules (@media, @supports…) ----------
function splitTop(sel) {
  const out = []; let depth = 0, quote = '', cur = '';
  for (const ch of sel) {
    if (quote) { cur += ch; if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}
function parseCss(src, file) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = []; const stack = []; let buf = '';
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      const pre = buf.replace(/\s+/g, ' ').trim(); buf = '';
      if (pre.startsWith('@')) { stack.push(pre); continue; }
      const end = src.indexOf('}', i);
      rules.push({ file, selector: pre, items: splitTop(pre), body: src.slice(i + 1, end).trim(), at: [...stack] });
      i = end;
    } else if (ch === '}') { stack.pop(); buf = ''; }
    else if (ch === ';' && buf.trim().startsWith('@')) buf = '';
    else buf += ch;
  }
  return rules;
}
const CSS_FILES = ['style.css', 'mobile.css'];
const RULES = CSS_FILES.flatMap(f => parseCss(read(f), f));
const norm = s => s.replace(/\s+/g, ' ').trim();
const rulesWith = item => RULES.filter(r => r.items.includes(norm(item)));
const inAt = (r, re) => r.at.some(a => re.test(a));

// ---------- Lectura del HTML: etiquetas de apertura con sus atributos ----------
const html = read('index.html');
const ELEMENTS = [...html.matchAll(/<([a-zA-Z][\w-]*)((?:\s+[^\s=<>"'/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<>]+))?)*)\s*\/?>/g)].map(m => {
  const attrs = {};
  for (const a of m[2].matchAll(/([^\s=<>"'/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>]+)))?/g)) attrs[a[1]] = a[2] ?? a[3] ?? a[4] ?? '';
  return { tag: m[1].toLowerCase(), attrs };
});
function htmlHas(selector) {
  const m = /^([a-z][\w-]*)?((?:#[\w-]+|\.[\w-]+|\[[\w-]+(?:="[^"]*")?\])*)$/.exec(selector);
  assert.ok(m, `selector de HTML simple: ${selector}`);
  const parts = [...m[2].matchAll(/#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]/g)];
  return ELEMENTS.some(el => (!m[1] || el.tag === m[1]) && parts.every(([, id, cls, attr, val]) => {
    if (id) return el.attrs.id === id;
    if (cls) return (el.attrs.class ?? '').split(/\s+/).includes(cls);
    if (!(attr in el.attrs)) return false;
    return val === undefined || el.attrs[attr] === val;
  }));
}

// ---------- Tokens: los nombres que genera build-tokens.mjs desde design/tokens.json ----------
const TOKEN_NAMES = new Set([...renderSite(tokens).matchAll(/--([a-z0-9-]+):/g)].map(m => m[1]));
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isExported = (src, name) => new RegExp(`export\\s+(?:async\\s+)?(?:function\\*?\\s+${esc(name)}\\b|const\\s+${esc(name)}\\b|let\\s+${esc(name)}\\b|class\\s+${esc(name)}\\b)`).test(src)
  || [...src.matchAll(/export\s*\{([^}]*)\}/g)].some(m => m[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop()).includes(name));
const isDeclared = (src, name) => new RegExp(`(?:function\\*?\\s+${esc(name)}\\s*\\(|(?:const|let)\\s+${esc(name)}\\s*=)`).test(src);
const usesToken = (src, tok) => src.includes(`--${tok}`) || src.includes(`'${tok}'`) || (tok.startsWith('dur-') && src.includes(`DUR('${tok.slice(4)}')`));

const HOY = '2026-11-14';
const SITE_FILES = ['index.html', ...CSS_FILES];

test('catálogo de componentes: forma y campos (nombre, descripcion, archivos, tokens, estados, aria, qa, desde)', () => {
  assert.ok(C.length >= 20, `al menos 20 componentes (hay ${C.length})`);
  const ids = C.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length, 'ids sin repetir');
  assert.equal(new Set(C.map(c => c.nombre)).size, C.length, 'nombres sin repetir');
  for (const c of C) {
    assert.ok(/^[a-z0-9-]+$/.test(c.id), `${c.id}: id en minúsculas con guiones`);
    assert.ok(['control', 'bloque'].includes(c.tipo), `${c.id}: tipo control o bloque`);
    assert.ok(c.descripcion?.length >= 40, `${c.id}: descripción`);
    assert.ok(c.archivos?.length, `${c.id}: archivos`);
    assert.ok(c.tokens?.length, `${c.id}: tokens`);
    assert.ok(c.estados && Object.keys(c.estados).length, `${c.id}: estados`);
    assert.ok(c.aria?.patron && c.aria?.teclado && c.aria?.atributos?.length && /^https:\/\//.test(c.aria.apg), `${c.id}: patrón ARIA, atributos, teclado y referencia`);
    assert.ok(c.qa?.length, `${c.id}: herramienta de QA`);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(c.desde) && !Number.isNaN(Date.parse(c.desde)) && c.desde <= HOY, `${c.id}: desde es una fecha real no futura (${c.desde})`);
    assert.ok(c.decision, `${c.id}: dónde está la decisión`);
    if (c.variante_de) assert.ok(ids.includes(c.variante_de), `${c.id}: variante de un componente del catálogo`);
    for (const k of Object.keys(c.no_aplica ?? {})) assert.ok(!c.estados[k], `${c.id}: «${k}» no puede estar declarado y a la vez no aplicar`);
  }
  // Los componentes que pidió Aldo (2026-11-14) están todos.
  for (const n of ['Boton', 'Chip', 'BarraNavegacion', 'MenuHamburguesa', 'BarraInferior', 'Carrusel3D', 'CarruselPortadas', 'CarruselEventos', 'CarruselCarta', 'TarjetaLibro', 'FichaLibro', 'MiLista', 'Explorar', 'CampoBusqueda', 'Aviso', 'EncabezadoSeccion', 'Recorrido', 'MapaLlegada', 'InterruptorMovimiento', 'ContactoPie', 'Esqueletos', 'CarruselNovedades']) {
    assert.ok(C.some(c => c.nombre === n), `catalogado: ${n}`);
  }
});

test('integridad del catálogo: cada archivo, selector, función, gancho, token y herramienta nombrados existen', () => {
  const fallos = [];
  const assert = { ok: (v, m) => { if (!v) fallos.push(m); }, fail: m => fallos.push(m) };
  let n = { archivos: 0, selectores: 0, funciones: 0, ganchos: 0, tokens: 0, qa: 0 };
  for (const c of C) {
    const srcs = [];
    for (const a of c.archivos) {
      assert.ok(existsSync(join(root, a.ruta)), `${c.id}: existe ${a.ruta}`); n.archivos++;
      assert.ok(!a.ruta.startsWith('_archive/'), `${c.id}: nada de _archive/`);
      const src = read(a.ruta); srcs.push(src);
      for (const s of a.selectores ?? []) {
        n.selectores++;
        if (a.ruta.endsWith('.css')) assert.ok(parseCss(src, a.ruta).some(r => r.items.includes(norm(s)) || r.items.some(i => new RegExp(`(^|[\\s>+~(,])${esc(s)}(?![\\w-])`).test(i))), `${c.id}: ${a.ruta} tiene una regla con ${s}`);
        else if (a.ruta.endsWith('.html')) assert.ok(htmlHas(s), `${c.id}: ${a.ruta} tiene un elemento ${s}`);
        else assert.fail(`${c.id}: selectores solo en CSS o HTML (${a.ruta})`);
      }
      for (const f of a.exporta ?? []) { n.funciones++; assert.ok(isExported(src, f), `${c.id}: ${a.ruta} exporta ${f}`); }
      for (const f of a.internas ?? []) { n.funciones++; assert.ok(isDeclared(src, f), `${c.id}: ${a.ruta} declara ${f}`); }
      for (const g of a.ganchos ?? []) { n.ganchos++; assert.ok(src.includes(g), `${c.id}: ${a.ruta} contiene «${g}»`); }
    }
    for (const v of c.variantes ?? []) assert.ok(RULES.some(r => r.items.some(i => new RegExp(`${esc(v.selector)}(?![\\w-])`).test(i))), `${c.id}: la variante ${v.selector} tiene regla en el CSS`);
    for (const t of c.tokens) {
      n.tokens++;
      assert.ok(TOKEN_NAMES.has(t), `${c.id}: el token ${t} existe en design/tokens.json`);
      assert.ok(srcs.some(s => usesToken(s, t)), `${c.id}: alguno de sus archivos usa el token ${t}`);
    }
    for (const q of c.qa) {
      n.qa++;
      assert.ok(/^(tools\/qa\/[\w-]+\.mjs|tests\/[\w-]+\.test\.mjs)$/.test(q) && existsSync(join(root, q)), `${c.id}: existe la herramienta ${q}`);
    }
  }
  assert.ok(n.selectores > 200 && n.funciones > 120 && n.tokens > 300, `comprobados: ${JSON.stringify(n)}`);
  strict.deepEqual(fallos, [], `integridad (${JSON.stringify(n)})`);
});

// Condición de cada estado: lo que el selector o su regla deben cumplir.
const CONDICION = {
  hover: (item, r) => /:hover/.test(item) && inAt(r, /\(hover:\s*hover\)/),
  foco: (item, r) => /:focus-visible/.test(item) && /anillo-foco|--foco|outline/.test(r.body),
  presionado: item => /:active|\[data-opening\]/.test(item),
  deshabilitado: item => /:disabled|aria-disabled/.test(item),
  seleccionado: item => /aria-(checked|pressed|selected)|:checked|is-hojeada/.test(item),
  actual: item => /aria-current|is-centro/.test(item),
  expandido: item => /aria-expanded|is-open/.test(item),
  ocupado: item => /aria-busy|card--sk|sk-/.test(item),
  movimiento_reducido: (item, r) => item.startsWith('.motion ') || inAt(r, /prefers-reduced-motion:\s*reduce/),
  tactil: (item, r) => inAt(r, /\(hover:\s*none\)/),
};

test('tabla de estados: cada estado declarado existe en el CSS, el HTML o el JS, con su condición', () => {
  const fallos = [];
  const assert = { ok: (v, m) => { if (!v) fallos.push(m); } };
  let total = 0;
  const porEstado = {};
  for (const c of C) {
    for (const [k, e] of Object.entries(c.estados)) {
      assert.ok(e.css?.length || e.html?.length || e.js?.length, `${c.id}.${k}: lleva evidencia (css, html o js)`);
      for (const item of e.css ?? []) {
        const rs = rulesWith(item);
        assert.ok(rs.length, `${c.id}.${k}: existe la regla ${item}`);
        const ok = rs.filter(r => (!CONDICION[k] || CONDICION[k](norm(item), r)) && (!e.media || r.at.some(a => a.includes(e.media))));
        assert.ok(ok.length, `${c.id}.${k}: ${item} cumple la condición del estado${e.media ? ` dentro de ${e.media}` : ''}`);
      }
      for (const s of e.html ?? []) assert.ok(htmlHas(s), `${c.id}.${k}: index.html tiene ${s}`);
      for (const j of e.js ?? []) assert.ok(read(j.ruta).includes(j.texto), `${c.id}.${k}: ${j.ruta} contiene «${j.texto}»`);
      total++; porEstado[k] = (porEstado[k] ?? 0) + 1;
    }
    if (c.tipo === 'control') {
      assert.ok(c.estados.foco, `${c.id}: un control declara su foco visible`);
      assert.ok(c.estados.hover || c.no_aplica?.hover, `${c.id}: un control declara su hover o por qué no lo tiene`);
    }
  }
  assert.ok(total >= 100, `estados comprobados: ${total} (${JSON.stringify(porEstado)})`);
  strict.deepEqual(fallos, [], `estados (${total}: ${JSON.stringify(porEstado)})`);
  // La tabla de COMPONENTES.md cubre los estados que pidió Aldo.
  for (const k of ['hover', 'foco', 'presionado', 'deshabilitado', 'seleccionado', 'actual', 'ocupado', 'vacio', 'error', 'movimiento_reducido']) assert.ok(COLUMNAS.some(([col]) => col === k), `columna ${k}`);
});

test('reglas globales de estado: hover solo con puntero que flota, movimiento solo bajo .motion, sin clases que dupliquen ARIA', () => {
  const hoverFuera = RULES.filter(r => /:hover/.test(r.selector) && !inAt(r, /\(hover:\s*hover\)/)).map(r => `${r.file}: ${r.selector}`);
  assert.deepEqual(hoverFuera, [], 'todo :hover vive dentro de @media (hover: hover)');
  const anim = RULES.filter(r => /(^|;)\s*animation\s*:/.test(r.body) && !/animation\s*:\s*none/.test(r.body));
  assert.ok(anim.length >= 7, `animaciones encontradas: ${anim.length}`);
  for (const r of anim) assert.ok(r.items.every(i => i.startsWith('.motion ')) || inAt(r, /prefers-reduced-motion/), `animación solo con movimiento: ${r.selector}`);
  const reduce = RULES.find(r => r.selector === '*, *::before, *::after' && inAt(r, /prefers-reduced-motion:\s*reduce/));
  assert.ok(reduce && /transition-duration: 0\.01ms !important/.test(reduce.body) && /animation-duration: 0\.01ms !important/.test(reduce.body), 'con «reducir movimiento» ninguna transición ni animación dura');
  const siteJs = ['app.js', 'catalog.js', 'carousel3d.js', 'rail.js', 'feed.js', 'cafe.js', 'saved.js', 'sheets.js', 'news.js', 'motion.js'].map(read).join('\n');
  const dup = [...(RULES.map(r => r.selector).join('\n') + siteJs).matchAll(/\bis-(selected|checked|pressed|expanded|current|disabled|busy|invalid)\b/g)].map(m => m[0]);
  assert.deepEqual(dup, [], 'clase = parte o variante, aria-* = estado: ninguna clase is-* repite un estado ARIA');
  // Toda clase con regla de foco propia está catalogada (si se añade un control, se añade al catálogo).
  const json = JSON.stringify(catalog);
  const conFoco = [...new Set(RULES.filter(r => /:focus-visible/.test(r.selector)).flatMap(r => [...r.selector.matchAll(/\.([a-z][\w-]*)/g)].map(m => m[1])))];
  const sinCatalogo = conFoco.filter(cls => !json.includes(`.${cls}`) && !['motion'].includes(cls));
  assert.deepEqual(sinCatalogo, [], 'cada clase con :focus-visible propio aparece en el catálogo');
});

test('contraste de los pares fondo↔texto de los controles: texto ≥ 4.5:1 y bordes, iconos y foco ≥ 3:1, en claro y oscuro', () => {
  assert.ok(catalog.contraste.length >= 40, `pares declarados: ${catalog.contraste.length}`);
  const vistos = new Set();
  let n = 0;
  for (const p of catalog.contraste) {
    assert.ok(MINIMO[p.tipo], `tipo conocido: ${p.tipo}`);
    const key = `${p.frente}|${p.fondo}|${p.tipo}`;
    assert.ok(!vistos.has(key), `par sin repetir: ${key}`); vistos.add(key);
    for (const tema of ['light', 'dark']) {
      const r = pairRatio(p, colors, tema);
      assert.ok(r >= MINIMO[p.tipo], `${tema === 'light' ? 'claro' : 'oscuro'}: ${p.frente} sobre ${p.fondo} (${p.tipo}) = ${r.toFixed(2)} < ${MINIMO[p.tipo]} · ${p.donde}`);
      n++;
    }
  }
  // Los pares que nombró Aldo están en la lista.
  for (const [f, b] of [['en-primario', 'primario'], ['en-menta', 'menta'], ['tinta', 'superficie'], ['tinta-2', 'fondo-3'], ['tinta', 'vidrio@peor'], ['tinta', 'vidrio-hoja@peor'], ['foco', 'fondo'], ['linea-fuerte', 'fondo']]) {
    assert.ok(catalog.contraste.some(p => p.frente === f && p.fondo === b), `par ${f} sobre ${b}`);
  }
  // Cada color de los pares es un token real usado en el CSS del sitio.
  const css = CSS_FILES.map(read).join('\n');
  for (const name of new Set(catalog.contraste.flatMap(p => [p.frente, p.fondo]).flatMap(s => s.replace(/^mezcla:/, '').replace(/@\w+$/, '').split('+')))) {
    assert.ok(colors[name] && css.includes(`var(--${name})`), `${name} es un color de tokens.json usado en el CSS`);
  }
  assert.equal(n, catalog.contraste.length * 2, 'cada par en los dos temas');
});

test('documentación: COMPONENTES.md al día con el catálogo, enlazado desde DESIGN.md con la regla de atributos y el origen en FUENTES.md', () => {
  assert.equal(read('design/COMPONENTES.md'), renderMd(catalog, tokens), 'design/COMPONENTES.md está generado del catálogo (npm run componentes)');
  const design = read('DESIGN.md');
  assert.ok(design.includes('design/COMPONENTES.md') && design.includes('design/componentes.json'), 'DESIGN.md enlaza el catálogo');
  assert.ok(/clase = parte o variante, `aria-\*` = estado, `data-\*` = gancho de JavaScript/.test(design), 'DESIGN.md anota la regla de atributos');
  assert.ok(/registry/.test(read('docs/ux/FUENTES.md')) && /shadcn/.test(read('docs/ux/FUENTES.md')), 'FUENTES.md registra el origen (shadcn registry, MIT)');
  assert.ok(read('AGENTS.md').includes('design/componentes.json'), 'AGENTS.md nombra el catálogo');
  for (const f of SITE_FILES) assert.ok(existsSync(join(root, f)), f);
});

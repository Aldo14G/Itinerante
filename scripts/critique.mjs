// Auditor de diseño determinista: tokens, accesibilidad, movimiento y copy/verdad, con leyes UX medibles.
// Uso: node scripts/critique.mjs [--surface b4|root|all] [--static-only] [--update-baseline] [--top N]
// Sale con 1 si alguna regla de severidad "error" supera el baseline (ratchet: solo puede bajar).
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderB4, renderRoot } from './build-tokens.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'design/tokens.json'), 'utf8'));
const argv = process.argv.slice(2);
const flag = name => argv.includes(`--${name}`);
const opt = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : fallback; };

const SURFACES = {
  b4: { dir: 'prototypes/itinerante-b4', html: 'index.html', css: ['tokens.css', 'style.css', 'mobile.css'], theme: 'b4', labels: true },
  root: { dir: '.', html: 'index.html', css: ['assets/css/higgsfield-site.css'], theme: 'root', labels: false },
  fixture: { dir: 'tests/fixtures/critique-bad', html: 'index.html', css: ['style.css'], theme: 'b4', labels: false, hidden: true },
};

// Reglas: familia y severidad. Las de severidad "error" bloquean (ratchet contra design/baseline.json).
const RULES = {
  'token-color-literal': ['tokens', 'error', 'Color escrito a mano: usa un token de color.'],
  'token-font-size': ['tokens', 'error', 'Tamaño de texto fuera de la escala tipográfica.'],
  'token-space-grid': ['tokens', 'error', 'Espaciado fuera de la cuadrícula de 4 px.'],
  'token-radius': ['tokens', 'error', 'Radio fuera de la escala.'],
  'token-duration': ['tokens', 'error', 'Duración fuera de la escala de movimiento.'],
  'token-duplicate': ['tokens', 'error', 'Color redeclarado fuera de tokens.css.'],
  'token-drift': ['tokens', 'error', 'El tema del CSS difiere de design/tokens.json.'],
  'motion-too-long': ['motion', 'error', 'Transición o animación de más de 1.2 s.'],
  'motion-layout-prop': ['motion', 'error', 'Se anima una propiedad de layout (provoca reflujo).'],
  'motion-no-reduced': ['motion', 'error', 'Hay movimiento sin bloque prefers-reduced-motion.'],
  'a11y-contrast': ['a11y', 'error', 'Contraste de texto por debajo de WCAG AA.'],
  'a11y-target': ['a11y', 'error', 'Objetivo táctil/puntero más pequeño que el mínimo (Fitts).'],
  'a11y-name': ['a11y', 'error', 'Control sin nombre accesible.'],
  'a11y-font-small': ['a11y', 'error', 'Texto de menos de 12 px.'],
  'a11y-focus-removed': ['a11y', 'error', 'Se quita el contorno de foco sin alternativa.'],
  'a11y-h1': ['a11y', 'error', 'Debe haber exactamente un h1.'],
  'a11y-overflow': ['a11y', 'error', 'Desborde horizontal de la página.'],
  'a11y-console': ['a11y', 'error', 'Error de consola o excepción.'],
  'a11y-heading-skip': ['a11y', 'warn', 'Salto de nivel de encabezado.'],
  'copy-truth': ['copy', 'error', 'Afirmación comercial sin fuente (precio, existencia, fecha, reseña o cifra).'],
  'copy-label': ['copy', 'error', 'Imagen sin rótulo «Foto real» / «Recreación IA».'],
  'copy-glued': ['copy', 'error', 'Palabras pegadas (falta un espacio, p. ej. un <br> oculto en móvil).'],
  'copy-repeat': ['copy', 'warn', 'Frase repetida en la página.'],
  'copy-measure': ['copy', 'warn', 'Línea de lectura de más de 75 caracteres.'],
  'law-lineheight': ['law', 'warn', 'Interlineado de lectura menor a 1.35.'],
  'law-hick': ['law', 'warn', 'Demasiadas acciones visibles a la vez (Hick).'],
  'law-miller': ['law', 'warn', 'Más de 7 elementos en un grupo de navegación (Miller).'],
  'law-restorff': ['law', 'warn', 'Más de 2 botones primarios compitiendo en una vista (Von Restorff).'],
};

const BROWSER_RULES = new Set(Object.keys(RULES).filter(r => /^(a11y-(contrast|target|name|font-small|h1|overflow|console|heading-skip)|copy-(truth|label|repeat|measure|glued)|law-)/.test(r)));

// ---------- Estático: CSS ----------
const blank = text => text.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
const lineAt = (text, idx) => text.slice(0, idx).split('\n').length;
const stripFns = value => { let v = value, prev; do { prev = v; v = v.replace(/\b(?:calc|clamp|min|max|var|env|url|rgb|rgba|hsl|hsla|cubic-bezier|steps)\([^()]*\)/g, ' '); } while (v !== prev); return v; };
const remOf = (n, unit) => (unit === 'rem' ? n : n / 16);
const approx = (a, b) => Math.abs(a - b) < 0.0051;

function staticCss(name, surface) {
  const findings = [];
  const type = new Set(Object.values(tokens.scales.type).map(v => parseFloat(v)));
  const radius = new Set([0, ...Object.values(tokens.scales.radius).map(v => parseFloat(v))]);
  const durations = new Set([0.01, ...Object.values(tokens.scales.duration).map(v => parseFloat(v))]);
  const themeColors = tokens.themes[surface.theme].color;
  let usesMotion = false, hasReduced = false;

  for (const file of surface.css) {
    const path = join(root, surface.dir, file);
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
    const text = blank(raw);
    const isTokenFile = file === 'tokens.css';
    const rel = `${surface.dir}/${file}`.replace(/^\.\//, '');
    if (/prefers-reduced-motion/.test(text)) hasReduced = true;
    const rawLines = raw.split('\n');
    // Excepción justificada: `/* ci:<regla> motivo */` en la misma línea de la declaración.
    const add = (rule, idx, detail) => { const line = lineAt(text, idx); if (rawLines[line - 1]?.includes(`ci:${rule}`)) return; findings.push({ rule, file: rel, line, detail }); };

    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(text))) {
      const selector = m[1].trim();
      const bodyStart = m.index + m[0].indexOf('{') + 1;
      const isRoot = /(^|\s):root/.test(selector);
      if (selector.startsWith('@font-face')) continue;
      let offset = 0;
      for (const decl of m[2].split(';')) {
        const at = bodyStart + offset + decl.match(/^\s*/)[0].length;
        offset += decl.length + 1;
        const c = decl.indexOf(':');
        if (c < 0) continue;
        const prop = decl.slice(0, c).trim().toLowerCase();
        const value = decl.slice(c + 1).trim();
        if (!prop || !value) continue;
        const bare = stripFns(value);

        // Color
        if (!isTokenFile && !(isRoot && prop.startsWith('--'))) {
          const lit = value.match(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/g);
          if (lit && !/^\s*url\(/.test(value)) lit.forEach(l => add('token-color-literal', at, `${prop}: ${l}`));
        }
        if (!isTokenFile && isRoot && prop.startsWith('--') && Object.prototype.hasOwnProperty.call(themeColors, prop.slice(2))) add('token-duplicate', at, prop);
        // Escala tipográfica
        if (prop === 'font-size' || prop === 'font') {
          const sizes = prop === 'font-size' ? (/^-?[\d.]+(?:rem|px)$/.test(bare.trim()) ? [bare.trim().match(/([\d.]+)(rem|px)/)] : []) : [...bare.matchAll(/(?:^|\s)([\d.]+)(rem|px)\s*\//g)];
          sizes.forEach(s => { const r = remOf(parseFloat(s[1]), s[2]); if (![...type].some(t => approx(t, r))) add('token-font-size', at, `${prop}: ${s[1]}${s[2]}`); });
        }
        // Espaciado
        if (/^(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$/.test(prop)) {
          for (const s of bare.matchAll(/(-?[\d.]+)(px|rem)\b/g)) {
            const px = Math.abs(parseFloat(s[1])) * (s[2] === 'rem' ? 16 : 1);
            if (px > 2 && px % 4 !== 0) add('token-space-grid', at, `${prop}: ${s[0]}`);
          }
        }
        // Radios
        if (/^border(-(top|bottom)-(left|right))?-radius$/.test(prop)) {
          for (const s of bare.matchAll(/([\d.]+)(px|rem)\b/g)) {
            const px = parseFloat(s[1]) * (s[2] === 'rem' ? 16 : 1);
            if (![...radius].some(r => approx(r, px))) add('token-radius', at, `${prop}: ${s[0]}`);
          }
        }
        // Movimiento
        if (/^(transition|animation)(-duration)?$/.test(prop)) {
          usesMotion = true;
          const segments = prop.endsWith('-duration') ? [value] : value.split(/,(?![^(]*\))/);
          for (const seg of segments) {
            if (/infinite/.test(seg)) continue; // bucles ambientales (pulso): su ritmo es propio
            const segBare = stripFns(seg);
            const first = /var\(--dur-/.test(seg) ? null : segBare.match(/(-?[\d.]+)(ms|s)\b/); // si la duración es un token, el primer literal es solo el retraso
            if (first) {
              const ms = parseFloat(first[1]) * (first[2] === 's' ? 1000 : 1);
              if (ms > 1200) add('motion-too-long', at, `${prop}: ${first[0]}`);
              if (![...durations].some(d => approx(d, ms) || Math.abs(d - ms) < 0.5)) add('token-duration', at, `${prop}: ${first[0]}`);
            }
            if (prop.startsWith('transition')) {
              const p = seg.trim().split(/\s+/)[0];
              if (/^(width|height|top|left|right|bottom|margin|padding|inset|block-size|inline-size)(-|$)/.test(p)) add('motion-layout-prop', at, `${prop}: ${p}`);
            }
          }
        }
        // Foco
        if ((prop === 'outline' && /^(none|0)$/i.test(value)) || (prop === 'outline-style' && /none/i.test(value))) {
          // Válido si el mismo selector define un estado :focus-visible propio (sombra, borde o contorno).
          const first = selector.split(',')[0].trim().replace(/^.*\}\s*/, '');
          const replaced = text.includes(`${first}:focus-visible`);
          if (!/:not\(:focus-visible\)/.test(selector) && !replaced) add('a11y-focus-removed', at, selector);
        }
      }
    }

  }
  // Deriva: el CSS de tokens generado debe coincidir con design/tokens.json.
  const generated = surface.dir === 'tests/fixtures/critique-bad' ? null
    : surface.theme === 'b4' ? ['prototypes/itinerante-b4/tokens.css', renderB4(tokens)]
    : ['assets/css/tokens.css', renderRoot(tokens)];
  if (generated) {
    const file = join(root, generated[0]);
    const current = existsSync(file) ? readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : '';
    if (current !== generated[1]) findings.push({ rule: 'token-drift', file: generated[0], line: 1, detail: 'desactualizado: ejecuta npm run tokens' });
  }
  if (usesMotion && !hasReduced) findings.push({ rule: 'motion-no-reduced', file: surface.dir, line: 1, detail: 'sin @media (prefers-reduced-motion)' });
  return findings;
}

// ---------- Navegador (Chrome headless por CDP) ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };

function serve(dir) {
  const base = resolve(root, dir);
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) return res.writeHead(503, { 'Content-Type': 'application/json' }).end('{"error":"sin API en la auditoría"}');
    let p = posix.normalize(decodeURIComponent(url.pathname));
    if (p.endsWith('/')) p += 'index.html';
    const file = resolve(base, `.${p}`);
    if (!file.startsWith(base + sep) || !existsSync(file) || /\.(md|mjs)$/.test(file) && !file.includes('assets')) return res.writeHead(404).end('no');
    try { res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(readFileSync(file)); } catch { res.writeHead(404).end('no'); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}

const PAGE_AUDIT = (params) => `(${function (cfg) {
  const out = [];
  const sel = el => { if (!el) return ''; let s = el.tagName.toLowerCase(); if (el.id) return `${s}#${el.id}`; const c = [...el.classList].slice(0, 2).join('.'); return c ? `${s}.${c}` : s; };
  const add = (rule, el, detail) => out.push({ rule, sel: sel(el), detail });
  const visible = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const hiddenTree = el => !!el.closest('[aria-hidden="true"], .sr-only, [hidden], script, style, noscript, svg');
  const parse = s => { const m = s.match(/[\d.]+/g); if (!m) return [0, 0, 0, 0]; const k = /^color\(/.test(s) ? 255 : 1; const a = s.includes('/') ? +m[m.length - 1] : (m[3] === undefined ? 1 : +m[3]); return [+m[0] * k, +m[1] * k, +m[2] * k, k === 255 ? (s.includes('/') ? a : 1) : a]; };
  const over = (top, under) => { const a = top[3]; return [top[0] * a + under[0] * (1 - a), top[1] * a + under[1] * (1 - a), top[2] * a + under[2] * (1 - a), 1]; };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

  // Contraste y tamaño de texto
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const seen = new Set();
  for (let el = walker.currentNode; el; el = walker.nextNode()) {
    if (!el || el === document.body || hiddenTree(el) || !visible(el)) continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) continue;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    if (fs < 12) add('a11y-font-small', el, `${fs.toFixed(1)}px · «${el.textContent.trim().slice(0, 32)}»`);
    // fondo efectivo
    const r = el.getBoundingClientRect();
    const px = Math.min(innerWidth - 1, Math.max(0, r.x + r.width / 2)), py = Math.min(innerHeight - 1, Math.max(0, r.y + r.height / 2));
    let media = false;
    if (r.y + r.height / 2 >= 0 && r.y + r.height / 2 <= innerHeight) media = document.elementsFromPoint(px, py).some(e => ['IMG', 'CANVAS', 'VIDEO'].includes(e.tagName) && !e.contains(el));
    const stack = [];
    let opacity = 1;
    for (let a = el; a; a = a.parentElement) {
      const s = getComputedStyle(a);
      opacity *= parseFloat(s.opacity);
      if (s.backgroundImage !== 'none') { media = true; }
      stack.unshift(parse(s.backgroundColor));
    }
    if (media) continue;
    let bg = [255, 255, 255, 1];
    stack.forEach(l => { if (l[3] > 0) bg = over(l, bg); });
    const fgRaw = parse(cs.color); fgRaw[3] *= opacity;
    const fg = over(fgRaw, bg);
    const large = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700);
    const need = large ? cfg.contrast.large : cfg.contrast.text;
    const got = ratio(fg, bg);
    if (got < need) { const key = sel(el) + got.toFixed(2); if (!seen.has(key)) { seen.add(key); add('a11y-contrast', el, `${got.toFixed(2)}:1 < ${need} · «${el.textContent.trim().slice(0, 32)}»`); } }
  }

  // Objetivos y nombres
  const min = cfg.coarse ? cfg.target.coarse : cfg.target.fine;
  document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=radio], [role=button]').forEach(el => {
    if (hiddenTree(el) && !el.matches('input')) return;
    if (!visible(el)) return;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (el.matches('input[type=checkbox], input[type=radio]') && +cs.opacity === 0) return;
    if (r.right < 0 || r.bottom < 0 || r.left > innerWidth + 1) return;
    if (cs.display === 'inline' && el.matches('a')) { /* excepción de enlaces en línea */ }
    else if (Math.min(r.width, r.height) < min && !el.closest('.skip')) add('a11y-target', el, `${Math.round(r.width)}×${Math.round(r.height)} < ${min}`);
    const labelled = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || (el.labels && el.labels.length) || el.textContent.trim() || el.querySelector('img[alt]:not([alt=""])') || (el.matches('input') && el.getAttribute('placeholder'));
    if (!labelled) add('a11y-name', el, 'sin nombre');
  });

  // Encabezados
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  const h1 = hs.filter(h => h.tagName === 'H1').length;
  if (h1 !== 1) out.push({ rule: 'a11y-h1', sel: 'document', detail: `${h1} h1` });
  let last = 0;
  hs.forEach(h => { const n = +h.tagName[1]; if (last && n > last + 1) add('a11y-heading-skip', h, `h${last} → h${n}`); last = n; });
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push({ rule: 'a11y-overflow', sel: 'document', detail: `${document.documentElement.scrollWidth} > ${innerWidth}` });

  // Lectura: medida e interlineado
  const canvas = document.createElement('canvas').getContext('2d');
  document.querySelectorAll('p, blockquote p, li').forEach(el => {
    if (hiddenTree(el) || !visible(el)) return;
    const t = el.textContent.trim();
    if (t.length < 120) return;
    const cs = getComputedStyle(el);
    canvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const sample = 'abcdefghijklmnopqrstuvwxyz ';
    const cw = canvas.measureText(sample).width / sample.length;
    const cpl = el.getBoundingClientRect().width / cw;
    if (cpl > cfg.measure.max + 5) add('copy-measure', el, `${Math.round(cpl)} caracteres por línea`);
    const lh = parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
    if (Number.isFinite(lh) && lh < 1.35) add('law-lineheight', el, `${lh.toFixed(2)}`);
  });

  // Copy y verdad (texto renderizado)
  const text = document.body.innerText;
  const truth = [
    [/\$\s?\d|\bMXN\b|\bUSD\b|\bpesos\b/i, 'precio'],
    [/(?<![\p{L}])(en existencia|disponibles? en tienda|últimas piezas|agotad[oa]|stock)(?![\p{L}])/iu, 'existencia'],
    [/\b(oferta|descuento|promoci[oó]n|envío gratis|2x1)\b/i, 'oferta'],
    [/★|\breseñas?\b|\bcalificaci[oó]n\b|\bestrellas\b|\bopiniones\b/i, 'reseñas'],
    [/\b\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i, 'fecha'],
    [/\b\d[\d,.]*\s?(clientes|lectores|libros vendidos|años de experiencia)\b/i, 'cifra'],
    [/\b(garantizad[oa]|el mejor|premiad[oa]|más vendid[oa])\b/i, 'superlativo'],
  ];
  truth.forEach(([re, what]) => { const m = text.match(re); if (m) out.push({ rule: 'copy-truth', sel: 'texto', detail: `${what}: «${m[0]}»` }); });
  // Palabras pegadas: un <br> oculto (p. ej. en móvil) entre texto sin espacio a ninguno de sus lados.
  document.querySelectorAll('br').forEach(br => {
    if (getComputedStyle(br).display !== 'none') return;
    const prev = br.previousSibling, next = br.nextSibling;
    if (prev && next && prev.nodeType === 3 && next.nodeType === 3 && !/\s$/.test(prev.textContent) && !/^\s/.test(next.textContent)) {
      out.push({ rule: 'copy-glued', sel: sel(br.parentElement), detail: `«${prev.textContent.slice(-12)}|${next.textContent.slice(0, 12)}»` });
    }
  });
  const counts = new Map();
  text.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim().toLowerCase().replace(/\s+/g, ' ')).filter(s => s.split(' ').length >= 5).forEach(s => counts.set(s, (counts.get(s) || 0) + 1));
  counts.forEach((n, s) => { if (n > 1) out.push({ rule: 'copy-repeat', sel: 'texto', detail: `×${n} «${s.slice(0, 60)}»` }); });

  // Rótulos de procedencia
  if (cfg.labels) {
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      if (!/assets\/img\//.test(src) || !img.getAttribute('alt')) return;
      const box = img.closest('figure, li, .topic-stage, .bill-stage') || img.parentElement;
      if (!box.querySelector('.tag--real, .tag--ai')) add('copy-label', img, src);
    });
  }

  // Leyes UX (primera vista)
  const interactive = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select')].filter(e => visible(e) && !hiddenTree(e)).filter(e => { const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
  if (interactive.length > 9) out.push({ rule: 'law-hick', sel: 'primera vista', detail: `${interactive.length} acciones visibles` });
  document.querySelectorAll('nav').forEach(nav => { const n = nav.querySelectorAll('a').length; if (n > 7 && visible(nav)) add('law-miller', nav, `${n} enlaces`); });
  const primaries = interactive.filter(e => e.matches('.btn--tungsten, .btn--light, .btn--night'));
  if (primaries.length > 2) out.push({ rule: 'law-restorff', sel: 'primera vista', detail: `${primaries.length} botones primarios` });
  return out;
}.toString()})(${JSON.stringify(params)})`;

async function auditInBrowser(name, surface) {
  const { server, port } = await serve(surface.dir);
  const chromePath = process.env.CHROME_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
  if (!chromePath) { server.close(); throw new Error('No se encontró Chrome (define CHROME_PATH).'); }
  const debugPort = 9500 + Math.floor(Math.random() * 400);
  const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${debugPort}`, '--no-first-run', '--disable-extensions', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-crit-'))}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const findings = [];
  try {
    let targets;
    for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json(); if (targets.length) break; } catch {} await sleep(250); }
    const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let id = 0; const pending = new Map(); let problems = [];
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
      if (m.method === 'Runtime.exceptionThrown') problems.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/\/api\//.test(m.params.entry.url || '') && !/fonts\.(googleapis|gstatic)/.test(m.params.entry.url || '')) problems.push(`LOG ${m.params.entry.text} ${m.params.entry.url || ''}`);
    });
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
    await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');

    for (const vp of [{ label: 'escritorio', w: 1440, h: 900, coarse: false }, { label: 'móvil', w: 390, h: 844, coarse: true }]) {
      problems = [];
      await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.coarse });
      await send('Emulation.setTouchEmulationEnabled', { enabled: vp.coarse, maxTouchPoints: vp.coarse ? 5 : 1 });
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await send('Page.navigate', { url: `http://127.0.0.1:${port}/${surface.html}` });
      await sleep(2500);
      // recorrido para activar cargas diferidas (catálogo, imágenes)
      await ev(`(async()=>{const h=document.documentElement.scrollHeight; for(let y=0;y<h;y+=Math.max(300,innerHeight*0.8)){scrollTo(0,y); await new Promise(r=>setTimeout(r,120));} scrollTo(0,0); await new Promise(r=>setTimeout(r,500)); return 1})()`);
      const raw = await ev(PAGE_AUDIT({ coarse: vp.coarse, labels: surface.labels, target: tokens.scales.target, measure: tokens.scales.measure, contrast: tokens.scales.contrast }));
      (raw || []).forEach(f => findings.push({ ...f, viewport: vp.label }));
      // Segunda pasada con movimiento activo: las transformaciones de las escenas también pueden desbordar la página.
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
      await send('Page.navigate', { url: `http://127.0.0.1:${port}/${surface.html}` });
      await sleep(2500);
      await ev(`(async()=>{const h=document.documentElement.scrollHeight; for(let y=0;y<h;y+=Math.max(300,innerHeight*0.8)){scrollTo(0,y); await new Promise(r=>setTimeout(r,100));} await new Promise(r=>setTimeout(r,500)); return 1})()`);
      const motionWidth = await ev('document.documentElement.scrollWidth - innerWidth');
      if (motionWidth > 1) findings.push({ rule: 'a11y-overflow', sel: 'document', detail: `${motionWidth}px de desborde con movimiento activo`, viewport: vp.label });
      problems.forEach(p => findings.push({ rule: 'a11y-console', sel: 'consola', detail: p.slice(0, 160), viewport: vp.label }));
    }
    ws.close();
  } finally { chrome.kill(); server.close(); }
  return findings;
}

// ---------- Orquestación ----------
const wanted = opt('surface', 'all');
if (wanted !== 'all' && !SURFACES[wanted]) { console.error(`Superficie desconocida: «${wanted}». Opciones: ${Object.keys(SURFACES).filter(n => !SURFACES[n].hidden).join(', ')}, all.`); process.exit(2); }
const names = wanted === 'all' ? Object.keys(SURFACES).filter(n => !SURFACES[n].hidden) : [wanted];
const baselinePath = join(root, 'design/baseline.json');
const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {};
const report = { generatedAt: new Date().toISOString(), surfaces: {} };
let failed = false;
const top = Number(opt('top', 6));

for (const name of names) {
  const surface = SURFACES[name];
  let findings = staticCss(name, surface).map(f => ({ ...f, sel: `${f.file}:${f.line}` }));
  if (!flag('static-only')) findings.push(...await auditInBrowser(name, surface));

  // deduplicar por regla+selector+detalle (unir viewports)
  const map = new Map();
  for (const f of findings) {
    const key = `${f.rule}|${f.sel}|${f.detail}`;
    const prev = map.get(key);
    if (prev) { if (f.viewport && !prev.viewports.includes(f.viewport)) prev.viewports.push(f.viewport); } else map.set(key, { ...f, viewports: f.viewport ? [f.viewport] : [] });
  }
  findings = [...map.values()];
  const counts = {};
  findings.forEach(f => { counts[f.rule] = (counts[f.rule] || 0) + 1; });
  report.surfaces[name] = { counts, findings };

  console.log(`\n== ${name} ==`);
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  for (const [rule, n] of rows) {
    const [family, severity] = RULES[rule] ?? ['?', 'warn', ''];
    const base = baseline[name]?.[rule] ?? 0;
    const over = severity === 'error' && n > base;
    if (over) failed = true;
    console.log(`${over ? '✗' : severity === 'error' ? '•' : '~'} ${rule.padEnd(22)} ${String(n).padStart(4)}  (${family}, ${severity}${severity === 'error' ? `, base ${base}` : ''})`);
    findings.filter(f => f.rule === rule).slice(0, top).forEach(f => console.log(`      ${f.sel} ${f.detail ?? ''}${f.viewports?.length ? ` [${f.viewports.join(', ')}]` : ''}`));
  }
  if (!rows.length) console.log('sin hallazgos');

  if (flag('update-baseline')) {
    // En modo --static-only las reglas del navegador no se midieron: se conserva su valor anterior.
    const previous = baseline[name] ?? {};
    baseline[name] = {};
    for (const [rule, n] of rows) if ((RULES[rule]?.[1]) === 'error') baseline[name][rule] = n;
    if (flag('static-only')) for (const [rule, n] of Object.entries(previous)) if (BROWSER_RULES.has(rule)) baseline[name][rule] = n;
  }
}

mkdirSync(join(root, 'design'), { recursive: true });
writeFileSync(resolve(root, opt('out', 'design/report.json')), JSON.stringify(report, null, 2));
if (flag('update-baseline')) { writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n'); console.log('\nBaseline actualizado.'); }
console.log(failed ? '\nCRÍTICA: hay reglas por encima del baseline.' : '\nCRÍTICA: ninguna regla supera el baseline.');
process.exit(failed && !flag('update-baseline') ? 1 : 0);

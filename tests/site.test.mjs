import { strict as assert } from 'node:assert';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { buildPublic, collectPublicFiles, SITE_ORIGIN } from '../scripts/prepare-vercel-public.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'assets', 'css', 'higgsfield-site.css'), 'utf8');
const script = readFileSync(join(root, 'assets', 'js', 'higgsfield-site.js'), 'utf8');
const dormantDir = join(root, 'features', 'catalog-iti-ia');
const dormantHtml = readFileSync(join(dormantDir, 'catalog-iti-ia.html'), 'utf8');
const dormantScript = readFileSync(join(dormantDir, 'catalog-iti-ia.js'), 'utf8');
const firebase = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
const metaCsp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
const sectionHtml = id => html.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[\\s\\S]*?</section>`))?.[0] ?? '';
const textOf = fragment => fragment.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const localRefs = markup => [
  ...[...markup.matchAll(/\b(?:src|href|poster|data-poster|data-src|data-desktop|data-mobile)="([^"]+)"/g)].map(match => match[1]),
  ...[...markup.matchAll(/\b(?:srcset|data-srcset)="([^"]+)"/g)].flatMap(match => match[1].split(',').map(part => part.trim().split(/\s+/)[0]))
].filter(value => value && !value.startsWith('#'))
  .filter(value => !/^(https?:|mailto:|tel:|data:|blob:)/i.test(value))
  .map(value => value.split('?')[0]);

test('the Claude cinematic composition is canonical and uses the local Higgsfield media layer', () => {
  assert.equal(html.match(/data-canonical-model="claude-cinematic-higgsfield"/g)?.length, 1);
  assert.ok(existsSync(join(root, '_archive', 'models', 'mixed-legacy-index-2026-09-04.html')));
  assert.deepEqual(readdirSync(root).filter(file => file.endsWith('.html')), ['index.html']);
  assert.match(html, /class="site-nav"/);
  assert.match(html, /class="scroll-scrub" data-scroll-scrub data-active-frame="0"/);
  assert.match(html, /class="offer-section"/);
  assert.match(html, /class="agenda-section"/);
  assert.match(html, /class="gallery-section"/);
});

test('HTML shell is Spanish, self-contained, and secure by default', () => {
  assert.match(html, /^<!DOCTYPE html>/i);
  assert.match(html, /<html lang="es">/);
  assert.match(html, /Content-Security-Policy/);
  assert.match(metaCsp, /default-src 'self'/);
  assert.match(metaCsp, /connect-src 'self'/);
  assert.match(metaCsp, /media-src 'self'/);
  assert.match(metaCsp, /font-src 'self'/);
  assert.match(metaCsp, /style-src 'self'(;|$)/);
  assert.doesNotMatch(html + css, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.doesNotMatch(html + script, /__hfPatched|hfAuthOrigin|higgsfield\.app/i);
});

test('five sections preserve the chapter journey and a truthful conversion path', () => {
  assert.equal(html.match(/<section\b/g)?.length, 5);
  for (const id of ['inicio', 'experiencia', 'eventos', 'galeria', 'ubicacion']) {
    assert.match(html, new RegExp(`<section\\b[^>]*\\bid="${id}"`));
  }
  assert.doesNotMatch(html, /\$\s?\d+[\d,.]*\s*MXN|Inscripciones abiertas|Cupo limitado|\d\.\d\s*estrellas/i);
  assert.match(html, /publicamos fechas solo cuando están confirmadas/);
  assert.match(html, /confirma existencia por WhatsApp/);
  assert.doesNotMatch(html, /\bsólo\b/i);
});

test('catalog and Iti IA stay out of the public surface until real inventory exists', () => {
  for (const marker of ['id="catalogo"', 'href="#catalogo"', 'itiIaDialog', 'itiFab', 'bookDialog', 'data-iti-ia-open', '/api/']) {
    assert.ok(!html.includes(marker), `public HTML still exposes ${marker}`);
  }
  assert.doesNotMatch(script, /\/api\/|fetch\(/);
  assert.doesNotMatch(css, /\.(catalog|iti|book)-/);
});

test('the paused catalog keeps its same-origin service contracts for a later re-enable', () => {
  for (const id of ['catalogSearchForm', 'catalogStatus', 'bookGrid', 'itiIaDialog', 'itiIaForm', 'itiIaMessages']) {
    assert.match(dormantHtml, new RegExp(`id="${id}"`));
  }
  assert.match(dormantHtml, /la existencia siempre se confirma directamente/);
  assert.match(dormantHtml, /id="catalogFallback"[^>]*hidden/);
  assert.match(dormantHtml, /id="itiIaFallback"[^>]*hidden/);
  assert.match(dormantScript, /fetch\(`\/api\/catalog\?\$\{params\}`/);
  assert.match(dormantScript, /fetch\('\/api\/ai\/iti-ia'/);
  assert.match(dormantScript, /loadCatalog\(input\.value\.trim\(\), activeCategory\)/);
  assert.match(dormantScript, /setAttribute\('aria-pressed'/);
  assert.match(dormantScript, /setAttribute\('aria-busy'/);
  assert.match(dormantScript, /control\.disabled = true/);
  assert.match(dormantScript, /Datos de prueba · no es inventario/);
  assert.doesNotMatch(dormantScript, /innerHTML\s*=/);
  assert.doesNotThrow(() => new Function(dormantScript));
});

test('all local markup and stylesheet assets exist', () => {
  for (const value of localRefs(html)) assert.ok(existsSync(join(root, value)), `missing local asset: ${value}`);
  for (const [, reference] of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (/^(data:|https?:)/i.test(reference)) continue;
    assert.ok(existsSync(join(root, 'assets', 'css', reference.split('?')[0])), `missing stylesheet asset: ${reference}`);
  }
});

test('cinematic media is scroll-controlled and has bounded fallbacks', () => {
  assert.match(html, /<video muted playsinline preload="none"/);
  assert.doesNotMatch(html, /<video[^>]*(?:autoplay|loop)/);
  assert.match(html, /data-desktop="images\/cinematic\/runtime\/bg-walkthrough-seek-desktop\.mp4"/);
  assert.match(html, /data-mobile="images\/cinematic\/runtime\/bg-walkthrough-seek-mobile\.mp4"/);
  assert.match(script, /video\.currentTime = targetTime/);
  assert.doesNotMatch(script, /video\.play\(/);
  assert.match(script, /const frameStops = \[0, \.14, \.25, \.38, \.5, \.62, \.71\]/);
  assert.match(script, /lingerEase/);
  assert.match(script, /navigator\.getBattery/);
  assert.match(script, /prefers-reduced-motion: reduce/);
  assert.match(script, /navigator\.connection\?\.saveData/);
  assert.match(script, /min-width: 1024px/, 'the background video only loads on large screens');
  assert.match(script, /target\.scrollIntoView\(\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

  const runtime = join(root, 'images', 'cinematic', 'runtime');
  const videos = ['bg-walkthrough-seek-desktop.mp4', 'bg-walkthrough-seek-mobile.mp4'];
  assert.ok(videos.reduce((sum, name) => sum + statSync(join(runtime, name)).size, 0) <= 8 * 1024 * 1024);
  const frames = [
    '01-entrada-pasillo.webp',
    '02-cruce-umbral.webp',
    '03-home-sala-central.webp',
    '04-experiencia-libreros.webp',
    '05-talleres-ajedrez.webp',
    '06-comunidad-sonido.webp',
    '07-transicion-libros.webp'
  ];
  for (const name of frames) assert.match(html, new RegExp(`images/cinematic/runtime/${name}`));
  assert.equal(html.match(/data-frame="\d"/g)?.length, 7);
  assert.match(css, /\.cinematic-spacer\s*\{[^}]*min-height:\s*38svh/);
  assert.doesNotMatch(html, /scroll-scrub__phases|cinematic-spacer--final/);
  for (const index of [1, 2, 3, 4, 5, 6]) {
    const picture = html.match(new RegExp(`<picture data-frame="${index}">[\\s\\S]*?</picture>`))?.[0] ?? '';
    assert.match(picture, /data-srcset="images\/cinematic\/runtime\/[^"\s]+-mobile\.webp"/);
    assert.match(picture, /<img data-src=/);
    assert.doesNotMatch(picture, /\ssrc="/);
  }
  for (const name of ['bg-walkthrough-poster.webp', 'bg-walkthrough-poster-mobile.webp', ...frames]) {
    const bytes = readFileSync(join(runtime, name));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
});

test('polished interaction states remain accessible', () => {
  assert.match(html, /id="icon-arrow-ne"/);
  assert.match(html, /id="icon-close"/);
  assert.doesNotMatch(html + script, /[↗→×]/);
  assert.doesNotMatch(html, /class="eyebrow"/);
  assert.match(script, /setAttribute\('aria-current', 'true'\)/);
  assert.match(css, /\.site-nav a\[aria-current="true"\]/);
  assert.match(css, /scrollbar-color:/);
  assert.match(css, /caret-color:/);
});

test('visual contract uses the Claude editorial palette and motion remains bounded', () => {
  for (const token of ['--brand: #5dc4b4', '--brand-deep: #0d4a45', '--brand-ink: #061a18', '--amber: #e8a020']) {
    assert.match(css, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(css, /"Playfair Display"/);
  assert.match(css, /"Inter"/);
  assert.doesNotMatch(css, /"Outfit"|"IBM Plex Mono"/);
  assert.doesNotMatch(css, /transition:\s*all\b/);
  assert.doesNotMatch(script, /setInterval\s*\(/);
});

test('Casa editorial bounds the cinema and restores quiet reading surfaces', () => {
  assert.match(html, /data-composition="casa-editorial"/);
  assert.match(css, /\.offer-section, \.gallery-section\s*\{[^}]*background:\s*var\(--paper\)/);
  assert.match(css, /\.agenda-section\s*\{[^}]*background:\s*var\(--brand-deep\)/);
  const cinema = html.match(/<div class="scroll-scrub"[\s\S]*?(?=<section id="experiencia")/)?.[0] ?? '';
  assert.doesNotMatch(cinema, /id="eventos"|id="experiencia"|id="galeria"/);
  assert.ok(html.includes('images/gallery/oficial-sala.webp'));
  assert.doesNotMatch(html, /<b>Abierto<\/b>|hero-kicker|demo-card/);
});

test('external new-tab links cannot control the opener', () => {
  const anchors = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)].map(match => match[0]);
  assert.ok(anchors.length > 0);
  for (const anchor of anchors) assert.match(anchor, /rel="[^"]*noopener/);
});

test('site JavaScript is syntactically valid', () => {
  assert.doesNotThrow(() => new Function(script));
});

test('paused Iti IA restores a failed question without overwriting a new draft and permits retry', async () => {
  for (const draft of ['', 'Ahora busco poesía']) {
    const element = () => ({
      value: '', children: [], dataset: {}, handlers: {}, disabled: false,
      classList: { add() {}, remove() {} },
      append(...children) { this.children.push(...children); },
      setAttribute(name, value) { this[name] = value; },
      addEventListener(name, handler) { this.handlers[name] = handler; }
    });
    const ids = ['itiIaDialog', 'itiIaForm', 'itiIaInput', 'itiIaSubmit', 'itiIaMessages', 'itiIaStatus', 'itiIaFallback'];
    const nodes = Object.fromEntries(ids.map(id => [id, element()]));
    const requests = [];
    runInNewContext(dormantScript, {
      window: { matchMedia: () => ({ matches: false }) },
      location: { hash: '' },
      AbortSignal,
      document: {
        querySelector: () => null, querySelectorAll: () => [],
        getElementById: id => nodes[id] || null, createElement: element
      },
      fetch: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject }))
    });
    nodes.itiIaInput.value = 'Busco novelas mexicanas';
    const pending = nodes.itiIaForm.handlers.submit({ preventDefault() {} });
    assert.equal(nodes.itiIaSubmit.disabled, true);
    assert.equal(requests[0].url, '/api/ai/iti-ia');
    assert.ok(requests[0].options.signal instanceof AbortSignal);
    nodes.itiIaInput.value = draft;
    requests[0].reject(new Error('Network unavailable'));
    await pending;
    assert.equal(nodes.itiIaInput.value, draft || 'Busco novelas mexicanas');
    assert.equal(nodes.itiIaSubmit.disabled, false);
    assert.equal(nodes.itiIaMessages['aria-busy'], 'false');
    assert.equal(nodes.itiIaFallback.hidden, false);
    const retry = nodes.itiIaForm.handlers.submit({ preventDefault() {} });
    const sent = JSON.parse(requests[1].options.body).data.messages;
    assert.equal(sent.length, 1, 'failed turns must not be resent as duplicate conversation history');
    assert.equal(sent[0].content[0].text, draft || 'Busco novelas mexicanas');
    requests[1].resolve({ ok: true, json: async () => ({ result: [{ content: [{ text: 'Consulta recibida.' }] }] }) });
    await retry;
    assert.equal(nodes.itiIaFallback.hidden, true);
    assert.equal(nodes.itiIaSubmit.disabled, false);
  }
});

test('Firebase publishes only the generated allowlist directory with explicit headers', () => {
  const hosting = firebase.hosting;
  assert.equal(hosting.public, 'public');
  assert.ok(hosting.predeploy?.some(step => /build:public/.test(step)), 'predeploy must rebuild public/');
  assert.ok(hosting.ignore.includes('**/.*'), 'dotfiles must never be uploaded');
  const header = (source, key) => hosting.headers.find(rule => rule.source === source)?.headers.find(item => item.key === key)?.value ?? '';
  assert.match(header('/assets/**', 'Cache-Control'), /max-age=31536000.*immutable/);
  assert.match(header('/images/**', 'Cache-Control'), /max-age=\d+/);
  assert.equal(header('/', 'Cache-Control'), 'no-cache');
  assert.equal(header('**', 'Content-Security-Policy'), `${metaCsp}; frame-ancestors 'self'`, 'header and meta CSP must stay identical');
});

test('the publish build ships only referenced assets and never private files', async () => {
  const outDir = mkdtempSync(join(tmpdir(), 'itinerante-public-'));
  try {
    const files = (await buildPublic({ root, outDir })).map(file => file.replace(/\\/g, '/'));
    for (const required of ['index.html', 'robots.txt', 'sitemap.xml', 'assets/css/higgsfield-site.css', 'assets/js/higgsfield-site.js']) {
      assert.ok(files.includes(required), `missing ${required}`);
    }
    assert.ok(files.some(file => /^assets\/fonts\/.+\.woff2$/.test(file)));
    for (const file of files) {
      assert.doesNotMatch(file, /(^|\/)\.|\.md$|\.json$|\.env|config\.js$|^(features|_archive|src|data|docs|instagram-data|web-intel)\//i, `forbidden file in public build: ${file}`);
    }
    for (const value of localRefs(html)) assert.ok(files.includes(value), `public build misses ${value}`);
    assert.ok(!existsSync(join(outDir, '.env.local')));
    assert.ok(!existsSync(join(outDir, '.git')));
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test('the publish build refuses private references and unsafe destinations', async () => {
  for (const reference of ['Seguimiento', '/firestore.rules', '/.env.local', 'features/catalog-iti-ia/catalog-iti-ia.js', 'assets/js/config.js', 'images/../AGENTS.md', '%2e%2e/secret']) {
    await assert.rejects(collectPublicFiles(root, `<a href="${reference}">x</a>`), undefined, `must reject ${reference}`);
  }
  for (const outDir of [root, join(root, 'assets'), join(root, '..', 'itinerante-public-outside')]) {
    await assert.rejects(buildPublic({ root, outDir }), /Destino no permitido/, `must refuse ${outDir}`);
  }
});

test('visit information is above the fold and in Visita, and matches the structured data', () => {
  const days = /lun(es|\.)?\s*(a|–|-)\s*s[áa]b(ado|\.)?/i;
  const hours = /11:00\s*[–-]\s*20:00/;
  for (const id of ['inicio', 'ubicacion']) {
    const text = textOf(sectionHtml(id));
    assert.match(text, days, `#${id} must show the opening days`);
    assert.match(text, hours, `#${id} must show the opening hours`);
  }
  assert.match(textOf(sectionHtml('ubicacion')), /domingo[^.]{0,20}cerrado/i);
  const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '{}');
  assert.equal(data['@type'], 'BookStore');
  assert.equal(data.address?.streetAddress, 'Mariano Matamoros Pte. 421');
  assert.equal(data.address?.addressLocality, 'Monterrey');
  const specs = [].concat(data.openingHoursSpecification ?? []);
  const open = specs.flatMap(spec => [].concat(spec.dayOfWeek)).map(day => String(day).replace('https://schema.org/', '')).sort();
  assert.deepEqual(open, ['Friday', 'Monday', 'Saturday', 'Thursday', 'Tuesday', 'Wednesday']);
  for (const spec of specs) {
    assert.equal(spec.opens, '11:00');
    assert.equal(spec.closes, '20:00');
  }
});

test('Visita embeds the map lazily and only from Google Maps', () => {
  const visit = sectionHtml('ubicacion');
  const iframe = visit.match(/<iframe\b[^>]*>/)?.[0] ?? '';
  assert.match(iframe, /src="https:\/\/www\.google\.com\/maps\/embed\?/);
  assert.match(iframe, /loading="lazy"/);
  assert.match(iframe, /title="[^"]{12,}"/);
  assert.match(iframe, /referrerpolicy="no-referrer"/);
  assert.equal(html.match(/<iframe\b/g)?.length, 1);
  assert.match(metaCsp, /frame-src https:\/\/www\.google\.com(;|$)/);
});

test('the hero converts to a conversation or a visit, never to a missing feature', () => {
  const actions = sectionHtml('inicio').match(/<div class="hero-actions">[\s\S]*?<\/div>/)?.[0] ?? '';
  const links = [...actions.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match => match[1]);
  assert.ok(links[0]?.startsWith('https://wa.me/528180875940'), 'the primary hero action opens WhatsApp');
  assert.ok(links.some(href => /^https:\/\/www\.google\.com\/maps\//.test(href)), 'the hero offers directions');
  assert.doesNotMatch(actions, /<button\b/);
});

test('navigation covers every chapter and tracks the visible one with an observer', () => {
  const nav = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.deepEqual([...nav.matchAll(/href="#([^"]+)"/g)].map(match => match[1]), ['inicio', 'experiencia', 'eventos', 'galeria', 'ubicacion']);
  const chapterNav = script.match(/function initChapterNav\(\)[\s\S]*?\n  }\n/)?.[0] ?? '';
  assert.match(chapterNav, /IntersectionObserver/);
});

test('copy never glues words by hiding line breaks', () => {
  assert.doesNotMatch(css, /\bbr\s*\{[^}]*display:\s*none/);
});

test('performance: one high-priority image, a right-sized logo, self-hosted fonts that swap', () => {
  assert.equal(html.match(/fetchpriority="high"/g)?.length, 1);
  for (const [, src] of html.matchAll(/<img\b[^>]*\bsrc="([^"]*logo[^"]*)"/gi)) {
    assert.ok(statSync(join(root, src)).size <= 12 * 1024, `${src} is too heavy for a small logo`);
  }
  const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(match => match[1]);
  assert.ok(faces.length >= 3);
  for (const face of faces) {
    assert.match(face, /font-display:\s*swap/);
    assert.match(face, /url\("\.\.\/fonts\/[^"]+\.woff2"\)/);
  }
});

test('typography never drops below the legibility floor (0.8rem / 12.8px)', () => {
  const tooSmall = [];
  for (const [declaration, value] of css.matchAll(/font(?:-size)?:\s*([^;}]+)/g)) {
    const size = value.split('/')[0];
    for (const [, amount, unit] of size.matchAll(/(\d*\.?\d+)(rem|px)\b/g)) {
      const px = unit === 'rem' ? Number(amount) * 16 : Number(amount);
      if (px < 12.8) tooSmall.push(declaration.trim());
    }
  }
  assert.deepEqual(tooSmall, []);
});

test('SEO: canonical URL, absolute social image, robots and sitemap', () => {
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE_ORIGIN.replace(/\./g, '\\.')}/"`));
  const image = html.match(/property="og:image" content="([^"]+)"/)?.[1] ?? '';
  assert.ok(image.startsWith(`${SITE_ORIGIN}/`), 'og:image must be absolute');
  assert.ok(existsSync(join(root, image.slice(SITE_ORIGIN.length + 1))), 'og:image must exist locally');
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(readFileSync(join(root, 'robots.txt'), 'utf8'), new RegExp(`Sitemap: ${SITE_ORIGIN}/sitemap\\.xml`));
  assert.match(readFileSync(join(root, 'sitemap.xml'), 'utf8'), new RegExp(`<loc>${SITE_ORIGIN}/</loc>`));
});

test('the gallery shows real photographs and only real photographs are called real', () => {
  const sources = [...sectionHtml('galeria').matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
  assert.ok(sources.length >= 5);
  for (const src of sources) assert.match(src, /^images\/gallery\//);
  for (const [block] of html.matchAll(/<(article|figure)\b[^>]*>[\s\S]*?<\/\1>/g)) {
    if (/foto real/i.test(block)) assert.match(block, /images\/gallery\//, 'a generated frame cannot be labelled "Foto real"');
  }
});

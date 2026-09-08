import { strict as assert } from 'node:assert';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'assets', 'css', 'higgsfield-site.css'), 'utf8');
const script = readFileSync(join(root, 'assets', 'js', 'higgsfield-site.js'), 'utf8');

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
  assert.match(html, /default-src 'self'/);
  assert.match(html, /connect-src 'self'/);
  assert.match(html, /media-src 'self'/);
  assert.doesNotMatch(html + script, /__hfPatched|hfAuthOrigin|higgsfield\.app/i);
});

test('six sections preserve the Claude chapter journey and truthful conversion path', () => {
  assert.equal(html.match(/<section\b/g)?.length, 6);
  for (const id of ['inicio', 'experiencia', 'eventos', 'galeria', 'catalogo', 'ubicacion']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(html, /\$\s?\d+[\d,.]*\s*MXN|Inscripciones abiertas|Cupo limitado|\d\.\d\s*estrellas/i);
  assert.match(html, /publicamos fechas sólo cuando están confirmadas/);
  assert.match(html, /la existencia siempre se confirma directamente/);
});

test('all local markup assets exist', () => {
  const localValues = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
    .map(match => match[1])
    .filter(value => value && !value.startsWith('#'))
    .filter(value => !/^(https?:|mailto:|data:|blob:)/i.test(value))
    .map(value => value.split('?')[0]);
  for (const value of localValues) assert.ok(existsSync(join(root, value)), `missing local asset: ${value}`);
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
  assert.match(css, /\.cinematic-spacer\s*\{[^}]*min-height:\s*90svh/);
  assert.match(css, /\.cinematic-spacer--final\s*\{[^}]*min-height:\s*54svh/);
  for (const name of ['bg-walkthrough-poster.webp', 'bg-walkthrough-poster-mobile.webp', ...frames]) {
    const bytes = readFileSync(join(runtime, name));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
});

test('catalog and Iti IA keep their same-origin service contracts', () => {
  for (const id of ['catalogSearchForm', 'catalogStatus', 'bookGrid', 'itiIaDialog', 'itiIaForm', 'itiIaMessages']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(script, /fetch\(`\/api\/catalog\?\$\{params\}`/);
  assert.match(script, /fetch\('\/api\/ai\/iti-ia'/);
  assert.match(script, /loadCatalog\(input\.value\.trim\(\), activeCategory\)/);
  assert.match(script, /setAttribute\('aria-pressed'/);
  assert.match(script, /Datos de prueba · no es inventario/);
  assert.doesNotMatch(script, /innerHTML\s*=/);
});

test('polished interaction states remain accessible and recoverable', () => {
  assert.match(html, /id="icon-arrow-ne"/);
  assert.match(html, /id="icon-close"/);
  assert.doesNotMatch(html + script, /[↗→×]/);
  assert.doesNotMatch(html, /class="eyebrow"/);
  assert.match(html, /id="catalogFallback"[^>]*hidden/);
  assert.match(html, /id="itiIaFallback"[^>]*hidden/);
  assert.match(script, /setAttribute\('aria-busy'/);
  assert.match(script, /control\.disabled = true/);
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

test('scroll journey stays transparent like the hero so the real-space animation shows through', () => {
  for (const selector of ['\\.offer-section', '\\.agenda-section', '\\.community-bridge']) {
    const rule = css.match(new RegExp(`${selector}\\s*\\{[^}]*\\}`, 's'))?.[0] || '';
    assert.ok(/background:\s*transparent/.test(rule), `${selector} must be transparent like the hero`);
    assert.doesNotMatch(rule, /linear-gradient\(90deg, rgba\(6,\s*26,\s*24,\s*\.9/);
    assert.doesNotMatch(rule, /backdrop-filter:\s*blur\(20px\)/);
  }
});

test('external new-tab links cannot control the opener', () => {
  const anchors = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)].map(match => match[0]);
  assert.ok(anchors.length > 0);
  for (const anchor of anchors) assert.match(anchor, /rel="[^"]*noopener/);
});

test('site JavaScript is syntactically valid', () => {
  assert.doesNotThrow(() => new Function(script));
});

test('Iti IA restores a failed question without overwriting a new draft and permits retry', async () => {
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
    runInNewContext(script, {
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

test('Firebase continues to publish only the static root and protects private files', () => {
  const firebase = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
  assert.equal(firebase.hosting.public, '.');
  assert.ok(firebase.hosting.ignore.includes('_archive/**'));
  assert.ok(firebase.hosting.ignore.includes('*.json'));
  assert.ok(firebase.hosting.ignore.includes('*.zip'));
});

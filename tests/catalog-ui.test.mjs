import test from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'assets', 'css', 'higgsfield-site.css'), 'utf8');
const script = readFileSync(join(root, 'assets', 'js', 'higgsfield-site.js'), 'utf8');

test('el buscador sugiere títulos y autores mientras se escribe', () => {
  assert.match(html, /id="catalogSearch"[^>]*list="catalogSuggest"/);
  assert.match(html, /<datalist id="catalogSuggest"><\/datalist>/);
  assert.match(script, /getElementById\('catalogSuggest'\)/);
});

test('las facetas muestran conteos y el orden incluye novedad y valoración', () => {
  assert.match(html, /<option value="newest">Novedades<\/option>/);
  assert.match(html, /<option value="rating">Mejor valorados<\/option>/);
  assert.match(script, /updateCatalogChrome/);
  assert.match(script, /catalogFacetCounts\?\.categories/);
  assert.match(script, /publishedYear/);
});

test('el diálogo no muestra scrollbars fantasma y la píldora flota alta', () => {
  assert.match(css, /\.iti-predictions::-webkit-scrollbar \{\s*display: none/);
  assert.match(css, /\.genre-list::-webkit-scrollbar \{\s*display: none/);
  assert.match(css, /scrollbar-gutter: stable/);
  assert.match(css, /calc\(env\(safe-area-inset-bottom\) \+ 12px\)/);
  assert.match(css, /\.iti-fab\.is-hidden/);
  assert.match(script, /initFab/);
  assert.match(script, /lastElementChild\?\.dataset\?\.role/);
});

test('Iti IA predice búsquedas y muestra recomendados con portada', () => {
  assert.match(html, /id="itiIaPredictions"/);
  assert.match(html, /Recomendaciones de la librería/);
  assert.match(script, /ITI_STARTERS/);
  assert.match(script, /predictItiQueries/);
  assert.match(script, /iti-rec-actions/);
  assert.match(script, /findCachedBook/);
  assert.match(css, /\.iti-predictions/);
  assert.match(css, /\.iti-rec-actions/);
});

test('Iti IA acompaña con botón flotante y cada recomendado abre su ficha', () => {
  assert.match(html, /id="itiFab"[^>]*data-iti-ia-open/);
  assert.match(html, /aria-label="Preguntar a Iti IA sobre libros"/);
  assert.match(html, /id="itiFab"[^>]*>[\s\S]*?<img src="Logo\.webp"/);
  assert.match(script, /openRecommendation/);
  assert.match(script, /iti-open-book/);
  assert.match(script, /Ver ficha del libro/);
  assert.match(script, /if \(catalogCache\.length\) openBook\(catalogCache\[0\]\)/);
  assert.match(css, /\.iti-fab/);
  assert.match(css, /\.iti-open-book/);
});

test('las tarjetas muestran valoración con fuente y la ficha recomienda', () => {
  assert.match(script, /book-card__rating/);
  assert.match(script, /sourceReviewCount/);
  assert.match(script, /También te puede interesar/);
  assert.match(script, /subgenreSlug === book\.subgenreSlug/);
  assert.match(css, /\.book-card__rating/);
  assert.match(css, /\.book-detail__related/);
});

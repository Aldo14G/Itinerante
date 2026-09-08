import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  CATEGORIES,
  SUBGENRES,
  TAXONOMY_VERSION,
  isKnownCategorySlug,
  isKnownSubgenreSlug,
  parseCatalogFilters,
  subgenresOf,
  vocabularyPayload,
} from '../src/config/taxonomy.js';
import { buildTaxonomyMutations, validateTaxonomy } from '../scripts/seed-taxonomy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const taxonomy = JSON.parse(readFileSync(join(root, 'data', 'taxonomy.controlled.json'), 'utf8'));
const html = readFileSync(join(root, 'index.html'), 'utf8');

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE = 'Librería Itinerante · taxonomía controlada v1';

test('controlled taxonomy has seven canonical categories', () => {
  assert.equal(taxonomy.schemaVersion, 1);
  assert.equal(taxonomy.categories.length, 7);
  for (const category of taxonomy.categories) {
    assert.match(category.id, SLUG);
    assert.equal(category.id, category.slug);
    assert.ok(category.name && category.name.trim());
    assert.equal(category.sourceLabel, SOURCE);
  }
  const ids = taxonomy.categories.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
});

test('controlled category slugs match the index filter chips', () => {
  const chips = [...html.matchAll(/data-filter="([^"]+)"/g)].map(([, slug]) => slug);
  assert.ok(chips.includes('all'));
  for (const { slug } of taxonomy.categories) {
    assert.ok(chips.includes(slug), `chip missing for category: ${slug}`);
  }
});

test('controlled subgenres resolve to canonical categories', () => {
  const categoryIds = new Set(taxonomy.categories.map(({ id }) => id));
  assert.ok(taxonomy.subgenres.length >= taxonomy.categories.length);
  for (const subgenre of taxonomy.subgenres) {
    assert.match(subgenre.id, SLUG);
    assert.equal(subgenre.id, subgenre.slug);
    assert.ok(subgenre.name && subgenre.name.trim());
    assert.equal(subgenre.sourceLabel, SOURCE);
    assert.ok(categoryIds.has(subgenre.categoryId), `orphan subgenre: ${subgenre.id}`);
  }
  const ids = taxonomy.subgenres.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  for (const { id } of taxonomy.categories) {
    assert.ok(taxonomy.subgenres.some((sub) => sub.categoryId === id), `category without subgenres: ${id}`);
  }
});

test('taxonomy module mirrors the controlled file', () => {
  assert.equal(TAXONOMY_VERSION, taxonomy.schemaVersion);
  assert.deepEqual(CATEGORIES, taxonomy.categories);
  assert.deepEqual(SUBGENRES, taxonomy.subgenres);
  assert.ok(isKnownCategorySlug('fiction'));
  assert.ok(!isKnownCategorySlug('Fiction'));
  assert.ok(!isKnownCategorySlug('poesia'));
  assert.ok(isKnownSubgenreSlug('novela'));
  assert.ok(!isKnownSubgenreSlug('fiction'));
  assert.equal(subgenresOf('fiction').length, 3);
});

test('parseCatalogFilters enforces the controlled language', () => {
  const ok = parseCatalogFilters(new URLSearchParams('category=fiction&subgenre=novela'));
  assert.deepEqual(ok, { filters: { categorySlug: 'fiction', subgenreSlug: 'novela' } });
  assert.deepEqual(parseCatalogFilters(new URLSearchParams('')), { filters: { categorySlug: undefined, subgenreSlug: undefined } });

  const badCategory = parseCatalogFilters(new URLSearchParams('category=Fiction'));
  assert.equal(badCategory.error.code, 'unknown-category');
  const badSubgenre = parseCatalogFilters(new URLSearchParams('subgenre=novela-de-amor'));
  assert.equal(badSubgenre.error.code, 'unknown-subgenre');
  const mismatch = parseCatalogFilters(new URLSearchParams('category=essay&subgenre=novela'));
  assert.equal(mismatch.error.code, 'category-subgenre-mismatch');
});

test('vocabulary payload exposes the canonical slugs', () => {
  const vocabulary = vocabularyPayload();
  assert.equal(vocabulary.version, 1);
  assert.equal(vocabulary.categories.length, 7);
  assert.ok(vocabulary.subgenres.length >= 7);
  assert.ok(vocabulary.categories.every(({ slug }) => isKnownCategorySlug(slug)));
});

test('catalog route validates slugs and publishes the vocabulary', () => {
  const route = readFileSync(join(root, 'src', 'app', 'api', 'catalog', 'route.ts'), 'utf8');
  assert.match(route, /parseCatalogFilters\(searchParams\)/);
  assert.match(route, /status:\s*400/);
  assert.match(route, /vocabulary:\s*vocabularyPayload\(\)/);
});

test('taxonomy seed builds inventory-safe upserts', () => {
  const mutations = buildTaxonomyMutations(validateTaxonomy(taxonomy));
  assert.equal(mutations.length, 2);
  assert.match(mutations[0], /category_upsertMany/);
  assert.match(mutations[1], /subgenre_upsertMany/);
  assert.match(mutations[0], /"fiction"/);
  assert.match(mutations[1], /categoryId:"fiction"/);
  assert.doesNotMatch(mutations.join('\n'), /embedding|searchText|datasetKey/);
});

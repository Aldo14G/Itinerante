import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchReferences } from '../src/lib/reference-search.js';
import { validateCatalog } from '../scripts/import-books.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const catalog = read('../imports/kaggle-goodreads/normalized.reference.json');
const cases = read('./fixtures/reference-queries.json');

test('twenty fixed reference retrieval cases (technical evidence, not editorial approval)', () => {
  assert.equal(cases.length, 20);
  for (const sample of cases) {
    const matches = searchReferences(catalog, sample.query, { includeCandidates: true, ...sample.options });
    const ids = matches.map(({ book }) => book.id);
    if (sample.empty) assert.deepEqual(ids, [], sample.query);
    if (sample.top) assert.equal(ids[0], sample.top, sample.query);
    for (const id of sample.expected ?? []) assert.ok(ids.includes(id), `${sample.query}: missing ${id}`);
    for (const id of sample.absent ?? []) assert.ok(!ids.includes(id), `${sample.query}: unexpected ${id}`);
    if (sample.language) assert.ok(matches.every(({ book }) => book.language === sample.language), sample.query);
    if (sample.field) assert.ok(matches.every(({ matchedFields }) => matchedFields.includes(sample.field)), sample.query);
  }
});

test('candidate references cannot enter inventory import or default retrieval', () => {
  assert.throws(() => validateCatalog(catalog));
  assert.deepEqual(searchReferences(catalog, 'Rulfo'), []);
  assert.throws(() => searchReferences({ ...catalog, catalogKind: 'inventory' }, 'Rulfo'));
  const corrupted = structuredClone(catalog);
  for (const book of corrupted.books) book.catalogKind = 'inventory';
  assert.deepEqual(searchReferences(corrupted, 'Rulfo', { includeCandidates: true }), []);
});

test('language and subject filters run before limit and ignore unknown editions', () => {
  const options = { includeCandidates: true, limit: 1, language: 'es', subject: 'poesia' };
  const matches = searchReferences(catalog, 'Octavio Paz', options);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].book.language, 'es');
  assert.ok(matches[0].book.subjects.some((s) => s.subgenreId === 'poesia'));
  const unknownLanguage = structuredClone(catalog);
  unknownLanguage.books.find((book) => book.id === 'goodreads-1293796').language = 'und';
  assert.deepEqual(searchReferences(unknownLanguage, 'Tinisima', { ...options, subject: undefined }), []);
  assert.deepEqual(searchReferences(catalog, 'filosofia en ingles', options), []);
});

test('source-backed enrichment finds coauthors and literary subjects without admitting candidates', () => {
  const options = { includeCandidates: true };
  for (const [query, id] of [['Silvia Salinas', 'goodreads-25623'], ['Bruce Powers', 'goodreads-385544']]) {
    const first = searchReferences(catalog, query, options)[0];
    assert.equal(first.book.id, id);
    assert.ok(first.matchedFields.includes('author'));
  }
  const tinisima = searchReferences(catalog, 'Tinisima', { ...options, language: 'es', subject: 'novela' });
  assert.equal(tinisima[0].book.id, 'goodreads-1293796');
  assert.deepEqual(searchReferences(catalog, 'Tinisima', { ...options, language: 'und' }), []);
  for (const [query, id] of [['Garro conflictos sindicales', 'goodreads-1034888'], ['Bertoni enfermedad', 'goodreads-7511615']]) {
    const match = searchReferences(catalog, query, options)[0];
    assert.equal(match.book.id, id);
    assert.ok(match.matchedFields.includes('description'));
    assert.equal(match.book.reviewStatus, 'candidate');
    assert.equal(match.book.source.raw.description, '');
    assert.deepEqual(searchReferences(catalog, query), []);
  }
});

test('search has bounded input, deterministic ties, and no stop-word-only matches', () => {
  for (const options of [{ limit: 0 }, { limit: 101 }, { language: 'Spanish' }, { subject: 'made-up' }, { category: 'made-up' }, { category: 'essay', subject: 'poesia' }]) {
    assert.throws(() => searchReferences(catalog, 'Rulfo', options));
  }
  assert.throws(() => searchReferences(catalog, 'a'.repeat(501)));
  for (const query of ['', '   ', 'de la el']) assert.deepEqual(searchReferences(catalog, query, { includeCandidates: true }), []);
  const options = { includeCandidates: true, limit: 100 };
  assert.deepEqual(searchReferences(catalog, 'poesia', options), searchReferences({ ...catalog, books: [...catalog.books].reverse() }, 'poesia', options));
});

test('editorial quarantine blocks conflicting editions even with candidate opt-in', () => {
  const options = { includeCandidates: true };
  for (const query of ['9789736753985', '9780465031566', 'La noche de San Juan', 'El fin del poder']) {
    assert.deepEqual(searchReferences(catalog, query, options), [], query);
  }
  assert.deepEqual(searchReferences(catalog, 'Arte poética', { ...options, language: 'es' }), []);
  assert.equal(searchReferences(catalog, 'Arte poética', { ...options, language: 'mul' })[0].book.id, 'goodreads-10602457');
  assert.ok(searchReferences(catalog, 'David Naimon', options)[0].matchedFields.includes('author'));
  const editors = searchReferences(catalog, 'Allen Josephs', options);
  assert.ok(editors.length > 0);
  assert.ok(editors.every(({ matchedFields }) => matchedFields.includes('contributor') && !matchedFields.includes('author')));
});

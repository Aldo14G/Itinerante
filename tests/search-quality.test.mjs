import test from 'node:test';
import { strict as assert } from 'node:assert';
import { localSearchTerms, normalizeSearchText, rankTestBooks } from '../src/lib/local-test-search.js';

function book(slug, title, author, category, subgenre, tags = [], description = '') {
  return {
    slug,
    title,
    description,
    contributors: [{ author: { fullName: author } }],
    subgenre: { slug: subgenre, name: subgenre, category: { slug: category, name: category } },
    tags,
    sourceRank: 99,
  };
}

const fixtures = [
  book('terror-montana', 'Terror en la montaña', 'Ana Ruiz', 'fiction', 'novela', ['terror', 'horror']),
  book('distopia-roja', 'Distopía roja', 'Luis Paz', 'fiction', 'novela', ['distopia']),
  book('manga-luna', 'La luna dibujada', 'Ken Ito', 'children', 'manga', ['manga', 'ilustrado']),
  book('negra-ciudad', 'Ciudad negra', 'María Sol', 'fiction', 'novela', ['policial', 'misterio']),
  book('habitos', 'Atomic Habits', 'James Clear', 'psychology', 'productividad', ['habitos', 'productividad']),
];

test('consultas vacías o de puro ruido no devuelven nada', () => {
  assert.deepEqual(rankTestBooks('', fixtures), []);
  assert.deepEqual(rankTestBooks('de la y', fixtures), []);
});

test('el rescate por prefijo salva errores de dedo sin tocar exactos', () => {
  const rescued = rankTestBooks('terorr', fixtures);
  assert.ok(rescued.some((item) => item.slug === 'terror-montana'), 'terorr debe rescatar Terror en la montaña');
  const exact = rankTestBooks('terror', fixtures);
  assert.equal(exact[0].slug, 'terror-montana');
});

test('el rescate por prefijo no usa traducciones añadidas por expansión', () => {
  const unrelated = [{
    slug: 'verity',
    title: 'Verity',
    genre: 'Psychological Thriller',
    contributors: [{ author: { fullName: 'Veronica Roth' } }],
    tags: [],
  }];
  assert.deepEqual(rankTestBooks('poesia', unrelated), []);
});

test('nuevas expansiones cubren distopía, manga y novela negra', () => {
  assert.ok(rankTestBooks('distopía', fixtures).some((item) => item.slug === 'distopia-roja'));
  assert.ok(rankTestBooks('manga', fixtures).some((item) => item.slug === 'manga-luna'));
  assert.ok(rankTestBooks('novela negra', fixtures).some((item) => item.slug === 'negra-ciudad'));
});

test('los goldens existentes no cambian de vocabulario', () => {
  const terms = localSearchTerms('ciencia ficcion');
  assert.ok(!terms.includes('physics'), 'ciencia ficción no debe activar física general');
  assert.ok(terms.includes('science') && terms.includes('fiction'));
  assert.equal(normalizeSearchText('Psicología'), 'psicologia');
});

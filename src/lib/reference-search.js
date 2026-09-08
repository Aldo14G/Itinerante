import { normalizeSearchText } from './local-test-search.js';
import { CATEGORIES, SUBGENRES } from '../config/taxonomy.js';

const STOP_WORDS = new Set(['a', 'con', 'de', 'del', 'el', 'en', 'la', 'las', 'los', 'por', 'un', 'una', 'y']);
const LANGUAGES = { espanol: 'es', ingles: 'en' };

/** Local bibliographic evaluation. Candidates require explicit opt-in; no inventory fallback. */
export function searchReferences(catalog, query, options = {}) {
  if (catalog?.catalogKind !== 'reference') throw new Error('Expected reference catalog');
  if (typeof query !== 'string' || query.length > 500) throw new Error('Invalid reference query');
  const { category, subject, limit = 20, includeCandidates = false } = options;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid limit');
  if (category && !CATEGORIES.some(({ id }) => id === category)) throw new Error('Unknown category');
  if (subject && !SUBGENRES.some(({ id }) => id === subject)) throw new Error('Unknown subject');
  if (category && subject && !SUBGENRES.some((s) => s.id === subject && s.categoryId === category)) throw new Error('Subject does not belong to category');
  if (options.language && !['es', 'en', 'mul', 'und'].includes(options.language)) throw new Error('Unknown language');
  let language = options.language;
  let normalized = normalizeSearchText(query);
  const languageHint = normalized.match(/\ben (espanol|ingles)\b/);
  if (languageHint) {
    const inferred = LANGUAGES[languageHint[1]];
    if (language && language !== inferred) return [];
    language = inferred;
    normalized = normalized.replace(languageHint[0], '').trim();
  }
  const terms = [...new Set(normalized.split(/\s+/).filter((term) => term && !STOP_WORDS.has(term)))];
  if (!terms.length) return [];
  const queryIsbn = query.replace(/[\s-]/g, '').toUpperCase();
  const isIsbn = /^(?:[0-9]{13}|[0-9]{9}[0-9X])$/.test(queryIsbn);

  // ponytail: scan the small staged subset; move the same field contract to DB search when expanded.
  return catalog.books.filter((book) => book.catalogKind === 'reference'
    && (book.reviewStatus === 'reviewed' || (includeCandidates === true && book.reviewStatus === 'candidate'))
    && (!language || book.language === language)
    && (!category || book.subjects.some((item) => item.categoryId === category))
    && (!subject || book.subjects.some((item) => item.subgenreId === subject)))
    .map((book) => {
      // Unspecified collaborators remain discoverable without silently becoming authors.
      const fields = {
        title: [book.title, 12],
        author: [book.contributors.filter((p) => p.roles.includes('author')).map((p) => p.name).join(' '), 10],
        contributor: [book.contributors.filter((p) => !p.roles.includes('author')).map((p) => p.name).join(' '), 6],
        subject: [book.subjects.map((s) => s.name).join(' '), 5],
        description: [book.description ?? '', 1],
      };
      const entries = Object.entries(fields).map(([name, [value, weight]]) => {
        const text = normalizeSearchText(value);
        return { name, text, weight, words: new Set(text.split(/\s+/)) };
      });
      if (isIsbn) return { book, score: book.isbn13 === queryIsbn || book.isbn10 === queryIsbn ? 1000 : 0, matchedFields: ['isbn'] };
      if (!terms.every((term) => entries.some(({ words }) => words.has(term)))) return { book, score: 0 };
      const matches = entries.filter(({ words }) => terms.some((term) => words.has(term)));
      const score = matches.reduce((sum, field) => sum
        + terms.filter((term) => field.words.has(term)).length * field.weight
        + (field.text === normalized && ['title', 'author'].includes(field.name) ? 200 : 0), 0);
      return { book, score, matchedFields: matches.map(({ name }) => name) };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.book.id.localeCompare(b.book.id))
    .slice(0, limit);
}

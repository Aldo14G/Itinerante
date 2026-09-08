"""Run: python -B -m unittest discover -s tests -p test_goodreads.py"""
import copy
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('etl_goodreads', ROOT / 'scripts/etl-goodreads.py')
etl = importlib.util.module_from_spec(spec)
spec.loader.exec_module(etl)


class GoodreadsNormalization(unittest.TestCase):
  @classmethod
  def setUpClass(cls):
    cls.source = json.loads((etl.BASE / 'bibliographic-candidates.json').read_text(encoding='utf-8'))
    cls.taxonomy = json.loads((ROOT / 'data/taxonomy.controlled.json').read_text(encoding='utf-8'))
    cls.catalog, cls.quality = etl.build()

  def test_reproducible_projection_and_commercial_isolation(self):
    self.assertEqual(84, len(self.catalog['books']))
    expected = json.loads((etl.BASE / 'normalized.reference.json').read_text(encoding='utf-8'))
    self.assertEqual(expected, self.catalog)
    source = copy.deepcopy(self.source)
    source['books'].reverse()
    reordered = etl.normalize_candidates(source, self.taxonomy)
    self.assertEqual([b['id'] for b in self.catalog['books']], [b['id'] for b in reordered['books']])
    for book in self.catalog['books']:
      self.assertIn(book['reviewStatus'], ('candidate', 'quarantined'))
      self.assertFalse({'stockQty', 'priceMxnCents', 'status', 'condition', 'coverUrl', 'verifiedAt'} & book.keys())
      self.assertEqual(self.source['books'][book['source']['candidateIndex']], book['source']['raw'])
      self.assertTrue(all(subject['status'] == 'proposed' for subject in book['subjects']))

  def test_isbn_checks_preserve_uncertainty(self):
    for value in ['9999999999999', '0000000000000', '0000000000', '9780306406158', 'abc9780306406157']:
      self.assertIsNone(etl.isbn(value))
    self.assertEqual('9780306406157', etl.isbn('978-0-306-40615-7'))
    self.assertEqual('0306406152', etl.isbn('0-306-40615-2'))
    self.assertEqual(80, self.quality['validIsbn13'])

  def test_roles_and_truncation(self):
    people, issues = etl.contributors('Nombre, Persona (Editor, Foreword), Otra, more…')
    self.assertEqual(3, len(people))
    self.assertEqual(['editor', 'foreword'], people[1]['roles'])
    self.assertEqual(['contributor'], people[2]['roles'])
    self.assertIn('contributors-truncated', issues)
    self.assertIn('contributor-role-unresolved', issues)
    people, _ = etl.contributors('Paulo Coelho (Goodreads Author)')
    self.assertEqual('Paulo Coelho', people[0]['name'])
    self.assertEqual('first-position-provisional', people[0]['roleBasis'])
    with self.assertRaises(ValueError):
      etl.contributors('Persona (Editor')

  def test_source_duplicates_and_identity_conflicts_fail_closed(self):
    source = copy.deepcopy(self.source)
    duplicate = copy.deepcopy(source['books'][0])
    duplicate['bookId'] = '38787.different_slug'
    source['books'].append(duplicate)
    with self.assertRaisesRegex(ValueError, 'Duplicate source identity'):
      etl.normalize_candidates(source, self.taxonomy)
    source['books'][-1]['bookId'] = '../unsafe'
    with self.assertRaisesRegex(ValueError, 'Invalid Goodreads'):
      etl.normalize_candidates(source, self.taxonomy)

  def test_unknown_language_missing_description_and_genres(self):
    books = {b['id']: b for b in self.catalog['books']}
    staged = {b['id']: b for b in etl.normalize_candidates(self.source, self.taxonomy)['books']}
    self.assertEqual('en', books['goodreads-38787']['language'])
    self.assertEqual('und', staged['goodreads-1293796']['language'])
    self.assertEqual('es', books['goodreads-1293796']['language'])
    self.assertIsNone(staged['goodreads-1034888']['description'])
    self.assertTrue(books['goodreads-1034888']['description'])
    self.assertEqual('novela', books['goodreads-1034888']['subjects'][0]['subgenreId'])
    self.assertEqual(2, self.quality['missingDescription'])
    self.assertIn('psychology-scope-unreviewed', books['goodreads-67006']['reviewIssues'])
    self.assertIn('poetry-theatre-overlap', books['goodreads-916114']['reviewIssues'])
    self.assertFalse(any(s['subgenreId'] == 'literatura-mexicana' for b in books.values() for s in b['subjects']))

  def test_editorial_changes_preserve_raw_and_reject_stale_or_unsafe_decisions(self):
    reviews = json.loads((etl.BASE / 'editorial-review.json').read_text(encoding='utf-8'))
    books = {b['id']: b for b in self.catalog['books']}
    self.assertEqual({'candidate': 82, 'quarantined': 2}, self.quality['reviewStatusCounts'])
    self.assertEqual('mul', books['goodreads-10602457']['language'])
    self.assertEqual('Spanish', books['goodreads-10602457']['source']['raw']['language'])
    self.assertEqual(['editor'], books['goodreads-237815']['contributors'][1]['roles'])
    self.assertEqual(['author'], books['goodreads-50627133']['contributors'][1]['roles'])
    self.assertNotIn('contributor-role-unresolved', books['goodreads-237815']['reviewIssues'])
    self.assertEqual(0, self.quality['publicationEligible'])
    for field, value in [('rawSha256', '0' * 64), ('status', 'reviewed'), ('evidence', [])]:
      invalid = copy.deepcopy(reviews)
      invalid['records'][0][field] = value
      with self.subTest(field=field), self.assertRaises(ValueError):
        etl.apply_editorial_reviews(etl.normalize_candidates(self.source, self.taxonomy), invalid, self.taxonomy)
    for field, value in [('before', 'en'), ('field', 'priceMxnCents'), ('after', 'invalid')]:
      invalid = copy.deepcopy(reviews)
      invalid['records'][0]['changes'][0][field] = value
      with self.subTest(change=field), self.assertRaises(ValueError):
        etl.apply_editorial_reviews(etl.normalize_candidates(self.source, self.taxonomy), invalid, self.taxonomy)
    invalid = copy.deepcopy(reviews)
    invalid['records'].append(copy.deepcopy(invalid['records'][0]))
    with self.assertRaisesRegex(ValueError, 'duplicate editorial identity'):
      etl.apply_editorial_reviews(etl.normalize_candidates(self.source, self.taxonomy), invalid, self.taxonomy)

  def test_editorial_enrichment_requires_evidence_and_existing_taxonomy(self):
    reviews = json.loads((etl.BASE / 'editorial-review.json').read_text(encoding='utf-8'))
    original = next(r for r in reviews['records'] if r['id'] == 'goodreads-1034888')
    invalid_cases = [
      (0, 'evidenceUrls', []),
      (0, 'evidenceUrls', ['https://unrelated.example/']),
      (0, 'basis', 'copied-text'),
      (0, 'after', '<script>unsafe</script>'),
      (0, 'after', 'x' * 501),
      (1, 'after', [{**original['changes'][1]['after'][0], 'categoryId': 'psychology'}]),
      (1, 'after', [{**original['changes'][1]['after'][0], 'subgenreId': 'invented'}]),
      (1, 'after', [{**original['changes'][1]['after'][0], 'status': 'reviewed'}]),
      (1, 'after', original['changes'][1]['after'] * 2),
    ]
    for index, key, value in invalid_cases:
      review = copy.deepcopy(original)
      review['changes'][index][key] = value
      with self.subTest(index=index, key=key, value=value), self.assertRaises(ValueError):
        etl.apply_editorial_reviews(etl.normalize_candidates(self.source, self.taxonomy),
          {'schemaVersion': 1, 'records': [review]}, self.taxonomy)


if __name__ == '__main__':
  unittest.main()

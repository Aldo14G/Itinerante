"""Apply evidence-backed bibliographic reviews to a separate local projection."""
import argparse
import copy
import importlib.util
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('etl_goodreads', ROOT / 'scripts/etl-goodreads.py')
etl = importlib.util.module_from_spec(spec)
spec.loader.exec_module(etl)
require = etl.require
FIELDS = {'title', 'language', 'isbn13', 'publisher', 'description', 'contributors', 'subjects', 'pages', 'format', 'edition'}
CORE = {'title', 'language', 'isbn13', 'publisher', 'description', 'contributors', 'subjects'}


def fingerprint(value):
  return etl.digest(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode())


def text(value):
  return isinstance(value, str) and bool(value.strip())


def validate_evidence(items):
  require(isinstance(items, list) and items, 'Evidence is required')
  for item in items:
    url = urlsplit(item['url'])
    require(url.scheme == 'https' and url.hostname and not url.username and not url.password, 'Evidence requires HTTPS URL')
    require(item['kind'] in ('publisher', 'library', 'publisher-excerpt'), 'Unsupported evidence authority')
    require(text(item['summary']), 'Evidence summary is required')
    require(date.fromisoformat(item['accessedOn']) <= date.today(), 'Evidence date is in the future')
    require(item['scope'] in ('isbn', 'work'), 'Invalid evidence scope')
    require(isinstance(item['fields'], list) and set(item['fields']) <= FIELDS, 'Unknown evidence field')


def apply_reviews(catalog, manifest, taxonomy):
  require(catalog['catalogKind'] == 'reference', 'Only reference catalogs can be reviewed')
  require(manifest['schemaVersion'] == 1, 'Unsupported review schema')
  require(manifest['sourceCsvSha256'] == catalog['source']['csvSha256'], 'Source snapshot changed')
  require(manifest['taxonomySha256'] == catalog['source']['taxonomySha256'], 'Taxonomy changed')
  require(catalog['source']['taxonomySha256'] == etl.digest((ROOT / 'data/taxonomy.controlled.json').read_bytes()), 'Regenerate normalization for current taxonomy')
  terms = {item['id']: item for item in taxonomy['subgenres']}
  output = copy.deepcopy(catalog)
  books = {book['id']: book for book in output['books']}
  require(len(books) == len(output['books']), 'Duplicate normalized identity')
  require(all(book['reviewStatus'] == 'candidate' for book in books.values()), 'Reviews must start from normalized candidates')
  seen, changes = set(), []
  for review in manifest['reviews']:
    book_id = review['bookId']
    require(book_id in books and book_id not in seen, 'Unknown or duplicate review identity')
    seen.add(book_id)
    book = books[book_id]
    require(review['baseSha256'] == fingerprint(book), f'Review is stale: {book_id}')
    require(review['decision'] in ('reviewed', 'candidate', 'quarantined'), 'Invalid review decision')
    require(review['scope'] == 'isbn-bibliographic-reference', 'Unsupported review scope')
    require(text(review['reviewer']) and text(review['reason']), 'Reviewer and reason are required')
    require(date.fromisoformat(review['reviewedOn']) <= date.today(), 'Review date is in the future')
    validate_evidence(review['evidence'])
    review_data = review.get('data', {})
    if review['decision'] == 'reviewed':
      require(set(review_data) == FIELDS, 'Reviewed projection requires exactly the bibliographic fields')
      require(all(text(review_data[f]) for f in ('title', 'publisher', 'description')), 'Missing reviewed text')
      require(review_data['language'] in ('es', 'en', 'mul'), 'Unknown edition language cannot be promoted')
      require(review_data['isbn13'] == book['isbn13'] and etl.isbn(review_data['isbn13']) == review_data['isbn13'], 'Review cannot substitute another ISBN edition')
      require(review_data['pages'] is None or (type(review_data['pages']) is int and review_data['pages'] > 0), 'Invalid reviewed page count')
      require(all(review_data[f] is None or text(review_data[f]) for f in ('format', 'edition')), 'Invalid optional metadata')
      covered = set()
      for evidence in review['evidence']:
        if evidence['scope'] == 'isbn':
          require(evidence['isbn13'] == review_data['isbn13'], 'Evidence belongs to another ISBN')
          covered.update(evidence['fields'])
        require(evidence['accessedOn'] <= review['reviewedOn'], 'Review predates evidence')
      required = CORE | {f for f in FIELDS - CORE if review_data[f] is not None}
      require(required <= covered, 'Every promoted field needs ISBN-scoped evidence')
      require(review_data['contributors'] and review_data['subjects'], 'Reviewed contributors and subjects are required')
      people = []
      for order, person in enumerate(review_data['contributors']):
        require(set(person) == {'name', 'roles'} and text(person['name']), 'Invalid reviewed contributor')
        require(isinstance(person['roles'], list) and person['roles'] and set(person['roles']) <= set(etl.ROLES.values()), 'Unresolved reviewed contributor role')
        people.append({**person, 'ord': order, 'matchingKey': etl.normalize(person['name']), 'roleBasis': 'reviewed'})
      require(any('author' in person['roles'] for person in people), 'Reviewed author is required')
      require(len({person['matchingKey'] for person in people}) == len(people), 'Duplicate contributor in review')
      subjects = []
      for subject in review_data['subjects']:
        require(set(subject) == {'subgenreId', 'kind'} and subject['subgenreId'] in terms, 'Unknown reviewed subject')
        require(subject['kind'] in ('form', 'topic', 'tradition'), 'Unknown subject kind')
        term = terms[subject['subgenreId']]
        subjects.append({**subject, 'name': term['name'], 'categoryId': term['categoryId'], 'status': 'reviewed'})
      require(len({(s['subgenreId'], s['kind']) for s in subjects}) == len(subjects), 'Duplicate reviewed subject')
      curated = {**review_data, 'contributors': people, 'subjects': subjects}
      changes.append({'bookId': book_id, 'fields': {field: {'before': book[field], 'after': value}
                      for field, value in curated.items() if book[field] != value}})
      book.update(copy.deepcopy(curated))
      book['reviewIssues'] = []
    else:
      require(not review_data, 'Deferred or quarantined reviews cannot alter normalized fields')
    book['reviewStatus'] = review['decision']
    book['review'] = {k: copy.deepcopy(v) for k, v in review.items() if k != 'data'}
  output['reviewStatus'] = 'mixed'
  output['reviewManifestSha256'] = fingerprint(manifest)
  counts = {status: sum(b['reviewStatus'] == status for b in books.values()) for status in ('reviewed', 'candidate', 'quarantined')}
  report = {'counts': counts, 'changes': changes,
            'unreviewedIds': [b['id'] for b in books.values() if b['reviewStatus'] != 'reviewed'],
            'scope': 'ISBN-level source checks by the named reviewer; not a reprint, inventory or publication approval.'}
  return output, report


def main():
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument('--check', action='store_true')
  args = parser.parse_args()
  # Reuse the original ETL gate; a detached or edited normalization cannot bypass it.
  normalized, _ = etl.build()
  require(json.loads((etl.BASE / 'normalized.reference.json').read_text(encoding='utf-8')) == normalized, 'Normalization is stale')
  manifest = json.loads((ROOT / 'data/reference-reviews.json').read_text(encoding='utf-8'))
  taxonomy = json.loads((ROOT / 'data/taxonomy.controlled.json').read_text(encoding='utf-8'))
  catalog, report = apply_reviews(normalized, manifest, taxonomy)
  for name, value in [('reviewed.reference.json', catalog), ('review-report.json', report)]:
    target = etl.BASE / name
    content = (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()
    if args.check:
      require(target.exists() and target.read_bytes() == content, f'Stale review output: {name}')
    else:
      target.write_bytes(content)
  print(json.dumps(report['counts']))


if __name__ == '__main__':
  main()

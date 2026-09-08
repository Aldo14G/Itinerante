"""Normalize the staged Goodreads snapshot locally. No network or database writes."""
import argparse
import ast
import csv
import copy
import hashlib
import importlib.util
import io
import json
import re
import sys
import unicodedata
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'imports/kaggle-goodreads'
helpers_spec = importlib.util.spec_from_file_location(
  'source_quality', ROOT / 'imports/kaggle-books-es/profile.py')
helpers = importlib.util.module_from_spec(helpers_spec)
helpers_spec.loader.exec_module(helpers)
normalize, isbn_valid = helpers.normalize, helpers.isbn_valid
DATASET = 'kaggle-goodreads-best-books'
ROLES = {
  'author': 'author', 'translator': 'translator', 'editor': 'editor',
  'foreword': 'foreword', 'introduction': 'introduction', 'introduccion': 'introduction',
  'afterword': 'afterword', 'epilogue': 'afterword', 'illustrator': 'illustrator',
  'ilustracion': 'illustrator', 'ilustraciones': 'illustrator',
  'series editor': 'series_editor', 'contributor': 'contributor',
}


def require(condition, message):
  if not condition:
    raise ValueError(message)


def digest(value):
  return hashlib.sha256(value).hexdigest()


def clean(value):
  require(isinstance(value, str), 'Expected source text')
  return unicodedata.normalize('NFC', value).strip() or None


def isbn(value):
  candidate = re.sub(r'[\s-]', '', value).upper()
  if len(set(candidate)) <= 1 or not isbn_valid(candidate):
    return None
  if len(candidate) == 13 and not candidate.startswith(('978', '979')):
    return None
  return candidate


def contributors(value):
  # Source commas outside role parentheses separate contributors; never split roles into people.
  require(value.count('(') == value.count(')'), 'Unbalanced contributor roles')
  people, issues = [], []
  for order, raw in enumerate(re.split(r',\s*(?![^()]*\))', value)):
    if normalize(raw) in {'more…', 'more...', '...'}:
      issues.append('contributors-truncated')
      continue
    match = re.fullmatch(r'\s*([^()]+?)(?:\s*\(([^()]+)\))?\s*', raw)
    require(match is not None, f'Ambiguous contributor: {raw}')
    name, label = match.groups()
    name = clean(name)
    require(name is not None, 'Missing contributor name')
    badge = normalize(label) == 'goodreads author'
    declared = [normalize(role) for role in label.split(',')] if label and not badge else []
    roles = [ROLES.get(role, 'unknown') for role in declared]
    if not roles:
      roles = ['author' if order == 0 else 'contributor']
    basis = 'declared' if declared else 'first-position-provisional' if order == 0 else 'unspecified'
    if 'unknown' in roles or basis == 'unspecified':
      issues.append('contributor-role-unresolved')
    people.append({'name': name, 'matchingKey': normalize(name), 'roles': roles,
                   'ord': order, 'roleBasis': basis, 'sourceText': raw.strip()})
  return people, issues


def normalize_candidates(source, taxonomy):
  require(source.get('source', '').startswith('https://www.kaggle.com/datasets/'), 'Invalid dataset URL')
  require(re.fullmatch(r'[a-f0-9]{64}', source.get('sourceCsvSha256', '')), 'Missing CSV hash')
  require(isinstance(source.get('books'), list) and source['books'], 'No source candidates')
  mapping = taxonomy['sourceMappings'][DATASET]
  terms = {term['id']: term for term in taxonomy['subgenres']}
  for rule in mapping['aliases']:
    require(rule['subgenreId'] in terms, 'Alias references unknown controlled term')
  require(len({r['sourceLabel'] for r in mapping['aliases']}) == len(mapping['aliases']), 'Duplicate alias')
  aliases = {rule['sourceLabel']: rule for rule in mapping['aliases']}
  books, seen = [], set()
  for index, row in enumerate(source['books']):
    match = re.fullmatch(r'([1-9][0-9]*)[.-][A-Za-z0-9_.-]+', row['bookId'])
    require(match is not None, 'Invalid Goodreads source ID')
    book_id = f'goodreads-{match[1]}'
    require(book_id not in seen, f'Duplicate source identity: {book_id}')
    seen.add(book_id)
    title = clean(row['title'])
    require(title is not None, f'Missing title: {book_id}')
    genres = ast.literal_eval(row['genres']) if row['genres'] else []
    require(isinstance(genres, list) and all(isinstance(g, str) and g for g in genres), 'Invalid genres')
    people, issues = contributors(row['author'])
    require(people, f'Missing contributors: {book_id}')
    description = clean(row['description'])
    language = {'Spanish': 'es', 'English': 'en', 'Multiple languages': 'mul'}.get(row['language'], 'und')
    identifier = isbn(row['isbn'])
    if not identifier:
      issues.append('isbn-invalid-or-missing')
    if not description:
      issues.append('description-missing')
    if language == 'und':
      issues.append('language-unknown')
    if 'Poetry' in genres and any(g in genres for g in ('Plays', 'Theatre', 'Drama')):
      issues.append('poetry-theatre-overlap')
    if 'Psychology' in genres:
      issues.append('psychology-scope-unreviewed')
    if 'Philosophy' in genres and 'Fiction' in genres:
      issues.append('philosophy-fiction-overlap')
    subjects = []
    for genre in dict.fromkeys(genres):
      if genre in aliases:
        rule = aliases[genre]
        term = terms[rule['subgenreId']]
        subjects.append({'subgenreId': term['id'], 'categoryId': term['categoryId'],
                         'name': term['name'], 'kind': rule['kind'], 'sourceLabel': genre,
                         'mappingVersion': mapping['version'], 'status': 'proposed'})
    if not subjects:
      issues.append('subjects-unmapped')
    pages_text = row['pages'].strip()
    pages = int(pages_text) if re.fullmatch(r'[1-9][0-9]{0,5}', pages_text) else None
    if pages_text and pages is None:
      issues.append('pages-invalid')
    books.append({
      'id': book_id, 'slug': book_id, 'catalogKind': 'reference', 'reviewStatus': 'candidate',
      'title': title, 'description': description, 'language': language,
      'isbn10': identifier if identifier and len(identifier) == 10 else None,
      'isbn13': identifier if identifier and len(identifier) == 13 else None,
      'publisher': clean(row['publisher']), 'pages': pages,
      'format': clean(row['bookFormat']), 'edition': clean(row['edition']),
      'contributors': people, 'subjects': subjects,
      'unmappedSourceGenres': [g for g in dict.fromkeys(genres) if g not in aliases],
      'reviewIssues': sorted(set(issues)),
      'source': {
        'datasetKey': DATASET, 'sourceRecordId': row['bookId'],
        'recordUrl': f'https://www.goodreads.com/book/show/{match[1]}',
        'recordUrlKind': 'derived-from-source-id', 'recordUrlVerified': False,
        'candidateIndex': index, 'rawSha256': digest(json.dumps(row, ensure_ascii=False, sort_keys=True).encode()),
        'raw': row,
      },
    })
  books.sort(key=lambda book: book['id'])
  return {
    'schemaVersion': 1, 'catalogKind': 'reference', 'reviewStatus': 'candidate',
    'datasetKey': DATASET,
    'source': {'url': source['source'], 'csvSha256': source['sourceCsvSha256'],
               'mappingVersion': mapping['version'], 'selection': source['selection']},
    'books': books,
  }


def apply_editorial_reviews(catalog, reviews, taxonomy):
  """Apply only field-level decisions; this pass cannot admit books as reviewed."""
  require(reviews['schemaVersion'] == 1, 'Unsupported editorial review version')
  books = {book['id']: book for book in catalog['books']}
  terms = {term['id']: term for term in taxonomy['subgenres']}
  seen = set()
  for review in reviews['records']:
    book_id = review['id']
    require(book_id in books and book_id not in seen, 'Unknown or duplicate editorial identity')
    seen.add(book_id)
    book = books[book_id]
    require(review['rawSha256'] == book['source']['rawSha256'], 'Stale editorial source hash')
    require(review['status'] in ('candidate', 'quarantined'), 'Editorial admission is not implemented')
    require(review['evidence'] and review['remainingChecks'], 'Missing editorial evidence or remaining checks')
    for evidence in review['evidence']:
      require(evidence['url'].startswith('https://') and evidence['finding'].strip(), 'Invalid editorial evidence')
      require(re.fullmatch(r'\d{4}-\d{2}-\d{2}', evidence['accessedOn']), 'Missing evidence date')
    for change in review['changes']:
      field = change['field']
      require(field in ('language', 'description', 'subjects') or re.fullmatch(r'contributors\.\d+\.roles', field), 'Unsupported editorial field')
      target, key = book, field
      if field.startswith('contributors.'):
        index = int(field.split('.')[1])
        require(index < len(book['contributors']), 'Unknown contributor position')
        target, key = book['contributors'][index], 'roles'
      require(target[key] == change['before'], 'Stale editorial field value')
      after = change['after']
      if field == 'language':
        require(after in ('es', 'en', 'mul', 'und'), 'Invalid editorial language')
      elif field in ('description', 'subjects'):
        urls = change.get('evidenceUrls', [])
        require(urls and set(urls) <= {e['url'] for e in review['evidence']}, 'Missing field evidence')
        if field == 'description':
          require(change.get('basis') == 'editorial-summary', 'Missing description basis')
          require(isinstance(after, str) and 0 < len(after.strip()) <= 500 and not re.search(r'[<>\x00-\x1f]', after), 'Invalid editorial description')
        else:
          require(isinstance(after, list) and len(after) <= len(terms), 'Invalid editorial subjects')
          subject_ids = set()
          for subject in after:
            term = terms.get(subject['subgenreId'])
            require(term and subject['subgenreId'] not in subject_ids, 'Unknown or duplicate editorial subject')
            subject_ids.add(subject['subgenreId'])
            require(subject['categoryId'] == term['categoryId'] and subject['name'] == term['name'], 'Editorial subject differs from taxonomy')
            require(subject['kind'] in ('form', 'topic', 'tradition') and subject['status'] == 'proposed', 'Invalid editorial subject status or kind')
            require(subject['basis'] == 'editorial-evidence' and subject['sourceLabel'].strip(), 'Missing subject basis')
      else:
        require(isinstance(after, list) and after and all(role in ROLES.values() for role in after), 'Invalid editorial roles')
        target['roleBasis'] = 'editorial-evidence'
      target[key] = copy.deepcopy(after)
    require(set(review['resolvedIssues']) <= set(book['reviewIssues']), 'Unknown resolved issue')
    book['reviewIssues'] = sorted((set(book['reviewIssues']) - set(review['resolvedIssues'])) | set(review['addedIssues']))
    book['reviewStatus'] = review['status']
    book['editorialReview'] = copy.deepcopy(review)


def build():
  candidate_bytes = (BASE / 'bibliographic-candidates.json').read_bytes()
  source = json.loads(candidate_bytes)
  with zipfile.ZipFile(BASE / 'books.download') as archive:
    raw = archive.read('books_1.Best_Books_Ever.csv')
  require(digest(raw) == source['sourceCsvSha256'], 'CSV snapshot hash mismatch')
  # Verify the staged projection against the preserved CSV, not just its claimed hash.
  wanted = {row['bookId']: row for row in source['books']}
  matched = set()
  for row in csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))):
    candidate = wanted.get(row['bookId'])
    if candidate is not None:
      require(all(row.get(key) == value for key, value in candidate.items()), f'Source conflict: {row["bookId"]}')
      matched.add(row['bookId'])
  require(matched == set(wanted), 'Candidate missing from preserved CSV')
  taxonomy_bytes = (ROOT / 'data/taxonomy.controlled.json').read_bytes()
  catalog = normalize_candidates(source, json.loads(taxonomy_bytes))
  catalog['source'].update({'candidateSha256': digest(candidate_bytes), 'taxonomySha256': digest(taxonomy_bytes)})
  review_bytes = (BASE / 'editorial-review.json').read_bytes()
  apply_editorial_reviews(catalog, json.loads(review_bytes), json.loads(taxonomy_bytes))
  catalog['source']['editorialReviewSha256'] = digest(review_bytes)
  catalog['reviewStatus'] = 'in-review'
  books = catalog['books']
  quality = {
    'records': len(books), 'languages': dict(sorted(Counter(b['language'] for b in books).items())),
    'reviewStatusCounts': dict(sorted(Counter(b['reviewStatus'] for b in books).items())),
    'recordsWithEditorialEvidence': sum('editorialReview' in b for b in books),
    'validIsbn13': sum(b['isbn13'] is not None for b in books),
    'validIsbn10': sum(b['isbn10'] is not None for b in books),
    'missingDescription': sum(b['description'] is None for b in books),
    'issueCounts': dict(sorted(Counter(i for b in books for i in b['reviewIssues']).items())),
    'subjectProposalCounts': dict(sorted(Counter(s for b in books for s in {t['subgenreId'] for t in b['subjects']}).items())),
    'unmappedLabelCounts': dict(Counter(g for b in books for g in b['unmappedSourceGenres']).most_common()),
    'reviewQueue': [{'id': b['id'], 'title': b['title'], 'issues': b['reviewIssues']} for b in books if b['reviewIssues']],
    'publicationEligible': 0,
    'limitations': ['No records are admitted as reviewed; checksum validation is not edition verification.',
                   'Source genres propose subjects; they do not prove literary form or academic scope.',
                   'Unknown contributor roles and truncated lists require source review.',
                   'No price, stock, semantic embeddings or public integration are generated.'],
  }
  return catalog, quality


def main():
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument('--check', action='store_true', help='Verify generated files without writing')
  args = parser.parse_args()
  catalog, quality = build()
  for name, content in [('normalized.reference.json', catalog), ('normalization-quality.json', quality)]:
    target = BASE / name
    output = json.dumps(content, ensure_ascii=False, indent=2) + '\n'
    if args.check:
      require(target.exists() and target.read_bytes() == output.encode('utf-8'), f'Stale output: {target.name}')
    else:
      target.write_bytes(output.encode('utf-8'))
  print(json.dumps({k: v for k, v in quality.items() if k not in ('reviewQueue', 'unmappedLabelCounts')}, ensure_ascii=False))


if __name__ == '__main__':
  try:
    main()
  except (ValueError, KeyError, OSError) as error:
    print(str(error), file=sys.stderr)
    sys.exit(1)

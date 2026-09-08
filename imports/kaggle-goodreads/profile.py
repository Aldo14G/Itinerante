"""Profile the Kaggle source and stage a bibliographic subset; never imports inventory."""
import ast
import csv
import hashlib
import importlib.util
import io
import json
import zipfile
from collections import Counter
from pathlib import Path

BASE = Path('imports/kaggle-goodreads')
SOURCE = 'https://www.kaggle.com/datasets/thedevastator/comprehensive-overview-of-52478-goodreads-best-b'
helpers_spec = importlib.util.spec_from_file_location('source_quality', 'imports/kaggle-books-es/profile.py')
helpers = importlib.util.module_from_spec(helpers_spec)
helpers_spec.loader.exec_module(helpers)
normalize, isbn_valid = helpers.normalize, helpers.isbn_valid


def profile():
    with zipfile.ZipFile(BASE / 'books.download') as archive:
        raw = archive.read('books_1.Best_Books_Ever.csv')
    assert len(raw) == 73839808, 'Source changed or download incomplete'
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    rows = list(reader)
    seeds = ['Juan Rulfo', 'Octavio Paz', 'Rosario Castellanos', 'Elena Poniatowska',
             'Carlos Fuentes', 'Sor Juana', 'Amado Nervo', 'Jaime Sabines',
             'José Emilio Pacheco', 'Elena Garro', 'Alfonso Reyes',
             'Valeria Luiselli', 'Fernanda Melchor']
    topics = ['Poetry', 'Psychology', 'Philosophy', 'Mexican Literature']
    for row in rows:
        row['_genres'] = ast.literal_eval(row['genres']) if row['genres'] else []
        assert isinstance(row['_genres'], list) and all(isinstance(g, str) for g in row['_genres'])
        row['_author'] = normalize(row['author'])
    missing = lambda value: normalize(value) in {'', 'nan', 'null', 'none'}
    spanish = [r for r in rows if normalize(r['language']) == 'spanish']
    coverage = {name: [r for r in rows if r['_author'].startswith(normalize(name))] for name in seeds}
    sample = lambda records: [{k: r[k] for k in ['bookId', 'title', 'author', 'language', 'isbn', 'genres']}
                              for r in records[:4]]
    subset = [r for r in rows if
              (normalize(r['language']) == 'spanish' and any(t in r['_genres'] for t in topics))
              or 'Mexican Literature' in r['_genres']
              or any(r['_author'].startswith(normalize(name)) for name in seeds)]
    # Preserve each source row; duplicate resolution belongs to a reviewed import.
    fields = ['bookId', 'title', 'author', 'description', 'language', 'isbn', 'genres',
              'bookFormat', 'edition', 'pages', 'publisher', 'publishDate', 'coverImg']
    staged = [{k: r[k] for k in fields} for r in subset]
    (BASE / 'bibliographic-candidates.json').write_text(json.dumps({
        'source': SOURCE, 'sourceCsvSha256': hashlib.sha256(raw).hexdigest(),
        'purpose': 'Bibliographic discovery candidates; not store inventory; not yet imported.',
        'selection': 'Spanish Poetry/Psychology/Philosophy, Mexican Literature shelf, or one of 13 named first-contributor probes.',
        'books': staged
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    isbns = Counter(r['isbn'] for r in rows if not missing(r['isbn']))
    ids = Counter(r['bookId'] for r in rows)
    pairs = Counter((normalize(r['title']), r['_author']) for r in rows)
    result = {
        'source_url': SOURCE, 'retrieved_on': '2026-09-04', 'csv_bytes': len(raw),
        'csv_sha256': hashlib.sha256(raw).hexdigest(), 'rows': len(rows), 'columns': reader.fieldnames,
        'languages': dict(Counter(r['language'] for r in rows).most_common()),
        'missing_by_column': {k: sum(missing(r[k]) for r in rows) for k in reader.fieldnames},
        'source_id_duplicate_excess': sum(n - 1 for n in ids.values()),
        'isbn_duplicate_excess': sum(n - 1 for n in isbns.values()),
        'title_author_duplicate_excess': sum(n - 1 for n in pairs.values()),
        'valid_isbn_rows': sum(isbn_valid(r['isbn']) for r in rows),
        'isbn_sentinel_9999999999999': sum(r['isbn'] == '9999999999999' for r in rows),
        'empty_genre_lists': sum(not r['_genres'] for r in rows),
        'topic_counts': {t: sum(t in r['_genres'] for r in rows) for t in topics},
        'spanish_topic_counts': {t: sum(t in r['_genres'] for r in spanish) for t in topics},
        'spanish_topic_examples': {t: sample([r for r in spanish if t in r['_genres']]) for t in topics},
        'seed_author_counts': {name: len(records) for name, records in coverage.items()},
        'seed_author_examples': {name: sample(records) for name, records in coverage.items() if records},
        'subset_rows': len(subset),
        'subset_missing_description': sum(missing(r['description']) for r in subset),
        'subset_languages': dict(Counter(r['language'] for r in subset).most_common()),
        'subset_source_id_duplicate_excess': len(subset) - len({r['bookId'] for r in subset}),
        'limitations': [
            'Source genres are community tags, not an authoritative subject classification.',
            'Counts overlap: a book can have several genres.',
            'Seed-author counts match the first contributor only; this is a partial probe, not a nationality census.',
            'Language is the source field, not an independent language detection result.',
            'The staged subset preserves source duplicates for review and has no store price or availability.'
        ]
    }
    (BASE / 'profile.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    return result


if __name__ == '__main__':
    result = profile()
    print(json.dumps(result, ensure_ascii=False, indent=2))

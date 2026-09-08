"""Read-only source profile. Run from the Itinerante project root."""
import csv
import hashlib
import io
import json
import re
import unicodedata
import zipfile
from collections import Counter
from pathlib import Path

BASE = Path('imports/kaggle-books-es')
EXPECTED_BYTES = 23127876  # Kaggle API file listing, retrieved 2026-09-04


def normalize(value):
    return ' '.join(''.join(c for c in unicodedata.normalize('NFD', str(value or ''))
                           if unicodedata.category(c) != 'Mn').lower().split())


def isbn_valid(value):
    value = re.sub(r'[\s-]', '', str(value or '')).upper()
    if len(value) == 13 and value.isdigit():
        return sum(int(c) * (1 if i % 2 == 0 else 3) for i, c in enumerate(value)) % 10 == 0
    if len(value) == 10 and value[:9].isdigit() and (value[-1].isdigit() or value[-1] == 'X'):
        return sum((10 - i) * (10 if c == 'X' else int(c)) for i, c in enumerate(value)) % 11 == 0
    return False


def profile():
    path = BASE / 'books.download'
    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as archive:
            name = next(n for n in archive.namelist() if n.endswith('books.csv'))
            raw = archive.read(name)
    else:
        raw = path.read_bytes()
    assert len(raw) == EXPECTED_BYTES, f'Incomplete or changed source: {len(raw)} bytes'
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    rows = list(reader)
    assert rows and {'title', 'writer', 'gender', 'isbn', 'description'} <= set(reader.fieldnames)
    missing = lambda value: normalize(value) in {'', 'nan', 'null', 'none'}
    author_seeds = ['Juan Rulfo', 'Octavio Paz', 'Rosario Castellanos', 'Elena Poniatowska',
                    'Carlos Fuentes', 'Sor Juana', 'Amado Nervo', 'Jaime Sabines',
                    'José Emilio Pacheco', 'Elena Garro', 'Alfonso Reyes',
                    'Valeria Luiselli', 'Fernanda Melchor']
    genres = Counter(r['gender'] for r in rows)
    topics = {
        label: [r for r in rows if pattern in normalize(r['gender'])]
        for label, pattern in {'poesia': 'poe', 'psicologia': 'psicolog', 'filosofia': 'filosof'}.items()
    }
    authors = {name: [r for r in rows if normalize(name) in normalize(r['writer'])]
               for name in author_seeds}
    pairs = Counter((normalize(r['title']), normalize(r['writer'])) for r in rows)
    isbns = Counter(re.sub(r'[\s-]', '', r['isbn']) for r in rows if not missing(r['isbn']))
    descriptions = Counter(normalize(r['description']) for r in rows if not missing(r['description']))
    sample = lambda records: [dict(title=r['title'], writer=r['writer'], isbn=r['isbn'],
                                   gender=r['gender']) for r in records[:4]]
    result = {
        'source_url': 'https://www.kaggle.com/datasets/danielalbarracinm/books-with-isbn-of-different-genres',
        'retrieved_on': '2026-09-04', 'csv_bytes': len(raw),
        'csv_sha256': hashlib.sha256(raw).hexdigest(),
        'rows': len(rows), 'columns': reader.fieldnames,
        'missing_by_column': {k: sum(missing(r[k]) for r in rows) for k in reader.fieldnames},
        'exact_duplicate_excess': len(rows) - len({tuple(r.items()) for r in rows}),
        'title_author_duplicate_excess': sum(n - 1 for n in pairs.values()),
        'isbn_duplicate_excess': sum(n - 1 for n in isbns.values()),
        'valid_isbn_rows': sum(isbn_valid(r['isbn']) for r in rows),
        'invalid_isbn_examples': [r['isbn'] for r in rows if not isbn_valid(r['isbn'])][:10],
        'repeated_description_excess': sum(n - 1 for n in descriptions.values()),
        'description_under_80_chars': sum(len(r['description'].strip()) < 80 for r in rows),
        'genres': dict(genres.most_common()),
        'topic_counts_by_source_genre': {k: len(v) for k, v in topics.items()},
        'topic_examples': {k: sample(v) for k, v in topics.items()},
        'seed_author_counts': {k: len(v) for k, v in authors.items()},
        'seed_author_examples': {k: sample(v) for k, v in authors.items() if v},
        'limitations': [
            'Author seeds are a coverage probe, not a complete nationality classification.',
            'Title-author duplicates may be distinct editions; never delete solely on this key.',
            'A valid ISBN checksum does not verify correspondence with the book.',
            'Genre and description values have not received full editorial verification.',
            'Bibliographic records provide no evidence of Itinerante stock or price.'
        ]
    }
    (BASE / 'profile.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    return result


if __name__ == '__main__':
    assert isbn_valid('9780306406157')
    assert not isbn_valid('9780306406158')
    result = profile()
    print(json.dumps(result, ensure_ascii=False, indent=2))

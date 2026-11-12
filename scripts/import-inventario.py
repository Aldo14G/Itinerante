#!/usr/bin/env python3
"""Importa el inventario real de la librería (hoja «Catálogo Itinerante.xlsx») al catálogo del sitio.

Uso:  python3 scripts/import-inventario.py RUTA/Catálogo_Itinerante.xlsx

- Lee la hoja (columnas: Editorial, Título, Autor, Precio, Sinopsis, Género, ISBN, Foto) desde la fila 3 y salta los renglones vacíos.
- Escribe data/inventario-itinerante.json (copia fiel de la hoja, con avisos por renglón) y assets/data/catalog.json (lo que lee el sitio).
- Portadas: data/portadas.json dice de dónde sale cada una (fuente y URL, revisadas a mano); si falta su WebP en assets/img/portadas/,
  la descarga y la convierte (600 px de ancho). Un libro sin entrada en data/portadas.json usa la portada tipográfica.
- Nada se inventa: sin año, formato o páginas en la hoja, el campo queda en null y la ficha no lo muestra.
Necesita openpyxl y Pillow; la descarga usa curl.
"""
import json, os, re, subprocess, sys, unicodedata, io
import openpyxl
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COVERS = os.path.join(ROOT, 'assets', 'img', 'portadas')

GENEROS = {  # género de la hoja → (id, nombre, categoría)
    'narrativa': ('narrativa', 'Narrativa', 'literatura'),
    'poesia': ('poesia', 'Poesía', 'literatura'),
    'ensayo': ('ensayo', 'Ensayo', 'pensamiento'),
    'divulgacion': ('divulgacion', 'Divulgación', 'pensamiento'),
    'ensayo poesia': ('ensayo-poesia', 'Ensayo y poesía', 'literatura'),
    'ensayo narrativa': ('ensayo-narrativa', 'Ensayo y narrativa', 'literatura'),
}
CATEGORIAS = {'literatura': 'Literatura', 'pensamiento': 'Pensamiento y divulgación'}


def plain(s):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower().replace('/', ' ')).strip()


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', plain(s)).strip('-')


def isbn13(raw):
    d = re.sub(r'\D', '', str(raw or ''))
    if len(d) != 13: return None
    s = sum(int(c) * (1 if i % 2 == 0 else 3) for i, c in enumerate(d[:12]))
    return d if (10 - s % 10) % 10 == int(d[12]) else None


def clean(v):
    return re.sub(r'\s+', ' ', str(v)).strip() if v not in (None, '') else None


def cover(key, entry):
    path = os.path.join(COVERS, f'{key}.webp')
    if not os.path.exists(path):
        data = subprocess.run(['curl', '-sL', '--max-time', '40', '-A', 'Mozilla/5.0', entry['url']], capture_output=True, check=True).stdout
        img = Image.open(io.BytesIO(data)).convert('RGB')
        if img.width > 600: img = img.resize((600, round(img.height * 600 / img.width)), Image.LANCZOS)
        os.makedirs(COVERS, exist_ok=True)
        img.save(path, 'WEBP', quality=80, method=6)
    w, h = Image.open(path).size
    return f'assets/img/portadas/{key}.webp', w, h


def provenance(books, portadas):
    """Registra en assets/provenance.json el origen del catálogo y de cada portada publicada (tests/site.test.mjs lo exige)."""
    path = os.path.join(ROOT, 'assets', 'provenance.json')
    prov = json.load(open(path, encoding='utf-8'))
    prov.pop('sampleData', None)
    prov['catalogData'] = {
        'file': 'data/catalog.json',
        'origin': 'Catálogo Itinerante.xlsx (hoja de la librería), importada con scripts/import-inventario.py; copia fiel con avisos por renglón en data/inventario-itinerante.json',
        'note': 'Inventario real: título, autor, editorial, género, ISBN, sinopsis y precio (MXN) salen de la hoja. La existencia no se publica: se confirma por WhatsApp.'
    }
    prov['covers'] = {
        'dir': 'img/portadas/',
        'registry': 'data/portadas.json',
        'rule': 'Portadas de los libros del inventario tomadas de bases públicas (Goodreads y Amazon), revisadas a mano una por una y convertidas a WebP de 600 px de ancho como máximo. Un libro sin portada encontrada usa la portada tipográfica (catalog.js).',
        'files': [{'file': b['c'].removeprefix('assets/'), 'book': b['id'], 'isbn': portadas[b['id']].get('isbn'), 'source': portadas[b['id']]['fuente'],
                   'url': portadas[b['id']]['url'], 'reviewed': portadas[b['id']].get('revisada')} for b in books if b['c']]
    }
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(prov, f, ensure_ascii=False, indent=2); f.write('\n')


def main(xlsx):
    ws = openpyxl.load_workbook(xlsx, data_only=True).worksheets[0]
    portadas = json.load(open(os.path.join(ROOT, 'data', 'portadas.json'), encoding='utf-8'))
    rows, books, seen = [], [], {}
    for fila, row in enumerate(ws.iter_rows(min_row=3, max_col=8, values_only=True), start=3):
        ed, t, a, precio, sinopsis, genero, isbn, foto = row
        if not clean(t): continue
        rows.append({'fila': fila, 'editorial': clean(ed), 'titulo': clean(t), 'autor': clean(a), 'precio': precio, 'sinopsis': clean(sinopsis),
                     'genero': clean(genero), 'isbn': clean(isbn), 'foto': clean(foto), 'avisos': []})
    for r in rows:
        n = isbn13(r['isbn'])
        if r['isbn'] and not n: r['avisos'].append('ISBN con dígito de control inválido')
        if n: seen.setdefault(n, []).append(r['fila'])
        r['_n'] = n
    for r in rows:
        if r['_n'] and len(seen[r['_n']]) > 1: r['avisos'].append(f"ISBN repetido en las filas {seen[r['_n']]}")
        for campo in ('editorial', 'autor', 'precio', 'genero', 'isbn', 'sinopsis'):
            if r[campo] in (None, ''): r['avisos'].append(f'sin {campo}')
    # Un ISBN repetido solo lo conserva el libro al que pertenece según la base consultada (data/portadas.json); los demás quedan sin ISBN.
    owners = {v['isbn'] for v in portadas.values() if v.get('isbn')}
    for r in rows:
        key = slug(r['titulo'].split(':')[0] + ' ' + (r['autor'] or ''))[:60]
        g = GENEROS.get(plain(r['genero'] or ''))
        n = r['_n']
        if n and len(seen[n]) > 1 and (n not in owners or portadas.get(key, {}).get('isbn') != n): n = None
        c = cover(key, portadas[key]) if key in portadas else (None, None, None)
        books.append({'id': key, 't': r['titulo'], 'a': r['autor'], 'p': r['editorial'], 'y': None, 'f': None,
                      'g': g[0] if g else None, 'k': g[2] if g else None, 'n': n, 'c': c[0], 'cw': c[1], 'ch': c[2],
                      'pg': None, 'lg': 'es', 's': r['sinopsis'], 'pr': r['precio'] if isinstance(r['precio'], (int, float)) else None})
        r.pop('_n')
    ids = [b['id'] for b in books]
    assert len(ids) == len(set(ids)), 'ids repetidos'
    sub = {gid: {'n': name, 'c': cat} for gid, name, cat in GENEROS.values() if any(b['g'] == gid for b in books)}
    cat = {k: v for k, v in CATEGORIAS.items() if any(b['k'] == k for b in books)}
    meta = {'kind': 'inventario', 'source': 'Catálogo Itinerante.xlsx (hoja de la librería)', 'count': len(books), 'covers': sum(1 for b in books if b['c']), 'currency': 'MXN'}
    with open(os.path.join(ROOT, 'data', 'inventario-itinerante.json'), 'w', encoding='utf-8') as f:
        json.dump({'meta': meta, 'filas': rows}, f, ensure_ascii=False, indent=1); f.write('\n')
    with open(os.path.join(ROOT, 'assets', 'data', 'catalog.json'), 'w', encoding='utf-8') as f:
        json.dump({'meta': meta, 'categories': cat, 'subgenres': sub, 'books': books}, f, ensure_ascii=False, separators=(',', ':')); f.write('\n')
    provenance(books, portadas)
    print(f"{len(books)} libros, {meta['covers']} con portada; avisos:")
    for r in rows:
        if r['avisos']: print(f"  fila {r['fila']} «{r['titulo'][:40]}»: {'; '.join(r['avisos'])}")


if __name__ == '__main__':
    if len(sys.argv) != 2: sys.exit(__doc__)
    main(sys.argv[1])

#!/usr/bin/env python3
"""Importa el inventario real de la librería (hoja «Catálogo Itinerante.xlsx») al catálogo del sitio.

Uso:  python3 scripts/import-inventario.py RUTA/Catálogo_Itinerante.xlsx [--fotos CARPETA]

- Lee la hoja (columnas: Editorial, Título, Autor, Precio, Sinopsis, Género, ISBN, Foto (ID)) desde la fila 3 y salta los renglones vacíos.
  «Foto (ID)» trae una clave por renglón (I1, A3, «A2 (falta)»…): se copia tal cual al inventario y no se publica.
- Escribe data/inventario-itinerante.json (copia fiel de la hoja, con avisos por renglón) y assets/data/catalog.json (lo que lee el sitio).
- Portadas: data/portadas.json dice de dónde sale cada una (fuente y URL, revisadas a mano); si falta su WebP en assets/img/portadas/,
  la descarga y la convierte (600 px de ancho como máximo, nunca menos de 300). Un libro sin entrada en data/portadas.json usa la portada
  tipográfica. Para rehacer una portada se borra su WebP y se vuelve a correr.
- Fuentes de portada: «Goodreads» y «Amazon» (se baja `url`) y «Librería», la imagen que la librería subió a su carpeta de Drive
  «Fotos Catálogo» con la clave de «Foto (ID)» por nombre. Su registro lleva `foto` (la clave: I1, A3…), `drive` (el id del archivo) y,
  si hace falta quitar un borde, `recorte` [izquierda, arriba, derecha, abajo] en píxeles del original. La carpeta está compartida por
  enlace, así que se baja sin credenciales; si deja de estarlo, se bajan las fotos a mano a una carpeta (I1.jpg, A3.jpg…, o con el id
  de Drive por nombre) y se indica con --fotos CARPETA. Las originales no entran al repositorio y aquí no se guardan credenciales.
- Nada se inventa: sin año, formato o páginas en la hoja, el campo queda en null y la ficha no lo muestra.
Necesita openpyxl y Pillow; la descarga usa curl.
"""
import json, os, re, subprocess, sys, unicodedata, io
import openpyxl
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COVERS = os.path.join(ROOT, 'assets', 'img', 'portadas')
FUENTES = ('Goodreads', 'Amazon', 'Librería')
DRIVE_VER = 'https://drive.google.com/file/d/{}/view'
DRIVE_BAJAR = 'https://drive.google.com/uc?export=download&id={}'
ANCHO_MIN, ANCHO_MAX = 300, 600

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


def entero(v):
    """La hoja exportada desde Google Sheets trae los números como flotantes (250.0, 9798872431039.0): un entero se lee como entero."""
    return int(v) if isinstance(v, float) and v.is_integer() else v


def clean(v):
    return re.sub(r'\s+', ' ', str(entero(v))).strip() if v not in (None, '') else None


def clave_foto(v):
    """«A2 (falta)» → A2: la clave de «Foto (ID)» sin la nota que la acompaña."""
    m = re.match(r'[A-Za-z]+\d+', v or '')
    return m.group(0).upper() if m else None


def original(key, entry, fotos):
    """La imagen de origen de una portada: de la carpeta local (--fotos) o de la red, sin credenciales."""
    if entry['fuente'] == 'Librería' and fotos:
        for nombre in (entry['foto'], entry['drive']):
            for ext in ('.jpg', '.jpeg', '.png', '.webp'):
                path = os.path.join(fotos, nombre + ext)
                if os.path.exists(path): return open(path, 'rb').read()
        sys.exit(f"{key}: no encuentro {entry['foto']}.jpg (ni .jpeg, .png, .webp, ni el id de Drive) en {fotos}")
    url = DRIVE_BAJAR.format(entry['drive']) if entry['fuente'] == 'Librería' else entry['url']
    return subprocess.run(['curl', '-sL', '--max-time', '40', '-A', 'Mozilla/5.0', url], capture_output=True, check=True).stdout


def cover(key, entry, fotos=None):
    path = os.path.join(COVERS, f'{key}.webp')
    if not os.path.exists(path):
        try:
            img = Image.open(io.BytesIO(original(key, entry, fotos))).convert('RGB')
        except OSError:
            ayuda = ' Si la carpeta de Drive ya no está compartida por enlace, baja las fotos y usa --fotos CARPETA.' if entry['fuente'] == 'Librería' else ''
            sys.exit(f"{key}: lo que respondió la fuente ({entry['url']}) no es una imagen.{ayuda}")
        if entry.get('recorte'): img = img.crop(tuple(entry['recorte']))
        if img.width < ANCHO_MIN: sys.exit(f'{key}: la imagen mide {img.width} px de ancho; con menos de {ANCHO_MIN} se ve peor que la portada tipográfica. Quita su registro de data/portadas.json o consigue una mayor.')
        if img.width > ANCHO_MAX: img = img.resize((ANCHO_MAX, round(img.height * ANCHO_MAX / img.width)), Image.LANCZOS)
        os.makedirs(COVERS, exist_ok=True)
        img.save(path, 'WEBP', quality=80, method=6)
    w, h = Image.open(path).size
    return f'assets/img/portadas/{key}.webp', w, h


def check_portadas(portadas, rows_by_key):
    """El registro de portadas se escribe a mano: lo que no cuadra se dice antes de bajar nada."""
    for key, e in portadas.items():
        if e.get('fuente') not in FUENTES: sys.exit(f"{key}: fuente de portada desconocida ({e.get('fuente')}); valen {', '.join(FUENTES)}")
        if e['fuente'] != 'Librería': continue
        if not clave_foto(e.get('foto')) or not re.fullmatch(r'[\w-]{20,}', e.get('drive') or ''): sys.exit(f'{key}: una portada de la librería lleva `foto` (la clave de «Foto (ID)») y `drive` (el id del archivo)')
        if e.get('url') != DRIVE_VER.format(e['drive']): sys.exit(f"{key}: `url` debe ser {DRIVE_VER.format(e['drive'])}")
        hoja = clave_foto(rows_by_key.get(key, {}).get('foto'))
        if hoja and hoja != e['foto']: sys.exit(f"{key}: la hoja dice «Foto (ID)» {hoja} y data/portadas.json dice {e['foto']}")


def cover_record(b, e):
    rec = {'file': b['c'].removeprefix('assets/'), 'book': b['id'], 'isbn': e.get('isbn'), 'source': e['fuente'], 'url': e['url'], 'reviewed': e.get('revisada')}
    if e['fuente'] == 'Librería':
        rec.update({'origin': 'Imagen de la portada entregada por la librería en su carpeta de Drive «Fotos Catálogo»', 'photo': e['foto'], 'driveId': e['drive']})
        if e.get('recorte'): rec['crop'] = e['recorte']
    return rec


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
        'rule': 'Portadas de los libros del inventario, de dos orígenes: bases públicas (Goodreads y Amazon) y la carpeta de Drive de la librería («Fotos Catálogo», fuente «Librería»: la imagen que la librería subió con la clave de «Foto (ID)» de su hoja; se registra con esa clave y el id del archivo, y las originales no entran al repositorio). Todas revisadas a mano una por una, recortadas a la portada si traían borde y convertidas a WebP de 600 px de ancho como máximo (nunca menos de 300). Un libro sin portada admitida usa la portada tipográfica (catalog.js).',
        'files': [cover_record(b, portadas[b['id']]) for b in books if b['c']]
    }
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(prov, f, ensure_ascii=False, indent=2); f.write('\n')


def main(xlsx, fotos=None):
    ws = openpyxl.load_workbook(xlsx, data_only=True).worksheets[0]
    portadas = json.load(open(os.path.join(ROOT, 'data', 'portadas.json'), encoding='utf-8'))
    rows, books, seen = [], [], {}
    for fila, row in enumerate(ws.iter_rows(min_row=3, max_col=8, values_only=True), start=3):
        ed, t, a, precio, sinopsis, genero, isbn, foto = row
        if not clean(t): continue
        rows.append({'fila': fila, 'editorial': clean(ed), 'titulo': clean(t), 'autor': clean(a), 'precio': entero(precio), 'sinopsis': clean(sinopsis),
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
    for r in rows: r['_id'] = slug(r['titulo'].split(':')[0] + ' ' + (r['autor'] or ''))[:60]
    check_portadas(portadas, {r['_id']: r for r in rows})
    for r in rows:
        key = r.pop('_id')
        g = GENEROS.get(plain(r['genero'] or ''))
        n = r['_n']
        if n and len(seen[n]) > 1 and (n not in owners or portadas.get(key, {}).get('isbn') != n): n = None
        c = cover(key, portadas[key], fotos) if key in portadas else (None, None, None)
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
    args = sys.argv[1:]
    fotos = None
    if '--fotos' in args:
        i = args.index('--fotos')
        if i + 1 >= len(args) or not os.path.isdir(args[i + 1]): sys.exit('--fotos necesita una carpeta que exista')
        fotos = args[i + 1]
        del args[i:i + 2]
    if len(args) != 1: sys.exit(__doc__)
    main(args[0], fotos)

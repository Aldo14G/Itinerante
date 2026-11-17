#!/usr/bin/env python3
"""Carga la foto de un producto de la carta de Café y té (#cafe) que manda Aldo.

Uso:  python3 scripts/foto-carta.py RUTA/foto.jpg ID_DEL_PRODUCTO --alt "Texto alternativo" [--fecha AAAA-MM-DD] [--autor "…"]
      después:  npm run carta   (pinta la carta y, con 5 productos con foto o más, la galería)

- ID_DEL_PRODUCTO es el «id» de un producto de assets/data/menu.json (p. ej. latte); si no existe, falla sin tocar nada.
- --alt es obligatorio (lo que se ve en la foto, para quien no la ve); sin él, o vacío, falla.
- Recorta al centro a un cuadrado (la fila y la galería muestran la foto cuadrada), respeta la orientación EXIF del teléfono y guarda:
    assets/img/carta/<id>.webp      lado ≤ 1200 (la galería en pantallas de 2×)
    assets/img/carta/<id>-600.webp  lado ≤ 600  (la fila de la carta; build-carta.mjs la usa en srcset si existe)
  WebP calidad 80 con Pillow. No amplía: una foto más chica que 1200 se queda de su lado.
- Registra las dos en «real» de assets/provenance.json como foto real («foto aportada por Aldo», con la fecha, el recorte y el sha256 del
  original y de cada archivo) y escribe «foto»: { "src", "alt" } en el producto de menu.json. Volver a cargar la foto de un producto la sustituye.
- La ruta de la foto original no se copia al repositorio (solo su huella).
Necesita Pillow (el mismo que scripts/import-inventario.py).
"""
import argparse, datetime, hashlib, json, os, re, sys
from PIL import Image, ImageOps

ROOT = os.environ.get('ITI_RAIZ') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MENU = os.path.join(ROOT, 'assets', 'data', 'menu.json')
PROV = os.path.join(ROOT, 'assets', 'provenance.json')
CARPETA = os.path.join(ROOT, 'assets', 'img', 'carta')
LADO, LADO_CHICO, CALIDAD = 1200, 600, 80


def falla(msg):
    print(f'foto-carta: {msg}', file=sys.stderr)
    sys.exit(1)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for bloque in iter(lambda: f.read(1 << 16), b''):
            h.update(bloque)
    return h.hexdigest()


def escribe_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def main():
    ap = argparse.ArgumentParser(description='Carga la foto de un producto de la carta (Café y té).')
    ap.add_argument('foto', help='ruta de la foto que mandó Aldo')
    ap.add_argument('id', help='id del producto en assets/data/menu.json')
    ap.add_argument('--alt', required=True, help='texto alternativo (obligatorio)')
    ap.add_argument('--fecha', default=datetime.date.today().isoformat(), help='fecha de entrega (AAAA-MM-DD; por omisión, hoy)')
    ap.add_argument('--autor', default='foto aportada por Aldo', help='quién la aportó (por omisión, «foto aportada por Aldo»)')
    a = ap.parse_args()

    alt = (a.alt or '').strip()
    if not alt:
        falla('--alt no puede ir vacío: describe lo que se ve en la foto')
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', a.fecha):
        falla('--fecha va como AAAA-MM-DD')
    if not os.path.isfile(a.foto):
        falla(f'no encuentro la foto {a.foto}')
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', a.id):
        falla('el id es de minúsculas, cifras y guiones')

    with open(MENU, encoding='utf-8') as f:
        menu = json.load(f)
    producto = next((p for c in menu.get('categorias', []) for p in c.get('productos', []) if p.get('id') == a.id), None)
    if producto is None:
        falla(f'«{a.id}» no es un producto de assets/data/menu.json')

    try:
        img = ImageOps.exif_transpose(Image.open(a.foto)).convert('RGB')
    except Exception as e:  # noqa: BLE001 — cualquier archivo que Pillow no lea
        falla(f'no pude leer la foto: {e}')
    w, h = img.size
    lado = min(w, h)
    x, y = (w - lado) // 2, (h - lado) // 2
    cuadro = img.crop((x, y, x + lado, y + lado))

    os.makedirs(CARPETA, exist_ok=True)
    grande = os.path.join(CARPETA, f'{a.id}.webp')
    chica = os.path.join(CARPETA, f'{a.id}-600.webp')
    l1, l2 = min(lado, LADO), min(lado, LADO_CHICO)
    (cuadro.resize((l1, l1), Image.LANCZOS) if l1 != lado else cuadro).save(grande, 'WEBP', quality=CALIDAD, method=6)
    (cuadro.resize((l2, l2), Image.LANCZOS) if l2 != lado else cuadro).save(chica, 'WEBP', quality=CALIDAD, method=6)

    rel = lambda p: os.path.relpath(p, os.path.join(ROOT, 'assets')).replace(os.sep, '/')
    origen = sha256(a.foto)
    recorte = f'recorte cuadrado al centro de {w}x{h} (x{x} y{y}, lado {lado})'
    with open(PROV, encoding='utf-8') as f:
        prov = json.load(f)
    nuevos = {rel(grande), rel(chica)}
    prov['real'] = [r for r in prov.get('real', []) if r.get('file') not in nuevos]
    prov['real'].append({'file': rel(grande), 'origin': f'{recorte} reducido a {l1}x{l1}, Pillow, WebP calidad {CALIDAD}', 'author': a.autor, 'date': a.fecha,
                         'note': f'foto de producto de la carta de Café y té ({producto.get("nombre")}); scripts/foto-carta.py', 'sourceSha256': origen, 'sha256': sha256(grande)})
    prov['real'].append({'file': rel(chica), 'origin': f'el mismo recorte reducido a {l2}x{l2}, Pillow, WebP calidad {CALIDAD}', 'derivedFrom': rel(grande), 'author': a.autor, 'date': a.fecha,
                         'sourceSha256': origen, 'sha256': sha256(chica)})

    producto['foto'] = {'src': f'assets/{rel(grande)}', 'alt': alt}
    escribe_json(PROV, prov)
    escribe_json(MENU, menu)
    con_foto = sum(1 for c in menu['categorias'] for p in c['productos'] if p.get('foto'))
    print(f'{a.id}: assets/{rel(grande)} ({l1} px) y assets/{rel(chica)} ({l2} px), registradas en assets/provenance.json; foto escrita en menu.json.')
    print(f'Productos con foto: {con_foto} (la galería aparece desde 5). Ahora corre: npm run carta')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Carga la foto de un artículo de Merch (#merch) que manda Aldo y, si hace falta, da de alta el artículo en assets/data/merch.json.

Uso:  python3 scripts/foto-merch.py RUTA/foto.jpg ID --alt "Texto alternativo" [--nombre "…" --tipo "…"] [--precio 250] [--descripcion "…"]
                                    [--disponibilidad hay|encargo|ninguna] [--fecha AAAA-MM-DD] [--autor "…"]
      después:  npm run merch:check   (revisa el JSON y que cada foto exista y esté registrada) y node tools/preview-site.mjs para verlo

- ID es el «id» del artículo (minúsculas, cifras y guiones, p. ej. playera-logo). Si ya existe en assets/data/merch.json, se cambia su foto (y solo los
  campos que des por opción). Si NO existe, se da de alta: entonces --nombre y --tipo son obligatorios; precio, descripción y disponibilidad son opcionales y,
  sin ellos, no se imprime nada (con `precio` null no se imprime ni «$0» ni «por confirmar»). `disponibilidad` es "hay", "encargo" o ninguna (--disponibilidad
  ninguna la deja en null): el sitio NUNCA afirma existencias; la tarjeta es «Consultar disponibilidad» por WhatsApp con el producto y su precio ya escritos.
- --alt es obligatorio (lo que se ve en la foto, para quien no la ve); sin él, o vacío, falla.
- Recorta al centro a un cuadrado (la tarjeta muestra la foto cuadrada), respeta la orientación EXIF del teléfono y guarda:
    assets/img/merch/<id>.webp      lado ≤ 1200 (pantallas de 2×)
    assets/img/merch/<id>-600.webp  lado ≤ 600  (la tarjeta; merch.js la usa en srcset)
  WebP calidad 80 con Pillow. No amplía: una foto más chica que 1200 se queda de su lado.
- Registra las dos en «real» de assets/provenance.json (con la fecha, el recorte y el sha256 del original y de cada archivo) y escribe
  «foto»: { "src", "chica", "alt" } en el artículo. Volver a cargar la foto de un artículo la sustituye. La ruta de la foto original no se copia al repositorio
  (solo su huella). Mientras assets/data/merch.json no tenga artículos válidos, la sección Merch no existe; con el primero, aparece sola.
Necesita Pillow (el mismo que scripts/foto-carta.py).
"""
import argparse, datetime, hashlib, json, os, re, sys
from PIL import Image, ImageOps

ROOT = os.environ.get('ITI_RAIZ') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MERCH = os.path.join(ROOT, 'assets', 'data', 'merch.json')
PROV = os.path.join(ROOT, 'assets', 'provenance.json')
CARPETA = os.path.join(ROOT, 'assets', 'img', 'merch')
LADO, LADO_CHICO, CALIDAD = 1200, 600, 80


def falla(msg):
    print(f'foto-merch: {msg}', file=sys.stderr)
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
    ap = argparse.ArgumentParser(description='Carga la foto de un artículo de Merch y lo da de alta si no existe.')
    ap.add_argument('foto', help='ruta de la foto que mandó Aldo')
    ap.add_argument('id', help='id del artículo (minúsculas, cifras y guiones)')
    ap.add_argument('--alt', required=True, help='texto alternativo (obligatorio)')
    ap.add_argument('--nombre', help='nombre del artículo (obligatorio si es nuevo; máx. 80 caracteres)')
    ap.add_argument('--tipo', help='tipo (Playera, Taza, Bolsa…; obligatorio si es nuevo; máx. 40 caracteres)')
    ap.add_argument('--precio', type=float, help='precio en MXN (sin él, no se imprime nada)')
    ap.add_argument('--descripcion', help='descripción corta (máx. 200 caracteres)')
    ap.add_argument('--disponibilidad', choices=['hay', 'encargo', 'ninguna'], help='"hay", "encargo" o "ninguna" (null); el sitio nunca afirma existencias')
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
    if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', a.id):
        falla('el id es de minúsculas, cifras y guiones (sin guiones al principio, al final ni dobles)')

    with open(MERCH, encoding='utf-8') as f:
        merch = json.load(f)
    productos = merch.setdefault('productos', [])
    producto = next((p for p in productos if p.get('id') == a.id), None)
    nuevo = producto is None
    if nuevo:
        nombre = (a.nombre or '').strip()
        tipo = (a.tipo or '').strip()
        if not nombre or not tipo:
            falla(f'«{a.id}» no está en assets/data/merch.json: para darlo de alta hacen falta --nombre y --tipo')
        producto = {'id': a.id, 'nombre': nombre, 'tipo': tipo, 'descripcion': None, 'precio': None, 'foto': None, 'disponibilidad': None}
    if a.nombre is not None and a.nombre.strip():
        producto['nombre'] = a.nombre.strip()
    if a.tipo is not None and a.tipo.strip():
        producto['tipo'] = a.tipo.strip()
    if a.descripcion is not None:
        producto['descripcion'] = a.descripcion.strip() or None
    if a.precio is not None:
        if a.precio <= 0 or a.precio > 100000:
            falla('--precio es un número positivo (en MXN)')
        producto['precio'] = int(a.precio) if float(a.precio).is_integer() else round(a.precio, 2)
    if a.disponibilidad is not None:
        producto['disponibilidad'] = None if a.disponibilidad == 'ninguna' else a.disponibilidad
    if len(producto['nombre']) > 80 or len(producto['tipo']) > 40 or (producto.get('descripcion') and len(producto['descripcion']) > 200):
        falla('nombre (80), tipo (40) o descripción (200) pasan del máximo')

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
                         'note': f'foto de un artículo de Merch ({producto["nombre"]}); scripts/foto-merch.py', 'sourceSha256': origen, 'sha256': sha256(grande)})
    prov['real'].append({'file': rel(chica), 'origin': f'el mismo recorte reducido a {l2}x{l2}, Pillow, WebP calidad {CALIDAD}', 'derivedFrom': rel(grande), 'author': a.autor, 'date': a.fecha,
                         'sourceSha256': origen, 'sha256': sha256(chica)})

    producto['foto'] = {'src': f'assets/{rel(grande)}', 'chica': f'assets/{rel(chica)}', 'alt': alt}
    if nuevo:
        productos.append(producto)
    escribe_json(PROV, prov)
    escribe_json(MERCH, merch)
    print(f'{a.id}: {"dado de alta" if nuevo else "actualizado"}; assets/{rel(grande)} ({l1} px) y assets/{rel(chica)} ({l2} px), registradas en assets/provenance.json.')
    print(f'Artículos en assets/data/merch.json: {len(productos)} (con el primero la sección Merch aparece sola). Ahora corre: npm run merch:check')


if __name__ == '__main__':
    main()

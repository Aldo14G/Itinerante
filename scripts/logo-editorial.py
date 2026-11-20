#!/usr/bin/env python3
"""Carga el logo de una editorial para la franja del Inicio (assets/img/editoriales/) y lo registra, SOLO con el permiso de la editorial.

Uso:  python3 scripts/logo-editorial.py RUTA/logo.svg|png "Nombre de la editorial" --permiso "quién lo autorizó y cuándo" [--alt "…"] [--fecha AAAA-MM-DD] [--autor "…"]
      después:  npm run editoriales   (pinta la franja y las reglas de los logos)  y  npm test

- «Nombre de la editorial» es el que trae el catálogo (assets/data/catalog.json, campo `p`) o el de una entrada de `colaboran` en assets/data/editoriales.json
  (mayúsculas y acentos no importan). La franja solo muestra esas: si ninguna coincide, el script falla.
- --permiso es OBLIGATORIO y no puede ir vacío: quién de la editorial (o de quién tenga sus derechos) autorizó que el logo aparezca en el sitio, y cuándo
  (p. ej. «correo de Fulana, editora, 2026-12-03»). Los logos de terceras marcas NO se descargan ni se copian de internet. Sin permiso, el script falla y no escribe nada.
- Entrada: SVG (se revisa que no traiga scripts, eventos ni referencias externas y que tenga viewBox; se guarda tal cual, así que pide el SVG ya recortado al logo, sin
  márgenes) o PNG/WebP CON TRANSPARENCIA (se recorta a lo que se ve, se pasa a una silueta —solo cuenta la transparencia— y se guarda como WebP de hasta 168 px de alto).
  Un archivo opaco (fondo blanco, JPG) falla: pide la versión con fondo transparente.
- La franja pinta el logo como silueta monocroma con mask-image (color = tinta suave del tema; sirve en claro y en oscuro): no hace falta una versión por tema.
- Escribe assets/img/editoriales/<clave>.svg|webp, la entrada «logos» de assets/data/editoriales.json ({ logo, alt, ancho, alto }) y registra el archivo en
  assets/provenance.json → «logos» con el permiso, la fecha y las huellas. La ruta del original no se copia al repositorio (solo su huella).
Necesita Pillow (el mismo que scripts/foto-carta.py). Para pruebas, ITI_RAIZ cambia la raíz del repositorio.
"""
import argparse, datetime, hashlib, json, os, re, shutil, sys, unicodedata
from PIL import Image

ROOT = os.environ.get('ITI_RAIZ') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGO = os.path.join(ROOT, 'assets', 'data', 'catalog.json')
EDITORIALES = os.path.join(ROOT, 'assets', 'data', 'editoriales.json')
PROV = os.path.join(ROOT, 'assets', 'provenance.json')
CARPETA = os.path.join(ROOT, 'assets', 'img', 'editoriales')
ALTO_MAX = 168        # 28 px de franja-logo-alto a 6x
ASPECTO = (0.5, 8.0)  # ancho / alto aceptables


def falla(msg):
    print(f'logo-editorial: {msg}', file=sys.stderr)
    sys.exit(1)


def clave(nombre):
    """El mismo editorialKey de catalog.js: sin acentos, minúsculas, espacios simples."""
    s = unicodedata.normalize('NFD', str(nombre))
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower().strip()
    return re.sub(r'\s+', ' ', s)


def slug(nombre):
    return re.sub(r'^-+|-+$', '', re.sub(r'[^a-z0-9]+', '-', clave(nombre)))


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for bloque in iter(lambda: f.read(1 << 16), b''):
            h.update(bloque)
    return h.hexdigest()


def lee_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def escribe_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def revisa_svg(path):
    """Devuelve (ancho, alto) enteros del viewBox, o falla si el SVG trae algo que no debe."""
    with open(path, encoding='utf-8', errors='replace') as f:
        txt = f.read()
    malo = re.search(r'<script|<foreignObject|<iframe|<object|<embed|<image\b|\son[a-z]+\s*=|javascript:|(?:href|src)\s*=\s*["\']?\s*(?:https?:|data:|//)|@import|url\(\s*["\']?\s*(?:https?:|data:|//)', txt, re.I)
    if malo:
        falla(f'el SVG trae «{malo.group(0).strip()}»: no se acepta (scripts, eventos, imágenes o referencias externas). Pide un SVG limpio, solo con trazos.')
    m = re.search(r'viewBox\s*=\s*["\']\s*([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)[\s,]+([-\d.eE+]+)\s*["\']', txt)
    if not m:
        falla('el SVG no tiene viewBox: sin él no se sabe su proporción. Pide un SVG con viewBox.')
    w, h = float(m.group(3)), float(m.group(4))
    if w <= 0 or h <= 0:
        falla('el viewBox del SVG no tiene área')
    k = 1000 / h if h < 100 else 1  # la proporción es lo que cuenta: se guarda en enteros
    return max(1, round(w * k)), max(1, round(h * k))


def main():
    ap = argparse.ArgumentParser(description='Carga el logo de una editorial para la franja del Inicio (solo con permiso).')
    ap.add_argument('archivo', help='logo en SVG, o PNG/WebP con transparencia')
    ap.add_argument('editorial', help='nombre de la editorial, como en el catálogo')
    ap.add_argument('--permiso', required=True, help='quién de la editorial lo autorizó y cuándo (obligatorio)')
    ap.add_argument('--alt', help='texto alternativo; por omisión «Logotipo de <editorial>»')
    ap.add_argument('--fecha', default=datetime.date.today().isoformat(), help='fecha de entrega (AAAA-MM-DD; por omisión, hoy)')
    ap.add_argument('--autor', help='quién lo aportó (por omisión, «logo aportado por Aldo con permiso de <editorial>»)')
    a = ap.parse_args()

    permiso = (a.permiso or '').strip()
    if len(permiso) < 8:
        falla('--permiso no puede ir vacío: escribe quién de la editorial autorizó el logo y cuándo. Sin permiso no se publica ningún logo.')
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', a.fecha):
        falla('--fecha va como AAAA-MM-DD')
    if not os.path.isfile(a.archivo):
        falla(f'no encuentro el archivo {a.archivo}')
    nombre = re.sub(r'\s+', ' ', a.editorial).strip()
    k = clave(nombre)
    if not k or not slug(nombre):
        falla('el nombre de la editorial va vacío')
    libros = lee_json(CATALOGO).get('books', [])
    registradas = {clave(b.get('p', '')): re.sub(r'\s+', ' ', b.get('p', '')).strip() for b in libros if isinstance(b.get('p'), str) and b.get('p').strip()}
    if k not in registradas and os.path.isfile(EDITORIALES):  # 2026-11-20: también las editoriales y espacios de `colaboran` (assets/data/editoriales.json)
        for c in lee_json(EDITORIALES).get('colaboran', []):
            n = re.sub(r'\s+', ' ', c.get('nombre', '')).strip() if isinstance(c, dict) and isinstance(c.get('nombre'), str) else ''
            if n and clave(n) == k:
                registradas[k] = n
    if k not in registradas:
        falla(f'«{nombre}» no es una editorial de assets/data/catalog.json ni de `colaboran` en assets/data/editoriales.json: la franja solo muestra esas. Las que hay: {", ".join(sorted(registradas.values()))}')
    nombre = registradas[k]
    alt = (a.alt or f'Logotipo de {nombre}').strip()
    if not alt or len(alt) > 120:
        falla('--alt va de 1 a 120 caracteres')

    ext = os.path.splitext(a.archivo)[1].lower()
    os.makedirs(CARPETA, exist_ok=True)
    destino = os.path.join(CARPETA, f'{slug(nombre)}.{"svg" if ext == ".svg" else "webp"}')
    if ext == '.svg':
        ancho, alto = revisa_svg(a.archivo)
        origen_txt = 'SVG entregado, revisado (sin scripts, eventos ni referencias externas) y guardado tal cual'
        shutil.copyfile(a.archivo, destino)
    else:
        try:
            img = Image.open(a.archivo).convert('RGBA')
        except Exception as e:  # noqa: BLE001 — cualquier archivo que Pillow no lea
            falla(f'no pude leer el logo: {e}')
        alfa = img.getchannel('A')
        total = img.size[0] * img.size[1]
        transparentes = sum(1 for v in alfa.getdata() if v < 250)
        if transparentes < total * 0.02:
            falla('el logo no tiene transparencia (fondo opaco): la franja lo pinta como silueta y un fondo blanco saldría como un rectángulo. Pide el PNG o el SVG con fondo transparente.')
        caja = alfa.point(lambda v: 255 if v > 8 else 0).getbbox()
        if not caja:
            falla('el logo está vacío (todo transparente)')
        recorte = img.crop(caja)
        w, h = recorte.size
        if h > ALTO_MAX:
            recorte = recorte.resize((max(1, round(w * ALTO_MAX / h)), ALTO_MAX), Image.LANCZOS)
            w, h = recorte.size
        # Solo cuenta la transparencia: la silueta sale de la máscara, el color lo pone el tema. Se guarda en negro para que no se filtre ningún color.
        silueta = Image.new('RGBA', recorte.size, (0, 0, 0, 0))
        silueta.putalpha(recorte.getchannel('A'))
        silueta.save(destino, 'WEBP', lossless=True, quality=100, method=6)
        ancho, alto = w, h
        origen_txt = f'recorte a lo visible ({caja[2] - caja[0]}x{caja[3] - caja[1]} dentro de {img.size[0]}x{img.size[1]}), reducido a {w}x{h} si hacía falta, silueta sobre transparente (Pillow, WebP sin pérdida)'
    ratio = ancho / alto
    if not (ASPECTO[0] <= ratio <= ASPECTO[1]):
        os.remove(destino)
        falla(f'el logo mide {ancho}:{alto} (proporción {ratio:.2f}); la franja admite de {ASPECTO[0]} a {ASPECTO[1]}. Pide una versión horizontal.')

    rel = os.path.relpath(destino, os.path.join(ROOT, 'assets')).replace(os.sep, '/')
    prov = lee_json(PROV)
    prov['logos'] = [r for r in prov.get('logos', []) if r.get('file') != rel]
    prov['logos'].append({
        'file': rel, 'origin': origen_txt, 'editorial': nombre, 'permiso': permiso, 'author': a.autor or f'logo aportado por Aldo con permiso de {nombre}', 'date': a.fecha,
        'note': 'logo de una editorial para la franja del Inicio; scripts/logo-editorial.py', 'sourceSha256': sha256(a.archivo), 'sha256': sha256(destino)
    })
    cfg = lee_json(EDITORIALES) if os.path.isfile(EDITORIALES) else {'excluir': [], 'logos': {}}
    cfg.setdefault('logos', {})[k] = {'logo': f'assets/{rel}', 'alt': alt, 'ancho': ancho, 'alto': alto}
    escribe_json(PROV, prov)
    escribe_json(EDITORIALES, cfg)
    print(f'{nombre}: logo guardado en assets/{rel} ({ancho}x{alto}), registrado en assets/provenance.json con el permiso «{permiso}» y dado de alta en assets/data/editoriales.json.')
    print('Ahora corre: npm run editoriales   (pinta la franja con el logo en lugar del nombre) y npm test')


if __name__ == '__main__':
    main()

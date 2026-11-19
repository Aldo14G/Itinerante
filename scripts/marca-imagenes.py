#!/usr/bin/env python3
"""Imagen para compartir (og:image) e iconos del manifiesto, hechos con el logo y una foto real de la casa (2026-11-19).

Uso:  python3 scripts/marca-imagenes.py [--fecha AAAA-MM-DD]

Escribe (sobrescribe) y registra en assets/provenance.json:
  assets/img/compartir.jpg   1200 × 630, JPEG progresivo: a la izquierda el logo (Logo.webp, 768 × 768) reducido a 630 × 630 y a la derecha un recorte de
                             la foto real de la sala (assets/img/inicio-sala-5x4.webp, la del inicio) a 570 × 630. Sin texto añadido: el nombre ya va en el logo.
  assets/img/icono-192.png   192 × 192 y 512 × 512, el logo de Logo.webp reducido (manifest.webmanifest)
  assets/img/icono-512.png
Nada se amplía (el logo y la foto se reducen). Necesita Pillow. No usa red.
La imagen se publica como og:image solo cuando hay dominio (scripts/set-dominio.mjs; docs/DOMINIO.md).
"""
import argparse, datetime, hashlib, json, os, sys
from PIL import Image

ROOT = os.environ.get('ITI_RAIZ') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROV = os.path.join(ROOT, 'assets', 'provenance.json')
LOGO = os.path.join(ROOT, 'Logo.webp')
FOTO = os.path.join(ROOT, 'assets', 'img', 'inicio-sala-5x4.webp')
SAL = os.path.join(ROOT, 'assets', 'img')


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 16), b''):
            h.update(b)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--fecha', default=datetime.date.today().isoformat())
    a = ap.parse_args()
    for p in (LOGO, FOTO):
        if not os.path.isfile(p):
            print(f'marca-imagenes: falta {p}', file=sys.stderr); sys.exit(1)

    logo = Image.open(LOGO).convert('RGB')
    foto = Image.open(FOTO).convert('RGB')
    assert logo.size[0] >= 630 and logo.size[1] >= 630, 'el logo es más chico que 630: no se amplía'

    # compartir.jpg: logo 630 × 630 | foto 570 × 630 (recorte al centro de la foto, reducido)
    W, H, LW = 1200, 630, 630
    lienzo = Image.new('RGB', (W, H), (122, 196, 180))
    lienzo.paste(logo.resize((LW, H), Image.LANCZOS), (0, 0))
    fw, fh = foto.size
    ancho = round(fh * (W - LW) / H)           # recorte con la proporción 570 : 630
    x0 = (fw - ancho) // 2
    recorte = foto.crop((x0, 0, x0 + ancho, fh))
    assert recorte.size[0] >= W - LW, 'la foto es más chica que el hueco: no se amplía'
    lienzo.paste(recorte.resize((W - LW, H), Image.LANCZOS), (LW, 0))
    destino = os.path.join(SAL, 'compartir.jpg')
    lienzo.save(destino, 'JPEG', quality=88, optimize=True, progressive=True)

    iconos = []
    for lado in (192, 512):
        p = os.path.join(SAL, f'icono-{lado}.png')
        logo.resize((lado, lado), Image.LANCZOS).save(p, 'PNG', optimize=True)
        iconos.append((lado, p))

    with open(PROV, encoding='utf-8') as f:
        prov = json.load(f)
    rel = lambda p: os.path.relpath(p, os.path.join(ROOT, 'assets')).replace(os.sep, '/')
    sha_foto, sha_logo = sha256(FOTO), sha256(LOGO)
    prov['real'] = [r for r in prov.get('real', []) if r.get('file') != 'img/compartir.jpg']
    prov['real'].append({
        'file': 'img/compartir.jpg',
        'origin': f'imagen para compartir 1200x630 (og:image): el logo (Logo.webp, 768x768) reducido a {LW}x{H} a la izquierda y un recorte centrado de {ancho}x{fh} de la foto real de la sala (img/inicio-sala-5x4.webp) reducido a {W - LW}x{H} a la derecha; Pillow, LANCZOS, JPEG calidad 88; scripts/marca-imagenes.py',
        'derivedFrom': ['Logo.webp', 'img/inicio-sala-5x4.webp'], 'author': 'logo de la librería y foto de la casa ya registrada (img/inicio-sala-5x4.webp)', 'date': a.fecha,
        'sourceSha256': sha_foto, 'logoSha256': sha_logo, 'sha256': sha256(destino)})
    prov['brand'] = [r for r in prov.get('brand', []) if not str(r.get('file', '')).startswith('img/icono-')]
    for lado, p in iconos:
        prov['brand'].append({'file': rel(p), 'origin': f'Logo.webp (768 x 768) reducido a {lado} x {lado} (Pillow, LANCZOS, PNG); icono del manifiesto web (manifest.webmanifest); scripts/marca-imagenes.py',
                              'derivedFrom': 'Logo.webp', 'date': a.fecha, 'sha256': sha256(p)})
    with open(PROV, 'w', encoding='utf-8') as f:
        f.write(json.dumps(prov, ensure_ascii=False, indent=2) + '\n')
    print(f'compartir.jpg {os.path.getsize(destino) // 1024} KB; iconos {", ".join(str(l) for l, _ in iconos)}; registrados en assets/provenance.json')


if __name__ == '__main__':
    main()

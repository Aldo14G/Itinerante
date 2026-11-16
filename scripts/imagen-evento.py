#!/usr/bin/env python3
"""Convierte el cartel o la foto de un evento a WebP para el sitio.

Uso:  python3 scripts/imagen-evento.py ENTRADA SALIDA.webp

- Lado mayor de 1200 px como máximo (no agranda); nunca recorta: se conserva la proporción del cartel.
- Calidad 82. Respeta la orientación EXIF. Una imagen con transparencia la conserva.
- Solo JPEG, PNG, WebP y GIF (el primer cuadro). Cualquier otra cosa, o un archivo que no abre, termina con código 1 y un motivo.
- Imprime «ANCHOxALTO» de la imagen resultante.
Necesita Pillow. La usa scripts/sync-hoja.mjs; no toca nada fuera de SALIDA.
"""
import os
import sys

from PIL import Image, ImageOps, UnidentifiedImageError

LADO_MAX = 1200
CALIDAD = 82
FORMATOS = {'JPEG', 'PNG', 'WEBP', 'GIF'}


def convertir(entrada, salida):
    try:
        img = Image.open(entrada)
        formato = img.format
        if formato not in FORMATOS:
            raise ValueError(f'formato {formato} no admitido (usa JPEG, PNG o WebP)')
        img.load()
    except UnidentifiedImageError:
        raise ValueError('el archivo no es una imagen')
    img = ImageOps.exif_transpose(img)
    con_alfa = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
    img = img.convert('RGBA' if con_alfa else 'RGB')
    if max(img.size) > LADO_MAX:
        escala = LADO_MAX / max(img.size)
        img = img.resize((max(1, round(img.width * escala)), max(1, round(img.height * escala))), Image.LANCZOS)
    os.makedirs(os.path.dirname(os.path.abspath(salida)), exist_ok=True)
    img.save(salida, 'WEBP', quality=CALIDAD, method=6)
    return img.size


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    try:
        ancho, alto = convertir(sys.argv[1], sys.argv[2])
    except Exception as err:  # el motivo va a stderr; sync-hoja.mjs lo pasa al informe
        print(f'{err}', file=sys.stderr)
        sys.exit(1)
    print(f'{ancho}x{alto}')

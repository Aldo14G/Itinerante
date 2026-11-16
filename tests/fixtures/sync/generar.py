#!/usr/bin/env python3
"""Genera los datos de prueba de la sincronización con la hoja (todo ficticio; nada de esto entra a assets/ ni a data/).

Uso:  python3 tests/fixtures/sync/generar.py CARPETA [--libros N] [--desde K] [--eventos-primero] [--con-eventos]

- inventario.xlsx: N libros inventados (de «Libro de ejemplo 01» en adelante, desde el K-ésimo) con ISBN válidos, en el formato de la hoja de la
  librería (títulos en las filas 1-2, libros desde la fila 3). --con-eventos añade después una pestaña «Eventos» con basura que el importador no
  debe leer; --eventos-primero la pone antes de la de libros.
- Sin --libros: 12 libros, un cartel de ejemplo y el archivo eventos.json de la carpeta (los usa `node scripts/sync-hoja.mjs --seco --fixtures tests/fixtures/sync`).
"""
import json, os, sys
import openpyxl
from PIL import Image

def isbn(n):
    base = f'978000000{n:03d}'
    s = sum(int(c) * (1 if i % 2 == 0 else 3) for i, c in enumerate(base))
    return base + str((10 - s % 10) % 10)

def libros(carpeta, n=12, desde=1, eventos_primero=False, con_eventos=False):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Catálogo'
    ws.append(['Catálogo de ejemplo (datos inventados para las pruebas)'])
    ws.append(['Editorial', 'Título', 'Autor', 'Precio', 'Sinopsis', 'Género', 'ISBN', 'Foto'])
    gen = ['Narrativa', 'Poesía', 'Ensayo']
    for i in range(desde, desde + n):
        ws.append(['Editorial de Prueba', f'Libro de ejemplo {i:02d}', f'Autora Ficticia {i:02d}', 250, f'Sinopsis inventada del libro {i}.', gen[i % 3], isbn(i), None])
    if con_eventos:
        ev = wb.create_sheet('Eventos', 0 if eventos_primero else None)
        ev.append(['Título', 'Fecha'])
        ev.append(['No es un libro', '2026-11-21'])
    os.makedirs(carpeta, exist_ok=True)
    wb.save(os.path.join(carpeta, 'inventario.xlsx'))

def serial(y, m, d):
    import datetime
    return (datetime.date(y, m, d) - datetime.date(1899, 12, 30)).days

def eventos(carpeta):
    enc = ['Título', 'Publicar', 'Fecha', 'Hora', 'Fin', 'Tipo', 'Con', 'Invitado', 'Colabora', 'Ciclo', 'Descripción', 'Costo', 'Reserva', 'Cartel', 'Encuadre', 'Alt', 'Día']
    filas = [
        enc,
        ['Tarde de ejemplo', 'sí', serial(2026, 11, 21), 0.7895833333333333, 0.8333333333333334, 'Lectura', 'Persona Ficticia', 'Invitada Inventada', None, 'Letras de ejemplo',
         'Evento inventado para probar la sincronización.', '$90 MXN entrada\n$120 MXN con libro', 'https://lu.ma/evento-de-ejemplo', 'cartel-ejemplo-0001', 'cartel', None, 'sábado'],
        ['Propuesta de ejemplo', None, None, None, None, 'Taller', None, None, None, None, 'Una propuesta sin fecha, inventada.', None, None, None, None, None, None],
        ['Taller con reserva por teléfono', 'SI', '28/11/2026', '6:30 p.m.', None, 'Taller', None, None, None, None, 'Reserva por WhatsApp (el teléfono es de ejemplo).', '$150 MXN', '81 0000-0000', None, None, None, None],
        ['Fecha y día no coinciden', 'sí', serial(2026, 11, 21), '18:00', None, 'Charla', None, None, None, None, 'Esta fila debe rechazarse.', None, None, None, None, None, 'lunes'],
        ['Evento oculto', 'no', serial(2026, 12, 5), '17:00', None, None, None, None, None, None, 'No se publica.', None, None, None, None, None, None],
        ['Sin descripción', 'sí', serial(2026, 12, 12), '17:00', None, None, None, None, None, None, None, None, None, None, None, None, None],
    ]
    with open(os.path.join(carpeta, 'eventos.json'), 'w', encoding='utf-8') as f:
        json.dump({'range': 'Eventos!A1:Q7', 'majorDimension': 'ROWS', 'values': filas}, f, ensure_ascii=False, indent=1); f.write('\n')
    os.makedirs(os.path.join(carpeta, 'carteles'), exist_ok=True)
    img = Image.new('RGB', (480, 480), (236, 228, 214))
    for x in range(40, 440):
        for y in range(200, 240): img.putpixel((x, y), (40, 60, 70))
    img.save(os.path.join(carpeta, 'carteles', 'cartel-ejemplo-0001.png'))

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    carpeta = a[0]
    def opt(nombre, defecto=None):
        return int(a[a.index(nombre) + 1]) if nombre in a else defecto
    libros(carpeta, opt('--libros', 12), opt('--desde', 1), '--eventos-primero' in a, '--con-eventos' in a)
    if '--libros' not in a: eventos(carpeta)

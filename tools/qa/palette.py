import colorsys, glob, json, os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def hsl(rgb):
    r, g, b = [v / 255 for v in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return round(h * 360), round(s * 100), round(l * 100)

def dominant(path, k=6):
    im = Image.open(path).convert('RGB')
    im.thumbnail((200, 200))
    q = im.quantize(colors=k, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[: k * 3]
    counts = sorted(q.getcolors(), reverse=True)
    out = []
    total = sum(c for c, _ in counts)
    for c, idx in counts:
        rgb = tuple(pal[idx * 3: idx * 3 + 3])
        out.append((round(100 * c / total), rgb))
    return out

def hexs(rgb):
    return '#%02x%02x%02x' % rgb

print('== COLORES DOMINANTES DE LAS PAREDES (fotos del espacio) ==')
photos = ['oficial-mesa-800.webp', 'oficial-rincon-800.webp', '03-home-sala-central-800.webp', '01-entrada-pasillo-800.webp', '04-experiencia-libreros-800.webp', '05-talleres-ajedrez-800.webp']
acc_s = []
for p in photos:
    path = os.path.join(ROOT, 'assets', 'img', p)
    d = dominant(path)
    line = ' '.join(f'{pc}%{hexs(rgb)}(S{hsl(rgb)[1]})' for pc, rgb in d[:5])
    print(f'{p:36s} {line}')
    for pc, rgb in d:
        h, s, l = hsl(rgb)
        if 15 <= l <= 85:
            acc_s.append((pc, s))
tot = sum(pc for pc, _ in acc_s)
print('saturación media ponderada de los tonos medios de las fotos: S ≈', round(sum(pc * s for pc, s in acc_s) / tot), '%')

print('\n== PALETA ACTUAL (tokens) ==')
tokens = json.load(open(os.path.join(ROOT, 'design', 'tokens.json'), encoding='utf-8'))['themes']['b4']
base = tokens['color']
named = {
    'blanco (light.night)': tokens['tones']['light']['night'],
    'bruma (mist.night)': tokens['tones']['mist']['night'],
    'profundo (deep.night)': tokens['tones']['deep']['night'],
    'papel (paper)': base['paper'],
    'turquesa Cartelera (turq)': base['turq'],
    'turquesa llamado (tungsten)': base['tungsten'],
    'turquesa profundo acento (light.tungsten)': tokens['tones']['light']['tungsten'],
    'turquesa texto (light.turq)': tokens['tones']['light']['turq'],
    'noche hero (night)': base['night'],
}
for n, hx in named.items():
    rgb = tuple(int(hx[i:i + 2], 16) for i in (1, 3, 5))
    h, s, l = hsl(rgb)
    flag = '  <-- saturado' if s >= 45 and 25 <= l <= 80 else ''
    print(f'{n:36s} {hx}  H{h} S{s}% L{l}%{flag}')

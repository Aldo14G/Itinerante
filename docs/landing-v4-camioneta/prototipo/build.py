#!/usr/bin/env python3
"""Genera index.html estático (contenido completo sin JS) desde plantilla.html + estilos.css.part + datos.js.
Equivale a lo que en producción hará el render del servidor (SSR/estático). Uso: python3 build.py [AAAA-MM-DD]"""
import json, re, sys, html, unicodedata, datetime, urllib.parse
from zoneinfo import ZoneInfo
s = open('datos.js').read(); D = json.loads(s[s.index('{'):s.rindex('}') + 1])
svg = open('camioneta-trazo.svg').read()
VB = re.search(r'viewBox="([^"]+)"', svg).group(1); PD = re.search(r' d="([^"]+)"', svg).group(1)
hoy = sys.argv[1] if len(sys.argv) > 1 else datetime.datetime.now(ZoneInfo('America/Monterrey')).date().isoformat()
e = lambda x: html.escape(str(x if x is not None else ''), quote=True)
precio = lambda n: '' if n is None else f'${n} MXN'
cov = lambda c: c.replace('/portadas/', '/portadas-400/') if c else c
N = D['negocio']; TEL = N['telefono']; libros = D['books']; conP = [b for b in libros if b.get('c')]
# Destacados: lista de datos (en producción src/frente/destacados.json, la define la librería).
# Mientras no exista, el prototipo usa una selección PROVISIONAL y mecánica: los 8 primeros con portada en el orden de la hoja de inventario.
destacados = conP[:8]
CENTRO = min(3, len(destacados) - 1)
# Géneros: las colecciones reales del repo (assets/data/collections.json), no inventadas.
COLS = json.load(open('../_ref/repo-main/assets_data_collections.json'))['collections']
def cols_de(b): return [c['id'] for c in COLS if b.get('g') in c['filtro']['g']]
norm = lambda t: unicodedata.normalize('NFD', t or '').encode('ascii', 'ignore').decode().lower()
# Hero: carga
ids = ['los-que-se-fueron-los-que-llegaron-javier-cravioto-padilla', 'los-habitantes-francisco-trejo-carlomagno-sol-jasmin-cacheux', 'lo-que-el-doc-quiso-decir-antonio-zamudio', 'las-ruinas-de-la-caza-alfredo-leal']
poses = [[2, -8], [24, 4], [46, -3], [68, 7]]
carga = ''.join(f'<img src="{cov(b["c"])}" alt="" width="400" height="600" style="left:{poses[i][0]}%;transform:rotate({poses[i][1]}deg)" data-r="{poses[i][1]}">' for i, id_ in enumerate(ids) for b in libros if b['id'] == id_)
# Eventos
DIAS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']; MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
prox = sorted([x for x in D['eventos'] if not x.get('fecha') or x['fecha'] >= hoy], key=lambda x: x.get('fecha') or '9')
ev = []
for i, x in enumerate(prox):
    if x.get('fecha'):
        f = datetime.date.fromisoformat(x['fecha']); ftxt = f'{DIAS[f.weekday()]} {f.day} {MESES[f.month - 1]}'; cartel = 'cartel--menta'
    else:
        ftxt = x.get('recurrencia') or ''; cartel = 'cartel--noche'
    cta = (f'<a class="boton boton--tinta" href="{e(x["registroUrl"])}" target="_blank" rel="noopener">Registrarme <svg aria-hidden="true"><use href="#i-sale"/></svg></a>' if x.get('registroUrl')
           else f'<a class="boton boton--borde" href="{e(x["instagramUrl"])}" target="_blank" rel="noopener">Ver en Instagram <svg aria-hidden="true"><use href="#i-sale"/></svg></a>')
    datos = [f'<p class="dato hora-dato"><svg aria-hidden="true"><use href="#i-reloj"/></svg>{e(x.get("hora") or "Hora por anunciar")}</p>']
    if x.get('organizador'): datos.append(f'<p class="dato"><svg aria-hidden="true"><use href="#i-persona"/></svg>Con {e(x["organizador"])}</p>')
    datos.append(f'<p class="dato"><svg aria-hidden="true"><use href="#i-lugar"/></svg>{e(x.get("lugar"))}</p>')
    if x.get('incluye'): datos.append(f'<p class="dato"><svg aria-hidden="true"><use href="#i-check"/></svg>Incluye {e(x["incluye"].lower())}</p>')
    ev.append(f'''<article class="parada{' destacada' if i == 0 and x.get('fecha') else ''}" data-fecha="{e(x.get('fecha') or '')}">
      <div class="fecha"><i></i>{e(ftxt)}</div>
      <div class="tarjeta-evento">
        <div><h3>{e(x['titulo'])}</h3>{''.join(datos)}</div>
        <div class="cartel {cartel}" aria-hidden="true"><svg><use href="#camioneta"/></svg></div>
        <div class="acciones"><span class="precio">{e(x.get('costo') or '')}</span>{cta}</div>
      </div></article>''')
if not ev: ev = [f'<p class="vacio">Sin fechas publicadas por ahora. La agenda sale primero en <a href="{e(N["instagram"])}">Instagram</a>.</p>']
hay_fechado = any(x.get('fecha') for x in prox)
CTA = ('<a class="boton boton--tinta" id="cta-portada" href="#eventos">Ver eventos <svg aria-hidden="true"><use href="#i-flecha"/></svg></a>' if hay_fechado
       else '<a class="boton boton--tinta" id="cta-portada" href="#destacados">Ver libros <svg aria-hidden="true"><use href="#i-flecha"/></svg></a>')
# Vitrina: solo ±3 alrededor del centro con src; el resto data-src (carga diferida)
piezas = ''.join(f'<div class="pieza" data-i="{i}" data-id="{e(b["id"])}"><div class="cara"><img {"src" if abs(i - CENTRO) <= 3 else "data-src"}="{cov(b["c"])}" alt="" draggable="false" loading="lazy" decoding="async" width="400" height="600"></div></div>' for i, b in enumerate(destacados))
def ficha_v(b): return f'<h3>{e(b["t"])}</h3><p>{e(b["a"])}{" · " + e(b["p"]) if b.get("p") else ""}{" · <span class=\"precio\">" + precio(b["pr"]) + "</span>" if b.get("pr") is not None else ""}</p>'
# Píldoras de filtro (patrón SeccionColecciones de la plantilla): todos los valores reales, con conteo, multiselección.
def pildoras(campo, valores):
    return ''.join(f'<button type="button" class="pildora" data-campo="{campo}" data-v="{e(v)}" aria-pressed="false"><span>{e(t)}</span> <small>{n}</small></button>' for v, t, n in valores)
PILL_G = pildoras('genero', [(c['id'], c['titulo'], sum(1 for b in libros if c['id'] in cols_de(b))) for c in COLS])
eds = {}
for b in libros:
    if b.get('p'): eds[b['p']] = eds.get(b['p'], 0) + 1
PILL_P = pildoras('editorial', [(p, p.replace(' Casa Editorial', ''), n) for p, n in sorted(eds.items(), key=lambda kv: norm(kv[0]))])
# Estante: con portada primero, luego editorial y título (orden de presentación, no curaduría)
orden = sorted(libros, key=lambda b: (b.get('c') is None, b.get('p') is None, norm(b.get('p')), norm(b['t'])))
def libro(b):
    msg = f'Hola, ¿tienen disponible «{b["t"]}» de {b["a"]}' + (f' ({precio(b["pr"])})' if b.get('pr') is not None else '') + '?'
    cara = (f'<img src="{cov(b["c"])}" alt="" loading="lazy" decoding="async" width="400" height="600">' if b.get('c')
            else f'<div class="sin-portada" aria-hidden="true"><span>{e(b.get("p") or "")}</span><svg><use href="#camioneta"/></svg></div>')
    meta = ' · '.join(x for x in [e(b['a']), e(b.get('p') or '')] if x)
    pr = f'<p class="precio">{precio(b["pr"])}</p>' if b.get('pr') is not None else ''
    return (f'<li data-id="{e(b["id"])}" data-genero="{" ".join(cols_de(b))}" data-editorial="{e(b.get("p") or "")}"><article class="libro">'
            f'<div class="portada-libro">{cara}</div>'
            f'<h3><a href="https://wa.me/{TEL}?text={urllib.parse.quote(msg)}" target="_blank" rel="noopener">{e(b["t"])}</a></h3>'
            f'<p class="meta">{meta}</p>{pr}</article></li>')
contacto = [('i-msj', 'WhatsApp', f'https://wa.me/{TEL}'), ('i-tel', f'Tel. {N["telefonoVisible"]}', f'tel:+{TEL}'), ('i-camara', 'Instagram', N['instagram']),
            ('i-pagina', 'Facebook', N['facebook']), ('i-correo', N['correo'], f'mailto:{N["correo"]}'), ('i-forma', 'Rentar el espacio', 'https://forms.gle/RDaEfgVitEFbDnyU7')]
rep = {
    'CSS': open('estilos.css.part').read(), 'VB': VB, 'CARGA': carga, 'LINEA': e(N['linea']), 'CTA': CTA, 'EVENTOS': ''.join(ev),
    'N': str(len(libros)), 'ND': str(len(destacados)), 'NED': str(len(eds)), 'PIEZAS': piezas, 'FICHA_V': ficha_v(destacados[CENTRO]), 'CONT': f'{CENTRO + 1} de {len(destacados)}',
    'PILL_G': PILL_G, 'PILL_P': PILL_P, 'ESTANTE': ''.join(map(libro, orden)),
    'TEL': TEL, 'BUSCO': urllib.parse.quote('Hola, busco un libro: '), 'DIRECCION': e(N['direccion']), 'ENTRE': e(N['entreCalles']),
    'HORARIO': ''.join(f'<dt>{e(f["dias"])}</dt><dd>{e(f["horas"])}</dd>' for f in D['horario']), 'MAPS': e(N['comoLlegar']),
    'CONTACTO': ''.join(f'<li><a href="{e(h)}"{" target=\"_blank\" rel=\"noopener\"" if h.startswith("http") else ""}><svg aria-hidden="true"><use href="#{i}"/></svg>{e(t)}</a></li>' for i, t, h in contacto),
    'CARTA': ''.join(f'<div><h4>{e(c["nombre"])}</h4><ul>' + ''.join(f'<li><b>{e(p["n"])}</b><span>{precio(p["pr"])}</span>' + (f'<span class="d">{e(p["d"])}</span>' if p.get('d') else '') + '</li>' for p in c['productos']) + '</ul></div>' for c in D['carta']),
}
out = open('plantilla.html').read().replace('__VB__', VB).replace('__D__', PD)
for k, v in rep.items(): out = out.replace('{{' + k + '}}', v)
assert '{{' not in out, re.findall(r'\{\{\w+\}\}', out)
open('index.html', 'w').write(out)
print('index.html', len(out), 'bytes · hoy', hoy, '· eventos', len(prox), '· libros', len(libros))

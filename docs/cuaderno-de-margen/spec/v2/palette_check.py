import json
def L(h):
    h=h.lstrip('#'); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[v/12.92 if v<=.03928 else ((v+.055)/1.055)**2.4 for v in c]
    return .2126*c[0]+.7152*c[1]+.0722*c[2]
def cr(a,b):
    x,y=sorted([L(a),L(b)]); return round((y+.05)/(x+.05),2)
base={
 'papel':('#f5f0e7','fondo principal; cal #e8e6e0 y cantera #d7c5ae aclaradas'),
 'cal':('#e8e6e0','superficie alterna; muestreada (muros y mosaico claro)'),
 'cantera':('#d7c5ae','fichas y marcos; muestreada (piedra clara)'),
 'hollin':('#1d1411','texto; muestreada (sombras de madera y piedra)'),
 'piedra':('#5a4037','texto secundario; muestreada'),
 'madera':('#845635','notas al margen, filetes; muestreada'),
 'turquesa':('#2d7a70','decoración y texto >=24px; muestreada (sillas y bancas)'),
 'turquesa-tinta':('#236861','enlaces, botones y foco sobre claro; #2d7a70 oscurecida'),
 'patio':('#5d7339','acento decorativo; muestreada (plantas del patio)'),
 'mosaico':('#373731','fondo oscuro; muestreada (mosaico negro)'),
 'menta-logo':('#5dc4b4','placa del logo; enlaces y foco sobre mosaico'),
}
pairs=[('hollin','papel','texto'),('piedra','papel','texto'),('madera','papel','texto'),('turquesa-tinta','papel','texto'),('turquesa','papel','texto'),('patio','papel','texto'),
 ('hollin','cal','texto'),('piedra','cal','texto'),('madera','cal','texto'),('turquesa-tinta','cal','texto'),
 ('hollin','cantera','texto'),('piedra','cantera','texto'),('madera','cantera','texto'),('turquesa-tinta','cantera','texto'),
 ('papel','mosaico','texto'),('cantera','mosaico','texto'),('cal','mosaico','texto'),('menta-logo','mosaico','texto'),
 ('papel','turquesa-tinta','texto en botón'),('papel','hollin','texto en botón'),
 ('turquesa-tinta','papel','anillo de foco (no texto, 3:1)'),('menta-logo','mosaico','anillo de foco sobre oscuro (3:1)')]
seasonal={
 'muertos-magenta':('#b74396','papel picado; muestreado de oficial-mesa-compartida'),
 'muertos-azul':('#1c90c9','papel picado; muestreado'),
 'muertos-morado':('#42327b','papel picado; muestreado'),
 'muertos-cempasuchil':('#d19027','mantel naranja; muestreado'),
 'muertos-rosa-viejo':('#893a4d','papel picado; muestreado'),
}
spairs=[('muertos-magenta','papel'),('muertos-azul','papel'),('muertos-morado','papel'),('muertos-cempasuchil','papel'),('muertos-rosa-viejo','papel'),
 ('papel','muertos-morado'),('muertos-cempasuchil','mosaico'),('muertos-cempasuchil','hollin'),('papel','muertos-magenta')]
allc={**base,**seasonal}
def level(r,kind):
    if '3:1' in kind or 'logo' in kind: return 'OK' if r>=3 else 'NO'
    return 'AAA' if r>=7 else 'AA' if r>=4.5 else 'AA grande (>=24px o 18.66px bold)' if r>=3 else 'NO (solo decoración)'
out={'base':base,'seasonal':seasonal,'pairs':[],'seasonal_pairs':[]}
for f,b,k in pairs:
    r=cr(allc[f][0],allc[b][0]); out['pairs'].append([f,b,k,r,level(r,k)]); print(f'{f:15} sobre {b:9} {k:32} {r:6} {level(r,k)}')
print('--- estacional')
for f,b in spairs:
    r=cr(allc[f][0],allc[b][0]); out['seasonal_pairs'].append([f,b,r,level(r,'texto')]); print(f'{f:20} sobre {b:20} {r:6} {level(r,"texto")}')
json.dump(out,open('palette.json','w'),indent=1,ensure_ascii=False)

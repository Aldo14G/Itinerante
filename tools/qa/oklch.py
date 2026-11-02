import math
def lin(c):
    c/=255
    return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
def oklch(hexv):
    r,g,b=[lin(int(hexv[i:i+2],16)) for i in (1,3,5)]
    l=0.4122214708*r+0.5363325363*g+0.0514459929*b
    m=0.2119034982*r+0.6806995451*g+0.1073969566*b
    s=0.0883024619*r+0.2817188376*g+0.6299787005*b
    l_,m_,s_=[x**(1/3) for x in (l,m,s)]
    L=0.2104542553*l_+0.7936177850*m_-0.0040720468*s_
    a=1.9779984951*l_-2.4285922050*m_+0.4505937099*s_
    bb=0.0259040371*l_+0.7827717662*m_-0.8086757660*s_
    return round(L,2), round(math.hypot(a,bb),3), round(math.degrees(math.atan2(bb,a))%360)
print('PAREDES (tonos medios de las fotos): L  C  H')
for n,h in {'piedra gris cálida':'#90826e','piedra oscura':'#746962','yeso rosado':'#d3baac','yeso/ladrillo':'#9e7a70','ladrillo ocre':'#ac7354','ladrillo tostado':'#96623f','madera/tierra':'#bb946f','madera oscura':'#644437','café profundo':'#5c443b'}.items():
    print(f'  {n:22s}{h} {oklch(h)}')
print('NUESTRA PALETA:')
for n,h in {'cal':'#fbf8f2','arena':'#efe3cc','papel':'#efe6d5','ladrillo pie':'#8a3720','terracota acento':'#a8432a','turquesa Cartelera':'#34b3a5','turquesa texto':'#176b62','ámbar llamado':'#f0b357','tinta':'#2a1d14'}.items():
    print(f'  {n:22s}{h} {oklch(h)}')

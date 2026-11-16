#!/usr/bin/env python3
"""Manda UN correo por corrida con lo que hizo (o no pudo hacer) la sincronización con la hoja de Google.

Uso:  python3 scripts/aviso-correo.py [--informe sync-informe.json] [--seco]

Lee el informe que deja scripts/sync-hoja.mjs y, si hay algo que decir, lo manda por SMTP de Gmail (smtp.gmail.com:587, STARTTLS).
Si no hay nada que decir, no manda nada. Solo usa la biblioteca estándar.

Variables de entorno:
  SMTP_USER, SMTP_PASS   cuenta de Gmail y su contraseña de aplicación (secreto). Si faltan, imprime «aviso no enviado» y termina sin fallar.
  AVISO_A                a quién avisar (uno o varios correos separados por coma).
  SITIO_URL              (opcional) enlace al sitio, para el pie del correo.
  SYNC_FALLO             (opcional) frase de un fallo que ocurrió fuera del script (la puerta de calidad, el push); convierte el aviso en «se detuvo».
  SYNC_URL_CORRIDA       (opcional) enlace a la corrida de GitHub Actions, para que quien reciba el error la encuentre.
  SYNC_ERROR_REPETIDO    «true» si la corrida anterior ya falló: un error que se repite no se vuelve a avisar en cada corrida.
Con --seco imprime el correo en lugar de mandarlo. Nunca imprime la contraseña ni las direcciones.
"""
import json
import os
import smtplib
import ssl
import sys
from email.message import EmailMessage

DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']


def fecha_larga(iso, anio_hoy):
    """«sábado 21 de noviembre» (con el año si no es el de hoy); sin fecha, «sin fecha»."""
    if not iso:
        return 'sin fecha'
    import datetime
    d = datetime.date.fromisoformat(iso)
    anio = '' if str(d.year) == str(anio_hoy) else f' de {d.year}'
    return f'{DIAS[d.weekday()]} {d.day} de {MESES[d.month - 1]}{anio}'


def plural(n, uno, varios):
    return f'{n} {uno if n == 1 else varios}'


def unir(partes):
    if len(partes) <= 1:
        return ''.join(partes)
    return ', '.join(partes[:-1]) + ' y ' + partes[-1]


def armar(informe, sitio='', url_corrida='', fallo=''):
    """(asunto, cuerpo) o None si no hay nada que decir."""
    errores = list(informe.get('errores') or [])
    if fallo:
        errores.append(fallo)
    anio = str(informe.get('fecha', ''))[:4]
    cierre = []
    if url_corrida:
        cierre.append(f'Corrida en GitHub: {url_corrida}')
    if sitio:
        cierre.append(f'Sitio: {sitio}')
    cierre.append('Guía: docs/AUTOMATIZACION.md (tabla de errores comunes).')

    if errores:
        cuerpo = ['Hola,', '', 'La sincronización con la hoja de cálculo se detuvo y NO se cambió nada en el sitio (lo que ya estaba publicado sigue igual).', '', 'Qué pasó:']
        cuerpo += [f'  · {e}' for e in errores]
        cuerpo += ['', 'Qué hacer: si el motivo es un dato de la hoja (por ejemplo, una pestaña o columna que se renombró), corrígelo en la hoja; la sincronización lo vuelve a intentar sola cada 30 minutos.',
                   'Si no está claro, pásale este correo a quien mantiene el sitio.', ''] + cierre
        return 'Itinerante: la sincronización se detuvo', '\n'.join(cuerpo) + '\n'

    pub = informe.get('publicado') or {}
    ret = informe.get('retirado') or {}
    ev_nuevos = [e for e in pub.get('eventos', []) if e.get('cambio') == 'nuevo']
    ev_cambiados = [e for e in pub.get('eventos', []) if e.get('cambio') == 'actualizado']
    libros = pub.get('libros', [])
    ev_quitados = [e for e in ret.get('eventos', []) if e.get('avisar')]
    libros_quitados = ret.get('libros', [])
    rechazos = informe.get('rechazado') or []
    rech_nuevos = [r for r in rechazos if r.get('nuevo')]
    rech_viejos = [r for r in rechazos if not r.get('nuevo')]
    avisos_nuevos = [a for a in (informe.get('avisos') or []) if (a.get('nuevo') if isinstance(a, dict) else True)]

    if not (ev_nuevos or ev_cambiados or libros or ev_quitados or libros_quitados or rech_nuevos or avisos_nuevos):
        return None

    partes = []
    if ev_nuevos:
        partes.append('se publicó 1 evento' if len(ev_nuevos) == 1 else f'se publicaron {len(ev_nuevos)} eventos')
    if ev_cambiados:
        partes.append('se actualizó 1 evento' if len(ev_cambiados) == 1 else f'se actualizaron {len(ev_cambiados)} eventos')
    if libros:
        partes.append(plural(len(libros), 'libro nuevo', 'libros nuevos'))
    if ev_quitados:
        partes.append('se retiró 1 evento' if len(ev_quitados) == 1 else f'se retiraron {len(ev_quitados)} eventos')
    if libros_quitados:
        partes.append('se quitó 1 libro del catálogo' if len(libros_quitados) == 1 else f'se quitaron {len(libros_quitados)} libros del catálogo')
    if partes:
        asunto = 'Itinerante: ' + unir(partes)
        if rech_nuevos:
            asunto += '; ' + ('1 fila de Eventos no se publicó' if len(rech_nuevos) == 1 else f'{len(rech_nuevos)} filas de Eventos no se publicaron')
    elif rech_nuevos:
        asunto = 'Itinerante: una fila de Eventos no se publicó' if len(rech_nuevos) == 1 else f'Itinerante: {len(rech_nuevos)} filas de Eventos no se publicaron'
    else:
        asunto = 'Itinerante: un aviso de la sincronización' if len(avisos_nuevos) == 1 else f'Itinerante: {len(avisos_nuevos)} avisos de la sincronización'

    cuerpo = ['Hola,', '', 'Esto pasó en la última revisión de la hoja de cálculo:']
    if ev_nuevos or ev_cambiados or libros:
        cuerpo += ['', 'SE PUBLICÓ EN EL SITIO']
        for e in ev_nuevos:
            hora = f", {e['hora']}" if e.get('hora') else ''
            cuerpo.append(f"  · Evento nuevo: «{e['titulo']}» ({fecha_larga(e.get('fecha'), anio)}{hora})")
        for e in ev_cambiados:
            hora = f", {e['hora']}" if e.get('hora') else ''
            cuerpo.append(f"  · Evento actualizado: «{e['titulo']}» ({fecha_larga(e.get('fecha'), anio)}{hora})")
        for b in libros:
            cuerpo.append(f"  · Libro nuevo en Novedades: «{b['titulo']}»")
    if ev_quitados or libros_quitados:
        cuerpo += ['', 'SE QUITÓ DEL SITIO']
        for e in ev_quitados:
            cuerpo.append(f"  · Evento: «{e['titulo']}» ({fecha_larga(e.get('fecha'), anio)}), porque {e.get('motivo', 'ya no está en la hoja')}")
        for b in libros_quitados:
            cuerpo.append(f"  · Libro: «{b['titulo']}» (ya no está en la hoja)")
        cuerpo.append('  Si fue sin querer, vuelve a poner la fila en la hoja: la sincronización lo recupera sola.')
    if rech_nuevos:
        cuerpo += ['', 'NO SE PUBLICÓ (necesita tu corrección)']
        for r in rech_nuevos:
            cuerpo.append(f"  · Fila {r['fila']} de la pestaña {r.get('hoja', 'Eventos')}, «{r.get('titulo') or 'sin título'}»: {r['motivo']}.")
            cuerpo.append(f"    Qué hacer: corrige la fila {r['fila']} de la pestaña {r.get('hoja', 'Eventos')}; en unos minutos se publica sola." + (' Mientras tanto sigue la versión anterior.' if r.get('conservado') else ''))
    if rech_viejos:
        cuerpo += ['', f"Siguen pendientes {plural(len(rech_viejos), 'fila ya avisada', 'filas ya avisadas')} (están en el informe de la corrida)."]
    if avisos_nuevos:
        cuerpo += ['', 'AVISOS (no impiden nada)']
        for a in avisos_nuevos:
            cuerpo.append(f"  · {a['texto'] if isinstance(a, dict) else a}")
        if any('portada' in (a['texto'] if isinstance(a, dict) else a) for a in avisos_nuevos):
            cuerpo.append('  Un libro sin portada se ve con la portada tipográfica; para añadir la portada, pásale la imagen o su enlace a quien mantiene el sitio.')
    cuerpo += [''] + cierre
    return asunto, '\n'.join(cuerpo) + '\n'


def main(argv):
    ruta = 'sync-informe.json'
    seco = False
    i = 0
    while i < len(argv):
        if argv[i] == '--seco':
            seco = True
        elif argv[i] == '--informe' and i + 1 < len(argv):
            i += 1
            ruta = argv[i]
        else:
            sys.exit(__doc__)
        i += 1
    fallo = os.environ.get('SYNC_FALLO', '').strip()
    try:
        with open(ruta, encoding='utf-8') as f:
            informe = json.load(f)
    except (OSError, ValueError):
        informe = None
    if informe is None:
        if not fallo:
            print('sin informe: no hay nada que avisar')
            return 0
        informe = {'errores': [], 'fecha': ''}
    if os.environ.get('SYNC_ERROR_REPETIDO', '').lower() == 'true' and (informe.get('errores') or fallo):
        print('aviso no enviado: este error ya se avisó en la corrida anterior')
        return 0
    correo = armar(informe, os.environ.get('SITIO_URL', '').strip(), os.environ.get('SYNC_URL_CORRIDA', '').strip(), fallo)
    if correo is None:
        print('nada que avisar: no hubo cambios ni problemas nuevos')
        return 0
    asunto, cuerpo = correo
    if seco:
        print(f'Asunto: {asunto}\nPara: (lo que diga AVISO_A)\n\n{cuerpo}')
        return 0
    usuario, clave, para = (os.environ.get(k, '').strip() for k in ('SMTP_USER', 'SMTP_PASS', 'AVISO_A'))
    if not (usuario and clave and para):
        print('aviso no enviado: faltan SMTP_USER/SMTP_PASS/AVISO_A')
        return 0
    msg = EmailMessage()
    msg['Subject'] = asunto
    msg['From'] = usuario
    msg['To'] = ', '.join(p.strip() for p in para.split(',') if p.strip())
    msg.set_content(cuerpo)
    try:
        with smtplib.SMTP('smtp.gmail.com', 587, timeout=60) as s:
            s.starttls(context=ssl.create_default_context())
            s.login(usuario, clave)
            s.send_message(msg)
    except Exception as err:  # ni la contraseña ni las direcciones salen en el registro
        print(f'aviso no enviado: el servidor de correo no aceptó el mensaje ({type(err).__name__})')
        return 1
    print(f'aviso enviado: {asunto}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

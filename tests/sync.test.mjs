// Sincronización con la hoja de Google (scripts/sync-hoja.mjs, scripts/aviso-correo.py, scripts/imagen-evento.py). Sin red ni credenciales de verdad:
// las filas, los libros y los carteles son inventados (tests/fixtures/sync) y Google lo hace un servidor HTTP de juguete en este mismo proceso.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createPublicKey, createVerify, generateKeyPairSync } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseFecha, parseHora, parseCosto, parseReserva, parsePublicar, driveId, mapaEncabezados, revisaDia, procesarFilas, planNovedades, guardaCatalogo, guardaEventos,
  mezclarEventos, clasificarCambios, problemasDeEvento, serialAFecha, slugify, sumarMeses, hoyMty, dmy, redact, registrarSecreto, escribirEntradas, aplicar, sincronizar, leerClave, firmarJwt, SyncError
} from '../scripts/sync-hoja.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fx = join(repo, 'tests', 'fixtures', 'sync');
const HOY = '2026-11-16';
const serial = iso => Math.round((Date.UTC(...iso.split('-').map((n, i) => (i === 1 ? n - 1 : +n))) - Date.UTC(1899, 11, 30)) / 86_400_000);
const tmp = prefijo => mkdtempSync(join(tmpdir(), `${prefijo}-`));
const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid' } });
const xlsxDe = (dir, ...args) => { const r = spawnSync('python3', [join(fx, 'generar.py'), dir, '--libros', ...args.map(String)], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); };

const ENC = ['Título', 'Publicar', 'Fecha', 'Hora', 'Fin', 'Tipo', 'Con', 'Invitado', 'Colabora', 'Ciclo', 'Descripción', 'Costo', 'Reserva', 'Cartel', 'Encuadre', 'Alt', 'Día'];
const fila = (o = {}) => ENC.map(k => (k in o ? o[k] : { Título: 'Evento de ejemplo', Fecha: serial('2026-11-21'), Descripción: 'Descripción inventada.' }[k] ?? null));
const proc = (filas, extra = {}) => procesarFilas([ENC, ...filas], { hoy: HOY, ...extra });

// ---------------------------------------------------------------------------------------------
test('fecha: número de serie de la hoja, AAAA-MM-DD, DD/MM/AAAA y vacío (propuesta); lo que no es fecha, con su motivo', () => {
  assert.equal(serialAFecha(serial('2026-11-21')), '2026-11-21');
  assert.deepEqual(parseFecha(serial('2026-11-21')), { valor: '2026-11-21' });
  assert.deepEqual(parseFecha(serial('2026-11-21') + 0.75), { valor: '2026-11-21' }, 'una fecha con hora usa solo el día');
  assert.deepEqual(parseFecha('2026-11-21'), { valor: '2026-11-21' });
  assert.deepEqual(parseFecha('21/11/2026'), { valor: '2026-11-21' });
  assert.deepEqual(parseFecha('1/2/2026'), { valor: '2026-02-01' });
  assert.deepEqual(parseFecha(' 05-12-2026 '), { valor: '2026-12-05' });
  for (const vacio of ['', '  ', null, undefined]) assert.deepEqual(parseFecha(vacio), { valor: null });
  assert.equal(parseFecha('31/02/2026').error, 'la fecha 31/02/2026 no existe');
  assert.match(parseFecha('el sábado').error, /^la fecha «el sábado» no se entiende/);
  assert.match(parseFecha(5).error, /no es una fecha de la hoja/);
  assert.match(parseFecha(true).error, /no es una fecha/);
});

test('hora: fracción de día, HH:MM, «6:57 p.m.»; se imprime tal cual, sin redondear', () => {
  assert.deepEqual(parseHora(0.7895833333333333), { valor: '18:57' });
  assert.deepEqual(parseHora(0.789583333333333), { valor: '18:57' }, 'con el último decimal comido');
  assert.deepEqual(parseHora(serial('2026-11-21') + 0.7895833333333333), { valor: '18:57' }, 'una celda de fecha y hora usa su parte de hora');
  assert.deepEqual(parseHora(0.75), { valor: '18:00' });
  assert.deepEqual(parseHora(0), { valor: '00:00' });
  assert.deepEqual(parseHora('18:57'), { valor: '18:57' });
  assert.deepEqual(parseHora('8:05'), { valor: '08:05' });
  assert.deepEqual(parseHora('18:57:00'), { valor: '18:57' });
  assert.deepEqual(parseHora('6:57 p.m.'), { valor: '18:57' });
  assert.deepEqual(parseHora('6:57 P. M.'), { valor: '18:57' });
  assert.deepEqual(parseHora('6:57 pm'), { valor: '18:57' });
  assert.deepEqual(parseHora('12:00 a.m.'), { valor: '00:00' });
  assert.deepEqual(parseHora('12 pm'), { valor: '12:00' });
  assert.deepEqual(parseHora('7 pm'), { valor: '19:00' });
  assert.deepEqual(parseHora('18 h'), { valor: '18:00' });
  assert.deepEqual(parseHora(''), { valor: null });
  assert.match(parseHora('25:00').error, /no es válida/);
  assert.match(parseHora('13:00 pm').error, /no es válida/);
  assert.match(parseHora('por la tarde').error, /no se entiende/);
  assert.match(parseHora('18').error, /no se entiende/, 'un número suelto no es una hora');
  assert.match(parseHora(3).error, /no es una hora de la hoja/);
});

test('costo (un renglón por salto de línea), reserva (Luma o teléfono de 10 dígitos), Publicar, cartel de Drive y encabezados', () => {
  assert.deepEqual(parseCosto('$90 MXN entrada\n$120 MXN con libro en PDF'), { valor: ['$90 MXN entrada', '$120 MXN con libro en PDF'] });
  assert.deepEqual(parseCosto('  $90 MXN \r\n\r\n  gratis para socias  '), { valor: ['$90 MXN', 'gratis para socias'] });
  assert.deepEqual(parseCosto(null), { valor: [] });
  assert.deepEqual(parseCosto(90), { valor: ['$90 MXN'] });
  assert.match(parseCosto(0).error, /escribe el costo con texto/);
  assert.match(parseCosto('1\n2\n3\n4\n5').error, /5 renglones y el sitio imprime hasta 4/);

  assert.deepEqual(parseReserva('https://lu.ma/evento-de-ejemplo'), { valor: { tipo: 'luma', url: 'https://lu.ma/evento-de-ejemplo' } });
  assert.deepEqual(parseReserva('https://luma.com/abc123'), { valor: { tipo: 'luma', url: 'https://luma.com/abc123' } });
  assert.deepEqual(parseReserva('lu.ma/abc'), { valor: { tipo: 'luma', url: 'https://lu.ma/abc' } });
  assert.deepEqual(parseReserva('81 1234-5678'), { valor: { tipo: 'whatsapp', telefono: '8112345678' } });
  assert.deepEqual(parseReserva('(81) 1234 5678'), { valor: { tipo: 'whatsapp', telefono: '8112345678' } });
  assert.deepEqual(parseReserva('+52 81 1234 5678'), { valor: { tipo: 'whatsapp', telefono: '8112345678' } });
  assert.deepEqual(parseReserva(8112345678), { valor: { tipo: 'whatsapp', telefono: '8112345678' } });
  assert.deepEqual(parseReserva(''), { valor: null });
  const malo = 'la reserva no es un enlace de Luma ni un teléfono de 10 dígitos';
  for (const v of ['https://eventbrite.com/x', 'http://lu.ma/x', '123456', '81 1234', 'escríbenos', 'https://lu.ma', 'https://evil.example/lu.ma/x']) assert.equal(parseReserva(v).error, malo, v);

  assert.equal(parsePublicar(null), true);
  assert.equal(parsePublicar(''), true);
  for (const v of ['sí', 'Sí', 'SI', 'si', 'x', true]) assert.equal(parsePublicar(v), true, String(v));
  for (const v of ['no', 'NO', 'No', false]) assert.equal(parsePublicar(v), false, String(v));
  assert.equal(parsePublicar('quizá'), null);

  assert.equal(driveId('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrSt/view?usp=sharing'), '1AbCdEfGhIjKlMnOpQrSt');
  assert.equal(driveId('https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrSt'), '1AbCdEfGhIjKlMnOpQrSt');
  assert.equal(driveId('1AbCdEfGhIjKlMnOpQrSt'), '1AbCdEfGhIjKlMnOpQrSt');
  assert.equal(driveId('https://example.com/cartel.png'), null);
  assert.equal(driveId('cartel'), null);

  const col = mapaEncabezados(['  DESCRIPCIÓN ', 'título', 'Fecha', 'Día de la semana', 'Hora de inicio', 'RESERVA', 'costo']);
  assert.deepEqual(col, { titulo: 1, fecha: 2, hora: 4, descripcion: 0, costo: 6, reserva: 5, dia: 3 });
  assert.equal(slugify('Tarde de Letras: «Poesía» y más'), 'tarde-de-letras-poesia-y-mas');
  assert.equal(slugify('¿¿??'), 'evento');
  assert.ok(slugify('x'.repeat(200)).length <= 60);
  assert.equal(sumarMeses('2026-11-16', -24), '2024-11-16');
  assert.equal(sumarMeses('2026-02-28', -12), '2025-02-28');
  assert.equal(sumarMeses('2024-02-29', 12), '2025-02-28');
  assert.equal(hoyMty(new Date('2026-11-17T05:59:00Z')), '2026-11-16', 'el día de Monterrey (UTC−6)');
  assert.equal(dmy('2026-11-21'), '21/11/2026');
});

test('día de la semana: la columna Día y el texto («sábado 21») tienen que coincidir con la fecha', () => {
  assert.deepEqual(revisaDia('2026-11-21', { dia: 'sábado' }), []);
  assert.deepEqual(revisaDia('2026-11-21', { dia: 'Sáb' }), []);
  assert.deepEqual(revisaDia('2026-11-21', { dia: 'lunes' }), ['la fecha 21/11/2026 no cae en lunes (es sábado)']);
  assert.match(revisaDia('2026-11-21', { dia: 'quincena' })[0], /no es un día de la semana/);
  assert.deepEqual(revisaDia('2026-11-21', { titulo: 'Tarde de letras', descripcion: 'Sábado 21 de noviembre, 18:57 h.' }), []);
  assert.deepEqual(revisaDia('2026-11-21', { titulo: 'Tarde', descripcion: 'Este sábado en la casa.' }), []);
  assert.deepEqual(revisaDia('2026-11-21', { titulo: 'Tarde', descripcion: 'Viernes 21 de noviembre.' }), ['el texto dice «viernes 21», pero la fecha 21/11/2026 cae en sábado 21']);
  assert.deepEqual(revisaDia('2026-11-21', { titulo: 'Tarde', descripcion: 'Sábado 28: cierre del ciclo.' }), ['el texto dice «sábado 28», pero la fecha 21/11/2026 cae en sábado 21']);
  assert.deepEqual(revisaDia('2026-11-21', { titulo: 'Este viernes', descripcion: '' }), ['el texto dice «este viernes», pero la fecha 21/11/2026 cae en sábado']);
  assert.deepEqual(revisaDia('2026-11-21', { titulo: 'Los sábados de lectura', descripcion: 'Cada domingo hay café a las 17:00' }), [], 'sin número ni «este», no hay una fecha que contradecir');
  assert.deepEqual(revisaDia('2026-11-21', { titulo: 'x', descripcion: 'Domingo 18:00 h' }), [], 'una hora no es un número de día');
});

test('filas → eventos: todos los casos de fecha, hora, costo y reserva, con el formato de eventos.json y las reglas del sitio', () => {
  const r = proc([
    fila({ Título: 'Tarde de letras', Fecha: serial('2026-11-21'), Hora: 0.7895833333333333, Fin: '8:30 p.m.', Tipo: 'Lectura', Con: ' Persona Ficticia ', Invitado: 'Invitada Inventada', Colabora: 'Editorial de Prueba', Ciclo: 'Letras en vivo', Costo: '$90 MXN entrada\n$120 MXN con libro', Reserva: 'https://lu.ma/evento-de-ejemplo', Cartel: 'cartel-ejemplo-0001', Encuadre: 'Cartel', Día: 'Sábado' }),
    fila({ Título: 'Taller de ejemplo', Fecha: '28/11/2026', Hora: '6:30 p.m.', Reserva: '81 0000-0000' }),
    fila({ Título: 'Propuesta de ejemplo', Fecha: null, Descripción: 'Sin fecha todavía.' }),
    fila({ Título: 'Con fecha de texto', Fecha: '2026-12-05', Hora: '17:00' })
  ]);
  assert.deepEqual(r.rechazados, []);
  assert.deepEqual(r.validos.map(v => v.evento.id), ['tarde-de-letras-2026-11-21', 'taller-de-ejemplo-2026-11-28', 'propuesta-de-ejemplo', 'con-fecha-de-texto-2026-12-05'], 'id = slug del título + fecha; sin fecha, solo el slug');
  assert.deepEqual(r.validos[0].evento, {
    id: 'tarde-de-letras-2026-11-21', tipo: 'Lectura', ciclo: 'Letras en vivo', titulo: 'Tarde de letras', fecha: '2026-11-21', hora: '18:57', fin: '20:30', con: 'Persona Ficticia',
    invitado: 'Invitada Inventada', colabora: 'Editorial de Prueba', descripcion: 'Descripción inventada.', imagen: 'assets/img/eventos/tarde-de-letras-2026-11-21.webp',
    alt: 'Cartel: Tarde de letras, sábado 21 de noviembre, 18:57', encuadre: 'cartel', costo: ['$90 MXN entrada', '$120 MXN con libro'], reserva: { tipo: 'luma', url: 'https://lu.ma/evento-de-ejemplo' }, origen: 'hoja'
  });
  assert.deepEqual(r.validos[0].cartel, { ref: 'cartel-ejemplo-0001' });
  assert.deepEqual(r.validos[1].evento.reserva, { tipo: 'whatsapp', telefono: '8100000000' });
  assert.equal(r.validos[1].evento.hora, '18:30');
  assert.equal(r.validos[1].evento.imagen, null, 'sin Cartel, sin foto');
  assert.equal(r.validos[2].evento.fecha, null);
  assert.equal(r.validos[2].evento.hora, null);
  assert.equal(r.validos[2].evento.reserva, null);
  assert.equal(r.validos[3].evento.hora, '17:00');
  assert.ok(!('tipo' in r.validos[1].evento) && !('encuadre' in r.validos[1].evento) && !('costo' in r.validos[1].evento), 'los opcionales vacíos no se escriben');
});

test('filas con problemas: cada una se rechaza con su motivo exacto y no frena a las demás', () => {
  const r = proc([
    fila({ Título: null }),
    fila({ Título: 'Fecha rara', Fecha: 'pronto' }),
    fila({ Título: 'Fecha imposible', Fecha: '31/02/2026' }),
    fila({ Título: 'Día que no es', Fecha: serial('2026-11-21'), Día: 'lunes' }),
    fila({ Título: 'Texto que contradice', Fecha: serial('2026-11-21'), Descripción: 'Viernes 21 de noviembre en la sala.' }),
    fila({ Título: 'Reserva mala', Fecha: serial('2026-11-21'), Reserva: 'https://eventbrite.com/x' }),
    fila({ Título: 'Teléfono corto', Fecha: serial('2026-11-21'), Reserva: '81 1234' }),
    fila({ Título: 'Hora sin fecha', Fecha: null, Hora: '18:00' }),
    fila({ Título: 'Fin antes', Fecha: serial('2026-11-21'), Hora: '18:00', Fin: '17:00' }),
    fila({ Título: 'Sin descripción', Descripción: null }),
    fila({ Título: 'Publicar raro', Publicar: 'quizá' }),
    fila({ Título: 'Encuadre raro', Encuadre: 'póster' }),
    fila({ Título: 'Evento bueno', Fecha: serial('2026-12-05') }),
    fila({ Título: 'Evento bueno', Fecha: serial('2026-12-05') })
  ]);
  assert.deepEqual(r.rechazados.map(x => [x.fila, x.titulo, x.motivo]), [
    [2, '', 'falta el título'],
    [3, 'Fecha rara', 'la fecha «pronto» no se entiende (usa una fecha real de la hoja, AAAA-MM-DD o DD/MM/AAAA)'],
    [4, 'Fecha imposible', 'la fecha 31/02/2026 no existe'],
    [5, 'Día que no es', 'la fecha 21/11/2026 no cae en lunes (es sábado)'],
    [6, 'Texto que contradice', 'el texto dice «viernes 21», pero la fecha 21/11/2026 cae en sábado 21'],
    [7, 'Reserva mala', 'la reserva no es un enlace de Luma ni un teléfono de 10 dígitos'],
    [8, 'Teléfono corto', 'la reserva no es un enlace de Luma ni un teléfono de 10 dígitos'],
    [9, 'Hora sin fecha', 'tiene hora pero no fecha'],
    [10, 'Fin antes', 'la hora de fin (17:00) debe ser posterior a la de inicio (18:00)'],
    [11, 'Sin descripción', 'falta la descripción'],
    [12, 'Publicar raro', '«Publicar» dice «quizá»: escribe sí o no'],
    [13, 'Encuadre raro', '«Encuadre» dice «póster»: escribe cartel o foto'],
    [15, 'Evento bueno', 'repetida: la fila 14 ya publica «Evento bueno» el mismo día']
  ]);
  assert.deepEqual(r.validos.map(v => v.fila), [14], 'la fila buena se publica aunque las demás no');
  const dos = proc([fila({ Título: 'Mala', Fecha: 'x', Descripción: null })]);
  assert.equal(dos.rechazados[0].motivo, 'la fecha «x» no se entiende (usa una fecha real de la hoja, AAAA-MM-DD o DD/MM/AAAA); falta la descripción', 'todos los motivos de una fila, juntos');
});

test('filas: Publicar = no, ids únicos, eventos del archivo que no son de la hoja, 24 meses y reserva sin fecha', () => {
  const r = proc([
    fila({ Título: 'Oculto', Publicar: 'no' }),
    fila({ Título: 'Oculto y roto', Publicar: 'NO', Fecha: 'xx' }),
    fila({ Título: 'Mismo título', Fecha: serial('2026-11-21') }),
    fila({ Título: 'Mismo título', Fecha: serial('2026-11-28') }),
    fila({ Título: 'Círculo de lectura', Fecha: null }),
    fila({ Título: 'Muy viejo', Fecha: '2024-11-15' }),
    fila({ Título: 'Justo en la ventana', Fecha: '2024-11-16' }),
    fila({ Título: 'Ya pasó', Fecha: '2026-11-01' }),
    fila({ Título: 'Propuesta con reserva', Fecha: null, Reserva: '81 0000 0000' }),
    fila({ Título: 'Cartel raro', Fecha: '2026-12-01', Cartel: 'https://example.com/cartel.png' }),
    [null, null, null],
    []
  ], { idsManuales: new Set(['circulo-de-lectura']) });
  assert.deepEqual(r.ocultos.map(o => [o.fila, o.titulo, o.id]), [[2, 'Oculto', 'oculto-2026-11-21'], [3, 'Oculto y roto', null]], 'Publicar = no gana sobre cualquier otro error');
  assert.deepEqual(r.validos.map(v => v.evento.id), ['mismo-titulo-2026-11-21', 'mismo-titulo-2026-11-28', 'justo-en-la-ventana-2024-11-16', 'ya-paso-2026-11-01', 'propuesta-con-reserva', 'cartel-raro-2026-12-01'], 'ids únicos aunque el título se repita; un evento pasado con Publicar = sí es válido (va a anteriores)');
  assert.deepEqual(r.rechazados.map(x => [x.titulo, x.motivo]), [['Círculo de lectura', 'ya existe un evento con ese identificador que no viene de la hoja; cambia el título o la fecha']]);
  assert.deepEqual(r.omitidos.map(o => o.titulo), ['Muy viejo'], 'más de 24 meses: se omite, sin rechazarlo');
  assert.ok(r.avisos.some(a => /«Muy viejo» \(15\/11\/2024\) tiene más de 24 meses/.test(a)));
  assert.ok(r.avisos.some(a => /«Propuesta con reserva».*sin botón de reserva/.test(a)));
  assert.ok(r.avisos.some(a => /«Cartel raro».*el enlace del cartel no se entiende/.test(a)));
  assert.equal(r.validos.find(v => v.evento.id === 'propuesta-con-reserva').evento.reserva, null);
  assert.equal(r.validos.find(v => v.evento.id === 'cartel-raro-2026-12-01').evento.imagen, null);
});

test('encabezados: por nombre, sin importar orden, mayúsculas ni acentos; si faltan Título o Fecha, la sincronización se detiene', () => {
  const r = procesarFilas([['DESCRIPCION', 'fecha', 'TITULO', 'hora'], ['Algo inventado', '2026-12-05', 'Evento al revés', '5:00 pm'], ['Otra cosa', '', 'Propuesta al revés', '']], { hoy: HOY });
  assert.deepEqual(r.validos.map(v => [v.evento.titulo, v.evento.fecha, v.evento.hora, v.evento.descripcion]), [['Evento al revés', '2026-12-05', '17:00', 'Algo inventado'], ['Propuesta al revés', null, null, 'Otra cosa']]);
  assert.throws(() => procesarFilas([['Nombre del evento', 'Fecha']], { hoy: HOY }), /le faltan encabezados: Título/);
  assert.throws(() => procesarFilas([['Título', 'Día']], { hoy: HOY }), /le faltan encabezados: Fecha/);
  assert.throws(() => procesarFilas([], { hoy: HOY }), /pestaña de Eventos está vacía/);
  assert.deepEqual(procesarFilas([['Título', 'Fecha']], { hoy: HOY }).validos, [], 'solo encabezados: no hay eventos, y no es un error');
});

// ---------------------------------------------------------------------------------------------
const libro = (n, extra = {}) => ({ id: `libro-${n}`, t: `Libro ${n}`, a: 'Autora', n: `978000000${String(n).padStart(3, '0')}0`, c: null, ...extra });
const libros = (desde, hasta) => Array.from({ length: hasta - desde + 1 }, (_, i) => libro(desde + i));

test('novedades: la primera corrida solo toma la línea base; un libro nuevo entra con la fecha de hoy; los retirados y los de más de 120 días salen', () => {
  const base = planNovedades({ previos: [], nuevos: libros(1, 12), entradas: [], hoy: HOY });
  assert.equal(base.base, true);
  assert.deepEqual(base.nuevos, [], 'línea base: nada se marca como nuevo');
  assert.deepEqual(base.entradas, []);

  const p = planNovedades({
    previos: libros(1, 12), nuevos: [...libros(2, 12), libro(13)], hoy: HOY,
    entradas: [{ id: 'libro-5', llegada: '2026-11-01' }, { id: 'libro-1', llegada: '2026-11-10' }, { id: 'libro-6', llegada: '2026-07-01' }, { id: 'libro-7', llegada: '2026-07-19' }]
  });
  assert.equal(p.base, false);
  assert.deepEqual(p.nuevos.map(b => b.id), ['libro-13']);
  assert.deepEqual(p.retirados.map(b => b.id), ['libro-1']);
  assert.deepEqual(p.entradas, [{ id: 'libro-5', llegada: '2026-11-01' }, { id: 'libro-7', llegada: '2026-07-19' }, { id: 'libro-13', llegada: HOY }], 'se conserva lo reciente tal cual; se agrega el nuevo con la fecha de hoy');
  assert.deepEqual(p.quitadas.map(e => e.id), ['libro-1', 'libro-6'], 'el libro retirado y el de 138 días (> 120)');
  assert.equal(planNovedades({ previos: libros(1, 12), nuevos: libros(1, 12), entradas: [{ id: 'libro-3', llegada: '2026-07-19' }], hoy: HOY }).entradas.length, 1, 'justo 120 días se queda');
  assert.equal(planNovedades({ previos: libros(1, 12), nuevos: libros(1, 12), entradas: [{ id: 'libro-3', llegada: '2026-07-18' }], hoy: HOY }).entradas.length, 0, '121 días se va');
  assert.deepEqual(planNovedades({ previos: libros(1, 3), nuevos: libros(1, 3), entradas: [], hoy: HOY, dias: 10 }).entradas, []);
  // se corrigió el título (cambia el id) pero es el mismo ISBN: no es una llegada
  const ren = planNovedades({ previos: libros(1, 12), nuevos: [...libros(2, 12), libro('uno', { id: 'libro-1-corregido', n: libro(1).n })], entradas: [{ id: 'libro-1', llegada: '2026-11-10' }], hoy: HOY });
  assert.deepEqual(ren.nuevos, []);
  assert.deepEqual(ren.retirados, []);
  assert.deepEqual(ren.entradas, [{ id: 'libro-1-corregido', llegada: '2026-11-10' }], 'la entrada sigue al libro con su fecha');
});

test('guardas: catálogo de menos de 10 o de menos de la mitad, y una pestaña de eventos rota', () => {
  assert.throws(() => guardaCatalogo(0, 9), e => e instanceof SyncError && e.codigo === 2 && /9 libros \(el mínimo es 10\)/.test(e.message));
  assert.throws(() => guardaCatalogo(41, 20), /pasaría de 41 a 20 libros \(menos de la mitad\)/);
  assert.doesNotThrow(() => guardaCatalogo(41, 21));
  assert.doesNotThrow(() => guardaCatalogo(41, 20, { forzar: true }), '--forzar salta la guarda del 50 %');
  assert.throws(() => guardaCatalogo(41, 5, { forzar: true }), /mínimo es 10/, '--forzar no salta el mínimo');
  assert.doesNotThrow(() => guardaCatalogo(0, 12), 'primera corrida: sin catálogo previo, basta con el mínimo');
  const malas = Array.from({ length: 16 }, (_, i) => ({ fila: i + 2, titulo: `x${i}`, motivo: 'm' }));
  assert.throws(() => guardaEventos({ validos: [], rechazados: malas }), /16 filas de Eventos se rechazaron y ninguna es válida/);
  assert.doesNotThrow(() => guardaEventos({ validos: [], rechazados: malas.slice(0, 15) }));
  assert.doesNotThrow(() => guardaEventos({ validos: [{}], rechazados: malas }));
});

test('mezcla con eventos.json: los que no son de la hoja no se tocan; lo que sale de la hoja sale del sitio; una fila rota conserva su versión anterior; ventana de 24 meses', () => {
  const manual = { id: 'circulo', titulo: 'Círculo de lectura', fecha: null };
  const ev = (id, fecha, extra = {}) => ({ id, titulo: id, fecha, hora: null, fin: null, con: null, descripcion: 'd', imagen: null, alt: 'a', reserva: null, origen: 'hoja', ...extra });
  const actuales = [manual, ev('sigue-2026-12-05', '2026-12-05'), ev('cambia-2026-12-06', '2026-12-06'), ev('rota-2026-12-07', '2026-12-07'), ev('se-fue-2026-12-08', '2026-12-08'), ev('oculto-2026-12-09', '2026-12-09'), ev('viejo-2024-11-15', '2024-11-15')];
  const procesados = {
    validos: [{ evento: ev('sigue-2026-12-05', '2026-12-05') }, { evento: ev('cambia-2026-12-06', '2026-12-06', { hora: '18:00' }) }, { evento: ev('nuevo-2026-12-10', '2026-12-10') }],
    rechazados: [{ fila: 9, titulo: 'rota', motivo: 'x', idProbable: 'rota-2026-12-07' }, { fila: 10, titulo: 'otra', motivo: 'x', idProbable: 'otra-2026-12-11' }],
    ocultos: [{ id: 'oculto-2026-12-09' }]
  };
  const m = mezclarEventos({ actuales, procesados, hoy: HOY });
  assert.deepEqual(m.eventos.map(e => e.id), ['circulo', 'sigue-2026-12-05', 'cambia-2026-12-06', 'rota-2026-12-07', 'nuevo-2026-12-10'], 'la propuesta manual primero y intacta; luego los de la hoja por fecha');
  assert.deepEqual(m.retirados.map(r => [r.id, r.motivo, r.avisar]), [
    ['se-fue-2026-12-08', 'ya no está en la hoja', true], ['oculto-2026-12-09', 'Publicar = no', true], ['viejo-2024-11-15', 'salió de la ventana de 24 meses', false]
  ]);
  assert.deepEqual(m.conservados, ['rota-2026-12-07']);
  assert.deepEqual(clasificarCambios(m).map(c => [c.id, c.cambio]), [['cambia-2026-12-06', 'actualizado'], ['nuevo-2026-12-10', 'nuevo']], 'sin cambios y rota: no se anuncian');
  const otra = mezclarEventos({ actuales: m.eventos, procesados: { validos: procesados.validos, rechazados: [], ocultos: [] }, hoy: HOY });
  assert.deepEqual(clasificarCambios(otra), [], 'una segunda corrida con la misma hoja no cambia nada');
});

test('collections.json: novedades.entradas se escribe sin reformatear el resto del archivo', () => {
  const dir = tmp('sync-col');
  try {
    const src = readFileSync(join(repo, 'assets', 'data', 'collections.json'), 'utf8');
    const ruta = join(dir, 'collections.json');
    writeFileSync(ruta, src);
    const entradas = [{ id: 'a-b', llegada: '2026-11-16' }, { id: 'c', llegada: '2026-11-10' }];
    escribirEntradas(ruta, entradas);
    const out = readFileSync(ruta, 'utf8');
    assert.deepEqual(JSON.parse(out).novedades.entradas, entradas);
    assert.ok(out.includes('{ "id": "a-b", "llegada": "2026-11-16" }'), 'una por renglón, al estilo del archivo');
    assert.equal(out.replace(/"entradas": \[[^\]]*\]/, '"entradas": []'), src.replace(/"entradas": \[[^\]]*\]/, '"entradas": []'), 'todo lo demás queda igual, byte por byte');
    escribirEntradas(ruta, []);
    assert.equal(readFileSync(ruta, 'utf8'), src, 'vacía otra vez = el original');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('aplicar: solo copia lo que cambió, solo dentro de assets/ y data/', () => {
  const a = tmp('sync-a'), b = tmp('sync-b');
  try {
    for (const [r, t] of [['assets/x.json', '1'], ['assets/img/eventos/e.webp', 'img'], ['data/y.json', '2'], ['assets/viejo.txt', 'v']]) { mkdirSync(dirname(join(b, r)), { recursive: true }); writeFileSync(join(b, r), t); }
    cpSync(join(b, 'assets'), join(a, 'assets'), { recursive: true });
    cpSync(join(b, 'data'), join(a, 'data'), { recursive: true });
    writeFileSync(join(a, 'assets/x.json'), '1b');
    writeFileSync(join(a, 'assets/nuevo.json'), 'n');
    writeFileSync(join(a, 'otra.txt'), 'fuera');
    rmSync(join(a, 'assets/viejo.txt'));
    const r = aplicar(a, b);
    assert.deepEqual(r.escritas.sort(), ['assets/nuevo.json', 'assets/x.json']);
    assert.deepEqual(r.borradas, ['assets/viejo.txt']);
    assert.ok(!existsSync(join(b, 'otra.txt')), 'nada fuera de assets/ y data/');
    assert.deepEqual(aplicar(a, b), { escritas: [], borradas: [] }, 'idempotente');
  } finally { rmSync(a, { recursive: true, force: true }); rmSync(b, { recursive: true, force: true }); }
});

// ---------------------------------------------------------------------------------------------
test('imagen-evento.py: WebP de 1200 px como máximo sin recortar; lo que no es imagen, con motivo', () => {
  const dir = tmp('sync-img');
  try {
    const py = (...a) => spawnSync('python3', a, { encoding: 'utf8' });
    assert.equal(py('-c', `from PIL import Image; Image.new('RGB',(3000,1500),(10,20,30)).save(r'${dir}/g.png'); Image.new('RGB',(300,600),(10,20,30)).save(r'${dir}/p.jpg')`).status, 0);
    const grande = py(join(repo, 'scripts', 'imagen-evento.py'), join(dir, 'g.png'), join(dir, 'sub', 'g.webp'));
    assert.equal(grande.status, 0, grande.stderr);
    assert.equal(grande.stdout.trim(), '1200x600', 'proporción 2:1 intacta');
    assert.equal(py(join(repo, 'scripts', 'imagen-evento.py'), join(dir, 'p.jpg'), join(dir, 'p.webp')).stdout.trim(), '300x600', 'no agranda');
    assert.equal(readFileSync(join(dir, 'p.webp')).subarray(8, 12).toString(), 'WEBP');
    writeFileSync(join(dir, 'x.txt'), 'no soy una imagen');
    const mala = py(join(repo, 'scripts', 'imagen-evento.py'), join(dir, 'x.txt'), join(dir, 'x.webp'));
    assert.equal(mala.status, 1);
    assert.match(mala.stderr, /no es una imagen/);
    assert.ok(!existsSync(join(dir, 'x.webp')));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---------------------------------------------------------------------------------------------
test('de punta a punta con fixtures: node scripts/sync-hoja.mjs --seco --fixtures tests/fixtures/sync no escribe nada, deja el informe y el correo sale bien', () => {
  const dir = tmp('sync-cli');
  const antes = git(repo, 'status', '--porcelain', '--', 'assets', 'data').stdout;
  try {
    const informe = join(dir, 'informe.json');
    const r = spawnSync('node', [join(repo, 'scripts', 'sync-hoja.mjs'), '--seco', '--fixtures', fx, '--informe', informe, '--hoy', HOY], { cwd: repo, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /Simulacro \(no se escribió nada\): 0 libros nuevos, 3 eventos, 2 filas rechazadas\./);
    const inf = JSON.parse(readFileSync(informe, 'utf8'));
    assert.deepEqual(inf.errores, []);
    assert.equal(inf.publicado.libros.length, 0, 'primera corrida: línea base, ningún libro nuevo');
    assert.deepEqual(inf.publicado.eventos.map(e => [e.titulo, e.fecha, e.hora]), [['Tarde de ejemplo', '2026-11-21', '18:57'], ['Taller con reserva por teléfono', '2026-11-28', '18:30'], ['Propuesta de ejemplo', null, null]]);
    assert.deepEqual(inf.rechazado.map(x => [x.fila, x.motivo]), [[5, 'la fecha 21/11/2026 no cae en lunes (es sábado)'], [7, 'falta la descripción']]);
    assert.equal(git(repo, 'status', '--porcelain', '--', 'assets', 'data').stdout, antes, 'el repositorio no cambió');
    assert.ok(!existsSync(join(repo, 'assets', 'img', 'eventos', 'tarde-de-ejemplo-2026-11-21.webp')), 'la imagen de prueba no entra a assets/');

    const mail = spawnSync('python3', [join(repo, 'scripts', 'aviso-correo.py'), '--informe', informe, '--seco'], { encoding: 'utf8', env: { PATH: process.env.PATH } });
    assert.equal(mail.status, 0, mail.stderr);
    assert.match(mail.stdout, /^Asunto: Itinerante: se publicaron 3 eventos; 2 filas de Eventos no se publicaron$/m);
    assert.match(mail.stdout, /Fila 5 de la pestaña Eventos, «Fecha y día no coinciden»: la fecha 21\/11\/2026 no cae en lunes \(es sábado\)\./);
    assert.match(mail.stdout, /Qué hacer: corrige la fila 5 de la pestaña Eventos/);
    assert.match(mail.stdout, /Evento nuevo: «Tarde de ejemplo» \(sábado 21 de noviembre, 18:57\)/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('correo: un solo correo por corrida, solo con lo que importa, y sin variables no falla', () => {
  const dir = tmp('sync-mail');
  try {
    const correo = (informe, env = {}, ...args) => {
      writeFileSync(join(dir, 'i.json'), JSON.stringify(informe));
      return spawnSync('python3', [join(repo, 'scripts', 'aviso-correo.py'), '--informe', join(dir, 'i.json'), ...args], { encoding: 'utf8', env: { PATH: process.env.PATH, ...env } });
    };
    const base = { fecha: HOY, errores: [], publicado: { libros: [], eventos: [] }, retirado: { libros: [], eventos: [] }, rechazado: [], avisos: [], notas: ['línea base'] };
    assert.match(correo(base, {}, '--seco').stdout, /nada que avisar/, 'nada nuevo: ni correo');
    assert.equal(correo(base).stdout.trim(), 'nada que avisar: no hubo cambios ni problemas nuevos');
    const con = { ...base, publicado: { libros: [{ titulo: 'Libro A' }, { titulo: 'Libro B' }], eventos: [{ titulo: 'Tarde', fecha: '2026-11-21', hora: '18:57', cambio: 'nuevo' }] } };
    assert.match(correo(con, {}, '--seco').stdout, /^Asunto: Itinerante: se publicó 1 evento y 2 libros nuevos$/m);
    assert.equal(correo(con).stdout.trim(), 'aviso no enviado: faltan SMTP_USER/SMTP_PASS/AVISO_A', 'sin variables: avisa y no falla');
    assert.equal(correo(con).status, 0);
    const rechazo = { ...base, rechazado: [{ hoja: 'Eventos', fila: 7, titulo: 'Taller', motivo: 'falta la descripción', nuevo: true, conservado: false }] };
    const out = correo(rechazo, {}, '--seco').stdout;
    assert.match(out, /^Asunto: Itinerante: una fila de Eventos no se publicó$/m);
    assert.match(out, /Qué hacer: corrige la fila 7 de la pestaña Eventos/);
    const viejo = { ...rechazo, rechazado: [{ ...rechazo.rechazado[0], nuevo: false }] };
    assert.match(correo(viejo, {}, '--seco').stdout, /nada que avisar/, 'un rechazo ya avisado no se repite cada 30 minutos');
    const aviso = { ...base, publicado: { libros: [{ titulo: 'Libro C' }], eventos: [] }, avisos: [{ texto: '«Libro C» no tiene portada registrada: el sitio usa la portada tipográfica', nuevo: true }] };
    assert.match(correo(aviso, { SITIO_URL: 'https://sitio.example' }, '--seco').stdout, /Sitio: https:\/\/sitio\.example[\s\S]*|portada tipográfica/);
    const error = { ...base, errores: ['el catálogo pasaría de 41 a 20 libros (menos de la mitad)'] };
    const e = correo(error, { SYNC_URL_CORRIDA: 'https://github.example/corrida/1' }, '--seco').stdout;
    assert.match(e, /^Asunto: Itinerante: la sincronización se detuvo$/m);
    assert.match(e, /menos de la mitad/);
    assert.match(e, /Corrida en GitHub: https:\/\/github\.example\/corrida\/1/);
    assert.match(correo(error, { SYNC_ERROR_REPETIDO: 'true' }, '--seco').stdout, /ya se avisó en la corrida anterior/, 'un error que se repite no llena la bandeja');
    const sinInforme = spawnSync('python3', [join(repo, 'scripts', 'aviso-correo.py'), '--informe', join(dir, 'no-existe.json'), '--seco'], { encoding: 'utf8', env: { PATH: process.env.PATH, SYNC_FALLO: 'Las pruebas del sitio no pasaron.' } });
    assert.match(sinInforme.stdout, /la sincronización se detuvo[\s\S]*Las pruebas del sitio no pasaron\./);
    for (const salida of [out, e]) assert.ok(!/@|SMTP_PASS=/.test(salida), 'el correo impreso no lleva direcciones');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---------------------------------------------------------------------------------------------
// Google de juguete: token firmado (se verifica la firma RS256), Drive y Sheets

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
const CLAVE = { type: 'service_account', project_id: 'proyecto-de-prueba', private_key_id: 'abcdef0123456789abcdef0123456789abcdef01', private_key: privateKey, client_email: 'sa-prueba@proyecto-de-prueba.iam.gserviceaccount.com', client_id: '123456789012345678901', token_uri: 'https://oauth2.googleapis.com/token' };
const SECRETOS = [JSON.stringify(CLAVE), CLAVE.private_key, CLAVE.private_key_id, CLAVE.client_email, ...CLAVE.private_key.split('\n').filter(l => l.length > 20)];
const TOKEN = 'ya29.token-de-prueba-9f8e7d6c5b4a';
const HOJA = 'hoja-de-prueba-1234567890';
const CARTEL = 'cartel-de-prueba-123456';

async function googleDeJuguete({ xlsx, eventos, png, modo = 'ok' }) {
  const visto = { token: 0, export: 0, valores: 0, media: 0, meta: 0, jwt: null };
  const srv = createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const json = (obj, status = 200) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
    if (req.method === 'POST' && url.pathname === '/token') {
      let cuerpo = '';
      req.on('data', c => { cuerpo += c; });
      req.on('end', () => {
        visto.token++;
        const p = new URLSearchParams(cuerpo);
        const [h, c, f] = (p.get('assertion') || '').split('.');
        const ok = createVerify('RSA-SHA256').update(`${h}.${c}`).verify(createPublicKey(publicKey), Buffer.from(f, 'base64url'));
        const claim = JSON.parse(Buffer.from(c, 'base64url').toString());
        visto.jwt = { header: JSON.parse(Buffer.from(h, 'base64url').toString()), claim, ok, grant: p.get('grant_type') };
        if (!ok) return json({ error: 'invalid_grant', error_description: 'firma inválida' }, 400);
        json({ access_token: TOKEN, expires_in: 3600, token_type: 'Bearer' });
      });
      return;
    }
    if (modo === 'error') return json({ error: { code: 403, message: `La cuenta ${CLAVE.client_email} no tiene acceso. Token ${TOKEN}. Clave ${CLAVE.private_key_id}` } }, 403);
    if (req.headers.authorization !== `Bearer ${TOKEN}`) return json({ error: { message: 'sin credenciales' } }, 401);
    const ruta = url.pathname;
    if (ruta === `/drive/files/${HOJA}`) { visto.meta++; return json({ mimeType: modo === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/vnd.google-apps.spreadsheet', name: 'Hoja de prueba' }); }
    if (ruta === `/drive/files/${HOJA}/export`) { visto.export++; res.writeHead(200, { 'content-type': 'application/octet-stream' }); return res.end(xlsx()); }
    if (ruta === `/sheets/spreadsheets/${HOJA}`) return json({ sheets: [{ properties: { title: 'Eventos', index: 1 } }, { properties: { title: 'Catálogo', index: 0 } }] });
    if (ruta === `/sheets/spreadsheets/${HOJA}/values/'Eventos'`) { visto.valores++; assert.equal(url.searchParams.get('valueRenderOption'), 'UNFORMATTED_VALUE'); assert.equal(url.searchParams.get('dateTimeRenderOption'), 'SERIAL_NUMBER'); return json({ values: eventos() }); }
    if (ruta === `/drive/files/${CARTEL}`) {
      if (url.searchParams.get('alt') === 'media') { visto.media++; res.writeHead(200, { 'content-type': 'image/png' }); return res.end(png); }
      return json({ id: CARTEL, mimeType: 'image/png', size: String(png.length), md5Checksum: createHash('md5').update(png).digest('hex') });
    }
    json({ error: { message: `no existe ${ruta}` } }, 404);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  return { visto, base, env: { SYNC_TOKEN_URI: `${base}/token`, SYNC_DRIVE_BASE: `${base}/drive`, SYNC_SHEETS_BASE: `${base}/sheets` }, cerrar: () => new Promise(r => srv.close(r)) };
}

function repoDeJuguete() {
  const dir = tmp('sync-repo');
  const w = (r, d) => { mkdirSync(dirname(join(dir, r)), { recursive: true }); writeFileSync(join(dir, r), typeof d === 'string' || Buffer.isBuffer(d) ? d : `${JSON.stringify(d, null, 2)}\n`); };
  w('data/portadas.json', {});
  w('assets/provenance.json', { updated: '2026-11-01', rule: 'x', real: [], covers: {}, eventosData: { file: 'data/eventos.json', origin: 'x', rule: 'y' } });
  w('assets/data/eventos.json', { meta: { nota: 'n' }, eventos: [{ id: 'circulo', titulo: 'Círculo de lectura', fecha: null, hora: null, fin: null, con: null, descripcion: 'd', imagen: 'assets/img/cartelera-1.webp', alt: 'a', reserva: null }] });
  writeFileSync(join(dir, 'assets/data/collections.json'), readFileSync(join(repo, 'assets', 'data', 'collections.json')));
  w('assets/img/cartelera-1.webp', 'x');
  w('README.md', 'raíz de juguete');
  git(dir, 'init', '-q');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'base');
  return dir;
}
const publicable = dir => git(dir, 'status', '--porcelain', '-uall').stdout.split('\n').filter(Boolean).map(l => l.slice(3));

test('flujo real con Google de juguete: firma el token, exporta la hoja, lee Eventos, baja el cartel, marca los libros nuevos, no escribe fuera de assets/ y data/, y la segunda corrida no cambia nada', async () => {
  const dir = repoDeJuguete(), trabajo = tmp('sync-xl');
  const png = readFileSync(join(fx, 'carteles', 'cartel-ejemplo-0001.png'));
  let libros = 12;
  const evSrc = JSON.parse(readFileSync(join(fx, 'eventos.json'), 'utf8')).values;
  evSrc[1][13] = CARTEL;
  const g = await googleDeJuguete({ xlsx: () => { xlsxDe(trabajo, libros, '--con-eventos', '--eventos-primero'); return readFileSync(join(trabajo, 'inventario.xlsx')); }, eventos: () => evSrc, png });
  const env = { ...process.env, ...g.env, GOOGLE_SA_KEY: JSON.stringify(CLAVE), HOJA_ID: HOJA, SYNC_RAIZ: dir, SYNC_SIN_ESPERA: '1' };
  try {
    // 1ª corrida: línea base de libros, eventos y cartel
    let { codigo, informe } = await sincronizar({ env, hoy: HOY });
    assert.equal(codigo, 0, informe.errores.join(' | '));
    assert.equal(g.visto.jwt.ok, true, 'la firma RS256 del token verifica con la clave pública');
    assert.deepEqual(g.visto.jwt.header, { alg: 'RS256', typ: 'JWT' });
    assert.equal(g.visto.jwt.claim.iss, CLAVE.client_email);
    assert.equal(g.visto.jwt.claim.scope, 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly');
    assert.equal(g.visto.jwt.grant, 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    assert.equal(g.visto.jwt.claim.exp - g.visto.jwt.claim.iat, 3600);
    assert.ok(informe.notas.some(n => n.includes('«Catálogo»')), 'lee la pestaña de libros aunque «Eventos» sea la primera');
    assert.equal(informe.publicado.libros.length, 0, 'línea base');
    assert.deepEqual(informe.publicado.eventos.map(e => e.titulo), ['Tarde de ejemplo', 'Taller con reserva por teléfono', 'Propuesta de ejemplo']);
    assert.equal(g.visto.media, 1);
    const cambios = publicable(dir).sort();
    for (const esperado of ['assets/data/catalog.json', 'assets/data/eventos.json', 'assets/img/eventos/tarde-de-ejemplo-2026-11-21.webp', 'data/inventario-itinerante.json', 'data/sync-estado.json']) assert.ok(cambios.includes(esperado), `${esperado} en ${cambios.join(', ')}`);
    assert.ok(cambios.every(c => /^(assets|data)\//.test(c)), `solo assets/ y data/: ${cambios.join(', ')}`);
    const eventos = JSON.parse(readFileSync(join(dir, 'assets/data/eventos.json'), 'utf8'));
    assert.equal(eventos.eventos[0].id, 'circulo', 'la propuesta que no es de la hoja sigue ahí, intacta');
    assert.deepEqual(eventos.meta, { nota: 'n' });
    const tarde = eventos.eventos.find(e => e.id === 'tarde-de-ejemplo-2026-11-21');
    assert.equal(tarde.imagen, 'assets/img/eventos/tarde-de-ejemplo-2026-11-21.webp');
    assert.equal(readFileSync(join(dir, tarde.imagen)).subarray(8, 12).toString(), 'WEBP');
    const prov = JSON.parse(readFileSync(join(dir, 'assets/provenance.json'), 'utf8'));
    const reg = prov.real.find(f => f.file === 'img/eventos/tarde-de-ejemplo-2026-11-21.webp');
    assert.equal(reg.origin, 'Cartel o foto aportado por la librería desde su hoja de eventos');
    assert.equal(reg.date, HOY);
    assert.equal(reg.sha256, createHash('sha256').update(readFileSync(join(dir, tarde.imagen))).digest('hex'));
    assert.ok(!JSON.stringify(prov).includes(CARTEL), 'el ID del archivo de Drive no queda en el repositorio');
    assert.match(prov.eventosData.hoja, /sincronizan desde la pestaña Eventos/);
    assert.ok(informe.rechazado.length === 2 && informe.rechazado.every(r => r.nuevo));
    git(dir, 'add', '-A'); git(dir, 'commit', '-q', '-m', 'sync 1');

    // 2ª corrida, sin cambios en la hoja: nada que escribir, ni descargar el cartel otra vez, y los rechazos ya no son nuevos
    const media = g.visto.media;
    ({ codigo, informe } = await sincronizar({ env, hoy: HOY }));
    assert.equal(codigo, 0, informe.errores.join(' | '));
    assert.deepEqual(informe.escrito, { escritas: [], borradas: [] }, 'idempotente: segunda corrida sin cambios');
    assert.deepEqual(publicable(dir), []);
    assert.equal(g.visto.media, media, 'el cartel no se baja otra vez si su md5 no cambió');
    assert.ok(informe.rechazado.every(r => !r.nuevo), 'los problemas ya avisados no se repiten');
    assert.equal(informe.publicado.eventos.length, 0);

    // 3ª corrida: la hoja trae un libro nuevo, se quitó un evento y se corrigió una fila
    libros = 13;
    evSrc.splice(3, 1); // fuera «Taller con reserva por teléfono»
    ({ codigo, informe } = await sincronizar({ env, hoy: HOY }));
    assert.equal(codigo, 0, informe.errores.join(' | '));
    assert.deepEqual(informe.publicado.libros, [{ id: 'libro-de-ejemplo-13-autora-ficticia-13', titulo: 'Libro de ejemplo 13' }]);
    assert.deepEqual(informe.retirado.eventos.map(e => [e.titulo, e.motivo]), [['Taller con reserva por teléfono', 'ya no está en la hoja']]);
    const col = JSON.parse(readFileSync(join(dir, 'assets/data/collections.json'), 'utf8'));
    assert.deepEqual(col.novedades.entradas, [{ id: 'libro-de-ejemplo-13-autora-ficticia-13', llegada: HOY }]);
    assert.ok(informe.avisos.some(a => /«Libro de ejemplo 13» no tiene portada registrada/.test(a.texto) && a.nuevo));
    assert.ok(!JSON.parse(readFileSync(join(dir, 'assets/data/eventos.json'), 'utf8')).eventos.some(e => e.id.startsWith('taller-con-reserva')));
    assert.ok(publicable(dir).every(c => /^(assets|data)\//.test(c)));
    assert.equal(readFileSync(join(dir, 'README.md'), 'utf8'), 'raíz de juguete');
    git(dir, 'add', '-A'); git(dir, 'commit', '-q', '-m', 'sync 3');

    // 4ª corrida: el libro 13 ya no es nuevo en la comparación (está en HEAD) y no se vuelve a marcar
    ({ codigo, informe } = await sincronizar({ env, hoy: '2026-11-17' }));
    assert.equal(informe.publicado.libros.length, 0);
    assert.deepEqual(JSON.parse(readFileSync(join(dir, 'assets/data/collections.json'), 'utf8')).novedades.entradas, [{ id: 'libro-de-ejemplo-13-autora-ficticia-13', llegada: HOY }], 'conserva su fecha de llegada');
    git(dir, 'add', '-A'); git(dir, 'commit', '-q', '-m', 'sync 4');

    // el modo seco no escribe nada
    libros = 14;
    ({ codigo, informe } = await sincronizar({ env, hoy: '2026-11-17', seco: true }));
    assert.equal(codigo, 0);
    assert.equal(informe.publicado.libros.length, 1);
    assert.deepEqual(publicable(dir), [], 'seco: el repositorio no cambia');

    // la guarda del 50 %: una hoja con 6 libros no se acepta
    libros = 6;
    ({ codigo, informe } = await sincronizar({ env, hoy: '2026-11-17' }));
    assert.equal(codigo, 2);
    assert.match(informe.errores[0], /6 libros \(el mínimo es 10\)/);
    assert.deepEqual(publicable(dir), []);
    assert.deepEqual(informe.publicado, { libros: [], eventos: [] }, 'con error no se anuncia nada como publicado');
  } finally { await g.cerrar(); rmSync(dir, { recursive: true, force: true }); rmSync(trabajo, { recursive: true, force: true }); }
});

test('guarda del 50 %: el catálogo que se desploma no se escribe, y --forzar la salta', async () => {
  const dir = repoDeJuguete(), trabajo = tmp('sync-xl');
  let libros = 24;
  const g = await googleDeJuguete({ xlsx: () => { xlsxDe(trabajo, libros); return readFileSync(join(trabajo, 'inventario.xlsx')); }, eventos: () => [ENC], png: Buffer.alloc(0) });
  const env = { ...process.env, ...g.env, GOOGLE_SA_KEY: JSON.stringify(CLAVE), HOJA_ID: HOJA, SYNC_RAIZ: dir, SYNC_SIN_ESPERA: '1' };
  try {
    let r = await sincronizar({ env, hoy: HOY });
    assert.equal(r.codigo, 0, r.informe.errores.join(' | '));
    git(dir, 'add', '-A'); git(dir, 'commit', '-q', '-m', 'base');
    libros = 11;
    r = await sincronizar({ env, hoy: HOY });
    assert.equal(r.codigo, 2);
    assert.match(r.informe.errores[0], /pasaría de 24 a 11 libros \(menos de la mitad\)/);
    assert.deepEqual(publicable(dir), [], 'no se escribió nada');
    r = await sincronizar({ env, hoy: HOY, forzar: true });
    assert.equal(r.codigo, 0, r.informe.errores.join(' | '));
    assert.equal(JSON.parse(readFileSync(join(dir, 'assets/data/catalog.json'), 'utf8')).books.length, 11);
    assert.equal(r.informe.retirado.libros.length, 13);
  } finally { await g.cerrar(); rmSync(dir, { recursive: true, force: true }); rmSync(trabajo, { recursive: true, force: true }); }
});

test('secretos: ni la clave, ni el token, ni el correo de la cuenta de servicio salen en el informe, la consola ni los errores', async () => {
  const dir = repoDeJuguete();
  const g = await googleDeJuguete({ xlsx: () => Buffer.alloc(0), eventos: () => [], png: Buffer.alloc(0), modo: 'error' });
  const informe = join(dir, 'informe.json');
  try {
    // asíncrono: el Google de juguete vive en este mismo proceso y no puede contestar mientras el hijo lo espera bloqueado
    const correr = envExtra => new Promise(res => {
      const hijo = spawn('node', [join(repo, 'scripts', 'sync-hoja.mjs'), '--seco', '--informe', informe], { cwd: dir, env: { PATH: process.env.PATH, HOME: process.env.HOME, SYNC_RAIZ: dir, SYNC_SIN_ESPERA: '1', ...g.env, HOJA_ID: HOJA, ...envExtra } });
      let stdout = '', stderr = '';
      hijo.stdout.on('data', d => { stdout += d; });
      hijo.stderr.on('data', d => { stderr += d; });
      hijo.on('close', status => res({ status, stdout, stderr }));
    });
    const limpio = salida => { for (const s of SECRETOS) assert.ok(!salida.includes(s), `se coló un secreto: ${s.slice(0, 18)}…`); assert.ok(!salida.includes(TOKEN)); };
    // Google responde 403 repitiendo el correo, la clave y el token en su mensaje
    let r = await correr({ GOOGLE_SA_KEY: JSON.stringify(CLAVE) });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stdout, /La sincronización se detuvo/);
    assert.match(r.stdout, /Google respondió 403 \(«La cuenta «oculto» no tiene acceso\. Token «oculto»\. Clave «oculto»»\)/, 'Google repite los secretos en su mensaje y salen ocultos');
    limpio(r.stdout + r.stderr + readFileSync(informe, 'utf8'));
    // una clave rota no se cita en el error
    r = await correr({ GOOGLE_SA_KEY: `{"private_key": "${CLAVE.private_key_id}-no-es-json` });
    assert.equal(r.status, 2);
    assert.match(r.stdout, /GOOGLE_SA_KEY no es un JSON válido/);
    assert.ok(!(r.stdout + r.stderr + readFileSync(informe, 'utf8')).includes(CLAVE.private_key_id));
    r = await correr({ GOOGLE_SA_KEY: JSON.stringify({ hola: 1 }) });
    assert.match(r.stdout, /no parece la clave JSON de una cuenta de servicio/);
    r = await correr({ GOOGLE_SA_KEY: '' });
    assert.equal(r.status, 2);
    assert.match(r.stdout, /faltan GOOGLE_SA_KEY o HOJA_ID/);
    // redact quita lo registrado, también los renglones sueltos de la clave
    registrarSecreto('valor-secreto-de-prueba-123');
    registrarSecreto(CLAVE.private_key);
    assert.equal(redact('hola valor-secreto-de-prueba-123 adiós'), 'hola «oculto» adiós');
    assert.ok(!redact(`error: ${CLAVE.private_key.split('\n')[1]}`).includes(CLAVE.private_key.split('\n')[1]));
    // la clave se lee y firma
    const k = leerClave(JSON.stringify(CLAVE));
    assert.equal(firmarJwt(k, { ahora: 1_700_000_000 }).split('.').length, 3);
  } finally { await g.cerrar(); rmSync(dir, { recursive: true, force: true }); }
});

test('HOJA_ID de un .xlsx subido a Drive: error claro con el paso a seguir (guardar como hoja de Google)', async () => {
  const dir = repoDeJuguete();
  const g = await googleDeJuguete({ xlsx: () => Buffer.alloc(0), eventos: () => [], png: Buffer.alloc(0), modo: 'xlsx' });
  try {
    const r = await sincronizar({ env: { ...process.env, ...g.env, GOOGLE_SA_KEY: JSON.stringify(CLAVE), HOJA_ID: HOJA, SYNC_RAIZ: dir, SYNC_SIN_ESPERA: '1' }, hoy: HOY });
    assert.equal(r.codigo, 2);
    assert.match(r.informe.errores[0], /HOJA_ID no es una hoja de Google .*Guardar como hoja de Google/);
  } finally { await g.cerrar(); rmSync(dir, { recursive: true, force: true }); }
});

test('el flujo de GitHub Actions: horario, concurrencia, permisos, puerta de calidad y secretos por env', () => {
  const y = readFileSync(join(repo, '.github', 'workflows', 'sync-hoja.yml'), 'utf8');
  assert.match(y, /cron: '\*\/30 \* \* \* \*'/);
  assert.match(y, /workflow_dispatch:/);
  assert.match(y, /concurrency:\s*\n\s+group: sync-hoja\s*\n\s+cancel-in-progress: false/);
  assert.match(y, /permissions:\s*\n\s+contents: write/);
  assert.match(y, /actions\/checkout@v4/);
  assert.match(y, /fetch-depth: 2/);
  assert.match(y, /actions\/setup-node@v4/);
  assert.match(y, /actions\/setup-python@v5/);
  assert.match(y, /pip install openpyxl pillow/);
  assert.match(y, /node --test tests\/site\.test\.mjs tests\/sync\.test\.mjs/);
  assert.match(y, /git checkout -- \. && git clean -fd assets data/);
  assert.match(y, /Itinerante Bot/);
  assert.match(y, /noreply@users\.noreply\.github\.com/);
  assert.match(y, /if: always\(\)/);
  assert.match(y, /60 días/);
  let enRun = -1;
  for (const l of y.split('\n')) {
    const sangria = l.length - l.trimStart().length;
    if (enRun >= 0 && l.trim() && sangria <= enRun) enRun = -1;
    if (enRun >= 0) assert.ok(!l.includes('${{'), `sin expresiones \${{ }} dentro de un run: (inyección de scripts): ${l.trim()}`);
    if (/^\s+run:\s*[|>]/.test(l)) enRun = sangria;
    if (l.includes('secrets.')) assert.match(l, /^\s+[A-Z_]+: \$\{\{ secrets\.[A-Z_]+ \}\}\s*$/, 'los secretos van solo como valor de una variable en `env:`');
  }
  assert.ok(!/[\w.-]+@(?!users\.noreply\.github\.com)[\w.-]+\.\w+/.test(y), 'ningún correo en el flujo');
});

test('assets/data/eventos.json del repositorio pasa la revisión del sitio (los eventos de la hoja pueden no traer foto) y cada foto está registrada', () => {
  const doc = JSON.parse(readFileSync(join(repo, 'assets', 'data', 'eventos.json'), 'utf8'));
  const prov = JSON.parse(readFileSync(join(repo, 'assets', 'provenance.json'), 'utf8'));
  const ids = new Set();
  for (const e of doc.eventos) {
    assert.ok(!ids.has(e.id), `id repetido ${e.id}`);
    ids.add(e.id);
    assert.deepEqual(problemasDeEvento(e), [], e.id);
    if (e.imagen) assert.ok(existsSync(join(repo, e.imagen)) && prov.real.some(f => `assets/${f.file}` === e.imagen), `${e.id}: la imagen existe y está registrada en provenance.json`);
  }
});

test('lo ignorado y lo prohibido: informe fuera de git, sin datos reales en los scripts', () => {
  const gi = readFileSync(join(repo, '.gitignore'), 'utf8');
  assert.match(gi, /^sync-informe\.json$/m);
  for (const f of ['scripts/sync-hoja.mjs', 'scripts/aviso-correo.py', 'scripts/imagen-evento.py', '.github/workflows/sync-hoja.yml', 'docs/AUTOMATIZACION.md']) {
    const t = readFileSync(join(repo, f), 'utf8');
    assert.ok(!/[\w.+-]+@(?!users\.noreply\.github\.com)[\w-]+\.[a-z]{2,}/i.test(t), `${f}: sin correos`);
    assert.ok(!/(?<!\d)8\d{9}(?!\d)/.test(t.replace(/8112345678|8100000000/g, '')), `${f}: sin teléfonos reales`);
  }
  assert.deepEqual(readdirSync(join(fx)).sort(), ['carteles', 'eventos.json', 'generar.py', 'inventario.xlsx']);
});

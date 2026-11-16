// Eventos y talleres (#cartelera) sin inventar nada (2026-11-16; sustituye al Carrusel3D del 2026-11-13). Los datos viven en
// assets/data/eventos.json y se editan sin tocar HTML ni JS: publicar un evento es añadir un renglón.
//   · con fecha de hoy en adelante (hora de Monterrey): el más próximo es el **destacado** (foto o cartel, fecha tipográfica, datos en lista de
//     definición, la acción de reserva que el evento traiga, «Añadir al calendario» y «Compartir») y los demás van en la **lista por día**
//     (filas entre líneas finas);
//   · con `fecha: null` es una propuesta: va al final, con su insignia «Propuesta · sin fecha», sin reserva ni calendario;
//   · una fecha anterior a hoy (día de Monterrey) y de los últimos 24 meses pasa sola al apartado **«Eventos anteriores»** (2026-11-16): debajo
//     de «Después» y de las propuestas, una fila compacta por evento (fecha tipográfica pequeña, título, «tipo · Con …» y portada cuadrada),
//     sin acciones; los 6 más recientes y «Ver los N anteriores» / «Ver menos» para el resto. Lo más viejo no se pinta aunque siga en el JSON;
//     sin ningún evento pasado válido el apartado no existe (ni hueco, ni encabezado);
//   · sin ningún evento con fecha queda lo que trae index.html (las propuestas y la entradilla «Aún sin fecha…»): es también lo que se lee
//     sin JavaScript.
// Reserva (`reserva`): { tipo: "luma", url } → «Registrarme», un enlace normal a la página del evento en Luma, en otra pestaña (el sitio no
// carga nada de Luma ni guarda registros, cupos o asistentes); { tipo: "whatsapp", telefono } → «Reservar por WhatsApp», con el mensaje ya
// escrito (es la función del objeto, como «Preguntar por WhatsApp» en la ficha del libro); null → sin botón.
// «Añadir al calendario» arma un archivo .ics en el navegador (icsOf). El aviso del inicio («Próximo: Sáb 21 nov · …») y el punto de
// «Eventos» en la barra y el menú usan el mecanismo de Novedades: assets/js/boot.js reserva el renglón antes del primer render si la
// visita anterior dejó un evento vigente (iti-ev-hasta); si no coincide, se corrige con el inicio fuera de la vista.
// Estructura de la lista (día a la izquierda → filas con la portada cuadrada a la derecha) tomada de Luma como referencia; ni su código ni
// sus imágenes (docs/ux/investigacion-2026-11/luma.md).
import { DUR, EASE, ms } from './motion.js';

const MTY = 'America/Monterrey';
export const EVENTOS_URL = 'assets/data/eventos.json';
export const NO_DATE = 'Propuesta · sin fecha';
export const LUGAR = 'Librería Itinerante y Más, Mariano Matamoros Pte. 421, Centro, Monterrey';
export const COSTO_MAX = 4; // renglones de costo que se imprimen (un cartel trae dos o tres)
export const ANTERIORES_MESES = 24; // un evento pasado se archiva a la vista durante 24 meses; lo más viejo no se pinta aunque siga en el JSON
export const PROXIMOS_MESES = 24; // una fecha futura a más de 24 meses es casi seguro un error de captura (2062 por 2026): no se anuncia ni se muestra
export const ANTERIORES_VISIBLES = 6; // «Eventos anteriores» muestra los 6 más recientes; el resto, tras «Ver los N anteriores»
const INSTAGRAM = 'https://www.instagram.com/libreriaitineranteymasmty/';
const HASTA_KEY = 'iti-ev-hasta'; // AAAA-MM-DD del último evento vigente: lo que boot.js lee antes del primer render

// ---------------------------------------------------------------------------------------------
// Lógica pura (se prueba con fechas en tests/site.test.mjs)

const dayKey = date => new Intl.DateTimeFormat('en-CA', { timeZone: MTY, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); // AAAA-MM-DD en Monterrey
/** ¿Es una fecha real escrita como AAAA-MM-DD? (2026-02-30 no lo es). */
export function validDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
/** ¿Es una hora real escrita como HH:MM (24 horas)? Se imprime tal cual («18:57»), sin redondear. */
export const validHour = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
/**
 * La página de registro en Luma: solo https y solo lu.ma o luma.com, con ruta. Cualquier otra cosa (http, otro dominio, usuario o puerto en
 * la dirección, texto suelto) se descarta.
 */
export function validRegistro(value) {
  if (typeof value !== 'string') return null;
  let u;
  try { u = new URL(value.trim()); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
  if (u.hostname !== 'lu.ma' && u.hostname !== 'luma.com') return null;
  return u.pathname.length > 1 ? u.href : null;
}
/** Teléfono mexicano de 10 dígitos (se toleran espacios, guiones, paréntesis y el prefijo +52 al pintar); si no lo es, null. */
export function validTelefono(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const raw = String(value).trim();
  if (!/^[\d\s()+-]+$/.test(raw)) return null;
  let d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('52')) d = d.slice(2);
  return /^[1-9]\d{9}$/.test(d) ? d : null;
}
/**
 * Cómo se reserva: { tipo: 'luma', url } con una página de Luma válida, { tipo: 'whatsapp', telefono } con 10 dígitos, o null. Un tipo
 * desconocido, una URL que no es de Luma o un teléfono que no es mexicano de 10 dígitos dejan el evento sin botón de reserva.
 */
export function validReserva(value) {
  if (!value || typeof value !== 'object') return null;
  if (value.tipo === 'luma') { const url = validRegistro(value.url); return url ? { tipo: 'luma', url } : null; }
  if (value.tipo === 'whatsapp') { const telefono = validTelefono(value.telefono); return telefono ? { tipo: 'whatsapp', telefono } : null; }
  return null;
}
const text = v => (typeof v === 'string' ? v.trim() : '');
const localImage = v => (/^assets\/img\/[\w./-]+\.(webp|jpe?g|png|avif)$/.test(text(v)) && !text(v).includes('..') ? text(v) : null);

/**
 * Lo que se puede pintar de eventos.json: cada evento con id (minúsculas, cifras y guiones; el repetido se descarta) y título. `tipo` es
 * opcional (solo si el anuncio lo dice) y `fuente` (el enlace de la publicación de origen) no se pinta. Tolerante con lo demás: una fecha que no es real queda en null (propuesta), una hora sin fecha o mal escrita se ignora, `fin` solo vale después de
 * `hora`, la imagen solo si es una ruta local bajo assets/img/ (`encuadre`: «cartel» o, por omisión, «foto»), `costo` solo sus renglones de
 * texto y la reserva solo si es válida y el evento tiene fecha.
 */
export function validEventos(data) {
  const raw = Array.isArray(data?.eventos) ? data.eventos : [];
  const seen = new Set();
  const list = [];
  for (const e of raw) {
    const id = text(e?.id), titulo = text(e?.titulo);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id) || !titulo || seen.has(id)) continue;
    seen.add(id);
    const fecha = validDay(e.fecha) ? e.fecha : null;
    const hora = fecha && validHour(e.hora) ? e.hora : null;
    const fin = hora && validHour(e.fin) && e.fin > hora ? e.fin : null;
    list.push({
      id, tipo: text(e.tipo), ciclo: text(e.ciclo) || null, titulo, fecha, hora, fin,
      con: text(e.con) || null, invitado: text(e.invitado) || null, colabora: text(e.colabora) || null,
      descripcion: text(e.descripcion), imagen: localImage(e.imagen), alt: text(e.alt), encuadre: e.encuadre === 'cartel' ? 'cartel' : 'foto',
      costo: (Array.isArray(e.costo) ? e.costo : []).map(text).filter(Boolean).slice(0, COSTO_MAX),
      reserva: fecha ? validReserva(e.reserva) : null
    });
  }
  return list;
}
/**
 * Revisión estricta del archivo (la corre npm test): lo que validEventos perdona al pintar, aquí se señala para corregirlo antes de publicar.
 * Devuelve una lista de frases; vacía si todo está bien.
 */
export function eventosProblems(data) {
  const out = [];
  if (!Array.isArray(data?.eventos)) return ['falta la lista «eventos»'];
  const seen = new Set();
  const has = (e, k) => e != null && Object.hasOwn(e, k) && e[k] !== null;
  data.eventos.forEach((e, i) => {
    const who = `evento ${i + 1}${e?.id ? ` (${e.id})` : ''}`;
    const id = text(e?.id);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) out.push(`${who}: id inválido (minúsculas, cifras y guiones)`);
    else if (seen.has(id)) out.push(`${who}: id repetido`);
    seen.add(id);
    // Un evento que publica la hoja de la librería (`origen: "hoja"`, campo del sincronizador; los demás campos desconocidos se ignoran) puede ir sin
    // foto (`imagen: null`, cuando la fila no trae cartel): se pinta sin figura. Los eventos del repositorio siguen exigiendo imagen local y su alt.
    const sinFoto = e?.origen === 'hoja' && (e?.imagen === null || e?.imagen === undefined);
    for (const k of sinFoto ? ['titulo', 'descripcion'] : ['titulo', 'descripcion', 'alt']) if (!text(e?.[k])) out.push(`${who}: falta «${k}»`);
    if (!sinFoto && !localImage(e?.imagen)) out.push(`${who}: «imagen» debe ser una ruta local bajo assets/img/`);
    if (has(e, 'encuadre') && e.encuadre !== 'cartel' && e.encuadre !== 'foto') out.push(`${who}: «encuadre» es "cartel" o "foto"`);
    if (e?.fecha !== null && !validDay(e?.fecha)) out.push(`${who}: «fecha» no es una fecha real (AAAA-MM-DD) ni null`);
    if (e?.hora !== null && !validHour(e?.hora)) out.push(`${who}: «hora» no es HH:MM ni null`);
    if (e?.fin !== null && !validHour(e?.fin)) out.push(`${who}: «fin» no es HH:MM ni null`);
    if (validHour(e?.hora) && !validDay(e?.fecha)) out.push(`${who}: tiene hora pero no fecha`);
    if (validHour(e?.fin) && (!validHour(e?.hora) || e.fin <= e.hora)) out.push(`${who}: «fin» debe ser posterior a «hora»`);
    for (const k of ['tipo', 'con', 'invitado', 'colabora', 'ciclo']) if (has(e, k) && !text(e[k])) out.push(`${who}: «${k}» es un texto o null`);
    if (has(e, 'fuente') && !/^https:\/\/\S+$/.test(text(e.fuente))) out.push(`${who}: «fuente» es el enlace https de la publicación de origen (no se imprime)`);
    if (has(e, 'costo') && !(Array.isArray(e.costo) && e.costo.length && e.costo.length <= COSTO_MAX && e.costo.every(c => text(c)))) out.push(`${who}: «costo» es una lista de 1 a ${COSTO_MAX} renglones de texto (o no va)`);
    if (has(e, 'registro')) out.push(`${who}: «registro» ya no se usa: la reserva va en «reserva» ({ "tipo": "luma", "url": … })`);
    if (e?.reserva !== null) {
      if (!e?.reserva || typeof e.reserva !== 'object') out.push(`${who}: «reserva» es { "tipo": "luma", "url" }, { "tipo": "whatsapp", "telefono" } o null`);
      else if (e.reserva.tipo === 'luma') { if (!validRegistro(e.reserva.url)) out.push(`${who}: la reserva por Luma lleva una «url» https://lu.ma/… o https://luma.com/…`); }
      else if (e.reserva.tipo === 'whatsapp') { if (!/^[1-9]\d{9}$/.test(String(e.reserva.telefono ?? ''))) out.push(`${who}: la reserva por WhatsApp lleva un «telefono» de 10 dígitos (sin 52, espacios ni guiones)`); }
      else out.push(`${who}: «reserva.tipo» es "luma" o "whatsapp"`);
      if (!validDay(e?.fecha)) out.push(`${who}: tiene reserva pero no fecha`);
    }
  });
  return out;
}

// Partes de una fecha en español (México), sin puntos de abreviatura. El mediodía de Monterrey (UTC−6 todo el año) no cambia de día al dar formato.
const noonOf = fecha => { const [y, m, d] = fecha.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 18)); };
const partsOf = (fecha, opts) => Object.fromEntries(new Intl.DateTimeFormat('es-MX', { timeZone: MTY, ...opts }).formatToParts(noonOf(fecha)).map(p => [p.type, p.value.replace('.', '')]));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Insignia de estado de una propuesta o fecha corta de un evento: «Propuesta · sin fecha», «Sáb 21 nov · 18:30», «Hoy · 19:00».
 * `fecha` es AAAA-MM-DD o AAAA-MM-DDTHH:MM (hora de Monterrey). Sin fecha real, o con una que ya pasó, es una propuesta: nunca se
 * anuncia una fecha que no esté confirmada y vigente.
 */
export function eventBadge(fecha, now = new Date()) {
  const quiet = { kind: 'propuesta', text: NO_DATE };
  const m = /^(\d{4}-\d{2}-\d{2})(?:T(([01]\d|2[0-3]):[0-5]\d))?$/.exec(String(fecha ?? '').trim());
  if (!m || !validDay(m[1])) return quiet;
  const key = m[1], hora = m[2];
  const today = dayKey(now);
  if (key < today) return quiet;
  const p = partsOf(key, { weekday: 'short', day: 'numeric', month: 'short' });
  let out = key === today ? 'Hoy' : `${cap(p.weekday)} ${p.day} ${p.month}${key.slice(0, 4) === today.slice(0, 4) ? '' : ` ${key.slice(0, 4)}`}`;
  if (hora) out += ` · ${hora}`;
  return { kind: key === today ? 'hoy' : 'fecha', text: out, date: key };
}
/**
 * Bloque de fecha del destacado y rótulo de día de la lista: «Sáb», «21», «Nov» (y `anio` solo si no es el de hoy). Decorativo: la fecha
 * completa va en texto al lado (fechaLarga).
 */
export function fechaBloque(fecha, now = new Date()) {
  const p = partsOf(fecha, { weekday: 'short', day: 'numeric', month: 'short' });
  const out = { sem: cap(p.weekday), num: p.day, mes: cap(p.month) };
  if (fecha.slice(0, 4) !== dayKey(now).slice(0, 4)) out.anio = fecha.slice(0, 4);
  return out;
}
/** «sábado 21 de noviembre» (con el año si no es el de hoy), en minúsculas: quien la usa al empezar un renglón la pone en mayúscula. */
export function fechaLarga(fecha, now = new Date()) {
  const p = partsOf(fecha, { weekday: 'long', day: 'numeric', month: 'long' });
  const anio = fecha.slice(0, 4);
  return `${p.weekday} ${p.day} de ${p.month}${anio === dayKey(now).slice(0, 4) ? '' : ` de ${anio}`}`;
}
/** «AAAA-MM-DD» movido `n` meses (negativo = atrás). Si el día no existe en el mes de llegada (31 de marzo − 1 mes, 29 de febrero − 12 meses) cae en el último día de ese mes. */
export function shiftMonths(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  const t = y * 12 + (m - 1) + n, ny = Math.floor(t / 12), nm = t % 12;
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${String(ny).padStart(4, '0')}-${String(nm + 1).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}
/** Fecha de una fila de «Eventos anteriores»: «Sáb · 21 Nov» (con el año si no es el año en curso: «Sáb · 21 Nov · 2025»). El CSS la pone en versalitas. */
export function fechaPasada(fecha, now = new Date()) {
  const p = fechaBloque(fecha, now);
  return `${p.sem} · ${p.num} ${p.mes}${p.anio ? ` · ${p.anio}` : ''}`;
}
/** Plegado de «Eventos anteriores»: los `limit` más recientes y, si hay más, el botón «Ver los N anteriores» / «Ver menos» (mismo patrón que foldView del Catálogo). */
export function foldAnteriores(total, { expanded = false, limit = ANTERIORES_VISIBLES } = {}) {
  const fold = total > limit;
  const folded = fold && !expanded;
  return { fold, folded, limit: folded ? limit : total, label: folded ? `Ver los ${total} anteriores` : 'Ver menos' };
}
/** «18:30» o «18:30–20:00»; vacío sin hora. */
export const horario = e => (e.hora ? (e.fin ? `${e.hora}–${e.fin}` : e.hora) : '');
/**
 * Quién (renglón de la lista y del calendario): «Con Fulana · Invita a Zutano» con lo que el evento traiga (`con`: quien conduce o imparte;
 * `invitado`). No se escribe «invitada» ni «invitado»: el dato no trae género. `colabora` solo va donde se pide («Colabora Ediciones Tal»).
 */
export const quienLine = (e, { colabora = false } = {}) => [e.con ? `Con ${e.con}` : '', e.invitado ? `Invita a ${e.invitado}` : '', colabora && e.colabora ? `Colabora ${e.colabora}` : ''].filter(Boolean).join(' · ');
/** Renglón del inicio: «Próximo: Sáb 21 nov · Título» (el día de hoy, «Hoy · 18:30 · Título»). */
export function avisoLine(e, now = new Date()) {
  const hoy = e.fecha === dayKey(now);
  const b = eventBadge(hoy && e.hora ? `${e.fecha}T${e.hora}` : e.fecha, now);
  return hoy ? `${b.text} · ${e.titulo}` : `Próximo: ${b.text} · ${e.titulo}`;
}
/** El mensaje ya escrito de «Reservar por WhatsApp» y su enlace (wa.me/52 + 10 dígitos). */
export const reservaMessage = (e, now = new Date()) => `Hola, quiero reservar para «${e.titulo}» del ${fechaLarga(e.fecha, now)}.`;
export const reservaUrl = (e, now = new Date()) => (e.reserva?.tipo === 'whatsapp' ? `https://wa.me/52${e.reserva.telefono}?text=${encodeURIComponent(reservaMessage(e, now))}` : e.reserva?.tipo === 'luma' ? e.reserva.url : null);

/**
 * Qué se muestra hoy y en qué orden. Próximos = fecha de hoy en adelante (hasta PROXIMOS_MESES), por fecha y hora (a igualdad, el orden del
 * archivo): el primero es el destacado y los demás se agrupan por día. Anteriores = fecha anterior a hoy y no más vieja que ANTERIORES_MESES
 * (el día exacto, inclusive), del más reciente al más antiguo (a igualdad, la hora más tarde primero y luego el orden del archivo); lo más
 * viejo no se muestra. El evento de hoy es próximo, no anterior. Los de fecha null son las propuestas, al final y nunca anteriores.
 * `aviso` es el renglón del inicio (null sin eventos con fecha), `hasta` la fecha del último evento vigente y `reservas`, los tipos de
 * reserva presentes entre los próximos (para la nota lateral).
 */
export function eventosPlan(list, now = new Date()) {
  const hoy = dayKey(now);
  const limite = shiftMonths(hoy, PROXIMOS_MESES), desde = shiftMonths(hoy, -ANTERIORES_MESES);
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const dated = list.map((e, i) => ({ e, i })).filter(x => x.e.fecha);
  const proximos = dated.filter(x => x.e.fecha >= hoy && x.e.fecha <= limite)
    .sort((a, b) => cmp(a.e.fecha, b.e.fecha) || cmp(a.e.hora ?? '', b.e.hora ?? '') || a.i - b.i)
    .map(x => x.e);
  const anteriores = dated.filter(x => x.e.fecha < hoy && x.e.fecha >= desde)
    .sort((a, b) => cmp(b.e.fecha, a.e.fecha) || cmp(b.e.hora ?? '', a.e.hora ?? '') || a.i - b.i)
    .map(x => x.e);
  const [destacado = null, ...resto] = proximos;
  const dias = [];
  for (const e of resto) { const d = dias.at(-1); if (d && d.fecha === e.fecha) d.eventos.push(e); else dias.push({ fecha: e.fecha, eventos: [e] }); }
  return {
    hoy, destacado, dias, anteriores,
    propuestas: list.filter(e => !e.fecha),
    conFecha: proximos.length,
    reservas: ['luma', 'whatsapp'].filter(t => proximos.some(e => e.reserva?.tipo === t)),
    aviso: destacado ? avisoLine(destacado, now) : null,
    hasta: proximos.length ? proximos.at(-1).fecha : null
  };
}
/** La nota lateral según cómo se reserva en los eventos a la vista: título y frase (el enlace a Instagram se añade al pintar). */
export function notaCopy(reservas) {
  const luma = reservas.includes('luma'), wa = reservas.includes('whatsapp');
  if (luma && wa) return { titulo: '¿Cómo me registro?', texto: 'Cada evento lo dice: «Registrarme» abre su página en Luma, en otra pestaña; «Reservar por WhatsApp» abre el chat con el mensaje ya escrito.' };
  if (luma) return { titulo: '¿Cómo me registro?', texto: 'Toca «Registrarme» en el evento que te interese: su página en Luma se abre en otra pestaña.' };
  if (wa) return { titulo: '¿Cómo reservo?', texto: 'Toca «Reservar por WhatsApp» en el evento que te interese: el mensaje ya va escrito.' };
  return { titulo: 'Fechas nuevas', texto: '' };
}

// ---------- Calendario: un archivo .ics (RFC 5545) armado en el navegador ----------
const pad = n => String(n).padStart(2, '0');
const icsText = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/([,;])/g, '\\$1');
// Un renglón no pasa de 75 octetos (UTF-8): el resto sigue en renglones que empiezan con un espacio. Nunca se parte una letra.
function icsFold(line) {
  const out = [];
  let cur = '', bytes = 0;
  for (const ch of line) {
    const cp = ch.codePointAt(0), n = cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
    if (bytes + n > 75) { out.push(cur); cur = ' '; bytes = 1; }
    cur += ch; bytes += n;
  }
  out.push(cur);
  return out.join('\r\n');
}
/** La hora de pared de Monterrey como instante (UTC). Parte de UTC−6 y deja que Intl corrija si la regla de la zona fuera otra ese día. */
export function mtyToUtc(fecha, hora) {
  const [y, m, d] = fecha.split('-').map(Number), [h, mi] = hora.split(':').map(Number);
  const want = Date.UTC(y, m - 1, d, h, mi);
  const guess = want + 6 * 3_600_000;
  const g = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: MTY, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(guess)).map(p => [p.type, Number(p.value)]));
  return new Date(guess + (want - Date.UTC(g.year, g.month - 1, g.day, g.hour % 24, g.minute)));
}
const utcStamp = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
export const ICS_BLOQUE_MIN = 60; // sin hora de fin, el calendario aparta una hora (lo habitual al crear un evento); con `fin`, lo que diga
/**
 * El evento como archivo de calendario. Con hora: DTSTART y DTEND en UTC (la hora de Monterrey convertida), que todo calendario entiende
 * sin tabla de zonas; sin hora, evento de día completo. Título, lugar y descripción con comas, puntos y coma y saltos escapados; renglones
 * terminados en CRLF y plegados a 75 octetos. Devuelve null si el evento no tiene una fecha real.
 */
export function icsOf(e, { now = new Date() } = {}) {
  if (!e || !validDay(e.fecha)) return null;
  const ymd = e.fecha.replaceAll('-', '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Libreria Itinerante y Mas//Eventos//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${e.id}-${ymd}@libreria-itinerante-y-mas`, `DTSTAMP:${utcStamp(now)}`];
  if (validHour(e.hora)) {
    const start = mtyToUtc(e.fecha, e.hora);
    const end = validHour(e.fin) && e.fin > e.hora ? mtyToUtc(e.fecha, e.fin) : new Date(start.getTime() + ICS_BLOQUE_MIN * 60_000);
    lines.push(`DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(end)}`);
  } else {
    const next = new Date(Date.UTC(+e.fecha.slice(0, 4), +e.fecha.slice(5, 7) - 1, +e.fecha.slice(8, 10) + 1));
    lines.push(`DTSTART;VALUE=DATE:${ymd}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replaceAll('-', '')}`);
  }
  const reserva = e.reserva?.tipo === 'luma' ? `Registro: ${e.reserva.url}` : e.reserva?.tipo === 'whatsapp' ? `Reserva por WhatsApp: +52 ${e.reserva.telefono}` : '';
  const about = [[e.tipo, e.ciclo, quienLine(e, { colabora: true })].filter(Boolean).join(' · '), e.descripcion, (e.costo ?? []).join('\n'), reserva].filter(Boolean).join('\n');
  lines.push(`SUMMARY:${icsText(e.titulo)}`, `LOCATION:${icsText(LUGAR)}`);
  if (about) lines.push(`DESCRIPTION:${icsText(about)}`);
  if (e.reserva?.tipo === 'luma') lines.push(`URL:${e.reserva.url}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(icsFold).join('\r\n') + '\r\n';
}

// Nombres accesibles de los controles de un evento: la acción y el título (dos eventos no comparten nombre).
export const shareName = title => `Compartir «${title || 'este evento'}»`;
export const calName = title => `Añadir «${title || 'este evento'}» al calendario`;
export const registroName = title => `Registrarme en «${title || 'este evento'}» (abre Luma en otra pestaña)`;
export const reservaName = title => `Reservar por WhatsApp para «${title || 'este evento'}»`;
/** Lo que se comparte de un evento: título, fecha vigente (o que es una propuesta) y el enlace a la sección. */
export function shareData(e, { now = new Date(), url = '' } = {}) {
  const when = eventBadge(e.fecha && e.hora ? `${e.fecha}T${e.hora}` : e.fecha, now);
  const state = when.kind === 'propuesta' ? 'una propuesta de Eventos y talleres de Librería Itinerante y Más (sin fecha confirmada todavía)' : `${when.text} en Librería Itinerante y Más`;
  return { title: `${e.titulo} · Librería Itinerante y Más`, text: `${e.titulo}: ${state}.`, url };
}

// ---------------------------------------------------------------------------------------------
// Interfaz (solo navegador)

const notify = async msg => { try { (await import('./saved.js')).notify(msg); } catch { /* sin el aviso, el archivo o el enlace ya salieron */ } };
const store = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
const writeHasta = day => { try { if (day) store()?.setItem(HASTA_KEY, day); else store()?.removeItem(HASTA_KEY); } catch { /* sin almacenamiento: la próxima visita no reserva el renglón */ } };

let dataLoad;
const loadEventos = () => (dataLoad ??= fetch(EVENTOS_URL).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then(validEventos).catch(e => { dataLoad = undefined; throw e; }));
let known = []; // los eventos pintados: «Añadir al calendario» y «Compartir» los buscan por id

export async function shareEvento(e) {
  const data = shareData(e, { url: `${location.origin}${location.pathname}#cartelera` });
  if (navigator.share) {
    try { await navigator.share(data); return; } catch (err) { if (err?.name === 'AbortError') return; /* sin hoja de compartir: se copia */ }
  }
  try { await navigator.clipboard.writeText(data.url); notify('Enlace copiado.'); } catch { notify('No se pudo copiar. Copia la dirección desde el navegador.'); }
}
let lastUrl = '';
/** Descarga el .ics del evento (un enlace con `download` a un Blob: la CSP del sitio no lo impide) y lo dice en el aviso. */
export function downloadIcs(e) {
  const ics = icsOf(e);
  if (!ics) return false;
  if (lastUrl) URL.revokeObjectURL(lastUrl); // el anterior ya se descargó
  lastUrl = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = lastUrl;
  a.download = `${e.id}.ics`;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  notify('Se descargó el evento para tu calendario.');
  return true;
}
// app.js llama aquí al tocar «Compartir» o «Añadir al calendario» (carga este módulo al primer toque si aún no llegó).
export async function onAct(btn) {
  if (!known.length) { try { known = await loadEventos(); } catch { return; } }
  const e = known.find(x => x.id === (btn.dataset.share ?? btn.dataset.evCal));
  if (!e) return;
  if (btn.matches('[data-share]')) return shareEvento(e);
  if (btn.matches('[data-ev-cal]')) return downloadIcs(e);
}

// ---------- Aviso del inicio y punto de «Eventos» ----------
// El renglón solo se reserva antes del primer render (boot.js, clase ev-hint) si la visita anterior dejó un evento vigente. Si lo que resultó
// no coincide, se corrige cuando el inicio está fuera de la vista: nada salta a los ojos de la persona (igual que el control de Novedades).
function settleHint(wanted) {
  const root = document.documentElement;
  const entry = document.getElementById('inicio');
  if (root.classList.contains('ev-hint') === wanted) return;
  if (!entry || !('IntersectionObserver' in window)) { root.classList.toggle('ev-hint', wanted); return; }
  const io = new IntersectionObserver(es => {
    if (es.some(x => x.isIntersecting)) return;
    io.disconnect();
    root.classList.toggle('ev-hint', wanted);
  });
  io.observe(entry);
}
function applyAviso(plan) {
  const on = Boolean(plan.aviso);
  document.querySelectorAll('[data-ev-dot]').forEach(d => { d.hidden = !on; });
  document.querySelectorAll('[data-ev-sr]').forEach(s => { s.textContent = on ? `, ${plan.aviso.replace(/^Próximo: /, 'próximo: ')}` : ''; });
  const cta = document.querySelector('[data-ev-cta]');
  if (cta) {
    if (on) cta.querySelector('[data-ev-cta-text]').textContent = plan.aviso;
    cta.hidden = !on;
  }
  settleHint(on);
  writeHasta(plan.hasta);
}
let avisoLoad;
/**
 * Aviso temprano: solo pide eventos.json (pequeño) para saber si hay un evento con fecha vigente. No pinta la sección ni bloquea el primer
 * render (app.js lo llama después de la foto y las fuentes). Un fallo de red no borra lo recordado: la próxima visita vuelve a reservar.
 */
export function initEventosAviso() {
  if (typeof document === 'undefined') return Promise.resolve(null);
  return (avisoLoad ??= loadEventos().then(list => { const plan = eventosPlan(list); applyAviso(plan); return plan; }).catch(() => { avisoLoad = undefined; return null; }));
}

// ---------- Pintar la sección ----------
const NS = 'http://www.w3.org/2000/svg';
const make = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
function icon(id) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ic');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}
const badge = txt => make('span', 'badge', txt); // la única insignia con relleno: «Próximo» u «Hoy»
function photo(e, cls, alt = e.alt) {
  if (!e.imagen) return null;
  const img = make('img', cls);
  img.src = e.imagen;
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  return img;
}
// La acción de reserva del evento (null si no trae): «Registrarme» abre su página en Luma en otra pestaña (el nombre accesible lo dice);
// «Reservar por WhatsApp» abre el chat con el mensaje ya escrito.
function reservaLink(e, cls) {
  if (!e.reserva) return null;
  const wa = e.reserva.tipo === 'whatsapp';
  const a = make('a', cls);
  a.href = reservaUrl(e);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('aria-label', wa ? reservaName(e.titulo) : registroName(e.titulo));
  a.dataset.evReserva = e.reserva.tipo;
  a.append(make('span', '', wa ? 'Reservar por WhatsApp' : 'Registrarme'), ' ', icon(wa ? 'i-chat' : 'i-ne'));
  return a;
}
function calButton(e, cls, rotulo) {
  const b = make('button', cls);
  b.type = 'button';
  b.dataset.evCal = e.id;
  if (rotulo) b.append(make('span', '', 'Añadir al calendario'), ' ', icon('i-cal'));
  else { b.setAttribute('aria-label', calName(e.titulo)); b.append(icon('i-cal')); }
  return b;
}
function shareButton(e, cls) {
  const b = make('button', cls);
  b.type = 'button';
  b.dataset.share = e.id;
  b.dataset.title = e.titulo;
  b.setAttribute('aria-label', shareName(e.titulo));
  b.append(icon('i-share'));
  return b;
}
// Fecha tipográfica del destacado: «SÁB · NOV» en versalitas (el CSS pone la mayúscula) y el número grande y ligero debajo. Decorativa: la fecha
// completa va en texto (para lectores de pantalla) dentro del encabezado.
function fechaNode(e, now) {
  const p = fechaBloque(e.fecha, now);
  const box = make('span', 'ev-fecha');
  box.setAttribute('aria-hidden', 'true');
  box.append(make('span', 'ev-fecha-rot', `${p.sem} · ${p.mes}${p.anio ? ` · ${p.anio}` : ''}`), make('b', 'ev-fecha-num', p.num));
  return box;
}
// Costo tal como lo da la librería (dato del anuncio): en el destacado, todos los renglones (un dato más de la lista de definición); en la
// lista, el primero. Sin el campo, nada.
function costoNode(e, all) {
  if (!e.costo.length) return null;
  if (!all) { const p = make('p', 'ev-costo', e.costo[0]); p.dataset.fuente = 'anuncio'; return p; }
  const ul = make('ul', 'ev-costo');
  ul.dataset.fuente = 'anuncio';
  ul.append(...e.costo.map(c => make('li', '', c)));
  return ul;
}
// Datos del destacado como lista de definición (hora, con, invita, colabora, costo): un renglón por dato, solo los que el evento trae.
function datosNode(e) {
  const rows = [['Hora', horario(e)], ['Con', e.con], ['Invita', e.invitado], ['Colabora', e.colabora], ['Costo', costoNode(e, true)]].filter(([, v]) => v);
  if (!rows.length) return null;
  const dl = make('dl', 'ev-datos');
  for (const [k, v] of rows) {
    const row = make('div', k === 'Costo' ? 'ev-dato ev-dato--costo' : 'ev-dato');
    const dd = make('dd');
    dd.append(v);
    row.append(make('dt', '', k), dd);
    dl.append(row);
  }
  return dl;
}
// El destacado: foto (16:9, a sangre) o cartel (entero y cuadrado, como un objeto sobre fondo suave), fecha tipográfica, «Próximo» y tipo, el título
// (Title 1), la descripción, los datos y las acciones. La acción con rótulo (primaria de 56) es la reserva que el evento traiga; si no trae,
// «Añadir al calendario». El calendario y «Compartir» son iconos de contorno de 44.
export function destacadoNode(e, now = new Date()) {
  const art = make('article', e.encuadre === 'cartel' ? 'ev-prox ev-prox--cartel' : 'ev-prox');
  art.dataset.id = e.id;
  art.setAttribute('aria-labelledby', `ev-t-${e.id}`);
  const img = photo(e, 'ev-prox-img');
  const sinFoto = () => art.classList.add('ev-prox--sin-foto'); // sin figura, el cuerpo toma todo el ancho del panel
  if (img) { const fig = make('figure', 'ev-prox-fig'); img.addEventListener('error', () => { fig.remove(); sinFoto(); }); fig.append(img); art.append(fig); } else sinFoto();
  const body = make('div', 'ev-prox-cuerpo');
  const rot = make('div', 'ev-rot');
  rot.append(badge(e.fecha === dayKey(now) ? 'Hoy' : 'Próximo'));
  if (e.tipo) rot.append(make('span', 'ev-tipo', e.tipo));
  if (e.ciclo) rot.append(make('span', 'ev-tipo', e.ciclo));
  const tit = make('h3', 'ev-prox-tit', e.titulo);
  tit.id = `ev-t-${e.id}`;
  const id = make('div', 'ev-prox-id');
  id.append(rot, tit, make('p', 'sr-only', cap(fechaLarga(e.fecha, now))));
  const enc = make('header', 'ev-prox-enc'); // la fecha y, separado por una línea fina, el rótulo y el título
  enc.append(fechaNode(e, now), id);
  body.append(enc);
  if (e.descripcion) body.append(make('p', 'ev-prox-desc', e.descripcion));
  const datos = datosNode(e);
  if (datos) body.append(datos);
  const acc = make('div', 'ev-acc');
  const reserva = reservaLink(e, 'btn btn--primario btn--lg');
  if (reserva) acc.append(reserva, calButton(e, 'btn btn--contorno btn--sm btn--icono'));
  else acc.append(calButton(e, 'btn btn--primario btn--lg', true));
  acc.append(shareButton(e, 'btn btn--contorno btn--sm btn--icono'));
  body.append(acc);
  art.append(body);
  return art;
}
// Fila de la lista: «hora · tipo · ciclo» (o «tipo · Propuesta · sin fecha») como texto, título, quién, el primer renglón del costo, la portada
// cuadrada a la derecha y, con fecha, sus acciones de 44 (la reserva de contorno que traiga y el calendario plano; si no hay reserva,
// «Añadir al calendario» con rótulo). Una propuesta lleva su descripción y ninguna acción.
export function cardNode(e, { level = 'h3' } = {}) {
  const li = make('li', 'ev-fila');
  li.dataset.id = e.id;
  const art = make('article', 'ev-card');
  art.setAttribute('aria-labelledby', `ev-t-${e.id}`);
  const txt = make('div', 'ev-card-txt');
  const rot = make('div', 'ev-rot');
  if (e.fecha) {
    if (e.hora) rot.append(make('span', 'ev-hora', horario(e)));
    if (e.tipo) rot.append(make('span', 'ev-tipo', e.tipo));
  } else {
    if (e.tipo) rot.append(make('span', 'ev-tipo', e.tipo));
    const when = make('span', 'ev-estado', NO_DATE);
    when.dataset.evWhen = '';
    rot.append(when);
  }
  if (e.ciclo) rot.append(make('span', 'ev-tipo', e.ciclo));
  const tit = make(level, 'ev-card-tit', e.titulo);
  tit.id = `ev-t-${e.id}`;
  txt.append(rot, tit);
  const quien = quienLine(e);
  if (quien) txt.append(make('p', 'ev-card-meta', quien));
  const costo = e.fecha ? costoNode(e, false) : null;
  if (costo) txt.append(costo);
  art.append(txt);
  const img = photo(e, 'ev-card-img');
  if (img) { img.addEventListener('error', () => img.remove()); art.append(img); }
  if (!e.fecha && e.descripcion) art.append(make('p', 'ev-card-desc', e.descripcion));
  if (e.fecha) {
    const acc = make('div', 'ev-card-acc');
    const reserva = reservaLink(e, 'btn btn--contorno btn--sm');
    if (reserva) acc.append(reserva, calButton(e, 'btn btn--plano btn--sm btn--icono'));
    else acc.append(calButton(e, 'btn btn--contorno btn--sm', true));
    art.append(acc);
  }
  li.append(art);
  return li;
}
// Fila de «Eventos anteriores»: fecha tipográfica pequeña (versalitas; la fecha completa va en texto para lectores de pantalla), título, «tipo · Con …» y
// la portada cuadrada a la derecha (un cartel se recorta a cuadrado en la miniatura). La fila no es un control: sin acciones, sin reserva, sin costo.
// La miniatura es decorativa (alt vacío: el título y la fecha ya están en el texto); si no carga se quita y la fila queda sin foto, nunca un recuadro roto.
export function pasadoNode(e, now = new Date(), { level = 'h4' } = {}) {
  const li = make('li', 'ev-pasado');
  li.dataset.id = e.id;
  const txt = make('div', 'ev-pas-txt');
  const fecha = make('p', 'ev-pas-fecha');
  const vis = make('span', '', fechaPasada(e.fecha, now));
  vis.setAttribute('aria-hidden', 'true');
  fecha.append(vis, make('span', 'sr-only', cap(fechaLarga(e.fecha, now))));
  txt.append(fecha, make(level, 'ev-pas-tit', e.titulo));
  const meta = [e.tipo, quienLine(e)].filter(Boolean).join(' · ');
  if (meta) txt.append(make('p', 'ev-pas-meta', meta));
  li.append(txt);
  const img = photo(e, 'ev-pas-img', '');
  if (img) { img.addEventListener('error', () => img.remove()); li.append(img); }
  return li;
}
// «Ver los N anteriores» / «Ver menos»: despliega en su sitio. El resto de las filas se arma en el primer despliegue (con cientos de eventos
// pasados, el inicio solo pinta 6); el foco se queda en el botón y, al plegar, la página sube lo que la lista encogió para que el botón no se
// mueva bajo el cursor. Las filas que se suman entran escalonadas solo con movimiento (como «Ver los 41 títulos» del Catálogo).
let motionOn = () => false;
function wireFold(btn, ul, rest, now) {
  const total = ul.children.length + rest.length;
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') !== 'true';
    const y = btn.getBoundingClientRect().top;
    const before = [...ul.children].filter(li => !li.hidden).length;
    if (expanded && rest.length) ul.append(...rest.splice(0).map(e => pasadoNode(e, now)));
    const v = foldAnteriores(total, { expanded });
    [...ul.children].forEach((li, i) => { li.hidden = i >= v.limit; });
    btn.setAttribute('aria-expanded', String(expanded));
    btn.textContent = v.label;
    if (expanded) staggerIn([...ul.children].slice(before));
    else scrollBy(0, btn.getBoundingClientRect().top - y);
  });
}
function anterioresNode(plan, now) {
  const sec = make('section', 'ev-grupo ev-anteriores');
  const h = make('h3', 'ev-sub', 'Eventos anteriores');
  h.id = 'ev-anteriores-t';
  sec.setAttribute('aria-labelledby', h.id);
  const ul = make('ul', 'ev-pasados');
  ul.id = 'ev-pasados';
  const v = foldAnteriores(plan.anteriores.length);
  ul.append(...plan.anteriores.slice(0, v.limit).map(e => pasadoNode(e, now)));
  sec.append(h, ul);
  if (v.fold) {
    const btn = make('button', 'btn btn--contorno ev-fold', v.label);
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', ul.id);
    wireFold(btn, ul, plan.anteriores.slice(v.limit), now);
    sec.append(btn);
  }
  return sec;
}
function listNode(events, level) {
  const ul = make('ul', 'ev-filas');
  ul.append(...events.map(e => cardNode(e, { level })));
  return ul;
}
// La nota lateral: cómo reservar según los tipos presentes (notaCopy) y dónde se anuncian las fechas. El enlace a Instagram vive aquí cuando
// la entradilla pasa a «Lo que viene en la casa.».
function notaNode(plan) {
  const copy = notaCopy(plan.reservas);
  const aside = make('aside', 'ev-lado');
  const p = make('p', 'ev-lado-txt');
  const ig = make('a', '', 'Instagram');
  ig.href = INSTAGRAM;
  ig.target = '_blank';
  ig.rel = 'noopener noreferrer';
  ig.append(icon('i-ne'));
  if (copy.texto) p.append(`${copy.texto} Las fechas nuevas también se anuncian en `, ig, '.');
  else p.append('Se anuncian en ', ig, '.');
  aside.append(make('h3', 'ev-lado-tit', copy.titulo), p);
  return aside;
}
/** El interior de la sección según el plan (nodos sueltos, en orden). Sin nada que mostrar, una lista vacía. */
export function eventosNodes(plan, now = new Date()) {
  const out = [];
  if (plan.destacado) out.push(destacadoNode(plan.destacado, now));
  const lista = make('div', 'ev-lista');
  if (plan.dias.length) {
    const dias = make('div', 'ev-dias');
    for (const d of plan.dias) {
      const sec = make('section', 'ev-dia');
      const p = fechaBloque(d.fecha, now);
      const h = make('h4', 'ev-dia-tit'); // «SÁB · 28 NOV» (o «HOY · 16 NOV»): decorativo; la fecha completa va en texto para lectores de pantalla
      h.id = `ev-d-${d.fecha}`;
      const vis = make('span', 'ev-dia-vis');
      vis.setAttribute('aria-hidden', 'true');
      vis.append(make('span', 'ev-dia-sem', d.fecha === plan.hoy ? 'Hoy' : p.sem), make('b', 'ev-dia-num', p.num), make('span', 'ev-dia-mes', `${p.mes}${p.anio ? ` ${p.anio}` : ''}`));
      h.append(make('span', 'sr-only', cap(fechaLarga(d.fecha, now))), vis);
      sec.setAttribute('aria-labelledby', h.id);
      sec.append(h, listNode(d.eventos, 'h5'));
      dias.append(sec);
    }
    const bloque = make('div', 'ev-grupo');
    bloque.append(make('h3', 'ev-sub', 'Después'), dias);
    lista.append(bloque);
  }
  if (plan.propuestas.length) {
    const sec = make('section', 'ev-grupo ev-propuestas');
    if (plan.conFecha) { // junto a eventos con fecha, las propuestas llevan su rótulo; solas, lo dice la entradilla
      const h = make('h3', 'ev-sub', 'Propuestas, aún sin fecha');
      h.id = 'ev-propuestas-t';
      sec.setAttribute('aria-labelledby', h.id);
      sec.append(h);
    } else sec.setAttribute('aria-label', 'Propuestas');
    sec.append(listNode(plan.propuestas, plan.conFecha ? 'h4' : 'h3'));
    lista.append(sec);
  }
  if (plan.anteriores.length) lista.append(anterioresNode(plan, now)); // solo existe con al menos un evento pasado vigente
  if (lista.children.length || plan.conFecha) {
    const despues = make('div', 'ev-despues');
    if (lista.children.length) despues.append(lista);
    if (plan.conFecha) despues.append(notaNode(plan));
    out.push(despues);
  }
  return out;
}

// Entrada de las piezas que aún no se ven (solo con movimiento): cada una espera oculta (.ev-espera) y entra al llegar a la vista, 8 px y
// opacidad en dur-rapida; las que llegan juntas van escalonadas (escalon-linea) y todas dentro de dur-lenta. Lo que ya está a la vista no
// se oculta nunca. Sin movimiento («reducir movimiento» o la pausa) todo queda colocado: .ev-espera solo vale bajo .motion.
const reveal = (n, i, { dur, step, tope }) => n.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: dur, delay: Math.min(i * step, tope), easing: EASE(), fill: 'backwards' });
const timing = () => ({ dur: DUR('rapida'), step: ms('escalon-linea'), tope: DUR('lenta') - DUR('rapida') });
function enterOnView(nodes, isMotion) {
  if (!isMotion() || !('IntersectionObserver' in window)) return;
  const waiting = nodes.filter(n => n.getBoundingClientRect().top >= innerHeight);
  if (!waiting.length) return;
  waiting.forEach(n => n.classList.add('ev-espera'));
  const t = timing();
  const io = new IntersectionObserver(es => {
    es.filter(x => x.isIntersecting).forEach((x, i) => {
      io.unobserve(x.target);
      x.target.classList.remove('ev-espera');
      if (isMotion()) reveal(x.target, i, t);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  waiting.forEach(n => io.observe(n));
}
// Las filas que suma «Ver los N anteriores» y caen en la vista entran escalonadas (mismo gesto, mismos tokens); arrancan en el fotograma siguiente
// al cambio. Sin movimiento no hacen nada.
function staggerIn(items) {
  if (!motionOn() || !items.length) return;
  requestAnimationFrame(() => {
    const vh = innerHeight, t = timing();
    items.filter(n => { const r = n.getBoundingClientRect(); return r.bottom > 0 && r.top < vh; }).forEach((n, i) => reveal(n, i, t));
  });
}

// Lo que index.html ya trae pintado (las propuestas): si coincide con el plan, no se vuelve a pintar (ni un parpadeo de las fotos).
const staticSignature = root => [...root.querySelectorAll('.ev-fila')].map(li => `${li.dataset.id}|${li.querySelector('.ev-card-tit')?.textContent.trim()}|${li.querySelector('.ev-card-desc')?.textContent.trim() ?? ''}`).join('\n');
const planSignature = plan => plan.propuestas.map(e => `${e.id}|${e.titulo}|${e.descripcion}`).join('\n');

/** Pinta Eventos y talleres (al acercarse a la sección): pide eventos.json, arma el plan del día y sustituye lo que trae index.html solo si cambia. */
export async function initEventos({ isMotion = () => false } = {}) {
  const root = document.querySelector('[data-ev]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  motionOn = isMotion;
  const now = new Date();
  let plan;
  try { known = await loadEventos(); plan = eventosPlan(known, now); } catch { delete root.dataset.ready; return; } // sin datos queda lo que trae index.html
  applyAviso(plan);
  if (!plan.conFecha && staticSignature(root) === planSignature(plan)) { // lo de index.html sigue vigente: solo se suman los anteriores, sin repintar las propuestas
    const lista = root.querySelector('.ev-lista');
    if (plan.anteriores.length && lista) { lista.append(anterioresNode(plan, now)); enterOnView([...lista.querySelectorAll('.ev-pasado')], isMotion); }
    root.classList.add('is-ready');
    return;
  }
  root.replaceChildren(...eventosNodes(plan, now));
  const lede = document.querySelector('[data-ev-lede]');
  if (lede && plan.conFecha) lede.textContent = 'Lo que viene en la casa.';
  root.classList.add('is-ready');
  enterOnView([...root.querySelectorAll('.ev-prox, .ev-dia-tit, .ev-fila, .ev-pasado, .ev-lado')], isMotion);
  if (plan.destacado) document.dispatchEvent(new CustomEvent('iti:primarias')); // app.js: la primaria de la barra cede ante la del destacado
}

#!/usr/bin/env node
// Sincroniza el sitio con la hoja de Google de la librería (2026-11-16).
//
//   · LIBROS: exporta la hoja a .xlsx (API de Drive) y corre el importador de siempre (scripts/import-inventario.py). Los libros que no
//     estaban en el catálogo de HEAD entran a «Novedades» (assets/data/collections.json, novedades.entradas) con la fecha de hoy en Monterrey.
//     La primera corrida (catálogo previo vacío) solo toma la línea base: no marca nada como nuevo.
//   · EVENTOS: lee la pestaña «Eventos» (API de Sheets), valida cada fila con las mismas reglas del sitio (feed.js: validEventos y
//     eventosProblems), baja el cartel de Drive y lo convierte a WebP (scripts/imagen-evento.py). Una fila con un error no se publica y su motivo
//     va al informe; el resto sí. Los eventos con origen «hoja» (campo `origen`) los gobierna la hoja: lo que desaparece de ella desaparece
//     del sitio. Los que no traen ese campo (las propuestas de siempre, lo que sube la rutina evento-desde-anuncio) no se tocan.
//   · Todo se arma en una carpeta temporal y solo si todo pasa las guardas se copia a assets/ y data/. Nada se escribe fuera de esas dos carpetas.
//   · Deja el informe sync-informe.json (carpeta de trabajo; ignorado por git) para scripts/aviso-correo.py.
//
// Uso:  node scripts/sync-hoja.mjs [--seco] [--forzar] [--fixtures CARPETA] [--informe RUTA] [--hoy AAAA-MM-DD]
//   --seco       no escribe nada en el repositorio; imprime el informe de lo que pasaría.
//   --forzar     salta la guarda del 50 % (solo manual: una caída grande del catálogo casi siempre es una hoja rota).
//   --fixtures   en lugar de Google lee `inventario.xlsx` y `eventos.json` (la respuesta de la API: { values: [[…]] }) de la carpeta, más
//                `carteles/` y, si existe, `previo/` (el estado de partida; sin ella, un sitio vacío). No toca assets/ ni data/ del repositorio.
// Variables: GOOGLE_SA_KEY (JSON de la cuenta de servicio, solo lectura), HOJA_ID, HOJA_PESTANA_EVENTOS («Eventos»), NOVEDADES_DIAS (120).
// Nunca se imprime ni se guarda la clave, el token ni el correo de la cuenta de servicio (redact).
// Salida: 0 bien, 2 una guarda detuvo la sincronización (no se escribió nada), 1 error inesperado.
import { createHash, createSign } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(AQUI, '..');
const { validDay, validHour, validRegistro, validTelefono, eventosProblems, fechaLarga, COSTO_MAX } = await import(pathToFileURL(join(REPO, 'feed.js')).href);

export const VENTANA_MESES = 24; // los eventos con fecha más vieja que esto salen del archivo
export const NOVEDADES_DIAS = 120; // las llegadas más viejas salen de novedades.entradas (el sitio solo pinta las de 45 días)
export const MIN_LIBROS = 10;
export const MIN_FRACCION = 0.5;
export const MAX_RECHAZADAS_SIN_VALIDAS = 15;
export const MAX_IMAGEN_BYTES = 12 * 1024 * 1024;
const MIMES_IMAGEN = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MIME_HOJA = 'application/vnd.google-apps.spreadsheet';
const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly';
const ORIGEN_IMAGEN = 'Cartel o foto aportado por la librería desde su hoja de eventos';

export class SyncError extends Error {
  constructor(mensaje, codigo = 2) { super(mensaje); this.codigo = codigo; }
}

// ---------------------------------------------------------------------------------------------
// Secretos: nada de esto debe aparecer jamás en una salida

const secretos = new Set();
export const registrarSecreto = valor => { if (typeof valor === 'string' && valor.length >= 6) secretos.add(valor); };
/** Quita de un texto cualquier secreto registrado (y sus renglones sueltos, por si una clave se imprime partida). */
export function redact(texto) {
  let t = String(texto ?? '');
  for (const s of secretos) {
    t = t.split(s).join('«oculto»');
    for (const linea of s.split(/\\n|\n/)) if (linea.length >= 12) t = t.split(linea).join('«oculto»');
  }
  return t;
}

// ---------------------------------------------------------------------------------------------
// Fechas, horas y textos (lógica pura; se prueba sin red)

export const normalizar = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const texto = v => (v == null ? '' : String(v).replace(/ /g, ' ').trim());
export const slugify = s => normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '') || 'evento';
const dos = n => String(n).padStart(2, '0');

/** AAAA-MM-DD del día de Monterrey. */
export const hoyMty = (ahora = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
const utcDe = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const isoDe = ms => new Date(ms).toISOString().slice(0, 10);
export const sumarDias = (iso, n) => isoDe(utcDe(iso) + n * 86_400_000);
export function sumarMeses(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  const y2 = Math.floor(total / 12), m2 = total % 12;
  const ultimo = new Date(Date.UTC(y2, m2 + 1, 0)).getUTCDate();
  return `${y2}-${dos(m2 + 1)}-${dos(Math.min(d, ultimo))}`;
}
export const dmy = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const diaDeSemana = iso => new Date(utcDe(iso)).getUTCDay();
const DIA_POR_NOMBRE = { domingo: 0, dom: 0, lunes: 1, lun: 1, martes: 2, mar: 2, miercoles: 3, mie: 3, jueves: 4, jue: 4, viernes: 5, vie: 5, sabado: 6, sab: 6 };

/** Número de serie de Sheets (días desde 1899-12-30) → AAAA-MM-DD. */
export const serialAFecha = n => isoDe(Date.UTC(1899, 11, 30) + Math.floor(n) * 86_400_000);

/**
 * Fecha de una celda: número de serie de la hoja, «AAAA-MM-DD» o «DD/MM/AAAA» (también con guiones o puntos). Vacía → { valor: null } (propuesta sin fecha).
 * Devuelve { valor } o { error }.
 */
export function parseFecha(v) {
  if (v == null || (typeof v === 'string' && !v.trim())) return { valor: null };
  if (typeof v === 'boolean') return { error: 'la fecha no es una fecha' };
  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v < 36526 || v > 73051) return { error: `la fecha ${v} no es una fecha de la hoja (usa una fecha real o AAAA-MM-DD)` };
    return { valor: serialAFecha(v) };
  }
  const s = texto(v);
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  let y, mo, d;
  if (m) [, y, mo, d] = m;
  else if ((m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s))) [, d, mo, y] = m;
  else return { error: `la fecha «${s}» no se entiende (usa una fecha real de la hoja, AAAA-MM-DD o DD/MM/AAAA)` };
  const iso = `${y}-${dos(mo)}-${dos(d)}`;
  if (!validDay(iso)) return { error: `la fecha ${dmy(iso)} no existe` };
  return { valor: iso };
}

/**
 * Hora de una celda: fracción de día de la hoja (0.7895… → «18:57»), «HH:MM», «H:MM», «6:57 p.m.», «6 pm», «18 h». Se imprime tal cual, sin
 * redondear a la hora. Vacía → { valor: null }. Devuelve { valor } o { error }.
 */
export function parseHora(v) {
  if (v == null || (typeof v === 'string' && !v.trim())) return { valor: null };
  if (typeof v === 'number') {
    const frac = v - Math.floor(v);
    if (!Number.isFinite(v) || v < 0 || (frac === 0 && v >= 1)) return { error: `la hora ${v} no es una hora de la hoja (usa una hora real o HH:MM)` };
    const min = Math.floor(frac * 1440 + 1e-6);
    return { valor: `${dos(Math.floor(min / 60))}:${dos(min % 60)}` };
  }
  if (typeof v === 'boolean') return { error: 'la hora no es una hora' };
  const s = normalizar(texto(v)).replace(/\./g, '').replace(/\s+/g, ' ');
  const m = /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm|a m|p m)?\s*(hrs?|h)?$/.exec(s);
  if (!m) return { error: `la hora «${texto(v)}» no se entiende (usa HH:MM, por ejemplo 18:57 o 6:57 p.m.)` };
  let h = Number(m[1]);
  const min = m[2] == null ? 0 : Number(m[2]);
  const sufijo = m[3]?.replace(' ', '');
  if (m[2] == null && !sufijo && !m[4]) return { error: `la hora «${texto(v)}» no se entiende (usa HH:MM, por ejemplo 18:57 o 6:57 p.m.)` };
  if (sufijo) {
    if (h < 1 || h > 12) return { error: `la hora «${texto(v)}» no es válida` };
    h = (h % 12) + (sufijo === 'pm' ? 12 : 0);
  }
  if (h > 23 || min > 59) return { error: `la hora «${texto(v)}» no es válida` };
  return { valor: `${dos(h)}:${dos(min)}` };
}

/** Costo: un renglón por salto de línea dentro de la celda (hasta COSTO_MAX). Un número solo se imprime como «$N MXN». */
export function parseCosto(v) {
  if (v == null || (typeof v === 'string' && !v.trim())) return { valor: [] };
  if (typeof v === 'number') {
    if (!(v > 0)) return { error: 'el costo «0» no se imprime: escribe el costo con texto (por ejemplo «Entrada libre») o deja la celda vacía' };
    return { valor: [`$${Number.isInteger(v) ? v : v.toFixed(2)} MXN`] };
  }
  const lineas = texto(v).split(/\r?\n/).map(texto).filter(Boolean);
  if (lineas.length > COSTO_MAX) return { error: `el costo tiene ${lineas.length} renglones y el sitio imprime hasta ${COSTO_MAX}` };
  return { valor: lineas };
}

/** Reserva: enlace de Luma → { tipo: 'luma', url }; teléfono de 10 dígitos → { tipo: 'whatsapp', telefono }; vacía → null. */
export function parseReserva(v) {
  if (v == null || (typeof v === 'string' && !v.trim())) return { valor: null };
  const malo = { error: 'la reserva no es un enlace de Luma ni un teléfono de 10 dígitos' };
  if (typeof v === 'number') {
    const tel = validTelefono(String(Math.round(v)));
    return tel ? { valor: { tipo: 'whatsapp', telefono: tel } } : malo;
  }
  const s = texto(v);
  if (/^https?:\/\//i.test(s) || /\b(lu\.ma|luma\.com)\b/i.test(s)) {
    const url = validRegistro(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return url ? { valor: { tipo: 'luma', url } } : malo;
  }
  const tel = validTelefono(s);
  return tel ? { valor: { tipo: 'whatsapp', telefono: tel } } : malo;
}

/** El ID de un archivo de Drive a partir de su enlace (…/file/d/ID/…, …?id=ID) o del ID suelto. null si no lo parece. */
export function driveId(v) {
  const s = texto(v);
  if (!s) return null;
  let m = /\/d\/([\w-]{15,})/.exec(s) || /[?&]id=([\w-]{15,})/.exec(s);
  if (m) return m[1];
  if (/^https?:\/\//i.test(s)) return null;
  m = /^([\w-]{15,})$/.exec(s);
  return m ? m[1] : null;
}

const ENCABEZADOS = {
  publicar: ['publicar', 'publicado'], titulo: ['titulo', 'nombre'], tipo: ['tipo'], fecha: ['fecha'], hora: ['hora', 'horainicio', 'horadeinicio', 'inicio'],
  fin: ['fin', 'horafin', 'horadefin', 'termina'], con: ['con'], invitado: ['invitado', 'invitada', 'invita'], colabora: ['colabora', 'colaboracion'], ciclo: ['ciclo'],
  descripcion: ['descripcion'], costo: ['costo', 'precio'], reserva: ['reserva', 'registro'], cartel: ['cartel', 'imagen', 'foto'], encuadre: ['encuadre'],
  alt: ['alt', 'textoalternativo'], dia: ['dia', 'diadelasemana']
};
/** Posición de cada columna por nombre de encabezado (sin importar orden, mayúsculas ni acentos). */
export function mapaEncabezados(fila) {
  const por = new Map();
  (fila ?? []).forEach((c, i) => { const k = normalizar(c).replace(/[^a-z0-9]/g, ''); if (k && !por.has(k)) por.set(k, i); });
  const out = {};
  for (const [campo, alias] of Object.entries(ENCABEZADOS)) {
    const hit = alias.find(a => por.has(a));
    if (hit) out[campo] = por.get(hit);
  }
  return out;
}

/** Sí / no de la columna Publicar (vacío = sí). null si no se entiende. */
export function parsePublicar(v) {
  if (v == null || (typeof v === 'string' && !v.trim())) return true;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = normalizar(v).replace(/[^a-z0-9]/g, '');
  if (['si', 's', 'sip', 'yes', 'y', 'true', 'verdadero', 'x', '1', 'ok'].includes(s)) return true;
  if (['no', 'n', 'false', 'falso', '0'].includes(s)) return false;
  return null;
}

/** Revisa que el día de la semana que el cartel o el texto dicen sea el de la fecha. Devuelve una lista de motivos. */
export function revisaDia(fecha, { dia, titulo, descripcion }) {
  const out = [];
  const real = diaDeSemana(fecha);
  if (dia != null && texto(dia)) {
    const n = DIA_POR_NOMBRE[normalizar(texto(dia)).replace(/[^a-z]/g, '')];
    if (n == null) out.push(`la columna Día dice «${texto(dia)}», que no es un día de la semana`);
    else if (n !== real) out.push(`la fecha ${dmy(fecha)} no cae en ${DIAS[n]} (es ${DIAS[real]})`);
  }
  const t = normalizar(`${titulo ?? ''}. ${descripcion ?? ''}`);
  const dd = Number(fecha.slice(8, 10));
  for (const m of t.matchAll(/\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo|lun|mie|jue|vie|sab|dom|mar(?=\.))\.?,?\s+(?:el\s+)?(\d{1,2})\b(?!:\d|\s*h\b|\s*\/)/g)) {
    const n = DIA_POR_NOMBRE[m[1]], num = Number(m[2]);
    if (num < 1 || num > 31) continue;
    if (n !== real || num !== dd) out.push(`el texto dice «${DIAS[n]} ${num}», pero la fecha ${dmy(fecha)} cae en ${DIAS[real]} ${dd}`);
  }
  for (const m of t.matchAll(/\b(?:este|proximo)\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/g)) {
    const n = DIA_POR_NOMBRE[m[1]];
    if (n !== real) out.push(`el texto dice «${m[0]}», pero la fecha ${dmy(fecha)} cae en ${DIAS[real]}`);
  }
  return [...new Set(out)];
}

// ---------------------------------------------------------------------------------------------
// Filas de la pestaña «Eventos» → eventos del sitio

const sinPrefijo = p => p.replace(/^evento \d+( \([^)]*\))?: /, '');

/** Problemas de un evento según el validador estricto del sitio; la imagen ausente se tolera (sin cartel el evento se publica sin foto). */
export function problemasDeEvento(e) {
  return eventosProblems({ eventos: [e] }).map(sinPrefijo).filter(p => !(e.imagen == null && /«imagen»/.test(p)));
}

/**
 * values (la respuesta de la API: primera fila = encabezados) → { validos, rechazados, ocultos, omitidos, avisos }.
 * Cada válido: { fila, titulo, evento, cartel } con `evento` ya en el formato de eventos.json (la imagen, si hay cartel, es la ruta que tendrá).
 */
export function procesarFilas(values, { hoy, idsManuales = new Set() } = {}) {
  const out = { validos: [], rechazados: [], ocultos: [], omitidos: [], avisos: [] };
  if (!Array.isArray(values) || !values.length) throw new SyncError('la pestaña de Eventos está vacía: no tiene ni la fila de encabezados');
  const col = mapaEncabezados(values[0]);
  const faltan = ['titulo', 'fecha'].filter(k => col[k] == null);
  if (faltan.length) throw new SyncError(`a la pestaña de Eventos le faltan encabezados: ${faltan.map(k => ({ titulo: 'Título', fecha: 'Fecha' })[k]).join(', ')} (¿se renombró alguna columna?)`);
  const ahora = new Date(`${hoy}T18:00:00Z`);
  const corte = sumarMeses(hoy, -VENTANA_MESES);
  const vistos = new Map();
  values.slice(1).forEach((row, i) => {
    const fila = i + 2;
    const celda = k => (col[k] == null ? null : row?.[col[k]] ?? null);
    if (!Array.isArray(row) || row.every(c => c == null || texto(c) === '')) return;
    const titulo = texto(celda('titulo'));
    const motivos = [];
    const f = parseFecha(celda('fecha'));
    const idProbable = titulo && !f.error ? `${slugify(titulo)}${f.valor ? `-${f.valor}` : ''}` : null;
    const pub = parsePublicar(celda('publicar'));
    if (pub === false) { out.ocultos.push({ fila, titulo, id: idProbable }); return; }
    if (pub === null) motivos.push(`«Publicar» dice «${texto(celda('publicar'))}»: escribe sí o no`);
    if (!titulo) motivos.push('falta el título');
    if (f.error) motivos.push(f.error);
    const h = parseHora(celda('hora')), fin = parseHora(celda('fin'));
    if (h.error) motivos.push(h.error);
    if (fin.error) motivos.push(fin.error);
    if (!h.error && !fin.error) {
      if (h.valor && !f.valor && !f.error) motivos.push('tiene hora pero no fecha');
      if (fin.valor && !h.valor) motivos.push('tiene hora de fin pero no hora de inicio');
      else if (fin.valor && h.valor && fin.valor <= h.valor) motivos.push(`la hora de fin (${fin.valor}) debe ser posterior a la de inicio (${h.valor})`);
    }
    const descripcion = texto(celda('descripcion'));
    if (!descripcion) motivos.push('falta la descripción');
    const costo = parseCosto(celda('costo'));
    if (costo.error) motivos.push(costo.error);
    const reserva = parseReserva(celda('reserva'));
    if (reserva.error) motivos.push(reserva.error);
    const encRaw = normalizar(texto(celda('encuadre')));
    if (encRaw && encRaw !== 'cartel' && encRaw !== 'foto') motivos.push(`«Encuadre» dice «${texto(celda('encuadre'))}»: escribe cartel o foto`);
    if (f.valor) motivos.push(...revisaDia(f.valor, { dia: celda('dia'), titulo, descripcion }));
    if (f.valor && !motivos.length && f.valor < corte) { out.omitidos.push({ fila, titulo, fecha: f.valor }); out.avisos.push(`«${titulo}» (${dmy(f.valor)}) tiene más de ${VENTANA_MESES} meses: no se publica`); return; }

    let id = idProbable, evento = null, cartel = null;
    if (!motivos.length) {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) motivos.push('no se pudo formar un identificador con el título');
      else if (vistos.has(id)) motivos.push(`repetida: la fila ${vistos.get(id)} ya publica «${titulo}» ${f.valor ? 'el mismo día' : 'sin fecha'}`);
      else if (idsManuales.has(id)) motivos.push('ya existe un evento con ese identificador que no viene de la hoja; cambia el título o la fecha');
    }
    if (!motivos.length) {
      const cartelRaw = texto(celda('cartel'));
      if (cartelRaw) {
        const idArchivo = driveId(cartelRaw);
        if (idArchivo) cartel = { ref: idArchivo };
        else out.avisos.push(`«${titulo}»: el enlace del cartel no se entiende; el evento se publica sin foto`);
      }
      if (reserva.valor && !f.valor) out.avisos.push(`«${titulo}»: tiene reserva pero no fecha; se publica como propuesta sin botón de reserva`);
      const encuadre = encRaw === 'cartel' ? 'cartel' : 'foto';
      const alt = texto(celda('alt')) || (encuadre === 'cartel'
        ? ['Cartel: ' + titulo, f.valor ? fechaLarga(f.valor, ahora) : '', h.valor ?? ''].filter(Boolean).join(', ')
        : `Foto de «${titulo}»`);
      const opc = (k, v) => (v ? { [k]: v } : {});
      evento = {
        id, ...opc('tipo', texto(celda('tipo'))), ...opc('ciclo', texto(celda('ciclo'))), titulo, fecha: f.valor, hora: f.valor ? h.valor : null,
        fin: f.valor && h.valor ? fin.valor : null, con: texto(celda('con')) || null, ...opc('invitado', texto(celda('invitado'))),
        ...opc('colabora', texto(celda('colabora'))), descripcion, imagen: cartel ? `assets/img/eventos/${id}.webp` : null, alt,
        ...(encuadre === 'cartel' ? { encuadre } : {}), ...(costo.valor.length ? { costo: costo.valor } : {}),
        reserva: f.valor ? reserva.valor : null, origen: 'hoja'
      };
      motivos.push(...problemasDeEvento(evento));
    }
    if (motivos.length) { out.rechazados.push({ fila, titulo, motivo: motivos.join('; '), idProbable }); return; }
    vistos.set(id, fila);
    out.validos.push({ fila, titulo, evento, cartel });
  });
  return out;
}

// ---------------------------------------------------------------------------------------------
// Novedades, retención y guardas

/**
 * Qué libros son nuevos respecto del catálogo anterior y cómo queda `novedades.entradas`.
 * Sin catálogo previo (primera corrida) solo hay línea base: nada se marca como nuevo. Un libro que cambia de id pero conserva su ISBN es el
 * mismo libro (se corrigió el título), no una llegada.
 */
export function planNovedades({ previos, nuevos, entradas = [], hoy, dias = NOVEDADES_DIAS }) {
  const prevPorId = new Map((previos ?? []).map(b => [b.id, b]));
  const nuevosPorId = new Map(nuevos.map(b => [b.id, b]));
  const prevPorIsbn = new Map((previos ?? []).filter(b => b.n).map(b => [b.n, b]));
  const renombrados = new Map(); // id viejo → id nuevo
  for (const b of nuevos) {
    if (prevPorId.has(b.id) || !b.n) continue;
    const viejo = prevPorIsbn.get(b.n);
    if (viejo && !nuevosPorId.has(viejo.id)) renombrados.set(viejo.id, b.id);
  }
  const base = prevPorId.size === 0;
  const idsNuevos = base ? [] : nuevos.filter(b => !prevPorId.has(b.id) && ![...renombrados.values()].includes(b.id)).map(b => b.id);
  const retirados = base ? [] : (previos ?? []).filter(b => !nuevosPorId.has(b.id) && !renombrados.has(b.id));
  const corte = sumarDias(hoy, -dias);
  const quitadas = [];
  const conservadas = [];
  for (const e of entradas) {
    const id = renombrados.get(e?.id) ?? e?.id;
    if (!nuevosPorId.has(id)) { quitadas.push(e); continue; }
    if (typeof e.llegada === 'string' && validDay(e.llegada) && e.llegada < corte) { quitadas.push(e); continue; }
    conservadas.push(id === e.id ? e : { ...e, id });
  }
  const ya = new Set(conservadas.map(e => e.id));
  const agregadas = idsNuevos.filter(id => !ya.has(id)).map(id => ({ id, llegada: hoy }));
  return { base, nuevos: idsNuevos.map(id => nuevosPorId.get(id)), retirados, renombrados, quitadas, entradas: [...conservadas, ...agregadas] };
}

/** Guardas del catálogo: no menos de MIN_LIBROS ni de la mitad de los que había. Lanza SyncError si fallan. */
export function guardaCatalogo(previos, nuevos, { forzar = false } = {}) {
  if (nuevos < MIN_LIBROS) throw new SyncError(`el catálogo nuevo tiene ${nuevos} libros (el mínimo es ${MIN_LIBROS}): parece una hoja vacía o rota; no se escribió nada`);
  if (!forzar && previos > 0 && nuevos < previos * MIN_FRACCION) throw new SyncError(`el catálogo pasaría de ${previos} a ${nuevos} libros (menos de la mitad): parece una hoja rota; no se escribió nada. Si es lo que quieres, corre el flujo a mano con «forzar»`);
}

/** Guarda de eventos: muchas filas rechazadas y ninguna válida = hoja rota. */
export function guardaEventos({ validos, rechazados }) {
  if (!validos.length && rechazados.length > MAX_RECHAZADAS_SIN_VALIDAS) throw new SyncError(`${rechazados.length} filas de Eventos se rechazaron y ninguna es válida: parece una pestaña rota; no se escribió nada`);
}

/** Junta lo que ya estaba en eventos.json con lo que dice la hoja. Los eventos sin `origen: "hoja"` no se tocan. */
export function mezclarEventos({ actuales, procesados, hoy }) {
  const manuales = actuales.filter(e => e.origen !== 'hoja');
  const previos = new Map(actuales.filter(e => e.origen === 'hoja').map(e => [e.id, e]));
  const corte = sumarMeses(hoy, -VENTANA_MESES);
  const finales = new Map();
  const retirados = [], conservados = [];
  for (const v of procesados.validos) finales.set(v.evento.id, { ...v.evento });
  // una fila que se rompió (rechazada) conserva su última versión publicada: la hoja manda, pero no a ciegas
  for (const r of procesados.rechazados) {
    if (r.idProbable && previos.has(r.idProbable) && !finales.has(r.idProbable)) { finales.set(r.idProbable, previos.get(r.idProbable)); conservados.push(r.idProbable); }
  }
  const ocultos = new Set(procesados.ocultos.map(o => o.id).filter(Boolean));
  for (const [id, e] of previos) {
    if (finales.has(id)) continue;
    if (e.fecha && e.fecha < corte) retirados.push({ id, titulo: e.titulo, fecha: e.fecha, motivo: `salió de la ventana de ${VENTANA_MESES} meses`, avisar: false });
    else retirados.push({ id, titulo: e.titulo, fecha: e.fecha, motivo: ocultos.has(id) ? 'Publicar = no' : 'ya no está en la hoja', avisar: true });
  }
  for (const [id, e] of [...finales]) {
    if (e.fecha && e.fecha < corte) { finales.delete(id); retirados.push({ id, titulo: e.titulo, fecha: e.fecha, motivo: `salió de la ventana de ${VENTANA_MESES} meses`, avisar: false }); }
  }
  const hoja = [...finales.values()].sort((a, b) => (a.fecha ?? '9999').localeCompare(b.fecha ?? '9999') || (a.hora ?? '').localeCompare(b.hora ?? '') || a.id.localeCompare(b.id));
  return { eventos: [...manuales, ...hoja], previos, retirados, conservados };
}

/** Qué eventos de la hoja son nuevos o cambiaron (se llama con los eventos ya con su imagen resuelta). */
export function clasificarCambios({ previos, eventos, conservados = [] }) {
  const out = [];
  for (const e of eventos) {
    if (e.origen !== 'hoja' || conservados.includes(e.id)) continue;
    const antes = previos.get(e.id);
    const base = { id: e.id, titulo: e.titulo, fecha: e.fecha, hora: e.hora };
    if (!antes) out.push({ ...base, cambio: 'nuevo' });
    else if (JSON.stringify(antes) !== JSON.stringify(e)) out.push({ ...base, cambio: 'actualizado' });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Google (token con la cuenta de servicio, Drive y Sheets) sin dependencias

const b64u = b => Buffer.from(b).toString('base64url');
const pausa = ms => new Promise(r => setTimeout(r, ms));

export function firmarJwt(clave, { ahora = Math.floor(Date.now() / 1000), aud = 'https://oauth2.googleapis.com/token' } = {}) {
  const sin = `${b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64u(JSON.stringify({ iss: clave.client_email, scope: SCOPES, aud, iat: ahora, exp: ahora + 3600 }))}`;
  return `${sin}.${createSign('RSA-SHA256').update(sin).sign(clave.private_key, 'base64url')}`;
}

export function leerClave(crudo) {
  let k;
  try { k = JSON.parse(crudo); } catch { throw new SyncError('GOOGLE_SA_KEY no es un JSON válido (pega el archivo de la clave completo)'); }
  if (!k || typeof k.client_email !== 'string' || typeof k.private_key !== 'string') throw new SyncError('GOOGLE_SA_KEY no parece la clave JSON de una cuenta de servicio (faltan client_email o private_key)');
  [crudo, k.private_key, k.private_key_id, k.client_email, k.client_id].forEach(registrarSecreto);
  return k;
}

export class Google {
  constructor({ clave, tokenUri, driveBase, sheetsBase, espera = 1500 }) {
    this.clave = clave;
    this.tokenUri = tokenUri || 'https://oauth2.googleapis.com/token';
    this.driveBase = driveBase || 'https://www.googleapis.com/drive/v3';
    this.sheetsBase = sheetsBase || 'https://sheets.googleapis.com/v4';
    this.espera = espera;
    this.token = null;
  }
  async pedir(paso, url, opciones = {}, formato = 'json') {
    let ultimo;
    for (let intento = 1; intento <= 3; intento++) {
      let res;
      try { res = await fetch(url, { ...opciones, signal: AbortSignal.timeout(90_000) }); } catch (e) { ultimo = new SyncError(`${paso}: no hubo respuesta (${redact(e?.cause?.code || e?.name || 'red')})`, 1); await pausa(this.espera * intento); continue; }
      if (res.ok) return formato === 'json' ? res.json() : Buffer.from(await res.arrayBuffer());
      let detalle = '';
      try { const j = await res.json(); detalle = j?.error?.message || j?.error_description || (typeof j?.error === 'string' ? j.error : ''); } catch { /* sin cuerpo */ }
      ultimo = new SyncError(`${paso}: Google respondió ${res.status}${detalle ? ` («${redact(detalle).slice(0, 200)}»)` : ''}`, 2);
      ultimo.estado = res.status;
      if (res.status !== 429 && res.status < 500) break;
      await pausa(this.espera * intento);
    }
    throw ultimo;
  }
  async autorizar() {
    const cuerpo = new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: firmarJwt(this.clave, { aud: this.tokenUri }) });
    const r = await this.pedir('pedir el token de acceso', this.tokenUri, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: cuerpo });
    if (!r?.access_token) throw new SyncError('pedir el token de acceso: Google no devolvió un token');
    registrarSecreto(r.access_token);
    this.token = r.access_token;
  }
  cab() { return { authorization: `Bearer ${this.token}` }; }
  drive(paso, ruta, params = {}, formato = 'json') {
    const q = new URLSearchParams({ supportsAllDrives: 'true', ...params });
    return this.pedir(paso, `${this.driveBase}/${ruta}?${q}`, { headers: this.cab() }, formato);
  }
  sheets(paso, ruta, params = {}) {
    return this.pedir(paso, `${this.sheetsBase}/${ruta}?${new URLSearchParams(params)}`, { headers: this.cab() });
  }
}

// ---------------------------------------------------------------------------------------------
// Carpeta temporal, importador y copia final

const leerJson = (ruta, porOmision) => { try { return JSON.parse(readFileSync(ruta, 'utf8')); } catch { return porOmision; } };
const escribirJson = (ruta, datos, sangria = 2) => { mkdirSync(dirname(ruta), { recursive: true }); writeFileSync(ruta, `${JSON.stringify(datos, null, sangria)}\n`); };
const sha256 = buf => createHash('sha256').update(buf).digest('hex');
const md5 = buf => createHash('md5').update(buf).digest('hex');

function archivos(raiz) {
  const out = new Map();
  const ir = dir => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) ir(p); else if (e.isFile()) out.set(relative(raiz, p).split(sep).join('/'), p);
    }
  };
  for (const d of ['assets', 'data']) ir(join(raiz, d));
  return out;
}

/** Copia a `destino` lo que cambió en la carpeta temporal (solo assets/ y data/). Devuelve las rutas escritas y borradas. */
export function aplicar(stage, destino) {
  const origen = archivos(stage), actual = archivos(destino);
  const escritas = [], borradas = [];
  const seguro = rel => { const r = resolve(destino, rel); if (!/^(assets|data)\//.test(rel) || rel.includes('..') || !r.startsWith(resolve(destino) + sep)) throw new SyncError(`ruta fuera de assets/ y data/: ${rel}`); return r; };
  for (const [rel, p] of origen) {
    const nuevo = readFileSync(p);
    if (actual.has(rel) && readFileSync(actual.get(rel)).equals(nuevo)) continue;
    const r = seguro(rel);
    mkdirSync(dirname(r), { recursive: true });
    writeFileSync(r, nuevo);
    escritas.push(rel);
  }
  for (const [rel, p] of actual) if (!origen.has(rel)) { seguro(rel); unlinkSync(p); borradas.push(rel); }
  return { escritas, borradas };
}

function baseVacia(stage, hoy) {
  escribirJson(join(stage, 'data', 'portadas.json'), {});
  escribirJson(join(stage, 'assets', 'provenance.json'), { updated: hoy, rule: 'Carpeta de trabajo vacía (pruebas).', real: [], covers: {} });
  escribirJson(join(stage, 'assets', 'data', 'eventos.json'), { meta: {}, eventos: [] });
  escribirJson(join(stage, 'assets', 'data', 'collections.json'), { meta: {}, collections: [], novedades: { titulo: 'Recién llegados', entradas: [] } });
  mkdirSync(join(stage, 'assets', 'img', 'portadas'), { recursive: true });
}

function correrPython(script, args, extraEnv = {}) {
  const env = { PATH: process.env.PATH, HOME: process.env.HOME, LANG: process.env.LANG || 'C.UTF-8', PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', TMPDIR: process.env.TMPDIR, ...extraEnv };
  const r = spawnSync(process.env.PYTHON || 'python3', [script, ...args], { env, encoding: 'utf8', timeout: 600_000 });
  return { codigo: r.status ?? 1, salida: redact(`${r.stdout ?? ''}${r.stderr ?? ''}`).trim(), error: r.error };
}

/** Escribe `novedades.entradas` en collections.json conservando su formato hecho a mano; si no se puede, reescribe el archivo. */
export function escribirEntradas(ruta, entradas) {
  const crudo = readFileSync(ruta, 'utf8');
  const cuerpo = entradas.length ? `[\n${entradas.map(e => `      ${JSON.stringify({ id: e.id, llegada: e.llegada }).replace(/^\{"id":("[^"]*"),"llegada":("[^"]*")\}$/, '{ "id": $1, "llegada": $2 }')}`).join(',\n')}\n    ]` : '[]';
  const texto2 = crudo.replace(/("entradas"\s*:\s*)\[[^\]]*\]/, (_, pre) => `${pre}${cuerpo}`);
  try {
    if (JSON.stringify(JSON.parse(texto2).novedades.entradas) === JSON.stringify(entradas.map(e => ({ ...e })))) { writeFileSync(ruta, texto2); return; }
  } catch { /* se reescribe abajo */ }
  const datos = JSON.parse(crudo);
  datos.novedades = { ...(datos.novedades ?? {}), entradas };
  escribirJson(ruta, datos);
}

// ---------------------------------------------------------------------------------------------
// La sincronización

const hash12 = s => createHash('sha1').update(s).digest('hex').slice(0, 12);

export function informeVacio({ modo, hoy }) {
  return {
    fecha: hoy, modo,
    resumen: { librosNuevos: 0, librosRetirados: 0, eventosNuevos: 0, eventosActualizados: 0, eventosRetirados: 0, rechazadas: 0, avisos: 0, errores: 0 },
    publicado: { libros: [], eventos: [] }, retirado: { libros: [], eventos: [] }, rechazado: [], avisos: [], notas: [], errores: []
  };
}

async function bajarImagen({ valido, previo, google, fixtures, stage, hoy, aviso, tmp }) {
  const { evento } = valido;
  const rel = `assets/img/eventos/${evento.id}.webp`;
  const destino = join(stage, rel);
  const provPath = join(stage, 'assets', 'provenance.json');
  const prov = leerJson(provPath, { real: [] });
  const entradaPrev = (prov.real ?? []).find(f => f.file === `img/eventos/${evento.id}.webp`);
  const conservarPrevia = () => { if (previo?.imagen && existsSync(destino)) evento.imagen = previo.imagen; else evento.imagen = null; };
  const falla = motivo => { aviso(`«${evento.titulo}»: ${motivo}${previo?.imagen && existsSync(destino) ? '; se conserva la foto anterior' : '; el evento se publica sin foto'}`, `imagen|${evento.id}|${motivo}`); conservarPrevia(); };
  try {
    let bytes, md5Origen;
    if (fixtures) {
      const dir = join(fixtures, 'carteles');
      const hallado = existsSync(dir) ? readdirSync(dir).find(n => n === valido.cartel.ref || basename(n, extname(n)) === valido.cartel.ref) : null;
      if (!hallado) return falla('no se encontró el archivo del cartel');
      bytes = readFileSync(join(dir, hallado));
      md5Origen = md5(bytes);
    } else {
      const meta = await google.drive('leer los datos del cartel', `files/${valido.cartel.ref}`, { fields: 'id,mimeType,size,md5Checksum' });
      if (!MIMES_IMAGEN.has(meta.mimeType)) return falla(`el archivo del cartel no es una imagen JPEG, PNG o WebP (es ${meta.mimeType || 'de tipo desconocido'})`);
      if (Number(meta.size) > MAX_IMAGEN_BYTES) return falla(`el cartel pesa más de ${MAX_IMAGEN_BYTES / 1024 / 1024} MB`);
      md5Origen = meta.md5Checksum;
      if (md5Origen && entradaPrev?.sourceMd5 === md5Origen && existsSync(destino)) return; // no cambió: se queda como está
      bytes = await google.drive('bajar el cartel', `files/${valido.cartel.ref}`, { alt: 'media' }, 'buffer');
      if (bytes.length > MAX_IMAGEN_BYTES) return falla(`el cartel pesa más de ${MAX_IMAGEN_BYTES / 1024 / 1024} MB`);
      md5Origen = md5Origen || md5(bytes);
    }
    if (bytes.length > MAX_IMAGEN_BYTES) return falla(`el cartel pesa más de ${MAX_IMAGEN_BYTES / 1024 / 1024} MB`);
    if (entradaPrev?.sourceMd5 === md5Origen && existsSync(destino)) return;
    const entrada = join(tmp, `cartel-${evento.id}`);
    writeFileSync(entrada, bytes);
    const r = correrPython(join(AQUI, 'imagen-evento.py'), [entrada, destino]);
    if (r.codigo !== 0) return falla(`no se pudo convertir el cartel (${r.salida.split('\n').pop() || 'error desconocido'})`);
    const webp = readFileSync(destino);
    const nueva = { file: `img/eventos/${evento.id}.webp`, origin: ORIGEN_IMAGEN, source: 'Hoja de eventos de la librería (archivo de Google Drive)', sourceMd5: md5Origen, author: 'Librería Itinerante y Más (cuenta oficial)', date: entradaPrev?.date ?? hoy, note: `Evento ${evento.id}`, sha256: sha256(webp) };
    prov.real = [...(prov.real ?? []).filter(f => f.file !== nueva.file), nueva];
    prov.updated = hoy;
    escribirJson(provPath, prov);
  } catch (e) {
    if (e instanceof SyncError && e.codigo === 1 && !fixtures) throw e;
    falla(redact(e?.message || 'error desconocido'));
  }
}

/** La sincronización completa. Devuelve { codigo, informe }. No imprime nada: lo hace main(). */
export async function sincronizar(opciones = {}) {
  const env = opciones.env ?? process.env;
  const modo = opciones.fixtures ? 'fixtures' : opciones.seco ? 'seco' : 'real';
  const hoy = opciones.hoy || env.SYNC_HOY || hoyMty();
  const raiz = resolve(env.SYNC_RAIZ || REPO);
  const informe = informeVacio({ modo: opciones.seco ? (opciones.fixtures ? 'fixtures-seco' : 'seco') : modo, hoy });
  const tmp = mkdtempSync(join(tmpdir(), 'iti-sync-'));
  const stage = join(tmp, 'sitio');
  let codigo = 0;
  try {
    mkdirSync(stage);
    const fixtures = opciones.fixtures ? resolve(opciones.fixtures) : null;
    const dias = Number(env.NOVEDADES_DIAS) > 0 ? Number(env.NOVEDADES_DIAS) : NOVEDADES_DIAS;
    const pestana = env.HOJA_PESTANA_EVENTOS || 'Eventos';

    // 1. Estado de partida
    if (fixtures) {
      if (existsSync(join(fixtures, 'previo'))) cpSync(join(fixtures, 'previo'), stage, { recursive: true });
      else baseVacia(stage, hoy);
    } else {
      for (const d of ['assets', 'data']) if (existsSync(join(raiz, d))) cpSync(join(raiz, d), join(stage, d), { recursive: true });
    }
    let previos = leerJson(join(stage, 'assets', 'data', 'catalog.json'), { books: [] }).books ?? [];
    if (!fixtures) {
      try { previos = JSON.parse(execFileSync('git', ['show', 'HEAD:assets/data/catalog.json'], { cwd: raiz, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })).books ?? []; } catch { /* sin HEAD: se usa la copia de trabajo */ }
    }

    const estadoPath = join(stage, 'data', 'sync-estado.json');
    const estado = leerJson(estadoPath, { rechazadas: [], avisos: [] });
    const estadoNuevo = { rechazadas: [], avisos: [] };
    const aviso = (texto2, clave) => {
      const h = hash12(clave ?? texto2);
      estadoNuevo.avisos.push(h);
      informe.avisos.push({ texto: texto2, nuevo: !(estado.avisos ?? []).includes(h) });
    };

    // 2. Google (o los archivos de prueba)
    let google = null, xlsx, valoresEventos, tabHoja = null;
    if (fixtures) {
      xlsx = join(fixtures, 'inventario.xlsx');
      if (!existsSync(xlsx)) throw new SyncError('la carpeta de fixtures no trae inventario.xlsx');
      const ev = join(fixtures, 'eventos.json');
      valoresEventos = existsSync(ev) ? (leerJson(ev, {}).values ?? []) : null;
    } else {
      if (!env.GOOGLE_SA_KEY || !env.HOJA_ID) throw new SyncError('faltan GOOGLE_SA_KEY o HOJA_ID (secretos del repositorio); revisa docs/AUTOMATIZACION.md');
      google = new Google({ clave: leerClave(env.GOOGLE_SA_KEY), tokenUri: env.SYNC_TOKEN_URI, driveBase: env.SYNC_DRIVE_BASE, sheetsBase: env.SYNC_SHEETS_BASE, espera: env.SYNC_SIN_ESPERA ? 0 : 1500 });
      const id = encodeURIComponent(env.HOJA_ID);
      registrarSecreto(env.HOJA_ID);
      await google.autorizar();
      const meta = await google.drive('leer la hoja en Drive', `files/${id}`, { fields: 'mimeType,name' });
      if (meta.mimeType !== MIME_HOJA) throw new SyncError('HOJA_ID no es una hoja de Google (parece un archivo .xlsx subido a Drive): ábrelo en Drive y usa «Guardar como hoja de Google»; ver docs/AUTOMATIZACION.md');
      const info = await google.sheets('leer las pestañas de la hoja', `spreadsheets/${id}`, { fields: 'sheets.properties(title,index)' });
      const pestanas = (info.sheets ?? []).map(s => s.properties).sort((a, b) => a.index - b.index);
      tabHoja = pestanas.find(p => normalizar(p.title) === normalizar(pestana)) ?? null;
      const libros = pestanas.find(p => normalizar(p.title) !== normalizar(pestana));
      if (!libros) throw new SyncError('la hoja no tiene una pestaña de libros (la primera pestaña que no sea «Eventos»)');
      informe.notas.push(`pestaña de libros: «${libros.title}»`);
      xlsx = join(tmp, 'inventario.xlsx');
      writeFileSync(xlsx, await google.drive('exportar la hoja a Excel', `files/${id}/export`, { mimeType: MIME_XLSX }, 'buffer'));
      xlsx = { ruta: xlsx, hoja: libros.title };
      if (tabHoja) {
        const rango = `'${tabHoja.title.replace(/'/g, "''")}'`;
        const r = await google.sheets('leer la pestaña Eventos', `spreadsheets/${id}/values/${encodeURIComponent(rango)}`, { valueRenderOption: 'UNFORMATTED_VALUE', dateTimeRenderOption: 'SERIAL_NUMBER' });
        valoresEventos = r.values ?? [];
      } else { valoresEventos = null; aviso(`la hoja no tiene una pestaña «${pestana}»: los eventos no se sincronizaron (los libros sí)`); }
    }
    const rutaXlsx = typeof xlsx === 'string' ? xlsx : xlsx.ruta;

    // 3. Libros: el importador de siempre, sobre la carpeta temporal
    const impArgs = [rutaXlsx, ...(typeof xlsx === 'object' ? ['--hoja', xlsx.hoja] : [])];
    const imp = correrPython(join(AQUI, 'import-inventario.py'), impArgs, { ITI_RAIZ: stage });
    if (imp.codigo !== 0) throw new SyncError(`el importador de libros falló: ${imp.salida.split('\n').slice(-6).join(' | ') || 'sin detalle'}`);
    const catalogo = leerJson(join(stage, 'assets', 'data', 'catalog.json'), null);
    if (!catalogo?.books) throw new SyncError('el importador no dejó un catálogo legible');
    guardaCatalogo(previos.length, catalogo.books.length, { forzar: opciones.forzar });

    // 4. Novedades
    const colPath = join(stage, 'assets', 'data', 'collections.json');
    const colecciones = leerJson(colPath, {});
    const plan = planNovedades({ previos, nuevos: catalogo.books, entradas: colecciones.novedades?.entradas ?? [], hoy, dias });
    if (plan.base) informe.notas.push(`línea base: el catálogo anterior estaba vacío, así que los ${catalogo.books.length} libros no se marcaron como nuevos`);
    const filasInv = leerJson(join(stage, 'data', 'inventario-itinerante.json'), { filas: [] }).filas ?? [];
    for (const b of plan.nuevos) {
      informe.publicado.libros.push({ id: b.id, titulo: b.t });
      if (!b.c) aviso(`«${b.t}» no tiene portada registrada: el sitio usa la portada tipográfica`, `portada|${b.id}`);
      const fila = filasInv.find(f => f.titulo === b.t);
      for (const av of fila?.avisos ?? []) aviso(`«${b.t}» (fila ${fila.fila} de la hoja): ${av}`, `libro|${b.id}|${av}`);
    }
    for (const b of plan.retirados) informe.retirado.libros.push({ id: b.id, titulo: b.t });
    if (plan.quitadas.length) informe.notas.push(`${plan.quitadas.length} entradas salieron de Novedades (libro retirado o más de ${dias} días)`);
    const entradasPrev = JSON.stringify(colecciones.novedades?.entradas ?? []);
    if (JSON.stringify(plan.entradas) !== entradasPrev) escribirEntradas(colPath, plan.entradas);

    // 5. Eventos
    if (valoresEventos) {
      const evPath = join(stage, 'assets', 'data', 'eventos.json');
      const doc = leerJson(evPath, { meta: {}, eventos: [] });
      const actuales = Array.isArray(doc.eventos) ? doc.eventos : [];
      const proc = procesarFilas(valoresEventos, { hoy, idsManuales: new Set(actuales.filter(e => e.origen !== 'hoja').map(e => e.id)) });
      guardaEventos(proc);
      const mezcla = mezclarEventos({ actuales, procesados: proc, hoy });
      // imágenes: de los eventos válidos, solo los que lo necesitan (sin foto aún, o próximos/recientes por si el cartel cambió)
      const previosHoja = new Map(actuales.filter(e => e.origen === 'hoja').map(e => [e.id, e]));
      const reciente = sumarDias(hoy, -30);
      for (const v of proc.validos) {
        if (!v.cartel) continue;
        const final = mezcla.eventos.find(e => e.id === v.evento.id);
        const previo = previosHoja.get(v.evento.id);
        const yaTiene = previo?.imagen && existsSync(join(stage, previo.imagen));
        if (yaTiene && v.evento.fecha && v.evento.fecha < reciente) { final.imagen = previo.imagen; continue; }
        await bajarImagen({ valido: { ...v, evento: final }, previo, google, fixtures, stage, hoy, aviso, tmp });
      }
      // las fotos que quedaron sin dueño (evento retirado) se borran con su entrada de provenance
      const usadas = new Set(mezcla.eventos.map(e => e.imagen).filter(Boolean));
      const provPath = join(stage, 'assets', 'provenance.json');
      const prov = leerJson(provPath, { real: [] });
      let provCambio = false;
      for (const r of mezcla.retirados) {
        const imagen = `assets/img/eventos/${r.id}.webp`;
        if (!usadas.has(imagen) && existsSync(join(stage, imagen))) unlinkSync(join(stage, imagen));
        const n = (prov.real ?? []).length;
        if (!usadas.has(imagen)) prov.real = (prov.real ?? []).filter(f => f.file !== `img/eventos/${r.id}.webp`);
        if ((prov.real ?? []).length !== n) { provCambio = true; prov.updated = hoy; }
      }
      if (mezcla.eventos.some(e => e.origen === 'hoja') && prov.eventosData && !prov.eventosData.hoja) {
        prov.eventosData.hoja = 'Los eventos con origen «hoja» se sincronizan desde la pestaña Eventos de la hoja de Google de la librería (scripts/sync-hoja.mjs); su cartel o foto lo aporta la librería y queda registrado en «real» (assets/img/eventos/).';
        provCambio = true;
      }
      if (provCambio) escribirJson(provPath, prov);
      // validación final con las reglas del sitio
      const ids = new Set();
      for (const e of mezcla.eventos) {
        if (ids.has(e.id)) throw new SyncError(`id de evento repetido: ${e.id}`);
        ids.add(e.id);
        const p = problemasDeEvento(e);
        if (p.length) throw new SyncError(`eventos.json no pasa la revisión del sitio (${e.id}): ${p.join('; ')}`);
      }
      for (const e of mezcla.eventos) if (e.imagen && !existsSync(join(stage, e.imagen))) throw new SyncError(`el evento ${e.id} apunta a una imagen que no existe (${e.imagen})`);
      doc.eventos = mezcla.eventos;
      escribirJson(evPath, doc);
      informe.publicado.eventos = clasificarCambios({ previos: mezcla.previos, eventos: mezcla.eventos, conservados: mezcla.conservados });
      informe.retirado.eventos = mezcla.retirados;
      const conservados = new Set(mezcla.conservados);
      for (const r of proc.rechazados) {
        const clave = `${r.fila}|${r.titulo}|${r.motivo}`;
        estadoNuevo.rechazadas.push(hash12(clave));
        informe.rechazado.push({ hoja: pestana, fila: r.fila, titulo: r.titulo, motivo: r.motivo, nuevo: !(estado.rechazadas ?? []).includes(hash12(clave)), conservado: conservados.has(r.idProbable) });
      }
      for (const a of proc.avisos) aviso(a);
      for (const e of mezcla.eventos) if (e.origen === 'hoja' && !e.imagen && e.encuadre === 'cartel') aviso(`«${e.titulo}»: marcado como cartel pero sin imagen`, `cartel-sin-imagen|${e.id}`);
    } else {
      estadoNuevo.rechazadas = estado.rechazadas ?? [];
    }
    // lo que dejó la hoja de Eventos pero no se pudo evaluar no se pierde del estado
    estadoNuevo.rechazadas = [...new Set(estadoNuevo.rechazadas)].sort();
    estadoNuevo.avisos = [...new Set(estadoNuevo.avisos)].sort();
    if (JSON.stringify(estadoNuevo) !== JSON.stringify({ rechazadas: estado.rechazadas ?? [], avisos: estado.avisos ?? [] }) || !existsSync(estadoPath)) {
      escribirJson(estadoPath, { nota: 'Estado de scripts/sync-hoja.mjs: huellas de los problemas ya avisados por correo, para no repetir el aviso en cada corrida. No contiene datos personales.', ...estadoNuevo });
    }

    // 6. Copia final
    if (!opciones.seco && !fixtures) informe.escrito = aplicar(stage, raiz);
  } catch (e) {
    codigo = e instanceof SyncError ? e.codigo : 1;
    informe.errores.push(redact(e?.message || String(e)));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  const r = informe.resumen;
  r.librosNuevos = informe.publicado.libros.length;
  r.librosRetirados = informe.retirado.libros.length;
  r.eventosNuevos = informe.publicado.eventos.filter(e => e.cambio === 'nuevo').length;
  r.eventosActualizados = informe.publicado.eventos.filter(e => e.cambio === 'actualizado').length;
  r.eventosRetirados = informe.retirado.eventos.length;
  r.rechazadas = informe.rechazado.length;
  r.avisos = informe.avisos.length;
  r.errores = informe.errores.length;
  if (codigo) { informe.publicado = { libros: [], eventos: [] }; informe.retirado = { libros: [], eventos: [] }; informe.escrito = undefined; }
  return { codigo, informe };
}

const s = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
export function resumenLinea(informe) {
  const r = informe.resumen;
  return `${s(r.librosNuevos, 'libro nuevo', 'libros nuevos')}, ${s(r.eventosNuevos + r.eventosActualizados, 'evento', 'eventos')}, ${s(r.rechazadas, 'fila rechazada', 'filas rechazadas')}`;
}

function main(argv) {
  const op = { seco: false, forzar: false, fixtures: null, informe: process.env.SYNC_INFORME || 'sync-informe.json', hoy: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--seco') op.seco = true;
    else if (a === '--forzar') op.forzar = true;
    else if (a === '--fixtures') op.fixtures = argv[++i];
    else if (a === '--informe') op.informe = argv[++i];
    else if (a === '--hoy') op.hoy = argv[++i];
    else { console.error(`opción desconocida: ${a}\nUso: node scripts/sync-hoja.mjs [--seco] [--forzar] [--fixtures CARPETA] [--informe RUTA] [--hoy AAAA-MM-DD]`); return 1; }
  }
  if ((op.fixtures !== null && !op.fixtures) || (op.hoy !== null && !validDay(op.hoy))) { console.error('--fixtures pide una carpeta y --hoy una fecha AAAA-MM-DD'); return 1; }
  return sincronizar(op).then(({ codigo, informe }) => {
    writeFileSync(op.informe, `${JSON.stringify(informe, null, 2)}\n`);
    console.log(redact(JSON.stringify(informe, null, 2)));
    console.log(redact(codigo ? `\nLa sincronización se detuvo (código ${codigo}): ${informe.errores.join(' | ')}` : `\n${op.seco ? 'Simulacro (no se escribió nada)' : 'Listo'}: ${resumenLinea(informe)}.`));
    if (process.env.GITHUB_OUTPUT) {
      const r = informe.resumen;
      const hay = !codigo && (informe.escrito?.escritas?.length || informe.escrito?.borradas?.length);
      appendFileSync(process.env.GITHUB_OUTPUT, `cambios=${hay ? 'true' : 'false'}\nmensaje=Sincroniza desde la hoja: ${s(r.librosNuevos, 'libro nuevo', 'libros nuevos')}, ${s(r.eventosNuevos + r.eventosActualizados, 'evento', 'eventos')}\n`);
    }
    return codigo;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  Promise.resolve(main(process.argv.slice(2))).then(c => { process.exitCode = c; }, e => { console.error(redact(e?.message || e)); process.exitCode = 1; });
}

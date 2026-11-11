// Eventos y talleres (Cartelera) sin inventar nada: «Me interesa» y «Compartir» son locales (no se envía nada y no hay contadores)
// y el estado de cada propuesta es «Propuesta · sin fecha» hasta que la librería confirme una fecha. Se carga al primer toque o en reposo.
// Las historias de los destacados se retiraron el 2026-11-11 (decisión de Aldo: sin burbujas de historias).
import { notify } from './saved.js';
import { pickPop } from './motion.js';

const INTEREST_KEY = 'iti-b4-interes-v1';

const store = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };

// ---------- Estado de la propuesta: «Propuesta · sin fecha» o la fecha confirmada ----------
// Cómo se actualiza: cuando la librería confirma una fecha, se añade `data-fecha="AAAA-MM-DD"` (o `AAAA-MM-DDTHH:MM`, hora de Monterrey)
// al <details class="bill-item"> de esa propuesta en index.html. Sin atributo, con un valor que no es una fecha real o con una fecha que ya
// pasó, la insignia dice «Propuesta · sin fecha»: nunca se anuncia una fecha que no esté confirmada y vigente.
const MTY = 'America/Monterrey';
export const NO_DATE = 'Propuesta · sin fecha';
const dayKey = date => new Intl.DateTimeFormat('en-CA', { timeZone: MTY, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); // AAAA-MM-DD en Monterrey

export function eventBadge(fecha, now = new Date()) {
  const quiet = { kind: 'propuesta', text: NO_DATE };
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T([01]\d|2[0-3]):([0-5]\d))?$/.exec(String(fecha ?? '').trim());
  if (!m) return quiet;
  const [, y, mo, d, h, mi] = m;
  const noon = new Date(Date.UTC(+y, +mo - 1, +d, 18)); // mediodía en Monterrey (UTC−6 todo el año): el día no cambia al dar formato
  if (noon.getUTCMonth() !== +mo - 1 || noon.getUTCDate() !== +d) return quiet; // 31 de febrero y similares
  const key = `${y}-${mo}-${d}`;
  const today = dayKey(now);
  if (key < today) return quiet;
  const parts = new Intl.DateTimeFormat('es-MX', { timeZone: MTY, weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(noon);
  const part = type => (parts.find(p => p.type === type)?.value ?? '').replace('.', '');
  const weekday = part('weekday');
  let text = key === today ? 'Hoy' : `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${part('day')} ${part('month')}${y === today.slice(0, 4) ? '' : ` ${y}`}`;
  if (h) text += ` · ${h}:${mi}`;
  return { kind: key === today ? 'hoy' : 'fecha', text, date: key };
}

function paintWhen(item) {
  const el = item.querySelector('[data-bill-when]');
  if (!el) return;
  const badge = eventBadge(item.dataset.fecha);
  el.textContent = badge.text;
  el.classList.toggle('badge--quiet', badge.kind === 'propuesta'); // lo confirmado lleva la insignia menta; lo que no, la callada
}

// ---------- «Me interesa» y «Compartir» ----------
export const readInterest = () => { try { const r = JSON.parse(store()?.getItem(INTEREST_KEY) || '[]'); return Array.isArray(r) ? r.filter(x => typeof x === 'string') : []; } catch { return []; } };
const writeInterest = list => { try { store()?.setItem(INTEREST_KEY, JSON.stringify(list)); } catch { /* sin persistencia: dura la sesión */ } };
let memory = null;
const interest = () => (memory ??= readInterest());

function paintInterest(btn) {
  const on = interest().includes(btn.dataset.interest);
  btn.setAttribute('aria-pressed', String(on));
  const title = btn.dataset.title || 'esta propuesta';
  btn.setAttribute('aria-label', on ? `Me interesa «${title}». Quitar` : `Me interesa «${title}»`);
}

export function toggleInterest(btn) {
  const id = btn.dataset.interest;
  const list = interest();
  const at = list.indexOf(id);
  if (at >= 0) list.splice(at, 1); else list.push(id);
  writeInterest(list);
  paintInterest(btn);
  if (at < 0) pickPop(btn); // el corazón rebota solo al elegir con un toque, no al restaurar lo guardado
  notify(at >= 0 ? 'Quitado.' : 'Anotado solo en este dispositivo. No enviamos nada.');
}

export async function shareItem(btn) {
  const title = btn.dataset.title || 'Cartelera';
  const url = `${location.origin}${location.pathname}#cartelera`;
  const when = eventBadge(btn.closest?.('.bill-item')?.dataset.fecha);
  const state = when.kind === 'propuesta' ? 'una propuesta de la Cartelera de Librería Itinerante y Más (sin fecha confirmada todavía)' : `${when.text} en Librería Itinerante y Más`;
  const data = { title: `${title} · Librería Itinerante y Más`, text: `${title}: ${state}.`, url };
  if (navigator.share) {
    try { await navigator.share(data); return; } catch (e) { if (e?.name === 'AbortError') return; /* sin hoja de compartir: se copia */ }
  }
  try { await navigator.clipboard.writeText(url); notify('Enlace copiado.'); } catch { notify('No se pudo copiar. Copia la dirección desde el navegador.'); }
}

export function onAct(btn) {
  if (btn.matches('[data-interest]')) toggleInterest(btn);
  else if (btn.matches('[data-share]')) return shareItem(btn);
}

// Nombre accesible de «Compartir»: es un control de icono, así que el nombre lleva la acción y el título de la propuesta, como «Me interesa «título»».
// Sin esto las tres propuestas tendrían el mismo nombre para un lector de pantalla. El marcado ya lo trae; aquí se mantiene al día con data-title.
export const shareName = title => `Compartir «${title || 'esta propuesta'}»`;
const paintShare = btn => btn.setAttribute('aria-label', shareName(btn.dataset.title));

export function initFeed() {
  document.querySelectorAll('[data-interest]').forEach(paintInterest);
  document.querySelectorAll('[data-share]').forEach(paintShare);
  document.querySelectorAll('.bill-item').forEach(paintWhen);
}

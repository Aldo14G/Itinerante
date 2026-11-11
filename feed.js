// Móvil con sensación de red social, sin inventar nada: publicaciones de Cartelera («Me interesa» y «Compartir»,
// locales: no se envía nada y no hay contadores). Se carga al primer toque o en reposo.
// Las historias de los destacados se retiraron el 2026-11-11 (decisión de Aldo: sin burbujas de historias).
import { notify } from './saved.js';

const INTEREST_KEY = 'iti-b4-interes-v1';

const store = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
const text = el => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
// Procedencia registrada en el propio documento (`data-kind`); sin ella es null y la foto no entra a ninguna historia.
const kindOf = el => validKind(el?.dataset?.kind);

// ---------- Cartelera como publicaciones: «Me interesa» y «Compartir» ----------
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
  notify(at >= 0 ? 'Quitado.' : 'Anotado solo en este dispositivo. No enviamos nada.');
}

export async function shareItem(btn) {
  const title = btn.dataset.title || 'Cartelera';
  const url = `${location.origin}${location.pathname}#cartelera`;
  const data = { title: `${title} · Librería Itinerante y Más`, text: `${title}: una propuesta de la Cartelera de Librería Itinerante y Más (sin fecha confirmada todavía).`, url };
  if (navigator.share) {
    try { await navigator.share(data); return; } catch (e) { if (e?.name === 'AbortError') return; /* sin hoja de compartir: se copia */ }
  }
  try { await navigator.clipboard.writeText(url); notify('Enlace copiado.'); } catch { notify('No se pudo copiar. Copia la dirección desde el navegador.'); }
}

export function onAct(btn) {
  if (btn.matches('[data-interest]')) toggleInterest(btn);
  else if (btn.matches('[data-share]')) return shareItem(btn);
}

// Nombre accesible de «Compartir»: el texto visible (la etiqueta del botón) más el título de la publicación, como «Me interesa «título»».
// Sin esto las tres publicaciones tenían el mismo nombre para un lector de pantalla.
export const shareName = title => `Compartir «${title || 'esta propuesta'}»`;
const paintShare = btn => btn.setAttribute('aria-label', shareName(btn.dataset.title));

export function initFeed() {
  document.querySelectorAll('[data-interest]').forEach(paintInterest);
  document.querySelectorAll('[data-share]').forEach(paintShare);
}

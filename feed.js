// Móvil con sensación de red social, sin inventar nada: historias (los destacados del perfil abren las fotos que ya
// existen en la página, siempre con su rótulo de procedencia) y publicaciones de Cartelera («Me interesa» y «Compartir»,
// locales: no se envía nada y no hay contadores). Se carga al primer toque o en reposo.
import { openDialog, navigateFromSheet } from './sheets.js';
import { notify, MAPS } from './saved.js';
import { validKind } from './tag.js';

export const STORY_KEYS = ['casa', 'cartelera', 'libros', 'visita'];
const STORY_TITLE = { casa: 'La casa', cartelera: 'Cartelera', libros: 'Libros', visita: 'Visita' };
// Cómo se nombra el capítulo en mitad de una frase («Ver la casa en la página»): sin mayúscula inicial.
const STORY_GO = { casa: 'la casa', cartelera: 'la cartelera', libros: 'los libros', visita: 'la visita' };
const INTEREST_KEY = 'iti-b4-interes-v1';

const store = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
const text = el => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
// Procedencia registrada en el propio documento (`data-kind`); sin ella es null y la foto no entra a ninguna historia.
const kindOf = el => validKind(el?.dataset?.kind);

// Fotos de cada historia: salen del propio documento (una sola fuente de verdad) y los temas de Libros.
// Cada foto lleva `kind` (ai | real) como dato: sin procedencia registrada no hay historia.
export function collectSlides(key, doc = document, topics = {}) {
  const imgOf = (root, sel = 'img') => root?.querySelector(sel);
  if (key === 'casa') {
    return [...doc.querySelectorAll('.house .still')].map(li => {
      const img = imgOf(li), cap = li.querySelector('figcaption');
      return { src: img.getAttribute('src'), alt: img.alt, title: text(cap?.querySelector('b')), text: text(cap?.querySelector('span')), kind: kindOf(cap) };
    });
  }
  if (key === 'cartelera') {
    return [...doc.querySelectorAll('.bill-item')].map(item => {
      const img = imgOf(item, '.bill-card-img');
      return { src: img.getAttribute('src'), alt: item.dataset.caption || '', title: text(item.querySelector('.bill-title')), text: text(item.querySelector('.bill-sub')), place: item.dataset.caption || '', kind: validKind(item.dataset.kind) };
    });
  }
  if (key === 'libros') {
    return Object.values(topics).map(t => ({ src: `assets/img/${t.img}`, alt: t.alt, title: t.name, text: t.line, place: t.place, kind: validKind(t.kind) }));
  }
  if (key === 'visita') {
    return ['.visit-arrival', '.manifesto-photo--a'].map(sel => doc.querySelector(sel)).filter(Boolean).map(fig => {
      const img = imgOf(fig), cap = fig.querySelector('figcaption');
      return { src: img.getAttribute('src'), alt: img.alt, title: text(cap), text: '', kind: kindOf(cap) };
    });
  }
  return [];
}

const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
function icon(id) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ic');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}

let viewer = null;

function buildViewer() {
  const dlg = el('dialog', 'story');
  const bars = el('div', 'stories');
  bars.setAttribute('aria-hidden', 'true');
  const top = el('div', 'story-top');
  const av = el('img', 'story-av');
  av.src = 'assets/img/logo-96.webp'; av.width = 36; av.height = 36; av.alt = '';
  const who = el('p', 'story-who');
  const name = el('b', null, 'Librería Itinerante y Más');
  const sub = el('span');
  who.append(name, sub);
  const close = el('button', 'story-close');
  close.type = 'button'; close.setAttribute('aria-label', 'Cerrar historia');
  close.append(icon('i-plus'));
  top.append(av, who, close);
  const fig = el('div', 'story-fig');
  const img = el('img', 'story-img');
  img.decoding = 'async';
  const prev = el('button', 'story-nav story-nav--prev'); prev.type = 'button'; prev.setAttribute('aria-label', 'Foto anterior');
  const next = el('button', 'story-nav story-nav--next'); next.type = 'button'; next.setAttribute('aria-label', 'Foto siguiente');
  fig.append(img, prev, next);
  const cap = el('div', 'story-cap');
  const foot = el('div', 'story-foot');
  const go = el('a', 'btn btn--tungsten');
  go.href = MAPS; go.target = '_blank'; go.rel = 'noopener noreferrer';
  go.append(el('span', null, 'Cómo llegar'), icon('i-ne'));
  const more = el('a', 'btn btn--ghost');
  more.append(el('span'));
  foot.append(go, more);
  const live = el('p', 'sr-only');
  live.setAttribute('aria-live', 'polite');
  dlg.append(bars, top, fig, cap, foot, live);
  document.body.append(dlg);

  const v = { dlg, bars, sub, img, prev, next, cap, more, live, close, slides: [], i: 0, opener: null, key: '', done: false };
  const show = i => {
    const n = v.slides.length;
    v.i = Math.min(n - 1, Math.max(0, i));
    const s = v.slides[v.i];
    v.img.src = s.src; v.img.alt = s.alt || '';
    v.cap.replaceChildren(el('b', 'story-t', s.title));
    if (s.text) v.cap.append(el('span', 'story-x', s.text));
    v.bars.querySelectorAll('i').forEach((b, k) => b.classList.toggle('is-seen', k <= v.i));
    v.prev.disabled = v.i === 0;
    v.next.disabled = v.i === n - 1;
    v.live.textContent = `Foto ${v.i + 1} de ${n}. ${s.title}.`;
    const ahead = v.slides[v.i + 1];
    if (ahead) { const pre = new Image(); pre.src = ahead.src; }
  };
  v.show = show;
  prev.addEventListener('click', () => show(v.i - 1));
  next.addEventListener('click', () => show(v.i + 1));
  close.addEventListener('click', () => dlg.close());
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(v.i + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(v.i - 1); }
  });
  more.addEventListener('click', e => {
    const href = more.getAttribute('href');
    if (!href?.startsWith('#')) return;
    e.preventDefault();
    v.opener = null; // el foco va al capítulo, no al destacado
    navigateFromSheet(href); // la entrada de historial de la hoja pasa a ser la del destino
    dlg.close();
    const h = document.querySelector(`${href} h2`);
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => {
    v.opener?.classList.add('is-seen');
    v.opener?.focus?.({ preventScroll: true });
  });
  matchMedia('(min-width: 761px)').addEventListener('change', e => { if (e.matches && dlg.open) dlg.close(); });
  return v;
}

// Abre la historia `key` desde el destacado `opener`. `topics` son los temas de Libros (viven en app.js).
export function openStory(key, opener = null, topics = {}) {
  const slides = collectSlides(key, document, topics).filter(s => s.src && s.kind);
  if (!slides.length) throw new Error(`sin fotos para ${key}`);
  viewer ??= buildViewer();
  const v = viewer;
  if (v.dlg.open) return;
  v.slides = slides; v.key = key; v.opener = opener;
  v.bars.replaceChildren(...slides.map(() => document.createElement('i')));
  v.dlg.setAttribute('aria-label', `Historia: ${STORY_TITLE[key]}`);
  v.sub.textContent = STORY_TITLE[key];
  const href = `#${key}`;
  v.more.setAttribute('href', href);
  v.more.firstElementChild.textContent = `Ver ${STORY_GO[key]} en la página`;
  v.show(0);
  openDialog(v.dlg);
  v.close.focus({ preventScroll: true });
}

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

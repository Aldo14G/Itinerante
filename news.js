// Novedades («Recién llegados»): una tira de libros que se alimenta de la clave `novedades` de assets/data/collections.json
// (`ids` en el orden en que se muestran). Sin datos no existe: la sección, su ancla y sus enlaces quedan ocultos y no ocupan
// espacio. Nunca se simula ni se presenta como ranking: solo muestra lo que la librería ponga en la lista.
import { pickBooks, bookCard, wireBookOpen } from './rail.js';
import { coverTones } from './catalog.js';
import { loadSample, loadCollections } from './sample.js';

export const NEWS_SIZE = 12;

// Plan de la tira: qué libros (los ids que existan, en orden) y qué rótulo lleva. `show` es falso sin datos.
// Se comprueba `ids` aquí porque pickBooks, sin ellos, caería en el filtro vacío: todo el catálogo.
export function newsPlan(books, data) {
  const col = data?.novedades;
  const list = Array.isArray(col?.ids) && col.ids.length ? pickBooks(books ?? [], { ids: col.ids }, NEWS_SIZE) : [];
  return {
    show: list.length > 0,
    books: list,
    titulo: col?.titulo || 'Recién llegados',
    // Lo que sale de la muestra lleva siempre el rótulo; con inventario verificado (meta.kind distinto) se retira.
    note: data?.meta?.kind === 'sample' ? (data.meta.label || 'Datos de muestra · no es inventario') : ''
  };
}

export async function initNews({ ensureCatalog } = {}) {
  const section = document.querySelector('[data-news]');
  if (!section || section.dataset.ready) return;
  section.dataset.ready = '1';
  let plan = { show: false };
  try {
    const [sample, data] = await Promise.all([loadSample(), loadCollections()]);
    plan = newsPlan(sample.books, data);
  } catch { /* sin datos no se promete nada */ }
  const links = document.querySelectorAll('[data-news-link]');
  section.hidden = !plan.show;
  links.forEach(l => { l.hidden = !plan.show; });
  if (!plan.show) return;
  const track = section.querySelector('[data-news-track]');
  const tones = coverTones(plan.books);
  track.replaceChildren(...plan.books.map((b, i) => bookCard(b, tones[i])));
  const note = section.querySelector('[data-news-note]');
  note.textContent = plan.note;
  note.hidden = !plan.note;
  section.querySelector('[data-news-viewport]')?.setAttribute('aria-label', plan.titulo);
  wireBookOpen(track, ensureCatalog);
}

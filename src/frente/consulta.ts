// Estado del catálogo en la URL (?q, genero, editorial, orden, vista, pagina, libro).
// El servidor lo resuelve al generar el HTML; el cliente repite la misma regla para que el cambio sea instantáneo.
import { LIBROS, type Libro } from './datos';

export type Orden = 'portada' | 'titulo' | 'autor' | 'precio-asc' | 'precio-desc';
export type Vista = 'rejilla' | 'lista';

export type Consulta = {
  q: string;
  genero: string[];
  editorial: string[];
  orden: Orden;
  vista: Vista;
  pagina: number | null;
  libro: string | null;
};

export const CONSULTA_VACIA: Consulta = {
  q: '',
  genero: [],
  editorial: [],
  orden: 'portada',
  vista: 'rejilla',
  pagina: null,
  libro: null,
};

const ORDENES = new Set<Orden>(['portada', 'titulo', 'autor', 'precio-asc', 'precio-desc']);

/** Página que resuelve el servidor cuando llega ?pagina= (en el navegador el tamaño depende del ancho). */
export const PAGINA_SERVIDOR = 20;

export function normalizar(s: string): string {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function parseConsulta(sp: URLSearchParams): Consulta {
  const orden = sp.get('orden') || 'portada';
  const paginaRaw = sp.get('pagina');
  const pagina = paginaRaw && /^[1-9]\d*$/.test(paginaRaw) ? Number(paginaRaw) : null;
  return {
    q: (sp.get('q') || '').replace(/\s+/g, ' ').trim(),
    genero: (sp.get('genero') || '').split(',').map((s) => s.trim()).filter(Boolean),
    editorial: (sp.get('editorial') || '').split(',').map((s) => s.trim()).filter(Boolean),
    orden: ORDENES.has(orden as Orden) ? (orden as Orden) : 'portada',
    vista: sp.get('vista') === 'lista' ? 'lista' : 'rejilla',
    pagina,
    libro: (sp.get('libro') || '').trim() || null,
  };
}

/** Hay algo que el HTML por defecto (sin parámetros) no trae ya resuelto. */
export function consultaActiva(c: Consulta): boolean {
  return Boolean(c.q || c.genero.length || c.editorial.length || c.orden !== 'portada' || c.vista !== 'rejilla' || c.pagina || c.libro);
}

export function coincide(l: Libro, c: Pick<Consulta, 'q' | 'genero' | 'editorial'>): boolean {
  if (c.genero.length && !l.colecciones.some((g) => c.genero.includes(g))) return false;
  if (c.editorial.length && !c.editorial.includes(l.editorial || '')) return false;
  const toks = normalizar(c.q).split(/\s+/).filter(Boolean);
  if (!toks.length) return true;
  const h = normalizar(`${l.titulo} ${l.autor ?? ''} ${l.editorial ?? ''}`);
  return toks.every((t) => h.includes(t));
}

export function compararLibros(orden: Orden): (a: Libro, b: Libro) => number {
  const titulo = (a: Libro, b: Libro) => normalizar(a.titulo).localeCompare(normalizar(b.titulo), 'es');
  if (orden === 'titulo') return titulo;
  if (orden === 'autor') return (a, b) => normalizar(a.autor ?? '').localeCompare(normalizar(b.autor ?? ''), 'es') || titulo(a, b);
  if (orden === 'precio-asc') return (a, b) => (a.precio ?? 1e9) - (b.precio ?? 1e9) || a.ordenPortada - b.ordenPortada;
  if (orden === 'precio-desc') return (a, b) => (b.precio ?? -1) - (a.precio ?? -1) || a.ordenPortada - b.ordenPortada;
  return (a, b) => a.ordenPortada - b.ordenPortada;
}

export function librosConsulta(c: Consulta, libros = LIBROS): Libro[] {
  return [...libros].filter((l) => coincide(l, c)).sort(compararLibros(c.orden));
}

/** Ids que el HTML muestra (sin el atributo hidden). Sin ?pagina=, todos los que coinciden. */
export function idsVisibles(c: Consulta, libros = LIBROS): Set<string> {
  const lista = librosConsulta(c, libros);
  if (!c.pagina) return new Set(lista.map((l) => l.id));
  const desde = (c.pagina - 1) * PAGINA_SERVIDOR;
  return new Set(lista.slice(desde, desde + PAGINA_SERVIDOR).map((l) => l.id));
}

export function toggleValor(lista: string[], valor: string): string[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

/** URL del catálogo. Los campos de `sobre` reemplazan a los de `c` (pagina y libro se limpian si no se pasan). */
export function hrefCatalogo(c: Consulta, sobre: Partial<Consulta> & { pagina?: number | null; libro?: string | null } = {}): string {
  const n: Consulta = {
    q: sobre.q ?? c.q,
    genero: sobre.genero ?? c.genero,
    editorial: sobre.editorial ?? c.editorial,
    orden: sobre.orden ?? c.orden,
    vista: sobre.vista ?? c.vista,
    pagina: 'pagina' in sobre ? (sobre.pagina ?? null) : null,
    libro: 'libro' in sobre ? (sobre.libro ?? null) : null,
  };
  const p = new URLSearchParams();
  if (n.q) p.set('q', n.q);
  if (n.genero.length) p.set('genero', [...n.genero].sort().join(','));
  if (n.editorial.length) p.set('editorial', [...n.editorial].sort().join(','));
  if (n.orden !== 'portada') p.set('orden', n.orden);
  if (n.vista !== 'rejilla') p.set('vista', n.vista);
  if (n.pagina && n.pagina > 1) p.set('pagina', String(n.pagina));
  if (n.libro) p.set('libro', n.libro);
  const s = p.toString();
  return `/nuevo${s ? `?${s}` : ''}#libros`;
}

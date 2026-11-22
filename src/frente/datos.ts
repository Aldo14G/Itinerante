// Datos del frente nuevo (/nuevo), leídos al generar el HTML: los mismos JSON que usa la landing estática más los del frente.
// Nada se inventa: un campo nulo no se imprime, ni su título (SPEC v2 §3).
import catalogo from '../../assets/data/catalog.json';
import colecciones from '../../assets/data/collections.json';
import carta from '../../assets/data/menu.json';
import faq from '../../assets/data/faq.json';
import merch from '../../assets/data/merch.json';
import eventosOficiales from './eventos-oficiales.json';
import negocio from './negocio.json';
import correcciones from './correcciones.json';
import { hoyMonterrey } from './fechas';

export { hoyMonterrey };

export const NEGOCIO = negocio;
export type Foto = (typeof negocio.fotos)[number];

export function whatsapp(texto?: string): string {
  return `https://wa.me/${NEGOCIO.telefono}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}

export function precioMXN(n: number): string {
  return `$${n} MXN`;
}

export type Libro = {
  id: string;
  titulo: string;
  autor: string | null;
  editorial: string | null;
  genero: string | null;
  portada: { src: string; ancho: number; alto: number } | null;
  sinopsis: string | null;
  precio: number | null;
  anio: number | null;
  paginas: number | null;
};

type LibroCrudo = (typeof catalogo.books)[number];
const subgeneros = catalogo.subgenres as Record<string, { n: string; c: string }>;
const arreglos = correcciones.libros as Record<string, { g?: string }>;

/** GÉNERO visible: el nombre del subgénero tal como lo trae catalog.json (Narrativa, Poesía, Ensayo, Divulgación, Ensayo y poesía…). */
export function generoVisible(g: string | null): string | null {
  return g ? (subgeneros[g]?.n ?? null) : null;
}

function aLibro(b: LibroCrudo): Libro {
  const g = b.g ?? arreglos[b.id]?.g ?? null;
  return {
    id: b.id,
    titulo: b.t,
    autor: b.a ?? null,
    editorial: b.p ?? null,
    genero: generoVisible(g),
    portada: b.c && b.cw && b.ch ? { src: `/${b.c}`, ancho: b.cw, alto: b.ch } : null,
    sinopsis: b.s ?? null,
    precio: typeof b.pr === 'number' ? b.pr : null,
    anio: (b.y as number | null) ?? null,
    paginas: (b.pg as number | null) ?? null,
  };
}

export const LIBROS: Libro[] = catalogo.books.map(aLibro).sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));

/** Novedades reales: collections.json › novedades.entradas ({ id, llegada }). Hoy está vacía, así que la sección no existe. */
export const NOVEDADES: Libro[] = (colecciones.novedades.entradas as Array<{ id: string; llegada: string }>)
  .map((e) => LIBROS.find((l) => l.id === e.id))
  .filter((l): l is Libro => l != null);

/** Merch válido (nombre y foto); hoy merch.json está vacío y el tipo Merch no existe en la tienda. */
export const MERCH = (merch.productos as Array<{ id: string; nombre: string; precio: number | null; foto: unknown }>).filter((m) => m.nombre && m.foto);

/** Ningún filtro con menos de 2 elementos (SPEC v2 §9 S-19). */
export const MINIMO_FILTRO = 2;

export function editorialesConFiltro(libros = LIBROS): Array<{ nombre: string; n: number }> {
  const cuenta = new Map<string, number>();
  for (const l of libros) if (l.editorial) cuenta.set(l.editorial, (cuenta.get(l.editorial) ?? 0) + 1);
  return [...cuenta]
    .filter(([, n]) => n >= MINIMO_FILTRO)
    .map(([nombre, n]) => ({ nombre, n }))
    .sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es'));
}

/** Tipos de la tienda con al menos 2 productos. Con un solo tipo (hoy, Libros) no hay fila de tipos: «Todo» y «Libros» serían lo mismo. */
export function tiposDeTienda(): Array<{ id: 'libros' | 'merch'; nombre: string; n: number }> {
  return [
    { id: 'libros' as const, nombre: 'Libros', n: LIBROS.length },
    { id: 'merch' as const, nombre: 'Merch', n: MERCH.length },
  ].filter((t) => t.n >= MINIMO_FILTRO);
}

/** El ítem del menú de la tienda dice «Libros» mientras no haya merch (S-18). */
export const NOMBRE_TIENDA = MERCH.length ? 'Tienda' : 'Libros';

export type Producto = { id: string; nombre: string; descripcion: string | null; precio: number | null };
export type CategoriaCarta = { id: string; nombre: string; productos: Producto[] };

/** Carta «En la barra»: categorías y productos de menu.json; sin precio, la fila va sin precio (S-15). Las notas no se imprimen (S-6). */
export const CARTA: CategoriaCarta[] = carta.categorias.map((c) => ({
  id: c.id,
  nombre: c.nombre,
  productos: c.productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion ?? null,
    precio: typeof p.precio === 'number' ? p.precio : null,
  })),
}));

/**
 * Preguntas (S-11): solo las dos que no remiten a otra sección, con la respuesta de faq.json recortada a lo confirmado
 * (PENDIENTES-NEGOCIO (b) y (d)). faq.json lo sigue usando la landing anterior tal cual.
 */
export const PREGUNTAS: Array<{ id: string; pregunta: string; respuesta: string }> = [
  { id: 'libro', respuesta: 'Si no lo tenemos, te lo podemos pedir. Pregúntanos por WhatsApp.' },
  { id: 'festivos', respuesta: 'Pregúntanos antes por WhatsApp.' },
].map((r) => {
  const q = faq.preguntas.find((p) => p.id === r.id);
  if (!q) throw new Error(`faq.json ya no tiene la pregunta «${r.id}»`);
  return { id: r.id, pregunta: q.pregunta, respuesta: r.respuesta };
});

export type EventoFechado = { id: string; titulo: string; fecha: string; hora: string | null; descripcion: string | null; fuente: string };
export type ActividadRecurrente = { id: string; titulo: string; cuando: string; horario: string | null; costo: string | null; incluye: string | null; fuente: string };

export const FECHADOS = (eventosOficiales.fechados as EventoFechado[]).slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
export const RECURRENTES = eventosOficiales.recurrentes as ActividadRecurrente[];


/** Eventos con fecha que siguen vigentes `hoy` (el día del evento todavía cuenta). */
export function eventosFechados(hoy = hoyMonterrey()): EventoFechado[] {
  return FECHADOS.filter((e) => e.fecha >= hoy);
}

/** Último día con un evento fechado vigente: hasta ese día el CTA de la portada es «Ver eventos» (S-18). */
export function ultimoDiaConEventos(): string | null {
  return FECHADOS.length ? FECHADOS[FECHADOS.length - 1].fecha : null;
}

/** Bloque de fecha de la tarjeta: «VIE», «27», «NOV». */
export function fechaCorta(iso: string): { dia: string; numero: string; mes: string; larga: string } {
  const [y, m, d] = iso.split('-').map(Number);
  const f = new Date(Date.UTC(y, m - 1, d));
  const parte = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-MX', { ...o, timeZone: 'UTC' }).format(f);
  return {
    dia: parte({ weekday: 'short' }).replace('.', '').slice(0, 3).toUpperCase(),
    numero: String(d),
    mes: parte({ month: 'short' }).replace('.', '').slice(0, 3).toUpperCase(),
    larga: parte({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

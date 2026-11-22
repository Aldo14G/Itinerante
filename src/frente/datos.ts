// Datos del frente en React, leídos en el build (Server Components): los mismos JSON que usa la landing estática.
// Nada se inventa: lo que falta en los datos se muestra como falta («Precio en barra», «Fechas en Instagram»).
import catalogo from '../../assets/data/catalog.json';
import colecciones from '../../assets/data/collections.json';
import carta from '../../assets/data/menu.json';
import eventos from '../../assets/data/eventos.json';
import faq from '../../assets/data/faq.json';
import merch from '../../assets/data/merch.json';
import editoriales from '../../assets/data/editoriales.json';
import eventosOficiales from './eventos-oficiales.json';

export const NEGOCIO = {
  nombre: 'Librería Itinerante y Más',
  promesa: 'Libros de editoriales independientes, café, eventos y talleres en el centro de Monterrey.',
  direccion: 'Mariano Matamoros Pte. 421',
  // Dirección y teléfono tal como los publica la librería en Facebook (About), para los lugares donde se muestra el contacto.
  direccionContacto: 'Matamoros 421 Pte., Centro, Monterrey',
  telefonoVisible: '81 8087 5940',
  zona: 'Centro, Monterrey, Nuevo León',
  entreCalles: 'Entre Juan Aldama e Ignacio Rayón',
  horarioCorto: 'Lun–sáb · 11:00–20:00 · Dom cerrado',
  // Lunes a sábado (1–6), 11:00–20:00, hora de Monterrey (America/Monterrey).
  horario: { dias: [1, 2, 3, 4, 5, 6], abre: '11:00', cierra: '20:00' },
  telefono: '528180875940',
  correo: 'libreriaitineranteymasmty@gmail.com',
  instagram: 'https://www.instagram.com/libreriaitineranteymasmty/',
  facebook: 'https://www.facebook.com/people/Librer%C3%ADa-Itinerante-y-m%C3%A1s/100095548961064/',
  comoLlegar:
    'https://www.google.com/maps/dir/?api=1&destination=Librer%C3%ADa%20Itinerante%20y%20M%C3%A1s%2C%20Mariano%20Matamoros%20Pte.%20421%2C%20Centro%2C%20Monterrey',
} as const;

export function whatsapp(texto?: string): string {
  return `https://wa.me/${NEGOCIO.telefono}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}

export type Libro = {
  id: string;
  titulo: string;
  autor: string | null;
  editorial: string | null;
  genero: string | null;
  generoNombre: string | null;
  portada: { src: string; ancho: number; alto: number } | null;
  sinopsis: string | null;
  precio: number | null;
  anio: number | null;
  paginas: number | null;
  isbn: string | null;
  colecciones: string[];
  generoRejilla: string | null;
};

export type Coleccion = { id: string; titulo: string; nota: string; generos: string[] };

type LibroCrudo = (typeof catalogo.books)[number];

export const COLECCIONES: Coleccion[] = colecciones.collections.map((c) => ({
  id: c.id,
  titulo: c.titulo,
  nota: c.nota,
  generos: c.filtro.g,
}));

const subgeneros = catalogo.subgenres as Record<string, { n: string; c: string }>;

function aLibro(b: LibroCrudo): Libro {
  const g = b.g ?? null;
  return {
    id: b.id,
    titulo: b.t,
    autor: b.a ?? null,
    editorial: b.p ?? null,
    genero: g,
    generoNombre: g ? (subgeneros[g]?.n ?? null) : null,
    portada: b.c && b.cw && b.ch ? { src: `/${b.c}`, ancho: b.cw, alto: b.ch } : null,
    sinopsis: b.s ?? null,
    precio: typeof b.pr === 'number' ? b.pr : null,
    anio: (b.y as number | null) ?? null,
    paginas: (b.pg as number | null) ?? null,
    isbn: b.n ?? null,
    colecciones: COLECCIONES.filter((c) => g != null && c.generos.includes(g)).map((c) => c.id),
    generoRejilla: null,
  };
}

export const LIBROS: Libro[] = catalogo.books.map(aLibro).sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));

/** Novedades reales: solo las que la librería registra con fecha de llegada en collections.json. Hoy está vacía. */
export const NOVEDADES: Libro[] = (colecciones.novedades.entradas as Array<{ id: string; llegada: string }>)
  .map((e) => LIBROS.find((l) => l.id === e.id))
  .filter((l): l is Libro => l != null);

/** Tamaño del carrusel por colección: el mismo de rail.js (RAIL_SIZE). */
export const TAMANO_ESTANTE = 12;

const porTitulo = (a: Libro, b: Libro) => a.titulo.localeCompare(b.titulo, 'es');

/**
 * «Recomendados por colección» (el único carrusel del inicio, SPEC v1.3): las colecciones reales de collections.json, con el mismo
 * criterio que rail.js (pickBooks): filtro por género, orden por título, 12 por colección; empieza en la portada real más cercana al medio.
 */
export function recomendadosPorColeccion(): Record<string, { libros: Libro[]; inicio: number }> {
  return Object.fromEntries(
    COLECCIONES.map((c) => {
      const libros = LIBROS.filter((l) => l.genero != null && c.generos.includes(l.genero)).sort(porTitulo).slice(0, TAMANO_ESTANTE);
      return [c.id, { libros, inicio: inicioDelEstante(libros) }];
    }),
  );
}

export function inicioDelEstante(lista: Libro[]): number {
  const mid = Math.floor((lista.length - 1) / 2);
  for (let d = 0; d <= mid + 1; d++) for (const i of [mid - d, mid + d]) if (lista[i]?.portada) return i;
  return Math.max(0, mid);
}

/**
 * Filtro de género de la rejilla (taxonomía real de catalog.json / src/config/taxonomy.js). Los subgéneros de un solo título se unifican
 * en Narrativa, Poesía o Ensayo (SPEC §3, Critiquito #9). Las colecciones ya no son filtro de la rejilla (SPEC v1.3).
 */
export const GENEROS_REJILLA: Array<{ id: string; nombre: string; subgeneros: string[] }> = [
  { id: 'narrativa', nombre: 'Narrativa', subgeneros: ['narrativa', 'ensayo-narrativa'] },
  { id: 'poesia', nombre: 'Poesía', subgeneros: ['poesia', 'ensayo-poesia'] },
  { id: 'ensayo', nombre: 'Ensayo', subgeneros: ['ensayo', 'divulgacion'] },
];

export function generoDeRejilla(l: Libro): string | null {
  return GENEROS_REJILLA.find((g) => l.genero != null && g.subgeneros.includes(l.genero))?.id ?? null;
}

export function editorialesDeLaFranja(): string[] {
  const excluir = new Set(editoriales.excluir);
  const delCatalogo = [...new Set(LIBROS.map((l) => l.editorial).filter((p): p is string => !!p && !excluir.has(p)))].sort(
    (a, b) => a.localeCompare(b, 'es'),
  );
  return [...delCatalogo, ...editoriales.colaboran.map((c) => c.nombre).filter((n) => !delCatalogo.includes(n))];
}

export type Producto = { id: string; nombre: string; descripcion: string | null; precio: number | null };
export type CategoriaCarta = { id: string; nombre: string; chip: string; nota: string | null; productos: Producto[] };

export const CARTA: CategoriaCarta[] = carta.categorias.map((c) => ({
  id: c.id,
  nombre: c.nombre,
  chip: (c as { chip?: string }).chip ?? c.nombre,
  nota: (c as { nota?: string }).nota ?? null,
  productos: c.productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion ?? null,
    precio: typeof p.precio === 'number' ? p.precio : null,
  })),
}));

export const MERCH = merch.productos as Array<{ id: string; nombre: string }>;

export type Evento = { id: string; titulo: string; tipo: string | null; fecha: string | null; hora: string | null; descripcion: string };
export const EVENTOS: Evento[] = eventos.eventos.map((e) => ({
  id: e.id,
  titulo: e.titulo,
  tipo: e.tipo ?? null,
  fecha: e.fecha ?? null,
  hora: e.hora ?? null,
  descripcion: e.descripcion,
}));

// faq.json lo comparte la landing anterior, que sí muestra el estado de hoy. Aquí no hay estado abierto/cerrado (spec v1.4), así que
// la respuesta del horario solo remite al horario habitual.
export const PREGUNTAS = faq.preguntas.map((q) =>
  q.respuesta.includes('si estamos abiertos hoy')
    ? { ...q, respuesta: 'El [horario habitual](#horario) está más arriba, en esta misma sección.' }
    : q,
);

export function precioMXN(n: number): string {
  return `$${n} MXN`;
}

// Al final del módulo: GENEROS_REJILLA ya existe.
for (const l of LIBROS) l.generoRejilla = generoDeRejilla(l);

/**
 * Filas de la carta (P1-5): los productos sin precio en la carta impresa se agrupan en una sola fila con «Precio en barra», en lugar de
 * dejar medias filas vacías. «Tés» sale de la nota de la categoría («Los tés, fríos o calientes.»). Sin precios nuevos de la librería no se
 * imprime ningún precio: [pendiente] en docs, «Precio en barra» para el visitante.
 */
const GRUPOS_SIN_PRECIO: Record<string, Array<{ id: string; nombre: string; ids: string[] }>> = {
  'sin-cafe': [{ id: 'tes', nombre: 'Tés', ids: ['hierbabuena', 'manzanilla', '7-azahares', 'limon', 'jamaica', 'te-verde'] }],
};

export type FilaCarta =
  | { tipo: 'producto'; producto: Producto }
  | { tipo: 'grupo'; id: string; nombre: string; productos: Producto[] };

export function filasDeCarta(c: CategoriaCarta): FilaCarta[] {
  const grupos = GRUPOS_SIN_PRECIO[c.id] ?? [];
  const filas: FilaCarta[] = [];
  for (const p of c.productos) {
    const g = grupos.find((x) => x.ids.includes(p.id));
    if (g && p.precio == null) {
      const previa = filas.find((f) => f.tipo === 'grupo' && f.id === g.id);
      if (previa && previa.tipo === 'grupo') previa.productos.push(p);
      else filas.push({ tipo: 'grupo', id: g.id, nombre: g.nombre, productos: [p] });
    } else filas.push({ tipo: 'producto', producto: p });
  }
  return filas;
}

export type EventoFechado = { id: string; titulo: string; fecha: string; hora: string | null; lugar: string; descripcion: string; fuente: string };
export type ActividadRecurrente = { id: string; titulo: string; cuando: string; costo: string | null; fuente: string };

/** Hoy en Monterrey, AAAA-MM-DD. */
export function hoyMonterrey(ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
}

/** Eventos con fecha real y fuente oficial que siguen vigentes el día del build; el navegador los vuelve a ocultar pasado su día. */
export function eventosFechados(hoy = hoyMonterrey()): EventoFechado[] {
  return (eventosOficiales.fechados as EventoFechado[]).filter((e) => e.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
}
export const RECURRENTES = eventosOficiales.recurrentes as ActividadRecurrente[];

export function fechaLarga(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}

// Datos del frente nuevo (/nuevo), leídos al generar el HTML: los mismos JSON que usa la landing estática más los del frente.
// Nada se inventa: un campo nulo no se imprime, ni su título (SPEC v2 §3).
import catalogo from '../../assets/data/catalog.json';
import colecciones from '../../assets/data/collections.json';
import carta from '../../assets/data/menu.json';
import faq from '../../assets/data/faq.json';
import merch from '../../assets/data/merch.json';
import eventosCurados from './eventos.json';
import agendaPublica from '../../assets/data/eventos.json';
import negocio from './negocio.json';
import correcciones from './correcciones.json';
import destacadosCurados from './destacados.json';
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
  generoId: string | null;
  colecciones: string[];
  isbn: string | null;
  portada: { src: string; srcChica: string; srcset: string | null; ancho: number; alto: number } | null;
  sinopsis: string | null;
  precio: number | null;
  anio: number | null;
  paginas: number | null;
  /** Índice en el orden de presentación (portada primero). Lo usa el cliente para volver a ese orden. */
  ordenPortada: number;
};

type LibroCrudo = (typeof catalogo.books)[number];
const subgeneros = catalogo.subgenres as Record<string, { n: string; c: string }>;
const arreglos = correcciones.libros as Record<string, { g?: string }>;
const COLECCIONES = colecciones.collections as Array<{ id: string; titulo: string; filtro: { g: string[] } }>;

export function coleccionesDe(generoId: string | null): string[] {
  if (!generoId) return [];
  return COLECCIONES.filter((c) => c.filtro.g.includes(generoId)).map((c) => c.id);
}

/** GÉNERO visible: el nombre del subgénero tal como lo trae catalog.json (Narrativa, Poesía, Ensayo, Divulgación, Ensayo y poesía…). */
export function generoVisible(g: string | null): string | null {
  return g ? (subgeneros[g]?.n ?? null) : null;
}

function aLibro(b: LibroCrudo, ordenPortada = 0): Libro {
  const g = b.g ?? arreglos[b.id]?.g ?? null;
  const isbn = typeof b.n === 'string' && b.n ? b.n : null;
  return {
    id: b.id,
    titulo: b.t,
    autor: b.a ?? null,
    editorial: b.p ?? null,
    genero: generoVisible(g),
    generoId: g,
    colecciones: coleccionesDe(g),
    isbn,
    portada: b.c && b.cw && b.ch ? portadaDe(`/${b.c}`, b.cw, b.ch) : null,
    sinopsis: b.s ?? null,
    precio: typeof b.pr === 'number' ? b.pr : null,
    anio: (b.y as number | null) ?? null,
    paginas: (b.pg as number | null) ?? null,
    ordenPortada,
  };
}

function portadaPrimero(a: Libro, b: Libro): number {
  const ac = a.portada ? 0 : 1;
  const bc = b.portada ? 0 : 1;
  if (ac !== bc) return ac - bc;
  const ae = a.editorial ? 0 : 1;
  const be = b.editorial ? 0 : 1;
  if (ae !== be) return ae - be;
  const pe = (a.editorial ?? '').localeCompare(b.editorial ?? '', 'es');
  if (pe) return pe;
  return a.titulo.localeCompare(b.titulo, 'es');
}

/** Orden del inventario (catalog.json), sin reordenar. */
const INVENTARIO: Libro[] = catalogo.books.map((b) => aLibro(b));

/** Orden de presentación del catálogo: con portada primero, luego editorial y título. No es curaduría. */
export const LIBROS: Libro[] = [...INVENTARIO].sort(portadaPrimero).map((l, i) => ({ ...l, ordenPortada: i }));

const porId = new Map(LIBROS.map((l) => [l.id, l]));

/**
 * Vitrina Destacados. Solo los ids de destacados.json que existen y tienen portada.
 * Vacío o ausente: la sección no se pinta (no se inventa una selección en el código).
 */
export const DESTACADOS: Libro[] = (destacadosCurados.ids as string[])
  .map((id) => porId.get(id))
  .filter((l): l is Libro => l != null && l.portada != null)
  .slice(0, 10);

/** Novedades reales: collections.json › novedades.entradas ({ id, llegada }). Hoy está vacía, así que la sección no existe. */
export const NOVEDADES: Libro[] = (colecciones.novedades.entradas as Array<{ id: string; llegada: string }>)
  .map((e) => LIBROS.find((l) => l.id === e.id))
  .filter((l): l is Libro => l != null);

/** Lo que el navegador pide en la rejilla. A 390 px (≈46 vw, dpr 1 o 2) elige la de 360; la de 600 y la grande quedan para pantallas mayores. */
export const PORTADA_SIZES = '(max-width: 479px) 46vw, (max-width: 879px) 31vw, 240px';

function portadaDe(src: string, ancho: number, alto: number): { src: string; srcChica: string; srcset: string | null; ancho: number; alto: number } {
  if (ancho <= 600) return { src, srcChica: src, srcset: null, ancho, alto };
  const base = src.replace(/\.webp$/, '');
  const srcChica = `${base}-360.webp`;
  return { src, srcChica, srcset: `${srcChica} 360w, ${base}-600.webp 600w, ${src} ${ancho}w`, ancho, alto };
}

export type MerchItem = {
  id: string;
  nombre: string;
  precio: number | null;
  descripcion: string | null;
  tipo: string | null;
  foto: { src: string; alt: string } | null;
};

type MerchCrudo = { id?: string; nombre?: string; precio?: number | null; descripcion?: string | null; tipo?: string | null; foto?: { src?: string; alt?: string } | null };

/** Merch válido (nombre y foto). Hoy merch.json está vacío: la tarjeta existe en el código y no se imprime. */
export const MERCH: MerchItem[] = (merch.productos as MerchCrudo[]).flatMap((m) => {
  if (!m?.id || !m.nombre || !m.foto?.src || !m.foto.alt) return [];
  return [{ id: m.id, nombre: m.nombre, precio: typeof m.precio === 'number' ? m.precio : null, descripcion: m.descripcion ?? null, tipo: m.tipo ?? null, foto: { src: m.foto.src, alt: m.foto.alt } }];
});

/** Talleres vendibles de la tienda. Hoy ninguno: el Club de Dibujo vive en Talleres y se registra por separado. */
export type TallerTienda = { id: string; titulo: string; precio: number | null };
export const TALLERES: TallerTienda[] = [];

export type HuecoId = 'libros' | 'merch' | 'talleres';

export type ProductoTienda = {
  id: string;
  nombre: string;
  precio: number | null;
  descripcion: string | null;
  tipo: HuecoId;
  foto: { src: string; alt: string } | null;
};

/** Un tipo se ilustra con tarjetas reales a partir de 2 productos (S-19). Por debajo, el hueco sigue vacío. */
export const MIN_TARJETAS_TIPO = 2;

function tipoHueco(tipo: string | null | undefined): HuecoId {
  const t = (tipo ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (t.includes('taller')) return 'talleres';
  if (t.includes('libro')) return 'libros';
  return 'merch';
}

export function productosTienda(lista: unknown = merch.productos): ProductoTienda[] {
  if (!Array.isArray(lista)) return [];
  const out: ProductoTienda[] = [];
  for (const crudo of lista) {
    const m = crudo as MerchCrudo;
    if (!m?.id || !m.nombre) continue;
    const foto = m.foto?.src && m.foto.alt ? { src: m.foto.src.startsWith('/') ? m.foto.src : `/${m.foto.src}`, alt: m.foto.alt } : null;
    out.push({
      id: m.id,
      nombre: m.nombre,
      precio: typeof m.precio === 'number' ? m.precio : null,
      descripcion: m.descripcion ?? null,
      tipo: tipoHueco(m.tipo),
      foto,
    });
  }
  return out;
}

export type HuecoTienda = { id: HuecoId; nombre: string; tarjetas: ProductoTienda[] | null };
export type PlanTienda = { huecos: HuecoTienda[]; linea: string | null; sello: boolean };

const NOMBRES_HUECO: Record<HuecoId, string> = { libros: 'Libros', merch: 'Merch', talleres: 'Talleres' };

/**
 * Esqueleto de la Tienda. Con menos de 2 productos de un tipo, su hueco queda vacío.
 * La línea deja de nombrar el tipo que ya tiene tarjetas. Sin huecos vacíos, no hay sello ni línea.
 */
export function planTienda(lista: unknown = merch.productos): PlanTienda {
  const grupos: Record<HuecoId, ProductoTienda[]> = { libros: [], merch: [], talleres: [] };
  for (const p of productosTienda(lista)) grupos[p.tipo].push(p);
  const huecos: HuecoTienda[] = (['libros', 'merch', 'talleres'] as const).map((id) => ({
    id,
    nombre: NOMBRES_HUECO[id],
    tarjetas: grupos[id].length >= MIN_TARJETAS_TIPO ? grupos[id] : null,
  }));
  const pendientes: string[] = [];
  if (grupos.merch.length < MIN_TARJETAS_TIPO) pendientes.push('Merch');
  if (grupos.talleres.length < MIN_TARJETAS_TIPO) pendientes.push('Talleres');
  const hayHueco = huecos.some((h) => h.tarjetas == null);
  let linea: string | null = null;
  if (hayHueco && pendientes.length === 2) linea = 'Merch y talleres: próximamente.';
  else if (hayHueco && pendientes.length === 1) linea = `${pendientes[0]}: próximamente.`;
  return { huecos, linea, sello: hayHueco };
}

/** Editoriales: un filtro con menos de 2 libros no se imprime. */
export const MINIMO_FILTRO = 2;

export function editorialesConFiltro(libros = LIBROS): Array<{ nombre: string; n: number }> {
  const cuenta = new Map<string, number>();
  for (const l of libros) if (l.editorial) cuenta.set(l.editorial, (cuenta.get(l.editorial) ?? 0) + 1);
  return [...cuenta]
    .filter(([, n]) => n >= MINIMO_FILTRO)
    .map(([nombre, n]) => ({ nombre, n }))
    .sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es'));
}

export type TipoTienda = { id: 'libros' | 'merch' | 'talleres'; nombre: string; n: number };

/** Libros, Merch y Talleres se muestran siempre. Un tipo con 0 productos no se inventa: la página dice «Próximamente». */
export function tiposDeTienda(extra?: { libros?: number; merch?: number; talleres?: number }): TipoTienda[] {
  return [
    { id: 'libros', nombre: 'Libros', n: extra?.libros ?? LIBROS.length },
    { id: 'merch', nombre: 'Merch', n: extra?.merch ?? MERCH.length },
    { id: 'talleres', nombre: 'Talleres', n: extra?.talleres ?? TALLERES.length },
  ];
}

/** Editoriales del catálogo, también las de un solo libro. El libro sin editorial no genera filtro. */
export function editorialesCatalogo(libros = LIBROS): Array<{ nombre: string; rotulo: string; n: number }> {
  const cuenta = new Map<string, number>();
  for (const l of libros) if (l.editorial) cuenta.set(l.editorial, (cuenta.get(l.editorial) ?? 0) + 1);
  return [...cuenta]
    .map(([nombre, n]) => ({ nombre, rotulo: nombre.replace(/ Casa Editorial$/, ''), n }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'es'));
}

/** Géneros de filtro: las colecciones reales (un libro puede estar en dos). */
export function generosColeccion(libros = LIBROS): Array<{ id: string; nombre: string; n: number }> {
  return COLECCIONES.map((c) => ({
    id: c.id,
    nombre: c.titulo,
    n: libros.filter((l) => l.colecciones.includes(c.id)).length,
  })).filter((g) => g.n > 0);
}

/** Géneros con al menos 2 libros: un chip por género, igual que las editoriales. */
export function generosConFiltro(libros = LIBROS): Array<{ nombre: string; n: number }> {
  const cuenta = new Map<string, number>();
  for (const l of libros) if (l.genero) cuenta.set(l.genero, (cuenta.get(l.genero) ?? 0) + 1);
  return [...cuenta]
    .filter(([, n]) => n >= MINIMO_FILTRO)
    .map(([nombre, n]) => ({ nombre, n }))
    .sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es'));
}

/** El ítem del menú de la tienda dice «Libros» mientras no haya merch (S-18). */
export const NOMBRE_TIENDA = MERCH.length ? 'Tienda' : 'Libros';

type FotoProducto = { src: string; alt: string };
/** Video corto propio del plato (vertical, sin sonido, en bucle): `src` local bajo assets/, `poster` opcional. */
type VideoProducto = { src: string; poster: string | null };
export type IconoCarta =
  | 'taza' | 'espresso' | 'olla' | 'affogato' | 'chocolate' | 'te' | 'vaso'
  | 'sandwich' | 'quesadilla' | 'mollete' | 'empanada' | 'tarta' | 'plato';
type Producto = {
  id: string; nombre: string; descripcion: string | null; precio: number | null;
  foto: FotoProducto | null; video: VideoProducto | null; icono: IconoCarta;
};
type ProductoCrudo = Omit<Producto, 'foto' | 'video' | 'icono'> & {
  foto?: FotoProducto | null; video?: { src: string; poster?: string | null } | null;
};
export type CategoriaCarta = { id: string; nombre: string; productos: Producto[] };

// El icono de cada plato mientras no haya foto ni video; lo que no esté aquí toma el de su categoría.
const ICONO_PRODUCTO: Record<string, IconoCarta> = {
  'cafe-de-olla': 'olla', espresso: 'espresso', affogato: 'affogato', chocolate: 'chocolate',
  jamaica: 'vaso', 'aguas-frescas': 'vaso', sandwich: 'sandwich', 'quesadilla-campesina': 'quesadilla',
  molletes: 'mollete', 'empanada-de-cajeta': 'empanada', 'empanada-de-pina': 'empanada', 'tarta-del-dia': 'tarta',
};
const ICONO_CATEGORIA: Record<string, IconoCarta> = { cafe: 'taza', 'sin-cafe': 'te', salado: 'plato', postres: 'tarta' };

/** Carta «En la barra»: categorías y productos de menu.json. Las notas no se imprimen (S-6). */
export const CARTA: CategoriaCarta[] = carta.categorias.map((c) => ({
  id: c.id,
  nombre: c.nombre,
  productos: c.productos.map((p: ProductoCrudo) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion ?? null,
    precio: typeof p.precio === 'number' ? p.precio : null,
    foto: p.foto ? { src: '/' + p.foto.src, alt: p.foto.alt } : null,
    video: p.video ? { src: '/' + p.video.src, poster: p.video.poster ? '/' + p.video.poster : null } : null,
    icono: ICONO_PRODUCTO[p.id] ?? ICONO_CATEGORIA[c.id] ?? 'plato',
  })),
}));

function sinAcento(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Preguntas (S-11): solo las dos que no remiten a otra sección, con la respuesta de faq.json recortada a lo confirmado
 * (PENDIENTES-NEGOCIO (b) y (d)). faq.json lo sigue usando la landing anterior tal cual.
 */
export const PREGUNTAS: Array<{ id: string; pregunta: string; respuesta: string }> = [
  { id: 'libro', respuesta: 'Búscalo en el catálogo y, en su ficha, toca «Consultar disponibilidad por WhatsApp»: se abre WhatsApp con el mensaje ya escrito. Si no lo tenemos, te lo podemos pedir.' },
  { id: 'festivos', respuesta: 'Pregúntanos antes por WhatsApp.' },
].map((r) => {
  const q = faq.preguntas.find((p) => p.id === r.id);
  if (!q) throw new Error(`faq.json ya no tiene la pregunta «${r.id}»`);
  return { id: r.id, pregunta: q.pregunta, respuesta: r.respuesta };
});

export type Evento = {
  id: string;
  seccion: 'eventos' | 'talleres';
  titulo: string;
  fecha: string | null;
  /** Solo talleres recurrentes: la siguiente sesión confirmada. Pasado ese día vuelve a verse solo la recurrencia. */
  proximaSesion: string | null;
  hora: string | null;
  lugar: string | null;
  organizador: string | null;
  imagen: string | null;
  descripcion: string | null;
  registroUrl: string | null;
  registroWhatsApp: boolean;
  facilitadorInstagram: string | null;
  instagramUrl: string;
  recurrencia: string | null;
  costo: string | null;
  incluye: string | null;
};

type EventoCrudo = {
  id: string;
  seccion?: 'eventos' | 'talleres';
  titulo: string;
  fecha?: string | null;
  proximaSesion?: string | null;
  hora?: string | null;
  lugar?: string | null;
  organizador?: string | null;
  imagen?: string | null;
  descripcion?: string | null;
  registroUrl?: string | null;
  registroWhatsApp?: boolean;
  facilitadorInstagram?: string | null;
  instagramUrl: string;
  recurrencia?: string | null;
  costo?: string | null;
  incluye?: string | null;
};

export function enlaceLuma(valor?: string | null): string | null {
  if (!valor) return null;
  try {
    const url = new URL(valor);
    const dominios = ['luma.com', 'lu.ma', 'www.luma.com', 'www.lu.ma'];
    return url.protocol === 'https:' && dominios.includes(url.host) && !url.username && !url.password
      && url.pathname !== '/' ? url.href : null;
  } catch {
    return null;
  }
}

/** Fecha ISO real (AAAA-MM-DD, hora de Monterrey) o null: un valor inválido no se imprime. */
function fechaIso(valor: unknown): string | null {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor ? valor : null;
}

function aEvento(e: EventoCrudo): Evento {
  const imagen = e.imagen && /^\/assets\/img\/[a-z0-9_/-]+\.(webp|avif|png|jpe?g)$/i.test(e.imagen) ? e.imagen : null;
  const registro = enlaceLuma(e.registroUrl);
  return {
    id: e.id,
    seccion: e.seccion === 'talleres' ? 'talleres' : 'eventos',
    titulo: e.titulo,
    fecha: fechaIso(e.fecha),
    proximaSesion: fechaIso(e.proximaSesion),
    hora: e.hora ?? null,
    lugar: e.lugar ?? null,
    organizador: e.organizador ?? null,
    imagen,
    descripcion: e.descripcion?.trim() || null,
    registroUrl: registro,
    registroWhatsApp: !registro && e.registroWhatsApp === true,
    facilitadorInstagram: e.facilitadorInstagram && /^[a-z0-9_][a-z0-9_.]{0,29}$/i.test(e.facilitadorInstagram)
      ? e.facilitadorInstagram : null,
    instagramUrl: e.instagramUrl,
    recurrencia: e.recurrencia ?? null,
    costo: e.costo ?? null,
    incluye: e.incluye ?? null,
  };
}

type TallerHoja = {
  id: string;
  titulo: string;
  tipo?: string;
  origen?: string;
  fecha?: string | null;
  hora?: string | null;
  fin?: string | null;
  con?: string | null;
  lugar?: string | null;
  incluye?: string | null;
  imagen?: string | null;
  descripcion?: string | null;
  costo?: readonly string[];
  reserva?: { tipo?: string; url?: string; telefono?: string } | null;
};

export function talleresDeHoja(filas: readonly TallerHoja[], curados: readonly Evento[]) {
  const ids = new Set(curados.map((evento) => evento.id));
  const titulos = new Set(curados.map((evento) => sinAcento(evento.titulo).trim()));
  return filas.flatMap((fila) => {
    if (fila.origen !== 'hoja' || fila.tipo?.trim().toLowerCase() !== 'taller' || !fila.fecha ||
        ids.has(fila.id) || titulos.has(sinAcento(fila.titulo).trim())) return [];
    ids.add(fila.id);
    const reserva = fila.reserva;
    return [aEvento({
      id: fila.id,
      seccion: 'talleres',
      titulo: fila.titulo,
      fecha: fila.fecha,
      hora: fila.hora && fila.fin ? fila.hora + '–' + fila.fin : fila.hora,
      organizador: fila.con,
      lugar: fila.lugar,
      incluye: fila.incluye,
      imagen: fila.imagen ? '/' + fila.imagen : null,
      descripcion: fila.descripcion,
      costo: fila.costo?.join(' · '),
      registroUrl: reserva?.tipo === 'luma' ? reserva.url : null,
      registroWhatsApp: reserva?.tipo === 'whatsapp' && reserva.telefono === NEGOCIO.telefono.slice(-10),
      instagramUrl: NEGOCIO.instagram,
    })];
  });
}

const agendaCurada = (eventosCurados.eventos as EventoCrudo[]).map(aEvento);
export const ACTIVIDAD_RECIENTE = eventosCurados.actividadReciente;
export const AGENDA_SEMANAL = eventosCurados.agendaSemanal;

// Fechados primero, por fecha. Las actividades fijas conservan el orden de la semana.
export const EVENTOS: Evento[] = [...agendaCurada, ...talleresDeHoja(agendaPublica.eventos, agendaCurada)]
  .sort((a, b) => {
    if (a.fecha && b.fecha) return a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo, 'es');
    if (a.fecha) return -1;
    if (b.fecha) return 1;
    return 0;
  });

export const FECHADOS = EVENTOS.filter((e): e is Evento & { fecha: string } => e.fecha != null);
export const RECURRENTES = EVENTOS.filter((e) => e.fecha == null);


/** Eventos con fecha que siguen vigentes `hoy` (el día del evento todavía cuenta). */
export function eventosFechados(hoy = hoyMonterrey()): Array<Evento & { fecha: string }> {
  return FECHADOS.filter((e) => e.fecha >= hoy);
}

/** Último día con una actividad fechada en la agenda. */
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

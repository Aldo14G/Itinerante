/** @jsxRuntime automatic */
/** @jsxImportSource react */
// /nuevo, dirección «La camioneta» v4.2. React 19 se renderiza a HTML estático en el build.
// Sin JavaScript el HTML ya trae la portada, los eventos, Destacados en lista, los 41 libros,
// el esqueleto de la Tienda, Visita y la carta. El cliente solo anima y hace instantáneos los filtros.
import { Fragment, type ReactNode } from 'react';
import {
  CARTA,
  DESTACADOS,
  EVENTOS,
  LIBROS,
  NEGOCIO,
  PREGUNTAS,
  planTienda,
  editorialesCatalogo,
  generosColeccion,
  fechaCorta,
  precioMXN,
  whatsapp,
  type Evento,
  type Libro,
  type PlanTienda,
  type ProductoTienda,
} from './datos';
import {
  CONSULTA_VACIA,
  compararLibros,
  hrefCatalogo,
  idsVisibles,
  librosConsulta,
  toggleValor,
  type Consulta,
} from './consulta';
import { diaSiguiente } from './fechas';
import { TRAZO_D, TRAZO_VB } from './trazo';

export type { Consulta };

const SIZES_ESTANTE = '(max-width: 767px) 42vw, (max-width: 1023px) 28vw, 250px';
const SIZES_VITRINA = '(max-width: 700px) 150px, 245px';
const SIZES_CARGA = '(max-width: 700px) 72px, 140px';

const CARGA: Array<[string, number, number]> = [
  ['los-que-se-fueron-los-que-llegaron-javier-cravioto-padilla', 2, -8],
  ['los-habitantes-francisco-trejo-carlomagno-sol-jasmin-cacheux', 24, 4],
  ['lo-que-el-doc-quiso-decir-antonio-zamudio', 46, -3],
  ['las-ruinas-de-la-caza-alfredo-leal', 68, 7],
];

function Hasta({ d, children }: { d: string; children: ReactNode }) {
  return <fecha-hasta d={d}>{children}</fecha-hasta>;
}
function Desde({ d, children }: { d: string; children: ReactNode }) {
  return <fecha-desde d={d}>{children}</fecha-desde>;
}

function ultimoDiaConFecha(): string | null {
  const fechas = EVENTOS.map((e) => e.fecha).filter((f): f is string => f != null).sort();
  return fechas.length ? fechas[fechas.length - 1] : null;
}

function SegunEventos({ con, sin }: { con: ReactNode; sin: ReactNode }) {
  const ultimo = ultimoDiaConFecha();
  if (!ultimo) return <>{sin}</>;
  return (
    <>
      <Hasta d={ultimo}>{con}</Hasta>
      <Desde d={diaSiguiente(ultimo)}>{sin}</Desde>
    </>
  );
}

function Icon({ id, oculto = true }: { id: string; oculto?: boolean }) {
  return (
    <svg aria-hidden={oculto || undefined}>
      <use href={`#${id}`} />
    </svg>
  );
}

function mensajeLibro(l: Pick<Libro, 'titulo' | 'autor' | 'precio'>): string {
  return `Hola, ¿tienen disponible «${l.titulo}»${l.autor ? ` de ${l.autor}` : ''}${l.precio != null ? ` (${precioMXN(l.precio)})` : ''}?`;
}

function cuentaLibros(n: number): string {
  if (n === 0) return 'Sin resultados';
  return n === 1 ? '1 libro' : `${n} libros`;
}

function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function Marca({ texto, q }: { texto: string; q: string }) {
  const toks = normalizar(q).split(/\s+/).filter(Boolean);
  if (!toks.length || !texto) return <>{texto}</>;
  let plano = '';
  const mapa: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    for (const ch of normalizar(texto[i])) {
      plano += ch;
      mapa.push(i);
    }
  }
  mapa.push(texto.length);
  const marcas: Array<[number, number]> = [];
  for (const t of toks) {
    let k = plano.indexOf(t);
    while (k >= 0) {
      marcas.push([mapa[k], mapa[k + t.length]]);
      k = plano.indexOf(t, k + t.length);
    }
  }
  if (!marcas.length) return <>{texto}</>;
  marcas.sort((a, b) => a[0] - b[0]);
  const partes: ReactNode[] = [];
  let cursor = 0;
  marcas.forEach(([a, b], i) => {
    if (a < cursor) return;
    if (a > cursor) partes.push(texto.slice(cursor, a));
    partes.push(<mark key={i}>{texto.slice(a, b)}</mark>);
    cursor = b;
  });
  if (cursor < texto.length) partes.push(texto.slice(cursor));
  return <>{partes}</>;
}

function Sprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <symbol id="i-flecha" viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="i-izq" viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="i-der" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="i-sale" viewBox="0 0 24 24"><path d="M8 16 17 7m-8 0h8v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="i-lugar" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="9.5" r="2.4" fill="currentColor" /></symbol>
      <symbol id="i-reloj" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></symbol>
      <symbol id="i-persona" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></symbol>
      <symbol id="i-buscar" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></symbol>
      <symbol id="i-cerrar" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></symbol>
      <symbol id="i-msj" viewBox="0 0 24 24"><path d="M4 19.5 5.3 15A8 8 0 1 1 9 18.7Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></symbol>
      <symbol id="i-tel" viewBox="0 0 24 24"><path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></symbol>
      <symbol id="i-correo" viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" /></symbol>
      <symbol id="i-camara" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17" cy="7" r="1.2" fill="currentColor" /></symbol>
      <symbol id="i-pagina" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M13.5 20v-7h3m-3 0v-2.5a2 2 0 0 1 2-2H17" fill="none" stroke="currentColor" strokeWidth="2" /></symbol>
      <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="i-embudo" viewBox="0 0 24 24"><path d="M4 5h16l-6 7.5V19l-4-2v-4.5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></symbol>
      <symbol id="i-rejilla" viewBox="0 0 24 24"><path d="M4.5 4.5h6v6h-6zm9 0h6v6h-6zm-9 9h6v6h-6zm9 0h6v6h-6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></symbol>
      <symbol id="i-lista" viewBox="0 0 24 24"><path d="M4 6h3m3 0h10M4 12h3m3 0h10M4 18h3m3 0h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></symbol>
      <symbol id="i-forma" viewBox="0 0 24 24"><path d="M7 3.5h7l4.5 4.5v12.5H7Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M10 12h6m-6 4h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></symbol>
      <symbol id="camioneta" viewBox={TRAZO_VB}><path fill="currentColor" fillRule="evenodd" d={TRAZO_D} /></symbol>
    </svg>
  );
}

function SinPortada({ editorial }: { editorial: string | null }) {
  return (
    <div className="sin-portada" aria-hidden="true">
      <span>{editorial ?? ''}</span>
      <Icon id="camioneta" />
    </div>
  );
}

function Cabecera({ hrefLibros }: { hrefLibros: string }) {
  return (
    <header className="cab" data-suelo="menta">
      <div className="envoltura">
        <a className="marca" href="#inicio" aria-label="Librería Itinerante y Más, inicio">
          <Icon id="camioneta" />
          <span>Itinerante y Más</span>
        </a>
        <nav aria-label="Secciones">
          <a href="#eventos">Eventos</a>
          <a href={hrefLibros}>Libros</a>
          <a href="#visita">Visita</a>
        </nav>
      </div>
    </header>
  );
}

function Portada() {
  const porId = new Map(LIBROS.map((l) => [l.id, l]));
  const librosHref = DESTACADOS.length ? '#destacados' : '#libros';
  return (
    <section id="inicio" className="portada" data-suelo="menta">
      <span id="portada" className="ancla" />
      <div className="portada-arriba">
        <h1>Librería Itinerante y&nbsp;Más</h1>
      </div>
      <div className="camion" aria-hidden="true">
        <div className="carga" id="carga">
          {CARGA.map(([id, left, giro]) => {
            const l = porId.get(id);
            if (!l?.portada) return null;
            return (
              <img
                key={id}
                src={l.portada.srcChica}
                alt=""
                width={400}
                height={600}
                style={{ left: `${left}%`, transform: `rotate(${giro}deg)` }}
                data-r={giro}
                sizes={SIZES_CARGA}
              />
            );
          })}
        </div>
        <svg className="trazo" viewBox={TRAZO_VB}><use href="#camioneta" /></svg>
      </div>
      <div className="portada-abajo">
        <p id="linea">{NEGOCIO.linea}</p>
        <SegunEventos
          con={<a className="boton boton--tinta cta-portada" href="#eventos">Ver eventos <Icon id="i-flecha" /></a>}
          sin={<a className="boton boton--tinta cta-portada" href={librosHref}>Ver libros <Icon id="i-flecha" /></a>}
        />
      </div>
    </section>
  );
}

function Parada({ e, destacada }: { e: Evento; destacada: boolean }) {
  const f = e.fecha ? fechaCorta(e.fecha) : null;
  const cartel = e.fecha ? 'cartel cartel--menta' : 'cartel cartel--noche';
  const hora = e.hora ?? 'Hora por anunciar';
  return (
    <article className={destacada ? 'parada destacada' : 'parada'} data-fecha={e.fecha ?? ''}>
      <div className="fecha">
        <i />
        {f ? f.dia + ' ' + f.numero + ' ' + f.mes : e.recurrencia}
        {f ? <span className="sr">, <time dateTime={e.fecha!}>{f.larga}</time></span> : null}
      </div>
      <div className="tarjeta-evento">
        <div>
          <h3>{e.titulo}</h3>
          <p className="dato hora-dato"><Icon id="i-reloj" />{hora}</p>
          {e.organizador ? <p className="dato"><Icon id="i-persona" />Con {e.organizador}</p> : null}
          {e.lugar ? <p className="dato"><Icon id="i-lugar" />{e.lugar}</p> : null}
          {e.incluye ? <p className="dato"><Icon id="i-check" />Incluye {e.incluye.toLowerCase()}</p> : null}
        </div>
        <div className={cartel} aria-hidden="true"><Icon id="camioneta" oculto={false} /></div>
        <div className="acciones">
          {e.costo ? <span className="precio">{e.costo}</span> : <span />}
          {e.registroUrl ? (
            <a className="boton boton--tinta" href={e.registroUrl} target="_blank" rel="noopener noreferrer">Registrarme <Icon id="i-sale" /></a>
          ) : (
            <a className="boton boton--borde" href={e.instagramUrl} target="_blank" rel="noopener noreferrer">Ver en Instagram <Icon id="i-sale" /></a>
          )}
        </div>
      </div>
    </article>
  );
}

function Eventos() {
  const fechados = EVENTOS.filter((e) => e.fecha);
  const resto = EVENTOS.filter((e) => !e.fecha);
  return (
    <section id="eventos" className="eventos" data-suelo="papel" aria-labelledby="t-eventos">
      <span id="cartelera" className="ancla" />
      <div className="envoltura">
        <div className="cabeza-seccion">
          <h2 className="h2" id="t-eventos">Eventos</h2>
          <div className="controles" id="ruta-controles" hidden>
            <button className="flecha" id="ruta-ant" type="button" aria-label="Eventos anteriores"><Icon id="i-izq" /></button>
            <button className="flecha" id="ruta-sig" type="button" aria-label="Eventos siguientes"><Icon id="i-der" /></button>
          </div>
        </div>
        <div className="ruta" id="ruta">
          {EVENTOS.length ? (
            <>
              {fechados.map((e) => (
                <Hasta key={e.id} d={e.fecha!}>
                  <Parada e={e} destacada={e === fechados[0]} />
                </Hasta>
              ))}
              {resto.map((e) => <Parada key={e.id} e={e} destacada={false} />)}
            </>
          ) : (
            <p className="vacio">Sin fechas publicadas por ahora. La agenda sale primero en <a href={NEGOCIO.instagram}>Instagram</a>.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function FichaBreve({ l }: { l: Libro }) {
  return (
    <>
      <h3>{l.titulo}</h3>
      <p>
        {l.autor}
        {l.editorial ? ` · ${l.editorial}` : ''}
        {l.precio != null ? <> · <span className="precio">{precioMXN(l.precio)}</span></> : null}
      </p>
    </>
  );
}

function Destacados() {
  if (!DESTACADOS.length) return null;
  const centro = Math.min(3, DESTACADOS.length - 1);
  const n = DESTACADOS.length;
  return (
    <section id="destacados" className="destacados oscuro" data-suelo="vitrina" aria-labelledby="t-destacados">
      <div className="envoltura">
        <div className="cabeza-seccion">
          <div>
            <h2 className="h2" id="t-destacados">Destacados</h2>
            <p className="resumen">{n} libros de la selección. Los {LIBROS.length} están abajo, en el catálogo.</p>
          </div>
        </div>
        <ul className="destacados-lista">
          {DESTACADOS.map((l) => (
            <li key={l.id}>
              <a href={whatsapp(mensajeLibro(l))} target="_blank" rel="noopener noreferrer">
                <img src={l.portada!.srcChica} alt="" width={56} height={84} />
                <span>
                  <strong>{l.titulo}</strong>
                  {l.autor}
                  {l.precio != null ? ` · ${precioMXN(l.precio)}` : ''}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div
        className="vitrina"
        id="vitrina"
        tabIndex={0}
        role="group"
        aria-roledescription="carrusel"
        aria-label={`Destacados: ${n} libros. Flechas izquierda y derecha para hojear; Enter abre la ficha.`}
      >
        <p className="pista" aria-hidden="true"><kbd><Icon id="i-izq" oculto={false} /></kbd><kbd><Icon id="i-der" oculto={false} /></kbd>para hojear</p>
        <div className="lampara" />
        <div className="piso" />
        <div className="escenario" id="escenario">
          {DESTACADOS.map((l, i) => {
            const cerca = Math.abs(i - centro) <= 3;
            const src = l.portada!.srcChica;
            return (
              <div className={i === centro ? 'pieza centro' : 'pieza'} data-i={i} data-id={l.id} key={l.id}>
                <div className="cara">
                  <img
                    {...(cerca ? { src } : { 'data-src': src })}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={600}
                    sizes={SIZES_VITRINA}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="envoltura vitrina-pie">
        <div className="ficha-vitrina" id="ficha-vitrina" aria-live="polite">
          <FichaBreve l={DESTACADOS[centro]} />
        </div>
        <div className="vitrina-controles">
          <button className="flecha" id="v-ant" type="button" aria-label="Libro anterior" disabled={centro === 0}><Icon id="i-izq" /></button>
          <span className="contador" id="v-cont">{centro + 1} de {n}</span>
          <button className="flecha" id="v-sig" type="button" aria-label="Libro siguiente" disabled={centro === n - 1}><Icon id="i-der" /></button>
        </div>
        <a className="al-estante" href="#libros">Ver el catálogo completo <Icon id="i-flecha" /></a>
      </div>
    </section>
  );
}

function LibroItem({ l, c, visible }: { l: Libro; c: Consulta; visible: boolean }) {
  const meta = [l.autor, l.editorial].filter(Boolean).join(' · ');
  return (
    <li data-id={l.id} data-i={l.ordenPortada} data-genero={l.colecciones.join(' ')} data-editorial={l.editorial ?? ''} hidden={visible ? undefined : true}>
      <article className="libro">
        <div className="portada-libro">
          {l.portada ? (
            <img src={l.portada.srcChica} alt="" width={400} height={600} loading="lazy" decoding="async" sizes={SIZES_ESTANTE} srcSet={l.portada.srcset ?? undefined} />
          ) : (
            <SinPortada editorial={l.editorial} />
          )}
        </div>
        <h3>
          <a href={whatsapp(mensajeLibro(l))} target="_blank" rel="noopener noreferrer">
            <Marca texto={l.titulo} q={c.q} />
          </a>
        </h3>
        <p className="meta"><Marca texto={meta} q={c.q} /></p>
        {l.precio != null ? <p className="precio">{precioMXN(l.precio)}</p> : null}
      </article>
    </li>
  );
}

function CuerpoFicha({ l }: { l: Libro }) {
  const attrs: Array<[string, string]> = [
    ['Autor', l.autor],
    ['Editorial', l.editorial],
    ['Género', l.genero],
    ['ISBN', l.isbn],
  ].filter((fila): fila is [string, string] => Boolean(fila[1]));
  return (
    <>
      <div className="portada-hoja">
        {l.portada ? <img src={l.portada.src} alt={`Portada de ${l.titulo}`} /> : <SinPortada editorial={l.editorial} />}
      </div>
      <h2 id="hoja-t">{l.titulo}</h2>
      {l.precio != null ? <p className="precio">{precioMXN(l.precio)}</p> : null}
      {attrs.length ? (
        <dl className="atributos">
          {attrs.map(([k, v]) => (
            <Fragment key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </Fragment>
          ))}
        </dl>
      ) : null}
      {l.sinopsis ? <p className="sinopsis">{l.sinopsis}</p> : null}
      <a className="boton boton--tinta" href={whatsapp(mensajeLibro(l))} target="_blank" rel="noopener noreferrer">
        Consultar disponibilidad por WhatsApp <Icon id="i-sale" />
      </a>
    </>
  );
}

function Catalogo({ c }: { c: Consulta }) {
  const generos = generosColeccion();
  const editoriales = editorialesCatalogo();
  const ordenados = [...LIBROS].sort(compararLibros(c.orden));
  const coinciden = librosConsulta(c, ordenados);
  const visibles = idsVisibles(c, ordenados);
  const n = coinciden.length;
  const activos = c.genero.length + c.editorial.length;
  const hayQ = Boolean(c.q);
  const tituloVacio = hayQ && activos
    ? `No encontramos libros para «${c.q}» con estos filtros`
    : hayQ
      ? `No encontramos libros para «${c.q}»`
      : 'Ningún libro cumple con estos filtros';
  const sinFiltros = hrefCatalogo(c, { genero: [], editorial: [], q: c.q });
  const sinBusqueda = hrefCatalogo(c, { q: '' });
  const limpiarHref = hrefCatalogo(c, { genero: [], editorial: [] });
  const chips: Array<{ campo: 'genero' | 'editorial'; valor: string; rotulo: string }> = [
    ...c.genero.map((valor) => ({ campo: 'genero' as const, valor, rotulo: generos.find((g) => g.id === valor)?.nombre ?? valor })),
    ...c.editorial.map((valor) => ({ campo: 'editorial' as const, valor, rotulo: editoriales.find((e) => e.nombre === valor)?.rotulo ?? valor })),
  ];
  return (
    <section id="libros" className="catalogo" data-suelo="papel" aria-labelledby="t-libros">
      <span id="catalogo" className="ancla" />
      <div className="envoltura">
        <div className="cat-cabeza">
          <h2 className="h2" id="t-libros" tabIndex={-1}>Catálogo</h2>
          <p className="cat-resumen">{LIBROS.length} libros · {editoriales.length} editoriales</p>
          <form className="busqueda" role="search" id="busqueda" action="/nuevo#libros" method="get">
            <label htmlFor="q" className="sr">Buscar en el catálogo</label>
            <svg className="lupa" aria-hidden="true"><use href="#i-buscar" /></svg>
            <input id="q" name="q" type="search" placeholder="Título, autor o editorial" autoComplete="off" enterKeyHint="search" aria-describedby="q-atajo" defaultValue={c.q} />
            {c.genero.length ? <input type="hidden" name="genero" value={c.genero.slice().sort().join(',')} /> : null}
            {c.editorial.length ? <input type="hidden" name="editorial" value={c.editorial.slice().sort().join(',')} /> : null}
            {c.vista !== 'rejilla' ? <input type="hidden" name="vista" value={c.vista} /> : null}
            <a className="borrar" id="q-borrar" href={sinBusqueda} aria-label="Borrar búsqueda" hidden={hayQ ? undefined : true}><Icon id="i-cerrar" /></a>
            <button className="sr" type="submit">Buscar</button>
            <kbd className="atajo" id="q-atajo" title="Atajo de teclado"><span className="sr">Atajo: </span>/</kbd>
          </form>
        </div>
        <div className="cat-cuerpo">
          <aside className="panel" id="panel" aria-labelledby="t-filtros">
            <div className="panel-cabeza">
              <h3 id="t-filtros" tabIndex={-1}>Filtros</h3>
              <a className="limpiar" id="limpiar" href={limpiarHref} hidden={activos ? undefined : true}>Limpiar</a>
            </div>
            <div className="panel-cuerpo" id="panel-cuerpo">
              <div className="grupo">
                <h4 id="g-genero">Género</h4>
                <div className="pildoras" role="group" aria-labelledby="g-genero" data-campo="genero">
                  {generos.map((g) => (
                    <a key={g.id} className="pildora" role="button" href={hrefCatalogo(c, { genero: toggleValor(c.genero, g.id) })} data-campo="genero" data-v={g.id} aria-pressed={c.genero.includes(g.id)}>
                      <span>{g.nombre}</span> <small>{g.n}</small>
                    </a>
                  ))}
                </div>
              </div>
              <div className="grupo">
                <h4 id="g-editorial">Editorial</h4>
                <div className="pildoras" role="group" aria-labelledby="g-editorial" data-campo="editorial">
                  {editoriales.map((e) => (
                    <a key={e.nombre} className="pildora" role="button" href={hrefCatalogo(c, { editorial: toggleValor(c.editorial, e.nombre) })} data-campo="editorial" data-v={e.nombre} aria-pressed={c.editorial.includes(e.nombre)}>
                      <span>{e.rotulo}</span> <small>{e.n}</small>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          <div className="resultados-col">
            <div className="barra-res">
              <button type="button" className="boton-filtros" id="abrir-filtros" aria-haspopup="dialog">
                <Icon id="i-embudo" />Filtros
                <span className="insignia" id="n-activos" hidden={activos ? undefined : true} aria-label={activos === 1 ? '1 activo' : `${activos} activos`}>{activos || ''}</span>
              </button>
              <p className="conteo" id="conteo" role="status" aria-live="polite">{cuentaLibros(n)}</p>
              <label className="orden">
                <span>Ordenar</span>
                <select id="orden" name="orden" form="busqueda" defaultValue={c.orden}>
                  <option value="portada">Con portada primero</option>
                  <option value="titulo">Título (A–Z)</option>
                  <option value="autor">Autor (A–Z)</option>
                  <option value="precio-asc">Precio (menor a mayor)</option>
                  <option value="precio-desc">Precio (mayor a menor)</option>
                </select>
              </label>
              <noscript><button type="submit" form="busqueda" className="boton boton--borde">Aplicar</button></noscript>
              <div className="vistas" role="group" aria-label="Vista de resultados">
                <a id="vista-rejilla" role="button" href={hrefCatalogo(c, { vista: 'rejilla' })} aria-pressed={c.vista === 'rejilla'} aria-label="Vista de cuadrícula"><Icon id="i-rejilla" /></a>
                <a id="vista-lista" role="button" href={hrefCatalogo(c, { vista: 'lista' })} aria-pressed={c.vista === 'lista'} aria-label="Vista de lista"><Icon id="i-lista" /></a>
              </div>
            </div>
            <ul className="aplicados" id="aplicados" aria-label="Filtros aplicados" hidden={chips.length ? undefined : true}>
              {chips.map((chip) => (
                <li key={chip.campo + chip.valor}>
                  <a href={hrefCatalogo(c, chip.campo === 'genero' ? { genero: toggleValor(c.genero, chip.valor) } : { editorial: toggleValor(c.editorial, chip.valor) })} data-campo={chip.campo} data-v={chip.valor} aria-label={`Quitar filtro ${chip.rotulo}`}>
                    {chip.rotulo}<Icon id="i-cerrar" />
                  </a>
                </li>
              ))}
              {chips.length ? <li><a className="quitar-todo" href={sinFiltros}>Quitar filtros</a></li> : null}
            </ul>
            <div id="resultados" tabIndex={-1}>
              <h3 className="sr">Resultados</h3>
              <ul className={c.vista === 'lista' ? 'rejilla lista' : 'rejilla'} id="rejilla" role="list">
                {ordenados.map((l) => <LibroItem key={l.id} l={l} c={c} visible={visibles.has(l.id)} />)}
              </ul>
              <div className="vacio-cat" id="vacio" hidden={n > 0 ? true : undefined}>
                <h3 id="vacio-t">{tituloVacio}</h3>
                <p>Prueba con menos palabras o revisa la ortografía.</p>
                <div className="vacio-acciones">
                  <a className="boton boton--borde" id="vacio-borrar" href={sinBusqueda} hidden={hayQ ? undefined : true}>Borrar búsqueda</a>
                  <a className="boton boton--borde" id="vacio-quitar" href={sinFiltros} hidden={activos ? undefined : true}>Quitar filtros</a>
                </div>
                <p className="vacio-pedir">Si no lo tenemos, te lo podemos pedir. <a href={whatsapp('Hola, busco un libro: ')} target="_blank" rel="noopener noreferrer">Pregúntanos por WhatsApp</a>.</p>
              </div>
              <div className="mas" id="mas" hidden>
                <p className="sr" role="status" id="mas-estado" />
                <button type="button" className="boton boton--borde" id="mas-boton" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <dialog className="hoja-filtros" id="hoja-filtros" aria-labelledby="hf-t">
        <div className="lamina">
          <div className="lamina-cabeza">
            <h3 id="hf-t" tabIndex={-1}>Filtros</h3>
            <a className="limpiar" id="hf-limpiar" href={limpiarHref} hidden={activos ? undefined : true}>Limpiar</a>
            <button type="button" className="cerrar-hf" id="hf-cerrar" aria-label="Cerrar filtros"><Icon id="i-cerrar" /></button>
          </div>
          <div className="lamina-cuerpo" id="hf-cuerpo" />
          <div className="lamina-pie"><button type="button" className="boton boton--tinta" id="hf-ver">Ver {cuentaLibros(n)}</button></div>
        </div>
      </dialog>
    </section>
  );
}

function TarjetaReal({ p }: { p: ProductoTienda }) {
  const msg = `Hola, quiero consultar la disponibilidad de «${p.nombre}»${p.precio != null ? ` (${precioMXN(p.precio)})` : ''}.`;
  return (
    <li className="tarjeta-real">
      {p.foto ? <img src={p.foto.src} alt={p.foto.alt} /> : <div className="hueco-img" aria-hidden="true"><Icon id="camioneta" oculto={false} /></div>}
      <h3><a href={whatsapp(msg)} target="_blank" rel="noopener noreferrer">{p.nombre}</a></h3>
      {p.precio != null ? <p className="precio">{precioMXN(p.precio)}</p> : null}
    </li>
  );
}

export function BloqueTienda({ plan }: { plan: PlanTienda }) {
  return (
    <section id="tienda" className="tienda" data-suelo="papel2" aria-labelledby="t-tienda">
      <div className="envoltura">
        <div className="tienda-cabeza">
          <h2 id="t-tienda">Tienda</h2>
          {plan.sello ? <span className="sello">Próximamente</span> : null}
        </div>
        {plan.linea ? <p className="proximo">{plan.linea}</p> : null}
        <ul className="esqueleto" aria-label="Lo que se subirá a la tienda">
          {plan.huecos.map((h) => h.tarjetas ? (
            <Fragment key={h.id}>{h.tarjetas.map((p) => <TarjetaReal key={p.id} p={p} />)}</Fragment>
          ) : (
            <li className="hueco" key={h.id} data-tipo={h.id}>
              <div className="hueco-img" aria-hidden="true"><Icon id="camioneta" oculto={false} /></div>
              <span className="hueco-cat">{h.nombre}</span>
              <span className="barra-g" aria-hidden="true" />
              <span className="barra-g corta" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Visita() {
  const h = NEGOCIO.horario;
  const fotos = NEGOCIO.fotos.filter((f) => f.permisoRegistrado);
  const contacto: Array<[string, string, string, boolean]> = [
    ['i-msj', 'WhatsApp', whatsapp(), true],
    ['i-tel', `Tel. ${NEGOCIO.telefonoVisible}`, `tel:+${NEGOCIO.telefono}`, false],
    ['i-camara', 'Instagram', NEGOCIO.instagram, true],
    ['i-pagina', 'Facebook', NEGOCIO.facebook, true],
    ['i-correo', NEGOCIO.correo, `mailto:${NEGOCIO.correo}`, false],
    ['i-forma', 'Rentar el espacio', NEGOCIO.renta, true],
  ];
  return (
    <section id="visita" className="visita" data-suelo="menta" aria-labelledby="t-visita">
      <div className="envoltura">
        <div className="visita-reticula">
          <div className="datos">
            <h2 className="h2" id="t-visita">Visita</h2>
            <p className="direccion">{NEGOCIO.direccion}</p>
            <p className="entre">{NEGOCIO.entreCalles}</p>
            {h.confirmado ? (
              <dl className="horario">
                {h.filas.map((f) => (
                  <Fragment key={f.dias}>
                    <dt>{f.dias}</dt>
                    <dd>{f.horas}</dd>
                  </Fragment>
                ))}
              </dl>
            ) : (
              <p className="entre">Confírmalo por WhatsApp antes de venir.</p>
            )}
            <a className="boton boton--tinta" href={NEGOCIO.comoLlegar} target="_blank" rel="noopener noreferrer">Cómo llegar <Icon id="i-sale" /></a>
            <ul className="contacto">
              {contacto.map(([icono, texto, href, externo]) => (
                <li key={texto}>
                  <a href={href} {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    <Icon id={icono} />{texto}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {fotos.map((f) => (
            <figure className="foto" key={f.src}>
              <img src={f.src} srcSet={f.srcset} sizes="(max-width: 900px) 400px, 640px" alt={f.alt} width={f.ancho} height={f.alto} loading="lazy" />
              <figcaption>{f.pie} · Foto: {f.credito}</figcaption>
            </figure>
          ))}
        </div>
        <div className="barra" id="cafe">
          <h3>En la barra</h3>
          <div className="carta">
            {CARTA.map((cat) => (
              <div key={cat.id}>
                <h4>{cat.nombre}</h4>
                <ul>
                  {cat.productos.map((p) => (
                    <li key={p.id}>
                      <b>{p.nombre}</b>
                      {p.precio != null ? <span>{precioMXN(p.precio)}</span> : null}
                      {p.descripcion ? <span className="d">{p.descripcion}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="preguntas">
          {PREGUNTAS.map((q) => (
            <details key={q.id}>
              <summary>{q.pregunta}</summary>
              {q.id === 'libro' ? (
                <p>Búscalo en el <a href="#libros">catálogo</a> y, en su ficha, toca «Consultar disponibilidad por WhatsApp»: se abre WhatsApp con el mensaje ya escrito. Si no lo tenemos, te lo podemos pedir.</p>
              ) : (
                <p>{q.respuesta}</p>
              )}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pie() {
  const creditos = [...new Set(NEGOCIO.fotos.filter((f) => f.permisoRegistrado).map((f) => f.credito))];
  return (
    <footer className="pie-pagina">
      <div className="envoltura">
        <strong>Librería Itinerante y Más</strong>
        <span>© 2026{creditos.length ? ` · Fotos: ${creditos.join(', ')}` : ''}. Portadas: sus editoriales.</span>
      </div>
    </footer>
  );
}

export function jsonLd() {
  const p = NEGOCIO.postal;
  return {
    '@context': 'https://schema.org',
    '@type': 'BookStore',
    name: NEGOCIO.nombre,
    url: 'https://itinerante.vercel.app/',
    image: 'https://itinerante.vercel.app/assets/img/compartir.jpg',
    telephone: `+${NEGOCIO.telefono}`,
    email: NEGOCIO.correo,
    address: { '@type': 'PostalAddress', streetAddress: p.calle, addressLocality: p.ciudad, addressRegion: p.estado, addressCountry: p.pais },
    sameAs: [NEGOCIO.instagram, NEGOCIO.facebook],
    ...(NEGOCIO.horario.confirmado ? { openingHours: NEGOCIO.horario.openingHours } : {}),
  };
}

function datosCliente() {
  return LIBROS.map((l) => ({
    id: l.id,
    t: l.titulo,
    a: l.autor,
    p: l.editorial,
    gn: l.genero,
    isbn: l.isbn,
    pr: l.precio,
    s: l.sinopsis,
    c: l.portada?.src ?? null,
    i: l.ordenPortada,
    g: l.colecciones,
  }));
}

export function Pagina({ css, js, consulta = CONSULTA_VACIA }: { css: string; js: string; consulta?: Consulta }) {
  const c = consulta;
  const libro = c.libro ? LIBROS.find((l) => l.id === c.libro) ?? null : null;
  const hrefLibros = DESTACADOS.length ? '#destacados' : '#libros';
  const plan = planTienda();
  return (
    <html lang="es-MX">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{NEGOCIO.nombre}</title>
        <meta name="description" content={NEGOCIO.linea} />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="https://itinerante.vercel.app/" />
        <meta name="theme-color" content="#5dc4b4" />
        <meta property="og:title" content={NEGOCIO.nombre} />
        <meta property="og:description" content={NEGOCIO.linea} />
        <meta property="og:image" content="https://itinerante.vercel.app/assets/img/compartir.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/Logo.png" />
        <link rel="preload" href="/assets/frente/fuentes/BarlowCondensed-700.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/assets/frente/fuentes/Barlow-400.woff2" as="font" type="font/woff2" crossOrigin="" />
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, '\\u003c') }} />
      </head>
      <body>
        <a className="saltar" href="#contenido">Ir al contenido</a>
        <Sprite />
        <Cabecera hrefLibros={hrefLibros} />
        <main id="contenido" tabIndex={-1}>
          <Portada />
          <Eventos />
          <Destacados />
          <Catalogo c={c} />
          <BloqueTienda plan={plan} />
          <Visita />
        </main>
        <Pie />
        <div className={libro ? 'velo abierto' : 'velo'} id="velo" />
        <div className={libro ? 'hoja abierta' : 'hoja'} id="hoja" role="dialog" aria-modal="true" aria-labelledby="hoja-t" hidden={libro ? undefined : true} data-id={libro?.id}>
          <a className="cerrar" id="hoja-cerrar" href={hrefCatalogo(c, { libro: null }).replace('#libros', '') || '/nuevo'} aria-label="Cerrar ficha"><Icon id="i-cerrar" /></a>
          <div id="hoja-cuerpo">{libro ? <CuerpoFicha l={libro} /> : <h2 id="hoja-t" className="sr">Ficha</h2>}</div>
        </div>
        <script id="datos-libros" type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosCliente()).replace(/</g, '\\u003c') }} />
        <script dangerouslySetInnerHTML={{ __html: js }} />
      </body>
    </html>
  );
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'fecha-hasta': { d: string; children?: ReactNode };
      'fecha-desde': { d: string; children?: ReactNode };
    }
  }
}

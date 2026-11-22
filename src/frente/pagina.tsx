/** @jsxRuntime automatic */
/** @jsxImportSource react */
// Landing nueva (SPEC v2): React 19 renderizado a HTML estático en el build (scripts/build-nuevo.mjs). El navegador no descarga React:
// lo poco interactivo (buscador, ficha, scroll-spy, fechas) va en src/frente/cliente.js. Todo el contenido se lee sin JavaScript.
import {
  CARTA,
  FECHADOS,
  LIBROS,
  NEGOCIO,
  NOMBRE_TIENDA,
  NOVEDADES,
  PREGUNTAS,
  RECURRENTES,
  editorialesConFiltro,
  fechaCorta,
  precioMXN,
  tiposDeTienda,
  ultimoDiaConEventos,
  whatsapp,
  type Libro,
} from './datos';
import { diaSiguiente } from './fechas';
import type { ReactNode } from 'react';

export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function idEditorial(nombre: string): string {
  return normalizar(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function Hasta({ d, children }: { d: string; children: ReactNode }) {
  return <fecha-hasta d={d}>{children}</fecha-hasta>;
}
function Desde({ d, children }: { d: string; children: ReactNode }) {
  return <fecha-desde d={d}>{children}</fecha-desde>;
}

/** Contenido que depende de si queda un evento fechado vigente (S-18): `con` hasta el último día, `sin` desde el día siguiente. */
function SegunEventos({ con, sin }: { con: ReactNode; sin: ReactNode }) {
  const ultimo = ultimoDiaConEventos();
  if (!ultimo) return <>{sin}</>;
  return (
    <>
      <Hasta d={ultimo}>{con}</Hasta>
      <Desde d={diaSiguiente(ultimo)}>{sin}</Desde>
    </>
  );
}

const IG = 'Instagram';

function mensajeLibro(l: Libro): string {
  return `Hola, ¿tienen disponible «${l.titulo}»${l.autor ? ` de ${l.autor}` : ''}${l.precio != null ? ` (${precioMXN(l.precio)})` : ''}?`;
}

function Atributos({ l }: { l: Libro }) {
  const filas: Array<[string, string | number | null]> = [
    ['Autor', l.autor],
    ['Editorial', l.editorial],
    ['Género', l.genero],
    ['Páginas', l.paginas],
    ['Año', l.anio],
  ];
  const visibles = filas.filter(([, v]) => v != null && v !== '');
  if (!visibles.length) return null;
  return (
    <dl className="atributos">
      {visibles.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function TarjetaLibro({ l, i }: { l: Libro; i: number }) {
  return (
    <li
      className="libro"
      id={`libro-${l.id}`}
      data-ed={l.editorial ? idEditorial(l.editorial) : undefined}
      data-busca={normalizar([l.titulo, l.autor, l.editorial, l.genero].filter(Boolean).join(' '))}
      data-wa={whatsapp(mensajeLibro(l))}
    >
      <div className="libro-portada">
        {l.portada ? (
          <img src={l.portada.src} width={l.portada.ancho} height={l.portada.alto} alt="" loading={i < 4 ? 'eager' : 'lazy'} decoding="async" />
        ) : (
          <div className="portada-tipografica" aria-hidden="true">
            <span>{l.titulo}</span>
          </div>
        )}
      </div>
      <div className="libro-cuerpo">
        <h3 className="libro-t">
          <a className="libro-enlace" href={`#libro-${l.id}`}>
            {l.titulo}
          </a>
        </h3>
        {l.precio != null ? <p className="libro-precio">{precioMXN(l.precio)}</p> : null}
        <Atributos l={l} />
        {l.sinopsis ? <p className="libro-sinopsis">{l.sinopsis}</p> : null}
      </div>
    </li>
  );
}

function Cabecera() {
  return (
    <header className="cabecera">
      <div className="cabecera-in">
        <a className="marca" href="#portada" aria-label={`${NEGOCIO.nombre}, inicio`}>
          <img src="/assets/img/logo-96.webp" width={96} height={96} alt="" />
          <span className="marca-nombre" aria-hidden="true">
            {NEGOCIO.nombre}
          </span>
        </a>
        <nav aria-label="Secciones">
          <ul className="menu">
            {FECHADOS.length || RECURRENTES.length ? (
              <li>
                <a href="#eventos">
                  <SegunEventos con="Eventos" sin="Actividades" />
                </a>
              </li>
            ) : null}
            {NOVEDADES.length ? (
              <li>
                <a href="#novedades">Novedades</a>
              </li>
            ) : null}
            <li>
              <a href="#tienda">{NOMBRE_TIENDA}</a>
            </li>
            <li>
              <a href="#visita">Visita</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function Portada() {
  return (
    <section id="portada" className="portada" aria-labelledby="portada-t">
      <h1 id="portada-t">{NEGOCIO.nombre}</h1>
      <p className="portada-linea">{NEGOCIO.linea}</p>
      <p className="acciones">
        <SegunEventos
          con={
            <a className="boton boton-primario" href="#eventos">
              Ver eventos
            </a>
          }
          sin={
            <a className="boton boton-primario" href="#tienda">
              Ver libros
            </a>
          }
        />
      </p>
    </section>
  );
}

function Eventos() {
  if (!FECHADOS.length && !RECURRENTES.length) return null;
  const seccion = (
    <section id="eventos" className="seccion" aria-labelledby="eventos-t">
      <span id="cartelera" className="ancla-vieja" />
      <h2 id="eventos-t" className="h2">
        <SegunEventos con="Eventos" sin="Actividades" />
      </h2>
      {FECHADOS.map((e) => {
        const f = fechaCorta(e.fecha);
        return (
          <Hasta key={e.id} d={e.fecha}>
            <article className="evento-destacado" aria-labelledby={`ev-${e.id}`}>
              <p className="fecha-bloque" aria-hidden="true">
                <span>{f.dia}</span>
                <b>{f.numero}</b>
                <span>{f.mes}</span>
              </p>
              <div className="evento-cuerpo">
                <h3 id={`ev-${e.id}`}>{e.titulo}</h3>
                <ul className="evento-datos">
                  <li>
                    <time dateTime={e.fecha}>{f.larga}</time>
                  </li>
                  <li>{e.hora ?? 'Hora por anunciar'}</li>
                  <li>En la librería</li>
                </ul>
                {e.descripcion ? <p>{e.descripcion}</p> : null}
                <p className="acciones">
                  <a className="boton boton-primario" href={e.fuente} target="_blank" rel="noopener noreferrer">
                    Ver anuncio en {IG}
                  </a>
                </p>
              </div>
            </article>
          </Hasta>
        );
      })}
      {RECURRENTES.map((r) => (
        <article key={r.id} className="evento-recurrente" aria-labelledby={`ev-${r.id}`}>
          <p className="insignia">Recurrente</p>
          <h3 id={`ev-${r.id}`}>{r.titulo}</h3>
          <dl className="atributos">
            {(
              [
                ['Cuándo', r.cuando],
                ['Horario', r.horario],
                ['Costo', r.costo],
                ['Incluye', r.incluye],
              ] as Array<[string, string | null]>
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
          <p className="acciones">
            <a className="boton boton-secundario" href={r.fuente} target="_blank" rel="noopener noreferrer">
              Ver publicación en {IG}
            </a>
          </p>
        </article>
      ))}
    </section>
  );
  if (RECURRENTES.length) return seccion;
  const ultimo = ultimoDiaConEventos();
  return ultimo ? <Hasta d={ultimo}>{seccion}</Hasta> : null;
}

function Novedades() {
  if (!NOVEDADES.length) return null;
  return (
    <section id="novedades" className="seccion" aria-labelledby="novedades-t">
      <h2 id="novedades-t" className="h2">
        Novedades
      </h2>
      <ul className="rejilla">
        {NOVEDADES.slice(0, 8).map((l, i) => (
          <TarjetaLibro key={l.id} l={l} i={i} />
        ))}
      </ul>
    </section>
  );
}

function Tienda() {
  const editoriales = editorialesConFiltro();
  const tipos = tiposDeTienda();
  return (
    <section id="tienda" className="seccion tienda" aria-labelledby="tienda-t">
      <span id="libros" className="ancla-vieja" />
      <span id="catalogo" className="ancla-vieja" />
      <h2 id="tienda-t" className="h2">
        {NOMBRE_TIENDA}
      </h2>
      <div className="tienda-controles">
        <p className="buscador" hidden>
          <label htmlFor="buscar">Buscar</label>
          <input id="buscar" type="search" placeholder="Título, autor o editorial" autoComplete="off" />
        </p>
        {tipos.length >= 2 ? (
          <fieldset className="filtros">
            <legend>Tipo</legend>
            <label>
              <input type="radio" name="tipo" value="" defaultChecked /> Todo
            </label>
            {tipos.map((t) => (
              <label key={t.id}>
                <input type="radio" name="tipo" value={t.id} /> {t.nombre}
              </label>
            ))}
          </fieldset>
        ) : null}
        {editoriales.length >= 2 ? (
          <fieldset className="filtros">
            <legend>Editorial</legend>
            <label>
              <input type="radio" name="editorial" value="" defaultChecked /> Todas
            </label>
            {editoriales.map((e) => (
              <label key={e.nombre}>
                <input type="radio" name="editorial" value={idEditorial(e.nombre)} /> {e.nombre}
              </label>
            ))}
          </fieldset>
        ) : null}
        <p className="cuenta" role="status">
          {LIBROS.length} libros
        </p>
      </div>
      <ul className="rejilla">
        {LIBROS.map((l, i) => (
          <TarjetaLibro key={l.id} l={l} i={i} />
        ))}
      </ul>
      <div className="vacio" hidden>
        <p>Ningún libro coincide con la búsqueda.</p>
        <button type="button" className="boton boton-secundario" data-limpiar>
          Limpiar búsqueda
        </button>
      </div>
      <dialog id="ficha" className="ficha" aria-labelledby="ficha-t">
        <div className="ficha-in">
          <button type="button" className="boton boton-secundario ficha-cerrar" data-cerrar>
            Cerrar
          </button>
          <div className="ficha-portada" />
          <div className="ficha-texto">
            <h3 id="ficha-t" />
            <p className="libro-precio" />
            <div className="ficha-atributos" />
            <p className="ficha-sinopsis" />
            <p className="acciones">
              <a className="boton boton-primario" data-wa href={whatsapp()} target="_blank" rel="noopener noreferrer">
                Consultar disponibilidad por WhatsApp
              </a>
            </p>
          </div>
        </div>
      </dialog>
    </section>
  );
}

function Visita() {
  const h = NEGOCIO.horario;
  return (
    <section id="visita" className="seccion" aria-labelledby="visita-t">
      <h2 id="visita-t" className="h2">
        Visita
      </h2>
      <div className="visita-rejilla">
        <div className="visita-datos">
          <address>
            {NEGOCIO.direccion}
            <br />
            <span className="secundario">{NEGOCIO.entreCalles}</span>
          </address>
          {h.confirmado ? (
            <table className="horario" id="horario">
              <caption>Horario</caption>
              <tbody>
                {h.filas.map((f) => (
                  <tr key={f.dias}>
                    <th scope="row">{f.dias}</th>
                    <td>{f.horas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="nota-horario" id="horario">
              Confírmalo por WhatsApp antes de venir.
            </p>
          )}
          <p className="acciones">
            <a className="boton boton-primario" href={NEGOCIO.comoLlegar} target="_blank" rel="noopener noreferrer">
              Cómo llegar
            </a>
            <a className="boton boton-secundario" href={whatsapp('Hola, quiero confirmar el horario antes de ir a la librería.')} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </p>
          <p>
            Tel. <a href={`tel:+${NEGOCIO.telefono}`}>{NEGOCIO.telefonoVisible}</a>
          </p>
          <h3 className="h3" id="contacto">
            Contacto
          </h3>
          <ul className="contacto">
            <li>
              <a href={NEGOCIO.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href={NEGOCIO.facebook} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </li>
            <li>
              <a href={`mailto:${NEGOCIO.correo}`}>{NEGOCIO.correo}</a>
            </li>
          </ul>
        </div>
        <div className="barra" id="cafe" aria-labelledby="barra-t" role="region">
          <h3 className="h3" id="barra-t">
            En la barra
          </h3>
          {CARTA.map((c) => (
            <details key={c.id} className="barra-grupo" open>
              <summary>{c.nombre}</summary>
              <ul>
                {c.productos.map((p) => (
                  <li key={p.id}>
                    <span className="barra-nombre">
                      {p.nombre}
                      {p.descripcion ? <span className="secundario"> {p.descripcion}</span> : null}
                    </span>
                    {p.precio != null ? <span className="barra-precio">{precioMXN(p.precio)}</span> : null}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>
      {NEGOCIO.fotos.length ? (
        <ul className="fotos">
          {NEGOCIO.fotos.slice(0, 3).map((f) => (
            <li key={f.src}>
              <figure>
                <img src={f.src} srcSet={f.srcset} sizes="(max-width: 767px) 100vw, 50vw" width={f.ancho} height={f.alto} alt="" loading="lazy" decoding="async" />
                <figcaption>
                  {f.pie} <span className="secundario">Foto: {f.credito}.</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      ) : null}
      <h3 className="h3">Preguntas</h3>
      <div className="preguntas">
        {PREGUNTAS.map((q) => (
          <details key={q.id}>
            <summary>{q.pregunta}</summary>
            <p>{q.respuesta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Pie() {
  const creditos = [...new Set(NEGOCIO.fotos.map((f) => f.credito))];
  return (
    <footer className="pie">
      <p>
        {NEGOCIO.nombre} · © {new Date().getFullYear()}
        {creditos.length ? ` · Fotos: ${creditos.join(', ')}` : ''}
      </p>
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

export function Pagina({ css, js }: { css: string; js: string }) {
  return (
    <html lang="es" data-astryx-theme="itinerante" data-theme="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{NEGOCIO.nombre}</title>
        <meta name="description" content={NEGOCIO.linea} />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="https://itinerante.vercel.app/" />
        <meta name="theme-color" content="#f5f0e7" />
        <meta property="og:title" content={NEGOCIO.nombre} />
        <meta property="og:description" content={NEGOCIO.linea} />
        <meta property="og:image" content="https://itinerante.vercel.app/assets/img/compartir.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/Logo.png" />
        <link rel="preload" href="/assets/fonts/inter-latin-opsz-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, '\\u003c') }} />
      </head>
      <body>
        <a className="saltar" href="#contenido">
          Saltar al contenido
        </a>
        <Cabecera />
        <main id="contenido">
          <Portada />
          <Eventos />
          <Novedades />
          <Tienda />
          <Visita />
        </main>
        <Pie />
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

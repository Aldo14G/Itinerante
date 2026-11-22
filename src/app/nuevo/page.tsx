// Página del frente nuevo: Server Component generado en el build (SSG). Todo el contenido (41 títulos, carta de 21 productos, textos)
// sale en el HTML; solo la barra, el carrusel, el catálogo, la barra de la carta, el aviso fechado y las preguntas son componentes de cliente.
import {
  CARTA,
  COLECCIONES,
  EVENTOS,
  GENEROS_REJILLA,
  LIBROS,
  MERCH,
  NEGOCIO,
  NOVEDADES,
  PREGUNTAS,
  RECURRENTES,
  editorialesDeLaFranja,
  eventosFechados,
  fechaLarga,
  filasDeCarta,
  precioMXN,
  recomendadosPorColeccion,
  whatsapp,
} from '../../frente/datos';
import { Cabecera, type Destino } from './componentes/Cabecera';
import { Estante, type LibroEstante } from './componentes/Estante';
import { Catalogo } from './componentes/Catalogo';
import { CartaNav } from './componentes/CartaNav';
import { Faq } from './componentes/Faq';
import { SoloHasta } from './componentes/SoloHasta';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';

// Estática con regeneración cada hora (ISR): un evento pasado sale también del HTML del servidor, no solo en el navegador (SoloHasta).
export const revalidate = 3600;

const CASA = [
  { src: '/assets/img/01-entrada-pasillo-800.webp', set: '/assets/img/01-entrada-pasillo-800.webp 800w, /assets/img/01-entrada-pasillo.webp 1212w', w: 1212, h: 682, alt: 'Libros a ambos lados: una mesa y estantes bajos a la izquierda, un librero alto a la derecha y cuadros en los muros; al fondo, una puerta abierta', t: 'El pasillo', d: 'Los libros empiezan aquí, antes de llegar a la sala.' },
  { src: '/assets/img/oficial-rincon-800.webp', set: '/assets/img/oficial-rincon-800.webp 800w, /assets/img/oficial-rincon-1600.webp 1600w', w: 1600, h: 1200, alt: 'Muro de piedra con una foto en blanco y negro de una camioneta cargada y una estrella; a los lados, libreros de madera y un banco tapizado', t: 'El rincón de lectura', d: 'Lee las primeras páginas aquí antes de decidirte.' },
  { src: '/assets/img/04-experiencia-libreros-800.webp', set: '/assets/img/04-experiencia-libreros-800.webp 800w, /assets/img/04-experiencia-libreros.webp 1080w', w: 1080, h: 608, alt: 'Libreros de piso a techo llenos de libros junto a una ventana y una mesa con sillas turquesa', t: 'Los libreros', d: 'Recorre los lomos; si no alcanzas uno, pide ayuda.' },
  { src: '/assets/img/casa-globo-800.webp', set: '/assets/img/casa-globo-800.webp 800w, /assets/img/casa-globo.webp 1080w', w: 1080, h: 810, alt: 'Globo terráqueo antiguo junto a un librero, con luz de sol sobre la pared de madera', t: 'El globo terráqueo', d: null },
  { src: '/assets/img/05-talleres-ajedrez-800.webp', set: '/assets/img/05-talleres-ajedrez-800.webp 800w, /assets/img/05-talleres-ajedrez.webp 1080w', w: 1080, h: 608, alt: 'Tablero de ajedrez con piezas sobre un mantel rojo, entre dos sillas, junto a un muro descascarado', t: 'Ajedrez', d: null },
  { src: '/assets/img/06-comunidad-sonido-800.webp', set: '/assets/img/06-comunidad-sonido-800.webp 800w, /assets/img/06-comunidad-sonido.webp 1080w', w: 1080, h: 608, alt: 'Gong grande en primer plano y libreros llenos de libros al fondo', t: 'La sala del gong', d: null },
];

function aEstante(l: (typeof LIBROS)[number]): LibroEstante {
  return { id: l.id, titulo: l.titulo, autor: l.autor, precio: l.precio, portada: l.portada };
}

export default function Pagina() {
  const hayNovedades = NOVEDADES.length > 0;
  // Novedades no se renderiza sin libros nuevos reales (SPEC v1.3): ni sección, ni enlace del nav, ni CTA del hero.
  const destinos: Destino[] = [
    { id: 'inicio', etiqueta: 'Inicio' },
    ...(hayNovedades ? [{ id: 'novedades', etiqueta: 'Novedades' }] : []),
    { id: 'libros', etiqueta: 'Catálogo' },
    { id: 'cafe', etiqueta: 'Café' },
    { id: 'cartelera', etiqueta: 'Eventos' },
    { id: 'visita', etiqueta: 'Visita' },
  ];
  const recomendados = recomendadosPorColeccion();
  const estante = Object.fromEntries(
    Object.entries(recomendados).map(([id, r]) => [id, { libros: r.libros.map(aEstante), inicio: r.inicio }]),
  );
  const editoriales = editorialesDeLaFranja();
  const fechados = eventosFechados();
  const productos = CARTA.reduce((n, c) => n + c.productos.length, 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['BookStore', 'CafeOrCoffeeShop'],
    name: NEGOCIO.nombre,
    description: NEGOCIO.promesa,
    address: { '@type': 'PostalAddress', streetAddress: NEGOCIO.direccion, addressLocality: 'Monterrey', addressRegion: 'Nuevo León', addressCountry: 'MX' },
    telephone: `+${NEGOCIO.telefono}`,
    email: NEGOCIO.correo,
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '11:00', closes: '20:00' },
    ],
    sameAs: [NEGOCIO.instagram, NEGOCIO.facebook],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Cabecera destinos={destinos} comoLlegar={NEGOCIO.comoLlegar} />
      <main id="contenido" tabIndex={-1} data-titulos={LIBROS.length} data-productos={productos}>
        {/* Inicio (P1-3): en el primer viewport, qué es, el horario completo y dos caminos. */}
        <section id="inicio" className="hero" aria-labelledby="hero-t">
          <div className="hero-texto">
            <p className="hero-marca">{NEGOCIO.nombre}</p>
            <h1 id="hero-t" className="hero-promesa">{NEGOCIO.promesa}</h1>
            <p className="estado">{NEGOCIO.horarioCorto}</p>
            <p className="hero-dir">{NEGOCIO.direccionContacto}</p>
            <div className="acciones">
              <Button label="Cómo llegar" variant="primary" size="lg" href={NEGOCIO.comoLlegar} target="_blank" rel="noopener noreferrer" />
              <Button label="Ver catálogo" variant="secondary" size="lg" href="#catalogo" />
            </div>
          </div>
          <figure className="hero-foto">
            <picture>
              <source media="(max-width: 767px)" srcSet="/assets/img/inicio-sala-3x2-640.webp 640w, /assets/img/inicio-sala-3x2.webp 912w" sizes="100vw" width={912} height={608} />
              <img src="/assets/img/inicio-sala-5x4.webp" width={1080} height={864} alt="La sala central: mesas redondas con sillas turquesa sobre piso ajedrezado, libreros de piso a techo y un ventanal al fondo" fetchPriority="high" decoding="async" />
            </picture>
          </figure>
        </section>

        {/* Franja de editoriales (P1-7): fila quieta, nombres completos, envuelve en móvil. */}
        <section className="franja" aria-labelledby="franja-t">
          <h2 id="franja-t" className="franja-t">Editoriales y espacios con los que compartimos libros y eventos</h2>
          <ul className="franja-lista">
            {editoriales.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>

        {hayNovedades ? (
          <section id="novedades" className="seccion" aria-labelledby="nov-t">
            <h2 id="nov-t" className="h2">Recién llegados</h2>
            <ul className="nov-lista">
              {NOVEDADES.map((l) => (
                <li key={l.id}>
                  <a href={`#libro-${l.id}`}>{l.titulo}</a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* El único carrusel (SPEC v1.3): Recomendados por colección, con las colecciones reales de collections.json / rail.js. */}
        <section id="colecciones" className="seccion" aria-labelledby="col-t">
          <div className="sec-cab">
            <h2 id="col-t" className="h2">Recomendados por colección</h2>
          </div>
          <Estante
            titulo="Recomendados por colección"
            colecciones={COLECCIONES.map((c) => ({ id: c.id, titulo: c.titulo, nota: c.nota }))}
            libros={estante}
            hrefCatalogo="#catalogo"
          />
        </section>

        <section id="casa" className="seccion" aria-labelledby="casa-t">
          <div className="sec-cab">
            <h2 id="casa-t" className="h2">La casa</h2>
            <p className="sec-texto">Es una casa para hojear sin prisa, preguntar en voz alta y salir con el libro que no sabías que buscabas.</p>
          </div>
          <ul className="casa-rejilla">
            {CASA.map((f, i) => (
              <li key={f.src}>
                <figure>
                  <img src={f.src} srcSet={f.set} sizes="(max-width: 767px) 100vw, 33vw" width={f.w} height={f.h} alt={f.alt} loading="lazy" decoding="async" />
                  <figcaption>
                    <strong>{f.t}</strong>
                    {f.d ? <span>{f.d}</span> : null}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <section id="libros" className="seccion" aria-labelledby="cat-t">
          <div className="sec-cab" id="catalogo">
            <h2 id="cat-t" className="h2">Catálogo completo · {LIBROS.length} títulos</h2>
            <p className="sec-texto">Busca por título, autor o editorial, o filtra por género.</p>
          </div>
          <Catalogo
            libros={LIBROS.map((l) => ({ id: l.id, titulo: l.titulo, autor: l.autor, editorial: l.editorial, precio: l.precio, portada: l.portada, generoNombre: l.generoNombre, generoRejilla: l.generoRejilla }))}
            generos={GENEROS_REJILLA.map((g) => ({ id: g.id, nombre: g.nombre }))} telefono={NEGOCIO.telefono} />
        </section>

        <section id="cafe" className="seccion" aria-labelledby="cafe-t">
          <div className="sec-cab">
            <h2 id="cafe-t" className="h2">Café y té</h2>
            <p className="sec-texto">Algo de tomar mientras hojeas. Con tu café, puedes quedarte a leer en la sala.</p>
          </div>
          <CartaNav categorias={CARTA.map((c) => ({ id: c.id, chip: c.chip }))} />
          <div className="carta">
            {CARTA.map((c) => (
              <section key={c.id} id={`carta-${c.id}`} className="carta-grupo" aria-labelledby={`carta-${c.id}-t`}>
                <h3 id={`carta-${c.id}-t`} className="h3">{c.nombre}</h3>
                {c.nota ? <p className="carta-nota">{c.nota}</p> : null}
                <ul className="carta-lista">
                  {filasDeCarta(c).map((f) =>
                    f.tipo === 'producto' ? (
                      <li key={f.producto.id} id={f.producto.id} className="carta-fila" data-producto>
                        <span className="carta-n">
                          {f.producto.nombre}
                          {f.producto.descripcion ? <span className="carta-d">{f.producto.descripcion}</span> : null}
                        </span>
                        <span className="carta-p">{f.producto.precio != null ? precioMXN(f.producto.precio) : 'Precio en barra'}</span>
                      </li>
                    ) : (
                      <li key={f.id} id={f.id} className="carta-fila">
                        <span className="carta-n">
                          {f.nombre}
                          <span className="carta-d">
                            {f.productos.map((p, i) => (
                              <span key={p.id} id={p.id} data-producto>
                                {i ? ', ' : ''}
                                {i ? p.nombre.toLowerCase() : p.nombre}
                              </span>
                            ))}
                          </span>
                        </span>
                        <span className="carta-p">Precio en barra</span>
                      </li>
                    ),
                  )}
                </ul>
              </section>
            ))}
          </div>
          {MERCH.length ? (
            <ul className="merch" aria-label="Para llevar">
              {MERCH.map((m) => (
                <li key={m.id}>{m.nombre}</li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* Eventos (P1-12): sin fecha real, una sola línea; tarjeta solo con fecha real. */}
        <section id="cartelera" className="seccion seccion--corta" aria-labelledby="ev-t">
          <h2 id="ev-t" className="h2">Eventos y talleres</h2>
          {fechados.length ? (
            <ul className="ev-lista" aria-label="Próximos eventos">
              {fechados.map((e) => (
                <SoloHasta key={e.id} fecha={e.fecha}>
                  <li className="ev-tarjeta" id={`ev-${e.id}`}>
                    <h3 className="h3">{e.titulo}</h3>
                    <p className="ev-cuando">
                      <time dateTime={e.fecha}>{fechaLarga(e.fecha)}</time> · {e.hora ?? 'Hora por anunciar'}
                    </p>
                    <p className="ev-lugar">{e.lugar}</p>
                    <p className="ev-desc">{e.descripcion}</p>
                    <a className="enlace-fuerte" href={e.fuente} target="_blank" rel="noopener noreferrer">
                      Ver anuncio en Instagram <span aria-hidden="true">↗</span>
                      <span className="sr">(se abre en otra pestaña)</span>
                    </a>
                  </li>
                </SoloHasta>
              ))}
            </ul>
          ) : null}
          {RECURRENTES.length ? (
            <ul className="ev-recurrentes" aria-label="Actividades de cada temporada">
              {RECURRENTES.map((r) => (
                <li key={r.id} id={`ev-${r.id}`}>
                  <Badge variant="neutral" label="Recurrente" />
                  <strong>{r.titulo}</strong> · {r.cuando}
                  {r.costo ? ` · ${r.costo}` : ''}.{' '}
                  <a href={r.fuente} target="_blank" rel="noopener noreferrer">
                    Ver publicación <span aria-hidden="true">↗</span>
                    <span className="sr">(se abre en otra pestaña)</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {/* Propuestas de la casa sin fecha (eventos.json): una sola línea, nunca tarjetas ni «Fecha por confirmar» (P1-12). */}
          <p className="ev-linea">
            {EVENTOS.filter((e) => !e.fecha).map((e) => e.titulo).join(', ').replace(/, ([^,]*)$/, ' y $1')} en la casa.{' '}
            <a className="enlace-fuerte" href={NEGOCIO.instagram} target="_blank" rel="noopener noreferrer">
              Fechas en Instagram <span aria-hidden="true">↗</span>
              <span className="sr">(se abre en otra pestaña)</span>
            </a>
          </p>
        </section>

        <section id="visita" className="seccion" aria-labelledby="visita-t">
          <div className="sec-cab">
            <h2 id="visita-t" className="h2">Visita</h2>
            <p className="sec-texto">Los libros se eligen mejor en persona.</p>
          </div>
          <div className="visita">
            <div className="visita-datos">
              <address>
                {NEGOCIO.direccionContacto}
                <br />
                <span className="sec-texto">{NEGOCIO.entreCalles}</span>
                <br />
                Tel. <a href={`tel:+${NEGOCIO.telefono}`}>{NEGOCIO.telefonoVisible}</a>
              </address>
              <table className="horario" id="horario">
                <caption>Horario habitual</caption>
                <tbody>
                  <tr><th scope="row">Lunes a sábado</th><td>11:00–20:00</td></tr>
                  <tr><th scope="row">Domingo</th><td>Cerrado</td></tr>
                </tbody>
              </table>
              <div className="acciones">
                <Button label="Cómo llegar" variant="primary" size="lg" href={NEGOCIO.comoLlegar} target="_blank" rel="noopener noreferrer" />
              </div>
            </div>
            <div className="visita-faq">
              <h3 id="faq-t" className="h3">Preguntas frecuentes</h3>
              <Faq preguntas={PREGUNTAS} />
            </div>
          </div>
        </section>
      </main>
      <footer className="pie" id="contacto" aria-labelledby="pie-t">
        <h2 id="pie-t" className="h3">Contacto</h2>
        <p>Escríbenos para preguntar por un libro, la carta o la próxima fecha de un taller.</p>
        <ul className="pie-enlaces">
          <li><a href={whatsapp('Hola, quiero preguntar por un libro.')} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
          <li><a href={NEGOCIO.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
          <li><a href={NEGOCIO.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></li>
          <li><a href={`mailto:${NEGOCIO.correo}`}>Correo</a></li>
          <li><a href={`tel:+${NEGOCIO.telefono}`}>Tel. {NEGOCIO.telefonoVisible}</a></li>
        </ul>
        <p className="pie-dir">{NEGOCIO.direccionContacto}</p>
        <p className="pie-nota">
          Vista previa del sitio nuevo. La versión actual sigue en <a href="/">la página principal</a>.
        </p>
      </footer>
    </>
  );
}

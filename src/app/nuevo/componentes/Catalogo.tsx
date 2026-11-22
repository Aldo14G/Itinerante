'use client';
// Catálogo completo (SPEC §3): rejilla visible con los 41 títulos en el HTML del servidor; búsqueda real y el género como filtro arriba (SPEC v1.3: las colecciones ya no son filtro).
// Cada tarjeta tiene una sola acción («Ver libro») que abre la ficha en un Dialog; #libro-<id> también la abre (enlace directo y carrusel).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { TextInput } from '@astryxdesign/core/TextInput';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import type { Libro } from '../../../frente/datos';

/** Lo que la rejilla necesita en el navegador. La sinopsis, el ISBN y las páginas se piden al abrir la ficha (catalog.json, ya público y en
 *  caché), para no repetir los 41 textos en el HTML inicial. */
export type LibroRejilla = Pick<Libro, 'id' | 'titulo' | 'autor' | 'editorial' | 'precio' | 'portada' | 'generoNombre' | 'generoRejilla'>;
type Detalle = { sinopsis: string | null; isbn: string | null; paginas: number | null };

let detalles: Promise<Map<string, Detalle>> | null = null;
function cargarDetalles() {
  detalles ??= fetch('/assets/data/catalog.json')
    .then((r) => r.json())
    .then((c: { books: Array<{ id: string; s?: string | null; n?: string | null; pg?: number | null }> }) =>
      new Map(c.books.map((b) => [b.id, { sinopsis: b.s ?? null, isbn: b.n ?? null, paginas: b.pg ?? null }])),
    )
    .catch(() => {
      detalles = null;
      return new Map();
    });
  return detalles;
}

type Props = {
  libros: LibroRejilla[];
  generos: Array<{ id: string; nombre: string }>;
  telefono: string;
};

const TODAS = 'todas';

export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function precio(l: LibroRejilla) {
  return l.precio != null ? `$${l.precio} MXN` : 'Precio en la librería';
}

function wa(telefono: string, texto: string) {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`;
}

function Portada({ libro, perezosa }: { libro: LibroRejilla; perezosa: boolean }) {
  if (libro.portada) {
    return (
      <img
        className="cat-portada"
        src={libro.portada.src}
        width={libro.portada.ancho}
        height={libro.portada.alto}
        alt=""
        loading={perezosa ? 'lazy' : 'eager'}
        decoding="async"
      />
    );
  }
  // Sin portada en los datos: tapa tipográfica (no es un placeholder de carga, es la tapa de ese libro en el sitio).
  return (
    <span className="cat-portada cat-portada--tipo" aria-hidden="true">
      <span className="cat-portada-t">{libro.titulo}</span>
      {libro.autor ? <span className="cat-portada-a">{libro.autor}</span> : null}
    </span>
  );
}

export function Catalogo({ libros, generos, telefono }: Props) {
  const [q, setQ] = useState('');
  const [gen, setGen] = useState(TODAS);
  const [abierto, setAbierto] = useState<LibroRejilla | null>(null);
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [estrecho, setEstrecho] = useState(false);

  const visibles = useMemo(() => {
    const nq = normalizar(q);
    return libros.filter((l) => {
      if (gen !== TODAS && l.generoRejilla !== gen) return false;
      if (!nq) return true;
      return normalizar([l.titulo, l.autor ?? '', l.editorial ?? '', l.generoNombre ?? ''].join(' ')).includes(nq);
    });
  }, [libros, q, gen]);

  useEffect(() => {
    setDetalle(null);
    if (!abierto) return;
    let vivo = true;
    cargarDetalles().then((m) => vivo && setDetalle(m.get(abierto.id) ?? null));
    return () => {
      vivo = false;
    };
  }, [abierto]);

  const abrirPorHash = useCallback(() => {
    const m = /^#libro-(.+)$/.exec(location.hash);
    const l = m ? libros.find((x) => x.id === decodeURIComponent(m[1])) : null;
    if (l) setAbierto(l);
  }, [libros]);

  useEffect(() => {
    abrirPorHash();
    window.addEventListener('hashchange', abrirPorHash);
    const mq = matchMedia('(max-width: 767px)');
    const leer = () => setEstrecho(mq.matches);
    leer();
    mq.addEventListener('change', leer);
    return () => {
      window.removeEventListener('hashchange', abrirPorHash);
      mq.removeEventListener('change', leer);
    };
  }, [abrirPorHash]);

  function cerrar(abierta: boolean) {
    if (abierta) return;
    const id = abierto?.id;
    setAbierto(null);
    if (location.hash.startsWith('#libro-')) history.replaceState(null, '', location.pathname + location.search);
    // Foco de vuelta a la tarjeta que abrió la ficha.
    if (id) requestAnimationFrame(() => document.querySelector<HTMLElement>(`#libro-${CSS.escape(id)} a, #libro-${CSS.escape(id)} button`)?.focus());
  }

  const limpiar = () => {
    setQ('');
    setGen(TODAS);
  };

  return (
    <div className="cat">
      <div className="cat-controles" role="search">
        <TextInput label="Buscar en el catálogo" placeholder="Título, autor o editorial" value={q} onChange={(v) => setQ(v)} hasClear size="lg" width="100%" />
        <SegmentedControl label="Género" value={gen} onChange={setGen} size="lg">
          <SegmentedControlItem value={TODAS} label="Todos" />
          {generos.map((g) => (
            <SegmentedControlItem key={g.id} value={g.id} label={g.nombre} />
          ))}
        </SegmentedControl>
      </div>
      <p className="cat-cuenta" role="status">
        {visibles.length === libros.length ? `${libros.length} títulos` : `${visibles.length} de ${libros.length} títulos`}
      </p>
      {visibles.length ? (
        <ul className="cat-rejilla" aria-label="Libros del catálogo">
          {visibles.map((l) => (
            <li key={l.id} id={`libro-${l.id}`} className="cat-item">
              <ClickableCard
                label={`Ver libro: ${l.titulo}`}
                href={`#libro-${l.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setAbierto(l);
                }}
                padding={0}
              >
                <span className="cat-tarjeta">
                  <span className="cat-marco">
                    <Portada libro={l} perezosa />
                  </span>
                  <span className="cat-datos">
                    <span className="cat-t">{l.titulo}</span>
                    {l.autor ? <span className="cat-a">{l.autor}</span> : null}
                    <span className="cat-p">{precio(l)}</span>
                    <span className="cat-ver" aria-hidden="true">Ver libro</span>
                  </span>
                </span>
              </ClickableCard>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Sin resultados"
          description="Ningún título coincide con la búsqueda y el género elegidos."
          headingLevel={3}
          actions={<Button label="Limpiar filtros" variant="secondary" onClick={limpiar} />}
        />
      )}
      <div className="cat-cierre">
        <p>¿Buscas otro título? La librería confirma por WhatsApp si lo tiene o si puede pedirlo.</p>
        <Button label="Preguntar por WhatsApp" variant="primary" href={wa(telefono, 'Hola, estoy buscando un libro.')} target="_blank" rel="noopener noreferrer" />
      </div>

      <Dialog
        isOpen={abierto != null}
        onOpenChange={cerrar}
        variant={estrecho ? 'fullscreen' : 'standard'}
        width={estrecho ? undefined : 720}
        purpose="info"
      >
        {abierto ? (
          <div className="ficha">
            <DialogHeader title={abierto.titulo} subtitle={abierto.autor ?? undefined} onOpenChange={cerrar} />
            <div className="ficha-cuerpo">
              <div className="ficha-portada">
                <Portada libro={abierto} perezosa={false} />
              </div>
              <div className="ficha-texto">
                <dl className="ficha-datos">
                  <div><dt>Precio</dt><dd>{precio(abierto)}</dd></div>
                  {abierto.editorial ? <div><dt>Editorial</dt><dd>{abierto.editorial}</dd></div> : null}
                  {abierto.generoNombre ? <div><dt>Género</dt><dd>{abierto.generoNombre}</dd></div> : null}
                  {detalle?.paginas ? <div><dt>Páginas</dt><dd>{detalle.paginas}</dd></div> : null}
                  {detalle?.isbn ? <div><dt>ISBN</dt><dd>{detalle.isbn}</dd></div> : null}
                </dl>
                {detalle?.sinopsis ? <p className="ficha-sinopsis">{detalle.sinopsis}</p> : null}
                <Button
                  label="Consultar disponibilidad"
                  variant="primary"
                  href={wa(telefono, `Hola, ¿tienen «${abierto.titulo}»${abierto.autor ? ` de ${abierto.autor}` : ''}?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              </div>
            </div>
          </div>
        ) : (
          <span />
        )}
      </Dialog>
    </div>
  );
}

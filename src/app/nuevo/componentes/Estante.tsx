'use client';
// El único carrusel de la página (SPEC v1.2 §3). Base de semántica y snap: Carousel de Astryx con useSnapPaging({pages: 'item'})
// (región con nombre, aria-roledescription="carousel", cada libro «Libro N de M»). Encima: coverflow que se aplana con movimiento
// reducido o con el interruptor, arrastre con el mouse, flechas del teclado desde la pista y desde los botones, pie que cambia en el
// mismo gesto, «N de M» y extremos deshabilitados. Sin avance automático.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Carousel } from '@astryxdesign/core/Carousel';
import { useSnapPaging } from '@astryxdesign/core/SnapPaging';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Button } from '@astryxdesign/core/Button';
import { useMovimiento } from './Proveedores';

export type LibroEstante = {
  id: string;
  titulo: string;
  autor: string | null;
  precio: number | null;
  portada: { src: string; ancho: number; alto: number } | null;
};

type Props = {
  titulo: string;
  colecciones: Array<{ id: string; titulo: string; nota: string }>;
  libros: Record<string, { libros: LibroEstante[]; inicio: number }>;
  hrefCatalogo: string;
};

function slidesDe(raiz: HTMLElement | null): HTMLElement[] {
  return raiz ? Array.from(raiz.querySelectorAll<HTMLElement>('[aria-roledescription="slide"]')) : [];
}

export function Estante({ titulo, colecciones, libros, hrefCatalogo }: Props) {
  const [col, setCol] = useState(colecciones[0]?.id ?? '');
  const lista = libros[col]?.libros ?? [];
  const inicio = libros[col]?.inicio ?? 0;
  const [indice, setIndice] = useState(inicio);
  const { reducido } = useMovimiento();
  const snap = useSnapPaging({ pages: 'item' });
  const raiz = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ x: number; izq: number; movido: boolean; id: number } | null>(null);
  // Último índice asentado y ancho de pista con el que se midió: si cambia el ancho (giro, redimensionar), se recoloca el mismo libro
  // al centro en vez de dejar que el recorte del scroll lo mande a otro.
  const anclaje = useRef({ indice: inicio, ancho: 0 });

  const pista = useCallback(() => slidesDe(raiz.current)[0]?.parentElement ?? null, []);

  // Índice = libro más cerca del centro de la pista; se recalcula en cada evento de scroll (el pie cambia en el mismo gesto).
  const medir = useCallback(() => {
    const p = pista();
    if (!p) return;
    const a = anclaje.current;
    if (a.ancho && a.ancho !== p.clientWidth) {
      a.ancho = p.clientWidth;
      const s = slidesDe(raiz.current)[a.indice];
      if (s) p.scrollTo({ left: s.offsetLeft - (p.clientWidth - s.offsetWidth) / 2, behavior: 'auto' });
    }
    a.ancho = p.clientWidth;
    const centro = p.scrollLeft + p.clientWidth / 2;
    let mejor = 0;
    let dist = Infinity;
    const slides = slidesDe(raiz.current);
    slides.forEach((s, i) => {
      const c = s.offsetLeft + s.offsetWidth / 2;
      const d = Math.abs(c - centro);
      if (d < dist) {
        dist = d;
        mejor = i;
      }
      // Coverflow: distancia en «libros» al centro, para el giro y la escala del CSS (.estante[data-cover]).
      const rel = (c - centro) / (s.offsetWidth || 1);
      const lim = Math.max(-3, Math.min(3, rel));
      s.style.setProperty('--d', lim.toFixed(3));
      s.style.setProperty('--a', Math.abs(lim).toFixed(3));
    });
    a.indice = mejor;
    setIndice(mejor);
  }, [pista]);

  const ir = useCallback(
    (i: number) => {
      const p = pista();
      const slides = slidesDe(raiz.current);
      const destino = slides[Math.max(0, Math.min(slides.length - 1, i))];
      if (!p || !destino) return;
      p.scrollTo({
        left: destino.offsetLeft - (p.clientWidth - destino.offsetWidth) / 2,
        behavior: reducido ? 'auto' : 'smooth',
      });
    },
    [pista, reducido],
  );

  useEffect(() => {
    const p = pista();
    if (!p) return;
    // Empieza en la portada real más cercana al medio (rail.js, startIndex). Se coloca tras el primer pintado, cuando Carousel y
    // SnapPaging ya montaron su pista; colocarlo antes lo deshacía el snap.
    const colocar = () => {
      anclaje.current = { indice: inicio, ancho: 0 };
      const s0 = slidesDe(raiz.current)[inicio];
      if (s0) p.scrollTo({ left: s0.offsetLeft - (p.clientWidth - s0.offsetWidth) / 2, behavior: 'auto' });
      medir();
    };
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(colocar);
    });
    p.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      p.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
    };
  }, [col, inicio, medir, pista]);

  function alTeclado(e: KeyboardEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement;
    if (t.closest('[role="radiogroup"], [role="tablist"]')) return;
    const mapa: Record<string, number> = { ArrowRight: indice + 1, ArrowLeft: indice - 1, Home: 0, End: lista.length - 1 };
    if (!(e.key in mapa)) return;
    e.preventDefault();
    ir(mapa[e.key]);
  }

  // Arrastre con el mouse (el dedo y el trackpad ya los maneja el scroll nativo + SnapPaging).
  function alBajar(e: PointerEvent<HTMLDivElement>) {
    const p = pista();
    if (e.pointerType !== 'mouse' || e.button !== 0 || !p || !p.contains(e.target as Node)) return;
    arrastre.current = { x: e.clientX, izq: p.scrollLeft, movido: false, id: e.pointerId };
  }
  function alMover(e: PointerEvent<HTMLDivElement>) {
    const a = arrastre.current;
    const p = pista();
    if (!a || !p) return;
    const dx = e.clientX - a.x;
    if (!a.movido && Math.abs(dx) > 4) {
      a.movido = true;
      raiz.current?.setAttribute('data-arrastrando', '');
      (e.currentTarget as HTMLElement).setPointerCapture(a.id);
    }
    if (a.movido) p.scrollLeft = a.izq - dx;
  }
  function alSoltar() {
    const a = arrastre.current;
    arrastre.current = null;
    if (!a?.movido) return;
    raiz.current?.removeAttribute('data-arrastrando');
    ir(indice);
    // El clic que sigue a un arrastre no abre el libro.
    const tragar = (ev: Event) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    window.addEventListener('click', tragar, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', tragar, { capture: true }), 0);
  }

  const actual = lista[indice];
  const coleccion = colecciones.find((c) => c.id === col);

  return (
    <div className="estante-bloque">
      <div className="estante-filtro">
        <SegmentedControl label="Colección" value={col} onChange={(v) => { setCol(v); setIndice(libros[v]?.inicio ?? 0); }} size="lg">
          {colecciones.map((c) => (
            <SegmentedControlItem key={c.id} value={c.id} label={c.titulo} />
          ))}
        </SegmentedControl>
        {coleccion ? <p className="estante-nota">{coleccion.nota}</p> : null}
      </div>
      <div
        ref={raiz}
        className="estante"
        data-cover={reducido ? undefined : ''}
        onKeyDown={alTeclado}
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
      >
        <Carousel
          key={col}
          aria-label={`${titulo}: ${coleccion?.titulo ?? ''}`}
          hasButtons={false}
          hasEdgeFade={false}
          gap={2}
          hasSnap={snap}
        >
          {lista.map((l, i) => (
            <a
              key={l.id}
              className="estante-libro"
              href={`#libro-${l.id}`}
              aria-current={i === indice ? 'true' : undefined}
              draggable={false}
            >
              {l.portada ? (
                <img
                  src={l.portada.src}
                  width={l.portada.ancho}
                  height={l.portada.alto}
                  alt={`${l.titulo}${l.autor ? `, de ${l.autor}` : ''}`}
                  loading={Math.abs(i - inicio) < 4 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                />
              ) : (
                // Sin portada en los datos: tapa tipográfica, con título y autor como nombre accesible.
                <span className="cat-portada cat-portada--tipo">
                  <span className="cat-portada-t">{l.titulo}</span>
                  {l.autor ? <span className="cat-portada-a">{l.autor}</span> : null}
                </span>
              )}
            </a>
          ))}
        </Carousel>
        <div className="estante-pie">
          <p className="estante-titulo" aria-live="polite" aria-atomic="true">
            {actual ? (
              <>
                <span className="estante-titulo-t">{actual.titulo}</span>
                {actual.autor ? <span className="estante-titulo-a">{actual.autor}</span> : null}
                <span className="estante-titulo-p">{actual.precio != null ? `$${actual.precio} MXN` : 'Precio en la librería'}</span>
              </>
            ) : null}
          </p>
          <div className="estante-controles">
            <Button label="Libro anterior" variant="secondary" isDisabled={indice <= 0} onClick={() => ir(indice - 1)} icon={<span aria-hidden="true">←</span>} isIconOnly />
            <span className="estante-pos" aria-hidden="true">
              {lista.length ? `${indice + 1} de ${lista.length}` : '0 de 0'}
            </span>
            <Button label="Libro siguiente" variant="secondary" isDisabled={indice >= lista.length - 1} onClick={() => ir(indice + 1)} icon={<span aria-hidden="true">→</span>} isIconOnly />
          </div>
        </div>
      </div>
      <p className="estante-ver">
        <a className="enlace-fuerte" href={hrefCatalogo}>Ver catálogo completo</a>
      </p>
    </div>
  );
}

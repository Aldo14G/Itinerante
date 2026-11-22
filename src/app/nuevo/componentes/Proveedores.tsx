'use client';
// Idioma y movimiento. El tema Astryx ya viene compilado en tema-itinerante.css (scripts/build-tema-astryx.mjs) y se aplica con
// data-astryx-theme en <html> desde el servidor, así que no se monta <Theme> en el navegador: su generador de CSS en tiempo de ejecución
// pesaba ~30 KB gzip y la página ya trae el tema en el primer pintado, también sin JavaScript.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import textosEs from '../../../frente/textos-astryx-es.json';

// Solo las cadenas de los componentes que usa la página (scripts/build-textos-astryx.mjs), no el catálogo es-ES entero (~23 KB).
const textos = { ...textosEs, '@astryx.carousel.slideLabel': 'Libro {current, number} de {total, number}' };

// Misma clave que la landing estática (assets/js/boot.js, motion.js): el interruptor se comparte entre las dos.
export const CLAVE_MOVIMIENTO = 'iti-b4-motion';

type Movimiento = { reducido: boolean; porSistema: boolean; pausado: boolean; alternar: () => void };
const MovimientoContexto = createContext<Movimiento>({ reducido: true, porSistema: false, pausado: false, alternar: () => {} });

export function useMovimiento() {
  return useContext(MovimientoContexto);
}

function ProveedorMovimiento({ children }: { children: ReactNode }) {
  // En el servidor no se sabe: se asume reducido (lo más seguro) y el navegador lo corrige en el primer efecto.
  const [porSistema, setPorSistema] = useState(true);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const leer = () => setPorSistema(mq.matches);
    leer();
    mq.addEventListener('change', leer);
    try {
      setPausado(localStorage.getItem(CLAVE_MOVIMIENTO) === 'off');
    } catch {
      /* almacenamiento bloqueado */
    }
    return () => mq.removeEventListener('change', leer);
  }, []);

  const reducido = porSistema || pausado;

  useEffect(() => {
    const r = document.documentElement;
    r.dataset.movimiento = reducido ? 'quieto' : 'vivo';
    // Astryx 0.7.17 todavía no publica reducedMotion: 'always' en el tema; esta es la misma marca que pone su Theme
    // cuando un tema lo pide, para que sus animaciones de JS también se detengan con el interruptor.
    if (reducido) r.style.setProperty('--_astryx-reduced-motion', '1');
    else r.style.removeProperty('--_astryx-reduced-motion');
  }, [reducido]);

  const alternar = useCallback(() => {
    setPausado((p) => {
      const siguiente = !p;
      try {
        if (siguiente) localStorage.setItem(CLAVE_MOVIMIENTO, 'off');
        else localStorage.removeItem(CLAVE_MOVIMIENTO);
      } catch {
        /* almacenamiento bloqueado */
      }
      return siguiente;
    });
  }, []);

  const valor = useMemo(() => ({ reducido, porSistema, pausado, alternar }), [reducido, porSistema, pausado, alternar]);
  return <MovimientoContexto.Provider value={valor}>{children}</MovimientoContexto.Provider>;
}

export function Proveedores({ children }: { children: ReactNode }) {
  return (
    <InternationalizationProvider locale="es" overrides={{ es: textos }}>
      <ProveedorMovimiento>{children}</ProveedorMovimiento>
    </InternationalizationProvider>
  );
}

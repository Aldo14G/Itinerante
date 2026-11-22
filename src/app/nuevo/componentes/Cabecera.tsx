'use client';
// Barra global: TopNav en ≥768 px; en <768 px un botón «Menú» abre MobileNav (Drawer con foco atrapado, Esc y foco devuelto).
// La sección activa sale de IntersectionObserver con rootMargin = alto de la cabecera y línea de activación al ~35 % (P1-C5).
import { useEffect, useState } from 'react';
import { TopNav, TopNavItem } from '@astryxdesign/core/TopNav';
import { MobileNav } from '@astryxdesign/core/MobileNav';
import { SideNavItem } from '@astryxdesign/core/SideNav';
import { Button } from '@astryxdesign/core/Button';
import { Switch } from '@astryxdesign/core/Switch';
import { useMovimiento } from './Proveedores';

export type Destino = { id: string; etiqueta: string };

export function useSeccionActiva(ids: string[]): string {
  const [activa, setActiva] = useState(ids[0] ?? '');
  useEffect(() => {
    const cab = document.querySelector<HTMLElement>('[data-cabecera]');
    const alto = cab?.offsetHeight ?? 64;
    const visibles = new Map<string, boolean>();
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) visibles.set(e.target.id, e.isIntersecting);
        const primera = ids.find((id) => visibles.get(id));
        if (primera) setActiva(primera);
      },
      // Franja de activación: desde el borde inferior de la cabecera hasta el 35 % del viewport.
      { rootMargin: `-${alto}px 0px -65% 0px`, threshold: 0 },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [ids]);
  return activa;
}

function InterruptorMovimiento() {
  const { pausado, porSistema, alternar } = useMovimiento();
  return (
    <Switch
      label="Movimiento"
      description={porSistema ? 'Tu sistema pide movimiento reducido' : undefined}
      value={!pausado && !porSistema}
      isDisabled={porSistema}
      disabledMessage="Tu sistema pide movimiento reducido"
      onChange={() => alternar()}
    />
  );
}

export function Cabecera({ destinos, comoLlegar }: { destinos: Destino[]; comoLlegar: string }) {
  const activa = useSeccionActiva(destinos.map((d) => d.id));
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="cab" data-cabecera>
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <TopNav
        label="Secciones"
        heading={
          <a className="cab-marca" href="#inicio">
            <img src="/assets/img/logo-96.webp" width={36} height={36} alt="" />
            <span>
              Librería Itinerante <span className="cab-marca-mas">y Más</span>
            </span>
          </a>
        }
        startContent={
          <span className="cab-destinos">
            {destinos.map((d) => (
              <TopNavItem key={d.id} label={d.etiqueta} href={`#${d.id}`} isSelected={activa === d.id} />
            ))}
          </span>
        }
        endContent={
          <span className="cab-fin">
            <span className="cab-switch">
              <InterruptorMovimiento />
            </span>
            <Button label="Cómo llegar" variant="primary" href={comoLlegar} target="_blank" rel="noopener noreferrer" />
            <span className="cab-menu">
              <Button label="Menú" variant="secondary" onClick={() => setAbierto(true)} aria-expanded={abierto} aria-controls="menu-movil" />
            </span>
          </span>
        }
      />
      <MobileNav id="menu-movil" isOpen={abierto} onOpenChange={setAbierto} header="Menú" label="Menú" side="end">
        <nav aria-label="Secciones">
          {destinos.map((d) => (
            <SideNavItem
              key={d.id}
              label={d.etiqueta}
              href={`#${d.id}`}
              isSelected={activa === d.id}
              onClick={() => setAbierto(false)}
            />
          ))}
        </nav>
        <div className="menu-movil-pie">
          <InterruptorMovimiento />
        </div>
      </MobileNav>
    </header>
  );
}

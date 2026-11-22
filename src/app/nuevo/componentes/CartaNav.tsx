'use client';
// Barra de categorías de la carta: TabList de Astryx con enlaces a cada grupo (#carta-<id>). El seleccionado sigue al h3 visible bajo la
// cabecera (P1-C5); objetivos de 48 px y scroll-margin-top en los grupos (P1-6, en estilos.css).
import { TabList, Tab } from '@astryxdesign/core/TabList';
import { useSeccionActiva } from './Cabecera';

export function CartaNav({ categorias }: { categorias: Array<{ id: string; chip: string }> }) {
  const ids = categorias.map((c) => `carta-${c.id}`);
  const activa = useSeccionActiva(ids);
  return (
    <nav className="carta-nav" aria-label="Categorías de la carta">
      <TabList value={activa} onChange={() => {}} size="lg" overflow="scroll">
        {categorias.map((c) => (
          <Tab key={c.id} value={`carta-${c.id}`} label={c.chip} href={`#carta-${c.id}`} />
        ))}
      </TabList>
    </nav>
  );
}

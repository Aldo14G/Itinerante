// Frente nuevo en React 19 + Astryx (oleada 1). Vive en /nuevo mientras la landing estática sigue sirviendo en / hasta la paridad.
import type { Metadata, Viewport } from 'next';
import './capas.css';
import '@astryxdesign/core/astryx.css';
import './tema-itinerante.css';
import './estilos.css';
import { Proveedores } from './componentes/Proveedores';
import { NEGOCIO } from '../../frente/datos';

const ORIGEN = 'https://itinerante.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(ORIGEN),
  title: `${NEGOCIO.nombre} · Centro de Monterrey`,
  description: `${NEGOCIO.nombre}: libros de editoriales independientes, café, eventos y talleres en el centro de Monterrey. ${NEGOCIO.direccion}.`,
  // La versión pública sigue siendo la landing de /; esta ruta no se indexa hasta que la reemplace.
  alternates: { canonical: '/' },
  robots: { index: false, follow: false },
  openGraph: {
    title: `${NEGOCIO.nombre} · Centro de Monterrey`,
    description: NEGOCIO.promesa,
    url: '/',
    siteName: NEGOCIO.nombre,
    locale: 'es_MX',
    type: 'website',
    images: [{ url: '/assets/img/compartir.jpg', width: 1200, height: 630, alt: 'La sala de la Librería Itinerante y Más' }],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/Logo.png', apple: '/Logo.png' },
};

export const viewport: Viewport = { themeColor: '#f5f0e7', colorScheme: 'light' };

// Antes del primer pintado: el interruptor de movimiento (la misma clave que la landing estática) y el reduced-motion del sistema.
const ARRANQUE = `(function(){var r=document.documentElement,q=false;try{q=localStorage.getItem('iti-b4-motion')==='off'}catch(e){}if(q||matchMedia('(prefers-reduced-motion: reduce)').matches){r.dataset.movimiento='quieto';r.style.setProperty('--_astryx-reduced-motion','1')}else{r.dataset.movimiento='vivo'}})();`;

export default function NuevoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ARRANQUE }} />
      <Proveedores>{children}</Proveedores>
    </>
  );
}

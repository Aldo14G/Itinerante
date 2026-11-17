// Carta de prueba con galería (GaleriaCarta, 2026-11-17) para el arnés: solo existe en la prueba, nunca en el repositorio del sitio.
// Hoy ningún producto de assets/data/menu.json trae foto (Aldo las mandará), así que la galería no se pinta. Para medirla, el arnés sirve el
// documento con la carta de esta función pintada (withCarta, lo mismo que haría `npm run carta`) y pone como fotos de producto **fotos reales
// de la casa que ya están en assets/img** (sustitutas: no son de los productos y no se publican así). Nada de esto toca menu.json ni index.html.
//   menuConGaleria(menu, n = 6)  → copia de la carta con `n` productos con foto sustituta (en el orden de la carta)
//   documentoConGaleria(html, menu, n) → index.html con esa carta pintada
import { withCarta } from '../../scripts/build-carta.mjs';

// Fotos reales de la casa (registradas en assets/provenance.json), de 800 px: sirven de sustitutas cuadradas (object-fit: cover).
export const SUSTITUTAS = [
  'assets/img/oficial-mesa-800.webp',
  'assets/img/03-home-sala-central-800.webp',
  'assets/img/04-experiencia-libreros-800.webp',
  'assets/img/05-talleres-ajedrez-800.webp',
  'assets/img/06-comunidad-sonido-800.webp',
  'assets/img/01-entrada-pasillo-800.webp',
  'assets/img/oficial-rincon-800.webp',
  'assets/img/libro-poesia.webp'
];
// Productos que llevan foto en la prueba: con precio y de todas las categorías (uno sin precio para el pie sin precio).
export const CON_FOTO = ['cappuccino', 'latte', 'affogato', 'chocolate', 'sandwich', 'quesadilla-campesina', 'tarta-del-dia', 'hierbabuena'];

export function menuConGaleria(menu, n = 6) {
  const copia = JSON.parse(JSON.stringify(menu));
  const ids = CON_FOTO.slice(0, n);
  for (const c of copia.categorias) for (const p of c.productos) {
    const k = ids.indexOf(p.id);
    if (k >= 0) p.foto = { src: SUSTITUTAS[k % SUSTITUTAS.length], alt: `Foto sustituta de prueba para ${p.nombre}` };
  }
  return copia;
}
export const documentoConGaleria = (html, menu, n = 6) => withCarta(html, menuConGaleria(menu, n));

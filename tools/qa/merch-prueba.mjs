// Productos de Merch de PRUEBA para el arnés (2026-11-19): solo existen en la prueba, nunca en el repositorio del sitio.
// Hoy assets/data/merch.json no tiene productos (Aldo los catalogará) y la sección #merch no existe. Para medirla, el arnés contesta la petición de
// merch.json con estos productos y sirve, en la ruta de sus fotos, **fotos reales de la casa que ya están en assets/img** (sustitutas: no son de los
// artículos). `prueba-2` tiene la foto rota (404) y algunos no llevan foto ni precio. Nada de esto toca merch.json, index.html ni provenance.json.
//   productosDePrueba(n)            → n productos (nombre largo, con y sin descripción, precio, foto y disponibilidad variados)
//   rutearMerch(context, productos) → intercepta merch.json y las fotos de assets/img/merch/ en un contexto de Playwright
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SUSTITUTAS = ['oficial-mesa-800', '03-home-sala-central-800', '04-experiencia-libreros-800', '05-talleres-ajedrez-800'].map(f => readFileSync(join(root, 'assets/img', `${f}.webp`)));

export const productosDePrueba = n => Array.from({ length: n }, (_, i) => ({
  id: `prueba-${i + 1}`, nombre: i % 4 === 0 ? `Artículo de prueba con un nombre bastante largo número ${i + 1}` : `Artículo de prueba ${i + 1}`, tipo: ['Playera', 'Bolsa', 'Taza', 'Cuaderno'][i % 4],
  descripcion: i % 2 ? 'Descripción de prueba de un par de renglones para medir la tarjeta con texto.' : null,
  precio: i % 3 === 2 ? null : 120 + i * 5, foto: i % 5 === 4 ? null : { src: `assets/img/merch/prueba-${i + 1}.webp`, alt: `Foto de prueba ${i + 1}` }, disponibilidad: ['hay', 'encargo', null][i % 3]
}));

export async function rutearMerch(context, productos) {
  await context.route('**/assets/data/merch.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ productos }) }));
  await context.route('**/assets/img/merch/*', r => {
    const m = /prueba-(\d+)/.exec(r.request().url());
    if (m && m[1] === '2') return r.fulfill({ status: 404, body: '' });
    return r.fulfill({ status: 200, contentType: 'image/webp', body: SUSTITUTAS[Number(m?.[1] || 1) % SUSTITUTAS.length] });
  });
}

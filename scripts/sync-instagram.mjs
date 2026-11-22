// Propone imagen y permalink desde la Instagram API with Instagram Login.
// Apagado salvo INSTAGRAM_SYNC=1, INSTAGRAM_USER_ID e INSTAGRAM_ACCESS_TOKEN.
// No modifica eventos.json. Escribe una propuesta para revisión humana.
// No imprime el token. No descarga archivos. No interpreta fechas del caption.
import { writeFile } from 'node:fs/promises';
import eventos from '../src/frente/eventos.json' with { type: 'json' };
import { proponer, redactar, syncActivo, urlMedia } from '../src/frente/instagram-sync.ts';

const SALIDA = new URL('../src/frente/instagram-propuestas.json', import.meta.url);

if (!syncActivo(process.env)) {
  console.log(
    'Sync de Instagram apagado. Hacen falta INSTAGRAM_SYNC=1, INSTAGRAM_USER_ID e INSTAGRAM_ACCESS_TOKEN (cuenta profesional, alcance instagram_business_basic). No se llamó a la red. La página sigue leyendo src/frente/eventos.json.',
  );
  process.exit(0);
}

const url = `${urlMedia(process.env.INSTAGRAM_USER_ID)}&access_token=${encodeURIComponent(process.env.INSTAGRAM_ACCESS_TOKEN)}`;
let res;
try {
  res = await fetch(url);
} catch (err) {
  console.error('No se pudo llamar a graph.instagram.com:', redactar(err instanceof Error ? err.message : String(err)));
  process.exit(1);
}
if (!res.ok) {
  console.error('Instagram respondió', res.status, '(el cuerpo no se imprime).');
  process.exit(1);
}
const json = await res.json();
const propuestas = proponer(eventos.eventos, Array.isArray(json.data) ? json.data : []);
const doc = {
  nota: 'Propuesta para revisión humana. No cambia fechas ni se publica sola. Si la imagen sirve, hay que guardarla en assets/ y apuntar eventos.json a esa ruta local. permalink solo confirma el post ya curado.',
  propuestas,
};
await writeFile(SALIDA, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`Propuestas: ${propuestas.length}. Revisar src/frente/instagram-propuestas.json. eventos.json no se modificó.`);

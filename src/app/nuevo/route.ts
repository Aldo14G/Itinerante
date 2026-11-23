// /nuevo: el HTML que genera scripts/build-nuevo.mjs (React renderizado a HTML estático, sin JS de framework en el navegador).
// Estático con regeneración cada hora: cada regeneración resuelve los bloques fechados con el día de Monterrey.
// Si la URL trae la consulta del catálogo (?q, genero, editorial, orden, vista, pagina, libro), se vuelve a renderizar
// para que los filtros funcionen también sin JavaScript.
// next.config `expireTime` 7200 acota el stale-while-revalidate a 3600 (expire − revalidate).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CSS, DOCUMENTO, JS } from './documento.generado';
import { Pagina } from '../../frente/pagina';
import { consultaActiva, parseConsulta } from '../../frente/consulta';
import { aplicarFechas, cabeceraIsr, hoyMonterrey } from '../../frente/fechas';

// No es force-static: la consulta del catálogo se lee de la URL. revalidate sigue siendo el tope de la caché.
// Literal a propósito: Next solo acepta un número estático. Tiene que coincidir con REVALIDATE_SEGUNDOS en fechas.ts.
export const revalidate = 3600;

export function GET(request: Request) {
  const consulta = parseConsulta(new URL(request.url).searchParams);
  const cuerpo = consultaActiva(consulta)
    ? `<!doctype html>${renderToStaticMarkup(createElement(Pagina, { css: CSS, js: JS, consulta }))}`
    : DOCUMENTO;
  return new Response(aplicarFechas(cuerpo, hoyMonterrey()), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': `public, ${cabeceraIsr()}`,
    },
  });
}

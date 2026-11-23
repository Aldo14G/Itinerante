// /nuevo: el HTML que genera scripts/build-nuevo.mjs (React renderizado a HTML estático, sin JS de framework en el navegador).
// Estático con regeneración cada hora: cada regeneración resuelve los bloques fechados con el día de Monterrey.
// Si la URL trae la consulta del catálogo (?q, genero, editorial, orden, vista, pagina, libro), se reescribe
// ese HTML. No se vuelve a renderizar React: Next no admite react-dom/server dentro de app/.
// next.config `expireTime` 7200 acota el stale-while-revalidate a 3600 (expire − revalidate).
import { DOCUMENTO } from './documento.generado';
import { consultaActiva, parseConsulta } from '../../frente/consulta';
import { aplicarConsultaHtml } from '../../frente/html-consulta';
import { aplicarFechas, cabeceraIsr, hoyMonterrey } from '../../frente/fechas';

// No es force-static: la consulta del catálogo se lee de la URL. revalidate sigue siendo el tope de la caché.
// Literal a propósito: Next solo acepta un número estático. Tiene que coincidir con REVALIDATE_SEGUNDOS en fechas.ts.
export const revalidate = 3600;

export function GET(request: Request) {
  const consulta = parseConsulta(new URL(request.url).searchParams);
  const cuerpo = consultaActiva(consulta) ? aplicarConsultaHtml(DOCUMENTO, consulta) : DOCUMENTO;
  return new Response(aplicarFechas(cuerpo, hoyMonterrey()), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': `public, ${cabeceraIsr()}`,
    },
  });
}

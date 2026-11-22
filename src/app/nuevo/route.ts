// /nuevo: el HTML que genera scripts/build-nuevo.mjs (React renderizado a HTML estático, sin JS de framework en el navegador).
// Estático con regeneración cada hora: cada regeneración resuelve los bloques fechados con el día de Monterrey (un evento pasado
// sale del HTML del servidor); el navegador repite la regla para el HTML que ya estaba en caché.
// next.config `expireTime` 7200 acota el stale-while-revalidate a 3600 (expire − revalidate). A las dos horas sin tráfico,
// la primera respuesta ya no puede ser el HTML del día anterior.
import { DOCUMENTO } from './documento.generado';
import { aplicarFechas, hoyMonterrey } from '../../frente/fechas';

export const dynamic = 'force-static';
// Literal a propósito: Next solo acepta un número estático. Tiene que coincidir con REVALIDATE_SEGUNDOS en fechas.ts.
export const revalidate = 3600;

export function GET() {
  return new Response(aplicarFechas(DOCUMENTO, hoyMonterrey()), {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

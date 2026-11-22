// Bloques que dependen del día (hora de Monterrey). El HTML trae <fecha-hasta d="AAAA-MM-DD"> (se ve hasta ese día inclusive) y
// <fecha-desde d="AAAA-MM-DD"> (se ve desde ese día). El servidor los resuelve en cada regeneración (ISR) y el navegador repite la
// misma regla (src/frente/cliente.js) para el HTML que ya estaba en caché: por eso el servidor deja la envoltura de los bloques vigentes. No se anidan dos bloques del mismo tipo.

/** Hoy en Monterrey, AAAA-MM-DD. */
export function hoyMonterrey(ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
}

export function aplicarFechas(html: string, hoy: string): string {
  return html
    .replace(/<fecha-hasta d="(\d{4}-\d{2}-\d{2})">([\s\S]*?)<\/fecha-hasta>/g, (bloque: string, d: string) => (hoy <= d ? bloque : ''))
    // Un bloque «desde» futuro se queda oculto (hidden): si este HTML sigue en caché ese día, el navegador lo muestra.
    .replace(/<fecha-desde d="(\d{4}-\d{2}-\d{2})">/g, (etiqueta: string, d: string) => (hoy >= d ? etiqueta : `<fecha-desde d="${d}" hidden="">`));
}

/**
 * Caché de /nuevo. `revalidate` (route.ts) es el s-maxage. `expireTime` en next.config
 * es el tope: el swr que arma Next es expireTime − revalidate. Con 3600 y 7200 queda
 * stale-while-revalidate=3600. Pasado ese tope, la primera respuesta ya es HTML nuevo.
 */
export const REVALIDATE_SEGUNDOS = 3600;
export const EXPIRE_SEGUNDOS = 7200;

export function cabeceraIsr(revalidate = REVALIDATE_SEGUNDOS, expire = EXPIRE_SEGUNDOS): string {
  if (!(expire > revalidate)) return `s-maxage=${revalidate}`;
  return `s-maxage=${revalidate}, stale-while-revalidate=${expire - revalidate}`;
}

/** True si la edad ya pasó s-maxage + swr: el CDN tiene que revalidar antes de responder. */
export function cacheVencido(generado: Date, pedido: Date, revalidate = REVALIDATE_SEGUNDOS, expire = EXPIRE_SEGUNDOS): boolean {
  const tope = expire > revalidate ? expire : revalidate;
  return (pedido.getTime() - generado.getTime()) / 1000 > tope;
}

/** El día siguiente a `iso` (AAAA-MM-DD). */
export function diaSiguiente(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

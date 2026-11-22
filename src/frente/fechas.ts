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

/** El día siguiente a `iso` (AAAA-MM-DD). */
export function diaSiguiente(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

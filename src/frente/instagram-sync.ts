// Sync opcional con la Instagram API with Instagram Login (graph.instagram.com).
// Apagado por defecto. No hay token en el repositorio y esta función no lo imprime.
//
// Solo propone imagen (thumbnail_url, o media_url si la miniatura no viene) y permalink
// para eventos que ya están en eventos.json, emparejados por el permalink. No lee el
// caption ni el timestamp para inventar o cambiar una fecha: eso lo revisa una persona
// y, si aplica, lo escribe en eventos.json. media_url puede omitirse por protecciones
// de copyright (desde julio de 2026); en ese caso queda thumbnail_url o ninguna imagen.
//
// No usamos el embed oficial (platform.instagram.com/embed.js): es un script de un
// tercero, muy por encima del presupuesto de JS de la home (unos pocos KB en gzip),
// y además exige JavaScript. La tarjeta enlaza al permalink.

export const CAMPOS_MEDIA = 'id,caption,permalink,timestamp,media_type,thumbnail_url,media_url';
export const ALCANCE = 'instagram_business_basic';

export type MediaIG = {
  id?: string;
  caption?: string;
  permalink?: string;
  timestamp?: string;
  media_type?: string;
  thumbnail_url?: string;
  media_url?: string;
};

export type EventoSync = {
  id: string;
  instagramUrl?: string | null;
  imagen?: string | null;
  fecha?: string | null;
};

export type PropuestaIG = {
  eventoId: string;
  permalink: string | null;
  imagen: string | null;
  origenImagen: 'thumbnail_url' | 'media_url' | null;
};

/** True solo con el interruptor y las dos variables. Sin ellas no hay red. */
export function syncActivo(env: Record<string, string | undefined>): boolean {
  return env.INSTAGRAM_SYNC === '1' && Boolean(env.INSTAGRAM_USER_ID) && Boolean(env.INSTAGRAM_ACCESS_TOKEN);
}

/** URL del listado. El token no va aquí: quien llama lo añade y no lo registra en logs. */
export function urlMedia(userId: string): string {
  return `https://graph.instagram.com/${encodeURIComponent(userId)}/media?fields=${CAMPOS_MEDIA}`;
}

export function redactar(texto: string): string {
  return texto.replace(/access_token=[^&\s'"]+/gi, 'access_token=REDACTED');
}

function canon(url: string): string {
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    return `${u.origin}${u.pathname.replace(/\/+$/, '')}`.toLowerCase();
  } catch {
    return url.split('?')[0].replace(/\/+$/, '').toLowerCase();
  }
}

/**
 * Empareja cada evento curado con un media por permalink. Propone imagen solo si el
 * evento aún no tiene una ruta local. No copia caption, timestamp ni fecha.
 */
export function proponer(eventos: EventoSync[], media: MediaIG[]): PropuestaIG[] {
  const porLink = new Map<string, MediaIG>();
  for (const m of media) if (m.permalink) porLink.set(canon(m.permalink), m);
  const out: PropuestaIG[] = [];
  for (const e of eventos) {
    if (!e.instagramUrl) continue;
    const m = porLink.get(canon(e.instagramUrl));
    if (!m) continue;
    const yaTieneImagen = Boolean(e.imagen);
    const origen = yaTieneImagen ? null : m.thumbnail_url ? 'thumbnail_url' : m.media_url ? 'media_url' : null;
    const imagen = origen === 'thumbnail_url' ? m.thumbnail_url! : origen === 'media_url' ? m.media_url! : null;
    out.push({ eventoId: e.id, permalink: m.permalink ?? null, imagen, origenImagen: origen });
  }
  return out;
}

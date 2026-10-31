// Guardas para rutas que cuestan dinero (Iti IA llama a un modelo de pago):
// comprobación de origen, tamaño del cuerpo y límite de ritmo.
//
// Límite en memoria por instancia: en serverless cada instancia lleva su propia cuenta, así que
// acota el abuso pero no lo elimina. Para un tope global hace falta un almacén compartido
// (Vercel KV / Upstash / Cloud Armor) delante de esta ruta.

export type GuardResult = { ok: true } | { ok: false; status: 403 | 413 | 429; error: string; retryAfter?: number };

export type GuardEnv = {
  allowedOrigins?: string;
  perIpPerMinute?: number;
  globalPerHour?: number;
  maxBodyBytes?: number;
};

type Bucket = { hits: number[] };

const ipBuckets = new Map<string, Bucket>();
const globalBucket: Bucket = { hits: [] };
const MINUTE = 60_000;
const HOUR = 3_600_000;

export function resetGuards() {
  ipBuckets.clear();
  globalBucket.hits.length = 0;
}

function prune(bucket: Bucket, now: number, windowMs: number) {
  while (bucket.hits.length && now - bucket.hits[0] >= windowMs) bucket.hits.shift();
}

export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

export function originAllowed(headers: Headers, requestUrl: string, allowedOrigins = "") {
  const origin = headers.get("origin");
  if (!origin) return false; // los navegadores siempre envían Origin en un POST con fetch
  let own: string;
  try {
    own = new URL(requestUrl).origin;
  } catch {
    return false;
  }
  const hostHeader = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto = headers.get("x-forwarded-proto") ?? new URL(requestUrl).protocol.replace(":", "");
  const allowed = new Set([own, ...(hostHeader ? [`${proto}://${hostHeader}`] : []), ...allowedOrigins.split(",").map((value) => value.trim()).filter(Boolean)]);
  return allowed.has(origin);
}

/** Origen y tamaño: lo que no depende de estado. Lo usan la ruta de Next y el Worker de Cloudflare. */
export function checkOriginAndSize(request: Request, env: GuardEnv = {}): GuardResult {
  const maxBytes = env.maxBodyBytes ?? 8_192;
  if (!originAllowed(request.headers, request.url, env.allowedOrigins)) {
    return { ok: false, status: 403, error: "Origen no permitido." };
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > maxBytes) {
    return { ok: false, status: 413, error: "La consulta es demasiado larga." };
  }
  return { ok: true };
}

export function guardRequest(request: Request, env: GuardEnv = {}, now = Date.now()): GuardResult {
  const perIp = env.perIpPerMinute ?? 10;
  const perHour = env.globalPerHour ?? 300;

  const stateless = checkOriginAndSize(request, env);
  if (!stateless.ok) return stateless;

  const ip = clientIp(request.headers);
  const bucket = ipBuckets.get(ip) ?? { hits: [] };
  prune(bucket, now, MINUTE);
  prune(globalBucket, now, HOUR);

  if (bucket.hits.length >= perIp) {
    const retryAfter = Math.max(1, Math.ceil((bucket.hits[0] + MINUTE - now) / 1000));
    return { ok: false, status: 429, error: "Demasiadas consultas. Intenta de nuevo en un momento.", retryAfter };
  }
  if (globalBucket.hits.length >= perHour) {
    const retryAfter = Math.max(1, Math.ceil((globalBucket.hits[0] + HOUR - now) / 1000));
    return { ok: false, status: 429, error: "Iti IA está recibiendo muchas consultas. Intenta más tarde.", retryAfter };
  }

  bucket.hits.push(now);
  globalBucket.hits.push(now);
  ipBuckets.set(ip, bucket);
  if (ipBuckets.size > 5_000) {
    for (const [key, value] of ipBuckets) {
      prune(value, now, MINUTE);
      if (!value.hits.length) ipBuckets.delete(key);
    }
  }
  return { ok: true };
}

export function guardEnvFromProcess(): GuardEnv {
  const num = (value: string | undefined) => (value && Number.isFinite(Number(value)) ? Number(value) : undefined);
  return {
    allowedOrigins: process.env.ITI_IA_ALLOWED_ORIGINS,
    perIpPerMinute: num(process.env.ITI_IA_RATE_PER_MINUTE),
    globalPerHour: num(process.env.ITI_IA_RATE_PER_HOUR),
    maxBodyBytes: num(process.env.ITI_IA_MAX_BODY_BYTES),
  };
}

/** Variante para entornos sin process.env (Cloudflare Workers): lee la configuración del objeto env. */
export function guardEnvFromEnv(env: { ITI_IA_ALLOWED_ORIGINS?: string; ITI_IA_MAX_BODY_BYTES?: string }): GuardEnv {
  const max = Number(env.ITI_IA_MAX_BODY_BYTES);
  return { allowedOrigins: env.ITI_IA_ALLOWED_ORIGINS, maxBodyBytes: Number.isFinite(max) && max > 0 ? max : undefined };
}

// Worker de Cloudflare: API del sitio. El HTML y los assets los sirve Cloudflare directamente
// (assets.run_worker_first solo manda /api/* aquí).
import { checkOriginAndSize, clientIp, guardEnvFromEnv } from "../src/lib/api-guard";
import { handleCatalog } from "./catalog";
import { handleItiIa } from "./iti-ia";
import type { Env } from "./env";

const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/catalog") {
      if (request.method !== "GET" && request.method !== "HEAD") return json({ error: { message: "Método no permitido." } }, 405, { Allow: "GET, HEAD" });
      return handleCatalog(request);
    }

    if (pathname === "/api/ai/iti-ia") {
      if (request.method !== "POST") return json({ error: { message: "Método no permitido." } }, 405, { Allow: "POST" });
      const guard = checkOriginAndSize(request, guardEnvFromEnv(env));
      if (!guard.ok) return json({ error: guard.error }, guard.status);

      // Rate Limiting de Cloudflare: por IP y global (por ubicación). Si no hay binding (pruebas locales), no limita.
      const ip = clientIp(request.headers);
      const [perIp, global] = await Promise.all([
        env.IA_PER_IP?.limit({ key: ip }) ?? { success: true },
        env.IA_GLOBAL?.limit({ key: "iti-ia" }) ?? { success: true },
      ]);
      if (!perIp.success) return json({ error: "Demasiadas consultas. Intenta de nuevo en un momento." }, 429, { "Retry-After": "60" });
      if (!global.success) return json({ error: "Iti IA está recibiendo muchas consultas. Intenta más tarde." }, 429, { "Retry-After": "60" });

      return handleItiIa(request, env);
    }

    return json({ error: { message: "No encontrado." } }, 404);
  },
};

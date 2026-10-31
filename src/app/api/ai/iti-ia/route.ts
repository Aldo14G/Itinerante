import type { NextRequest } from "next/server";
import { guardEnvFromProcess, guardRequest } from "@/lib/api-guard";

export async function POST(request: NextRequest) {
  const verdict = guardRequest(request, guardEnvFromProcess());
  if (!verdict.ok) {
    return Response.json(
      { error: verdict.error },
      {
        status: verdict.status,
        headers: verdict.retryAfter ? { "Retry-After": String(verdict.retryAfter) } : undefined,
      },
    );
  }
  const [{ appRoute }, { itiIaFlow }] = await Promise.all([
    import("@genkit-ai/next"),
    import("@/ai/iti-ia"),
  ]);
  return appRoute(itiIaFlow)(request);
}

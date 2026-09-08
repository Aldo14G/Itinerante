import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const [{ appRoute }, { itiIaFlow }] = await Promise.all([
    import("@genkit-ai/next"),
    import("@/ai/iti-ia"),
  ]);
  return appRoute(itiIaFlow)(request);
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El swr de ISR es expireTime − revalidate. Con revalidate 3600, 7200 deja
  // stale-while-revalidate=3600: pasadas dos horas sin tráfico, la primera respuesta ya es HTML nuevo.
  expireTime: 7200,
  serverExternalPackages: [
    "genkit",
    "@genkit-ai/next",
    "@genkit-ai/google-genai",
  ],
};

export default nextConfig;

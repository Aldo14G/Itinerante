import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "genkit",
    "@genkit-ai/next",
    "@genkit-ai/google-genai",
  ],
};

export default nextConfig;

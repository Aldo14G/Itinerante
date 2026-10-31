// Tipos mínimos del entorno del Worker (evita depender de @cloudflare/workers-types dentro del tsconfig de Next).
export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  IA_PER_IP?: RateLimitBinding;
  IA_GLOBAL?: RateLimitBinding;
  GEMINI_API_KEY?: string;
  ITI_IA_MODEL?: string;
  ITI_IA_FALLBACK_MODEL?: string;
  ITI_IA_MODEL_TIMEOUT_MS?: string;
  ITI_IA_ALLOWED_ORIGINS?: string;
  ITI_IA_MAX_BODY_BYTES?: string;
}

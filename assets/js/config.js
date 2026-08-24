// config.js — configuración runtime del backend.
// La anon key es diseñada para ser embebida (spec 5.3 b2 + runbook rotación).

// TODO al deployar a prod: reemplazar con URL + anon key del proyecto Supabase productivo.
// Ver runbook: CONTEXT.md → Operations / Rotate Supabase anon key.
export const SUPABASE_URL = 'http://127.0.0.1:54321';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// WhatsApp CTA (spec 4B.2 a2).
// Arrancamos con número personal de Roberto; flippear a WA Business cuando exista.
export const WHATSAPP_NUMBER = '528180875940';  // MX country code + número

// Feature flags de rollout (spec 6.2 b1).
// 'supabase' = usar backend. 'static' = fallback (galeria: array BOOKS; otras: mensaje mantenimiento).
export const BACKEND_FLAGS = {
  galeria:  'supabase',
  catalogo: 'supabase',
  libro:    'supabase',
  admin:    'supabase',
};

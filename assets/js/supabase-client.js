// supabase-client.js — singleton del cliente + wrapper de error handling.
// Spec 5.3 a1 (localStorage + persistSession) + 6.2 c3 (fail policy).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// supabaseCall — centraliza política de fallo (spec 6.2 c3).
// Uso:
//   const { data, error } = await supabaseCall(() => sb.from('book').select('*'));
//   const books = await supabaseCall(() => sb.from('book').select('*'), { silentFail: true, fallback: [] });
export async function supabaseCall(operation, options = {}) {
  const { silentFail = false, fallback = null } = options;
  try {
    const result = await operation();
    if (result?.error) {
      if (silentFail) {
        console.warn('[supabaseCall] operation failed silently:', result.error.message);
        return fallback;
      }
      return result;
    }
    return silentFail ? (result?.data ?? fallback) : result;
  } catch (err) {
    if (silentFail) {
      console.warn('[supabaseCall] operation threw silently:', err.message);
      return fallback;
    }
    throw err;
  }
}

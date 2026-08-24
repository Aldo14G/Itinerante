import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function normalize(text) {
  return text.replace(/\s+/g, ' ').trim();
}

export function readHtml(name) {
  return readFileSync(join(root, name), 'utf8');
}

export function localAssetValues(html) {
  return [...html.matchAll(/\b(?:src|href)=["']([^"']*)["']/g)]
    .map(m => m[1])
    .filter(v => v && !v.startsWith('#'))
    .filter(v => !/^(https?:|mailto:|tel:|data:|blob:)/i.test(v));
}

export function cssRuleBlock(selector, html) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  if (!match) throw new Error(`missing CSS rule for ${selector}`);
  return match[1];
}

export function assertMotionBudget(selector, maxMs, html) {
  const block = cssRuleBlock(selector, html);
  const durations = [...block.matchAll(/(\d*\.?\d+)(ms|s)/g)]
    .map(([, v, u]) => Number(v) * (u === 's' ? 1000 : 1));
  if (durations.length === 0) throw new Error(`expected durations in ${selector}`);
  const max = Math.max(...durations);
  if (max > maxMs) throw new Error(`${selector} exceeds ${maxMs}ms motion budget: ${durations.join(', ')}`);
}

const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
const LOCAL_ANON_KEY = process.env.SUPABASE_LOCAL_ANON_KEY;
const LOCAL_SERVICE_ROLE_KEY = process.env.SUPABASE_LOCAL_SERVICE_KEY;
const ADMIN_TEST_EMAIL = 'roberto@libreriaitineranteymas.com';
const ADMIN_TEST_PASSWORD = 'test-password-only-local';

export async function isSupabaseLocalRunning() {
  try {
    const res = await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: LOCAL_ANON_KEY ?? '' },
    });
    return res.ok || res.status === 401;
  } catch {
    return false;
  }
}

export async function getSupabaseTestClients() {
  if (!LOCAL_ANON_KEY || !LOCAL_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing SUPABASE_LOCAL_ANON_KEY or SUPABASE_LOCAL_SERVICE_KEY env vars. ' +
      'Run: supabase status -o env > .env.supabase-local && source .env.supabase-local'
    );
  }

  const anon = createClient(LOCAL_SUPABASE_URL, LOCAL_ANON_KEY);
  const serviceRole = createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Bootstrap admin user si no existe (idempotente).
  const { data: existing } = await serviceRole.auth.admin.listUsers();
  const alreadyExists = existing?.users?.some(u => u.email === ADMIN_TEST_EMAIL);
  if (!alreadyExists) {
    await serviceRole.auth.admin.createUser({
      email: ADMIN_TEST_EMAIL,
      password: ADMIN_TEST_PASSWORD,
      email_confirm: true,
    });
  }

  const admin = createClient(LOCAL_SUPABASE_URL, LOCAL_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await admin.auth.signInWithPassword({
    email: ADMIN_TEST_EMAIL,
    password: ADMIN_TEST_PASSWORD,
  });

  return { anon, admin, serviceRole };
}

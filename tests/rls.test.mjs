import test from 'node:test';
import { strict as assert } from 'node:assert';
import { getSupabaseTestClients, isSupabaseLocalRunning } from './helpers.mjs';

const supabaseAvailable = await isSupabaseLocalRunning();

if (!supabaseAvailable) {
  test('RLS suite skipped', { skip: 'Supabase local not running. Run: supabase start' }, () => {});
} else {
  const { anon, admin, serviceRole } = await getSupabaseTestClients();

  test('RLS 5.1.1 — anon NO puede insertar en book', async () => {
    const editorial = await serviceRole.from('editorial').select('id').limit(1).single();
    const { error } = await anon.from('book').insert({
      slug: 'rls-test-anon-insert',
      editorial_id: editorial.data.id,
      dc_title: 'Test',
      dc_language: 'es',
    });
    // Bloqueo válido: puede venir por RLS policy (con GRANT) o por
    // permission denied (sin GRANT). Ambos representan "anon no puede escribir".
    assert.ok(error, 'expected block, got success');
    assert.match(error.message, /row-level security|permission denied/i);
  });

  test('RLS 5.1.2 — anon NO puede leer whatsapp_click', async () => {
    const { data, error } = await anon.from('whatsapp_click').select('*').limit(1);
    // Bloqueo válido: permission denied (sin GRANT) o data=[] (RLS con GRANT).
    // Ambos = anon no ve datos.
    if (error) {
      assert.match(error.message, /permission denied/i);
    } else {
      assert.deepEqual(data, []);
    }
  });

  test('RLS 5.1.3 — anon NO puede leer profile', async () => {
    const { data, error } = await anon.from('profile').select('*').limit(1);
    if (error) {
      assert.match(error.message, /permission denied/i);
    } else {
      assert.deepEqual(data, []);
    }
  });

  test('RLS 5.1.4 — admin SÍ puede escribir en book', async () => {
    const editorial = await serviceRole.from('editorial').select('id').limit(1).single();
    const { error } = await admin.from('book').insert({
      slug: `rls-test-admin-insert-${Date.now()}`,
      editorial_id: editorial.data.id,
      dc_title: 'Admin Write Test',
      dc_language: 'es',
    });
    assert.equal(error, null, error?.message);
    // Cleanup
    await serviceRole.from('book').delete().like('slug', 'rls-test-admin-insert-%');
  });

  test('RLS 5.1.5a — anon SÍ puede insertar whatsapp_click con payload válido', async () => {
    const book = await serviceRole.from('book').select('id').limit(1).single();
    const { error } = await anon.from('whatsapp_click').insert({
      book_id: book.data.id,
      price_shown: 100,
      session_ref: 'test-session',
    });
    assert.equal(error, null, error?.message);
  });

  test('RLS 5.1.5b — anon NO puede insertar whatsapp_click con book_id null', async () => {
    const { error } = await anon.from('whatsapp_click').insert({
      book_id: null,
      price_shown: 100,
    });
    assert.ok(error, 'expected constraint violation');
  });

  test('RLS 5.2.1 — anon NO puede escribir en book-covers/', async () => {
    const blob = new Blob(['fake image bytes'], { type: 'image/webp' });
    const { error } = await anon.storage
      .from('book-covers')
      .upload(`rls-anon-${Date.now()}.webp`, blob);
    assert.ok(error, 'expected RLS violation on storage insert');
  });

  test('RLS 5.2.2 — admin SÍ puede escribir en book-covers/', async () => {
    const blob = new Blob(['fake image bytes'], { type: 'image/webp' });
    const key = `rls-admin-${Date.now()}.webp`;
    const { error } = await admin.storage.from('book-covers').upload(key, blob);
    assert.equal(error, null, error?.message);
    // Cleanup
    await serviceRole.storage.from('book-covers').remove([key]);
  });

  test('RLS 5.2.3 — público SÍ puede leer objetos del bucket', async () => {
    // Upload como admin, download como anon
    const blob = new Blob(['test'], { type: 'image/webp' });
    const key = `rls-read-${Date.now()}.webp`;
    await admin.storage.from('book-covers').upload(key, blob);

    const publicUrl = anon.storage.from('book-covers').getPublicUrl(key).data.publicUrl;
    const res = await fetch(publicUrl);
    assert.equal(res.status, 200);

    await serviceRole.storage.from('book-covers').remove([key]);
  });
}

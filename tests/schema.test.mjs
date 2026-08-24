import test from 'node:test';
import { strict as assert } from 'node:assert';
import { getSupabaseTestClients, isSupabaseLocalRunning } from './helpers.mjs';

const supabaseAvailable = await isSupabaseLocalRunning();

if (!supabaseAvailable) {
  test('Schema suite skipped', { skip: 'Supabase local not running.' }, () => {});
} else {
  const { anon, serviceRole } = await getSupabaseTestClients();

  test('schema — dc_language CHECK enforcing ISO 639-1', async () => {
    const editorial = await serviceRole.from('editorial').select('id').limit(1).single();
    const { error } = await serviceRole.from('book').insert({
      slug: 'schema-test-lang',
      editorial_id: editorial.data.id,
      dc_title: 'X',
      dc_language: 'esp',  // 3 chars, viola CHECK
    });
    assert.ok(error, 'expected CHECK violation for dc_language');
    assert.match(error.message, /dc_language/);
  });

  test('schema — stock.price_mxn CHECK >= 0', async () => {
    const book = await serviceRole.from('book').select('id').limit(1).single();
    const { error } = await serviceRole.from('stock').upsert({
      book_id: book.data.id,
      available: true,
      price_mxn: -10,
    });
    assert.ok(error, 'expected CHECK violation for price_mxn');
  });

  test('schema — FTS encuentra libros por título', async () => {
    const { data, error } = await anon
      .from('book')
      .select('slug, dc_title')
      .textSearch('search_vector', '2666', { config: 'spanish' });
    assert.equal(error, null);
    assert.ok(data.some(b => b.slug === '2666-roberto-bolano'), 'expected 2666 in results');
  });

  test('schema — FTS encuentra libros por autor (nombre unaccented)', async () => {
    // Nota: query sin acentos porque el vector se indexa con unaccent(),
    // y websearch_to_tsquery no aplica unaccent automático.
    const { data, error } = await anon
      .from('book')
      .select('slug')
      .textSearch('search_vector', 'Roberto', { config: 'spanish' });
    assert.equal(error, null);
    const slugs = data.map(b => b.slug);
    assert.ok(slugs.includes('2666-roberto-bolano'), 'expected Bolaño books via author name');
    assert.ok(slugs.includes('los-detectives-salvajes'));
  });

  test('schema — FTS con acento tolerante (unaccent)', async () => {
    const { data, error } = await anon
      .from('book')
      .select('slug')
      .textSearch('search_vector', 'bolano', { config: 'spanish' });  // sin ñ ni tilde
    assert.equal(error, null);
    assert.ok(data.some(b => b.slug === '2666-roberto-bolano'));
  });

  test('schema — RPC get_related_books devuelve resultados con score', async () => {
    const target = await serviceRole.from('book')
      .select('id')
      .eq('slug', '2666-roberto-bolano')
      .single();
    const { data, error } = await anon.rpc('get_related_books', {
      target_book_id: target.data.id,
      limit_n: 8,
    });
    assert.equal(error, null, error?.message);
    assert.ok(data.length > 0);
    assert.ok(data.every(r => typeof r.score === 'number'));
    assert.ok(data.every(r => r.source === 'related' || r.source === 'fallback'));
  });

  test('schema — RPC excluye el propio libro de los resultados', async () => {
    const target = await serviceRole.from('book')
      .select('id')
      .eq('slug', '2666-roberto-bolano')
      .single();
    const { data } = await anon.rpc('get_related_books', {
      target_book_id: target.data.id,
      limit_n: 8,
    });
    assert.ok(!data.some(r => r.book_id === target.data.id));
  });

  test('schema — seed poblado (10 libros)', async () => {
    const { count } = await anon.from('book').select('*', { count: 'exact', head: true });
    assert.equal(count, 10);
  });

  test('schema — shelf home_featured tiene 6 libros', async () => {
    const shelf = await serviceRole.from('shelf').select('id').eq('slug', 'home_featured').single();
    const { count } = await anon.from('book_shelf')
      .select('*', { count: 'exact', head: true })
      .eq('shelf_id', shelf.data.id);
    assert.equal(count, 6);
  });
}

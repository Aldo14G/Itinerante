import test from 'node:test';
import { strict as assert } from 'node:assert';
import { getCoverUrl } from '../assets/js/lib/getCoverUrl.js';

const SUPABASE_URL = 'https://myproject.supabase.co';

test('getCoverUrl — storage_key devuelve URL de Supabase', () => {
  const url = getCoverUrl({ storage_key: '2666.webp' }, SUPABASE_URL);
  assert.equal(
    url,
    'https://myproject.supabase.co/storage/v1/object/public/book-covers/2666.webp'
  );
});

test('getCoverUrl — local_asset_path devuelve path legacy', () => {
  const url = getCoverUrl({ local_asset_path: '/images/legacy.jpg' }, SUPABASE_URL);
  assert.equal(url, '/images/legacy.jpg');
});

test('getCoverUrl — storage_key gana sobre local_asset_path', () => {
  const url = getCoverUrl(
    { storage_key: '2666.webp', local_asset_path: '/images/legacy.jpg' },
    SUPABASE_URL
  );
  assert.match(url, /supabase\.co/);
});

test('getCoverUrl — sin data devuelve null', () => {
  assert.equal(getCoverUrl({}, SUPABASE_URL), null);
  assert.equal(getCoverUrl({ storage_key: null, local_asset_path: null }, SUPABASE_URL), null);
});

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { extractControlledFilters } from '../src/ai/query-filters.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('extractor mapea categorias en español con y sin acentos', () => {
  assert.deepEqual(extractControlledFilters('quiero filosofía para regalo'), {
    categorySlug: 'essay',
    subgenreSlug: 'filosofia',
  });
  assert.deepEqual(extractControlledFilters('libros de cocina mexicana'), {
    categorySlug: 'science',
    subgenreSlug: 'cocina-mexicana',
  });
  assert.deepEqual(extractControlledFilters('cuentos infantiles'), {
    categorySlug: 'fiction',
    subgenreSlug: 'cuento',
  });
  assert.deepEqual(extractControlledFilters('novela mexicana pueblo memoria'), {
    categorySlug: 'fiction',
    subgenreSlug: 'novela',
  });
  assert.deepEqual(extractControlledFilters('HISTORIA DE MEXICO'), {
    categorySlug: 'history',
    subgenreSlug: 'historia-mexico',
  });
  assert.deepEqual(extractControlledFilters('Psicología'), { categorySlug: 'psychology', subgenreSlug: 'psicologia' });
  assert.deepEqual(extractControlledFilters('Fantasía'), { categorySlug: 'fiction' });
});

test('el subgenero manda y deriva su categoria', () => {
  assert.deepEqual(extractControlledFilters('busco novela policial'), {
    categorySlug: 'fiction',
    subgenreSlug: 'novela',
  });
  assert.deepEqual(extractControlledFilters('algo de fotografia analogica'), {
    categorySlug: 'arts',
    subgenreSlug: 'fotografia',
  });
  assert.deepEqual(extractControlledFilters('ensayo sobre crianza'), {
    categorySlug: 'psychology',
    subgenreSlug: 'crianza-educacion',
  });
});

test('sin mencion taxonomica no hay filtros', () => {
  assert.deepEqual(extractControlledFilters('algo bonito para regalo'), {});
  assert.deepEqual(extractControlledFilters('hola'), {});
  assert.deepEqual(extractControlledFilters(''), {});
});

test('Iti IA cablea filtros controlados al retrieval', () => {
  const flow = readFileSync(join(root, 'src', 'ai', 'iti-ia.ts'), 'utf8');
  assert.match(flow, /extractControlledFilters\(query\)/);
  assert.match(flow, /searchInventoryBooks\(query, 8, controlled\)/);
  assert.match(flow, /searchInventoryBooksByVector\(query, 8, controlled\)/);
  assert.match(flow, /INVENTORY_EMBEDDINGS/);
  assert.match(flow, /recommendTestBooks\(query, datasetKey, 8, controlled\)/);
  const catalog = readFileSync(join(root, 'src', 'lib', 'test-catalog.ts'), 'utf8');
  assert.match(catalog, /\$categorySlug: String/);
  assert.match(catalog, /\$subgenreSlug: String/);
  assert.match(catalog, /compare: \$compare method: COSINE/);
  assert.match(catalog, /embedGemini/);
});

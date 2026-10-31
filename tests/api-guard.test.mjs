import { strict as assert } from 'node:assert';
import test, { beforeEach } from 'node:test';
import { guardRequest, originAllowed, resetGuards, clientIp } from '../src/lib/api-guard.ts';

const URL_ = 'https://itinerante.example/api/ai/iti-ia';
const req = (headers = {}) => new Request(URL_, { method: 'POST', headers, body: '{}' });
const good = { origin: 'https://itinerante.example', 'x-forwarded-for': '203.0.113.7' };

beforeEach(() => resetGuards());

test('acepta el mismo origen y rechaza otro o ninguno', () => {
  assert.equal(guardRequest(req(good)).ok, true);
  const other = guardRequest(req({ ...good, origin: 'https://evil.example' }));
  assert.deepEqual([other.ok, other.status], [false, 403]);
  const none = guardRequest(req({ 'x-forwarded-for': '203.0.113.7' }));
  assert.deepEqual([none.ok, none.status], [false, 403]);
});

test('permite orígenes extra por configuración y el host reenviado', () => {
  assert.equal(originAllowed(new Headers({ origin: 'http://localhost:3000' }), URL_, 'http://localhost:3000, https://otro.example'), true);
  assert.equal(originAllowed(new Headers({ origin: 'https://www.itinerante.mx', 'x-forwarded-host': 'www.itinerante.mx', 'x-forwarded-proto': 'https' }), URL_), true);
});

test('rechaza cuerpos grandes', () => {
  const big = guardRequest(req({ ...good, 'content-length': '9000' }));
  assert.deepEqual([big.ok, big.status], [false, 413]);
});

test('límite por IP: 10 por minuto, con Retry-After, y se libera con el tiempo', () => {
  const t0 = 1_000_000;
  for (let i = 0; i < 10; i++) assert.equal(guardRequest(req(good), {}, t0 + i).ok, true);
  const blocked = guardRequest(req(good), {}, t0 + 20);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, 429);
  assert.ok(blocked.retryAfter >= 1 && blocked.retryAfter <= 60);
  assert.equal(guardRequest(req({ ...good, 'x-forwarded-for': '198.51.100.9' }), {}, t0 + 20).ok, true, 'otra IP no se ve afectada');
  assert.equal(guardRequest(req(good), {}, t0 + 61_000).ok, true, 'tras un minuto vuelve a pasar');
});

test('tope global por hora entre todas las IP', () => {
  const t0 = 5_000_000;
  const env = { globalPerHour: 3 };
  for (let i = 0; i < 3; i++) assert.equal(guardRequest(req({ ...good, 'x-forwarded-for': `10.0.0.${i}` }), env, t0 + i).ok, true);
  const blocked = guardRequest(req({ ...good, 'x-forwarded-for': '10.0.0.99' }), env, t0 + 10);
  assert.deepEqual([blocked.ok, blocked.status], [false, 429]);
});

test('toma la primera IP de x-forwarded-for', () => {
  assert.equal(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })), '203.0.113.7');
});

// Frente nuevo (/nuevo, React + Astryx): datos reales, filtro de fechas de eventos, tema y textos generados al día.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import {
  LIBROS,
  CARTA,
  COLECCIONES,
  NOVEDADES,
  GENEROS_REJILLA,
  recomendadosPorColeccion,
  eventosFechados,
  hoyMonterrey,
  filasDeCarta,
  RECURRENTES,
  NEGOCIO,
} from '../src/frente/datos.ts';

test('los 41 títulos y los 21 productos de la carta llegan al frente', () => {
  assert.equal(LIBROS.length, 41);
  assert.equal(CARTA.reduce((n, c) => n + c.productos.length, 0), 21);
  const enFilas = CARTA.flatMap(filasDeCarta).reduce((n, f) => n + (f.tipo === 'grupo' ? f.productos.length : 1), 0);
  assert.equal(enFilas, 21, 'agrupar los tés no pierde productos');
});

test('ninguna fila de la carta queda sin precio ni «Precio en barra»', () => {
  for (const c of CARTA) for (const f of filasDeCarta(c)) {
    if (f.tipo === 'grupo') assert.ok(f.productos.every((p) => p.precio == null));
  }
});

test('el carrusel usa las colecciones reales de collections.json con el criterio de rail.js', () => {
  assert.deepEqual(COLECCIONES.map((c) => c.id), ['narrativa', 'poesia', 'ensayo']);
  const r = recomendadosPorColeccion();
  for (const c of COLECCIONES) {
    assert.ok(r[c.id].libros.length > 0 && r[c.id].libros.length <= 12);
    const ts = r[c.id].libros.map((l) => l.titulo);
    assert.deepEqual(ts, [...ts].sort((a, b) => a.localeCompare(b, 'es')), 'orden por título');
    assert.ok(r[c.id].libros[r[c.id].inicio].portada, 'empieza en una portada real');
  }
});

test('Novedades no existe sin llegadas reales', () => {
  assert.equal(NOVEDADES.length, 0);
});

test('el filtro de género de la rejilla cubre los subgéneros de un título sin inventar categorías', () => {
  const sinGenero = LIBROS.filter((l) => l.genero && !l.generoRejilla);
  assert.equal(sinGenero.length, 0);
  assert.deepEqual(GENEROS_REJILLA.map((g) => g.nombre), ['Narrativa', 'Poesía', 'Ensayo']);
});

test('el aniversario se muestra hasta el 27 nov 2026 y desaparece desde el 28 (hora de Monterrey)', () => {
  assert.deepEqual(eventosFechados('2026-11-22').map((e) => e.id), ['aniversario-6']);
  assert.deepEqual(eventosFechados('2026-11-27').map((e) => e.id), ['aniversario-6']);
  assert.deepEqual(eventosFechados('2026-11-28'), []);
  // 27 nov 23:30 en Monterrey = 28 nov 05:30 UTC: todavía es 27 para la librería.
  assert.equal(hoyMonterrey(new Date('2026-11-28T05:30:00Z')), '2026-11-27');
  assert.equal(hoyMonterrey(new Date('2026-11-28T06:30:00Z')), '2026-11-28');
  assert.equal(eventosFechados('2026-11-22')[0].hora, null, 'sin hora inventada');
});

test('Club de Dibujo y Pintura es recurrente, sin fecha, con fuente oficial', () => {
  const club = RECURRENTES.find((r) => r.id === 'club-dibujo-pintura');
  assert.ok(club && !('fecha' in club));
  assert.match(club.fuente, /^https:\/\/www\.instagram\.com\/libreriaitineranteymasmty\//);
});

test('contacto: Facebook, dirección y teléfono de la ficha oficial', () => {
  assert.equal(NEGOCIO.facebook, 'https://www.facebook.com/people/Librer%C3%ADa-Itinerante-y-m%C3%A1s/100095548961064/');
  assert.equal(NEGOCIO.direccionContacto, 'Matamoros 421 Pte., Centro, Monterrey');
  assert.equal(NEGOCIO.telefonoVisible, '81 8087 5940');
});

test('la interfaz nunca imprime «[pendiente]» ni estado abierto/cerrado', () => {
  const dir = new URL('../src/app/nuevo/', import.meta.url);
  const archivos = ['page.tsx', ...readdirSync(new URL('componentes/', dir)).map((f) => `componentes/${f}`)];
  for (const f of archivos) {
    const sinComentarios = readFileSync(new URL(f, dir), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    assert.doesNotMatch(sinComentarios, /\[pendiente\]/, f);
    assert.doesNotMatch(sinComentarios, /StatusDot|'Abierto|Abierto ·/, f);
  }
});

test('tema Astryx, textos y contraste AA al día', () => {
  for (const s of ['scripts/build-tema-astryx.mjs', 'scripts/build-textos-astryx.mjs']) {
    execFileSync(process.execPath, [s, '--check'], { stdio: 'pipe' });
  }
  execFileSync(process.execPath, ['scripts/check-contraste.mjs'], { stdio: 'pipe' });
});

test('Astryx fijo en 0.7.17 exacto y sin AGENTS.md de su CLI', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.dependencies['@astryxdesign/core'], '0.7.17');
  const agents = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');
  assert.doesNotMatch(agents, /astryx/i);
});

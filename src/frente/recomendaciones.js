// Ordena candidatos del inventario con gustos elegidos y feedback explícito.
export function recomendarLibros(libros, generos, explorar, valoraciones, limite = 3) {
  const gustaron = libros.filter((libro) => valoraciones.get(libro.id) === 'si');
  const elegidos = [];
  const candidatos = libros.flatMap((libro) => {
    if (valoraciones.get(libro.id) === 'no') return [];
    const coincide = libro.g.some((genero) => generos.has(genero));
    const similar = gustaron.some((favorito) => favorito.id !== libro.id && (
      (libro.a && libro.a === favorito.a) ||
      (libro.p && libro.p === favorito.p) ||
      libro.g.some((genero) => favorito.g.includes(genero))
    ));
    const gusto = valoraciones.get(libro.id) === 'si';
    const razon = gusto ? 'gusto' : coincide ? 'genero' : similar ? 'afinidad' : 'catalogo';
    return [{ libro, coincide, razon, peso: Number(gusto) * 12 + Number(similar) * 3 }];
  });

  const coincidencias = generos.size ? candidatos.filter((c) => c.coincide) : candidatos;
  const otros = explorar && generos.size
    ? candidatos.filter((c) => !c.coincide && c.libro.g.length > 0)
    : [];
  const incluirExplorar = otros.length && limite > 0 && (limite > 1 || !coincidencias.length);
  const cupoAfin = incluirExplorar ? limite - 1 : limite;
  const puntaje = ({ libro, peso }) => peso
    - (libro.p && elegidos.some((c) => c.libro.p === libro.p) ? 2 : 0)
    - (explorar && elegidos.some((c) => c.libro.g.some((genero) => libro.g.includes(genero))) ? 2 : 0);
  const comparar = (a, b) => puntaje(b) - puntaje(a) || a.libro.i - b.libro.i;

  while (elegidos.length < cupoAfin && coincidencias.length) {
    coincidencias.sort(comparar);
    elegidos.push(coincidencias.shift());
  }
  if (incluirExplorar) {
    otros.sort(comparar);
    elegidos.push({ ...otros[0], razon: 'explorar' });
  }
  return elegidos;
}

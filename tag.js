// Rótulo de procedencia de una imagen: «Recreación IA» o «Foto real». Un solo origen de los textos; un tipo desconocido
// no tiene rótulo (`kindTag` devuelve null) y quien lo pide decide no mostrar esa imagen, nunca la presenta como IA o real por omisión.
export const KIND_LABEL = { ai: 'Recreación IA', real: 'Foto real' };

export const validKind = kind => (Object.hasOwn(KIND_LABEL, kind) ? kind : null);

export function kindTag(kind) {
  if (!validKind(kind)) return null;
  const tag = document.createElement('span');
  tag.className = `tag tag--${kind}`;
  tag.textContent = KIND_LABEL[kind];
  return tag;
}

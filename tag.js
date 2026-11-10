// Procedencia de una imagen: dato interno que no se imprime en la página. 'ai' = recreación, 'real' = fotografía.
// Vive en `data-kind` del marcado, en los temas de app.js y en assets/provenance.json. Una foto sin procedencia registrada no entra a las historias.
export const KINDS = ['ai', 'real'];

export const validKind = kind => (KINDS.includes(kind) ? kind : null);

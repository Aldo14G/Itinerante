'use client';
// Preguntas frecuentes de assets/data/faq.json con Collapsible de Astryx. Las respuestas traen enlaces en formato [texto](#ancla).
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { Fragment } from 'react';

function conEnlaces(texto: string) {
  const partes = texto.split(/(\[[^\]]+\]\([^)]+\))/g);
  return partes.map((p, i) => {
    const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
    return m ? (
      <a key={i} href={m[2]}>
        {m[1]}
      </a>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    );
  });
}

export function Faq({ preguntas }: { preguntas: Array<{ id: string; pregunta: string; respuesta: string }> }) {
  return (
    <div className="faq">
      {preguntas.map((p) => (
        <div key={p.id} id={`faq-${p.id}`} className="faq-item">
          <Collapsible trigger={<span className="faq-q">{p.pregunta}</span>}>
            <p className="faq-r">{conEnlaces(p.respuesta)}</p>
          </Collapsible>
        </div>
      ))}
    </div>
  );
}

// Aplica la consulta del catálogo sobre el HTML ya generado. La ruta de Next no puede
// importar react-dom/server; el render de React queda en el build (scripts/build-nuevo.mjs).
import { LIBROS, NEGOCIO, precioMXN, whatsapp, type Libro } from './datos';
import {
  compararLibros,
  hrefCatalogo,
  idsVisibles,
  librosConsulta,
  toggleValor,
  type Consulta,
} from './consulta';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cuenta(n: number): string {
  if (n === 0) return 'Sin resultados';
  return n === 1 ? '1 libro' : `${n} libros`;
}

function mensaje(l: Libro): string {
  return `Hola, ¿tienen disponible «${l.titulo}»${l.autor ? ` de ${l.autor}` : ''}${l.precio != null ? ` (${precioMXN(l.precio)})` : ''}?`;
}

function fichaDe(l: Libro): string {
  const attrs: Array<[string, string]> = [
    ['Autor', l.autor],
    ['Editorial', l.editorial],
    ['Género', l.genero],
    ['ISBN', l.isbn],
  ].filter((fila): fila is [string, string] => Boolean(fila[1]));
  const portada = l.portada
    ? `<img src="${esc(l.portada.src)}" alt="Portada de ${esc(l.titulo)}"/>`
    : `<div class="sin-portada" aria-hidden="true"><span>${esc(l.editorial ?? '')}</span><svg aria-hidden="true"><use href="#camioneta"></use></svg></div>`;
  return [
    `<div class="portada-hoja">${portada}</div>`,
    `<h2 id="hoja-t">${esc(l.titulo)}</h2>`,
    l.precio != null ? `<p class="precio">${esc(precioMXN(l.precio))}</p>` : '',
    attrs.length ? `<dl class="atributos">${attrs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '',
    l.sinopsis ? `<p class="sinopsis">${esc(l.sinopsis)}</p>` : '',
    `<a class="boton boton--tinta" href="${esc(whatsapp(mensaje(l)))}" target="_blank" rel="noopener noreferrer">Consultar disponibilidad por WhatsApp <svg aria-hidden="true"><use href="#i-sale"></use></svg></a>`,
  ].join('');
}

function tituloVacio(c: Consulta): string {
  const filtros = c.genero.length + c.editorial.length > 0;
  if (c.q && filtros) return `No encontramos libros para «${c.q}» con estos filtros`;
  if (c.q) return `No encontramos libros para «${c.q}»`;
  return 'Ningún libro cumple con estos filtros';
}

/** Reescribe el catálogo y, si viene ?libro=, la ficha, sobre el documento estático. */
export function aplicarConsultaHtml(html: string, c: Consulta): string {
  const visibles = idsVisibles(c);
  const porId = new Map<string, string>();
  const marca = '<ul class="rejilla" id="rejilla" role="list">';
  const desde = html.indexOf(marca);
  const hasta = html.indexOf('</ul>', desde);
  if (desde < 0 || hasta < 0) return html;
  const interior = html.slice(desde + marca.length, hasta);
  for (const m of interior.matchAll(/<li data-id="([^"]+)"([^>]*)>([\s\S]*?)<\/li>/g)) {
    porId.set(m[1], m[0]);
  }
  const orden = [...LIBROS].sort(compararLibros(c.orden));
  const piezas = orden.map((l) => {
    const li = porId.get(l.id);
    if (!li) return '';
    const abierto = li.replace(/\s*hidden=""/g, '');
    if (visibles.has(l.id)) return abierto;
    return abierto.replace(/<li\b([^>]*?)>/, '<li$1 hidden="">');
  }).join('');
  const ul = c.vista === 'lista'
    ? '<ul class="rejilla lista" id="rejilla" role="list">'
    : marca;
  html = html.slice(0, desde) + ul + piezas + html.slice(hasta);

  html = html.replace(/name="q" value="[^"]*"/, () => `name="q" value="${esc(c.q)}"`);
  if (c.genero.length && !html.includes('name="genero"')) {
    html = html.replace(
      /name="q" value="[^"]*"\/>/,
      (tag) => `${tag}<input type="hidden" name="genero" value="${esc([...c.genero].sort().join(','))}"/>`,
    );
  }
  if (c.editorial.length && !html.includes('name="editorial"')) {
    html = html.replace(
      /name="q" value="[^"]*"\/>/,
      (tag) => `${tag}<input type="hidden" name="editorial" value="${esc([...c.editorial].sort().join(','))}"/>`,
    );
  }

  html = html.replace(
    /<a class="pildora" role="button" href="[^"]*" data-campo="(genero|editorial)" data-v="([^"]*)" aria-pressed="(?:true|false)">/g,
    (_full, campo: string, valor: string) => {
      const lista = campo === 'genero' ? c.genero : c.editorial;
      const href = hrefCatalogo(c, campo === 'genero'
        ? { genero: toggleValor(c.genero, valor) }
        : { editorial: toggleValor(c.editorial, valor) });
      return `<a class="pildora" role="button" href="${esc(href)}" data-campo="${campo}" data-v="${esc(valor)}" aria-pressed="${lista.includes(valor)}">`;
    },
  );

  const n = librosConsulta(c).length;
  const etiqueta = cuenta(n);
  html = html.replace(/(id="conteo" role="status" aria-live="polite">)[^<]*/, `$1${etiqueta}`);
  html = html.replace(/(id="hf-ver">)[^<]*/, `$1${n ? `Ver ${etiqueta}` : 'Ver resultados'}`);

  html = html.replace(/<select id="orden" name="orden" form="busqueda">([\s\S]*?)<\/select>/, (_full, inner: string) => {
    const limpio = inner.replace(/ selected=""/g, '');
    const marcado = limpio.replace(`<option value="${c.orden}">`, `<option value="${c.orden}" selected="">`);
    return `<select id="orden" name="orden" form="busqueda">${marcado}</select>`;
  });

  for (const vista of ['rejilla', 'lista'] as const) {
    const id = vista === 'rejilla' ? 'vista-rejilla' : 'vista-lista';
    const href = hrefCatalogo(c, { vista });
    html = html.replace(
      new RegExp(`(<a id="${id}" role="button" href=")[^"]*(" aria-pressed=")(?:true|false)(")`),
      `$1${esc(href)}$2${c.vista === vista}$3`,
    );
  }

  const activos = c.genero.length + c.editorial.length;
  const limpiar = hrefCatalogo(c, { genero: [], editorial: [] });
  html = html.replace(
    /(<a class="limpiar" id="(?:limpiar|hf-limpiar)" href=")[^"]*(")( hidden="")?/g,
    (_f, a: string, b: string) => `${a}${esc(limpiar)}${b}${activos ? '' : ' hidden=""'}`,
  );

  if (n === 0) {
    html = html.replace('id="vacio" hidden=""', 'id="vacio"');
    html = html.replace(/(<h3 id="vacio-t">)[^<]*/, (_texto, prefijo) => prefijo + esc(tituloVacio(c)));
  }
  const sinQ = hrefCatalogo(c, { q: '' });
  const sinFiltros = hrefCatalogo(c, { genero: [], editorial: [], q: c.q });
  html = html.replace(
    /(<a class="boton boton--borde" id="vacio-borrar" href=")[^"]*(")( hidden="")?/,
    `$1${esc(sinQ)}$2${c.q ? '' : ' hidden=""'}`,
  );
  html = html.replace(
    /(<a class="boton boton--borde" id="vacio-quitar" href=")[^"]*(")( hidden="")?/,
    `$1${esc(sinFiltros)}$2${activos ? '' : ' hidden=""'}`,
  );
  html = html.replace(
    /(<a class="borrar" id="q-borrar" href=")[^"]*(" aria-label="Borrar búsqueda")( hidden="")?/,
    `$1${esc(sinQ)}$2${c.q ? '' : ' hidden=""'}`,
  );

  if (activos) {
    const chips = [
      ...c.genero.map((valor) => ({ campo: 'genero', valor, rotulo: rotuloDe(html, 'genero', valor) })),
      ...c.editorial.map((valor) => ({ campo: 'editorial', valor, rotulo: rotuloDe(html, 'editorial', valor) })),
    ];
    const items = chips.map((chip) => {
      const href = hrefCatalogo(c, chip.campo === 'genero'
        ? { genero: toggleValor(c.genero, chip.valor) }
        : { editorial: toggleValor(c.editorial, chip.valor) });
      return `<li><a href="${esc(href)}" data-campo="${chip.campo}" data-v="${esc(chip.valor)}" aria-label="Quitar filtro ${esc(chip.rotulo)}">${esc(chip.rotulo)}<svg aria-hidden="true"><use href="#i-cerrar"></use></svg></a></li>`;
    }).join('') + `<li><a class="quitar-todo" href="${esc(sinFiltros)}">Quitar filtros</a></li>`;
    html = html.replace(
      /<ul class="aplicados" id="aplicados" aria-label="Filtros aplicados" hidden="">[\s\S]*?<\/ul>/,
      `<ul class="aplicados" id="aplicados" aria-label="Filtros aplicados">${items}</ul>`,
    );
    html = html.replace(
      /<span class="insignia" id="n-activos" hidden="" aria-label="[^"]*"><\/span>/,
      `<span class="insignia" id="n-activos" aria-label="${activos === 1 ? '1 activo' : `${activos} activos`}">${activos}</span>`,
    );
  }

  if (c.libro) {
    const libro = LIBROS.find((l) => l.id === c.libro);
    if (libro) {
      const cerrar = hrefCatalogo(c, { libro: null }).replace(/#libros$/, '') || '/nuevo';
      html = html.replace('<div class="velo" id="velo"></div>', '<div class="velo abierto" id="velo"></div>');
      html = html.replace(
        /<div class="hoja" id="hoja" role="dialog" aria-modal="true" aria-labelledby="hoja-t" hidden="">[\s\S]*?<div id="hoja-cuerpo">[\s\S]*?<\/div><\/div>/,
        `<div class="hoja abierta" id="hoja" role="dialog" aria-modal="true" aria-labelledby="hoja-t"><a class="cerrar" id="hoja-cerrar" href="${esc(cerrar)}" aria-label="Cerrar ficha"><svg aria-hidden="true"><use href="#i-cerrar"></use></svg></a><div id="hoja-cuerpo">${fichaDe(libro)}</div></div>`,
      );
    }
  }
  return html;
}

function rotuloDe(html: string, campo: string, valor: string): string {
  const re = new RegExp(`data-campo="${campo}" data-v="${valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" aria-pressed="(?:true|false)"><span>([^<]*)</span>`);
  return html.match(re)?.[1] ?? valor;
}

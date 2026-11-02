// Cargas únicas de los datos de muestra: las comparten el catálogo, el carrusel, Novedades y «Mi lista».
const once = url => {
  let promise;
  return () => (promise ??= fetch(url)
    .then(res => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
    .catch(err => { promise = undefined; throw err; }));
};

export const loadSample = once('assets/data/catalog.json');
// Colecciones del carrusel y la tira «Recién llegados» (`novedades`): assets/data/collections.json.
export const loadCollections = once('assets/data/collections.json');

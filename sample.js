// Carga única de la muestra (assets/data/catalog.json): la comparten el catálogo, el carrusel y «Mi lista».
let samplePromise;

export function loadSample() {
  samplePromise ??= fetch('assets/data/catalog.json')
    .then(res => { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
    .catch(err => { samplePromise = undefined; throw err; });
  return samplePromise;
}

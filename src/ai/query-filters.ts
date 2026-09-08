import { CATEGORIES, SUBGENRES } from "@/config/taxonomy";

interface CategoryEntry {
  slug: string;
  name: string;
}

interface SubgenreEntry {
  slug: string;
  name: string;
  categoryId: string;
}

const categories: CategoryEntry[] = CATEGORIES;
const subgenres: SubgenreEntry[] = SUBGENRES;

export interface ControlledFilters {
  categorySlug?: string;
  subgenreSlug?: string;
}

const EXTRA_CATEGORY_ALIASES: Record<string, string[]> = {
  fiction: ["ficcion", "literatura", "fantasia"],
  essay: ["ensayo", "filosofia"],
  history: ["historia", "cronica", "biografia", "memoria"],
  psychology: ["psicologia", "habitos", "autoayuda", "crianza"],
  children: ["infantil", "juvenil", "ninos", "album"],
  arts: ["arte", "fotografia", "diseno", "ilustracion"],
  science: ["ciencia", "cocina", "recetas", "naturaleza"],
};

function fold(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function tokenSet(...phrases: string[]) {
  const out = new Set<string>();
  for (const phrase of phrases) {
    for (const token of fold(phrase).split(/[^a-z]+/)) {
      if (token.length >= 3) out.add(token);
    }
  }
  return out;
}

function queryTokens(query: string) {
  const words = tokenSet(query);
  for (const word of [...words]) {
    if (word.endsWith("es") && word.length > 4) words.add(word.slice(0, -2));
    if (word.endsWith("s") && word.length > 3) words.add(word.slice(0, -1));
  }
  return words;
}

function best<T extends { slug: string }>(words: Set<string>, entries: T[], vocabulary: (entry: T) => Set<string>) {
  let winner: T | undefined;
  let bestKey = "";
  for (const entry of entries) {
    const vocab = vocabulary(entry);
    let matched = 0;
    for (const word of words) {
      if (vocab.has(word)) matched += 1;
    }
    if (matched === 0 || vocab.size === 0) continue;
    // Cobertura primero (1/1 vence a 1/2), luego conteo, luego especificidad.
    const coverage = Math.floor((matched / vocab.size) * 1000);
    const key = `${String(coverage).padStart(4, "0")}:${String(matched).padStart(4, "0")}:${String(entry.slug.length).padStart(4, "0")}`;
    if (!winner || key > bestKey) {
      winner = entry;
      bestKey = key;
    }
  }
  return winner;
}

/**
 * Lenguaje controlado en la consulta: mapea menciones en español a slugs
 * canonicos sin LLM. El subgenero manda sobre la categoria (es mas
 * especifico); la categoria se deriva de el para no contradecirlo.
 */
export function extractControlledFilters(query: string): ControlledFilters {
  if (!query || query.trim().length < 3) return {};
  const words = queryTokens(query);

  const category = best(words, categories, ({ slug, name }) =>
    tokenSet(slug, name, ...(EXTRA_CATEGORY_ALIASES[slug] ?? [])));
  const categorySlug = category?.slug;

  const subgenre = best(words, subgenres, ({ slug, name }) => tokenSet(slug, name));
  const subgenreSlug = subgenre?.slug;

  if (subgenreSlug) {
    const owner = subgenres.find((sub) => sub.slug === subgenreSlug)?.categoryId;
    return { categorySlug: owner, subgenreSlug };
  }
  if (categorySlug) return { categorySlug };
  return {};
}

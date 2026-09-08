import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadTaxonomy() {
  const path = join(process.cwd(), "data", "taxonomy.controlled.json");
  return JSON.parse(readFileSync(path, "utf8"));
}

const taxonomy = loadTaxonomy();

export const TAXONOMY_VERSION = taxonomy.schemaVersion;
export const TAXONOMY_SOURCE = taxonomy.source;
export const CATEGORIES = taxonomy.categories;
export const SUBGENRES = taxonomy.subgenres;

const CATEGORY_SLUGS = new Set(CATEGORIES.map(({ slug }) => slug));
const SUBGENRE_SLUGS = new Set(SUBGENRES.map(({ slug }) => slug));
const SUBGENRE_BY_SLUG = new Map(SUBGENRES.map((sub) => [sub.slug, sub]));

export function isKnownCategorySlug(slug) {
  return typeof slug === "string" && CATEGORY_SLUGS.has(slug);
}

export function isKnownSubgenreSlug(slug) {
  return typeof slug === "string" && SUBGENRE_SLUGS.has(slug);
}

export function subgenresOf(categorySlug) {
  return SUBGENRES.filter((sub) => sub.categoryId === categorySlug);
}

/**
 * Lenguaje controlado: valida category/subgenre contra la taxonomía v1.
 * Devuelve { filters } o { error } (error listo para un 400 con vocabulario).
 */
export function parseCatalogFilters(searchParams) {
  const category = searchParams.get("category")?.trim() || undefined;
  const subgenre = searchParams.get("subgenre")?.trim() || undefined;

  if (category !== undefined && !isKnownCategorySlug(category)) {
    return { error: { code: "unknown-category", message: `Categoría desconocida: ${category}.` } };
  }
  if (subgenre !== undefined && !isKnownSubgenreSlug(subgenre)) {
    return { error: { code: "unknown-subgenre", message: `Subgénero desconocido: ${subgenre}.` } };
  }
  if (category !== undefined && subgenre !== undefined
    && SUBGENRE_BY_SLUG.get(subgenre)?.categoryId !== category) {
    return { error: { code: "category-subgenre-mismatch", message: `El subgénero ${subgenre} no pertenece a ${category}.` } };
  }
  return { filters: { categorySlug: category, subgenreSlug: subgenre } };
}

export function vocabularyPayload() {
  return {
    version: TAXONOMY_VERSION,
    categories: CATEGORIES.map(({ slug, name }) => ({ slug, name })),
    subgenres: SUBGENRES.map(({ slug, name, categoryId }) => ({ slug, name, category: categoryId })),
  };
}

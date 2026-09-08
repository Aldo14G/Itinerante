import { ai, z } from "./genkit";
import {
  filterTestBooksRaw,
  getTestBookBySlugRaw,
  recommendTestBooks,
} from "@/lib/test-catalog";

export const searchTestBooks = ai.defineTool(
  {
    name: "searchTestBooks",
    description: "Busca por similitud en un dataset local de prueba sin consultar otro modelo.",
    inputSchema: z.object({
      query: z.string(),
      datasetKey: z.string(),
      categorySlug: z.string().optional(),
      subgenreSlug: z.string().optional(),
      limit: z.number().int().min(1).max(20).default(8),
    }),
  },
  ({ query, datasetKey, categorySlug, subgenreSlug, limit }) =>
    recommendTestBooks(query, datasetKey, limit, { categorySlug, subgenreSlug })
);

export const getTestBookBySlug = ai.defineTool(
  {
    name: "getTestBookBySlug",
    description: "Confirma una ficha exacta dentro de un dataset local de prueba.",
    inputSchema: z.object({
      slug: z.string(),
      datasetKey: z.string(),
    }),
  },
  ({ slug, datasetKey }) => getTestBookBySlugRaw(slug, datasetKey)
);

export const filterTestBooks = ai.defineTool(
  {
    name: "filterTestBooks",
    description: "Filtra metadata externa de prueba por genero, formato, rating o precio USD de referencia.",
    inputSchema: z.object({
      datasetKey: z.string(),
      categorySlugs: z.array(z.string()).optional(),
      subgenreSlugs: z.array(z.string()).optional(),
      formats: z.array(z.string()).optional(),
      minSourceRating: z.number().min(0).max(5).optional(),
      maxReferencePriceUsdCents: z.number().int().nonnegative().optional(),
      limit: z.number().int().min(1).max(30).default(15),
    }),
  },
  (variables) => filterTestBooksRaw(variables)
);

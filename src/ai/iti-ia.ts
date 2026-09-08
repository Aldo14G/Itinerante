import { MessageSchema } from "genkit";
import { catalogDataset } from "@/config/catalog-mode";
import {
  CatalogUnavailableError,
  recommendTestBooks,
  searchInventoryBooks,
  searchInventoryBooksByVector,
} from "@/lib/test-catalog";
import { extractControlledFilters } from "./query-filters";
import { buildQuestionMessage, buildRecommendationMessage } from "./iti-ia-response";
import {
  ai,
  fallbackModelName,
  itiIaFallbackModel,
  itiIaModel,
  itiIaPrimaryModel,
  itiIaSelectionSchema,
  z,
} from "./genkit";

const itiIaPrompt = ai.prompt("iti-ia");

function modelTimeoutMs() {
  const configured = Number(process.env.ITI_IA_MODEL_TIMEOUT_MS ?? 5_000);
  return Number.isFinite(configured) ? Math.min(30_000, Math.max(3_000, configured)) : 5_000;
}

function lastUserText(messages: Array<z.infer<typeof MessageSchema>>) {
  const message = messages.findLast((item) => item.role === "user");
  return message?.content
    .map((part) => typeof part.text === "string" ? part.text : "")
    .join(" ")
    .trim()
    .slice(0, 500) ?? "";
}

export function isFallbackEligibleError(error: unknown) {
  return /UNAVAILABLE|RESOURCE_EXHAUSTED|429|503|high demand|quota exceeded|aborted|aborterror|timeout/i.test(String(error));
}

async function chooseSlugs(
  query: string,
  datasetKey: string,
  candidates: Awaited<ReturnType<typeof searchInventoryBooks>>,
) {
  const promptInput = {
    now: new Date().toISOString(),
    datasetKey,
    catalogMode: datasetKey === "inventory" ? "inventory" : "test",
    query,
    candidatesJson: JSON.stringify(candidates.map((book) => ({
      slug: book.slug,
      title: book.title,
      description: book.description,
      author: book.contributors?.map((item) => item.author?.fullName).filter(Boolean).join(", "),
      editorial: book.editorial?.name,
      category: book.subgenre.category.name,
      subgenre: book.subgenre.name,
      format: book.format,
      tags: book.tags,
      priceMxnCents: book.priceMxnCents,
      stockQty: book.stockQty,
    }))),
  };
  const run = async (model: typeof itiIaPrimaryModel) => {
    const response = await itiIaPrompt(promptInput, {
      model,
      output: { schema: itiIaSelectionSchema },
      config: {
        maxOutputTokens: 256,
        thinkingConfig: { thinkingLevel: "LOW" as const },
      },
      abortSignal: AbortSignal.timeout(modelTimeoutMs()),
    });
    return response.output?.slugs ?? [];
  };

  try {
    return { slugs: await run(itiIaPrimaryModel), modelAvailable: true };
  } catch (error) {
    if (!isFallbackEligibleError(error) || fallbackModelName === itiIaModel) throw error;
    console.warn(`Iti IA: ${itiIaModel} no disponible; probando ${fallbackModelName}.`);
    return { slugs: await run(itiIaFallbackModel), modelAvailable: true };
  }
}

export const itiIaFlow = ai.defineFlow(
  {
    name: "itiIa",
    inputSchema: z.object({ messages: z.array(MessageSchema).min(1).max(20) }),
    outputSchema: z.array(MessageSchema),
  },
  async ({ messages }) => {
    const query = lastUserText(messages);
    if (query.length < 3) {
      return [MessageSchema.parse(buildQuestionMessage("Cuéntame qué tema, autora o tipo de lectura buscas."))];
    }

    const datasetKey = catalogDataset();
    const controlled = extractControlledFilters(query);
    // Embeddings de inventario: "vertex" (text-embedding-005, requiere
    // facturacion) o "gemini" (gemini-embedding-001, capa gratuita).
    const inventoryEmbeddings = (process.env.INVENTORY_EMBEDDINGS ?? "vertex").toLowerCase();
    let candidates;
    try {
      candidates = datasetKey === "inventory"
        ? inventoryEmbeddings === "gemini"
          ? await searchInventoryBooksByVector(query, 8, controlled)
          : await searchInventoryBooks(query, 8, controlled)
        : await recommendTestBooks(query, datasetKey, 8, controlled);
      if (!candidates.length && Object.keys(controlled).length) {
        candidates = datasetKey === "inventory"
          ? inventoryEmbeddings === "gemini"
            ? await searchInventoryBooksByVector(query, 8)
            : await searchInventoryBooks(query, 8)
          : await recommendTestBooks(query, datasetKey, 8);
      }
    } catch (error) {
      if (error instanceof CatalogUnavailableError) {
        console.error("[iti-ia] Data Connect no disponible", error.cause);
        return [MessageSchema.parse({
          role: "model",
          content: [{ text: "No pude consultar el catálogo en este momento. Intenta de nuevo en unos minutos." }],
        })];
      }
      throw error;
    }

    if (!candidates.length) {
      return [MessageSchema.parse(buildQuestionMessage(
        `No encontré libros que coincidan con “${query}” en este catálogo. Prueba con otro tema, título o autor.`,
      ))];
    }

    let selection = { slugs: [] as string[], modelAvailable: false };
    if (process.env.GEMINI_API_KEY) {
      try {
        selection = await chooseSlugs(query, datasetKey, candidates);
      } catch (error) {
        console.warn("Iti IA: selección LLM no disponible; usando ranking grounded.", String(error));
      }
    }

    return [MessageSchema.parse(buildRecommendationMessage(candidates, selection.slugs, {
      datasetKey,
      modelAvailable: selection.modelAvailable,
    }))];
  },
);

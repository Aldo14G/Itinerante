// POST /api/ai/iti-ia en el Worker. Misma salida que el flujo de Genkit ({ result: [mensaje] }):
// la recuperación es local y la selección con Gemini es opcional (sin GEMINI_API_KEY queda el ranking local).
import { extractControlledFilters } from "../src/ai/query-filters";
import { readLimitedText } from "../src/lib/api-guard";
import { buildQuestionMessage, buildRecommendationMessage } from "../src/ai/iti-ia-response.js";
import { rankTestBooks } from "../src/lib/local-test-search.js";
import { filterCatalogBooks, type CatalogBookRecord } from "../src/lib/catalog-core";
import { TEST_CATALOG_DATASET } from "../src/config/catalog-mode.js";
import { testBooks } from "./catalog";
import type { Env } from "./env";

const NO_STORE = { "Cache-Control": "no-store" };
const SYSTEM_PROMPT = `Eres el selector grounded de Iti IA para Libreria Itinerante y Mas. Recibes una consulta y candidatos ya recuperados por el backend desde el catálogo. Devuelve exclusivamente entre uno y tres slugs presentes en los candidatos, en orden de afinidad con la consulta. No escribas prosa ni agregues datos.

No inventes premios, citas ni argumentos, precio o disponibilidad. Si los candidatos no bastan, conserva los mas cercanos: el backend valida cada slug y aplica la regla "No encontre coincidencias verificables" antes de mostrar nada.`;

type Part = { text?: unknown };
type Message = { role?: unknown; content?: Part[] };

function lastUserText(messages: Message[]) {
  const message = [...messages].reverse().find((item) => item?.role === "user");
  return (message?.content ?? []).map((part) => (typeof part?.text === "string" ? part.text : "")).join(" ").trim().slice(0, 500);
}

function timeoutMs(env: Env) {
  const configured = Number(env.ITI_IA_MODEL_TIMEOUT_MS ?? 5_000);
  return Number.isFinite(configured) ? Math.min(30_000, Math.max(3_000, configured)) : 5_000;
}

function modelError(status: number) {
  return new Error(`gemini_${status}`);
}

async function askGemini(model: string, env: Env, query: string, candidates: CatalogBookRecord[]) {
  const userPrompt = [
    `Fecha: ${new Date().toISOString()}`,
    `Dataset: ${TEST_CATALOG_DATASET}`,
    "Modo: test",
    `Consulta: ${query}`,
    "Candidatos JSON:",
    JSON.stringify(candidates.map((book) => ({
      slug: book.slug,
      title: book.title,
      description: book.description,
      author: book.contributors?.map((item) => item.author?.fullName).filter(Boolean).join(", "),
      editorial: book.editorial?.name,
      category: book.subgenre.category.name,
      subgenre: book.subgenre.name,
      format: book.format,
      tags: book.tags,
    }))),
  ].join("\n");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY ?? "" },
    signal: AbortSignal.timeout(timeoutMs(env)),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        maxOutputTokens: 256,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: { slugs: { type: "ARRAY", items: { type: "STRING" }, minItems: 1, maxItems: 3 } },
          required: ["slugs"],
        },
      },
    }),
  });
  if (!response.ok) throw modelError(response.status);
  const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  const slugs = (JSON.parse(text) as { slugs?: unknown }).slugs;
  return Array.isArray(slugs) ? slugs.filter((slug): slug is string => typeof slug === "string") : [];
}

export async function chooseSlugs(env: Env, query: string, candidates: CatalogBookRecord[]) {
  if (!env.GEMINI_API_KEY) return { slugs: [] as string[], modelAvailable: false };
  const primary = env.ITI_IA_MODEL ?? "gemini-3.6-flash";
  const fallback = env.ITI_IA_FALLBACK_MODEL ?? "gemini-3.1-flash-lite";
  try {
    return { slugs: await askGemini(primary, env, query, candidates), modelAvailable: true };
  } catch (error) {
    if (!/gemini_(429|500|503)|timeout|abort/i.test(String(error)) || fallback === primary) {
      console.warn("Iti IA: selección del modelo no disponible; usando ranking local.", String(error));
      return { slugs: [] as string[], modelAvailable: false };
    }
    try {
      return { slugs: await askGemini(fallback, env, query, candidates), modelAvailable: true };
    } catch (second) {
      console.warn("Iti IA: modelo de respaldo no disponible; usando ranking local.", String(second));
      return { slugs: [] as string[], modelAvailable: false };
    }
  }
}

export async function handleItiIa(request: Request, env: Env): Promise<Response> {
  let messages: Message[];
  const maxBytes = Number(env.ITI_IA_MAX_BODY_BYTES) > 0 ? Number(env.ITI_IA_MAX_BODY_BYTES) : 8_192;
  const raw = await readLimitedText(request, maxBytes);
  if (raw === null) return Response.json({ error: "La consulta es demasiado larga." }, { status: 413, headers: NO_STORE });
  try {
    const body = JSON.parse(raw) as { data?: { messages?: Message[] } };
    messages = body?.data?.messages ?? [];
  } catch {
    return Response.json({ error: "Solicitud no válida." }, { status: 400, headers: NO_STORE });
  }
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20) {
    return Response.json({ error: "Solicitud no válida." }, { status: 400, headers: NO_STORE });
  }

  const reply = (message: unknown) => Response.json({ result: [message] }, { headers: NO_STORE });
  const query = lastUserText(messages);
  if (query.length < 3) return reply(buildQuestionMessage("Cuéntame qué tema, autora o tipo de lectura buscas."));

  const books = testBooks();
  if (!books.length) {
    return reply({ role: "model", content: [{ text: "No pude consultar el catálogo en este momento. Intenta de nuevo en unos minutos." }] });
  }
  const controlled = extractControlledFilters(query);
  const rank = (filters = {}) => rankTestBooks(query, filterCatalogBooks(books, filters), []).slice(0, 8) as CatalogBookRecord[];
  let candidates = rank(controlled);
  if (!candidates.length && Object.keys(controlled).length) candidates = rank();
  if (!candidates.length) {
    return reply(buildQuestionMessage(`No encontré libros que coincidan con “${query}” en este catálogo. Prueba con otro tema, título o autor.`));
  }

  const selection = await chooseSlugs(env, query, candidates);
  return reply(buildRecommendationMessage(candidates, selection.slugs, { datasetKey: TEST_CATALOG_DATASET, modelAvailable: selection.modelAvailable }));
}

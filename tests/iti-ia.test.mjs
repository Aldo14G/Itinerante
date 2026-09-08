import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { rankTestBooks } from "../src/lib/local-test-search.js";
import { safeCoverUrl } from "../src/lib/cover-url.js";
import { buildRecommendationMessage, groundedSelection } from "../src/ai/iti-ia-response.js";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const route = readFileSync(join(root, "src", "app", "api", "ai", "iti-ia", "route.ts"), "utf8");
const catalogRoute = readFileSync(join(root, "src", "app", "api", "catalog", "route.ts"), "utf8");
const flow = readFileSync(join(root, "src", "ai", "iti-ia.ts"), "utf8");
const prompt = readFileSync(join(root, "src", "ai", "prompts", "iti-ia.prompt"), "utf8");

const books = [
  { title: "Project Hail Mary", genre: "Fiction", tags: ["Science Fiction"], contributors: [{ author: { fullName: "Andy Weir" } }], sourceRank: 3 },
  { title: "Atomic Habits", genre: "Non-Fiction", tags: ["Self-Help / Productivity"], contributors: [{ author: { fullName: "James Clear" } }], sourceRank: 5 },
  { title: "The Housemaid", genre: "Fiction", tags: ["Psychological Thriller"], contributors: [{ author: { fullName: "Freida McFadden" } }], sourceRank: 21 },
  { title: "Dog Man", genre: "Fiction", tags: ["Children's / Graphic Novel"], contributors: [{ author: { fullName: "Dav Pilkey" } }], sourceRank: 11 },
];

test("gold set bilingue prioriza metadata recuperada", () => {
  assert.equal(rankTestBooks("ciencia ficcion espacial", books)[0].title, "Project Hail Mary");
  assert.equal(rankTestBooks("habitos y productividad", books)[0].title, "Atomic Habits");
  assert.equal(rankTestBooks("misterio thriller psicologico", books)[0].title, "The Housemaid");
  assert.equal(rankTestBooks("libro infantil grafico", books)[0].title, "Dog Man");
});

test("el ranking usa la proyeccion de busqueda derivada", () => {
  const projected = [{
    title: "Titulo neutro",
    genre: "Fiction",
    tags: [],
    contributors: [],
    searchText: "poesia verso lirica",
  }];
  assert.equal(rankTestBooks("poesia", projected)[0].title, "Titulo neutro");
});

test("consultas breves en español conservan intención semántica", () => {
  const projected = [
    { title: "Versos", genre: "Poetry", tags: [], contributors: [], searchText: "poetry lyrical verse", sourceRank: 1 },
    { title: "La mente", genre: "Non-Fiction", tags: ["Psychology / Health"], contributors: [], sourceRank: 2 },
    { title: "Un romance", genre: "Fiction", tags: ["Contemporary Romance"], contributors: [], sourceRank: 0 },
    { title: "Dragones", genre: "Fiction", tags: ["Romantasy"], contributors: [], sourceRank: 3 },
  ];
  assert.equal(rankTestBooks("Poesía", projected)[0].title, "Versos");
  assert.equal(rankTestBooks("Psicología", projected)[0].title, "La mente");
  assert.equal(rankTestBooks("Fantasía", projected)[0].title, "Dragones");
});

test("portadas solo aceptan rutas locales o HTTPS", () => {
  assert.equal(safeCoverUrl("/images/book.webp"), "/images/book.webp");
  assert.equal(safeCoverUrl("https://covers.openlibrary.org/b/id/1-M.jpg"), "https://covers.openlibrary.org/b/id/1-M.jpg");
  assert.equal(safeCoverUrl("javascript:alert(1)"), null);
  assert.equal(safeCoverUrl("http://inseguro.test/cover.jpg"), null);
});

test("ruta interna Iti IA conserva grounding sin convertirse en otra interfaz", () => {
  assert.match(route, /appRoute\(itiIaFlow/);
  assert.match(flow, /catalogDataset/);
  assert.match(flow, /recommendTestBooks|searchInventoryBooks/);
  assert.match(prompt, /No encontre coincidencias verificables/);
  assert.doesNotMatch(route, /Fallback simulado|2666-roberto-bolano|Sommelier/);
});

test("modo demo tambien pasa por el flujo LLM de Iti IA", () => {
  assert.doesNotMatch(route, /localTestPost|recommendTestBooks|toBookView/);
  assert.match(route, /appRoute\(itiIaFlow/);
});

test("la seleccion estructurada descarta slugs no recuperados y conserva evidencia exacta", () => {
  const candidates = [{
    slug: "dune",
    title: "Dune",
    datasetKey: "amazon-bestsellers-500",
    sourceLabel: "fixture.csv",
    sourceUrl: "https://openlibrary.org/works/OL893414W",
    verifiedAt: "2026-08-25T00:00:00.000Z",
    stockQty: 0,
    priceMxnCents: null,
    format: "Tapa blanda",
    subgenre: { name: "Science Fiction", category: { name: "Fiction" } },
    contributors: [{ author: { fullName: "Frank Herbert" } }],
  }];
  assert.deepEqual(groundedSelection(candidates, ["inventado", "dune", "dune"]), candidates);
  const message = buildRecommendationMessage(candidates, ["inventado", "dune"], {
    datasetKey: "amazon-bestsellers-500",
    modelAvailable: false,
  });
  const recommendation = message.content.find((part) => part.toolRequest)?.toolRequest.input.recommendedBooks[0];
  assert.equal(recommendation.slug, "dune");
  assert.equal(recommendation.sourceUrl, candidates[0].sourceUrl);
  assert.equal(recommendation.isTestData, true);
  assert.equal("whatsappPrefill" in recommendation, false);
  assert.equal(message.content[0].text, 'Encontré una opción en el catálogo:');
  assert.doesNotMatch(message.content[0].text, /modelo|selecci[oó]n conversacional|ranking|proceso/i);
});

test("la busqueda publica delega en la recuperacion compartida", () => {
  assert.match(catalogRoute, /searchParams\.get\("q"\)/);
  assert.match(catalogRoute, /catalogDataset/);
  assert.match(catalogRoute, /recommendTestBooks\(query, datasetKey, 500, filters\)/);
  assert.match(catalogRoute, /searchInventoryBooks\(query, 500\)/);
  assert.match(catalogRoute, /catalogFacets/);
  assert.match(catalogRoute, /categorySlug/);
  assert.match(catalogRoute, /Math\.min\(60/);
});

test("Genkit usa Google GenAI y limites conservadores configurables", () => {
  const genkit = readFileSync(join(root, "src", "ai", "genkit.ts"), "utf8");
  const flow = readFileSync(join(root, "src", "ai", "iti-ia.ts"), "utf8");
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(packageJson.dependencies["@genkit-ai/google-genai"], "1.41.0");
  assert.equal(packageJson.dependencies["@genkit-ai/vertexai"], undefined);
  assert.match(genkit, /@genkit-ai\/google-genai/);
  assert.match(genkit, /googleAI\(\)/);
  assert.match(genkit, /gemini-3\.6-flash/);
  assert.match(genkit, /ITI_IA_MODEL/);
  assert.match(flow, /GEMINI_API_KEY/);
  assert.doesNotMatch(genkit, /@genkit-ai\/vertexai|vertexAI/);
  assert.doesNotMatch(flow, /temperature:|topP:|topK:/,
    "Gemini 3.7 no debe recibir parametros de muestreo obsoletos");
  assert.match(flow, /thinkingConfig: \{ thinkingLevel: "LOW"(?: as const)? \}/);
  assert.match(flow, /maxOutputTokens: 256/);
  assert.match(flow, /AbortSignal\.timeout/);
  assert.match(flow, /ITI_IA_MODEL_TIMEOUT_MS/);
  assert.match(flow, /output: \{ schema:/);
  assert.doesNotMatch(flow, /maxTurns|toolChoice|retry\(/,
    "la seleccion grounded debe requerir una sola llamada acotada, no un bucle de herramientas");
});

test("Iti IA usa 3.6 y un respaldo comprobado con espera acotada", () => {
  const genkit = readFileSync(join(root, "src", "ai", "genkit.ts"), "utf8");
  assert.match(genkit, /ITI_IA_MODEL\s*\?\?\s*"gemini-3\.6-flash"/);
  assert.match(genkit, /ITI_IA_FALLBACK_MODEL\s*\?\?\s*"gemini-3\.1-flash-lite"/);
  assert.match(flow, /isFallbackEligibleError/);
  assert.match(flow, /RESOURCE_EXHAUSTED\|429/);
  assert.match(flow, /itiIaFallbackModel/);
  assert.match(flow, /fallbackModelName === itiIaModel/);
  assert.doesNotMatch(flow, /gemini-3\.[56]-flash/,
    "el fallback debe declararse en la configuracion central, no incrustarse en el flujo");
});

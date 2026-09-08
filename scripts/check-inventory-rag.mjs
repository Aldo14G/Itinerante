// Gate vivo: Iti IA de extremo a extremo sobre inventario real.
// Requiere stack con inventario sembrado (LOCAL_STACK_KEEP=1 + INVENTORY_PATH)
// y las env: DATA_CONNECT_EMULATOR_HOST, ITI_IA_DATASET=inventory,
// INVENTORY_EMBEDDINGS=gemini, GEMINI_API_KEY (via .env.local).
// Uso: node --import tsx/esm scripts/check-inventory-rag.mjs "tu consulta"
import { strict as assert } from "node:assert";
import { loadLocalEnv } from "./load-env.mjs";

await loadLocalEnv();
assert(process.env.DATA_CONNECT_EMULATOR_HOST, "falta DATA_CONNECT_EMULATOR_HOST (stack vivo)");
assert.equal(process.env.ITI_IA_DATASET, "inventory", "ITI_IA_DATASET debe ser inventory");

const { itiIaFlow } = await import("../src/ai/iti-ia.ts");
const { extractControlledFilters } = await import("../src/ai/query-filters.ts");
const query = process.argv[2] ?? "novela mexicana pueblo memoria";
console.log("controlled:", JSON.stringify(extractControlledFilters(query)));
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? `len ${process.env.GEMINI_API_KEY.length}` : "MISSING");
const output = await itiIaFlow({ messages: [{ role: "user", content: [{ text: query }] }] });
const dump = JSON.stringify(output);
const text = output.map((m) => m.content.map((p) => p.text ?? "").join(" ")).join("\n");
console.log(JSON.stringify({ query, text }, null, 2));
assert.match(dump, /pedro-paramo-juan-rulfo/i, "Iti IA no recomendo la ficha piloto");
assert.match(dump, /Pedro Páramo/i, "recomendacion sin titulo verificable");
assert.match(dump, /fondodeculturaeconomica/i, "recomendacion sin fuente verificable");
assert.match(dump, /"isTestData":false/, "la ficha real debe marcarse como inventario, no prueba");
console.log("RAG inventario OK: recomendacion grounded sobre ficha real.");

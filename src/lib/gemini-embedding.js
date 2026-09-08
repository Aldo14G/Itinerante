const MODEL = "gemini-embedding-001";
const DIMENSIONS = 768;

function apiKey(env = process.env) {
  const key = env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("Falta GEMINI_API_KEY para embeddings (capa gratuita de Gemini API)");
  return key;
}

/**
 * Embeddings de 768 dimensiones via Gemini Developer API (capa gratuita).
 * Mismo espacio vectorial para catalogo y consultas: no mezclar con
 * text-embedding-005 de Vertex en el mismo dataset.
 */
export async function embedGemini(text, { taskType, timeoutMs = 30000 } = {}, env = process.env) {
  const input = String(text ?? "").slice(0, 8000);
  if (!input.trim()) throw new Error("texto vacio para embedding");
  const body = { content: { parts: [{ text: input }] }, outputDimensionality: DIMENSIONS };
  if (taskType) body.taskType = taskType;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent?key=${apiKey(env)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    },
  );
  if (!response.ok) {
    throw new Error(`Gemini embedding fallo: HTTP ${response.status} ${(await response.text()).slice(0, 200)}`);
  }
  const data = await response.json();
  const values = data?.embedding?.values;
  if (!Array.isArray(values) || values.length !== DIMENSIONS) {
    throw new Error(`embedding inesperado: ${values?.length ?? 0} dimensiones`);
  }
  return values;
}

export const GEMINI_EMBEDDING_MODEL = MODEL;
export const GEMINI_EMBEDDING_DIMENSIONS = DIMENSIONS;

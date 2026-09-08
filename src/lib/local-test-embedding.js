import { localSearchTerms } from "./local-test-search.js";

export const LOCAL_TEST_VECTOR_SIZE = 768;

function hash(value, seed) {
  let result = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

/**
 * Embedding lexical determinista para pruebas locales. No sustituye un modelo
 * semantico en produccion; permite validar pgvector sin llamar a Vertex AI.
 * @param {string} text
 * @returns {number[]}
 */
export function localTestEmbedding(text) {
  const words = localSearchTerms(text);
  const terms = [...words, ...words.slice(0, -1).map((word, index) => `${word}_${words[index + 1]}`)];
  const counts = new Map();
  for (const term of terms) counts.set(term, (counts.get(term) ?? 0) + 1);

  const vector = Array(LOCAL_TEST_VECTOR_SIZE).fill(0);
  for (const [term, count] of counts) {
    const index = hash(term, 2166136261) % LOCAL_TEST_VECTOR_SIZE;
    const sign = hash(term, 2246822519) % 2 === 0 ? 1 : -1;
    vector[index] += sign * (1 + Math.log(count));
  }
  const norm = Math.hypot(...vector);
  return norm === 0 ? vector : vector.map((value) => Number((value / norm).toFixed(8)));
}

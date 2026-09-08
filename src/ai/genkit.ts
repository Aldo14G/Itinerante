import { genkit, z } from "genkit/beta";
import { googleAI } from "@genkit-ai/google-genai";

export const itiIaModel = process.env.ITI_IA_MODEL ?? "gemini-3.6-flash";
export const fallbackModelName = process.env.ITI_IA_FALLBACK_MODEL ?? "gemini-3.1-flash-lite";
export const itiIaPrimaryModel = googleAI.model(itiIaModel);
export const itiIaFallbackModel = googleAI.model(fallbackModelName);

export const ai = genkit({
  plugins: [googleAI()],
  model: itiIaPrimaryModel,
  promptDir: "src/ai/prompts",
});

export const itiIaSelectionSchema = z.object({
  slugs: z.array(z.string()).min(1).max(3),
});

export { z };

import { env } from "../config/env.js";
import { OpenRouter } from "@openrouter/sdk";

const apiKey = env.OPENROUTER_API_KEY;
export const model = env.OPENROUTER_MODEL;

if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY is missing. Add it to .env.");
}
if (!model) {
  throw new Error("OPENROUTER_MODEL is missing. Add a current model ID to .env.");
}

export const ai = new OpenRouter({ apiKey });
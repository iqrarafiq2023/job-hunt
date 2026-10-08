import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
});

const modelIds = [process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODEL].filter(
  Boolean
) as string[];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isTemporary(e: any) {
  const msg = String(e?.message ?? e).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("429") ||
    msg.includes("quota")
  );
}

// Tries each model in order, 2 attempts each, only for temporary errors
export async function withRetry<T>(
  fn: (model: ReturnType<typeof google>) => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (const id of modelIds) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await fn(google(id));
      } catch (e) {
        lastError = e;
        if (!isTemporary(e)) throw e; // real bug, don't hide it
        await sleep(3000 * (attempt + 1));
      }
    }
  }
  throw lastError;
}
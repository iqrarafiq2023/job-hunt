import { google } from "@ai-sdk/google";

// Paste the exact free model ID from AI Studio into .env.local as GEMINI_MODEL
export const model = google(process.env.GEMINI_MODEL!);

// One retry on rate limits (429), since free tier limits are low
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      await new Promise((r) => setTimeout(r, 8000));
      return await fn();
    }
    throw e;
  }
}
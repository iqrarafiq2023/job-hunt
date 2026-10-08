// import { createGoogleGenerativeAI } from "@ai-sdk/google";

// const google = createGoogleGenerativeAI({
//   apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
// });

// const ids = (process.env.GEMINI_MODELS ?? "")
//   .split(",")
//   .map((s) => s.trim())
//   .filter(Boolean);

// const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// function isTemporary(e: any) {
//   const msg = String(e?.message ?? e).toLowerCase();
//   return ["503", "429", "unavailable", "high demand", "quota", "timeout", "aborted"].some((k) =>
//     msg.includes(k)
//   );
// }

// // agentIndex spreads agents over different models so they don't share one 5/min quota
// export async function withRetry<T>(
//   agentIndex: number,
//   fn: (model: ReturnType<typeof google>, signal: AbortSignal) => Promise<T>
// ): Promise<T> {
//   if (ids.length === 0) throw new Error("Set GEMINI_MODELS in .env");
//   const order = ids.map((_, i) => ids[(agentIndex + i) % ids.length]);
//   let lastError: unknown;

//   for (let round = 0; round < 2; round++) {
//     for (const id of order) {
//       try {
//         return await fn(google(id), AbortSignal.timeout(20000)); // 20s max per call
//       } catch (e) {
//         lastError = e;
//         if (!isTemporary(e)) throw e; // a real bug, don't hide it
//       }
//     }
//     await sleep(10000); // short pause before the second round
//   }
//   throw lastError;
// }

import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const ids = (process.env.GROQ_MODELS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isTemporary(e: any) {
  const msg = String(e?.message ?? e).toLowerCase();
  return ["503", "429", "unavailable", "overloaded", "rate limit", "quota", "timeout", "aborted"].some(
    (k) => msg.includes(k)
  );
}

export async function withRetry<T>(
  agentIndex: number,
  fn: (model: ReturnType<typeof groq>, signal: AbortSignal) => Promise<T>
): Promise<T> {
  if (ids.length === 0) throw new Error("Set GROQ_MODELS in .env");
  const order = ids.map((_, i) => ids[(agentIndex + i) % ids.length]);
  let lastError: unknown;

  for (let round = 0; round < 2; round++) {
    for (const id of order) {
      try {
        return await fn(groq(id), AbortSignal.timeout(20000));
      } catch (e) {
        lastError = e;
        if (!isTemporary(e)) throw e; // a real bug, don't hide it
      }
    }
    await sleep(5000);
  }
  throw lastError;
}
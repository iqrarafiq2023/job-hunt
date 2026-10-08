import { generateObject } from "ai";
import { z } from "zod";
import {  withRetry } from "../llm";

export const jobSchema = z.object({
  title: z.string(),
  company: z.string().nullable(),
  seniority: z.string(),
  skills: z.array(z.string()),
  requirements: z.array(z.string()),
});
export type Job = z.infer<typeof jobSchema>;
// withRetry(0, (model, signal) =>
//   generateObject({ model, schema: jobSchema, system: "...", prompt: description,
//     maxRetries: 0, abortSignal: signal })
// )

export async function extractJob(description: string): Promise<Job> {
  const { object } = await withRetry(0, (model, signal) =>
    generateObject({
      model,
      schema: jobSchema,
      system: "You extract structured data from job descriptions. Be concise and only use what the text says.",
      maxRetries: 0,
      prompt: description,
      abortSignal: signal
    })
  );
  return object;
}
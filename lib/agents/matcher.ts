import { generateObject } from "ai";
import { z } from "zod";
import { withRetry } from "../llm";
import type { Job } from "./extractor";

export const matchSchema = z.object({
  score: z.number().describe("Match score from 0 to 100"),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  verdict: z.string(),
});
export type Match = z.infer<typeof matchSchema>;

export async function matchResume(job: Job, resume: string): Promise<Match> {
  const { object } = await withRetry(1, (model, signal) =>
    generateObject({
      model,
      schema: matchSchema,
      system:
        "You are an honest recruiter. Score how well the resume fits the job (0-100). " +
        "Only count skills actually shown in the resume. List real gaps, don't flatter.",
      prompt: `JOB:\n${JSON.stringify(job)}\n\nRESUME:\n${resume}`,
      maxRetries: 0,
      abortSignal: signal
    })
  );
  return object;
}
import { generateObject } from "ai";
import { z } from "zod";
import { withRetry } from "../llm";
import type { Job } from "./extractor";
import type { Match } from "./matcher";

export const writerSchema = z.object({
  coverLetter: z.string(),
  interviewQuestions: z.array(z.string()).describe("Exactly 3 likely interview questions"),
});

export async function writeApplication(job: Job, match: Match, resume: string) {
  const { object } = await withRetry(2, (model, signal) =>
    generateObject({
      model,
      schema: writerSchema,
      system:
        "Write a tailored cover letter (under 200 words) using only facts from the resume. " +
        "Address the gaps honestly without inventing experience. Also give 3 likely interview questions.",
      prompt: `JOB:\n${JSON.stringify(job)}\n\nMATCH:\n${JSON.stringify(match)}\n\nRESUME:\n${resume}`,
      maxRetries: 0,
      abortSignal: signal
    })
  );
  return object;
}
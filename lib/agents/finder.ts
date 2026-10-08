// import { generateObject } from "ai";
// import { z } from "zod";
// import { withRetry } from "../llm";

// export type RawJob = { id: number; title: string; company: string; location: string; description: string };

// const finderSchema = z.object({
//     rankings: z.array(
//         z.object({
//             id: z.number(),
//             score: z.number().describe("Fit score from 0 to 100"),
//             reason: z.string().describe("One short sentence on why"),
//         })
//     ),
// });

// export async function rankJobs(jobs: RawJob[], resume: string) {
//     const compact = jobs.map((j) => ({
//         id: j.id,
//         title: j.title,
//         company: j.company,
//         location: j.location,
//         summary: j.description.slice(0, 700),
//     }));

//     const { object } = await withRetry(3, (model, signal) =>
//         generateObject({
//             model,
//             schema: finderSchema,
//             maxRetries: 0,
//             abortSignal: signal,
//             system:
//                 "You are a strict recruiter. Score each job's fit for this candidate from 0 to 100 based only on the resume. " +
//                 "Lower the score a lot if the job asks for more years of experience than the resume shows, " +
//                 "or if its location restriction excludes the candidate's country. " +
//                 "Mention that reason in one short sentence. Return every job id.",
//             prompt: `RESUME:\n${resume}\n\nJOBS:\n${JSON.stringify(compact)}`,
//         })
//     );
//     return object.rankings;
// }

import { generateObject } from "ai";
import { z } from "zod";
import { withRetry } from "../llm";

export type RawJob = {
  id: number | string;
  title: string;
  company: string;
  location: string;
  description: string;
};

const finderSchema = z.object({
  rankings: z.array(
    z.object({
      id: z.union([z.number(), z.string()]),
      score: z.number().min(0).max(100),
      eligible: z.boolean(),
      reason: z.string(),
    })
  ),
});

export async function rankJobs(jobs: RawJob[], resume: string) {
  const compact = jobs.map((job) => ({
    id: String(job.id),
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description.slice(0, 5000),
  }));

  const { object } = await withRetry(3, (model, signal) =>
    generateObject({
      model,
      schema: finderSchema,
      maxRetries: 0,
      abortSignal: signal,

      system: `
You are a strict job-matching recruiter.

Your job is to determine whether each job is genuinely worth applying to for the candidate.

IMPORTANT RULES:

1. Match the job against the resume only.
2. Do NOT give a high score simply because the candidate has one matching technology.
3. Required skills matter more than nice-to-have skills.
4. Required years of experience matter.
5. If the job requires significantly more experience than the candidate has, reduce the score heavily.
6. If the job has a location restriction that excludes the candidate, mark eligible=false.
7. If a job is clearly unrelated to the candidate's career, mark eligible=false.
8. Seniority matters. Do not treat senior roles as a strong match if the resume does not demonstrate the required experience.
9. Missing required technologies should significantly reduce the score.
10. Do not assume that an unfamiliar technology is known by the candidate.
11. Do not invent experience that is not present in the resume.
12. Freelance experience can count as real experience when evaluating technical skills.
13. Learning or academic exposure should NOT be treated as professional experience.
14. A job can still be a good match if some non-essential requirements are missing.

SCORING:

90-100:
Excellent match. Candidate meets almost all important requirements.

75-89:
Strong match. Candidate meets most important requirements with only minor gaps.

60-74:
Reasonable match. Some meaningful gaps exist, but applying could still make sense.

40-59:
Weak match. Multiple important requirements are missing.

20-39:
Very poor match. Major skill, experience, seniority, or eligibility mismatch.

0-19:
Clearly unsuitable or unrelated.

ELIGIBILITY:

Set eligible=false when:
- The candidate is explicitly excluded by the location requirement.
- The role is clearly unrelated to software/technical work.
- The role requires a completely different profession.
- A critical mandatory technology/experience requirement is far beyond the candidate's demonstrated background.

IMPORTANT:

Do not reject a candidate merely because they don't have every technology listed.
Focus on required skills, experience, seniority, and actual relevance.

Return EXACTLY one ranking for every supplied job.

The reason must be ONE short sentence explaining the main reason for the score.
`,

      prompt: `
CANDIDATE RESUME:

${resume}

JOBS:

${JSON.stringify(compact)}
`,
    })
  );

  return object.rankings.map((ranking) => ({
    ...ranking,
    id: String(ranking.id),
    score: Math.max(0, Math.min(100, ranking.score)),
  }));
}
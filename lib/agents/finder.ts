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
            id: z.string(),
            score: z.number().describe("Fit score from 0 to 100"),
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
        description: job.description.slice(0, 1500),
    }));

    const { object } = await withRetry(3, (model, signal) =>
        generateObject({
            model,
            schema: finderSchema,
            maxRetries: 0,
            abortSignal: signal,

            system: `You are a job-matching recruiter. Score each job's fit for the candidate from 0 to 100 using only the resume.

Scoring: missing required skills lower the score. A role asking for more years of experience than the resume shows should score below 60. Never invent experience.

Eligibility: set eligible=false ONLY for hard blockers: (1) the location restriction clearly excludes the candidate's country (use the location in the resume), or (2) the role is not software/technical work. Missing skills or seniority gaps must lower the score but must NEVER make eligible=false.

Return exactly one ranking per job, using the id exactly as given. The reason is one short sentence.`,
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
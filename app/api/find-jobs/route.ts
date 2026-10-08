// import { rankJobs } from "@/lib/agents/finder";

// export const maxDuration = 60;

// const strip = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// export async function POST(req: Request) {
//   try {
//     const { resume, query } = await req.json();
//     if (!resume || resume.length < 100)
//       return Response.json({ error: "Add your resume first." }, { status: 400 });

//     const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(
//       query || "developer"
//     )}&limit=12`;
//     const res = await fetch(url);
//     if (!res.ok) throw new Error("Jobs API unavailable");
//     const data = await res.json();

//     const jobs = data.jobs.slice(0, 15).map((j: any) => ({
//   id: j.id,
//   title: j.title,
//   company: j.company_name,
//   url: j.url,
//   location: j.candidate_required_location ?? "Not specified",
//   description: strip(j.description).slice(0, 3000),
// }));

//     const rankings = await rankJobs(jobs, resume);
//     const ranked = rankings
//       .map((r) => ({ ...r, job: jobs.find((j: any) => j.id === r.id) }))
//       .filter((r) => r.job)
//       .sort((a, b) => b.score - a.score);

//     return Response.json({ results: ranked });
//   } catch (e) {
//     console.error(e);
//     return Response.json({ error: "Couldn't fetch or rank jobs. Try again." }, { status: 500 });
//   }
// }

import { rankJobs } from "@/lib/agents/finder";

export const maxDuration = 60;

type RemotiveJob = {
    id: number | string;
    title: string;
    company_name: string;
    url: string;
    candidate_required_location?: string;
    description?: string;
};

type Job = {
    id: string;
    title: string;
    company: string;
    url: string;
    location: string;
    description: string;
};

const stripHtml = (html: string = "") => {
    return html
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

export async function POST(req: Request) {
    try {
       

        const body = await req.json();

        const resume =
            typeof body.resume === "string"
                ? body.resume.trim()
                : "";

        const query =
            typeof body.query === "string"
                ? body.query.trim()
                : "developer";

        if (resume.length < 100) {
            return Response.json(
                {
                    error: "Add your resume first.",
                },
                { status: 400 }
            );
        }

        /* ---------------------------------------------------------------------- */
        /* Fetch jobs from Remotive                                               */
        /* ---------------------------------------------------------------------- */

        const url =
            `https://remotive.com/api/remote-jobs?` +
            `search=${encodeURIComponent(query)}&limit=12`;

        const res = await fetch(url, {
            headers: {
                Accept: "application/json",
            },
            cache: "no-store",
        });
console.log("Remotive API response status:", res.status);
        if (!res.ok) {
            throw new Error(
                `Remotive API returned ${res.status}`
            );
        }

        const data = await res.json();

        if (!Array.isArray(data.jobs)) {
            throw new Error("Invalid response from Remotive API");
        }

        /* ---------------------------------------------------------------------- */
        /* Normalize jobs                                                         */
        /* ---------------------------------------------------------------------- */

        const jobs: Job[] = data.jobs
            .slice(0, 12)
            .map((job: RemotiveJob): Job => ({
                id: String(job.id),

                title: job.title || "Untitled position",

                company:
                    job.company_name || "Unknown company",

                url:
                    job.url || "",

                location:
                    job.candidate_required_location ||
                    "Not specified",

                description:
                    stripHtml(job.description || "").slice(0, 5000),
            }))
            .filter(
                (job: Job) =>
                    job.title &&
                    job.description &&
                    job.url
            );

        if (jobs.length === 0) {
            return Response.json({
                results: [],
            });
        }


        const rankings = await rankJobs(jobs, resume);

        const ranked = rankings
            .map((ranking) => {
                const job = jobs.find(
                    (job) => String(job.id) === String(ranking.id)
                );

                if (!job) return null;

                return {
                    id: String(job.id),
                    job,
                    score: ranking.score,
                    eligible: ranking.eligible,
                    reason: ranking.reason,
                };
            })
            .filter((item) => item !== null)
            .filter((item) => item.eligible)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);



        return Response.json({
            results: ranked,
        });
    } catch (error) {
        console.error("Find jobs error:", error);

        return Response.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Couldn't fetch or rank jobs. Try again.",
            },
            { status: 500 }
        );
    }
}
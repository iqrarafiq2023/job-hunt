import fs from "fs/promises";
import path from "path";
import { extractJob } from "./agents/extractor";
import { matchResume } from "./agents/matcher";
import { writeApplication } from "./agents/writer";

export async function runPipeline(description: string) {
  const resume = await fs.readFile(path.join(process.cwd(), "data/resume.txt"), "utf8");
  const job = await extractJob(description);        // sequential on purpose (free tier limits)
  const match = await matchResume(job, resume);
  const application = await writeApplication(job, match, resume);
  console.log("Application written:", application);
  return { job, match, ...application };
}
import { runPipeline } from "@/lib/orchestrator";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { description } = await req.json();
    if (!description || description.length < 50) {
      return Response.json({ error: "Paste a full job description." }, { status: 400 });
    }
    const result = await runPipeline(description);
    return Response.json(result);
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: "Something went wrong. Try again in a minute." }, { status: 500 });
  }
}
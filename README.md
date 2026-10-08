# JobHunt Agent

An AI pipeline that takes a job description and your resume, then tells you how well you fit and helps you apply. Paste a job posting, upload your resume, and get:

- A **match score** (0-100) with honest strengths and gaps
- A **tailored cover letter** that only uses facts from your resume
- **3 likely interview questions** for that role

**Live demo:** [ADD YOUR VERCEL URL HERE]

## How it works

Three small agents, each with one job, chained by an orchestrator:


| Agent | Input | Output |
|---|---|---|
| **Extractor** | Raw job description | `{ title, company, seniority, skills[], requirements[] }` |
| **Matcher** | Extracted job + resume | `{ score, strengths[], gaps[], verdict }` |
| **Writer** | Job + match + resume | `{ coverLetter, interviewQuestions[] }` |

Every agent returns schema-validated JSON (Zod), not free text, so each step can rely on the previous one's output.

## Tech stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **Vercel AI SDK** with structured output (`generateObject` + Zod)
- **Groq** free tier, running open models (`gpt-oss-120b` / `gpt-oss-20b`)
- **unpdf** for server-side PDF text extraction
- Deployed on **Vercel**

## Run it locally

```bash
git clone [YOUR REPO URL]
cd jobhunt-agent
npm install
```

Create a `.env` file in the project root:

```dotenv
GROQ_API_KEY=your_groq_api_key
GROQ_MODELS=openai/gpt-oss-120b,openai/gpt-oss-20b
```

Get a free key at [console.groq.com](https://console.groq.com) (no credit card needed). Then:

```bash
npm run dev
```

Open http://localhost:3000, upload a PDF resume (or paste the text), paste a job description, and click **Analyze**.

## Design decisions

- **Sequential agents, not parallel.** Each step needs the previous one's output, and it keeps usage inside free-tier rate limits.
- **Model fallback.** `GROQ_MODELS` is a list. Agents start on different models, and if a call fails with a temporary error (rate limit, overload, timeout), the next model is tried. Real bugs are not retried, so they surface immediately.
- **Hard timeouts.** Every LLM call is capped at 20 seconds so a stuck request can't hang the app.
- **Strict schemas.** Fields use `nullable` instead of `optional`, because strict JSON-schema mode requires every field to be present.
- **Nothing is stored.** The resume is held in the browser and sent with each request. There is no database.

## Privacy

Free-tier LLM providers may not guarantee prompt privacy. Remove your phone number and email from your resume text before analyzing. They aren't needed for matching.

## Known limitations

- PDFs with complex multi-column layouts can extract badly. Paste the text as a fallback.
- Free-tier rate limits apply, so heavy use may be throttled.
- The match score is the model's judgment, so treat it as a guide, not a measurement.

## Roadmap

- [ ] **Finder agent:** fetch real remote job listings and rank them against your resume
- [ ] Stream live progress ("Extracting... Matching... Writing...")
- [ ] Export the cover letter as PDF/DOCX
- [ ] Rate limiting on the public endpoint
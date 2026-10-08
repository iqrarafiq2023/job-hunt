"use client";

import { useState } from "react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Result = {
  job: {
    title: string;
    seniority: string;
    skills: string[];
    requirements: string[];
    company?: string;
    location?: string;
  };
  match: {
    score: number;
    strengths: string[];
    gaps: string[];
    verdict: string;
  };
  coverLetter: string;
  interviewQuestions: string[];
};

type JobResult = {
  id: string;
  job: {
    title: string;
    company: string;
    description: string;
    url: string;
    location?: string;
  };
  reason: string;
  score: number;
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function Home() {
  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */

  const [description, setDescription] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const [loading, setLoading] = useState(false);
  const [finding, setFinding] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [resume, setResume] = useState("");

  const [query, setQuery] = useState("react");
  const [jobs, setJobs] = useState<JobResult[]>([]);

  /* ------------------------------------------------------------------------ */
  /* Analyze Job                                                              */
  /* ------------------------------------------------------------------------ */

  async function analyze() {
    if (description.trim().length < 50) {
      setError("Please enter at least 50 characters for the job description.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          resume,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      setResult(data);

      // Scroll to results after analysis
      setTimeout(() => {
        document.getElementById("analysis-results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Something went wrong.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Copy Cover Letter                                                        */
  /* ------------------------------------------------------------------------ */

  async function copyLetter() {
    if (!result?.coverLetter) return;

    try {
      await navigator.clipboard.writeText(result.coverLetter);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Could not copy the cover letter.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Upload Resume                                                            */
  /* ------------------------------------------------------------------------ */

  async function uploadResume(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const form = new FormData();

      form.append("file", file);

      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to parse resume.");
      }

      if (!data.text) {
        throw new Error("No resume text was returned.");
      }

      setResume(data.text);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to upload resume.";

      setError(message);
    } finally {
      setUploading(false);

      // Allows selecting the same file again
      e.target.value = "";
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Find Jobs                                                                */
  /* ------------------------------------------------------------------------ */

  async function findJobs() {
    if (!resume.trim()) {
      setError("Please upload your resume before searching for jobs.");
      return;
    }

    if (!query.trim()) {
      setError("Please enter a job search query.");
      return;
    }

    setFinding(true);
    setError("");
    setJobs([]);

    try {
      const res = await fetch("/api/find-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume,
          query: query.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to find jobs.");
      }

      setJobs(Array.isArray(data.results) ? data.results : []);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to find jobs.";

      setError(message);
    } finally {
      setFinding(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Select Job From Search Results                                           */
  /* ------------------------------------------------------------------------ */

  function pickJob(job: JobResult) {
    const jobDescription = [
      `${job.job.title} at ${job.job.company}`,
      job.job.location ? `Location: ${job.job.location}` : "",
      "",
      job.job.description,
    ]
      .filter(Boolean)
      .join("\n");

    setDescription(jobDescription);
    setResult(null);
    setError("");

    setTimeout(() => {
      document.getElementById("job-description")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }

  /* ------------------------------------------------------------------------ */
  /* Helpers                                                                  */
  /* ------------------------------------------------------------------------ */

  const canAnalyze = description.trim().length >= 50;

  const hasResume = resume.trim().length > 0;

  function getScoreClasses(score: number) {
    if (score >= 75) {
      return {
        text: "text-emerald-600",
        border: "border-emerald-200",
        bg: "bg-emerald-50",
      };
    }

    if (score >= 50) {
      return {
        text: "text-amber-600",
        border: "border-amber-200",
        bg: "bg-amber-50",
      };
    }

    return {
      text: "text-red-600",
      border: "border-red-200",
      bg: "bg-red-50",
    };
  }

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}

        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-bold text-white shadow-lg shadow-violet-200">
              J
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                JobHunt Agent
              </h1>

              <p className="text-xs text-slate-500">
                AI-powered job application assistant
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-600 shadow-sm sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            AI Agent Online
          </div>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                             */}
        {/* ---------------------------------------------------------------- */}

        <section className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">
            ✦ Intelligent job matching
          </div>

          <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Find out if this job is
            <span className="block bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
              actually worth applying to.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Upload your resume, find matching jobs, and let AI analyze your
            fit, identify gaps, write a tailored cover letter, and prepare
            you for the interview.
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Main Input Card                                                  */}
        {/* ---------------------------------------------------------------- */}

        <section className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <div className="rounded-xl p-5 sm:p-6">

              {/* Resume Upload */}

              <div className="mb-7">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Your resume
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Upload your resume so the AI can compare your experience
                    with the job.
                  </p>
                </div>

                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={uploadResume}
                />

                {!hasResume ? (
                  <label
                    htmlFor="resume-upload"
                    className="group flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-violet-400 hover:bg-violet-50/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm ring-1 ring-slate-200">
                        {uploading ? (
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
                        ) : (
                          "↑"
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {uploading
                            ? "Uploading resume..."
                            : "Upload your resume"}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          PDF, DOC, DOCX or TXT
                        </p>
                      </div>
                    </div>

                    {!uploading && (
                      <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition group-hover:text-violet-600">
                        Choose file
                      </span>
                    )}
                  </label>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        ✓
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          Resume uploaded
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          Your resume is ready for analysis
                        </p>
                      </div>
                    </div>

                    <label
                      htmlFor="resume-upload"
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                      Replace
                    </label>
                  </div>
                )}
              </div>

              {/* Divider */}

              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />

                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Job details
                </span>

                <div className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Job Description */}

              <div id="job-description">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Job description
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Paste the complete job posting for better results.
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-slate-400">
                    {description.length} characters
                  </span>
                </div>

                <textarea
                  className="min-h-[240px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  placeholder="Paste a job description here... Example: We're looking for a Full Stack Developer with experience in React, Next.js, Node.js and PostgreSQL..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-400">
                    {canAnalyze
                      ? hasResume
                        ? "✓ Resume + job description ready"
                        : "✓ Job description ready"
                      : "Enter at least 50 characters"}
                  </p>

                  <button
                    onClick={analyze}
                    disabled={loading || !canAnalyze || uploading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze job
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Loading                                                         */}
        {/* ---------------------------------------------------------------- */}

        {loading && (
          <section className="mx-auto mt-8 max-w-4xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              </div>

              <h3 className="font-semibold text-slate-900">
                Analyzing the opportunity
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Extracting requirements, comparing your skills, and preparing
                your application...
              </p>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Error                                                            */}
        {/* ---------------------------------------------------------------- */}

        {error && (
          <section className="mx-auto mt-8 max-w-4xl">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Something went wrong
                </p>

                <p className="mt-1 text-sm leading-5 text-red-600">
                  {error}
                </p>
              </div>

              <button
                onClick={() => setError("")}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Dismiss
              </button>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Find Jobs                                                        */}
        {/* ---------------------------------------------------------------- */}

        <section className="mx-auto mt-8 max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <div className="rounded-xl p-5 sm:p-6">

              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                    AI Job Search
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    Find jobs that match your resume
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Search for jobs and let the agent rank them based on your
                    experience.
                  </p>
                </div>

                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 sm:flex">
                  ✦
                </div>
              </div>

              {/* Search */}

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !finding &&
                      hasResume &&
                      query.trim()
                    ) {
                      findJobs();
                    }
                  }}
                  placeholder="e.g. React Developer, Node.js, Full Stack"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />

                <button
                  onClick={findJobs}
                  disabled={
                    finding ||
                    !hasResume ||
                    !query.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {finding ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Searching...
                    </>
                  ) : (
                    <>
                      Find jobs
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>

              {!hasResume && (
                <p className="mt-3 text-xs text-amber-600">
                  Upload your resume above before searching for matching jobs.
                </p>
              )}

              {/* Search Results */}

              {jobs.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        Matching jobs
                      </h4>

                      <p className="mt-1 text-xs text-slate-500">
                        Ranked based on your resume and search query.
                      </p>
                    </div>

                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-600">
                      {jobs.length} found
                    </span>
                  </div>

                  <div className="space-y-3">
                    {jobs.map((item) => {
                      const score = getScoreClasses(item.score);

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-violet-200 hover:bg-violet-50/20"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            {/* Job Information */}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="font-semibold text-slate-900">
                                  {item.job.title}
                                </h5>

                                <span className="text-xs text-slate-400">
                                  ·
                                </span>

                                <span className="text-sm text-slate-500">
                                  {item.job.company}
                                </span>
                              </div>

                              {item.job.location && (
                                <p className="mt-1 text-xs text-slate-400">
                                  {item.job.location}
                                </p>
                              )}

                              <p className="mt-2 text-sm leading-5 text-slate-600">
                                {item.reason}
                              </p>

                              <a
                                href={item.job.url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex text-xs font-medium text-violet-600 hover:text-violet-700 hover:underline"
                              >
                                View posting →
                              </a>
                            </div>

                            {/* Score */}

                            <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col">
                              <div className="text-center">
                                <div
                                  className={`text-2xl font-bold ${score.text}`}
                                >
                                  {item.score}
                                </div>

                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                  Match
                                </p>
                              </div>

                              <button
                                onClick={() => pickJob(item)}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                              >
                                Analyze
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}

              {!finding &&
                jobs.length === 0 &&
                query.trim() &&
                hasResume && (
                  <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      No jobs found yet
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try a broader search such as "React Developer" or "Full
                      Stack".
                    </p>
                  </div>
                )}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Results                                                          */}
        {/* ---------------------------------------------------------------- */}

        {result && !loading && (
          <section
            id="analysis-results"
            className="mx-auto mt-10 max-w-4xl space-y-5"
          >

            {/* Result Header */}

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-600">
                  Analysis complete
                </p>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Your match report
                </h2>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setDescription("");

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
                className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
              >
                Analyze another →
              </button>
            </div>

            {/* Main Score */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 sm:p-8">

                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                        {result.job.seniority}
                      </span>

                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-600">
                        AI Match
                      </span>
                    </div>

                    <h3 className="max-w-xl text-2xl font-bold tracking-tight text-slate-900">
                      {result.job.title}
                    </h3>

                    {result.job.company && (
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {result.job.company}
                      </p>
                    )}

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                      {result.match.verdict}
                    </p>
                  </div>

                  {/* Score */}

                  <div
                    className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-8 bg-slate-50 ${getScoreClasses(result.match.score).border}`}
                  >
                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold ${getScoreClasses(result.match.score).text}`}
                      >
                        {result.match.score}
                      </div>

                      <div className="text-[10px] uppercase tracking-wider text-slate-400">
                        Match
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}

                {result.job.skills?.length > 0 && (
                  <div className="mt-7 border-t border-slate-100 pt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Key skills
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {result.job.skills.map((skill, i) => (
                        <span
                          key={`${skill}-${i}`}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Strengths / Gaps */}

            <div className="grid gap-5 md:grid-cols-2">

              {/* Strengths */}

              <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    ✓
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Your strengths
                    </h3>

                    <p className="text-xs text-slate-500">
                      Where you match the role
                    </p>
                  </div>
                </div>

                <ul className="space-y-3">
                  {result.match.strengths.map((strength, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm leading-6 text-slate-600"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Gaps */}

              <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    !
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Potential gaps
                    </h3>

                    <p className="text-xs text-slate-500">
                      Things to prepare for
                    </p>
                  </div>
                </div>

                <ul className="space-y-3">
                  {result.match.gaps.map((gap, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm leading-6 text-slate-600"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {gap}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Cover Letter */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                    Generated application
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    Tailored cover letter
                  </h3>
                </div>

                <button
                  onClick={copyLetter}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
                >
                  {copied ? "✓ Copied" : "Copy letter"}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {result.coverLetter}
                </p>
              </div>
            </section>

            {/* Interview */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Interview prep
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Questions you should prepare for
                </h3>
              </div>

              <div className="space-y-3">
                {result.interviewQuestions.map((question, i) => (
                  <div
                    key={i}
                    className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-violet-200 hover:bg-violet-50/30"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-600">
                      {String(i + 1).padStart(2, "0")}
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                      {question}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Requirements */}

            {result.job.requirements?.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-slate-900">
                  Role requirements
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  {result.job.requirements.map((requirement, i) => (
                    <div
                      key={i}
                      className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
                    >
                      <span className="text-violet-500">•</span>
                      {requirement}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                           */}
        {/* ---------------------------------------------------------------- */}

        <footer className="py-12 text-center text-xs text-slate-400">
          JobHunt Agent
        </footer>
      </div>
    </main>
  );
}
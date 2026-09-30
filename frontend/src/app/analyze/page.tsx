"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchRoles, runAnalysis } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Upload,
  FileText,
  Briefcase,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  Target,
} from "lucide-react";

export default function AnalyzePage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [resumeMode, setResumeMode] = useState<"text" | "upload">("text");
  const [resumeText, setResumeText] = useState("");
  const [targetMode, setTargetMode] = useState<"role" | "custom">("role");
  const [selectedRole, setSelectedRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRoles()
      .then((data) => {
        setRoles(data);

        if (data.length > 0) {
          setSelectedRole(data[0].role_id);
        }
      })
      .catch((err) => console.error("Could not load roles", err));
  }, []);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        "http://localhost:8000/api/v1/resume/upload-pdf",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.text) {
        setResumeText(data.text);
        setResumeMode("text");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to parse PDF resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!resumeText.trim()) {
      setError("Please provide your resume text or upload a PDF.");
      return;
    }

    if (targetMode === "custom" && !jobDescription.trim()) {
      setError("Please paste a target job description.");
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        resume_text: resumeText,
      };

      if (targetMode === "role") {
        payload.role_id = selectedRole;
      } else {
        payload.job_description = jobDescription;
      }

      const token = await getToken();
      const result = await runAnalysis(payload, token);

      if (result.analysis_id) {
        router.push(`/analyze/${result.analysis_id}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "An error occurred during analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">

      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-6 shadow-sm dark:border-purple-900/60 dark:from-purple-950/40 dark:via-black dark:to-purple-950/20 md:p-8">
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
            <Sparkles className="h-4 w-4" />
            AI-Powered Analysis
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            New Skill Gap Analysis
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 md:text-base">
            Compare your current skills with a target role and discover
            exactly what you need to improve for your career goal.
          </p>

          {/* Process */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white/80 p-3 dark:border-purple-900/60 dark:bg-black/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-purple-950/60 dark:text-purple-400">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Step 1
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  Add your skills
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white/80 p-3 dark:border-purple-900/60 dark:bg-black/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-purple-950/60 dark:text-purple-400">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Step 2
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  Choose your target
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white/80 p-3 dark:border-purple-900/60 dark:bg-black/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-purple-950/60 dark:text-purple-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Step 3
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  Get your roadmap
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl dark:bg-purple-700/20" />
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <span className="mt-0.5">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Step 1 */}
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-purple-900/70 dark:bg-zinc-900 md:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-purple-950/60 dark:text-purple-400">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-purple-400">
                  Step 1
                </p>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Your Background & Skills
                </h2>
              </div>
            </div>

            <div className="flex w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-zinc-800 sm:w-auto">
              <button
                type="button"
                onClick={() => setResumeMode("text")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:flex-none ${
                  resumeMode === "text"
                    ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-700 dark:text-purple-300"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Paste Text
              </button>

              <button
                type="button"
                onClick={() => setResumeMode("upload")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:flex-none ${
                  resumeMode === "upload"
                    ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-700 dark:text-purple-300"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Upload PDF
              </button>
            </div>
          </div>

          {resumeMode === "text" ? (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Resume / Skills
              </label>

              <textarea
                rows={8}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume content, projects, education, or technical skills here..."
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-purple-600 dark:focus:ring-purple-950"
              />

              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Example: Python, React, SQL, Git, REST APIs, project
                experience, internships, etc.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center dark:border-purple-900 dark:bg-purple-950/20">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-zinc-900 dark:text-purple-400">
                <Upload className="h-7 w-7" />
              </div>

              <h3 className="font-semibold text-slate-900 dark:text-white">
                Upload your resume
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                PDF format, up to 5MB
              </p>

              <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-purple-600 dark:hover:bg-purple-700">
                <Upload className="h-4 w-4" />
                Choose PDF
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {loading && (
                <p className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-purple-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reading your resume...
                </p>
              )}
            </div>
          )}

          {resumeText.trim() && resumeMode === "text" && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Resume information added successfully
            </div>
          )}
        </section>

        {/* Step 2 */}
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-purple-900/70 dark:bg-zinc-900 md:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-purple-950/60 dark:text-purple-400">
                <Briefcase className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-purple-400">
                  Step 2
                </p>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Target Position
                </h2>
              </div>
            </div>

            <div className="flex w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-zinc-800 sm:w-auto">
              <button
                type="button"
                onClick={() => setTargetMode("role")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:flex-none ${
                  targetMode === "role"
                    ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-700 dark:text-purple-300"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Predefined Role
              </button>

              <button
                type="button"
                onClick={() => setTargetMode("custom")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:flex-none ${
                  targetMode === "custom"
                    ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-700 dark:text-purple-300"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Custom Job
              </button>
            </div>
          </div>

          {targetMode === "role" ? (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Select your target role
              </label>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-purple-600 dark:focus:ring-purple-950"
              >
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_id} className="bg-white text-slate-900 dark:bg-zinc-900 dark:text-white">
                    {r.role_name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Target job description
              </label>

              <textarea
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description or requirements here..."
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-purple-600 dark:focus:ring-purple-950"
              />
            </div>
          )}
        </section>

        {/* Submit */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 dark:border-purple-900/60 dark:bg-purple-950/20 md:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                Ready to discover your skill gaps?
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Our analysis will compare your skills with your selected
                target and generate your results.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:bg-purple-600 dark:hover:bg-purple-700 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Run AI Skill Gap Analysis
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
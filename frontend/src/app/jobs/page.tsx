"use client";

import { useState } from "react";
import Link from "next/link";
import { searchJobs, analyzeJobReadiness } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  MapPin,
  Building,
  DollarSign,
  Calendar,
  CheckSquare,
  Square,
  TrendingUp,
  Sparkles,
  Loader2,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
} from "lucide-react";

export default function JobsPage() {
  const { getToken } = useAuth();

  const [query, setQuery] = useState("Python Developer");
  const [location, setLocation] = useState("India");
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [readinessResult, setReadinessResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || !location.trim()) return;

    setLoadingSearch(true);
    setError("");
    setReadinessResult(null);

    try {
      const data = await searchJobs(query, location);
      setJobs(data);

      setSelectedJobIds(
        data.slice(0, 3).map((j: any) => j.job_id)
      );
    } catch (err: any) {
      console.error(err);
      setError("Failed to search jobs. Please try again.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const toggleJobSelect = (jobId: string) => {
    if (selectedJobIds.includes(jobId)) {
      setSelectedJobIds(
        selectedJobIds.filter((id) => id !== jobId)
      );
    } else {
      setSelectedJobIds([...selectedJobIds, jobId]);
    }
  };

  const handleAnalyzeReadiness = async () => {
    if (selectedJobIds.length === 0) {
      setError("Please select at least one job listing to evaluate.");
      return;
    }

    setLoadingAnalysis(true);
    setError("");

    try {
      const token = await getToken();

      const result = await analyzeJobReadiness(
        selectedJobIds,
        query,
        location,
        undefined,
        token
      );

      setReadinessResult(result);
    } catch (err: any) {
      console.error(err);
      setError("Failed to run market readiness analysis.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">

      {/* PAGE HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-7 shadow-sm dark:border-purple-900/60 dark:bg-[#090909]">
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl dark:bg-purple-900/20" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Live Job Market
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Job Market Readiness
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Search real-time job listings and analyze how your current
              skills compare with the requirements of open roles.
            </p>
          </div>

          {jobs.length > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-purple-900/60 dark:bg-purple-950/30">
              <BriefcaseBusiness className="h-5 w-5 text-blue-600 dark:text-purple-400" />

              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Listings found
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {jobs.length}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEARCH PANEL */}
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm dark:border-purple-900/60 dark:bg-[#090909]">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Search Jobs
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Enter a role and location to find relevant open positions.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="grid gap-3 md:grid-cols-7"
        >
          {/* JOB QUERY */}
          <div className="relative md:col-span-3">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Job title or keyword"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-purple-900/70 dark:bg-black dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-900/30"
            />
          </div>

          {/* LOCATION */}
          <div className="relative md:col-span-3">
            <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="City or country"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-purple-900/70 dark:bg-black dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-900/30"
            />
          </div>

          {/* SEARCH BUTTON */}
          <button
            type="submit"
            disabled={loadingSearch}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-purple-600 dark:hover:bg-purple-700"
          >
            {loadingSearch ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search
              </>
            )}
          </button>
        </form>
      </section>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* READINESS REPORT */}
      {readinessResult && (
        <section className="overflow-hidden rounded-3xl border border-blue-200 bg-blue-50 dark:border-purple-900 dark:bg-[#0c0712]">
          <div className="border-b border-blue-200 p-6 dark:border-purple-900/70">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-purple-400">
                  <TrendingUp className="h-4 w-4" />
                  Market Alignment Report
                </div>

                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {readinessResult.query}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {readinessResult.location}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-white px-6 py-4 text-center shadow-sm dark:border-purple-800 dark:bg-black">
                <p className="text-3xl font-extrabold text-blue-600 dark:text-purple-400">
                  {readinessResult.overall_readiness}%
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Overall Readiness
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-purple-400" />
              Top Missing Skills Across Selected Jobs
            </h3>

            <div className="grid gap-3 md:grid-cols-3">
              {readinessResult.improvement_fields?.map(
                (field: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-blue-100 bg-white p-4 dark:border-purple-900/60 dark:bg-black"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {field.skill}
                      </span>

                      <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 dark:bg-purple-950/50 dark:text-purple-300">
                        {field.demand_percentage}% demand
                      </span>
                    </div>

                    <Link
                      href="/analyze"
                      className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-800 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Build Learning Roadmap
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* RESULTS HEADER */}
      {jobs.length > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-purple-900/60 dark:bg-[#090909] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {jobs.length} open listings found
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {selectedJobIds.length} job
              {selectedJobIds.length !== 1 ? "s" : ""} selected for analysis
            </p>
          </div>

          <button
            onClick={handleAnalyzeReadiness}
            disabled={
              loadingAnalysis || selectedJobIds.length === 0
            }
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-purple-600 dark:hover:bg-purple-700"
          >
            {loadingAnalysis ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}

            {loadingAnalysis
              ? "Analyzing..."
              : "Analyze Selected Jobs"}
          </button>
        </div>
      )}

      {/* JOB RESULTS */}
      <div className="space-y-4">
        {jobs.map((job) => {
          const isSelected = selectedJobIds.includes(job.job_id);

          const jobReadiness =
            readinessResult?.jobs_analyzed?.find(
              (j: any) => j.job_id === job.job_id
            );

          return (
            <article
              key={job.job_id}
              className={`rounded-3xl border bg-white p-6 shadow-sm transition dark:bg-[#090909] ${
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-100 dark:border-purple-500 dark:ring-purple-900/30"
                  : "border-slate-200 hover:border-blue-200 dark:border-purple-900/50 dark:hover:border-purple-700"
              }`}
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                {/* JOB INFO */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => toggleJobSelect(job.job_id)}
                    className="mt-1 shrink-0 text-slate-400 transition hover:text-blue-600 dark:hover:text-purple-400"
                    aria-label={
                      isSelected
                        ? "Deselect job"
                        : "Select job"
                    }
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-blue-600 dark:text-purple-400" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {job.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Building className="h-3.5 w-3.5" />
                        {job.company}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>

                      {job.salary_range && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <DollarSign className="h-3.5 w-3.5" />
                          {job.salary_range}
                        </span>
                      )}

                      {job.posted_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {job.posted_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* READINESS */}
                {jobReadiness && (
                  <div className="shrink-0 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-center dark:border-purple-900/60 dark:bg-purple-950/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Readiness
                    </p>

                    <p className="mt-1 text-xl font-extrabold text-blue-600 dark:text-purple-400">
                      {jobReadiness.readiness_percentage}%
                    </p>
                  </div>
                )}
              </div>

              {/* DESCRIPTION */}
              <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {job.description_snippet}
              </p>

              {/* FOOTER */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-purple-900/50">
                {isSelected ? (
                  <span className="text-xs font-semibold text-blue-600 dark:text-purple-400">
                    ✓ Selected for analysis
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Select to include in analysis
                  </span>
                )}

                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition hover:text-blue-800 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  View Job
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {!loadingSearch && jobs.length === 0 && !error && (
        <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/50 px-6 py-12 text-center dark:border-purple-900/60 dark:bg-purple-950/10">
          <BriefcaseBusiness className="mx-auto h-10 w-10 text-blue-400 dark:text-purple-500" />

          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            Search for your next opportunity
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Enter a job title and location above to discover open
            positions and analyze your readiness.
          </p>
        </div>
      )}
    </div>
  );
}
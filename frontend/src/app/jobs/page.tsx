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
  BookOpen
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
      // Auto-select first 3 by default
      setSelectedJobIds(data.slice(0, 3).map((j: any) => j.job_id));
    } catch (err: any) {
      console.error(err);
      setError("Failed to search jobs. Please try again.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const toggleJobSelect = (jobId: string) => {
    if (selectedJobIds.includes(jobId)) {
      setSelectedJobIds(selectedJobIds.filter((id) => id !== jobId));
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
      const result = await analyzeJobReadiness(selectedJobIds, query, location, undefined, token);
      setReadinessResult(result);
    } catch (err: any) {
      console.error(err);
      setError("Failed to run market readiness analysis.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Live Job Market Readiness
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          Search real-time listings from Adzuna and analyze how your skill profile stacks up across open roles.
        </p>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        className="bg-white dark:bg-gray-900 p-4 rounded-3xl border dark:border-gray-800 shadow-sm grid md:grid-cols-7 gap-3"
      >
        <div className="md:col-span-3 relative flex items-center">
          <Search className="w-5 h-5 absolute left-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Job Title or Keyword (e.g. Python Developer)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
          />
        </div>
        <div className="md:col-span-3 relative flex items-center">
          <MapPin className="w-5 h-5 absolute left-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="City or Country (e.g. Bengaluru, India)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loadingSearch}
          className="md:col-span-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl py-2.5 flex items-center justify-center transition shadow-sm"
        >
          {loadingSearch ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-2xl text-sm border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      {/* Market Readiness Aggregation Card */}
      {readinessResult && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-blue-300 font-bold">
                Market Alignment Report
              </span>
              <h3 className="text-2xl font-bold mt-1">
                {readinessResult.query} in {readinessResult.location}
              </h3>
            </div>
            <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-md">
              <span className="text-3xl font-extrabold text-emerald-400">
                {readinessResult.overall_readiness}%
              </span>
              <span className="text-xs text-blue-200 uppercase font-semibold tracking-wider">
                Overall<br />Readiness
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-blue-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Top In-Demand Missing Skills Across Selected Jobs
            </h4>
            <div className="grid md:grid-cols-3 gap-3">
              {readinessResult.improvement_fields?.map((field: any, idx: number) => (
                <div key={idx} className="bg-white/10 p-4 rounded-2xl flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{field.skill}</span>
                    <span className="text-xs bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono font-bold">
                      {field.demand_percentage}% demand
                    </span>
                  </div>
                  <Link
                    href={`/analyze`}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-200 hover:text-white font-medium transition"
                  >
                    <BookOpen className="w-3 h-3" /> Build Learning Roadmap
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Header with Batch Action */}
      {jobs.length > 0 && (
        <div className="flex justify-between items-center border-b dark:border-gray-800 pb-4">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Found {jobs.length} open listings. Selected: {selectedJobIds.length}
          </span>
          <button
            onClick={handleAnalyzeReadiness}
            disabled={loadingAnalysis || selectedJobIds.length === 0}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
          >
            {loadingAnalysis ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Analyze Readiness on Selected Jobs
          </button>
        </div>
      )}

      {/* Job Cards */}
      <div className="space-y-4">
        {jobs.map((job) => {
          const isSelected = selectedJobIds.includes(job.job_id);
          const jobReadiness = readinessResult?.jobs_analyzed?.find(
            (j: any) => j.job_id === job.job_id
          );

          return (
            <div
              key={job.job_id}
              className={`p-6 bg-white dark:bg-gray-900 rounded-3xl border transition shadow-sm ${
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-50 dark:ring-blue-900/40"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleJobSelect(job.job_id)}
                    className="mt-1 text-gray-400 hover:text-blue-600 transition"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{job.title}</h4>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                        <Building className="w-3.5 h-3.5" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </span>
                      {job.salary_range && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <DollarSign className="w-3.5 h-3.5" />
                          {job.salary_range}
                        </span>
                      )}
                      {job.posted_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {job.posted_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {jobReadiness && (
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 font-medium uppercase">Readiness</span>
                    <span
                      className={`text-sm font-extrabold px-3 py-1 rounded-full mt-0.5 ${
                        jobReadiness.readiness_percentage >= 70
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                      }`}
                    >
                      {jobReadiness.readiness_percentage}%
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 leading-relaxed line-clamp-2">
                {job.description_snippet}
              </p>

              <div className="mt-4 pt-3 border-t dark:border-gray-800 flex justify-end">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  View Job on Adzuna <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

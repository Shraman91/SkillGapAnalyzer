"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileSearch,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { fetchUserAnalyses } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Analysis = {
  id: string;
  role: string;
  score: number;
  date: string;
  createdAt: number;
};

export default function DashboardPage() {
  const { user, getToken } = useAuth();

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalyses() {
      try {
        setLoading(true);

        // No logged-in user
        if (!user) {
          setAnalyses([]);
          return;
        }

        // Get Firebase authentication token
        const token = await getToken();

        if (!token) {
          console.error("No authentication token available.");
          setAnalyses([]);
          return;
        }

        // Fetch analyses belonging to the current user
        const data = await fetchUserAnalyses(token);

        if (!data || data.length === 0) {
          setAnalyses([]);
          return;
        }

        const formatted: Analysis[] = data
          .map((item: any) => ({
            id:
              item.analysis_id ||
              item.id ||
              crypto.randomUUID(),

            role:
              item.role_title ||
              item.target_role ||
              "Unknown Role",

            score: Number(
              item.overall_readiness ??
              item.score ??
              item.match_score ??
              0
            ),

            date: item.created_at
              ? new Date(item.created_at).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                }
              )
              : "Recent",

            createdAt: item.created_at
              ? new Date(item.created_at).getTime()
              : 0,
          }))
          // Newest analysis first
          .sort((a: Analysis, b: Analysis) => b.createdAt - a.createdAt);

        setAnalyses(formatted);
      } catch (error) {
        console.error("Failed to load analyses:", error);
        setAnalyses([]);
      } finally {
        setLoading(false);
      }
    }

    loadAnalyses();
  }, [user, getToken]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600 dark:border-purple-950 dark:border-t-purple-500" />

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const totalAnalyses = analyses.length;

  const bestScore =
    analyses.length > 0
      ? Math.max(...analyses.map((item) => item.score))
      : 0;

  // Since analyses are sorted newest -> oldest,
  // the first item is the latest analysis.
  const latestScore =
    analyses.length > 0 ? analyses[0].score : 0;

  // Oldest score for progress comparison
  const oldestScore =
    analyses.length > 1
      ? analyses[analyses.length - 1].score
      : latestScore;

  const improvement =
    analyses.length > 1
      ? Math.max(0, latestScore - oldestScore)
      : 0;

  // Chart should show oldest -> newest
  const chartData = [...analyses]
    .reverse()
    .map((item, index) => ({
      name: item.date || `#${index + 1}`,
      score: item.score,
    }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-6 shadow-sm dark:border-purple-900/60 dark:from-purple-950/40 dark:via-black dark:to-purple-950/20 md:p-8">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
              <BarChart3 className="h-4 w-4" />
              Progress Overview
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Your Career Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 md:text-base">
              Track your skill-gap analyses, monitor your job readiness,
              and keep improving toward your target role.
            </p>
          </div>

          <Link
            href="/analyze"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg dark:bg-purple-600 dark:hover:bg-purple-700"
          >
            <FileSearch className="h-5 w-5" />
            New Analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl dark:bg-purple-700/20" />
        <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl dark:bg-purple-700/10" />
      </section>

      {/* Metric Cards */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Total Analyses */}
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-purple-900/70 dark:bg-zinc-900">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-purple-950/50 dark:text-purple-400">
              <FileSearch className="h-5 w-5" />
            </div>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-purple-950/50 dark:text-purple-300">
              Total
            </span>
          </div>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Analyses Run
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {totalAnalyses}
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
            Skill-gap reports completed
          </p>
        </div>

        {/* Best Score */}
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-purple-900/70 dark:bg-zinc-900">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Target className="h-5 w-5" />
            </div>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-purple-950/50 dark:text-purple-300">
              Best
            </span>
          </div>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Current Best Match
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {bestScore}%
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all dark:bg-purple-500"
              style={{
                width: `${Math.min(bestScore, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Improvement */}
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-purple-900/70 dark:bg-zinc-900">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-purple-950/50 dark:text-purple-400">
              <TrendingUp className="h-5 w-5" />
            </div>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              Progress
            </span>
          </div>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Improvement
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            +{improvement}%
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
            Change across your analyses
          </p>
        </div>
      </section>

      {/* Chart */}
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-purple-900/70 dark:bg-zinc-900 md:p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Readiness Trend
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              See how your job-readiness score changes over time.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-purple-400">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-purple-500" />
            Match Score
          </div>
        </div>

        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                opacity={0.08}
              />

              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />

              <Tooltip
                formatter={(value) => [
                  `${value}%`,
                  "Match Score",
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  boxShadow:
                    "0 8px 25px rgba(0,0,0,0.08)",
                  color: "#0f172a",
                }}
                itemStyle={{ color: "#2563eb", fontWeight: 600 }}
                labelStyle={{ color: "#0f172a", fontWeight: 700 }}
              />

              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: "var(--background)",
                }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Analyses */}
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-purple-900/70 dark:bg-zinc-900 md:p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Recent Analyses
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review your previous skill-gap analysis results.
            </p>
          </div>

          <Link
            href="/analyze"
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            Run another
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {analyses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-8 text-center dark:border-purple-900 dark:bg-purple-950/20">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-purple-950/60 dark:text-purple-400">
              <FileSearch className="h-6 w-6" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
              No analyses yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Run your first skill-gap analysis to see your results and
              progress here.
            </p>

            <Link
              href="/analyze"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-purple-600 dark:hover:bg-purple-700"
            >
              Start Analysis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="group flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-purple-900 dark:hover:bg-purple-950/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-purple-950/60 dark:text-purple-400">
                    <Target className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                      {analysis.role}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {analysis.date}
                      </span>

                      <span>•</span>

                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Analysis completed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Match
                    </p>

                    <p className="text-2xl font-bold text-blue-600 dark:text-purple-400">
                      {analysis.score}%
                    </p>
                  </div>

                  <Link
                    href={`/analyze/${analysis.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-purple-900 dark:bg-zinc-900 dark:text-purple-300 dark:hover:bg-purple-950/40"
                  >
                    View Analysis
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
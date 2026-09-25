"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchUserAnalyses } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  TrendingUp,
  Award,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  PlusCircle,
  Loader2
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const SAMPLE_DEMO_DATA = [
  {
    analysis_id: "demo-analysis-1",
    role_title: "Python Backend Developer",
    timestamp: "2026-09-18T10:00:00Z",
    gap_analysis: { match_score: 45, overall_readiness: "Developing" },
    date_formatted: "Sep 18",
    score: 45
  },
  {
    analysis_id: "demo-analysis-2",
    role_title: "Python Backend Developer",
    timestamp: "2026-09-20T14:30:00Z",
    gap_analysis: { match_score: 62, overall_readiness: "Developing" },
    date_formatted: "Sep 20",
    score: 62
  },
  {
    analysis_id: "demo-analysis-3",
    role_title: "Python Backend Developer (FastAPI)",
    timestamp: "2026-09-23T08:15:00Z",
    gap_analysis: { match_score: 78, overall_readiness: "Highly Qualified" },
    date_formatted: "Sep 23",
    score: 78
  }
];

export default function DashboardPage() {
  const { user, getToken, loading: authLoading } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAnalyses(SAMPLE_DEMO_DATA);
      setLoading(false);
      return;
    }

    getToken().then((token) => {
      if (token) {
        fetchUserAnalyses(token)
          .then((data) => {
            if (data && data.length > 0) {
              const formatted = data.map((item: any) => ({
                ...item,
                date_formatted: new Date(item.timestamp).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric"
                }),
                score: item.gap_analysis?.match_score || 0
              }));
              // Sort by date ascending for chart
              formatted.sort(
                (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
              setAnalyses(formatted);
            } else {
              setAnalyses(SAMPLE_DEMO_DATA);
            }
          })
          .catch((err) => {
            console.error("Failed to load user analyses:", err);
            setAnalyses(SAMPLE_DEMO_DATA);
          })
          .finally(() => setLoading(false));
      } else {
        setAnalyses(SAMPLE_DEMO_DATA);
        setLoading(false);
      }
    });
  }, [user, authLoading]);

  const bestScore = analyses.length > 0 ? Math.max(...analyses.map((a) => a.score || 0)) : 0;
  const improvement =
    analyses.length > 1
      ? (analyses[analyses.length - 1].score || 0) - (analyses[0].score || 0)
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="mt-3 text-xs text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {user ? `${user.displayName || "Student"}'s Dashboard` : "Student Dashboard"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Track your skill improvements, match scores, and learning milestones over time.
          </p>
        </div>
        <Link
          href="/analyze"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl transition shadow-md"
        >
          <PlusCircle className="w-4 h-4" /> Run New Analysis
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Analyses Run</span>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">{analyses.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Current Best Match</span>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{bestScore}%</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Improvement Rate</span>
            <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {improvement >= 0 ? `+${improvement}%` : `${improvement}%`}
            </h3>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Match Score Progression Trend
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Visualizing your growth as you complete roadmap chapters and update your resume profile.
        </p>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyses}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date_formatted" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} domain={[0, 100]} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px"
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 5, fill: "#2563eb" }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Past Analyses Table/Cards */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Recent Analysis Records</h3>
        <div className="space-y-3">
          {analyses
            .slice()
            .reverse()
            .map((a) => (
              <div
                key={a.analysis_id}
                className="bg-white dark:bg-gray-900 p-5 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-400 dark:hover:border-blue-600 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-gray-900 dark:text-white">{a.role_title}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(a.timestamp).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-gray-600 dark:text-gray-300">
                        {a.gap_analysis?.overall_readiness || "Analyzed"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{a.score}%</span>
                    <span className="block text-[10px] text-gray-400 uppercase font-semibold">Match Score</span>
                  </div>
                  <Link
                    href={`/analyze/${a.analysis_id}`}
                    className="px-4 py-2 border dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition"
                  >
                    View Roadmap <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

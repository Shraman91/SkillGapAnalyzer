"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAnalysisDetail, updateUnitProgress } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SkillsRadarChart } from "@/components/SkillsRadarChart";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  BookOpen,
  Video,
  FileText,
  Clock,
  Share2,
  Printer,
  ChevronDown,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Award,
  RefreshCw,
  Radar
} from "lucide-react";

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { getToken } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressState, setProgressState] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    getToken().then((token) => {
      fetchAnalysisDetail(id, token)
        .then((res) => {
          setData(res);
          if (res.progress) {
            const map: Record<string, boolean> = {};
            Object.keys(res.progress).forEach((k) => {
              map[k] = res.progress[k].completed;
            });
            setProgressState(map);
          }
        })
        .catch((err) => {
          console.error(err);
          setError("Could not load analysis details.");
        })
        .finally(() => setLoading(false));
    });
  }, [id]);

  const toggleUnit = async (unitId: string) => {
    const current = !!progressState[unitId];
    const nextVal = !current;

    // Optimistic UI update
    setProgressState((prev) => ({ ...prev, [unitId]: nextVal }));

    try {
      const token = await getToken();
      await updateUnitProgress(id, unitId, nextVal, token);
    } catch (err) {
      console.error("Failed to sync progress:", err);
      // Revert on error
      setProgressState((prev) => ({ ...prev, [unitId]: current }));
    }
  };

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500 font-medium">Loading analysis report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-2xl text-center max-w-lg mx-auto border border-red-200 dark:border-red-900">
        {error || "Report not found."}
      </div>
    );
  }

  const { gap_analysis, roadmaps, projects, interview_prep, role_title, candidate_skills, required_skills } = data;
  const matchScore = gap_analysis?.match_score || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-gray-800 pb-6">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 rounded-full">
            Analysis Report
          </span>
          <h2 className="text-3xl font-extrabold mt-2 text-gray-900 dark:text-white">
            {role_title || "Target Role"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Generated on {new Date(data.timestamp).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/analyze"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-xl text-xs font-bold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-Analyze
          </Link>
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3.5 py-2 border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium transition text-gray-700 dark:text-gray-300"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Share Link"}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-gray-800 text-white rounded-xl hover:bg-gray-800 text-xs font-medium transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Overview Cards: Match Score + Strengths/Weaknesses */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Match Score Card */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-100 dark:text-gray-800"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${
                  matchScore >= 70
                    ? "text-emerald-500"
                    : matchScore >= 50
                    ? "text-amber-500"
                    : "text-red-500"
                } transition-all duration-1000 ease-out`}
                strokeDasharray={`${matchScore}, 100`}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{matchScore}%</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Overlap</span>
            </div>
          </div>
          <span className="mt-4 font-bold text-gray-800 dark:text-gray-200">{gap_analysis?.overall_readiness}</span>
        </div>

        {/* Strengths */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4" /> Validated Strengths
            </h4>
            <div className="flex flex-wrap gap-2">
              {gap_analysis?.matched_skills?.map((s: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs px-2.5 py-1 rounded-lg font-medium border border-emerald-100 dark:border-emerald-900"
                >
                  {s}
                </span>
              ))}
              {gap_analysis?.matched_skills?.length === 0 && (
                <p className="text-xs text-gray-400">No overlapping skills detected.</p>
              )}
            </div>
          </div>
        </div>

        {/* Weaknesses / Gaps */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider mb-3">
              <HelpCircle className="w-4 h-4" /> Missing Key Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {gap_analysis?.missing_skills?.map((m: any, idx: number) => (
                <span
                  key={idx}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${
                    m.priority === "must-have"
                      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900"
                      : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900"
                  }`}
                >
                  {m.skill} ({m.priority})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Skills Radar Comparison Chart */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm space-y-3">
        <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Radar className="w-5 h-5 text-blue-600" />
          Skills Radar Comparison
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Comparing your candidate skill proficiency levels against the benchmark job requirements.
        </p>
        <SkillsRadarChart
          candidateSkills={candidate_skills || {}}
          requiredSkills={required_skills || {}}
        />
      </div>

      {/* Roadmap Explorer */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Targeted Learning Roadmaps
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Structured modular paths with verified resource links to bridge your identified skill gaps.
          </p>
        </div>

        <div className="space-y-4">
          {roadmaps?.map((roadmap: any) => {
            const isExpanded = expandedTopics[roadmap.topic_id] ?? true;

            // Compute total units & completed units for topic
            let totalUnits = 0;
            let completedUnits = 0;

            roadmap.chapters?.forEach((c: any) => {
              c.units?.forEach((u: any) => {
                totalUnits += 1;
                if (progressState[u.unit_id]) completedUnits += 1;
              });
            });

            const topicProgressPct = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

            return (
              <div
                key={roadmap.topic_id}
                className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden transition"
              >
                <div
                  onClick={() => toggleTopicExpand(roadmap.topic_id)}
                  className="p-5 flex items-center justify-between cursor-pointer bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition border-b dark:border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h4 className="font-bold text-base text-gray-900 dark:text-white">{roadmap.topic_name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {completedUnits} of {totalUnits} units completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${topicProgressPct}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{topicProgressPct}%</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 space-y-6">
                    {roadmap.chapters?.map((chapter: any) => (
                      <div key={chapter.chapter_number} className="border-l-2 border-blue-300 dark:border-blue-700 pl-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200">
                            Chapter {chapter.chapter_number}: {chapter.chapter_title}
                          </h5>
                          <span className="text-xs text-gray-400">{chapter.description}</span>
                        </div>

                        <div className="space-y-2 mt-2">
                          {chapter.units?.map((unit: any) => {
                            const isDone = !!progressState[unit.unit_id];
                            return (
                              <div
                                key={unit.unit_id}
                                className={`p-4 rounded-2xl border transition ${
                                  isDone
                                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                    : "bg-white dark:bg-gray-850 border-gray-100 dark:border-gray-800 shadow-sm"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3">
                                    <button
                                      onClick={() => toggleUnit(unit.unit_id)}
                                      className="mt-0.5 text-gray-400 hover:text-emerald-600 transition"
                                    >
                                      {isDone ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                      ) : (
                                        <Circle className="w-5 h-5" />
                                      )}
                                    </button>
                                    <div>
                                      <h6
                                        className={`font-semibold text-sm ${
                                          isDone ? "line-through text-gray-400" : "text-gray-900 dark:text-white"
                                        }`}
                                      >
                                        {unit.unit_title}
                                      </h6>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{unit.summary}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Resources List */}
                                <div className="mt-3 pl-8 flex flex-wrap gap-2">
                                  {unit.resources?.map((res: any, idx: number) => (
                                    <a
                                      key={idx}
                                      href={res.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-750 dark:text-gray-200 text-xs rounded-xl border dark:border-gray-700 transition"
                                    >
                                      {res.type === "video" ? (
                                        <Video className="w-3.5 h-3.5 text-red-500" />
                                      ) : (
                                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                                      )}
                                      <span>{res.title}</span>
                                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5 ml-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {res.est_minutes}m
                                      </span>
                                      <ExternalLink className="w-3 h-3 text-gray-400 ml-1" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Projects */}
      {projects && projects.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Award className="w-6 h-6 text-indigo-600" />
            Recommended Portfolio Projects
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((proj: any) => (
              <div
                key={proj.project_id}
                className="bg-white dark:bg-gray-900 p-5 rounded-3xl border dark:border-gray-800 shadow-sm space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                    {proj.skill}
                  </span>
                  <span className="text-xs font-medium text-gray-500">{proj.difficulty}</span>
                </div>
                <h4 className="font-bold text-base text-gray-900 dark:text-white">{proj.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview Prep Section */}
      {interview_prep && interview_prep.length > 0 && (
        <div className="space-y-4 border-t dark:border-gray-800 pt-8">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Targeted Interview Preparation
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Custom technical and behavioral questions unlocked based on your high skill match score.
            </p>
          </div>

          <div className="space-y-4">
            {interview_prep.map((q: any) => (
              <div
                key={q.q_id}
                className="bg-white dark:bg-gray-900 p-5 rounded-3xl border dark:border-gray-800 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded">
                    {q.category}
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{q.question}</h4>
                <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-2xl text-xs text-gray-600 dark:text-gray-300 leading-relaxed border dark:border-gray-700">
                  <strong className="text-gray-900 dark:text-white block mb-1 font-semibold">Model Answer:</strong>
                  {q.model_answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

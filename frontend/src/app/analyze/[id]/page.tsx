"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  Radar,
} from "lucide-react";

export default function AnalysisDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { getToken } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressState, setProgressState] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedTopics, setExpandedTopics] = useState<
    Record<string, boolean>
  >({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    getToken().then((token) => {
      fetchAnalysisDetail(id, token)
        .then((res) => {
          setData(res);

          if (res.progress) {
            const map: Record<string, boolean> = {};

            Object.keys(res.progress).forEach((key) => {
              map[key] = res.progress[key].completed;
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
  }, [id, getToken]);

  const toggleUnit = async (unitId: string) => {
    const current = !!progressState[unitId];
    const nextVal = !current;

    setProgressState((prev) => ({
      ...prev,
      [unitId]: nextVal,
    }));

    try {
      const token = await getToken();
      await updateUnitProgress(id, unitId, nextVal, token);
    } catch (err) {
      console.error("Failed to sync progress:", err);

      setProgressState((prev) => ({
        ...prev,
        [unitId]: current,
      }));
    }
  };

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Could not copy link:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-purple-900 dark:border-t-purple-500" />

        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading analysis report...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-400">
        {error || "Report not found."}
      </div>
    );
  }

  const {
    gap_analysis,
    roadmaps,
    projects,
    interview_prep,
    role_title,
    candidate_skills,
    required_skills,
  } = data;

  const matchScore = gap_analysis?.match_score || 0;

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-16">
      {/* -------------------------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------------------------- */}

      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm dark:border-purple-900/60 dark:bg-[#090909] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-purple-900/70 dark:bg-purple-950/40 dark:text-purple-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI Analysis Report
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              {role_title || "Target Role"}
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Generated on{" "}
              {new Date(data.timestamp).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-purple-900/70 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Re-Analyze
            </Link>

            <button
              onClick={copyShareLink}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-purple-900/60 dark:bg-black dark:text-slate-300 dark:hover:bg-purple-950/30"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Share Link"}
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 dark:bg-purple-600 dark:hover:bg-purple-700"
            >
              <Printer className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* OVERVIEW */}
      {/* -------------------------------------------------- */}

      <section className="grid gap-5 md:grid-cols-3">
        {/* Match Score */}
        <div className="rounded-3xl border border-blue-100 bg-white p-7 text-center shadow-sm dark:border-purple-900/60 dark:bg-[#090909]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-purple-400">
            Skill Match
          </p>

          <div className="relative mx-auto mt-5 h-36 w-36">
            <svg
              className="h-full w-full -rotate-90"
              viewBox="0 0 36 36"
            >
              <path
                className="text-blue-100 dark:text-purple-950"
                stroke="currentColor"
                strokeWidth="3.8"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />

              <path
                className="text-blue-600 transition-all duration-1000 dark:text-purple-500"
                stroke="currentColor"
                strokeDasharray={`${matchScore}, 100`}
                strokeWidth="3.8"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-900 dark:text-white">
                {matchScore}%
              </span>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Match
              </span>
            </div>
          </div>

          <p className="mt-5 text-sm font-bold text-slate-700 dark:text-slate-200">
            {gap_analysis?.overall_readiness}
          </p>
        </div>

        {/* Strengths */}
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm dark:border-purple-900/60 dark:bg-[#090909]">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2 dark:bg-purple-950/50">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-purple-400" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Your Strengths
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {gap_analysis?.matched_skills?.map(
              (skill: string, index: number) => (
                <span
                  key={index}
                  className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
                >
                  {skill}
                </span>
              )
            )}

            {gap_analysis?.matched_skills?.length === 0 && (
              <p className="text-xs text-slate-400">
                No overlapping skills detected.
              </p>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm dark:border-purple-900/60 dark:bg-[#090909]">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-xl bg-red-50 p-2 dark:bg-red-950/30">
              <HelpCircle className="h-4 w-4 text-red-500" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Skills to Improve
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {gap_analysis?.missing_skills?.map(
              (skill: any, index: number) => (
                <span
                  key={index}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                    skill.priority === "must-have"
                      ? "border-red-100 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                      : "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
                  }`}
                >
                  {skill.skill} ({skill.priority})
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* RADAR CHART */}
      {/* -------------------------------------------------- */}

      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm dark:border-purple-900/60 dark:bg-[#090909] md:p-7">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2 dark:bg-purple-950/50">
              <Radar className="h-5 w-5 text-blue-600 dark:text-purple-400" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Skills Radar Comparison
            </h2>
          </div>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Compare your current skill levels against the benchmark
            requirements for the target role.
          </p>
        </div>

        <SkillsRadarChart
          candidateSkills={candidate_skills || {}}
          requiredSkills={required_skills || {}}
        />
      </section>

      {/* -------------------------------------------------- */}
      {/* LEARNING ROADMAP */}
      {/* -------------------------------------------------- */}

      <section className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2 dark:bg-purple-950/50">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-purple-400" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Targeted Learning Roadmaps
            </h2>
          </div>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Follow structured learning paths to bridge your identified skill
            gaps.
          </p>
        </div>

        <div className="space-y-4">
          {roadmaps?.map((roadmap: any) => {
            const isExpanded =
              expandedTopics[roadmap.topic_id] ?? true;

            let totalUnits = 0;
            let completedUnits = 0;

            roadmap.chapters?.forEach((chapter: any) => {
              chapter.units?.forEach((unit: any) => {
                totalUnits += 1;

                if (progressState[unit.unit_id]) {
                  completedUnits += 1;
                }
              });
            });

            const progressPercent =
              totalUnits > 0
                ? Math.round((completedUnits / totalUnits) * 100)
                : 0;

            return (
              <div
                key={roadmap.topic_id}
                className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm dark:border-purple-900/60 dark:bg-[#090909]"
              >
                {/* Topic Header */}
                <button
                  onClick={() =>
                    toggleTopicExpand(roadmap.topic_id)
                  }
                  className="flex w-full items-center justify-between gap-4 border-b border-blue-100 bg-blue-50/60 p-5 text-left transition hover:bg-blue-50 dark:border-purple-900/60 dark:bg-purple-950/20 dark:hover:bg-purple-950/40"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-blue-500 dark:text-purple-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-blue-500 dark:text-purple-400" />
                    )}

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {roadmap.topic_name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {completedUnits} of {totalUnits} units completed
                      </p>
                    </div>
                  </div>

                  <div className="hidden items-center gap-3 sm:flex">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-blue-100 dark:bg-purple-950">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all dark:bg-purple-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <span className="text-xs font-bold text-blue-700 dark:text-purple-300">
                      {progressPercent}%
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="space-y-7 p-5 md:p-7">
                    {roadmap.chapters?.map((chapter: any) => (
                      <div
                        key={chapter.chapter_number}
                        className="border-l-2 border-blue-200 pl-5 dark:border-purple-800"
                      >
                        <div className="mb-4">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            Chapter {chapter.chapter_number}:{" "}
                            {chapter.chapter_title}
                          </h4>

                          {chapter.description && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {chapter.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-3">
                          {chapter.units?.map((unit: any) => {
                            const isDone =
                              !!progressState[unit.unit_id];

                            return (
                              <div
                                key={unit.unit_id}
                                className={`rounded-2xl border p-4 transition ${
                                  isDone
                                    ? "border-blue-200 bg-blue-50/60 dark:border-purple-800 dark:bg-purple-950/20"
                                    : "border-slate-200 bg-white hover:border-blue-200 dark:border-purple-900/60 dark:bg-black dark:hover:border-purple-700"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={() =>
                                      toggleUnit(unit.unit_id)
                                    }
                                    className="mt-0.5 shrink-0 transition hover:scale-105"
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-purple-500" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-slate-400 hover:text-blue-500 dark:text-slate-600 dark:hover:text-purple-400" />
                                    )}
                                  </button>

                                  <div className="min-w-0 flex-1">
                                    <h5
                                      className={`text-sm font-semibold ${
                                        isDone
                                          ? "text-slate-400 line-through"
                                          : "text-slate-900 dark:text-white"
                                      }`}
                                    >
                                      {unit.unit_title}
                                    </h5>

                                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                      {unit.summary}
                                    </p>
                                  </div>
                                </div>

                                {/* Resources */}
                                <div className="mt-4 flex flex-wrap gap-2 pl-8">
                                  {unit.resources?.map(
                                    (resource: any, index: number) => (
                                      <a
                                        key={index}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 dark:border-purple-900/60 dark:bg-purple-950/20 dark:text-slate-300 dark:hover:border-purple-700 dark:hover:bg-purple-950/50"
                                      >
                                        {resource.type === "video" ? (
                                          <Video className="h-3.5 w-3.5 text-red-500" />
                                        ) : (
                                          <FileText className="h-3.5 w-3.5 text-blue-500 dark:text-purple-400" />
                                        )}

                                        <span className="max-w-[180px] truncate">
                                          {resource.title}
                                        </span>

                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                          <Clock className="h-2.5 w-2.5" />
                                          {resource.est_minutes}m
                                        </span>

                                        <ExternalLink className="h-3 w-3 text-slate-400" />
                                      </a>
                                    )
                                  )}
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
      </section>

      {/* -------------------------------------------------- */}
      {/* PORTFOLIO PROJECTS */}
      {/* -------------------------------------------------- */}

      {projects && projects.length > 0 && (
        <section className="space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-blue-50 p-2 dark:bg-purple-950/50">
                <Award className="h-5 w-5 text-blue-600 dark:text-purple-400" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Recommended Portfolio Projects
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Practical projects you can build to demonstrate your skills.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project: any) => (
              <div
                key={project.project_id}
                className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-purple-900/60 dark:bg-[#090909]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300">
                    {project.skill}
                  </span>

                  <span className="text-xs font-semibold text-slate-400">
                    {project.difficulty}
                  </span>
                </div>

                <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
                  {project.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {project.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------- */}
      {/* INTERVIEW PREPARATION */}
      {/* -------------------------------------------------- */}

      {interview_prep && interview_prep.length > 0 && (
        <section className="space-y-5 border-t border-blue-100 pt-8 dark:border-purple-900/60">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-blue-50 p-2 dark:bg-purple-950/50">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-purple-400" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Targeted Interview Preparation
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Practice technical and behavioral questions based on your
              analysis.
            </p>
          </div>

          <div className="space-y-4">
            {interview_prep.map((question: any) => (
              <div
                key={question.q_id}
                className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm dark:border-purple-900/60 dark:bg-[#090909]"
              >
                <span className="inline-flex rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300">
                  {question.category}
                </span>

                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                  {question.question}
                </h3>

                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-purple-900/60 dark:bg-purple-950/20">
                  <p className="mb-1 text-xs font-bold text-slate-900 dark:text-white">
                    Model Answer
                  </p>

                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {question.model_answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
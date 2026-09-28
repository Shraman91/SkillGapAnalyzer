"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  MessageCircle,
  User,
  Loader2,
  Target,
  BookOpen,
  TrendingUp,
  RotateCcw,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import {
  api,
  fetchAnalysisDetail,
  fetchUserAnalyses,
} from "@/lib/api";

type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
};

type AnalysisContext = {
  analysisId: string | null;
  targetRole: string | null;
  candidateSkills: string[];
  missingSkills: string[];
  readinessScore: number | null;
};

const INITIAL_MESSAGE: Message = {
  id: 1,
  sender: "bot",
  text: "Hi! 👋 I'm your Skill Gap Assistant. I can look at your latest skill-gap analysis and help you decide what to learn, how to improve your readiness, and how to prepare for your target role.",
};

const QUICK_SUGGESTIONS = [
  {
    label: "What should I learn next?",
    icon: BookOpen,
  },
  {
    label: "How can I improve my readiness?",
    icon: TrendingUp,
  },
  {
    label: "Explain my skill gaps",
    icon: Target,
  },
];

function cleanSkillName(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractCandidateSkills(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.keys(value as Record<string, unknown>)
    .map(cleanSkillName)
    .filter(Boolean);
}

function extractMissingSkills(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return cleanSkillName(item);
      }

      if (item && typeof item === "object") {
        const skill = (item as Record<string, unknown>).skill;

        if (typeof skill === "string") {
          return cleanSkillName(skill);
        }
      }

      return "";
    })
    .filter(Boolean);
}

function getReadinessScore(detail: any): number | null {
  const score = detail?.gap_analysis?.match_score;

  if (typeof score === "number" && Number.isFinite(score)) {
    return Math.round(score);
  }

  return null;
}

function getLatestAnalysis(analyses: unknown[]) {
  if (!Array.isArray(analyses) || analyses.length === 0) {
    return null;
  }

  return [...analyses].sort((a, b) => {
    const first = a as Record<string, unknown>;
    const second = b as Record<string, unknown>;

    const firstDate = new Date(
      String(
        first.timestamp ??
          first.created_at ??
          first.createdAt ??
          first.date ??
          0
      )
    ).getTime();

    const secondDate = new Date(
      String(
        second.timestamp ??
          second.created_at ??
          second.createdAt ??
          second.date ??
          0
      )
    ).getTime();

    return secondDate - firstDate;
  })[0] as Record<string, unknown>;
}

export function ChatBot() {
  const { user, loading: authLoading, getToken } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  const [analysisContext, setAnalysisContext] =
    useState<AnalysisContext | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const contextSummary = useMemo(() => {
    if (!analysisContext) return null;

    return {
      role: analysisContext.targetRole || "Not available",
      skills: analysisContext.candidateSkills.length,
      missing: analysisContext.missingSkills.length,
      readiness:
        analysisContext.readinessScore !== null
          ? `${analysisContext.readinessScore}%`
          : "Not available",
    };
  }, [analysisContext]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && !authLoading && user) {
      loadLatestAnalysis();
    }
  }, [isOpen, authLoading, user]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    }
  }, [isOpen]);

  const loadLatestAnalysis = async () => {
    if (!user) return;

    try {
      setIsLoadingAnalysis(true);

      const token = await getToken();

      if (!token) {
        setAnalysisContext(null);
        return;
      }

      // Get all analyses belonging to the current user
      const analyses = await fetchUserAnalyses(token);

      if (!Array.isArray(analyses) || analyses.length === 0) {
        setAnalysisContext({
          analysisId: null,
          targetRole: null,
          candidateSkills: [],
          missingSkills: [],
          readinessScore: null,
        });

        return;
      }

      // Select newest analysis
      const latest = getLatestAnalysis(analyses);

      if (!latest) {
        setAnalysisContext(null);
        return;
      }

      const analysisId = String(
        latest.analysis_id ??
          latest.analysisId ??
          latest.id ??
          ""
      );

      if (!analysisId) {
        setAnalysisContext({
          analysisId: null,
          targetRole:
            typeof latest.role_title === "string"
              ? latest.role_title
              : null,
          candidateSkills: extractCandidateSkills(
            latest.candidate_skills
          ),
          missingSkills: extractMissingSkills(
            latest.gap_analysis?.missing_skills
          ),
          readinessScore: getReadinessScore(latest),
        });

        return;
      }

      // Get the complete analysis
      const detail = await fetchAnalysisDetail(
        analysisId,
        token
      );

      console.log("Chatbot analysis data:", detail);

      const candidateSkills = extractCandidateSkills(
        detail?.candidate_skills
      );

      const missingSkills = extractMissingSkills(
        detail?.gap_analysis?.missing_skills
      );

      const readinessScore = getReadinessScore(detail);

      const targetRole =
        typeof detail?.role_title === "string"
          ? detail.role_title
          : null;

      setAnalysisContext({
        analysisId,
        targetRole,
        candidateSkills,
        missingSkills,
        readinessScore,
      });
    } catch (error) {
      console.error(
        "Failed to load latest analysis:",
        error
      );

      setAnalysisContext(null);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const addBotMessage = (text: string) => {
    setMessages((previous) => [
      ...previous,
      {
        id: Date.now() + Math.random(),
        sender: "bot",
        text,
      },
    ]);
  };

  const sendMessage = async (
    messageOverride?: string
  ) => {
    const message = (
      messageOverride ?? input
    ).trim();

    if (!message || isLoading) return;

    if (!user) {
      addBotMessage(
        "Please sign in first so I can securely access your SkillGapAnalyzer results."
      );
      return;
    }

    setInput("");

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        sender: "user",
        text: message,
      },
    ]);

    setIsLoading(true);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token unavailable."
        );
      }

      const response = await api.post(
        "/chat/",
        {
          message,

          target_role:
            analysisContext?.targetRole ?? null,

          candidate_skills:
            analysisContext?.candidateSkills ?? [],

          missing_skills:
            analysisContext?.missingSkills ?? [],

          readiness_score:
            analysisContext?.readinessScore ?? null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const botResponse =
        response?.data?.response ||
        "I couldn't generate a response right now. Please try again.";

      addBotMessage(botResponse);
    } catch (error) {
      console.error(
        "Chatbot request failed:",
        error
      );

      addBotMessage(
        "Sorry, I couldn't connect to the AI assistant right now. Please make sure the backend and Gemini service are running, then try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();
    sendMessage();
  };

  const resetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
  };

  return (
    <>
      <style jsx>{`
        @keyframes chatbotFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes chatbotPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.35);
          }

          70% {
            box-shadow: 0 0 0 12px rgba(168, 85, 247, 0);
          }

          100% {
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0);
          }
        }

        @keyframes chatbotOpen {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.94);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes messageIn {
          0% {
            opacity: 0;
            transform: translateY(7px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typingDot {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.45;
          }

          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        .chatbot-float {
          animation:
            chatbotFloat 3s ease-in-out infinite,
            chatbotPulse 2.8s ease-out infinite;
        }

        .chatbot-window {
          animation: chatbotOpen 0.28s ease-out;
        }

        .chat-message {
          animation: messageIn 0.25s ease-out;
        }

        .typing-dot:nth-child(1) {
          animation: typingDot 1.2s infinite;
        }

        .typing-dot:nth-child(2) {
          animation: typingDot 1.2s 0.15s infinite;
        }

        .typing-dot:nth-child(3) {
          animation: typingDot 1.2s 0.3s infinite;
        }
      `}</style>

      {/* Floating chatbot button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Skill Gap Assistant"
          className="chatbot-float fixed bottom-6 right-6 z-[100] flex h-16 w-16 items-center justify-center rounded-full border border-blue-400/30 bg-blue-600 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 dark:border-purple-400/30 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-500/30"
        >
          <Bot className="h-8 w-8" />

          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md dark:bg-black">
            <Sparkles className="h-3 w-3 text-blue-600 dark:text-purple-400" />
          </span>
        </button>
      )}

      {/* Background overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-lg transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-window fixed bottom-5 right-5 z-[100] flex h-[min(700px,calc(100vh-40px))] w-[min(430px,calc(100vw-40px))] flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl dark:border-purple-900/70 dark:bg-[#090909]">
          {/* Header */}
          <div className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-4 text-white dark:border-purple-900/70 dark:from-purple-700 dark:to-purple-900">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur">
                  <Bot className="h-6 w-6" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">
                      Skill Gap Assistant
                    </h2>

                    <Sparkles className="h-4 w-4 text-yellow-200" />
                  </div>

                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-blue-100 dark:text-purple-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    AI career guidance
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetChat}
                  aria-label="Reset chat"
                  className="rounded-xl p-2 transition hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chatbot"
                  className="rounded-xl p-2 transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Analysis summary */}
          <div className="border-b border-blue-100 bg-slate-50 px-4 py-3 dark:border-purple-900/50 dark:bg-black">
            {isLoadingAnalysis ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading your latest analysis...
              </div>
            ) : contextSummary ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-blue-100 bg-white px-2.5 py-2 dark:border-purple-900/60 dark:bg-[#111]">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Role
                  </p>

                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 dark:text-white">
                    {contextSummary.role}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-white px-2.5 py-2 dark:border-purple-900/60 dark:bg-[#111]">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Skills
                  </p>

                  <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-white">
                    {contextSummary.skills}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-white px-2.5 py-2 dark:border-purple-900/60 dark:bg-[#111]">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Readiness
                  </p>

                  <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-white">
                    {contextSummary.readiness}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                Run a skill-gap analysis to unlock personalized advice.
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 dark:bg-[#090909]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message flex items-end gap-2 ${
                    message.sender === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {message.sender === "bot" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-purple-950/60 dark:text-purple-400">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.sender === "user"
                        ? "rounded-br-md bg-blue-600 text-white dark:bg-purple-600"
                        : "rounded-bl-md border border-blue-100 bg-blue-50 text-slate-700 dark:border-purple-900/60 dark:bg-purple-950/30 dark:text-slate-200"
                    }`}
                  >
                    {message.text}
                  </div>

                  {message.sender === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="chat-message flex items-end gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-purple-950/60 dark:text-purple-400">
                    <Bot className="h-4 w-4" />
                  </div>

                  <div className="rounded-2xl rounded-bl-md border border-blue-100 bg-blue-50 px-4 py-3 dark:border-purple-900/60 dark:bg-purple-950/30">
                    <div className="flex items-center gap-1.5">
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-purple-400" />
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-purple-400" />
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-purple-400" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick suggestions */}
          {!isLoading && messages.length <= 2 && (
            <div className="border-t border-blue-100 bg-white px-4 py-3 dark:border-purple-900/50 dark:bg-[#090909]">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Try asking
              </p>

              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((suggestion) => {
                  const Icon = suggestion.icon;

                  return (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() =>
                        sendMessage(suggestion.label)
                      }
                      className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-purple-900/60 dark:bg-[#111] dark:text-slate-300 dark:hover:border-purple-600 dark:hover:bg-purple-950/30 dark:hover:text-purple-300"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {suggestion.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-blue-100 bg-white p-3 dark:border-purple-900/60 dark:bg-[#090909]"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-slate-50 p-1.5 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 dark:border-purple-900/60 dark:bg-[#111] dark:focus-within:border-purple-500 dark:focus-within:ring-purple-500/10">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                disabled={isLoading}
                maxLength={2000}
                placeholder="Ask about your skills..."
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all hover:scale-105 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-purple-600 dark:hover:bg-purple-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <MessageCircle className="h-3 w-3" />
                Powered by your SkillGapAnalyzer data
              </div>

              <span className="text-[10px] text-slate-400">
                {input.length}/2000
              </span>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
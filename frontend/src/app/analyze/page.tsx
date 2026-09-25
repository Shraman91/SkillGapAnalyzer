"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchRoles, runAnalysis } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Upload, FileText, Briefcase, ArrowRight, Loader2 } from "lucide-react";

export default function AnalyzePage() {
  const router = useRouter();
  const { getToken } = useAuth();

  // State
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/v1/resume/upload-pdf", {
        method: "POST",
        body: formData,
      });
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
      setError(err.response?.data?.detail || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          New Skill Gap Analysis
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          Compare your background against a target role to find gaps and generate a custom roadmap.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-2xl text-sm border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Candidate Background */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <FileText className="w-5 h-5 text-blue-600" />
              1. Your Background & Skills
            </h3>
            <div className="flex gap-2 text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setResumeMode("text")}
                className={`px-3 py-1 rounded-lg transition ${
                  resumeMode === "text"
                    ? "bg-white dark:bg-gray-700 shadow-sm font-semibold text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Paste Text
              </button>
              <button
                type="button"
                onClick={() => setResumeMode("upload")}
                className={`px-3 py-1 rounded-lg transition ${
                  resumeMode === "upload"
                    ? "bg-white dark:bg-gray-700 shadow-sm font-semibold text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Upload PDF
              </button>
            </div>
          </div>

          {resumeMode === "text" ? (
            <textarea
              rows={6}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume content, list of projects, or raw technical skills here (e.g., Python, React, SQL, Git)..."
              className="w-full p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm leading-relaxed dark:text-white"
            />
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
              <Upload className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <label className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm">
                  Click to upload a PDF resume
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-1">PDF up to 5MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Target Role */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              2. Target Position
            </h3>
            <div className="flex gap-2 text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTargetMode("role")}
                className={`px-3 py-1 rounded-lg transition ${
                  targetMode === "role"
                    ? "bg-white dark:bg-gray-700 shadow-sm font-semibold text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Predefined Role
              </button>
              <button
                type="button"
                onClick={() => setTargetMode("custom")}
                className={`px-3 py-1 rounded-lg transition ${
                  targetMode === "custom"
                    ? "bg-white dark:bg-gray-700 shadow-sm font-semibold text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Custom Job Description
              </button>
            </div>
          </div>

          {targetMode === "role" ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Select Standard Target Profile
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm dark:text-white"
              >
                {roles.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description or requirements section here..."
              className="w-full p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm leading-relaxed dark:text-white"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running Multi-Agent Analysis...
            </>
          ) : (
            <>
              Run AI Skill Gap Analysis
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

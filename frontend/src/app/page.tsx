import Link from "next/link";
import { ArrowRight, Target, TrendingUp, Briefcase } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-16 md:py-24 px-4">
        <div className="max-w-4xl space-y-7">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300">
            AI-Powered Career Guidance
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Bridge the gap between{" "}
            <span className="text-blue-600 dark:text-purple-400">
              your skills
            </span>{" "}
            and your dream job.
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
            Upload your resume and a target job description. Our AI analyzes
            the overlap, identifies missing skills, and builds a personalized
            learning roadmap.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-purple-600 dark:hover:bg-purple-700 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Start Free Analysis
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/roles"
              className="inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-purple-900 rounded-xl hover:bg-blue-50 dark:hover:bg-purple-950/40 transition-all shadow-sm"
            >
              Browse Roles
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="group bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-blue-100 dark:border-purple-900/70 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-50 dark:bg-purple-950/50 text-blue-600 dark:text-purple-400 rounded-xl mb-5">
              <Target className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Deterministic Gap Analysis
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We don't guess your score. Our Python engine performs
              deterministic diffs against required tech stacks.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-blue-100 dark:border-purple-900/70 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-50 dark:bg-purple-950/50 text-blue-600 dark:text-purple-400 rounded-xl mb-5">
              <TrendingUp className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Actionable Roadmaps
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Get structured 4-chapter learning plans with verified resources,
              time estimates, and tailored projects.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-blue-100 dark:border-purple-900/70 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-50 dark:bg-purple-950/50 text-blue-600 dark:text-purple-400 rounded-xl mb-5">
              <Briefcase className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Live Market Readiness
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Connect to live Adzuna data to see how your resume performs
              against real active job listings.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
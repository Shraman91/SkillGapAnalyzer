"use client";

import { useEffect, useState } from "react";
import { fetchRoles } from "@/lib/api";
import Link from "next/link";
import {
  Briefcase,
  ArrowRight,
  CheckCircle,
  Star,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles()
      .then((data) => setRoles(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-purple-950/50">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-purple-400" />
        </div>

        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading career profiles...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">

      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-6 shadow-sm dark:border-purple-900/60 dark:from-purple-950/40 dark:via-black dark:to-purple-950/20 md:p-8">
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
            <Sparkles className="h-4 w-4" />
            Career Profiles
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            Explore Career Roles
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 md:text-base">
            Explore predefined career profiles and understand the skills
            commonly required for each target role.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white/80 px-4 py-3 text-xs font-medium text-slate-600 dark:border-purple-900/60 dark:bg-black/40 dark:text-slate-300">
            <Target className="h-4 w-4 text-blue-600 dark:text-purple-400" />
            Choose a role to compare it with your current skills.
          </div>
        </div>

        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl dark:bg-purple-700/20" />
        <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl dark:bg-purple-700/10" />
      </section>

      {/* Role count */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Available Roles
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {roles.length} career profile{roles.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {roles.map((role) => {
          const skillsEntries = Object.entries(
            role.required_skills || {}
          );

          const mustHaves = skillsEntries.filter(
            ([_, priority]) => priority === "must-have"
          );

          const niceToHaves = skillsEntries.filter(
            ([_, priority]) => priority === "nice-to-have"
          );

          return (
            <article
              key={role.role_id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg dark:border-purple-900/70 dark:bg-zinc-900 dark:hover:border-purple-700"
            >
              {/* Card Header */}
              <div className="border-b border-blue-50 p-6 dark:border-purple-900/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-purple-950/60 dark:text-purple-400">
                    <Briefcase className="h-6 w-6" />
                  </div>

                  <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300">
                    {skillsEntries.length} skills
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {role.role_name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {role.description}
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div className="flex-1 space-y-6 p-6">

                {/* Must Have */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-purple-950/50">
                      <CheckCircle className="h-4 w-4 text-blue-600 dark:text-purple-400" />
                    </div>

                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Must-Have Skills
                    </h4>
                  </div>

                  {mustHaves.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {mustHaves.map(([skill]) => (
                        <span
                          key={skill}
                          className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      No must-have skills listed.
                    </p>
                  )}
                </div>

                {/* Nice To Have */}
                {niceToHaves.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
                        <Star className="h-4 w-4 text-amber-500" />
                      </div>

                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Nice-to-Have Skills
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {niceToHaves.map(([skill]) => (
                        <span
                          key={skill}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="border-t border-blue-50 bg-slate-50/70 p-5 dark:border-purple-900/50 dark:bg-zinc-950/50">
                <Link
                  href="/analyze"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md dark:bg-purple-600 dark:hover:bg-purple-700"
                >
                  Analyze My Resume
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 dark:border-purple-900/60 dark:bg-purple-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              Don't see your exact role?
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Use a custom job description in the analysis page instead.
            </p>
          </div>

          <Link
            href="/analyze"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-purple-900 dark:bg-zinc-900 dark:text-purple-300 dark:hover:bg-purple-950/40"
          >
            Custom Analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
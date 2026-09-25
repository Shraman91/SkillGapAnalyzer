"use client";

import { useEffect, useState } from "react";
import { fetchRoles } from "@/lib/api";
import Link from "next/link";
import { Briefcase, ArrowRight, CheckCircle, Star, Loader2 } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="mt-3 text-xs text-gray-500">Loading career profiles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Predefined Career Roles
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          Explore benchmark skill standards for software, data, and cloud roles created by industry requirements.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {roles.map((role) => {
          const skillsEntries = Object.entries(role.required_skills || {});
          const mustHaves = skillsEntries.filter(([_, priority]) => priority === "must-have");
          const niceToHaves = skillsEntries.filter(([_, priority]) => priority === "nice-to-have");

          return (
            <div
              key={role.role_id}
              className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono text-gray-400 font-medium">
                    {skillsEntries.length} skills benchmarked
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{role.role_name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{role.description}</p>
                </div>

                {/* Must Haves */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" /> Must-Have Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {mustHaves.map(([skill]) => (
                      <span
                        key={skill}
                        className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-1 rounded-lg font-medium border border-blue-100 dark:border-blue-900"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Nice To Haves */}
                {niceToHaves.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500" /> Nice-to-Have Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {niceToHaves.map(([skill]) => (
                        <span
                          key={skill}
                          className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1 rounded-lg font-medium border dark:border-gray-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t dark:border-gray-800">
                <Link
                  href={`/analyze`}
                  className="w-full py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-blue-600 hover:text-white text-gray-700 dark:text-gray-200 font-semibold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition"
                >
                  Analyze My Resume For This Role <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

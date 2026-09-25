import Link from "next/link";
import { ArrowRight, Target, TrendingUp, Briefcase } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Bridge the gap between <span className="text-blue-600">your skills</span> and your dream job.
        </h1>

        <p className="text-xl text-gray-600 leading-relaxed">
          Upload your resume and a target job description. Our AI analyzes the overlap,
          identifies missing skills, and builds a personalized learning roadmap.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <Link href="/analyze" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg">
            Start Free Analysis <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/roles" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm hover:shadow">
            Browse Roles
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-32 text-left max-w-5xl">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Deterministic Gap Analysis</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            We don't guess your score. Our python engine performs deterministic diffs against required tech stacks.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Actionable Roadmaps</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Get structured 4-chapter learning plans with verified resources, time estimates, and tailored projects.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Live Market Readiness</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Connect to live Adzuna data to see exactly how your resume performs against real active job listings.
          </p>
        </div>
      </div>
    </div>
  );
}

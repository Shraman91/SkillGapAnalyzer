"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";

interface SkillsRadarChartProps {
  candidateSkills: Record<string, string>; // e.g. { Python: "Advanced", FastAPI: "Intermediate" }
  requiredSkills: Record<string, string>;  // e.g. { Python: "must-have", Docker: "must-have" }
}

const PROFICIENCY_NUM: Record<string, number> = {
  Beginner: 40,
  Intermediate: 70,
  Advanced: 95,
  Expert: 100,
};

const PRIORITY_NUM: Record<string, number> = {
  "must-have": 100,
  "nice-to-have": 60,
};

export function SkillsRadarChart({ candidateSkills = {}, requiredSkills = {} }: SkillsRadarChartProps) {
  // Collect union of unique skills (max 8 for a clean radar polygon)
  const allSkillKeys = Array.from(
    new Set([...Object.keys(requiredSkills), ...Object.keys(candidateSkills)])
  ).slice(0, 8);

  const normCandidate = Object.fromEntries(
    Object.entries(candidateSkills).map(([k, v]) => [k.toLowerCase(), v])
  );

  const data = allSkillKeys.map((skill) => {
    const reqPriority = requiredSkills[skill] || "nice-to-have";
    const requiredVal = PRIORITY_NUM[reqPriority] || 60;

    const candProf = candidateSkills[skill] || normCandidate[skill.toLowerCase()];
    const candidateVal = candProf ? PROFICIENCY_NUM[candProf] || 50 : 0;

    return {
      skill,
      Candidate: candidateVal,
      Required: requiredVal,
      fullMark: 100,
    };
  });

  if (data.length < 3) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-gray-400">
        Not enough skills data to plot radar graph.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#6b7280" }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#9ca3af" }} />
          <Radar
            name="Your Skills"
            dataKey="Candidate"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.4}
          />
          <Radar
            name="Required Target"
            dataKey="Required"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.2}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

from typing import Dict, List
from app.models.schemas import (
    GapAnalysisResult,
    MissingSkill,
    ProficiencyLevel,
    SkillPriority
)

PROFICIENCY_SCORE = {
    "Beginner": 0.5,
    "Intermediate": 1.0,
    "Advanced": 1.0,
    "Expert": 1.0
}

PRIORITY_WEIGHT = {
    "must-have": 2.0,
    "nice-to-have": 1.0
}

def perform_gap_analysis(
    candidate_skills: Dict[str, ProficiencyLevel],
    required_skills: Dict[str, SkillPriority]
) -> GapAnalysisResult:
    # Normalize skill keys to lower case for reliable matching
    normalized_candidate = {k.strip().lower(): (k, v) for k, v in candidate_skills.items()}

    total_weight = 0.0
    earned_weight = 0.0

    matched_skills: List[str] = []
    missing_skills: List[MissingSkill] = []
    strengths: List[str] = []
    weaknesses: List[str] = []

    # Check candidate skills for general strengths (Advanced/Expert)
    for skill_name, prof in candidate_skills.items():
        if prof in ("Advanced", "Expert"):
            if skill_name not in strengths:
                strengths.append(f"{skill_name} ({prof})")

    for req_skill, priority in required_skills.items():
        weight = PRIORITY_WEIGHT.get(priority, 1.0)
        total_weight += weight

        norm_req = req_skill.strip().lower()
        if norm_req in normalized_candidate:
            orig_name, prof = normalized_candidate[norm_req]
            multiplier = PROFICIENCY_SCORE.get(prof, 0.5)
            earned_weight += weight * multiplier
            matched_skills.append(f"{orig_name} ({prof})")
        else:
            missing_skills.append(MissingSkill(skill=req_skill, priority=priority))
            weaknesses.append(f"Missing {priority} skill: {req_skill}")

    match_score = round((earned_weight / total_weight * 100.0), 1) if total_weight > 0 else 100.0

    if match_score >= 85:
        overall_readiness = "Job Ready"
    elif match_score >= 70:
        overall_readiness = "Highly Qualified"
    elif match_score >= 50:
        overall_readiness = "Developing Competency"
    else:
        overall_readiness = "Needs Foundation"

    return GapAnalysisResult(
        match_score=match_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        strengths=strengths,
        weaknesses=weaknesses,
        overall_readiness=overall_readiness
    )

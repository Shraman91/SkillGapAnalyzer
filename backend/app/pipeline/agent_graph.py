import json
import logging
from typing import Dict, List, Optional, Any, TypedDict
from langgraph.graph import StateGraph, START, END

from app.models.schemas import (
    ProficiencyLevel,
    SkillPriority,
    MissingSkill,
    GapAnalysisResult,
    TopicRoadmap,
    RecommendedProject,
    InterviewQuestion
)
from app.services import gemini_service, gap_analysis
from app.api.endpoints.roles import MOCK_ROLES

logger = logging.getLogger(__name__)

class SkillGapState(TypedDict, total=False):
    # Inputs
    resume_text: Optional[str]
    manual_skills: Optional[Dict[str, ProficiencyLevel]]
    job_description: Optional[str]
    role_id: Optional[str]
    user_id: Optional[str]

    # Intermediate / Outputs
    role_title: str
    candidate_skills: Dict[str, ProficiencyLevel]
    required_skills: Dict[str, SkillPriority]
    gap_analysis: GapAnalysisResult
    roadmaps: List[TopicRoadmap]
    projects: List[RecommendedProject]
    interview_prep: List[InterviewQuestion]


def intake_agent(state: SkillGapState) -> Dict[str, Any]:
    """
    1. intake_agent — parse resume text/PDF or manual skill list into
       {skill: proficiency_level} JSON
    """
    logger.info("Executing intake_agent...")
    if state.get("manual_skills"):
        return {"candidate_skills": state["manual_skills"]}

    resume_text = state.get("resume_text", "")
    if resume_text:
        skills = gemini_service.parse_resume_skills(resume_text)
        return {"candidate_skills": skills}

    return {"candidate_skills": gemini_service.MOCK_CANDIDATE_SKILLS}


def target_agent(state: SkillGapState) -> Dict[str, Any]:
    """
    2. target_agent — parse a pasted job description OR a selected predefined role
       into {skill: priority (must-have/nice-to-have)} JSON.
    """
    logger.info("Executing target_agent...")
    job_description = state.get("job_description")
    role_id = state.get("role_id")

    if job_description:
        skills = gemini_service.parse_job_description_skills(job_description)
        return {
            "required_skills": skills,
            "role_title": "Target Role"
        }
    elif role_id:
        role = next((r for r in MOCK_ROLES if r.role_id == role_id), None)
        if role:
            return {
                "required_skills": role.required_skills,
                "role_title": role.role_name
            }

    return {
        "required_skills": gemini_service.MOCK_REQUIRED_SKILLS,
        "role_title": "Software Engineer"
    }


def gap_analysis_agent(state: SkillGapState) -> Dict[str, Any]:
    """
    3. gap_analysis_agent — deterministic diff: match %, missing skills grouped
       by priority, matched skills, strengths/weaknesses, overall readiness score.
       Deterministic Python calculation, never LLM guessed.
    """
    logger.info("Executing gap_analysis_agent...")
    candidate_skills = state.get("candidate_skills", {})
    required_skills = state.get("required_skills", {})

    result = gap_analysis.perform_gap_analysis(candidate_skills, required_skills)
    return {"gap_analysis": result}


def roadmap_agent(state: SkillGapState) -> Dict[str, Any]:
    """
    4. roadmap_agent — for each missing skill, generate a structured roadmap:
       4 chapters (Foundations, Core Concepts, Applied Practice, Mastery),
       each with 2-4 units, each unit with 2-3 external resources.
    """
    logger.info("Executing roadmap_agent...")
    gap_result: GapAnalysisResult = state.get("gap_analysis")
    missing_skills = [m.skill for m in gap_result.missing_skills] if gap_result else []

    roadmaps = gemini_service.generate_roadmap(missing_skills)
    return {"roadmaps": roadmaps}


def project_recommender_agent(state: SkillGapState) -> Dict[str, Any]:
    """
    5. project_recommender_agent — 2-3 buildable project ideas per missing skill,
       with description and difficulty level.
    """
    logger.info("Executing project_recommender_agent...")
    gap_result: GapAnalysisResult = state.get("gap_analysis")
    missing_skills = [m.skill for m in gap_result.missing_skills] if gap_result else []

    projects = gemini_service.generate_projects(missing_skills)
    return {"projects": projects}


def interview_prep_agent(state: SkillGapState) -> Dict[str, Any]:
    """
    6. interview_prep_agent — 5-8 technical + a few HR-style questions for the
       target role, only runs once match_score > 70%.
    """
    logger.info("Executing interview_prep_agent...")
    role_title = state.get("role_title", "Software Engineer")
    candidate_skills = list(state.get("candidate_skills", {}).keys())
    gap_result: GapAnalysisResult = state.get("gap_analysis")
    missing_skills = [m.skill for m in gap_result.missing_skills] if gap_result else []

    questions = gemini_service.generate_interview_prep(
        role_title=role_title,
        candidate_skills=candidate_skills,
        missing_skills=missing_skills
    )
    return {"interview_prep": questions}


def should_run_interview_prep(state: SkillGapState) -> str:
    """Conditional router for interview prep: match_score > 70"""
    gap_result = state.get("gap_analysis")
    if gap_result and gap_result.match_score > 70:
        return "interview_prep_agent"
    return END


# Build the LangGraph StateGraph
def build_skill_gap_pipeline():
    workflow = StateGraph(SkillGapState)

    # Add Nodes
    workflow.add_node("intake_agent", intake_agent)
    workflow.add_node("target_agent", target_agent)
    workflow.add_node("gap_analysis_agent", gap_analysis_agent)
    workflow.add_node("roadmap_agent", roadmap_agent)
    workflow.add_node("project_recommender_agent", project_recommender_agent)
    workflow.add_node("interview_prep_agent", interview_prep_agent)

    # Parallel intake & target fan-in to gap_analysis_agent
    workflow.add_edge(START, "intake_agent")
    workflow.add_edge(START, "target_agent")
    workflow.add_edge("intake_agent", "gap_analysis_agent")
    workflow.add_edge("target_agent", "gap_analysis_agent")

    # From gap_analysis_agent -> roadmap_agent and project_recommender_agent
    workflow.add_edge("gap_analysis_agent", "roadmap_agent")
    workflow.add_edge("gap_analysis_agent", "project_recommender_agent")

    # Conditional edge for interview_prep_agent
    workflow.add_conditional_edges(
        "gap_analysis_agent",
        should_run_interview_prep,
        {
            "interview_prep_agent": "interview_prep_agent",
            END: END
        }
    )

    workflow.add_edge("roadmap_agent", END)
    workflow.add_edge("project_recommender_agent", END)
    workflow.add_edge("interview_prep_agent", END)

    return workflow.compile()

# Singleton compiled pipeline
skill_gap_graph = build_skill_gap_pipeline()

def run_skill_gap_pipeline(
    resume_text: Optional[str] = None,
    manual_skills: Optional[Dict[str, ProficiencyLevel]] = None,
    job_description: Optional[str] = None,
    role_id: Optional[str] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Execute the full LangGraph pipeline"""
    initial_state: SkillGapState = {
        "resume_text": resume_text,
        "manual_skills": manual_skills,
        "job_description": job_description,
        "role_id": role_id,
        "user_id": user_id,
        "interview_prep": []
    }

    final_state = skill_gap_graph.invoke(initial_state)
    return final_state

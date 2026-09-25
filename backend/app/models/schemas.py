from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal, Any

# Common / Skill Level
ProficiencyLevel = Literal["Beginner", "Intermediate", "Advanced", "Expert"]
SkillPriority = Literal["must-have", "nice-to-have"]

# 1. Intake & Target
class CandidateSkill(BaseModel):
    skill: str
    proficiency_level: ProficiencyLevel = "Intermediate"

class TargetSkill(BaseModel):
    skill: str
    priority: SkillPriority = "must-have"

class IntakeOutput(BaseModel):
    skills: Dict[str, ProficiencyLevel]

class TargetOutput(BaseModel):
    skills: Dict[str, SkillPriority]

# 2. Gap Analysis
class MissingSkill(BaseModel):
    skill: str
    priority: SkillPriority

class GapAnalysisResult(BaseModel):
    match_score: float = Field(..., description="Overall match percentage (0-100)")
    matched_skills: List[str] = []
    missing_skills: List[MissingSkill] = []
    strengths: List[str] = []
    weaknesses: List[str] = []
    overall_readiness: str = "Developing"

# 3. Roadmap
class Resource(BaseModel):
    title: str
    url: str
    type: Literal["video", "article", "documentation", "course"]
    source: str
    est_minutes: int
    verified: bool = False

class Unit(BaseModel):
    unit_id: str
    unit_title: str
    summary: str
    resources: List[Resource] = []

class Chapter(BaseModel):
    chapter_number: int
    chapter_title: Literal["Foundations", "Core Concepts", "Applied Practice", "Mastery"]
    description: str
    units: List[Unit] = []

class TopicRoadmap(BaseModel):
    topic_id: str
    topic_name: str
    weakness_level: str
    chapters: List[Chapter] = []

# 4. Projects
class RecommendedProject(BaseModel):
    project_id: str
    skill: str
    title: str
    description: str
    difficulty: Literal["Beginner", "Intermediate", "Advanced"]

# 5. Interview Prep
class InterviewQuestion(BaseModel):
    q_id: str
    question: str
    category: Literal["Technical", "HR", "Behavioral", "System Design"]
    model_answer: str

# 6. Overall Analysis Output
class FullAnalysisResponse(BaseModel):
    analysis_id: str
    uid: Optional[str] = None
    timestamp: str
    role_title: Optional[str] = None
    candidate_skills: Dict[str, ProficiencyLevel]
    required_skills: Dict[str, SkillPriority]
    gap_analysis: GapAnalysisResult
    roadmaps: List[TopicRoadmap] = []
    projects: List[RecommendedProject] = []
    interview_prep: List[InterviewQuestion] = []

# 7. Progress Tracking
class ProgressUpdatePayload(BaseModel):
    unit_id: str
    completed: bool

class ProgressStatus(BaseModel):
    unit_id: str
    completed: bool
    completed_at: Optional[str] = None

# 8. Predefined Roles
class PredefinedRole(BaseModel):
    role_id: str
    role_name: str
    description: str
    required_skills: Dict[str, SkillPriority]

# 9. Job Search & Job Readiness
class JobListing(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    salary_range: Optional[str] = None
    description_snippet: str
    full_description: Optional[str] = None
    url: str
    posted_date: Optional[str] = None

class JobReadinessPerListing(BaseModel):
    job_id: str
    title: str
    company: str
    readiness_percentage: float
    matched_skills: List[str]
    missing_skills: List[str]

class ImprovementField(BaseModel):
    skill: str
    frequency_count: int
    demand_percentage: float

class JobMarketReadinessResponse(BaseModel):
    search_id: str
    uid: Optional[str] = None
    query: str
    location: str
    timestamp: str
    overall_readiness: float
    jobs_analyzed: List[JobReadinessPerListing]
    improvement_fields: List[ImprovementField]

# Request Schemas
class AnalyzeRequest(BaseModel):
    resume_text: Optional[str] = None
    manual_skills: Optional[Dict[str, ProficiencyLevel]] = None
    job_description: Optional[str] = None
    role_id: Optional[str] = None

class JobReadinessRequest(BaseModel):
    job_ids: List[str]
    query: str
    location: str
    candidate_skills: Optional[Dict[str, ProficiencyLevel]] = None

class ResumeParseRequest(BaseModel):
    resume_text: str

class AuthVerifyRequest(BaseModel):
    id_token: str

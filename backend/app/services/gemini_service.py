import json
import logging
from typing import Dict, List, Optional
from google import genai
from google.genai import types

from app.core.config import settings
from app.models.schemas import (
    ProficiencyLevel,
    SkillPriority,
    TopicRoadmap,
    Chapter,
    Unit,
    Resource,
    RecommendedProject,
    InterviewQuestion
)

logger = logging.getLogger(__name__)

def get_client() -> Optional[genai.Client]:
    if settings.GEMINI_API_KEY:
        try:
            return genai.Client(api_key=settings.GEMINI_API_KEY)
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
    return None

# MOCK DATA HELPERS FOR FALLBACK & OFFLINE TESTING

MOCK_CANDIDATE_SKILLS: Dict[str, ProficiencyLevel] = {
    "Python": "Intermediate",
    "JavaScript": "Advanced",
    "HTML/CSS": "Advanced",
    "Git": "Intermediate",
    "SQL": "Beginner"
}

MOCK_REQUIRED_SKILLS: Dict[str, SkillPriority] = {
    "Python": "must-have",
    "FastAPI": "must-have",
    "Docker": "must-have",
    "React": "nice-to-have",
    "PostgreSQL": "must-have",
    "Git": "nice-to-have"
}

def parse_resume_skills(resume_text: str) -> Dict[str, ProficiencyLevel]:
    client = get_client()
    if not client or settings.USE_MOCK_DATA:
        logger.info("Using mock parse_resume_skills")
        return MOCK_CANDIDATE_SKILLS

    prompt = f"""
    Analyze the following resume text and extract all technical skills along with estimated proficiency level.
    Allowed proficiency levels: "Beginner", "Intermediate", "Advanced", "Expert".
    Return ONLY a JSON object mapping skill names to their proficiency level.
    Example: {{"Python": "Intermediate", "React": "Advanced"}}

    Resume:
    {resume_text}
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        data = json.loads(response.text)
        return data
    except Exception as e:
        logger.error(f"Gemini resume parsing failed: {e}")
        return MOCK_CANDIDATE_SKILLS

def parse_job_description_skills(job_desc: str) -> Dict[str, SkillPriority]:
    client = get_client()
    if not client or settings.USE_MOCK_DATA:
        logger.info("Using mock parse_job_description_skills")
        return MOCK_REQUIRED_SKILLS

    prompt = f"""
    Analyze the following job description and extract key required skills along with priority.
    Allowed priority values: "must-have", "nice-to-have".
    Return ONLY a JSON object mapping skill names to priority.
    Example: {{"Python": "must-have", "Docker": "must-have", "AWS": "nice-to-have"}}

    Job Description:
    {job_desc}
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        data = json.loads(response.text)
        return data
    except Exception as e:
        logger.error(f"Gemini job description parsing failed: {e}")
        return MOCK_REQUIRED_SKILLS

def generate_roadmap(missing_skills: List[str]) -> List[TopicRoadmap]:
    if not missing_skills:
        return []

    client = get_client()
    if not client or settings.USE_MOCK_DATA:
        logger.info("Using mock generate_roadmap")
        return _mock_roadmap(missing_skills)

    prompt = f"""
    Create a structured learning roadmap for each of the following missing skills: {json.dumps(missing_skills)}.
    For each missing skill, generate exactly 4 chapters in sequence:
    1. "Foundations"
    2. "Core Concepts"
    3. "Applied Practice"
    4. "Mastery"

    Each chapter must have 2 to 3 units.
    Each unit must have 2 to 3 external learning resources (title, url, type: "video" or "article" or "documentation", source, est_minutes). If you don't know a guaranteed real URL, provide a clean canonical documentation/tutorial link or youtube query link and set "verified": false.

    Return JSON array of TopicRoadmap matching schema:
    [
      {{
        "topic_id": "skill-slug",
        "topic_name": "Skill Name",
        "weakness_level": "High Priority",
        "chapters": [
          {{
            "chapter_number": 1,
            "chapter_title": "Foundations",
            "description": "...",
            "units": [
              {{
                "unit_id": "skill-c1-u1",
                "unit_title": "...",
                "summary": "...",
                "resources": [
                  {{
                    "title": "...",
                    "url": "https://...",
                    "type": "video",
                    "source": "YouTube",
                    "est_minutes": 15,
                    "verified": false
                  }}
                ]
              }}
            ]
          }}
        ]
      }}
    ]
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        raw_list = json.loads(response.text)
        roadmaps = [TopicRoadmap(**item) for item in raw_list]
        return roadmaps
    except Exception as e:
        logger.error(f"Gemini roadmap generation failed: {e}")
        return _mock_roadmap(missing_skills)

def generate_projects(missing_skills: List[str]) -> List[RecommendedProject]:
    if not missing_skills:
        return []

    client = get_client()
    if not client or settings.USE_MOCK_DATA:
        logger.info("Using mock generate_projects")
        return _mock_projects(missing_skills)

    prompt = f"""
    For each missing skill in {json.dumps(missing_skills)}, generate 2 buildable portfolio project ideas suitable for a student.
    Return JSON array of items matching schema:
    [
      {{
        "project_id": "proj-1",
        "skill": "Docker",
        "title": "Containerized Microservices Environment",
        "description": "Build a multi-container setup with Docker Compose featuring FastAPI and Redis.",
        "difficulty": "Intermediate"
      }}
    ]
    Allowed difficulties: "Beginner", "Intermediate", "Advanced".
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        raw_list = json.loads(response.text)
        return [RecommendedProject(**item) for item in raw_list]
    except Exception as e:
        logger.error(f"Gemini project generation failed: {e}")
        return _mock_projects(missing_skills)

def generate_interview_prep(role_title: str, candidate_skills: List[str], missing_skills: List[str]) -> List[InterviewQuestion]:
    client = get_client()
    if not client or settings.USE_MOCK_DATA:
        logger.info("Using mock generate_interview_prep")
        return _mock_interview_prep(role_title)

    prompt = f"""
    Generate 6 technical interview questions and 2 behavioral HR-style questions for the role: '{role_title}'.
    Target questions around candidate strengths ({json.dumps(candidate_skills)}) and gaps ({json.dumps(missing_skills)}).
    Provide comprehensive model answers for each.

    Return JSON array of items:
    [
      {{
        "q_id": "q-1",
        "question": "Explain how FastAPI async route handlers handle concurrency.",
        "category": "Technical",
        "model_answer": "FastAPI leverages Python's asyncio..."
      }}
    ]
    Allowed categories: "Technical", "HR", "Behavioral", "System Design".
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        raw_list = json.loads(response.text)
        return [InterviewQuestion(**item) for item in raw_list]
    except Exception as e:
        logger.error(f"Gemini interview prep failed: {e}")
        return _mock_interview_prep(role_title)


# MOCK DATA CREATION UTILITIES

def _mock_roadmap(missing_skills: List[str]) -> List[TopicRoadmap]:
    result = []
    for skill in missing_skills:
        slug = skill.lower().replace(" ", "-").replace("/", "-")
        chapters = [
            Chapter(
                chapter_number=1,
                chapter_title="Foundations",
                description=f"Core intro to {skill} fundamentals.",
                units=[
                    Unit(
                        unit_id=f"{slug}-1-1",
                        unit_title=f"Introduction to {skill}",
                        summary=f"Understand the basic concept and setup of {skill}.",
                        resources=[
                            Resource(
                                title=f"{skill} Crash Course for Beginners",
                                url=f"https://www.youtube.com/results?search_query={skill}+crash+course",
                                type="video",
                                source="YouTube",
                                est_minutes=25,
                                verified=False
                            ),
                            Resource(
                                title=f"Official {skill} Documentation",
                                url=f"https://www.google.com/search?q={skill}+official+documentation",
                                type="documentation",
                                source="Official Docs",
                                est_minutes=15,
                                verified=False
                            )
                        ]
                    )
                ]
            ),
            Chapter(
                chapter_number=2,
                chapter_title="Core Concepts",
                description=f"Deep dive into syntax and mechanics of {skill}.",
                units=[
                    Unit(
                        unit_id=f"{slug}-2-1",
                        unit_title=f"Architecture & Key Patterns in {skill}",
                        summary=f"Learn essential patterns used in production with {skill}.",
                        resources=[
                            Resource(
                                title=f"Mastering {skill} Core API",
                                url=f"https://dev.to/search?q={skill}",
                                type="article",
                                source="Dev.to",
                                est_minutes=20,
                                verified=False
                            )
                        ]
                    )
                ]
            ),
            Chapter(
                chapter_number=3,
                chapter_title="Applied Practice",
                description=f"Hands-on exercises and project integration with {skill}.",
                units=[
                    Unit(
                        unit_id=f"{slug}-3-1",
                        unit_title=f"Building a Small Application with {skill}",
                        summary=f"Hands-on lab creating a functional project.",
                        resources=[
                            Resource(
                                title=f"Practical {skill} Tutorial",
                                url=f"https://medium.com/search?q={skill}+tutorial",
                                type="article",
                                source="Medium",
                                est_minutes=45,
                                verified=False
                            )
                        ]
                    )
                ]
            ),
            Chapter(
                chapter_number=4,
                chapter_title="Mastery",
                description=f"Advanced optimization, security, and edge cases in {skill}.",
                units=[
                    Unit(
                        unit_id=f"{slug}-4-1",
                        unit_title=f"Performance Tuning & Advanced {skill}",
                        summary=f"Best practices for scalability and production readiness.",
                        resources=[
                            Resource(
                                title=f"Production-Grade {skill} Guide",
                                url=f"https://github.com/search?q={skill}+awesome",
                                type="article",
                                source="GitHub",
                                est_minutes=30,
                                verified=False
                            )
                        ]
                    )
                ]
            )
        ]
        result.append(
            TopicRoadmap(
                topic_id=slug,
                topic_name=skill,
                weakness_level="High Priority",
                chapters=chapters
            )
        )
    return result

def _mock_projects(missing_skills: List[str]) -> List[RecommendedProject]:
    projects = []
    for idx, skill in enumerate(missing_skills):
        projects.append(
            RecommendedProject(
                project_id=f"proj-{idx*2+1}",
                skill=skill,
                title=f"Hands-on {skill} Dashboard",
                description=f"Build an interactive web application that integrates {skill} into a real-world pipeline.",
                difficulty="Intermediate"
            )
        )
        projects.append(
            RecommendedProject(
                project_id=f"proj-{idx*2+2}",
                skill=skill,
                title=f"{skill} Microservice Starter",
                description=f"Develop a containerized API or automated script showcasing high-performance utilization of {skill}.",
                difficulty="Advanced"
            )
        )
    return projects

def _mock_interview_prep(role_title: str) -> List[InterviewQuestion]:
    return [
        InterviewQuestion(
            q_id="q-1",
            question=f"What are the key architectural principles you follow when building for a {role_title} role?",
            category="Technical",
            model_answer="Focus on modularity, clear separation of concerns, defensive programming, robust error logging, and writing testable code."
        ),
        InterviewQuestion(
            q_id="q-2",
            question="Describe a challenging technical obstacle you faced and how you debugged it.",
            category="Behavioral",
            model_answer="Structured response using STAR method: Situation, Task, Action, and Measurable Result."
        ),
        InterviewQuestion(
            q_id="q-3",
            question="How do you handle trade-offs between speed of delivery and code quality?",
            category="HR",
            model_answer="I prioritize core functionality while writing clean interfaces, documenting technical debt, and planning iterative refactoring."
        ),
        InterviewQuestion(
            q_id="q-4",
            question="Explain the difference between synchronous and asynchronous processing in backend services.",
            category="Technical",
            model_answer="Synchronous code blocks execution until task completion. Asynchronous non-blocking models handle concurrent I/O efficiently."
        ),
        InterviewQuestion(
            q_id="q-5",
            question="How would you design a scalable web application with high traffic throughput?",
            category="System Design",
            model_answer="Use horizontal scaling, load balancers, caching layers (Redis), database indexing, and asynchronous queue workers."
        )
    ]

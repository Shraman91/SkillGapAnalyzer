import json
import logging
import urllib.request
import urllib.parse
from typing import List, Dict, Optional
from google import genai
from google.genai import types

from app.core.config import settings
from app.models.schemas import (
    JobListing,
    JobMarketReadinessResponse,
    JobReadinessPerListing,
    ImprovementField,
    ProficiencyLevel,
    SkillPriority
)

logger = logging.getLogger(__name__)

# Sample Mock Job Listings for Offline/Fallback
MOCK_JOBS: List[JobListing] = [
    JobListing(
        job_id="adzuna-101",
        title="Full Stack Python / React Developer",
        company="TechCorp Solutions",
        location="Bengaluru, India",
        salary_range="₹8,00,000 - ₹12,00,000",
        description_snippet="Looking for a Python Developer with FastAPI, React, PostgreSQL, Docker, and AWS experience.",
        full_description="We are seeking a talented Full Stack Developer. Key requirements: Python 3.10+, FastAPI framework, PostgreSQL database design, Docker containerization, React.js frontend development, and Git version control. Experience with AWS or CI/CD pipelines is a strong plus.",
        url="https://www.adzuna.in",
        posted_date="2026-09-20"
    ),
    JobListing(
        job_id="adzuna-102",
        title="Backend Software Engineer - Python & FastAPI",
        company="DataFlow Systems",
        location="Remote (India)",
        salary_range="₹10,00,000 - ₹15,00,000",
        description_snippet="Backend engineer required. Stack: Python, FastAPI, Docker, Kubernetes, Redis, SQL, and Microservices.",
        full_description="Responsibilities include designing RESTful APIs with FastAPI and Python. Must have expertise in Docker, Kubernetes, Redis caching, PostgreSQL, SQL optimization, and unit testing. Experience with GCP or AWS is preferred.",
        url="https://www.adzuna.in",
        posted_date="2026-09-22"
    ),
    JobListing(
        job_id="adzuna-103",
        title="Junior AI / Full Stack Engineer",
        company="Innovate AI Labs",
        location="Hyderabad, India",
        salary_range="₹6,00,000 - ₹9,00,000",
        description_snippet="Join our AI engineering team! Python, Next.js, LangChain/LangGraph, Tailwind CSS, SQL required.",
        full_description="Ideal candidate possesses solid Python foundation, knowledge of LLM frameworks like LangGraph or LangChain, React or Next.js frontend capabilities, CSS/Tailwind styling, and basic SQL knowledge.",
        url="https://www.adzuna.in",
        posted_date="2026-09-21"
    )
]

def search_adzuna_jobs(query: str, location: str, country: str = "in", page: int = 1) -> List[JobListing]:
    if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
        logger.info("Adzuna API keys missing, using mock listings.")
        return MOCK_JOBS

    try:
        query_params = {
            "app_id": settings.ADZUNA_APP_ID,
            "app_key": settings.ADZUNA_APP_KEY,
            "results_per_page": 10,
            "what": query,
            "where": location
        }
        encoded = urllib.parse.urlencode(query_params)
        url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}?{encoded}"

        req = urllib.request.Request(url, headers={"User-Agent": "SkillGapAnalyzer/1.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                results = data.get("results", [])
                listings = []
                for item in results:
                    salary_min = item.get("salary_min")
                    salary_max = item.get("salary_max")
                    sal_str = None
                    if salary_min and salary_max:
                        sal_str = f"₹{int(salary_min):,} - ₹{int(salary_max):,}"

                    listings.append(
                        JobListing(
                            job_id=str(item.get("id", "")),
                            title=item.get("title", ""),
                            company=item.get("company", {}).get("display_name", "Unknown"),
                            location=item.get("location", {}).get("display_name", location),
                            salary_range=sal_str,
                            description_snippet=item.get("description", "")[:200] + "...",
                            full_description=item.get("description", ""),
                            url=item.get("redirect_url", "https://www.adzuna.in"),
                            posted_date=item.get("created", "")[:10]
                        )
                    )
                return listings if listings else MOCK_JOBS
    except Exception as e:
        logger.error(f"Error querying Adzuna API: {e}")

    return MOCK_JOBS


def analyze_job_market_readiness(
    selected_jobs: List[JobListing],
    candidate_skills: Dict[str, ProficiencyLevel],
    query: str,
    location: str,
    search_id: str,
    uid: Optional[str] = None
) -> JobMarketReadinessResponse:
    norm_candidate = {k.strip().lower(): v for k, v in candidate_skills.items()}

    all_missing_skills: Dict[str, int] = {}
    job_readiness_list: List[JobReadinessPerListing] = []
    total_readiness = 0.0

    # Initialize Gemini client if available
    client = None
    if settings.GEMINI_API_KEY and not settings.USE_MOCK_DATA:
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
        except Exception:
            pass

    for job in selected_jobs:
        job_text = job.full_description or job.description_snippet
        req_skills: List[str] = []

        if client:
            try:
                prompt = f"Extract required technical skills from this job description as a JSON list of strings:\n{job_text}"
                resp = client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
                req_skills = json.loads(resp.text)
            except Exception as e:
                logger.error(f"Failed to extract skills via Gemini for job {job.job_id}: {e}")

        if not req_skills:
            # Simple keyword matching fallback
            keywords = ["Python", "FastAPI", "Docker", "React", "PostgreSQL", "JavaScript", "SQL", "Git", "AWS", "Redis", "Next.js", "Tailwind CSS", "LangGraph"]
            req_skills = [kw for kw in keywords if kw.lower() in job_text.lower()]

        matched = []
        missing = []
        for s in req_skills:
            if s.strip().lower() in norm_candidate:
                matched.append(s)
            else:
                missing.append(s)
                all_missing_skills[s] = all_missing_skills.get(s, 0) + 1

        per_job_score = round((len(matched) / len(req_skills) * 100.0), 1) if req_skills else 100.0
        total_readiness += per_job_score

        job_readiness_list.append(
            JobReadinessPerListing(
                job_id=job.job_id,
                title=job.title,
                company=job.company,
                readiness_percentage=per_job_score,
                matched_skills=matched,
                missing_skills=missing
            )
        )

    num_jobs = len(selected_jobs) if selected_jobs else 1
    overall_readiness = round(total_readiness / num_jobs, 1)

    # Sort missing skills by frequency across listings
    improvement_fields = []
    for skill_name, count in sorted(all_missing_skills.items(), key=lambda x: x[1], reverse=True):
        demand_pct = round((count / num_jobs) * 100.0, 1)
        improvement_fields.append(
            ImprovementField(
                skill=skill_name,
                frequency_count=count,
                demand_percentage=demand_pct
            )
        )

    import datetime
    return JobMarketReadinessResponse(
        search_id=search_id,
        uid=uid,
        query=query,
        location=location,
        timestamp=datetime.datetime.utcnow().isoformat(),
        overall_readiness=overall_readiness,
        jobs_analyzed=job_readiness_list,
        improvement_fields=improvement_fields
    )

import logging
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends

from app.models.schemas import JobListing, JobMarketReadinessResponse, JobReadinessRequest
from app.services import adzuna_service, gemini_service
from app.core.firebase import save_job_search_to_firestore
from app.api.deps import get_optional_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/search", response_model=List[JobListing])
def search_jobs(
    query: str = Query(..., description="Job search query (e.g., Python Developer)"),
    location: str = Query(..., description="Location to search in"),
    country: str = Query("in", description="Country code (e.g., gb, us, in)"),
    page: int = Query(1, description="Page number")
):
    """Proxy to Adzuna Jobs API, returns normalized job listings."""
    try:
        listings = adzuna_service.search_adzuna_jobs(
            query=query, location=location, country=country, page=page
        )
        return listings
    except Exception as e:
        logger.error(f"Job search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/readiness", response_model=JobMarketReadinessResponse)
def evaluate_job_readiness(
    payload: JobReadinessRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    Runs job_market_agent on selected job IDs:
    - Fetches job descriptions
    - Extracts required skills per listing (via Gemini or keyword fallback)
    - Deterministic diff against user's candidate_skills
    - Returns overall readiness %, per-listing readiness, improvement_fields
    - Stores result under job_searches/{searchId} in Firestore
    """
    try:
        # Re-fetch jobs from Adzuna to get full descriptions
        all_jobs = adzuna_service.search_adzuna_jobs(
            query=payload.query, location=payload.location
        )
        selected_jobs = [j for j in all_jobs if j.job_id in payload.job_ids]

        if not selected_jobs:
            raise HTTPException(
                status_code=404,
                detail="No matching jobs found for the given IDs."
            )

        candidate_skills = payload.candidate_skills or gemini_service.MOCK_CANDIDATE_SKILLS
        search_id = str(uuid.uuid4())
        uid = current_user.get("uid") if current_user else None

        result = adzuna_service.analyze_job_market_readiness(
            selected_jobs=selected_jobs,
            candidate_skills=candidate_skills,
            query=payload.query,
            location=payload.location,
            search_id=search_id,
            uid=uid
        )

        # Persist to Firestore
        try:
            save_job_search_to_firestore(result.model_dump(), uid=uid)
        except Exception as e:
            logger.error(f"Failed to persist job search to Firestore: {e}")

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job readiness analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

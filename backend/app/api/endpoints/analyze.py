import uuid
import datetime
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header

from app.models.schemas import (
    AnalyzeRequest,
    FullAnalysisResponse,
    ProgressUpdatePayload,
    ProgressStatus
)
from app.pipeline.agent_graph import run_skill_gap_pipeline
from app.core.firebase import (
    save_analysis_to_firestore,
    get_analysis_from_firestore,
    list_user_analyses_from_firestore,
    update_unit_progress_in_firestore
)
from app.api.deps import get_optional_user, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=FullAnalysisResponse)
def analyze_skill_gap(
    payload: AnalyzeRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    Runs the full LangGraph agent pipeline:
    intake -> target -> gap_analysis -> roadmap -> project_recommender -> interview_prep
    Writes result to Firestore and returns full analysis response.
    """
    if not payload.resume_text and not payload.manual_skills:
        raise HTTPException(status_code=400, detail="Either resume_text or manual_skills is required.")

    if not payload.job_description and not payload.role_id:
        raise HTTPException(status_code=400, detail="Either job_description or role_id is required.")

    uid = current_user.get("uid") if current_user else None

    # Run LangGraph pipeline
    try:
        final_state = run_skill_gap_pipeline(
            resume_text=payload.resume_text,
            manual_skills=payload.manual_skills,
            job_description=payload.job_description,
            role_id=payload.role_id,
            user_id=uid
        )
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

    analysis_id = str(uuid.uuid4())
    now_iso = datetime.datetime.utcnow().isoformat()

    full_response = FullAnalysisResponse(
        analysis_id=analysis_id,
        uid=uid,
        timestamp=now_iso,
        role_title=final_state.get("role_title", "Custom Role"),
        candidate_skills=final_state.get("candidate_skills", {}),
        required_skills=final_state.get("required_skills", {}),
        gap_analysis=final_state.get("gap_analysis"),
        roadmaps=final_state.get("roadmaps", []),
        projects=final_state.get("projects", []),
        interview_prep=final_state.get("interview_prep", [])
    )

    # Save to Firestore (or in-memory store)
    try:
        save_analysis_to_firestore(full_response.model_dump(), uid=uid)
    except Exception as e:
        logger.error(f"Failed to persist analysis to Firestore: {e}")

    return full_response


@router.get("/list", response_model=List[Dict[str, Any]])
def list_analyses(current_user: Dict[str, Any] = Depends(get_current_user)):
    """List all past analyses for the authenticated user."""
    uid = current_user.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="User ID required")

    return list_user_analyses_from_firestore(uid)


@router.get("/{analysis_id}")
def get_analysis_detail(
    analysis_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    Fetch full analysis by ID including roadmaps, projects, interview questions,
    and progress status. Supports shareable public access or user-specific lookup.
    """
    data = get_analysis_from_firestore(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    return data


@router.patch("/{analysis_id}/progress", response_model=ProgressStatus)
def update_unit_progress(
    analysis_id: str,
    payload: ProgressUpdatePayload,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    Update completion state for a unit within a roadmap.
    Persists to Firestore analyses/{analysis_id}/progress/{unit_id}.
    """
    res = update_unit_progress_in_firestore(
        analysis_id=analysis_id,
        unit_id=payload.unit_id,
        completed=payload.completed
    )
    return ProgressStatus(**res)

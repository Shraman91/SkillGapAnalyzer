import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.services.gemini_service import generate_chat_response

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================
# REQUEST MODEL
# ============================================================

class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
    )

    # Target career role
    target_role: Optional[str] = None

    # Skills the user currently has
    candidate_skills: List[str] = Field(
        default_factory=list
    )

    # Skills the user is missing
    missing_skills: List[str] = Field(
        default_factory=list
    )

    # Current readiness percentage
    readiness_score: Optional[float] = None


# ============================================================
# RESPONSE MODEL
# ============================================================

class ChatResponse(BaseModel):
    response: str


# ============================================================
# CHAT ENDPOINT
# ============================================================

@router.post(
    "/",
    response_model=ChatResponse,
)
def chat_with_skill_assistant(
    payload: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Personalized Skill Gap Assistant.

    The frontend sends:
    - user's question/message
    - target role
    - current skills
    - missing skills
    - readiness score

    The backend sends this information to Gemini and
    returns personalized career and learning advice.
    """

    # --------------------------------------------------------
    # Authentication
    # --------------------------------------------------------

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    # --------------------------------------------------------
    # Validate message
    # --------------------------------------------------------

    message = payload.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    # --------------------------------------------------------
    # Generate Gemini response
    # --------------------------------------------------------

    try:
        response = generate_chat_response(
            message=message,
            target_role=payload.target_role,
            candidate_skills=payload.candidate_skills,
            missing_skills=payload.missing_skills,
            readiness_score=payload.readiness_score,
        )

        if not response:
            raise HTTPException(
                status_code=500,
                detail="Gemini returned an empty response.",
            )

        return ChatResponse(
            response=response
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.exception(
            "Chatbot request failed: %s",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to generate chatbot response.",
        )
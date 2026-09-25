import io
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File
from pypdf import PdfReader

from app.models.schemas import ResumeParseRequest, IntakeOutput
from app.services import gemini_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/parse", response_model=IntakeOutput)
def parse_resume_text(payload: ResumeParseRequest):
    """Extract skills from raw resume text."""
    try:
        skills_map = gemini_service.parse_resume_skills(payload.resume_text)
        return IntakeOutput(skills=skills_map)
    except Exception as e:
        logger.error(f"Error parsing resume text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-pdf")
async def upload_resume_pdf(file: UploadFile = File(...)):
    """Upload PDF resume file, extract text, and extract skills map."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        content = await file.read()
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)

        extracted_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the uploaded PDF.")

        skills_map = gemini_service.parse_resume_skills(extracted_text)

        return {
            "filename": file.filename,
            "text": extracted_text[:1500],  # snippet for preview
            "skills": skills_map
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading PDF resume: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.firebase import init_firebase
from app.api.endpoints import analyze, auth, jobs, roles, resume, chat

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered skill gap analysis with LangGraph + Gemini + Firebase.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Firebase...")
    init_firebase()
    logger.info("Startup complete.")


# Routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["auth"]
)

app.include_router(
    analyze.router,
    prefix=f"{settings.API_V1_STR}/analyze",
    tags=["analyze"]
)

app.include_router(
    roles.router,
    prefix=f"{settings.API_V1_STR}/roles",
    tags=["roles"]
)

app.include_router(
    resume.router,
    prefix=f"{settings.API_V1_STR}/resume",
    tags=["resume"]
)

app.include_router(
    jobs.router,
    prefix=f"{settings.API_V1_STR}/jobs",
    tags=["jobs"]
)

# Chatbot router
app.include_router(
    chat.router,
    prefix=f"{settings.API_V1_STR}/chat",
    tags=["chat"]
)


@app.get("/", tags=["health"])
def root():
    return {
        "status": "online",
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/api/v1/openapi.json"
    }


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}
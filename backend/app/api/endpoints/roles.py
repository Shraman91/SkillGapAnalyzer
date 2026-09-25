from fastapi import APIRouter
from typing import List
from app.models.schemas import PredefinedRole, SkillPriority

router = APIRouter()

MOCK_ROLES: List[PredefinedRole] = [
    PredefinedRole(
        role_id="role-python-backend",
        role_name="Python Backend Developer (FastAPI)",
        description="Build scalable APIs and services using Python, FastAPI, and databases.",
        required_skills={
            "Python": "must-have",
            "FastAPI": "must-have",
            "PostgreSQL": "must-have",
            "Docker": "must-have",
            "Git": "must-have",
            "REST APIs": "must-have",
            "Redis": "nice-to-have",
            "AWS": "nice-to-have",
            "SQLAlchemy": "nice-to-have",
        }
    ),
    PredefinedRole(
        role_id="role-react-frontend",
        role_name="Frontend Engineer (React / Next.js)",
        description="Create interactive user interfaces with React, TypeScript, and modern tooling.",
        required_skills={
            "JavaScript": "must-have",
            "React": "must-have",
            "TypeScript": "must-have",
            "HTML/CSS": "must-have",
            "Git": "must-have",
            "Next.js": "nice-to-have",
            "Tailwind CSS": "nice-to-have",
            "Testing (Jest/Cypress)": "nice-to-have",
            "Figma/Design Systems": "nice-to-have",
        }
    ),
    PredefinedRole(
        role_id="role-devops",
        role_name="DevOps / Cloud Engineer",
        description="Manage infrastructure, CI/CD pipelines, and cloud deployments.",
        required_skills={
            "Linux": "must-have",
            "Docker": "must-have",
            "Kubernetes": "must-have",
            "AWS": "must-have",
            "Terraform": "must-have",
            "CI/CD Pipelines": "must-have",
            "Python": "nice-to-have",
            "Bash Scripting": "nice-to-have",
            "Grafana/Prometheus": "nice-to-have",
        }
    ),
    PredefinedRole(
        role_id="role-data-scientist",
        role_name="Data Scientist / ML Engineer",
        description="Build predictive models and data pipelines for business insights.",
        required_skills={
            "Python": "must-have",
            "Machine Learning": "must-have",
            "Pandas": "must-have",
            "NumPy": "must-have",
            "Scikit-learn": "must-have",
            "SQL": "must-have",
            "Statistics": "must-have",
            "TensorFlow or PyTorch": "nice-to-have",
            "Data Visualization": "nice-to-have",
            "Spark / Big Data": "nice-to-have",
        }
    ),
    PredefinedRole(
        role_id="role-fullstack",
        role_name="Full Stack Developer",
        description="Build end-to-end web applications across frontend and backend.",
        required_skills={
            "JavaScript": "must-have",
            "React": "must-have",
            "Node.js": "must-have",
            "Python": "nice-to-have",
            "PostgreSQL": "must-have",
            "HTML/CSS": "must-have",
            "Git": "must-have",
            "Docker": "nice-to-have",
            "REST APIs": "must-have",
            "TypeScript": "nice-to-have",
        }
    ),
    PredefinedRole(
        role_id="role-ai-engineer",
        role_name="AI/LLM Application Engineer",
        description="Build AI-powered applications using LLMs, vector databases, and agent frameworks.",
        required_skills={
            "Python": "must-have",
            "LLM APIs (OpenAI/Gemini)": "must-have",
            "LangChain or LangGraph": "must-have",
            "Prompt Engineering": "must-have",
            "Vector Databases": "must-have",
            "FastAPI": "must-have",
            "React or Next.js": "nice-to-have",
            "Docker": "nice-to-have",
            "Embeddings": "nice-to-have",
            "RAG Systems": "nice-to-have",
        }
    ),
    PredefinedRole(
        role_id="role-mobile-dev",
        role_name="Mobile App Developer (React Native)",
        description="Build cross-platform iOS and Android mobile apps with React Native.",
        required_skills={
            "JavaScript": "must-have",
            "React Native": "must-have",
            "TypeScript": "must-have",
            "REST APIs": "must-have",
            "Git": "must-have",
            "Mobile UX": "must-have",
            "Redux or Zustand": "nice-to-have",
            "Firebase": "nice-to-have",
            "Testing (Detox)": "nice-to-have",
        }
    ),
]

@router.get("/", response_model=List[PredefinedRole])
def list_predefined_roles():
    """Retrieve all predefined roles with required skill mappings. Public endpoint."""
    return MOCK_ROLES

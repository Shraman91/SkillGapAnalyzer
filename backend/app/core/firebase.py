import os
import datetime
import logging
from typing import Optional, Dict, Any, List
import firebase_admin
from firebase_admin import credentials, auth, firestore
from app.core.config import settings

logger = logging.getLogger(__name__)

_db = None
_firebase_initialized = False

def init_firebase():
    global _db, _firebase_initialized
    if _firebase_initialized:
        return _db

    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    if os.path.exists(cred_path):
        try:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _db = firestore.client()
            _firebase_initialized = True
            logger.info(f"Firebase initialized successfully using {cred_path}")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase with {cred_path}: {e}")
    else:
        logger.warning(f"Firebase credentials not found at {cred_path}. Operating in mock/in-memory mode.")
    return _db

def get_firestore_db():
    global _db
    if _db is None:
        init_firebase()
    return _db

# In-memory storage fallback when Firestore is not available
_IN_MEMORY_ANALYSES: Dict[str, Dict[str, Any]] = {}
_IN_MEMORY_PROGRESS: Dict[str, Dict[str, bool]] = {}
_IN_MEMORY_JOB_SEARCHES: Dict[str, Dict[str, Any]] = {}

def verify_token(id_token: str) -> Optional[Dict[str, Any]]:
    """Verifies Firebase ID token and returns decoded token or None."""
    try:
        if not id_token:
            return None
        decoded = auth.verify_id_token(id_token)
        return decoded
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        # If running in mock mode, return mock user
        if settings.USE_MOCK_DATA or not _firebase_initialized:
            return {
                "uid": "mock-user-123",
                "email": "demo.user@skillgap.ai",
                "name": "Demo Student"
            }
        return None

def save_analysis_to_firestore(analysis_data: Dict[str, Any], uid: Optional[str] = None) -> str:
    analysis_id = analysis_data.get("analysis_id")
    db = get_firestore_db()

    data_to_store = {
        "analysis_id": analysis_id,
        "uid": uid or analysis_data.get("uid"),
        "timestamp": analysis_data.get("timestamp", datetime.datetime.utcnow().isoformat()),
        "role_title": analysis_data.get("role_title"),
        "candidate_skills": analysis_data.get("candidate_skills", {}),
        "required_skills": analysis_data.get("required_skills", {}),
        "gap_analysis": analysis_data.get("gap_analysis", {}),
    }

    if db:
        try:
            analysis_ref = db.collection("analyses").document(analysis_id)
            analysis_ref.set(data_to_store)

            # Save roadmaps subcollection
            roadmaps = analysis_data.get("roadmaps", [])
            for r in roadmaps:
                topic_id = r.get("topic_id")
                if topic_id:
                    analysis_ref.collection("roadmap").document(topic_id).set(r)

            # Save projects subcollection
            projects = analysis_data.get("projects", [])
            for p in projects:
                p_id = p.get("project_id")
                if p_id:
                    analysis_ref.collection("projects").document(p_id).set(p)

            # Save interview_prep subcollection
            interview_prep = analysis_data.get("interview_prep", [])
            for q in interview_prep:
                q_id = q.get("q_id")
                if q_id:
                    analysis_ref.collection("interview_prep").document(q_id).set(q)

            logger.info(f"Analysis {analysis_id} saved to Firestore.")
            return analysis_id
        except Exception as e:
            logger.error(f"Firestore save_analysis error: {e}")

    # In-memory fallback
    full_copy = dict(analysis_data)
    full_copy["uid"] = uid or analysis_data.get("uid")
    _IN_MEMORY_ANALYSES[analysis_id] = full_copy
    return analysis_id

def get_analysis_from_firestore(analysis_id: str) -> Optional[Dict[str, Any]]:
    db = get_firestore_db()
    if db:
        try:
            analysis_ref = db.collection("analyses").document(analysis_id)
            doc = analysis_ref.get()
            if not doc.exists:
                return _IN_MEMORY_ANALYSES.get(analysis_id)

            data = doc.to_dict()

            # Fetch roadmaps
            roadmaps = []
            for r_doc in analysis_ref.collection("roadmap").stream():
                roadmaps.append(r_doc.to_dict())
            data["roadmaps"] = roadmaps

            # Fetch projects
            projects = []
            for p_doc in analysis_ref.collection("projects").stream():
                projects.append(p_doc.to_dict())
            data["projects"] = projects

            # Fetch interview_prep
            interview_prep = []
            for q_doc in analysis_ref.collection("interview_prep").stream():
                interview_prep.append(q_doc.to_dict())
            data["interview_prep"] = interview_prep

            # Fetch progress
            progress_map = {}
            for prog_doc in analysis_ref.collection("progress").stream():
                progress_map[prog_doc.id] = prog_doc.to_dict()
            data["progress"] = progress_map

            return data
        except Exception as e:
            logger.error(f"Firestore get_analysis error: {e}")

    return _IN_MEMORY_ANALYSES.get(analysis_id)

def list_user_analyses_from_firestore(uid: str) -> List[Dict[str, Any]]:
    db = get_firestore_db()
    analyses = []
    if db:
        try:
            docs = db.collection("analyses").where("uid", "==", uid).order_by("timestamp", direction=firestore.Query.DESCENDING).stream()
            for doc in docs:
                analyses.append(doc.to_dict())
            return analyses
        except Exception as e:
            logger.error(f"Firestore list_analyses error: {e}")
            # Try without order_by if indexing is pending
            try:
                docs = db.collection("analyses").where("uid", "==", uid).stream()
                for doc in docs:
                    analyses.append(doc.to_dict())
                analyses.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
                return analyses
            except Exception as e2:
                logger.error(f"Firestore list fallback error: {e2}")

    # Fallback to in-memory
    user_items = [v for k, v in _IN_MEMORY_ANALYSES.items() if v.get("uid") == uid]
    user_items.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return user_items

def update_unit_progress_in_firestore(analysis_id: str, unit_id: str, completed: bool) -> Dict[str, Any]:
    db = get_firestore_db()
    now_str = datetime.datetime.utcnow().isoformat()
    if db:
        try:
            analysis_ref = db.collection("analyses").document(analysis_id)
            progress_ref = analysis_ref.collection("progress").document(unit_id)
            progress_data = {
                "unit_id": unit_id,
                "completed": completed,
                "completed_at": now_str if completed else None
            }
            progress_ref.set(progress_data)
            return progress_data
        except Exception as e:
            logger.error(f"Firestore update_progress error: {e}")

    if analysis_id not in _IN_MEMORY_PROGRESS:
        _IN_MEMORY_PROGRESS[analysis_id] = {}
    _IN_MEMORY_PROGRESS[analysis_id][unit_id] = completed
    return {"unit_id": unit_id, "completed": completed, "completed_at": now_str if completed else None}

def get_all_unit_progress(analysis_id: str) -> Dict[str, bool]:
    db = get_firestore_db()
    progress = {}
    if db:
        try:
            analysis_ref = db.collection("analyses").document(analysis_id)
            for prog_doc in analysis_ref.collection("progress").stream():
                d = prog_doc.to_dict()
                progress[d.get("unit_id")] = d.get("completed", False)
            return progress
        except Exception as e:
            logger.error(f"Firestore get_all_progress error: {e}")

    return _IN_MEMORY_PROGRESS.get(analysis_id, {})

def save_job_search_to_firestore(search_data: Dict[str, Any], uid: Optional[str] = None) -> str:
    search_id = search_data.get("search_id")
    db = get_firestore_db()
    data_to_store = dict(search_data)
    data_to_store["uid"] = uid or search_data.get("uid")

    if db:
        try:
            db.collection("job_searches").document(search_id).set(data_to_store)
            return search_id
        except Exception as e:
            logger.error(f"Firestore save_job_search error: {e}")

    _IN_MEMORY_JOB_SEARCHES[search_id] = data_to_store
    return search_id
